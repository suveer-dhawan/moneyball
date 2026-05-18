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

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("moneyball-theme") as ThemePreference) ?? "system";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = resolve(preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { document.documentElement.dataset.theme = resolve("system"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setPreference = (pref: ThemePreference) => {
    localStorage.setItem("moneyball-theme", pref);
    setPreferenceState(pref);
  };

  return { preference, setPreference };
}
