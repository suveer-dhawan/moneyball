"use client";

import { useState } from "react";
import { Loader2, Target } from "lucide-react";
import { createClient } from "../lib/supabase";
import { useToast } from "../hooks/useToast";

const supabase = createClient();

type Action = "login" | "signup";

interface Errors {
  email?: string;
  password?: string;
  form?: string;
}

const FIELD =
  "min-h-12 w-full rounded-xl border bg-surface-card px-4 text-[16px] text-fg-base placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-focus-ring";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<Action | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const showToast = useToast();

  const handleAuth = async (action: Action) => {
    const next: Errors = {};
    if (!email.trim()) next.email = "Enter your email.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (next.email || next.password) return;

    setPending(action);
    const { error } = action === "signup"
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPending(null);

    if (error) {
      setErrors({ form: error.message });
    } else if (action === "signup") {
      showToast("Account created. Check your email if verification is required.");
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <Target size={32} className="mb-4 text-brand" />
      <h1 className="text-3xl font-bold tracking-tight text-fg-base">Moneyball</h1>
      <p className="mb-8 mt-1 text-sm text-fg-secondary">Sign in to see your budget.</p>

      <form noValidate onSubmit={(e) => { e.preventDefault(); void handleAuth("login"); }} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-fg-mid">Email</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${FIELD} ${errors.email ? "border-negative-fg" : "border-line-default"}`}
          />
          {errors.email && <p id="email-error" className="mt-1.5 text-xs text-negative-fg">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-fg-mid">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`${FIELD} ${errors.password ? "border-negative-fg" : "border-line-default"}`}
          />
          {errors.password && <p id="password-error" className="mt-1.5 text-xs text-negative-fg">{errors.password}</p>}
        </div>

        {errors.form && (
          <p role="alert" className="rounded-xl bg-destructive-bg px-4 py-3 text-sm text-destructive-fg">{errors.form}</p>
        )}

        <button
          type="submit"
          disabled={pending !== null}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-action font-semibold text-fg-on-action transition-opacity active:opacity-80 disabled:opacity-60"
        >
          {pending === "login" ? <Loader2 size={20} className="animate-spin" /> : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void handleAuth("signup")}
        disabled={pending !== null}
        className="mt-3 min-h-11 w-full rounded-xl text-sm font-semibold text-fg-secondary transition-colors active:bg-pressed disabled:opacity-60"
      >
        {pending === "signup" ? "Creating account..." : "Create an account"}
      </button>
    </main>
  );
}
