"use client";

import { useState, useMemo } from "react";
import { Delete, Check, Calendar, PenLine, Loader2, Trash2, ChevronLeft } from "lucide-react";
import { createClient } from "../lib/supabase";
import TopHeader from "./TopHeader";

const supabase = createClient();

export default function EntryScreen({
  user,
  categories,
  loadingCats,
  transactions,
  fetchData,
}: {
  user: any;
  categories: any[];
  loadingCats: boolean;
  transactions: any[];
  fetchData: () => void;
}) {
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("");
  const [isToday, setIsToday] = useState(true);
  const [note, setNote] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const txDate = new Date();
    if (!isToday) txDate.setDate(txDate.getDate() - 1);

    const { error } = await supabase.from('transactions').insert({
      amount: numAmount, category, notes: note, date: txDate.toISOString(), user_id: user.id,
    });
    if (!error) {
      if (navigator.vibrate) navigator.vibrate(50);
      setToastMsg(`Saved $${numAmount} for ${category}`);
      setTimeout(() => setToastMsg(""), 2500);
      setAmount("0"); setCategory(""); setNote(""); setIsToday(true);
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
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50">
      {toastMsg && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] transition-all">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center space-x-2 border border-gray-700/50">
            <Check size={16} className="text-emerald-400" /><span>{toastMsg}</span>
          </div>
        </div>
      )}
      <TopHeader />
      <div className="flex flex-col items-center justify-center px-6 py-6 bg-white rounded-b-3xl shadow-sm z-10 pt-6 -mt-[env(safe-area-inset-top)]">
        <h1 className="text-6xl font-light text-gray-900 tracking-tighter mb-4">${amount}</h1>
        <div className="flex space-x-3 mb-4 w-full justify-center">
          <button onClick={() => setIsToday(!isToday)} className="flex items-center space-x-1.5 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-600 transition-colors">
            <Calendar size={16} /><span>{isToday ? "Today" : "Yesterday"}</span>
          </button>
          <div className="flex items-center space-x-1.5 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-600 focus-within:ring-2 focus-within:ring-black">
            <PenLine size={16} /><input type="text" placeholder="Note..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-transparent outline-none w-20 focus:w-32 transition-all text-gray-900" />
          </div>
        </div>
        <p className="text-gray-400 font-medium text-sm h-5">{category ? <span className="text-black bg-gray-100 px-3 py-1 rounded-md">{category}</span> : "Select category"}</p>
      </div>
      <div className="flex overflow-x-auto py-4 px-4 space-x-2 no-scrollbar min-h-[76px] items-center">
        {loadingCats ? <Loader2 className="animate-spin mx-auto text-gray-400" /> :
          categories.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.name)} className={`whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold ${category === cat.name ? "bg-black text-white shadow-md scale-105" : "bg-white text-gray-600 border active:bg-gray-100"}`}>{cat.name}</button>
          ))
        }
      </div>
      <div className="grid grid-cols-3 gap-2 px-6 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button key={num} onClick={() => handlePress(num.toString())} className="flex items-center justify-center bg-white text-3xl font-normal text-gray-800 rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">{num}</button>
        ))}
        <button onClick={() => handlePress(".")} className="flex items-center justify-center bg-white text-3xl font-normal text-gray-800 rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">.</button>
        <button onClick={() => handlePress("0")} className="flex items-center justify-center bg-white text-3xl font-normal text-gray-800 rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">0</button>
        <button onClick={handleDelete} className="flex items-center justify-center bg-gray-200 text-gray-700 rounded-2xl shadow-sm h-[64px] active:bg-gray-300 transition-colors"><Delete size={24} /></button>
      </div>
      <div className="px-6 pb-6">
        <button onClick={handleSave} className="w-full bg-black text-white py-4 rounded-2xl text-lg font-bold shadow-lg active:scale-[0.98]">Save Entry</button>
      </div>
      <div className="px-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Recent Activity</h3>
        <div className="space-y-3">
          {recentTx.length === 0 ? <p className="text-gray-400 text-sm italic">No entries.</p> : recentTx.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col"><span className="font-semibold text-gray-900">{tx.category}</span><span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {tx.notes && `• ${tx.notes}`}</span></div>
              <div className="flex items-center space-x-4"><span className="font-bold text-gray-900">${tx.amount.toFixed(2)}</span><button onClick={() => handleDeleteTx(tx.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button></div>
            </div>
          ))}
          {recentTx.length > 0 && <button onClick={() => setIsModalOpen(true)} className="w-full text-center py-3 text-sm font-semibold text-gray-400 hover:text-gray-900">View all month activity</button>}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom-full duration-300">
          <header className="flex justify-between items-center px-6 py-4 bg-white border-b shadow-sm">
            <button onClick={() => setIsModalOpen(false)}><ChevronLeft size={24} className="text-gray-400" /></button>
            <h2 className="font-bold text-gray-900 text-lg">This Month</h2>
            <div className="w-8" />
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-32">
            {allMonthTx.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col"><span className="font-semibold text-gray-900">{tx.category}</span><span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                <div className="flex items-center space-x-4"><span className="font-bold text-gray-900">${tx.amount.toFixed(2)}</span><button onClick={() => handleDeleteTx(tx.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
