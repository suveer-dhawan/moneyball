"use client";

import { useState } from "react";
import { Loader2, Plus, X, Pin, Monitor, Sun, Moon, Leaf } from "lucide-react";
import { createClient } from "../lib/supabase";
import ScreenHeader from "./ScreenHeader";
import BudgetInput from "./BudgetInput";
import ConfirmDialog from "./ConfirmDialog";
import IconButton from "./IconButton";
import { MAX_PINS } from "../hooks/usePinnedCategories";
import { type ThemePreference } from "../hooks/useTheme";
import type { AppUser, Category, Budget } from "@/lib/types";

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
  setBudget: (category: string, value: string) => Promise<boolean>;
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name || isAdding) return;
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
      <div className="space-y-4 px-4 pb-6 pt-2">

        <section className="rounded-2xl border border-line-subtle bg-surface-card p-5 shadow-sm">
          <h2 id="theme-heading" className="mb-3 font-semibold text-fg-base">Appearance</h2>
          <div role="radiogroup" aria-labelledby="theme-heading" className="flex gap-1 rounded-xl bg-surface-inset p-1">
            {THEME_OPTIONS.map(({ value, label, Icon }) => {
              const selected = themePreference === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setThemePreference(value)}
                  className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors ${
                    selected ? "bg-surface-card text-fg-base shadow-sm" : "text-fg-muted"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-line-subtle bg-surface-card shadow-sm">
          <div className="border-b border-line-subtle p-5">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 className="font-semibold text-fg-base">Categories</h2>
              <span className="text-xs font-semibold text-fg-muted tabular-nums">
                {pinnedNames.length}/{MAX_PINS} pinned
              </span>
            </div>
            <p className="mb-4 text-xs text-fg-secondary">
              {atLimit
                ? `You've pinned ${MAX_PINS}. Unpin one to pin another.`
                : `Pin up to ${MAX_PINS} for quick access on the Entry screen. Budgets are monthly and optional.`}
            </p>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                aria-label="New category name"
                placeholder="New category"
                enterKeyHint="done"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-line-default bg-surface-card px-4 text-[16px] text-fg-base placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
              <button
                type="submit"
                aria-label="Add category"
                disabled={isAdding || !newCatName.trim()}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-action px-3 text-fg-on-action transition-opacity active:opacity-80 disabled:opacity-40"
              >
                {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </form>
          </div>

          <ul className="divide-y divide-line-subtle">
            {categories.map((cat) => {
              const pinned = isPinned(cat.name);
              const currentBudget = budgets.find(b => b.category === cat.name)?.limit_amount?.toString() ?? "";
              return (
                <li key={cat.id} className="flex items-center gap-1 py-2 pl-5 pr-2">
                  <span className="min-w-0 flex-1 break-words pr-1 text-sm font-medium leading-tight text-fg-mid">{cat.name}</span>
                  <IconButton
                    label={`Pin ${cat.name}`}
                    aria-pressed={pinned}
                    disabled={!pinned && atLimit}
                    onClick={() => togglePin(cat.name)}
                    className={pinned ? "text-fg-base" : "text-delete-icon"}
                  >
                    <Pin size={18} fill={pinned ? "currentColor" : "none"} />
                  </IconButton>
                  <BudgetInput
                    categoryName={cat.name}
                    initialValue={currentBudget}
                    onSave={(val) => setBudget(cat.name, val)}
                  />
                  <IconButton label={`Delete ${cat.name}`} onClick={() => setDeleteTarget(cat)} className="text-delete-icon">
                    <X size={18} />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-line-subtle bg-surface-card p-5 shadow-sm">
          <p className="mb-4 text-sm text-fg-secondary">
            Signed in as <span className="font-semibold text-fg-base">{user.email}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-11 w-full rounded-xl bg-destructive-bg font-semibold text-destructive-fg transition-opacity active:opacity-80"
          >
            Log out
          </button>
        </section>

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
