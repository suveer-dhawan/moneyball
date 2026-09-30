"use client";

import { useState } from "react";
import { Calendar, Loader2, Trash2 } from "lucide-react";
import { createClient } from "../lib/supabase";
import TopHeader from "./TopHeader";
import Toast from "./Toast";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "../hooks/useToast";
import { toLocalDateStr, daysAgoStr, relativeDayLabel } from "@/lib/dates";
import type { AppUser, Income } from "@/lib/types";

const supabase = createClient();

export default function IncomeScreen({
  user,
  income,
  fetchData,
}: {
  user: AppUser;
  income: Income[];
  fetchData: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null);
  const { message: toastMsg, variant: toastVariant, showToast } = useToast();

  const todayStr = toLocalDateStr(new Date());
  const minDateStr = daysAgoStr(60);
  const chipLabel = relativeDayLabel(selectedDate);

  const handleSaveIncome = async () => {
    if (!amount || !source) {
      showToast("Enter amount and source.", "error");
      return;
    }
    setIsAdding(true);
    const incDate = new Date(selectedDate + "T12:00:00");
    const { error } = await supabase.from('income').insert({
      amount: parseFloat(amount), source, date: incDate.toISOString(), user_id: user.id,
    });
    if (!error) {
      if (navigator.vibrate) navigator.vibrate(50);
      showToast(`Logged $${amount} from ${source}`);
      setAmount(""); setSource(""); setSelectedDate(toLocalDateStr(new Date()));
      fetchData();
    } else {
      showToast(error.message, "error");
    }
    setIsAdding(false);
  };

  const confirmDeleteIncome = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await supabase.from('income').delete().eq('id', id);
    fetchData();
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-surface pt-[env(safe-area-inset-top)]">
      <Toast message={toastMsg} variant={toastVariant} />
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-surface-card p-6 rounded-3xl shadow-sm border border-line-subtle mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-fg-base">Log Paycheck</h2>
            <div className="relative flex items-center space-x-1.5 bg-surface-inset px-3 py-1.5 rounded-full text-xs font-medium text-fg-secondary">
              <Calendar size={14} /><span>{chipLabel}</span>
              <input
                type="date"
                value={selectedDate}
                min={minDateStr}
                max={todayStr}
                onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted font-medium">$</span>
              <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-surface border border-line-default rounded-xl text-fg-base focus:outline-none focus:ring-2 focus:ring-focus-ring text-[16px]" />
            </div>
            <input type="text" placeholder="Source (Salary, Side Hustle)" value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-4 py-3 bg-surface border border-line-default rounded-xl text-fg-base focus:outline-none focus:ring-2 focus:ring-focus-ring text-[16px]" />
            <button onClick={handleSaveIncome} disabled={isAdding} className="w-full bg-positive text-white py-3.5 rounded-xl font-bold active:scale-[0.98] shadow-sm flex items-center justify-center">
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : <span>Add Income</span>}
            </button>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-fg-muted mb-3 uppercase tracking-wider">Income History</h3>
        <div className="space-y-3">
          {income.map((inc) => (
            <div key={inc.id} className="flex justify-between items-center bg-surface-card p-4 rounded-2xl shadow-sm border border-line-subtle">
              <div className="flex flex-col"><span className="font-semibold text-fg-base">{inc.source}</span><span className="text-xs text-fg-secondary">{new Date(inc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
              <div className="flex items-center space-x-4"><span className="font-bold text-positive">+${inc.amount.toFixed(2)}</span><button onClick={() => setDeleteTarget(inc)} className="text-delete-icon hover:text-red-500"><Trash2 size={18} /></button></div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this income entry?"
        message={deleteTarget ? `${deleteTarget.source} - $${deleteTarget.amount.toFixed(2)}` : undefined}
        onConfirm={confirmDeleteIncome}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
