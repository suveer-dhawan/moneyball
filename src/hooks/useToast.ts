"use client";

import { useRef, useState } from "react";

export type ToastVariant = "success" | "error";

export function useToast() {
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<ToastVariant>("success");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, v: ToastVariant = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVariant(v);
    setMessage(msg);
    timerRef.current = setTimeout(() => setMessage(""), 2500);
  };

  return { message, variant, showToast };
}
