"use client";

import { useState, useEffect } from "react";

export default function BudgetInput({
  initialValue,
  onSave,
}: {
  initialValue: string;
  onSave: (val: string) => void;
}) {
  const [val, setVal] = useState(initialValue);
  useEffect(() => { setVal(initialValue); }, [initialValue]);
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted text-[16px]">$</span>
      <input
        type="number"
        placeholder="Limit"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onSave(val)}
        className="w-24 pl-6 pr-2 py-1.5 bg-surface-card border border-line-default rounded-lg text-[16px] text-fg-base focus:outline-none focus:ring-1 focus:ring-focus-ring placeholder:text-fg-muted"
      />
    </div>
  );
}
