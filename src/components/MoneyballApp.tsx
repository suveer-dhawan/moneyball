"use client";

import { useState } from "react";
import { useAppData } from "../hooks/useAppData";
import { usePinnedCategories } from "../hooks/usePinnedCategories";
import { type ThemePreference } from "../hooks/useTheme";
import type { AppUser, Tab } from "@/lib/types";
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
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const data = useAppData(user.id);
  const { pinnedNames, togglePin, isPinned } = usePinnedCategories();

  return (
    // Bottom padding clears the fixed tab bar (~54px) plus the home indicator.
    <div className="mx-auto min-h-dvh w-full max-w-md bg-surface pb-[calc(max(env(safe-area-inset-bottom),8px)+72px)]">
      {activeTab === "add" && (
        <EntryScreen
          categories={data.categories}
          loading={data.loading}
          transactions={data.transactions}
          saveTransaction={data.saveTransaction}
          deleteTransaction={data.deleteTransaction}
          pinnedNames={pinnedNames}
        />
      )}
      {activeTab === "income" && (
        <IncomeScreen income={data.income} saveIncome={data.saveIncome} deleteIncome={data.deleteIncome} />
      )}
      {activeTab === "insights" && (
        <InsightsScreen budgets={data.budgets} income={data.income} transactions={data.transactions} />
      )}
      {activeTab === "settings" && (
        <SettingsScreen
          user={user}
          categories={data.categories}
          budgets={data.budgets}
          addCategory={data.addCategory}
          deleteCategory={data.deleteCategory}
          setBudget={data.setBudget}
          themePreference={themePreference}
          setThemePreference={setThemePreference}
          pinnedNames={pinnedNames}
          togglePin={togglePin}
          isPinned={isPinned}
        />
      )}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
