"use client";

import { Target } from "lucide-react";

export default function TopHeader({ rightNode }: { rightNode?: React.ReactNode }) {
  return (
    <div className="sticky z-50 w-full px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 flex justify-center pointer-events-none">
      <header className="flex items-center space-x-2 px-6 py-3 bg-nav-header backdrop-blur-md rounded-full shadow-xl pointer-events-auto">
        <Target size={18} className="text-brand" />
        <h1 className="text-sm font-bold tracking-widest uppercase text-fg-on-feature">Moneyball</h1>
        {rightNode}
      </header>
    </div>
  );
}
