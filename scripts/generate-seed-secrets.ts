/**
 * Writes strong SEED_* credentials into .env.local.
 * Run: npm run seed:secrets
 */

import { randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { generateStrongPassword } from "../lib/passwordPolicy";

const ENV_PATH = resolve(process.cwd(), ".env.local");

function escapeEnvValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function upsertEnvLine(content: string, key: string, value: string, quoted = false): string {
  const formatted = quoted ? escapeEnvValue(value) : value;
  const line = `${key}=${formatted}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const trimmed = content.replace(/\s*$/, "");
  return trimmed.length > 0 ? `${trimmed}\n${line}\n` : `${line}\n`;
}

function main() {
  const adminPassword = generateStrongPassword(24);
  const userPassword = generateStrongPassword(24);
  const seedSecret = randomBytes(32).toString("base64url");

  let content = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";

  content = upsertEnvLine(content, "SEED_ADMIN_PASSWORD", adminPassword, true);
  content = upsertEnvLine(content, "SEED_USER_PASSWORD", userPassword, true);
  content = upsertEnvLine(content, "SEED_SECRET", seedSecret, true);

  if (!/^SEED_ADMIN_EMAIL=/m.test(content)) {
    content = upsertEnvLine(content, "SEED_ADMIN_EMAIL", "admin@nexora.com");
  }
  if (!/^SEED_USER_EMAIL=/m.test(content)) {
    content = upsertEnvLine(content, "SEED_USER_EMAIL", "test@nexora.com");
  }

  writeFileSync(ENV_PATH, content, "utf8");

  console.log("Updated .env.local with strong seed credentials.");
  console.log("");
  console.log("Admin login:");
  console.log("  Email:    admin@nexora.com");
  console.log(`  Password: ${adminPassword}`);
  console.log("");
  console.log("Test user login:");
  console.log("  Email:    test@nexora.com");
  console.log(`  Password: ${userPassword}`);
  console.log("");
  console.log("Save these passwords now — they are only shown once.");
  console.log("Then run: npm run seed");
}

main();
