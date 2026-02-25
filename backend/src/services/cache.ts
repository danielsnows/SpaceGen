const store: Map<string, { data: unknown; expiresAt: number }> = new Map();

export function set<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, {
    data: value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function get<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}
