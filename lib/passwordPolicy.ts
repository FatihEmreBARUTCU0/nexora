import { randomBytes } from "crypto";

const MIN_LENGTH = 16;

export function generateStrongPassword(length = 24): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@$%^&*_+-=";
  const all = upper + lower + digits + special;
  const bytes = randomBytes(length);

  const chars = [
    upper[bytes[0]! % upper.length]!,
    lower[bytes[1]! % lower.length]!,
    digits[bytes[2]! % digits.length]!,
    special[bytes[3]! % special.length]!,
  ];

  for (let i = 4; i < length; i++) {
    chars.push(all[bytes[i]! % all.length]!);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}

export function getPasswordStrengthError(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a special character.";
  }
  return null;
}

export function assertStrongPassword(password: string, label = "Password"): void {
  const error = getPasswordStrengthError(password);
  if (error) {
    throw new Error(`${label}: ${error}`);
  }
}
