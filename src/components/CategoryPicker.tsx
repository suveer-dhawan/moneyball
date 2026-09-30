"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { hasCategoryGroup, getCategoryGroup, getCategorySubLabel } from "@/lib/categoryGroups";
import type { Category } from "@/lib/types";
import Sheet from "./Sheet";
import EmptyState from "./EmptyState";

interface CategoryPickerProps {
  open: boolean;
  categories: Category[];
  onSelect: (name: string) => void;
  onClose: () => void;
}

export default function CategoryPicker({ open, categories, onSelect, onClose }: CategoryPickerProps) {
  const [search, setSearch] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  // Start each opening with an empty search.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSearch("");
  }

  const grouped = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const results = categories.filter((c) => c.name.toLowerCase().includes(q));
      return [{ header: "Results", items: results }];
    }

    const groups: Record<string, Category[]> = {};
    for (const cat of categories) {
      const key = hasCategoryGroup(cat.name) ? getCategoryGroup(cat.name) : "Other";
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
    <Sheet open={open} onClose={onClose} title="All categories" className="h-[70dvh]">
      <div className="shrink-0 px-5 pb-3">
        <label className="flex items-center gap-2 rounded-xl bg-surface-inset px-3 py-2 focus-within:ring-2 focus-within:ring-focus-ring">
          <Search size={16} className="shrink-0 text-fg-muted" />
          <input
            type="search"
            aria-label="Search categories"
            placeholder="Search categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[16px] text-fg-base outline-none placeholder:text-fg-muted"
          />
        </label>
      </div>

      <div className="overflow-y-auto overscroll-contain px-5 pb-8">
        {grouped.map(({ header, items }) => items.length > 0 && (
          <section key={header} className="mb-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">{header}</h3>
            <div className="space-y-1">
              {items.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.name)}
                  className="w-full rounded-xl border border-line-subtle bg-surface-card px-4 py-3 text-left text-sm font-medium text-fg-base transition-colors active:bg-pressed"
                >
                  {!isFlat && header !== "Other" ? getCategorySubLabel(cat.name) : cat.name}
                </button>
              ))}
            </div>
          </section>
        ))}
        {grouped.every((g) => g.items.length === 0) && (
          <EmptyState title="No matching categories" hint="Add new categories in Settings." />
        )}
      </div>
    </Sheet>
  );
}
