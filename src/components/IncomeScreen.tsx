"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import ScreenHeader from "./ScreenHeader";
import DateChip from "./DateChip";
import TransactionRow from "./TransactionRow";
import EmptyState from "./EmptyState";
import { useToast } from "../hooks/useToast";
import type { IncomeInput } from "../hooks/useAppData";
import { toLocalDateStr } from "@/lib/dates";
import { formatAUD } from "@/lib/format";
import type { Income } from "@/lib/types";

export default function IncomeScreen({
  income,
  saveIncome,
  deleteIncome,
}: {
  income: Income[];
  saveIncome: (input: IncomeInput) => Promise<boolean>;
  deleteIncome: (inc: Income) => void;
}) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  const [isAdding, setIsAdding] = useState(false);
  const showToast = useToast();

  const handleSaveIncome = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || !source.trim()) {
      showToast("Enter amount and source.", "error");
      return;
    }
    setIsAdding(true);
    const ok = await saveIncome({
      amount: numAmount,
      source: source.trim(),
      date: new Date(selectedDate + "T12:00:00").toISOString(),
    });
    setIsAdding(false);
    if (!ok) return;
    showToast(`Logged ${formatAUD(numAmount)} from ${source.trim()}`);
    setAmount(""); setSource(""); setSelectedDate(toLocalDateStr(new Date()));
  };

  return (
    <main>
      <ScreenHeader title="Income" />
      <div className="pt-2 px-6">
        <div className="bg-surface-card p-6 rounded-2xl shadow-sm border border-line-subtle mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-fg-base">Log Paycheck</h2>
            <DateChip value={selectedDate} onChange={setSelectedDate} />
          </div>
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted font-medium">$</span>
              <input type="text" inputMode="decimal" aria-label="Amount" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-surface border border-line-default rounded-xl text-fg-base focus:outline-none focus:ring-2 focus:ring-focus-ring text-[16px]" />
            </div>
            <input type="text" aria-label="Source" placeholder="Source (Salary, Side Hustle)" value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-4 py-3 bg-surface border border-line-default rounded-xl text-fg-base focus:outline-none focus:ring-2 focus:ring-focus-ring text-[16px]" />
            <button type="button" onClick={handleSaveIncome} disabled={isAdding} className="w-full bg-positive text-white py-3.5 rounded-xl font-bold active:scale-[0.98] shadow-sm flex items-center justify-center">
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : <span>Add Income</span>}
            </button>
          </div>
        </div>
        <h2 className="text-sm font-semibold text-fg-muted mb-3 uppercase tracking-wider">Income History</h2>
        <div className="space-y-3">
          {income.length === 0 ? (
            <EmptyState title="No income logged yet" hint="Log a paycheck above to see savings in Insights." />
          ) : income.map((inc) => (
            <TransactionRow
              key={inc.id}
              title={inc.source}
              subtitle={new Date(inc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              amount={`+${formatAUD(inc.amount)}`}
              tone="positive"
              onDelete={() => deleteIncome(inc)}
              deleteLabel={`Delete ${inc.source} ${formatAUD(inc.amount)}`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
