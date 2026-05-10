import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMs(ts: any): number | null {
  if (!ts) return null;
  if (typeof ts === "number") return ts;
  // Firestore Timestamp serialized to JSON
  if (typeof ts === "object") {
    const secs = ts._seconds ?? ts.seconds;
    if (typeof secs === "number") return secs * 1000;
  }
  return null;
}

export function formatDate(ts: unknown): string {
  const ms = toMs(ts);
  if (!ms) return "—";
  return format(new Date(ms), "MMM d, yyyy");
}

export function formatDateTime(ts: unknown): string {
  const ms = toMs(ts);
  if (!ms) return "—";
  return format(new Date(ms), "MMM d, yyyy h:mm a");
}

export function formatRelative(ts: unknown): string {
  const ms = toMs(ts);
  if (!ms) return "—";
  return formatDistanceToNow(new Date(ms), { addSuffix: true });
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function replacePlaceholders(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return variables[key] ?? `{{${key}}}`;
  });
}

export function buildLeadVariables(lead: {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  customVariables: Record<string, string>;
}): Record<string, string> {
  return {
    first_name: lead.firstName,
    last_name: lead.lastName,
    company: lead.company,
    email: lead.email,
    full_name: `${lead.firstName} ${lead.lastName}`.trim(),
    ...lead.customVariables,
  };
}

export function isWithinSendingWindow(
  windowStart: string,
  windowEnd: string,
  timezone: string
): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const currentTime = `${hour}:${minute}`;
  return currentTime >= windowStart && currentTime < windowEnd;
}

export function getDayOfWeekInTimezone(timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  });
  const day = formatter.format(new Date());
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days.indexOf(day);
}

export function todayString(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function parseNullableInt(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}
