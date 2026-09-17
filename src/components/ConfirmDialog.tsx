"use client";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-surface rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-line-default" />
        </div>
        <div className="px-6 pt-2 pb-6">
          <h2 className="text-base font-bold text-fg-base mb-1">{title}</h2>
          {message && <p className="text-sm text-fg-secondary mb-6">{message}</p>}
          <div className="flex gap-3 mt-2">
            <button
              onClick={onCancel}
              className="flex-1 bg-surface-inset text-fg-secondary py-3.5 rounded-2xl font-bold active:scale-[0.98] border border-line-default"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3.5 rounded-2xl font-bold active:scale-[0.98] ${
                destructive ? "bg-destructive-bg text-destructive-fg" : "bg-action text-fg-on-action"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
