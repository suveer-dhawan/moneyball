"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "../lib/supabase";
import LoginScreen from "../components/LoginScreen";
import MoneyballApp from "../components/MoneyballApp";

const supabase = createClient();

export default function MoneyballWrapper() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" size={48} /></div>;
  if (!session) return <LoginScreen />;
  return <MoneyballApp user={session.user} />;
}
