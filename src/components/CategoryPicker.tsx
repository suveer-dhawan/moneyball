"use client";

import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import type { Category } from "@/lib/types";

interface CategoryPickerProps {
  categories: Category[];
  onSelect: (name: string) => void;
  onClose: () => void;
}

export default function CategoryPicker({ categories, onSelect, onClose }: CategoryPickerProps) {
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const results = categories.filter((c) => c.name.toLowerCase().includes(q));
      return [{ header: "Results", items: results }];
    }

    const groups: Record<string, Category[]> = {};
    for (const cat of categories) {
      const key = cat.name.includes(" - ") ? cat.name.split(" - ")[0].trim() : "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(cat);
    }

    const keys = Object.keys(groups).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });

    return keys.map((key) => ({ header: key, items: groups[key] }));
  }, [categories, search]);

  const isFlat = search.trim() !== "";

  const handleSelect = (name: string) => {
    onSelect(name);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[99] bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] bg-surface rounded-t-3xl shadow-2xl flex flex-col max-h-[60vh] animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-line-default" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="font-bold text-fg-base text-base">All Categories</h2>
          <button onClick={onClose} className="p-1 text-fg-muted">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center bg-surface-inset rounded-xl px-3 py-2 gap-2">
            <Search size={15} className="text-fg-muted shrink-0" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-fg-base text-[16px] flex-1 placeholder:text-fg-muted"
            />
          </div>
        </div>

        {/* Groups */}
        <div className="overflow-y-auto px-5 pb-8">
          {grouped.map(({ header, items }) => (
            <div key={header} className="mb-5">
              <p className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider mb-2">{header}</p>
              <div className="space-y-1">
                {items.map((cat) => {
                  const label =
                    !isFlat && header !== "Other" && cat.name.includes(" - ")
                      ? cat.name.split(" - ").slice(1).join(" - ")
                      : cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelect(cat.name)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-surface-card border border-line-subtle text-fg-base text-sm font-medium active:bg-surface-inset transition-colors"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {grouped.length === 1 && grouped[0].items.length === 0 && (
            <p className="text-center text-fg-muted text-sm italic py-8">No categories found.</p>
          )}
        </div>
      </div>
    </>
  );
}
