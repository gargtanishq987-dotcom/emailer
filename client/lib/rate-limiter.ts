const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

export function loginRateLimit(ip: string): boolean {
  return rateLimit(`login:${ip}`, 10, 60_000);
}

export function apiRateLimit(ip: string): boolean {
  return rateLimit(`api:${ip}`, 100, 60_000);
}
