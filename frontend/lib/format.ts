import { format, formatDistanceToNow, isPast, isToday } from "date-fns";

export const fmtDate = (d: string | Date) => format(new Date(d), "MMM d, yyyy");
export const fmtDateShort = (d: string | Date) => format(new Date(d), "MMM d");
export const fmtDateTime = (d: string | Date) => format(new Date(d), "MMM d, yyyy · h:mm a");
export const fmtRelative = (d: string | Date) =>
  formatDistanceToNow(new Date(d), { addSuffix: true });

export const isOverdue = (d: string | Date) => {
  const date = new Date(d);
  return isPast(date) && !isToday(date);
};
export { isToday };

// --- date-only helpers (avoid JS Date's UTC-midnight trap) -----------------

/**
 * Turn a "YYYY-MM-DD" date-input value into an ISO timestamp anchored at
 * NOON UTC. Noon is more than 12 hours from any timezone's midnight, so the
 * calendar day survives when the value is later read back in any locale.
 */
export function dateOnlyToISO(dateOnly: string): string {
  return `${dateOnly}T12:00:00.000Z`;
}

/**
 * Combine a "YYYY-MM-DD" date and "HH:mm" time (both LOCAL) into an ISO
 * timestamp. Unlike dateOnlyToISO, this keeps the exact wall-clock time the user
 * picked — used for reminders, which fire at a specific moment.
 */
export function localDateTimeToISO(dateOnly: string, time: string): string {
  return new Date(`${dateOnly}T${time}`).toISOString();
}

/** Current LOCAL time as "HH:mm" (for prefilling a time input). */
export function nowTimeOnly(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Today as a "YYYY-MM-DD" string in the user's LOCAL timezone. */
export function todayDateOnly(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
