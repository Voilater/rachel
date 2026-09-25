/** Client-side browser / device metadata for audit logs (no passwords or payment data). */
export interface BrowserMeta {
  language?: string;
  languages?: string[];
  timezone?: string;
  timezoneOffset?: number;
  platform?: string;
  vendor?: string;
  cookieEnabled?: boolean;
  doNotTrack?: string | null;
  screenWidth?: number;
  screenHeight?: number;
  screenAvailWidth?: number;
  screenAvailHeight?: number;
  screenColorDepth?: number;
  screenPixelDepth?: number;
  devicePixelRatio?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  connectionType?: string;
  connectionEffectiveType?: string;
  offline?: boolean;
  localStorageEnabled?: boolean;
  sessionStorageEnabled?: boolean;
  touchSupport?: boolean;
  pdfViewerEnabled?: boolean;
  userAgent?: string;
}

export function collectBrowserMeta(): BrowserMeta {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { type?: string; effectiveType?: string };
    pdfViewerEnabled?: boolean;
  };

  let localStorageEnabled = false;
  let sessionStorageEnabled = false;
  try {
    localStorageEnabled = Boolean(window.localStorage);
    window.localStorage.setItem("__vk_audit_probe", "1");
    window.localStorage.removeItem("__vk_audit_probe");
  } catch {
    localStorageEnabled = false;
  }
  try {
    sessionStorageEnabled = Boolean(window.sessionStorage);
  } catch {
    sessionStorageEnabled = false;
  }

  return {
    language: nav.language,
    languages: Array.from(nav.languages ?? []),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    platform: nav.platform,
    vendor: nav.vendor,
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    screenAvailWidth: window.screen?.availWidth,
    screenAvailHeight: window.screen?.availHeight,
    screenColorDepth: window.screen?.colorDepth,
    screenPixelDepth: window.screen?.pixelDepth,
    devicePixelRatio: window.devicePixelRatio,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    maxTouchPoints: nav.maxTouchPoints,
    connectionType: nav.connection?.type,
    connectionEffectiveType: nav.connection?.effectiveType,
    offline: !nav.onLine,
    localStorageEnabled,
    sessionStorageEnabled,
    touchSupport: "ontouchstart" in window || (nav.maxTouchPoints ?? 0) > 0,
    pdfViewerEnabled: nav.pdfViewerEnabled,
    userAgent: nav.userAgent,
  };
}
