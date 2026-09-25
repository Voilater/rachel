import { createServerFn } from "@tanstack/react-start";

import type { AccountStatus } from "@/server/auth0";
import type { StoredOrderDto } from "@/server/orders";
import type { SessionUser } from "@/server/session-resolve";
import type { AccountProfileDto } from "@/server/user-types";

export type AccountPageData = {
  authStatus: AccountStatus;
  sessionUser: SessionUser | null;
  profile: AccountProfileDto | null;
  myOrders: StoredOrderDto[];
};

/**
 * Single RPC for /account so session + orders share one request context.
 */
export const getAccountPageData = createServerFn({ method: "GET" }).handler(
  async (): Promise<AccountPageData> => {
    const { getAccountStatus } = await import("@/server/auth0");
    const { resolveSessionUser } = await import("@/server/session-resolve");
    const { fetchOrdersForCustomer } = await import("@/server/orders.server");
    const { getUserProfileByEmail } = await import("@/server/users");

    // Prefer resolveSessionUser (plain fn) over nested createServerFn for orders.
    const sessionUser = await resolveSessionUser();
    const authStatus = (await getAccountStatus()) as AccountStatus;

    if (!sessionUser) {
      return {
        authStatus,
        sessionUser: null,
        profile: null,
        myOrders: [],
      };
    }

    const [profileRow, myOrders] = await Promise.all([
      getUserProfileByEmail(sessionUser.email),
      fetchOrdersForCustomer({
        email: sessionUser.email,
        userId: sessionUser.id,
      }),
    ]);

    const image = sessionUser.image ?? profileRow?.image ?? null;
    const profile: AccountProfileDto = profileRow
      ? { ...profileRow, image }
      : {
          name: sessionUser.name,
          email: sessionUser.email,
          phone: "",
          shippingStreet: "",
          shippingCity: "",
          shippingZip: "",
          image,
        };

    return { authStatus, sessionUser, profile, myOrders };
  },
);
