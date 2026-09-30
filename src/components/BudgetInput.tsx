"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

/** Monthly budget field that saves on blur and briefly confirms with a check. */
export default function BudgetInput({
  categoryName,
  initialValue,
  onSave,
}: {
  categoryName: string;
  initialValue: string;
  onSave: (val: string) => Promise<boolean>;
}) {
  const [val, setVal] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow the stored value when it changes elsewhere (e.g. after a refresh).
  const [prevInitial, setPrevInitial] = useState(initialValue);
  if (initialValue !== prevInitial) {
    setPrevInitial(initialValue);
    setVal(initialValue);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleBlur = async () => {
    const next = val.trim();
    if (next === initialValue) return;
    if (!(await onSave(next))) {
      setVal(initialValue);
      return;
    }
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-fg-muted">$</span>
      <input
        type="text"
        inputMode="decimal"
        aria-label={`Monthly budget for ${categoryName}`}
        placeholder="Limit"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        className="min-h-11 w-24 rounded-xl border border-line-default bg-surface-card py-1.5 pl-6 pr-7 text-[16px] text-fg-base tabular-nums placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
      />
      <span aria-live="polite" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-positive-fg">
        {saved && <><Check size={16} /><span className="sr-only">Saved</span></>}
      </span>
    </div>
  );
}
