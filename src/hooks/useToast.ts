"use client";

import { createContext, useContext } from "react";

export type ToastVariant = "success" | "error";

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export type ShowToast = (message: string, variant?: ToastVariant, action?: ToastAction) => void;

export const TOAST_MS = 2500;
/** Toasts with an action (e.g. Undo) stay up longer; undo windows use the same duration. */
export const ACTION_TOAST_MS = 5000;

export const ToastContext = createContext<ShowToast | null>(null);

export function useToast(): ShowToast {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error("useToast must be used inside <ToastProvider>");
  return showToast;
}
