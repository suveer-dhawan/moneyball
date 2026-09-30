"use client";

import { useCallback, useRef, useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import {
  ToastContext,
  TOAST_MS,
  ACTION_TOAST_MS,
  type ShowToast,
  type ToastAction,
  type ToastVariant,
} from "../hooks/useToast";

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback<ShowToast>((message, variant = "success", action) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    idRef.current += 1;
    setToast({ id: idRef.current, message, variant, action });
    timerRef.current = setTimeout(() => setToast(null), action ? ACTION_TOAST_MS : TOAST_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* The live region stays mounted so screen readers announce each new message. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+8px)] z-[130] flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            className={`flex max-w-md items-center gap-2 rounded-full bg-action px-5 py-3 text-sm font-medium text-fg-on-action shadow-lg animate-toast-in ${
              toast.action ? "pointer-events-auto" : ""
            }`}
          >
            {toast.variant === "success"
              ? <Check size={16} className="shrink-0" />
              : <AlertCircle size={16} className="shrink-0" />}
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => { toast.action?.onAction(); dismiss(); }}
                className="-my-2 -mr-2 ml-1 min-h-11 rounded-full px-3 font-semibold underline underline-offset-2"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
