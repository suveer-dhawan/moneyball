"use client";

import { useState, useEffect } from "react";
import { useAppData } from "../hooks/useAppData";
import { type ThemePreference } from "../hooks/useTheme";
import BottomNav from "./BottomNav";
import EntryScreen from "./EntryScreen";
import IncomeScreen from "./IncomeScreen";
import InsightsScreen from "./InsightsScreen";
import SettingsScreen from "./SettingsScreen";

export default function MoneyballApp({ user, themePreference, setThemePreference }: {
  user: any;
  themePreference: ThemePreference;
  setThemePreference: (p: ThemePreference) => void;
}) {
  const [activeTab, setActiveTab] = useState("add");
  const { categories, budgets, income, transactions, loadingData, fetchData } = useAppData(user.id);

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="bg-surface min-h-[100dvh]">
      {activeTab === "add" && <EntryScreen user={user} categories={categories} loadingCats={loadingData} transactions={transactions} fetchData={fetchData} />}
      {activeTab === "income" && <IncomeScreen user={user} income={income} fetchData={fetchData} />}
      {activeTab === "summary" && <InsightsScreen user={user} budgets={budgets} income={income} transactions={transactions} />}
      {activeTab === "settings" && <SettingsScreen user={user} categories={categories} budgets={budgets} fetchData={fetchData} themePreference={themePreference} setThemePreference={setThemePreference} />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
