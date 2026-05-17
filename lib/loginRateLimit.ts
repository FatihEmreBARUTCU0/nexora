type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 10;

export function isLoginRateLimited(identifier: string): boolean {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (existing.count >= LIMIT) {
    return true;
  }

  existing.count += 1;
  store.set(key, existing);
  return false;
}
