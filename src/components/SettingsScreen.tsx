"use client";

import { useState } from "react";
import { Loader2, Plus, X, Monitor, Sun, Moon, Leaf } from "lucide-react";
import { createClient } from "../lib/supabase";
import ScreenHeader from "./ScreenHeader";
import BudgetInput from "./BudgetInput";
import ConfirmDialog from "./ConfirmDialog";
import IconButton from "./IconButton";
import { type ThemePreference } from "../hooks/useTheme";
import type { AppUser, Category, Budget } from "@/lib/types";

const supabase = createClient();

const MAX_PINS = 4;

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
  addCategory,
  deleteCategory,
  setBudget,
  themePreference,
  setThemePreference,
  pinnedNames,
  togglePin,
  isPinned,
}: {
  user: AppUser;
  categories: Category[];
  budgets: Budget[];
  addCategory: (name: string) => Promise<boolean>;
  deleteCategory: (cat: Category) => Promise<void>;
  setBudget: (category: string, value: string) => Promise<void>;
  themePreference: ThemePreference;
  setThemePreference: (p: ThemePreference) => void;
  pinnedNames: string[];
  togglePin: (name: string) => boolean;
  isPinned: (name: string) => boolean;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleLogout = async () => await supabase.auth.signOut();

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setIsAdding(true);
    if (await addCategory(name)) setNewCatName("");
    setIsAdding(false);
  };

  const confirmDeleteCategory = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    void deleteCategory(target);
  };

  const atLimit = pinnedNames.length >= MAX_PINS;

  return (
    <main>
      <ScreenHeader title="Settings" />
      <div className="pt-2 px-6 space-y-4">

        {/* 1. Appearance */}
        <div className="bg-surface-card p-6 rounded-3xl shadow-sm border border-line-default">
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

        {/* 2. Pinned Categories */}
        <div className="bg-surface-card p-6 rounded-3xl shadow-sm border border-line-default">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-semibold text-fg-base">Pinned Categories</h3>
            {atLimit && (
              <span className="text-xs font-semibold text-fg-muted">4/4</span>
            )}
          </div>
          <p className="text-xs text-fg-muted mb-4">Choose up to 4 categories for quick access on the Entry screen</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => togglePin(cat.name)}
                className={`px-3 py-2.5 rounded-2xl text-sm font-semibold text-left transition-all active:scale-[0.97] ${
                  isPinned(cat.name)
                    ? "bg-action text-fg-on-action shadow-sm"
                    : "border border-line-default text-fg-secondary"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Manage Categories & Budgets */}
        <div className="bg-surface-card rounded-3xl shadow-sm border border-line-default overflow-hidden">
          <div className="p-6 border-b border-line-default bg-surface/50">
            <h3 className="font-semibold text-fg-base mb-4">Manage Categories & Budgets</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                aria-label="New category name"
                placeholder="New category..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-grow bg-surface-card border border-line-default px-4 py-2 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
              <button
                type="button"
                aria-label="Add category"
                onClick={handleAddCategory}
                disabled={isAdding || !newCatName.trim()}
                className="min-h-11 bg-action text-fg-on-action px-4 rounded-xl active:scale-95 disabled:opacity-50"
              >
                {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {categories.map((cat) => {
              const currentBudget = budgets.find(b => b.category === cat.name)?.limit_amount?.toString() || '';
              return (
                <div key={cat.id} className="flex justify-between items-center p-3 rounded-xl">
                  <span className="text-sm font-medium text-fg-mid flex-1 pr-3 leading-tight break-words">{cat.name}</span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <BudgetInput initialValue={currentBudget} onSave={(val) => void setBudget(cat.name, val)} />
                    <IconButton label={`Delete ${cat.name}`} onClick={() => setDeleteTarget(cat)} className="text-delete-icon"><X size={16} /></IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Account */}
        <div className="bg-surface-card p-6 rounded-3xl shadow-sm border border-line-default">
          <p className="text-fg-secondary mb-6 text-sm">Account: <span className="font-semibold text-fg-base">{user.email}</span></p>
          <button onClick={handleLogout} className="w-full py-3 bg-destructive-bg text-destructive-fg rounded-xl font-semibold">Log Out</button>
        </div>

      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : ""}
        message="Past transactions in this category are kept - they just won't show up as a category to pick anymore."
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
