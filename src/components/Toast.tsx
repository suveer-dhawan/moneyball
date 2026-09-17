"use client";

import { Check, AlertCircle } from "lucide-react";
import type { ToastVariant } from "../hooks/useToast";

export default function Toast({ message, variant = "success" }: { message: string; variant?: ToastVariant }) {
  if (!message) return null;
  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[130] pointer-events-none px-4">
      <div className="bg-action text-fg-on-action px-5 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center gap-2 border border-gray-700/50">
        {variant === "success"
          ? <Check size={16} className="text-positive shrink-0" />
          : <AlertCircle size={16} className="text-negative shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
}
