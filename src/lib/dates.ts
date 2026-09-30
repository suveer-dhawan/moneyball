/** YYYY-MM-DD in the device's local timezone (the format <input type="date"> uses). */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local date string for `days` days before today. */
export function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalDateStr(d);
}

/** "Today", "Yesterday", or a short date like "3 Sep" for a YYYY-MM-DD string. */
export function relativeDayLabel(dateStr: string): string {
  if (dateStr === toLocalDateStr(new Date())) return "Today";
  if (dateStr === daysAgoStr(1)) return "Yesterday";
  return new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
