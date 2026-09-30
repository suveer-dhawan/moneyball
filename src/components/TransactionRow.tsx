"use client";

import { ChevronRight, Trash2 } from "lucide-react";
import IconButton from "./IconButton";

/** A money row (expense or income) with an optional tap-to-edit area and a delete button. */
export default function TransactionRow({
  title,
  subtitle,
  amount,
  tone = "default",
  onPress,
  onDelete,
  deleteLabel,
}: {
  title: string;
  subtitle?: string;
  /** Pre-formatted amount, e.g. formatAUD(tx.amount). */
  amount: string;
  tone?: "default" | "positive";
  onPress?: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const body = (
    <>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-semibold text-fg-base">{title}</span>
        {subtitle && <span className="truncate text-xs text-fg-secondary">{subtitle}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={`font-bold tabular-nums ${tone === "positive" ? "text-positive-fg" : "text-fg-base"}`}>{amount}</span>
        {onPress && <ChevronRight size={14} className="text-fg-muted" />}
      </div>
    </>
  );
  const bodyClass = "flex min-w-0 flex-1 items-center justify-between gap-3 p-4 text-left";

  return (
    <div className="flex items-stretch overflow-hidden rounded-2xl border border-line-subtle bg-surface-card shadow-sm">
      {onPress ? (
        <button type="button" onClick={onPress} className={`${bodyClass} transition-colors active:bg-pressed`}>
          {body}
        </button>
      ) : (
        <div className={bodyClass}>{body}</div>
      )}
      <IconButton
        label={deleteLabel}
        onClick={onDelete}
        className="rounded-none border-l border-line-subtle px-4 text-delete-icon"
      >
        <Trash2 size={18} />
      </IconButton>
    </div>
  );
}
