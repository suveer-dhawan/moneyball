"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase";
import { DEFAULT_CATEGORIES } from "../lib/constants";

const supabase = createClient();

export function useAppData(userId: string) {
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = async () => {
    setLoadingData(true);

    const [catRes, budRes, incRes, txRes] = await Promise.all([
      supabase.from('user_categories').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('budgets').select('*').eq('user_id', userId),
      supabase.from('income').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
    ]);

    if (catRes.data && catRes.data.length > 0) {
      setCategories(catRes.data);
    } else {
      const seedData = DEFAULT_CATEGORIES.map(name => ({ name, user_id: userId }));
      const { error: seedError } = await supabase.from('user_categories').insert(seedData);
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
