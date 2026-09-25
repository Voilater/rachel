import { createHmac } from "node:crypto";
import {
  AdminConfirmSignUpCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  type AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";

import {
  createCredentialToken,
  writeCredentialCookie,
} from "@/server/credential-session";
import type { ClientUserDto } from "@/server/user-types";
import { findOrCreateOAuthUser } from "@/server/users.server";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in environment.`);
  return value;
}

function getClient() {
  return new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION ?? "ap-south-1",
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
}

function poolId() {
  return requireEnv("COGNITO_USER_POOL_ID");
}

function clientId() {
  return process.env.AUTH_COGNITO_ID ?? requireEnv("COGNITO_CLIENT_ID");
}

function clientSecret() {
  return process.env.AUTH_COGNITO_SECRET ?? requireEnv("COGNITO_CLIENT_SECRET");
}

function secretHash(username: string) {
  return createHmac("sha256", clientSecret())
    .update(username + clientId())
    .digest("base64");
}

function attrMap(attrs: AttributeType[] | undefined) {
  const map: Record<string, string> = {};
  for (const attr of attrs ?? []) {
    if (attr.Name && typeof attr.Value === "string") {
      map[attr.Name] = attr.Value;
    }
  }
  return map;
}

function mapCognitoError(err: unknown): Error {
  const name =
    err && typeof err === "object" && "name" in err
      ? String((err as { name: string }).name)
      : "";
  const message =
    err instanceof Error ? err.message : "Authentication failed. Please try again.";

  switch (name) {
    case "UsernameExistsException":
      return new Error("An account with this email already exists. Please sign in.");
    case "InvalidPasswordException":
      return new Error(
        "Password must be at least 8 characters and include upper, lower, and a number.",
      );
    case "NotAuthorizedException":
      return new Error("Invalid email or password.");
    case "UserNotConfirmedException":
      return new Error("Please confirm your email before signing in.");
    case "UserNotFoundException":
      return new Error("Invalid email or password.");
    case "InvalidParameterException":
      return new Error(message);
    default:
      return new Error(message);
  }
}

async function ensureLocalUserMirror(user: {
  id: string;
  email: string;
  name: string;
}): Promise<ClientUserDto> {
  const mirrored = await findOrCreateOAuthUser({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  return mirrored ?? user;
}

async function auditCognito(
  action: string,
  input: {
    status: "success" | "failure" | "info";
    email?: string;
    userId?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    const { writeAuditLog } = await import("@/server/audit-log.server");
    await writeAuditLog({
      action,
      status: input.status,
      email: input.email ?? null,
      userId: input.userId ?? null,
      message: input.message ?? null,
      metadata: {
        provider: "cognito",
        ...(input.metadata ?? {}),
      },
    });
  } catch {
    // never break auth on audit failure
  }
}

/** Create Cognito user for Google OAuth sign-ins (no Hosted UI). */
export async function ensureCognitoUserFromOAuth(input: {
  email: string;
  name?: string | null;
  sub: string;
}): Promise<{ created: boolean; email: string; sub: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || email.split("@")[0] || "Guest";
  const cognito = getClient();

  try {
    await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: poolId(),
        Username: email,
      }),
    );
    await auditCognito("auth.cognito.oauth.mirror", {
      status: "success",
      email,
      userId: input.sub,
      message: "Cognito user already exists for OAuth account",
      metadata: { created: false, oauthSub: input.sub, name },
    });
    return { created: false, email, sub: input.sub };
  } catch {
    // User does not exist — create
  }

  try {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: poolId(),
        Username: email,
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: name },
        ],
      }),
    );
    await auditCognito("auth.cognito.oauth.mirror", {
      status: "success",
      email,
      userId: input.sub,
      message: "Cognito user created from Google OAuth",
      metadata: { created: true, oauthSub: input.sub, name },
    });
    return { created: true, email, sub: input.sub };
  } catch (err) {
    const errName =
      err && typeof err === "object" && "name" in err
        ? String((err as { name: string }).name)
        : "";
    if (errName === "UsernameExistsException") {
      await auditCognito("auth.cognito.oauth.mirror", {
        status: "success",
        email,
        userId: input.sub,
        message: "Cognito user already exists (race)",
        metadata: { created: false, oauthSub: input.sub, name },
      });
      return { created: false, email, sub: input.sub };
    }

    await auditCognito("auth.cognito.oauth.mirror", {
      status: "failure",
      email,
      userId: input.sub,
      message: err instanceof Error ? err.message : "Cognito OAuth mirror failed",
      metadata: { oauthSub: input.sub, errorName: errName },
    });
    throw err;
  }
}

async function establishSession(user: ClientUserDto) {
  const token = await createCredentialToken(user);
  writeCredentialCookie(token);
  return user;
}

export async function registerUserWithCognito(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ClientUserDto> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email || password.length < 8) {
    await auditCognito("auth.cognito.signup", {
      status: "failure",
      email,
      message: "Invalid signup input",
      metadata: { reason: "validation" },
    });
    throw new Error(
      "Please provide a valid name, email, and password (min 8 characters).",
    );
  }

  const cognito = getClient();

  try {
    const result = await cognito.send(
      new SignUpCommand({
        ClientId: clientId(),
        Username: email,
        Password: password,
        SecretHash: secretHash(email),
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: name },
        ],
      }),
    );

    // Confirm immediately so the branded signup form works without a code email.
    await cognito.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: poolId(),
        Username: email,
      }),
    );

    const sub = result.UserSub ?? email;
    const user = await ensureLocalUserMirror({ id: sub, email, name });

    await auditCognito("auth.cognito.signup", {
      status: "success",
      email,
      userId: user.id,
      message: "Cognito signup + local MySQL mirror",
      metadata: {
        cognitoSub: sub,
        mysqlUserId: user.id,
        name,
        confirmed: true,
      },
    });

    return user;
  } catch (err) {
    const mapped = mapCognitoError(err);
    await auditCognito("auth.cognito.signup", {
      status: "failure",
      email,
      message: mapped.message,
      metadata: {
        name,
        errorName:
          err && typeof err === "object" && "name" in err
            ? String((err as { name: string }).name)
            : "unknown",
      },
    });
    throw mapped;
  }
}

export async function authenticateUserWithCognito(input: {
  email: string;
  password: string;
}): Promise<ClientUserDto> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const cognito = getClient();

  try {
    await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId(),
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash(email),
        },
      }),
    );

    const profile = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: poolId(),
        Username: email,
      }),
    );

    const attrs = attrMap(profile.UserAttributes);
    const id = attrs.sub ?? profile.Username ?? email;
    const name = attrs.name?.trim() || email.split("@")[0] || "Guest";

    const user = await ensureLocalUserMirror({
      id,
      email: attrs.email ?? email,
      name,
    });

    const sessionUser = await establishSession(user);

    await auditCognito("auth.cognito.login", {
      status: "success",
      email: sessionUser.email,
      userId: sessionUser.id,
      message: "Cognito password auth + session cookie",
      metadata: {
        cognitoSub: id,
        mysqlUserId: sessionUser.id,
        name: sessionUser.name,
        authFlow: "USER_PASSWORD_AUTH",
      },
    });

    return sessionUser;
  } catch (err) {
    const mapped = mapCognitoError(err);
    await auditCognito("auth.cognito.login", {
      status: "failure",
      email,
      message: mapped.message,
      metadata: {
        authFlow: "USER_PASSWORD_AUTH",
        errorName:
          err && typeof err === "object" && "name" in err
            ? String((err as { name: string }).name)
            : "unknown",
      },
    });
    throw mapped;
  }
}
