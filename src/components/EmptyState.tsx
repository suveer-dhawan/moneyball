/** Quiet placeholder for an empty list or chart, with an optional hint on what to do next. */
export default function EmptyState({
  title,
  hint,
  className = "",
}: {
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`py-8 text-center ${className}`}>
      <p className="text-sm font-medium text-fg-secondary">{title}</p>
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}
