"use client";

import { useState, useEffect } from "react";

export type ThemePreference = "system" | "light" | "dark" | "warm";
export type ResolvedTheme = "light" | "dark" | "warm";

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return pref;
}

// Sets data-theme and points every theme-color meta tag at the theme's surface,
// overriding the media-scoped defaults from layout.tsx.
function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const surface = getComputedStyle(root).getPropertyValue("--surface").trim();
  if (!surface) return;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", surface));
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("moneyball-theme") as ThemePreference) ?? "system";
  });

  useEffect(() => {
    applyTheme(resolve(preference));
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(resolve("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setPreference = (pref: ThemePreference) => {
    localStorage.setItem("moneyball-theme", pref);
    setPreferenceState(pref);
  };

  return { preference, setPreference };
}
