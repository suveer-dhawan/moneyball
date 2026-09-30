"use client";

import { useState, useMemo } from "react";
import { Delete, PenLine, Loader2, LayoutGrid } from "lucide-react";
import ScreenHeader from "./ScreenHeader";
import CategoryPicker from "./CategoryPicker";
import DateChip from "./DateChip";
import TransactionRow from "./TransactionRow";
import EmptyState from "./EmptyState";
import Sheet from "./Sheet";
import IconButton from "./IconButton";
import { useToast } from "../hooks/useToast";
import type { TransactionInput } from "../hooks/useAppData";
import { getCategorySubLabel } from "@/lib/categoryGroups";
import { toLocalDateStr } from "@/lib/dates";
import { formatAUD } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function EntryScreen({
  categories,
  loading,
  transactions,
  saveTransaction,
  deleteTransaction,
  pinnedNames,
}: {
  categories: Category[];
  loading: boolean;
  transactions: Transaction[];
  saveTransaction: (input: TransactionInput, id?: string) => Promise<boolean>;
  deleteTransaction: (tx: Transaction) => void;
  pinnedNames: string[];
}) {
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const showToast = useToast();
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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

  const resetForm = () => {
    setEditingTransaction(null);
    setAmount("0");
    setCategory("");
    setNote("");
    setSelectedDate(toLocalDateStr(new Date()));
  };

  const startEditing = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAmount(tx.amount.toString());
    setCategory(tx.category);
    setNote(tx.notes ?? "");
    setSelectedDate(toLocalDateStr(new Date(tx.date)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePress = (val: string) => {
    if (amount === "0" && val !== ".") setAmount(val);
    else if (val === "." && amount.includes(".")) return;
    else {
      const parts = amount.split(".");
      if (parts.length === 2 && parts[1].length >= 2 && val !== ".") return;
      setAmount((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setAmount((prev) => (prev.length === 1 ? "0" : prev.slice(0, -1)));
  };

  const handleSave = async () => {
    if (saving) return;
    const numAmount = parseFloat(amount);
    if (!numAmount || !category) {
      showToast("Enter an amount and select a category.", "error");
      return;
    }
    setSaving(true);
    const ok = await saveTransaction(
      { amount: numAmount, category, notes: note, date: new Date(selectedDate + "T12:00:00").toISOString() },
      editingTransaction?.id,
    );
    setSaving(false);
    if (!ok) return;
    showToast(`${editingTransaction ? "Updated" : "Saved"} ${formatAUD(numAmount)} \u00b7 ${category}`);
    resetForm();
  };

  const handleDelete = (tx: Transaction) => {
    if (editingTransaction?.id === tx.id) resetForm();
    deleteTransaction(tx);
  };

  const renderRow = (tx: Transaction, onPress: () => void) => (
    <TransactionRow
      key={tx.id}
      title={tx.category}
      subtitle={`${shortDate(tx.date)}${tx.notes ? ` \u2022 ${tx.notes}` : ""}`}
      amount={formatAUD(tx.amount)}
      onPress={onPress}
      onDelete={() => handleDelete(tx)}
      deleteLabel={`Delete ${tx.category} ${formatAUD(tx.amount)}`}
    />
  );

  return (
    <main>
      <ScreenHeader title={editingTransaction ? "Edit expense" : "Add expense"} />

      <div className="mx-4 mt-2 flex flex-col items-center justify-center rounded-2xl bg-surface-card px-6 py-6 shadow-sm">
        <p className="mb-4 text-6xl font-light tracking-tighter text-fg-base">${amount}</p>
        <div className="mb-4 flex w-full justify-center space-x-3">
          <DateChip value={selectedDate} onChange={setSelectedDate} />
          <div className="flex items-center space-x-1.5 bg-surface-inset px-4 py-2 rounded-full text-sm font-medium text-fg-secondary focus-within:ring-2 focus-within:ring-focus-ring">
            <PenLine size={16} /><input type="text" aria-label="Note" placeholder="Note..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-transparent outline-none w-20 focus:w-32 transition-all text-fg-base" />
          </div>
        </div>
        <p className="text-fg-muted font-medium text-sm h-5">{category ? <span className="text-fg-base bg-surface-inset px-3 py-1 rounded-md">{category}</span> : "Select category"}</p>
      </div>

      {/* Pinned category row */}
      <div className="flex items-center gap-2 py-3 px-4 min-h-[60px]">
        {loading ? (
          <Loader2 className="animate-spin text-fg-muted mx-auto" />
        ) : pinnedCategories.length === 0 ? (
          <>
            <span className="text-xs text-fg-muted flex-1 leading-tight">Pin categories in Settings for quick access</span>
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold bg-surface-card text-fg-secondary border border-line-default shrink-0 active:bg-pressed"
            >
              <LayoutGrid size={16} />
              <span>All</span>
            </button>
          </>
        ) : (
          <>
            {pinnedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.name)}
                aria-pressed={category === cat.name}
                className={`whitespace-nowrap px-3 py-2 rounded-2xl text-sm font-semibold transition-all active:scale-[0.97] ${
                  category === cat.name
                    ? "bg-action text-fg-on-action shadow-md"
                    : "bg-surface-card text-fg-secondary border border-line-default active:bg-pressed"
                }`}
              >
                {getCategorySubLabel(cat.name)}
              </button>
            ))}
            <IconButton
              label="All categories"
              onClick={() => setIsPickerOpen(true)}
              className="ml-auto bg-surface-inset text-fg-secondary"
            >
              <LayoutGrid size={16} />
            </IconButton>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 px-6 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button key={num} type="button" onClick={() => handlePress(num.toString())} className="flex items-center justify-center bg-surface-card text-3xl font-normal text-fg-base rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">{num}</button>
        ))}
        <button type="button" aria-label="Decimal point" onClick={() => handlePress(".")} className="flex items-center justify-center bg-surface-card text-3xl font-normal text-fg-base rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">.</button>
        <button type="button" onClick={() => handlePress("0")} className="flex items-center justify-center bg-surface-card text-3xl font-normal text-fg-base rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">0</button>
        <button type="button" aria-label="Backspace" onClick={handleBackspace} className="flex items-center justify-center bg-surface-inset text-fg-secondary rounded-2xl shadow-sm h-[64px] active:bg-gray-300 transition-colors"><Delete size={24} /></button>
      </div>

      <div className="px-6 pb-6">
        <div className="flex gap-3">
          {editingTransaction && (
            <button type="button" onClick={resetForm} className="flex-1 bg-surface-inset text-fg-secondary py-4 rounded-2xl text-lg font-bold shadow-sm active:scale-[0.98] border border-line-default">Cancel</button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex flex-[2] items-center justify-center bg-action text-fg-on-action py-4 rounded-2xl text-lg font-bold shadow-lg active:scale-[0.98] disabled:opacity-70"
          >
            {saving ? <Loader2 size={24} className="animate-spin" /> : editingTransaction ? "Update Entry" : "Save Entry"}
          </button>
        </div>
      </div>

      <section className="px-6">
        <h2 className="text-sm font-semibold text-fg-muted mb-3 uppercase tracking-wider">Recent Activity</h2>
        <div className="space-y-3">
          {recentTx.length === 0
            ? <EmptyState title="No expenses yet" hint="Enter an amount, pick a category and tap Save." />
            : recentTx.map((tx) => renderRow(tx, () => startEditing(tx)))}
          {recentTx.length > 0 && (
            <button type="button" onClick={() => setIsMonthOpen(true)} className="w-full min-h-11 text-center text-sm font-semibold text-fg-secondary">
              View all this month
            </button>
          )}
        </div>
      </section>

      <CategoryPicker
        open={isPickerOpen}
        categories={categories}
        onSelect={setCategory}
        onClose={() => setIsPickerOpen(false)}
      />

      <Sheet open={isMonthOpen} onClose={() => setIsMonthOpen(false)} title="This month" className="h-[85dvh]">
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-6">
          {allMonthTx.length === 0
            ? <EmptyState title="Nothing logged this month" />
            : allMonthTx.map((tx) => renderRow(tx, () => { setIsMonthOpen(false); startEditing(tx); }))}
        </div>
      </Sheet>
    </main>
  );
}
