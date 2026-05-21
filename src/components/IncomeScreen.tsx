"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "../lib/supabase";
import TopHeader from "./TopHeader";
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
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveIncome = async () => {
    if (!amount || !source) return alert("Enter amount and source.");
    setIsAdding(true);
    const { error } = await supabase.from('income').insert({
      amount: parseFloat(amount), source, date: new Date().toISOString(), user_id: user.id,
    });
    if (!error) {
      if (navigator.vibrate) navigator.vibrate(50);
      setAmount(""); setSource(""); fetchData();
    } else alert("Error: " + error.message);
    setIsAdding(false);
  };

  const handleDeleteIncome = async (id: string) => {
    if (window.confirm("Delete entry?")) {
      await supabase.from('income').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-surface pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-surface-card p-6 rounded-3xl shadow-sm border border-line-subtle mb-6">
          <h2 className="text-xl font-bold text-fg-base mb-4">Log Paycheck</h2>
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
              <div className="flex items-center space-x-4"><span className="font-bold text-positive">+${inc.amount.toFixed(2)}</span><button onClick={() => handleDeleteIncome(inc.id)} className="text-delete-icon hover:text-red-500"><Trash2 size={18} /></button></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
