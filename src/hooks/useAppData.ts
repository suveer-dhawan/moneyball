"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createClient } from "../lib/supabase";
import { DEFAULT_CATEGORIES } from "../lib/constants";
import { formatAUD } from "../lib/format";
import { useToast, ACTION_TOAST_MS } from "./useToast";
import type { Transaction, Category, Budget, Income } from "@/lib/types";

const supabase = createClient();

type Dated = { id: string; date: string; created_at: string };
const byDateDesc = (a: Dated, b: Dated) =>
  b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at);

export interface TransactionInput {
  amount: number;
  category: string;
  notes: string;
  date: string;
}

export interface IncomeInput {
  amount: number;
  source: string;
  date: string;
}

interface PendingDelete {
  table: "transactions" | "income";
  id: string;
  restore: () => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Loads and mutates the signed-in user's data.
 * Saves wait for Supabase, then update local state from the returned row (no full refetch).
 * Deletes of transactions/income are optimistic with a 5s undo window.
 */
export function useAppData(userId: string) {
  const showToast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const pendingDelete = useRef<PendingDelete | null>(null);
  const lastCommit = useRef<Promise<void>>(Promise.resolve());

  const fetchData = useCallback(async () => {
    const [catRes, budRes, incRes, txRes] = await Promise.all([
      supabase.from('user_categories').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('budgets').select('*').eq('user_id', userId),
      supabase.from('income').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
    ]);

    if (catRes.error || budRes.error || incRes.error || txRes.error) {
      // Transient read failure - keep what's on screen. Never treat this as
      // "new user with no categories": seeding would duplicate existing ones.
      showToast("Couldn't load your data. Check your connection.", "error");
      setLoading(false);
      return;
    }

    let cats: Category[] = catRes.data;
    if (cats.length === 0) {
      // First load for a new account. The upsert is idempotent, so a
      // concurrent load can't double-seed.
      const seed = DEFAULT_CATEGORIES.map((name) => ({ name, user_id: userId }));
      const seedRes = await supabase
        .from('user_categories')
        .upsert(seed, { onConflict: 'user_id,name', ignoreDuplicates: true });
      const reread = seedRes.error
        ? null
        : await supabase.from('user_categories').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (!reread || reread.error) {
        showToast("Couldn't set up default categories.", "error");
      } else {
        cats = reread.data;
      }
    }

    setCategories(cats);
    setBudgets(budRes.data);
    setIncome(incRes.data);
    setTransactions(txRes.data);
    setLoading(false);
  }, [userId, showToast]);

  const commitDelete = useCallback(async (p: PendingDelete) => {
    const { error } = await supabase.from(p.table).delete().eq('id', p.id);
    if (error) {
      p.restore();
      showToast("Couldn't delete - it's been restored.", "error");
    }
  }, [showToast]);

  const flushPendingDelete = useCallback(() => {
    const p = pendingDelete.current;
    if (!p) return;
    clearTimeout(p.timer);
    pendingDelete.current = null;
    lastCommit.current = commitDelete(p);
  }, [commitDelete]);

  // fetchData only sets state after awaiting Supabase; the rule can't see through the await.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  // Going to the background commits any delete still in its undo window;
  // coming back refreshes quietly (after that delete lands).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushPendingDelete();
      else void lastCommit.current.then(fetchData);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      flushPendingDelete();
    };
  }, [fetchData, flushPendingDelete]);

  function deleteWithUndo<T extends Dated>(
    table: PendingDelete["table"],
    row: T,
    setRows: Dispatch<SetStateAction<T[]>>,
    label: string,
  ) {
    flushPendingDelete();
    setRows((rows) => rows.filter((r) => r.id !== row.id));
    const restore = () =>
      setRows((rows) => (rows.some((r) => r.id === row.id) ? rows : [...rows, row].sort(byDateDesc)));
    const pending: PendingDelete = {
      table,
      id: row.id,
      restore,
      timer: setTimeout(() => {
        if (pendingDelete.current !== pending) return;
        pendingDelete.current = null;
        lastCommit.current = commitDelete(pending);
      }, ACTION_TOAST_MS),
    };
    pendingDelete.current = pending;
    showToast(`Deleted ${label}`, "success", {
      label: "Undo",
      onAction: () => {
        if (pendingDelete.current !== pending) return;
        clearTimeout(pending.timer);
        pendingDelete.current = null;
        restore();
      },
    });
  }

  /** Inserts, or updates when `id` is given. Returns false (after showing an error) on failure. */
  const saveTransaction = async (input: TransactionInput, id?: string): Promise<boolean> => {
    const { data, error } = id
      ? await supabase.from('transactions').update(input).eq('id', id).select().single()
      : await supabase.from('transactions').insert({ ...input, user_id: userId }).select().single();
    if (error || !data) {
      showToast(error?.message ?? "Couldn't save.", "error");
      return false;
    }
    const saved = data as Transaction;
    setTransactions((rows) => [...rows.filter((r) => r.id !== saved.id), saved].sort(byDateDesc));
    return true;
  };

  const saveIncome = async (input: IncomeInput): Promise<boolean> => {
    const { data, error } = await supabase
      .from('income')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error || !data) {
      showToast(error?.message ?? "Couldn't save.", "error");
      return false;
    }
    setIncome((rows) => [...rows, data as Income].sort(byDateDesc));
    return true;
  };

  const deleteTransaction = (tx: Transaction) =>
    deleteWithUndo("transactions", tx, setTransactions, `${tx.category} ${formatAUD(tx.amount)}`);

  const deleteIncome = (inc: Income) =>
    deleteWithUndo("income", inc, setIncome, `${inc.source} ${formatAUD(inc.amount)}`);

  const addCategory = async (name: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_categories')
      .insert({ name, user_id: userId })
      .select()
      .single();
    if (error || !data) {
      showToast(error?.code === '23505' ? `"${name}" already exists.` : error?.message ?? "Couldn't add category.", "error");
      return false;
    }
    setCategories((rows) => [...rows, data as Category]);
    return true;
  };

  const deleteCategory = async (cat: Category): Promise<void> => {
    const { error } = await supabase.from('user_categories').delete().eq('id', cat.id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setCategories((rows) => rows.filter((r) => r.id !== cat.id));
  };

  /** Sets a category's monthly limit; an empty value removes it. */
  const setBudget = async (category: string, value: string): Promise<void> => {
    if (!value.trim()) {
      const { error } = await supabase.from('budgets').delete().match({ user_id: userId, category });
      if (error) showToast(error.message, "error");
      else setBudgets((rows) => rows.filter((b) => b.category !== category));
      return;
    }
    const { data, error } = await supabase
      .from('budgets')
      .upsert({ user_id: userId, category, limit_amount: parseFloat(value) }, { onConflict: 'user_id, category' })
      .select()
      .single();
    if (error || !data) {
      showToast(error?.message ?? "Couldn't save budget.", "error");
      return;
    }
    setBudgets((rows) => [...rows.filter((b) => b.category !== category), data as Budget]);
  };

  return {
    categories,
    budgets,
    income,
    transactions,
    loading,
    saveTransaction,
    saveIncome,
    deleteTransaction,
    deleteIncome,
    addCategory,
    deleteCategory,
    setBudget,
  };
}

export type AppData = ReturnType<typeof useAppData>;
