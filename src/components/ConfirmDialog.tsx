"use client";

import { useState } from "react";
import Sheet from "./Sheet";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Keep the last text while the sheet animates out, after the caller clears its target.
  const [shown, setShown] = useState({ title, message });
  if (open && (shown.title !== title || shown.message !== message)) setShown({ title, message });

  return (
    <Sheet open={open} onClose={onCancel} title={shown.title} description={shown.message} showClose={false}>
      <div className="flex gap-3 px-5 pb-6 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-line-default bg-surface-inset py-3.5 font-bold text-fg-secondary transition-colors active:bg-pressed"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`flex-1 rounded-2xl py-3.5 font-bold active:opacity-80 ${
            destructive ? "bg-destructive-bg text-destructive-fg" : "bg-action text-fg-on-action"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
