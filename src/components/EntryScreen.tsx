"use client";

import { useState, useMemo } from "react";
import { Delete, Check, Calendar, PenLine, Loader2, Trash2, ChevronLeft, LayoutGrid } from "lucide-react";
import { createClient } from "../lib/supabase";
import TopHeader from "./TopHeader";
import CategoryPicker from "./CategoryPicker";
import type { AppUser, Category, Transaction } from "@/lib/types";

const supabase = createClient();

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function EntryScreen({
  user,
  categories,
  loadingCats,
  transactions,
  fetchData,
  pinnedNames,
}: {
  user: AppUser;
  categories: Category[];
  loadingCats: boolean;
  transactions: Transaction[];
  fetchData: () => void;
  pinnedNames: string[];
}) {
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  const [note, setNote] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const todayStr = toLocalDateStr(new Date());
  const minDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return toLocalDateStr(d);
  }, []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toLocalDateStr(d);
  }, []);
  const chipLabel =
    selectedDate === todayStr ? "Today" :
    selectedDate === yesterdayStr ? "Yesterday" :
    new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const pinnedCategories = useMemo(
    () => pinnedNames.map((name) => categories.find((c) => c.name === name)).filter(Boolean) as Category[],
    [pinnedNames, categories]
  );

  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions]);

  const allMonthTx = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions.filter(tx => new Date(tx.date) >= firstDay);
  }, [transactions]);

  const handlePress = (val: string) => {
    if (amount === "0" && val !== ".") setAmount(val);
    else if (val === "." && amount.includes(".")) return;
    else {
      const parts = amount.split(".");
      if (parts.length === 2 && parts[1].length >= 2 && val !== ".") return;
      setAmount((prev) => prev + val);
    }
  };

  const handleDelete = () => {
    amount.length === 1 ? setAmount("0") : setAmount((prev) => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (amount === "0" || !category) {
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
      return alert("Please enter an amount and select a category.");
    }
    const numAmount = parseFloat(amount);
    const txDate = new Date(selectedDate + "T12:00:00");

    const { error } = await supabase.from('transactions').insert({
      amount: numAmount, category, notes: note, date: txDate.toISOString(), user_id: user.id,
    });
    if (!error) {
      if (navigator.vibrate) navigator.vibrate(50);
      setToastMsg(`Saved $${numAmount} for ${category}`);
      setTimeout(() => setToastMsg(""), 2500);
      setAmount("0"); setCategory(""); setNote(""); setSelectedDate(toLocalDateStr(new Date()));
      fetchData();
    } else alert("Error: " + error.message);
  };

  const handleDeleteTx = async (id: string) => {
    if (window.confirm("Delete this transaction?")) {
      await supabase.from('transactions').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-surface">
      {toastMsg && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] transition-all">
          <div className="bg-action text-fg-on-action px-5 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center space-x-2 border border-gray-700/50">
            <Check size={16} className="text-positive" /><span>{toastMsg}</span>
          </div>
        </div>
      )}
      <TopHeader />
      <div className="flex flex-col items-center justify-center px-6 py-6 bg-surface-card rounded-b-3xl shadow-sm z-10 pt-6 -mt-[env(safe-area-inset-top)]">
        <h1 className="text-6xl font-light text-fg-base tracking-tighter mb-4">${amount}</h1>
        <div className="flex space-x-3 mb-4 w-full justify-center">
          <div className="relative flex items-center space-x-1.5 bg-surface-inset px-4 py-2 rounded-full text-sm font-medium text-fg-secondary">
            <Calendar size={16} /><span>{chipLabel}</span>
            <input
              type="date"
              value={selectedDate}
              min={minDateStr}
              max={todayStr}
              onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
          <div className="flex items-center space-x-1.5 bg-surface-inset px-4 py-2 rounded-full text-sm font-medium text-fg-secondary focus-within:ring-2 focus-within:ring-focus-ring">
            <PenLine size={16} /><input type="text" placeholder="Note..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-transparent outline-none w-20 focus:w-32 transition-all text-fg-base" />
          </div>
        </div>
        <p className="text-fg-muted font-medium text-sm h-5">{category ? <span className="text-fg-base bg-surface-inset px-3 py-1 rounded-md">{category}</span> : "Select category"}</p>
      </div>

      {/* Pinned category row */}
      <div className="flex items-center gap-2 py-3 px-4 min-h-[60px]">
        {loadingCats ? (
          <Loader2 className="animate-spin text-fg-muted mx-auto" />
        ) : pinnedCategories.length === 0 ? (
          <>
            <span className="text-xs text-fg-muted flex-1 leading-tight">Pin categories in Settings for quick access</span>
            <button
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold bg-surface-card text-fg-secondary border border-line-default shrink-0 active:bg-surface-inset"
            >
              <LayoutGrid size={15} />
              <span>All</span>
            </button>
          </>
        ) : (
          <>
            {pinnedCategories.map((cat) => {
              const label = cat.name.includes(" - ")
                ? cat.name.split(" - ").slice(1).join(" - ")
                : cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.name)}
                  className={`whitespace-nowrap px-3 py-2 rounded-2xl text-sm font-semibold transition-all active:scale-[0.97] ${
                    category === cat.name
                      ? "bg-action text-fg-on-action shadow-md"
                      : "bg-surface-card text-fg-secondary border border-line-default active:bg-surface-inset"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center justify-center p-2.5 rounded-2xl bg-surface-inset text-fg-secondary shrink-0 ml-auto active:bg-surface-card"
              aria-label="All categories"
            >
              <LayoutGrid size={16} />
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 px-6 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button key={num} onClick={() => handlePress(num.toString())} className="flex items-center justify-center bg-surface-card text-3xl font-normal text-fg-base rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">{num}</button>
        ))}
        <button onClick={() => handlePress(".")} className="flex items-center justify-center bg-surface-card text-3xl font-normal text-fg-base rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">.</button>
        <button onClick={() => handlePress("0")} className="flex items-center justify-center bg-surface-card text-3xl font-normal text-fg-base rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">0</button>
        <button onClick={handleDelete} className="flex items-center justify-center bg-surface-inset text-fg-secondary rounded-2xl shadow-sm h-[64px] active:bg-gray-300 transition-colors"><Delete size={24} /></button>
      </div>
      <div className="px-6 pb-6">
        <button onClick={handleSave} className="w-full bg-action text-fg-on-action py-4 rounded-2xl text-lg font-bold shadow-lg active:scale-[0.98]">Save Entry</button>
      </div>
      <div className="px-6">
        <h3 className="text-sm font-semibold text-fg-muted mb-3 uppercase tracking-wider">Recent Activity</h3>
        <div className="space-y-3">
          {recentTx.length === 0 ? <p className="text-fg-muted text-sm italic">No entries.</p> : recentTx.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center bg-surface-card p-4 rounded-2xl shadow-sm border border-line-subtle">
              <div className="flex flex-col"><span className="font-semibold text-fg-base">{tx.category}</span><span className="text-xs text-fg-secondary">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {tx.notes && `\u2022 ${tx.notes}`}</span></div>
              <div className="flex items-center space-x-4"><span className="font-bold text-fg-base">${tx.amount.toFixed(2)}</span><button onClick={() => handleDeleteTx(tx.id)} className="text-delete-icon hover:text-red-500"><Trash2 size={18} /></button></div>
            </div>
          ))}
          {recentTx.length > 0 && <button onClick={() => setIsModalOpen(true)} className="w-full text-center py-3 text-sm font-semibold text-fg-muted hover:text-fg-base">View all month activity</button>}
        </div>
      </div>

      {/* Category picker bottom sheet */}
      {isPickerOpen && (
        <CategoryPicker
          categories={categories}
          onSelect={setCategory}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

      {/* This Month modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-surface-overlay flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom-full duration-300">
          <header className="flex justify-between items-center px-6 py-4 bg-surface-card border-b shadow-sm">
            <button onClick={() => setIsModalOpen(false)}><ChevronLeft size={24} className="text-fg-muted" /></button>
            <h2 className="font-bold text-fg-base text-lg">This Month</h2>
            <div className="w-8" />
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-32">
            {allMonthTx.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center bg-surface-card p-4 rounded-2xl shadow-sm border border-line-subtle">
                <div className="flex flex-col"><span className="font-semibold text-fg-base">{tx.category}</span><span className="text-xs text-fg-secondary">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                <div className="flex items-center space-x-4"><span className="font-bold text-fg-base">${tx.amount.toFixed(2)}</span><button onClick={() => handleDeleteTx(tx.id)} className="text-delete-icon hover:text-red-500"><Trash2 size={18} /></button></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
