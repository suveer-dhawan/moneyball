"use client";

import { PlusCircle, Wallet, PieChart, Settings } from "lucide-react";
import type { Tab } from "@/lib/types";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "add", label: "Entry", Icon: PlusCircle },
  { id: "income", label: "Income", Icon: Wallet },
  { id: "insights", label: "Insights", Icon: PieChart },
  { id: "settings", label: "Settings", Icon: Settings },
];

export default function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-md justify-around border-t border-line-nav bg-nav-bar px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur-md"
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl ${
              active ? "text-nav-active" : "text-nav-inactive"
            }`}
          >
            <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            <span className="text-xs font-semibold">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
