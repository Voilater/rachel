/** Client flag: user chose to sign out — blocks auto re-login from OAuth cookie until next sign-in. */
import { migrateStorageKeys } from "@/lib/storage-migration";

const LOGGED_OUT_KEY = "rachelparadise_logged_out";
const LOGGING_OUT_KEY = "rachelparadise_logging_out";

function migrateSessionFlags() {
  if (typeof sessionStorage === "undefined") return;
  migrateStorageKeys(sessionStorage, [
    ["vk_logged_out", LOGGED_OUT_KEY],
    ["vk_logging_out", LOGGING_OUT_KEY],
  ]);
}

export function markLoggedOut() {
  try {
    migrateSessionFlags();
    sessionStorage.setItem(LOGGED_OUT_KEY, "1");
    sessionStorage.setItem(LOGGING_OUT_KEY, "1");
  } catch {
    // Ignore
  }
}

export function clearLoggedOutFlag() {
  try {
    migrateSessionFlags();
    sessionStorage.removeItem(LOGGED_OUT_KEY);
    sessionStorage.removeItem(LOGGING_OUT_KEY);
  } catch {
    // Ignore
  }
}

export function isLoggedOutFlagSet() {
  if (typeof sessionStorage === "undefined") return false;
  migrateSessionFlags();
  return sessionStorage.getItem(LOGGED_OUT_KEY) === "1";
}

export function clearLocalAuthStorage() {
  try {
    migrateStorageKeys(localStorage, [
      ["vk_client_session", "rachelparadise_client_session"],
      ["vk_cart", "rachelparadise_cart"],
      ["vk_guest_id", "rachelparadise_guest_id"],
    ]);
    localStorage.removeItem("rachelparadise_client_session");
    localStorage.removeItem("rachelparadise_cart");
    localStorage.removeItem("rachelparadise_guest_id");
    localStorage.removeItem("vk_client_session");
    localStorage.removeItem("vk_cart");
    localStorage.removeItem("vk_guest_id");
  } catch {
    // Ignore
  }
}
