"use client";

import { Calendar } from "lucide-react";
import { daysAgoStr, relativeDayLabel, toLocalDateStr } from "@/lib/dates";

/** Date pill backed by a native date input; allows backdating up to 60 days. */
export default function DateChip({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const label = relativeDayLabel(value);
  return (
    <label className="relative flex items-center gap-1.5 rounded-full bg-surface-inset px-4 py-2 text-sm font-medium text-fg-secondary focus-within:ring-2 focus-within:ring-focus-ring">
      <Calendar size={16} />
      <span>{label}</span>
      <input
        type="date"
        aria-label={`Date, ${label}`}
        value={value}
        min={daysAgoStr(60)}
        max={toLocalDateStr(new Date())}
        onChange={(e) => { if (e.target.value) onChange(e.target.value); }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}
