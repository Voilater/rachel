import { createServerFn } from "@tanstack/react-start";

import {
  INDIAN_MOBILE_ERROR,
  normalizeIndianMobileNumber,
} from "@/lib/form-validation";
import type { AccountProfileDto } from "@/server/user-types";

export const getAccountProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<AccountProfileDto | null> => {
    const { resolveSessionUser } = await import("@/server/session-resolve");
    const { getUserProfileByEmail } = await import("@/server/users.server");
    const sessionUser = await resolveSessionUser();
    if (!sessionUser) return null;

    const profile = await getUserProfileByEmail(sessionUser.email);
    const image = sessionUser.image ?? profile?.image ?? null;

    if (profile) {
      return { ...profile, image };
    }

    return {
      name: sessionUser.name,
      email: sessionUser.email,
      phone: "",
      shippingStreet: "",
      shippingCity: "",
      shippingZip: "",
      image,
    };
  },
);

export const saveAccountProfile = createServerFn({ method: "POST" })
  .validator((data: {
    name: string;
    phone: string;
    shippingStreet: string;
    shippingCity: string;
    shippingZip: string;
  }) => data)
  .handler(async ({ data }) => {
    const { resolveSessionUser } = await import("@/server/session-resolve");
    const { updateUserProfile } = await import("@/server/users.server");
    const sessionUser = await resolveSessionUser();
    if (!sessionUser) {
      throw new Error("Please sign in to update your profile.");
    }

    if (typeof data.name !== "string" || typeof data.phone !== "string") {
      throw new Error("Check your name and mobile number.");
    }
    const name = data.name.trim();
    if (!name || name.length > 100) {
      throw new Error("Enter your name using 1 to 100 characters.");
    }
    const phone = normalizeIndianMobileNumber(data.phone);
    if (phone === null) throw new Error(INDIAN_MOBILE_ERROR);
    const shippingStreet =
      typeof data.shippingStreet === "string" ? data.shippingStreet.trim() : "";
    const shippingCity =
      typeof data.shippingCity === "string" ? data.shippingCity.trim() : "";
    const shippingZip =
      typeof data.shippingZip === "string" ? data.shippingZip.trim() : "";

    return updateUserProfile({
      email: sessionUser.email,
      name,
      phone,
      shippingStreet,
      shippingCity,
      shippingZip,
    });
  });
