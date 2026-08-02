export const isStaticSite = import.meta.env.VITE_STATIC_SITE === "true";

export const emptyAccountStatus = {
  oauthActive: false,
  oauthEmail: null,
  oauthName: null,
  oauthImage: null,
  user: null,
  savedToDatabase: false,
};
