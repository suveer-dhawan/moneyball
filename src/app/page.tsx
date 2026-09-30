"use client";

import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase";
import LoginScreen from "../components/LoginScreen";
import MoneyballApp from "../components/MoneyballApp";
import { ToastProvider } from "../components/Toast";
import { useTheme } from "../hooks/useTheme";
import type { AppUser } from "../lib/types";

const supabase = createClient();

/** Placeholder matching the app's header and tab bar while the session is restored. */
function LaunchShell() {
  return (
    <div aria-busy="true" className="mx-auto min-h-dvh w-full max-w-md bg-surface">
      <span className="sr-only">Loading</span>
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center px-5">
          <div className="h-7 w-36 animate-pulse rounded-lg bg-surface-inset" />
        </div>
      </div>
      <div className="mx-4 mt-2 h-48 animate-pulse rounded-2xl bg-surface-card" />
      <div className="fixed inset-x-0 bottom-0 mx-auto h-[calc(max(env(safe-area-inset-bottom),8px)+54px)] w-full max-w-md border-t border-line-nav bg-nav-bar" />
    </div>
  );
}

export default function MoneyballWrapper() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { preference, setPreference } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LaunchShell />;
  return (
    <ToastProvider>
      {session
        ? <MoneyballApp user={session.user as AppUser} themePreference={preference} setThemePreference={setPreference} />
        : <LoginScreen />}
    </ToastProvider>
  );
}
