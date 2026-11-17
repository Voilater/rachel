const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export const EMAIL_MAX_LENGTH = 254;
export const INDIAN_MOBILE_ERROR =
  "Enter a valid 10-digit Indian mobile number. You can include +91.";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  const [localPart] = normalizedEmail.split("@");
  const domain = normalizedEmail.split("@")[1];
  const topLevelDomain = domain?.split(".").at(-1);
  return (
    normalizedEmail.length <= EMAIL_MAX_LENGTH &&
    localPart.length <= 64 &&
    !localPart.startsWith(".") &&
    !localPart.endsWith(".") &&
    !localPart.includes("..") &&
    Boolean(domain && domain.length <= 253) &&
    EMAIL_PATTERN.test(normalizedEmail) &&
    Boolean(topLevelDomain && topLevelDomain.length >= 2)
  );
}

export function normalizeIndianMobileNumber(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";
  if (!/^\+?[\d\s().-]+$/.test(trimmedValue)) return null;

  let digits = trimmedValue.replace(/\D/g, "");
  if (trimmedValue.startsWith("+")) {
    if (!digits.startsWith("91")) return null;
    digits = digits.slice(2);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}
