"use client";

import { Home, Wallet, PieChart as PieChartIcon, Settings } from "lucide-react";

export default function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full bg-nav-bar backdrop-blur-md border-t border-line-nav pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 px-6 flex justify-around items-center z-50">
      <button onClick={() => setActiveTab("add")} className={`flex flex-col items-center space-y-1 ${activeTab === "add" ? "text-nav-active" : "text-nav-inactive"}`}>
        <Home size={24} className={activeTab === "add" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Entry</span>
      </button>
      <button onClick={() => setActiveTab("income")} className={`flex flex-col items-center space-y-1 ${activeTab === "income" ? "text-nav-active" : "text-nav-inactive"}`}>
        <Wallet size={24} className={activeTab === "income" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Income</span>
      </button>
      <button onClick={() => setActiveTab("summary")} className={`flex flex-col items-center space-y-1 ${activeTab === "summary" ? "text-nav-active" : "text-nav-inactive"}`}>
        <PieChartIcon size={24} className={activeTab === "summary" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Insights</span>
      </button>
      <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center space-y-1 ${activeTab === "settings" ? "text-nav-active" : "text-nav-inactive"}`}>
        <Settings size={24} className={activeTab === "settings" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Settings</span>
      </button>
    </nav>
  );
}
