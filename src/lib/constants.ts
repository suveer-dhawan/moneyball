export const DEFAULT_CATEGORIES = [
  "Coffee", "Eating Out", "Groceries - Coles", "Groceries - Woolies",
  "Groceries - Aldi", "Transport - Uber", "Transport - Public",
  "Rent", "Bills", "Health", "Leisure", "Gym", "Gifts",
  "Flights", "Laundry", "Internet", "Misc"
];

export const INSIGHT_COLORS = {
  healthy: 'var(--positive)',
  warning: 'var(--warning)',
  over: 'var(--negative)',
  none: 'var(--fg-muted)',
  paceActual: 'var(--positive)',
  paceLine: 'var(--fg-muted)',
  incomePaceLine: 'var(--fg-mid)',
  incomeBar: 'var(--positive)',
  spentBar: 'var(--fg-mid)',
} as const;
