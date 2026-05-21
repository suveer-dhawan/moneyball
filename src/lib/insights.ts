import type { Transaction, Income } from "@/lib/types";

export interface ChartItem {
  name: string;
  value: number;
  subs: Record<string, number>;
}

export interface MonthData {
  totalSpent: number;
  totalIncome: number;
  netSavings: number;
  chartData: ChartItem[];
}

export interface HistoricalEntry {
  month: string;
  Spent: number;
  Income: number;
}

export function computeMonthData(
  selectedDate: Date,
  transactions: Transaction[],
  income: Income[]
): MonthData {
  const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

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
    const groupName = tx.category.includes(" - ")
      ? tx.category.split(" - ")[0].trim()
      : tx.category;
    if (!grouped[groupName]) grouped[groupName] = { total: 0, subs: {} };
    grouped[groupName].total += tx.amount;
    grouped[groupName].subs[tx.category] = (grouped[groupName].subs[tx.category] || 0) + tx.amount;
  });

  const totalIncome = monthInc.reduce((s, i) => s + i.amount, 0);
  const netSavings = totalIncome - totalSpent;

  const chartData = Object.keys(grouped)
    .map(key => ({ name: key, value: grouped[key].total, subs: grouped[key].subs }))
    .sort((a, b) => b.value - a.value);

  return { totalSpent, totalIncome, netSavings, chartData };
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
