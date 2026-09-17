"use client";

import { useRef, useState } from "react";
import { createClient } from "../lib/supabase";
import { DEFAULT_CATEGORIES } from "../lib/constants";
import type { Transaction, Category, Budget, Income } from "@/lib/types";

const supabase = createClient();

export function useAppData(userId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const seedingRef = useRef(false);

  const fetchData = async () => {
    setLoadingData(true);

    const [catRes, budRes, incRes, txRes] = await Promise.all([
      supabase.from('user_categories').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('budgets').select('*').eq('user_id', userId),
      supabase.from('income').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
    ]);

    if (catRes.error) {
      // Transient read failure - do NOT treat as "new user with no categories".
      // Seeding here would duplicate categories that already exist in the DB.
      console.error('Failed to fetch categories:', catRes.error);
      setLoadingData(false);
      return;
    }

    if (catRes.data.length > 0) {
      setCategories(catRes.data);
    } else if (seedingRef.current) {
      // A seed from a concurrent fetchData() call is already in flight; don't double-seed.
      setLoadingData(false);
      return;
    } else {
      seedingRef.current = true;
      const seedData = DEFAULT_CATEGORIES.map(name => ({ name, user_id: userId }));
      const { error: seedError } = await supabase
        .from('user_categories')
        .upsert(seedData, { onConflict: 'user_id,name', ignoreDuplicates: true });
      seedingRef.current = false;
      if (seedError) {
        console.error('Failed to seed default categories:', seedError);
        setLoadingData(false);
        return;
      }
      fetchData();
      return;
    }

    if (budRes.data) setBudgets(budRes.data);
    if (incRes.data) setIncome(incRes.data);
    if (txRes.data) setTransactions(txRes.data);

    setLoadingData(false);
  };

  return { categories, budgets, income, transactions, loadingData, fetchData };
}
