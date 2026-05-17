"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase";

const supabase = createClient();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (action: 'login' | 'signup') => {
    if (!email || !password) return alert("Please enter both email and password.");
    setIsLoading(true);
    try {
      if (action === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 p-6 max-w-md mx-auto shadow-2xl">
      <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Moneyball</h1>
        <p className="text-gray-500 mb-8 text-sm">Sign in to sync your budget.</p>
        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-gray-900" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-gray-900" />
        </div>
        <div className="mt-8 space-y-3">
          <button onClick={() => handleAuth('login')} disabled={isLoading} className="w-full bg-black text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-all disabled:opacity-50">Sign In</button>
          <button onClick={() => handleAuth('signup')} disabled={isLoading} className="w-full bg-white text-black border border-gray-200 py-3 rounded-xl font-semibold active:bg-gray-50 transition-all disabled:opacity-50">Create Account</button>
        </div>
      </div>
    </main>
  );
}
