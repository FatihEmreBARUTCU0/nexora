import { assertStrongPassword } from "@/lib/passwordPolicy";

export type SeedUserCredentials = {
  email: string;
  password: string;
};

export type SeedCredentials = {
  admin: SeedUserCredentials;
  user: SeedUserCredentials;
};

const WEAK_PLACEHOLDER_SECRETS = new Set([
  "change-this-to-a-random-secret",
  "admin123",
  "test123",
  "password",
  "secret",
]);

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is required in .env.local. Generate values with: npm run seed:secrets`
    );
  }
  return value;
}

function optionalEmail(name: string, fallback: string): string {
  const value = process.env[name]?.trim().toLowerCase();
  return value || fallback;
}

export function loadSeedCredentials(): SeedCredentials {
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const userPassword = requireEnv("SEED_USER_PASSWORD");

  assertStrongPassword(adminPassword, "SEED_ADMIN_PASSWORD");
  assertStrongPassword(userPassword, "SEED_USER_PASSWORD");

  if (WEAK_PLACEHOLDER_SECRETS.has(adminPassword) || WEAK_PLACEHOLDER_SECRETS.has(userPassword)) {
    throw new Error(
      "Seed passwords cannot use default or placeholder values. Run: npm run seed:secrets"
    );
  }

  return {
    admin: {
      email: optionalEmail("SEED_ADMIN_EMAIL", "admin@nexora.com"),
      password: adminPassword,
    },
    user: {
      email: optionalEmail("SEED_USER_EMAIL", "test@nexora.com"),
      password: userPassword,
    },
  };
}

export function assertSeedSecretConfigured(): void {
  const seedSecret = process.env.SEED_SECRET?.trim();
  if (!seedSecret || WEAK_PLACEHOLDER_SECRETS.has(seedSecret)) {
    throw new Error(
      "SEED_SECRET must be set to a long random value in .env.local. Run: npm run seed:secrets"
    );
  }
}
