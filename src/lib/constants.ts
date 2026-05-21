export const DEFAULT_CATEGORIES = [
  "Coffee", "Eating Out", "Groceries - Coles", "Groceries - Woolies",
  "Groceries - Aldi", "Transport - Uber", "Transport - Public",
  "Rent", "Bills", "Health", "Leisure", "Gym", "Gifts",
  "Flights", "Laundry", "Internet", "Misc"
];

export const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1'
];

export const INSIGHT_COLORS = {
  healthy: 'var(--positive)',
  warning: '#F59E0B',
  over: 'var(--negative)',
  none: 'var(--fg-muted)',
  paceActual: 'var(--positive)',
  paceLine: 'var(--fg-muted)',
  incomeBar: 'var(--positive)',
  spentBar: 'var(--fg-muted)',
} as const;
