"use client";

/** Icon-only button with a 44x44px minimum hit area and a required accessible name. */
export default function IconButton({
  label,
  className = "",
  children,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl transition-colors active:bg-pressed disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
