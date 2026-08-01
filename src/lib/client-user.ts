import type { AccountStatus } from "@/server/auth0";
import type { SessionUser } from "@/server/session-resolve";

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export function clientUserFromSessionUser(session: SessionUser): ClientUser {
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    image: session.image ?? undefined,
  };
}

export function clientUserFromAccountStatus(status: AccountStatus): ClientUser | null {
  const image = status.oauthImage ?? undefined;

  if (status.user) {
    return { ...status.user, image };
  }

  if (status.oauthActive && status.oauthEmail) {
    return {
      id: status.oauthEmail,
      name: status.oauthName ?? status.oauthEmail.split("@")[0] ?? "Guest",
      email: status.oauthEmail,
      image,
    };
  }

  return null;
}
