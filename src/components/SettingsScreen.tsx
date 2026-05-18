"use client";

import { useState } from "react";
import { Loader2, Plus, X, Monitor, Sun, Moon, Leaf } from "lucide-react";
import { createClient } from "../lib/supabase";
import TopHeader from "./TopHeader";
import BudgetInput from "./BudgetInput";
import { type ThemePreference } from "../hooks/useTheme";

const supabase = createClient();

const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: React.ElementType }[] = [
  { value: "system", label: "Auto",  Icon: Monitor },
  { value: "light",  label: "Light", Icon: Sun },
  { value: "dark",   label: "Dark",  Icon: Moon },
  { value: "warm",   label: "Warm",  Icon: Leaf },
];

export default function SettingsScreen({
  user,
  categories,
  budgets,
  fetchData,
  themePreference,
  setThemePreference,
}: {
  user: any;
  categories: any[];
  budgets: any[];
  fetchData: () => void;
  themePreference: ThemePreference;
  setThemePreference: (p: ThemePreference) => void;
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
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-surface pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-surface-card rounded-3xl shadow-sm border border-line-default overflow-hidden mb-6">
          <div className="p-6 border-b border-line-default bg-surface/50">
            <h3 className="font-semibold text-fg-base mb-4">Manage Categories & Budgets</h3>
            <div className="flex space-x-2">
              <input type="text" placeholder="New category..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="flex-grow bg-surface-card border border-line-default px-4 py-2 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-focus-ring" />
              <button onClick={handleAddCategory} disabled={isAdding || !newCatName.trim()} className="bg-action text-fg-on-action p-2 px-4 rounded-xl active:scale-95 disabled:opacity-50">
                {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {categories.map((cat) => {
              const currentBudget = budgets.find(b => b.category === cat.name)?.limit_amount?.toString() || '';
              return (
                <div key={cat.id} className="flex justify-between items-center p-3 hover:bg-surface rounded-xl transition-colors">
                  <span className="text-sm font-medium text-fg-mid flex-1 pr-3 leading-tight break-words">{cat.name}</span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <BudgetInput initialValue={currentBudget} onSave={(val) => handleSetBudget(cat.name, val)} />
                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-delete-icon hover:text-red-500 p-2"><X size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-surface-card p-6 rounded-3xl shadow-sm border border-line-default mb-6">
          <h3 className="font-semibold text-fg-base mb-4">Appearance</h3>
          <div className="flex rounded-2xl bg-surface-inset p-1 gap-1">
            {THEME_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setThemePreference(value)}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-xl text-[11px] font-semibold transition-all ${
                  themePreference === value
                    ? "bg-surface-card text-fg-base shadow-sm"
                    : "text-fg-muted"
                }`}
              >
                <Icon size={15} className="mb-1" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-surface-card p-6 rounded-3xl shadow-sm border border-line-default">
          <p className="text-fg-secondary mb-6 text-sm">Account: <span className="font-semibold text-fg-base">{user.email}</span></p>
          <button onClick={handleLogout} className="w-full py-3 bg-destructive-bg text-destructive-fg rounded-xl font-semibold">Log Out</button>
        </div>
      </div>
    </main>
  );
}
