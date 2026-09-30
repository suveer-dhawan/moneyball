import type { Transaction, Income, Budget } from "@/lib/types";
import { getCategoryGroup, hasCategoryGroup, isSubCategoryOf } from "@/lib/categoryGroups";

export interface ChartItem {
  name: string;
  value: number;
  subs: Record<string, number>;
  budgetLimit: number | null;
  budgetPercent: number | null;
  budgetStatus: 'healthy' | 'warning' | 'over' | 'none';
}

export interface MonthData {
  totalSpent: number;
  totalIncome: number;
  netSavings: number;
  /** Share of income saved, or null when no income was logged. */
  savingsRate: number | null;
  chartData: ChartItem[];
  paceData: {
    actual: { day: number; cumulative: number }[];
    /** Month-end target the pace line climbs to: total budgets, else income, else 0. */
    baseline: number;
    baselineKind: 'budget' | 'income' | null;
    daysInMonth: number;
    currentDay: number;
    /** null when there is no baseline to compare against. */
    onTrack: boolean | null;
  };
}

export interface HistoricalEntry {
  month: string;
  Spent: number;
  Income: number;
}

/**
 * Sum of monthly limits. A limit on a group ("Groceries") covers its items, so
 * item limits ("Groceries - Aldi") are only counted when their group has none.
 */
export function totalBudget(budgets: Budget[]): number {
  const groupsWithLimit = new Set(budgets.filter(b => !hasCategoryGroup(b.category)).map(b => b.category));
  return budgets
    .filter(b => !(hasCategoryGroup(b.category) && groupsWithLimit.has(getCategoryGroup(b.category))))
    .reduce((sum, b) => sum + b.limit_amount, 0);
}

export function computeMonthData(
  selectedDate: Date,
  transactions: Transaction[],
  income: Income[],
  budgets: Budget[]
): MonthData {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const monthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d >= start && d <= end;
  });

  const monthInc = income.filter(inc => {
    const d = new Date(inc.date);
    return d >= start && d <= end;
  });

  let totalSpent = 0;
  const grouped: Record<string, { total: number; subs: Record<string, number> }> = {};
  monthTx.forEach(tx => {
    totalSpent += tx.amount;
    const groupName = getCategoryGroup(tx.category);
    if (!grouped[groupName]) grouped[groupName] = { total: 0, subs: {} };
    grouped[groupName].total += tx.amount;
    grouped[groupName].subs[tx.category] = (grouped[groupName].subs[tx.category] || 0) + tx.amount;
  });

  const totalIncome = monthInc.reduce((s, i) => s + i.amount, 0);
  const netSavings = totalIncome - totalSpent;

  const chartData = Object.keys(grouped)
    .map(key => {
      const value = grouped[key].total;
      const budgetEntry = budgets.find(b => b.category === key);
      let budgetLimit = budgetEntry ? budgetEntry.limit_amount : null;
      if (budgetLimit === null) {
        // No budget set directly on the group name itself (e.g. "Groceries") -
        // fall back to summing budgets set on its sub-categories
        // (e.g. "Groceries - Aldi", "Groceries - Coles").
        const subBudgets = budgets.filter(b => isSubCategoryOf(b.category, key));
        if (subBudgets.length > 0) {
          budgetLimit = subBudgets.reduce((sum, b) => sum + b.limit_amount, 0);
        }
      }
      const budgetPercent = budgetLimit !== null ? (value / budgetLimit) * 100 : null;
      let budgetStatus: ChartItem['budgetStatus'] = 'none';
      if (budgetPercent !== null) {
        if (budgetPercent > 100) budgetStatus = 'over';
        else if (budgetPercent >= 80) budgetStatus = 'warning';
        else budgetStatus = 'healthy';
      }
      return { name: key, value, subs: grouped[key].subs, budgetLimit, budgetPercent, budgetStatus };
    })
    .sort((a, b) => b.value - a.value);

  // Pace data
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const isFutureMonth = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const currentDay = isFutureMonth ? 0 : isCurrentMonth ? today.getDate() : daysInMonth;

  const actual: { day: number; cumulative: number }[] = [];
  let cumulative = 0;
  for (let day = 1; day <= currentDay; day++) {
    const daySpend = monthTx
      .filter(tx => new Date(tx.date).getDate() === day)
      .reduce((s, tx) => s + tx.amount, 0);
    cumulative += daySpend;
    actual.push({ day, cumulative });
  }

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : null;

  const budgetTotal = totalBudget(budgets);
  const baselineKind = budgetTotal > 0 ? 'budget' : totalIncome > 0 ? 'income' : null;
  const baseline = baselineKind === 'budget' ? budgetTotal : baselineKind === 'income' ? totalIncome : 0;
  const actualAtCurrentDay = actual.length > 0 ? actual[actual.length - 1].cumulative : 0;
  const expectedPace = (baseline / daysInMonth) * currentDay;
  const onTrack = baselineKind === null ? null : actualAtCurrentDay <= expectedPace;

  return {
    totalSpent,
    totalIncome,
    netSavings,
    savingsRate,
    chartData,
    paceData: {
      actual,
      baseline,
      baselineKind,
      daysInMonth,
      currentDay,
      onTrack,
    },
  };
}

export function computeHistoricalData(transactions: Transaction[], income: Income[]): HistoricalEntry[] {
  const data: HistoricalEntry[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const monthSpent = transactions
      .filter(tx => { const t = new Date(tx.date); return t >= start && t <= end; })
      .reduce((s, t) => s + t.amount, 0);
    const monthIncome = income
      .filter(inc => { const t = new Date(inc.date); return t >= start && t <= end; })
      .reduce((s, i) => s + i.amount, 0);

    data.push({
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      Spent: monthSpent,
      Income: monthIncome,
    });
  }
  return data;
}
