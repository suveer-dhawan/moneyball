"use client";

import { useState, useEffect } from "react";
import { useAppData } from "../hooks/useAppData";
import { usePinnedCategories } from "../hooks/usePinnedCategories";
import { type ThemePreference } from "../hooks/useTheme";
import type { AppUser } from "@/lib/types";
import BottomNav from "./BottomNav";
import EntryScreen from "./EntryScreen";
import IncomeScreen from "./IncomeScreen";
import InsightsScreen from "./InsightsScreen";
import SettingsScreen from "./SettingsScreen";

export default function MoneyballApp({ user, themePreference, setThemePreference }: {
  user: AppUser;
  themePreference: ThemePreference;
  setThemePreference: (p: ThemePreference) => void;
}) {
  const [activeTab, setActiveTab] = useState("add");
  const { categories, budgets, income, transactions, loadingData, fetchData } = useAppData(user.id);
  const { pinnedNames, togglePin, isPinned } = usePinnedCategories();

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="bg-surface min-h-[100dvh]">
      {activeTab === "add" && <EntryScreen user={user} categories={categories} loadingCats={loadingData} transactions={transactions} fetchData={fetchData} pinnedNames={pinnedNames} />}
      {activeTab === "income" && <IncomeScreen user={user} income={income} fetchData={fetchData} />}
      {activeTab === "summary" && <InsightsScreen user={user} budgets={budgets} income={income} transactions={transactions} />}
      {activeTab === "settings" && <SettingsScreen user={user} categories={categories} budgets={budgets} fetchData={fetchData} themePreference={themePreference} setThemePreference={setThemePreference} pinnedNames={pinnedNames} togglePin={togglePin} isPinned={isPinned} />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
