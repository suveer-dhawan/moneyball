"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createClient } from "../lib/supabase";
import TopHeader from "./TopHeader";
import BudgetInput from "./BudgetInput";

const supabase = createClient();

export default function SettingsScreen({
  user,
  categories,
  budgets,
  fetchData,
}: {
  user: any;
  categories: any[];
  budgets: any[];
  fetchData: () => void;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleLogout = async () => await supabase.auth.signOut();

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsAdding(true);
    const { error } = await supabase.from('user_categories').insert({ name: newCatName.trim(), user_id: user.id });
    if (!error) { setNewCatName(""); fetchData(); }
    setIsAdding(false);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      await supabase.from('user_categories').delete().eq('id', id);
      fetchData();
    }
  };

  const handleSetBudget = async (categoryName: string, value: string) => {
    if (!value || value.trim() === "") {
      const { error } = await supabase.from('budgets').delete().match({ user_id: user.id, category: categoryName });
      if (!error) fetchData();
      return;
    }
    const { error } = await supabase.from('budgets').upsert(
      { user_id: user.id, category: categoryName, limit_amount: parseFloat(value) },
      { onConflict: 'user_id, category' }
    );
    if (!error) fetchData();
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50 pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-6">
          <div className="p-6 border-b bg-gray-50/50">
            <h3 className="font-semibold text-gray-900 mb-4">Manage Categories & Budgets</h3>
            <div className="flex space-x-2">
              <input type="text" placeholder="New category..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="flex-grow bg-white border px-4 py-2 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-black" />
              <button onClick={handleAddCategory} disabled={isAdding || !newCatName.trim()} className="bg-black text-white p-2 px-4 rounded-xl active:scale-95 disabled:opacity-50">
                {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {categories.map((cat) => {
              const currentBudget = budgets.find(b => b.category === cat.name)?.limit_amount?.toString() || '';
              return (
                <div key={cat.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <span className="text-sm font-medium text-gray-700 flex-1 pr-3 leading-tight break-words">{cat.name}</span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <BudgetInput initialValue={currentBudget} onSave={(val) => handleSetBudget(cat.name, val)} />
                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-gray-300 hover:text-red-500 p-2"><X size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-gray-500 mb-6 text-sm">Account: <span className="font-semibold text-gray-900">{user.email}</span></p>
          <button onClick={handleLogout} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold">Log Out</button>
        </div>
      </div>
    </main>
  );
}
