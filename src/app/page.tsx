"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase";
import LoginScreen from "../components/LoginScreen";
import MoneyballApp from "../components/MoneyballApp";
import { useTheme } from "../hooks/useTheme";
import type { AppUser } from "../lib/types";

const supabase = createClient();

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

  if (loading) return <div className="flex min-h-[100dvh] items-center justify-center bg-surface"><Loader2 className="animate-spin text-fg-muted" size={48} /></div>;
  if (!session) return <LoginScreen />;
  return <MoneyballApp user={session.user as AppUser} themePreference={preference} setThemePreference={setPreference} />;
}
