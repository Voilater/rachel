import { createServerFn } from "@tanstack/react-start";

import {
  getUserProfileByEmail,
  updateUserProfile,
  type AccountProfileDto,
} from "@/server/users";

export const getAccountProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<AccountProfileDto | null> => {
    const { resolveSessionUser } = await import("@/server/session-resolve");
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
    const sessionUser = await resolveSessionUser();
    if (!sessionUser) {
      throw new Error("Please sign in to update your profile.");
    }

    const name = data.name.trim();
    if (!name) {
      throw new Error("Please enter your name.");
    }

    return await updateUserProfile({
      email: sessionUser.email,
      name,
      phone: data.phone.trim(),
      shippingStreet: data.shippingStreet.trim(),
      shippingCity: data.shippingCity.trim(),
      shippingZip: data.shippingZip.trim(),
    });
  });
