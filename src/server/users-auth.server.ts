import {
  createCredentialToken,
  writeCredentialCookie,
} from "@/server/credential-session";
import type { ClientUserDto } from "@/server/user-types";
import { registerUser as registerUserDb, verifyUserCredentials } from "@/server/users";

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<ClientUserDto> {
  const user = await verifyUserCredentials(input);
  const token = await createCredentialToken(user);
  writeCredentialCookie(token);
  return user;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ClientUserDto> {
  return registerUserDb(input);
}
