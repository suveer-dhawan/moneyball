const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

const audCompact = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** $1,234.50 - use for every displayed amount. */
export function formatAUD(n: number): string {
  return aud.format(n);
}

/** $1.2K - for chart labels and other tight spaces. */
export function formatAUDCompact(n: number): string {
  return audCompact.format(n);
}
