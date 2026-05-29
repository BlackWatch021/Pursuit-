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
