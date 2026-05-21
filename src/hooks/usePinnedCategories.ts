"use client";

import { useState } from "react";

const KEY = "moneyball-pinned-cats";
const MAX_PINS = 4;

export function usePinnedCategories() {
  const [pinnedNames, setPinnedNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  const togglePin = (categoryName: string): boolean => {
    if (pinnedNames.includes(categoryName)) {
      const next = pinnedNames.filter((n) => n !== categoryName);
      localStorage.setItem(KEY, JSON.stringify(next));
      setPinnedNames(next);
      return true;
    }
    if (pinnedNames.length >= MAX_PINS) return false;
    const next = [...pinnedNames, categoryName];
    localStorage.setItem(KEY, JSON.stringify(next));
    setPinnedNames(next);
    return true;
  };

  const isPinned = (categoryName: string) => pinnedNames.includes(categoryName);

  return { pinnedNames, togglePin, isPinned };
}
