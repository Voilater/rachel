/** Client flag: user chose to sign out — blocks auto re-login from OAuth cookie until next sign-in. */
const LOGGED_OUT_KEY = "vk_logged_out";

export function markLoggedOut() {
  try {
    sessionStorage.setItem(LOGGED_OUT_KEY, "1");
    sessionStorage.setItem("vk_logging_out", "1");
  } catch {
    // Ignore
  }
}

export function clearLoggedOutFlag() {
  try {
    sessionStorage.removeItem(LOGGED_OUT_KEY);
    sessionStorage.removeItem("vk_logging_out");
  } catch {
    // Ignore
  }
}

export function isLoggedOutFlagSet() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(LOGGED_OUT_KEY) === "1";
}

export function clearLocalAuthStorage() {
  try {
    localStorage.removeItem("vk_client_session");
    localStorage.removeItem("vk_cart");
    localStorage.removeItem("vk_guest_id");
  } catch {
    // Ignore
  }
}
