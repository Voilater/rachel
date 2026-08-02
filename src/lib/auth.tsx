import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type ClientUser,
  clientUserFromAccountStatus,
  clientUserFromSessionUser,
} from "@/lib/client-user";
import { clearCartStorage } from "@/lib/cart";
import { clearCartItems } from "@/server/cart";
import {
  clearLoggedOutFlag,
  isLoggedOutFlagSet,
  markLoggedOut,
  clearLocalAuthStorage,
} from "@/lib/logout-state";
import { isStaticSite } from "@/lib/static-site";
import type { AccountStatus } from "@/server/auth0";
import { verifyAdminLogin } from "@/server/auth";
import { getSessionUser } from "@/server/session";
import type { SessionUser } from "@/server/session-resolve";

interface ClientSession {
  user: ClientUser;
}

interface AdminSession {
  email: string;
  name: string;
  role: "admin";
}

interface AuthContextValue {
  clientUser: ClientUser | null;
  adminSession: AdminSession | null;
  isClientAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginClient: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  applyClientUser: (user: ClientUser) => void;
  refreshClientSession: () => Promise<ClientUser | null>;
  logoutClient: () => void;
  logoutAdmin: () => void;
}

const CLIENT_SESSION_KEY = "vk_client_session";
const ADMIN_SESSION_KEY = "vk_admin_session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readClientSession(): ClientSession | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLIENT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as ClientSession) : null;
  } catch {
    return null;
  }
}

function writeClientSession(session: ClientSession | null) {
  if (typeof localStorage === "undefined") return;
  if (session) {
    localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(CLIENT_SESSION_KEY);
  }
}

function readAdminSession(): AdminSession | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function writeAdminSession(session: AdminSession | null) {
  if (typeof sessionStorage === "undefined") return;
  if (session) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

function initialClientUser(
  sessionUser: SessionUser | null,
  accountStatus: AccountStatus | null,
): ClientUser | null {
  if (isLoggedOutFlagSet()) return null;
  if (sessionUser) return clientUserFromSessionUser(sessionUser);
  if (accountStatus) {
    const fromOauth = clientUserFromAccountStatus(accountStatus);
    if (fromOauth) return fromOauth;
  }
  return readClientSession()?.user ?? null;
}

export function AuthProvider({
  children,
  initialAccountStatus = null,
  initialSessionUser = null,
}: {
  children: ReactNode;
  initialAccountStatus?: AccountStatus | null;
  initialSessionUser?: SessionUser | null;
}) {
  const [clientUser, setClientUser] = useState<ClientUser | null>(() =>
    initialClientUser(initialSessionUser, initialAccountStatus),
  );
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    setAdminSession(readAdminSession());
  }, []);

  const applyClientUser = useCallback((user: ClientUser) => {
    clearLoggedOutFlag();
    writeClientSession({ user });
    setClientUser(user);
  }, []);

  useEffect(() => {
    if (isLoggedOutFlagSet()) return;
    const user = initialClientUser(initialSessionUser, initialAccountStatus);
    if (user) applyClientUser(user);
  }, [initialSessionUser, initialAccountStatus, applyClientUser]);

  const refreshClientSession = useCallback(async () => {
    if (isStaticSite) {
      const stored = readClientSession()?.user ?? null;
      setClientUser(stored);
      return stored;
    }

    if (isLoggedOutFlagSet()) {
      setClientUser(null);
      writeClientSession(null);
      return null;
    }

    try {
      const sessionUser = await getSessionUser();
      if (sessionUser) {
        const user = clientUserFromSessionUser(sessionUser);
        applyClientUser(user);
        return user;
      }
    } catch {
      // Fall back to local session
    }

    const stored = readClientSession()?.user ?? null;
    if (stored) {
      setClientUser(stored);
      return stored;
    }

    return null;
  }, [applyClientUser]);

  useEffect(() => {
    refreshClientSession();
  }, [refreshClientSession]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    if (isStaticSite) {
      throw new Error("Account signup is not available on the static demo site.");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const { signupUser } = await import("@/server/users");
    await signupUser({
      data: { name: name.trim(), email: normalizedEmail, password },
    });
  }, []);

  const loginClient = useCallback(async (email: string, password: string) => {
    if (isStaticSite) {
      throw new Error("Account login is not available on the static demo site.");
    }
    clearLoggedOutFlag();
    const normalizedEmail = email.trim().toLowerCase();
    const { loginUser } = await import("@/server/users");
    const user = await loginUser({ data: { email: normalizedEmail, password } });
    applyClientUser(user);
  }, [applyClientUser]);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const result = await verifyAdminLogin({ data: { email, password } });
    const session: AdminSession = {
      email: result.email,
      name: result.name,
      role: "admin",
    };
    writeAdminSession(session);
    setAdminSession(session);
  }, []);

  const logoutClient = useCallback(() => {
    if (typeof window === "undefined") return;

    markLoggedOut();
    const guestId = localStorage.getItem("vk_guest_id") ?? undefined;
    clearLocalAuthStorage();
    setClientUser(null);
    clearCartStorage();
    clearCartItems({ data: { guestId } }).catch(() => {});

    const loginUrl = `${window.location.origin}/login`;
    window.location.href = `/auth/logout?callbackUrl=${encodeURIComponent(loginUrl)}`;
  }, []);

  const logoutAdmin = useCallback(() => {
    writeAdminSession(null);
    setAdminSession(null);
  }, []);

  const value = useMemo(
    () => ({
      clientUser,
      adminSession,
      isClientAuthenticated: Boolean(clientUser),
      isAdminAuthenticated: Boolean(adminSession),
      signup,
      loginClient,
      loginAdmin,
      applyClientUser,
      refreshClientSession,
      logoutClient,
      logoutAdmin,
    }),
    [
      clientUser,
      adminSession,
      signup,
      loginClient,
      loginAdmin,
      applyClientUser,
      refreshClientSession,
      logoutClient,
      logoutAdmin,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getAdminSessionSnapshot(): AdminSession | null {
  return readAdminSession();
}

// Re-export for convenience
export type { ClientUser };
