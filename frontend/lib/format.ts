import { format, formatDistanceToNow, isPast, isToday } from "date-fns";

export const fmtDate = (d: string | Date) => format(new Date(d), "MMM d, yyyy");
export const fmtDateShort = (d: string | Date) => format(new Date(d), "MMM d");
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

/** Today as a "YYYY-MM-DD" string in the user's LOCAL timezone. */
export function todayDateOnly(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
