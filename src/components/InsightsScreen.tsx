"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceDot,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import ScreenHeader from "./ScreenHeader";
import Sheet from "./Sheet";
import IconButton from "./IconButton";
import EmptyState from "./EmptyState";
import { computeMonthData, computeHistoricalData, type ChartItem } from "../lib/insights";
import { INSIGHT_COLORS } from "../lib/constants";
import { formatAUD, formatAUDCompact } from "@/lib/format";
import { getCategoryGroup, getCategorySubLabel } from "@/lib/categoryGroups";
import type { Budget, Income, Transaction } from "@/lib/types";

const AXIS_TICK = { fontSize: 12, fill: 'var(--fg-muted)' };

function BudgetBadge({ item }: { item: ChartItem }) {
  if (item.budgetPercent === null || (item.budgetStatus !== 'warning' && item.budgetStatus !== 'over')) return null;
  const tone = item.budgetStatus === 'over' ? 'bg-negative-tint text-negative-fg' : 'bg-warning-tint text-warning';
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${tone}`}>
      {item.budgetPercent.toFixed(0)}%
    </span>
  );
}

const ROW_CLASS = "-mx-2 flex flex-col rounded-xl px-2 py-1.5 text-left transition-colors active:bg-pressed";

function AmountLink({ value, hidden = false }: { value: number; hidden?: boolean }) {
  // `hidden` renders an invisible copy that reserves space under the overlaid amount button.
  return (
    <span aria-hidden={hidden || undefined} className={`flex shrink-0 items-center gap-1 ${hidden ? "invisible" : ""}`}>
      <span className="text-sm font-semibold text-fg-base tabular-nums">{formatAUD(value)}</span>
      <ChevronRight size={14} className="text-fg-muted" />
    </span>
  );
}

function CategoryRowBody({ item, expanded, trailing }: { item: ChartItem; expanded?: boolean; trailing: React.ReactNode }) {
  const barWidth = item.budgetPercent !== null ? `${Math.min(item.budgetPercent, 100)}%` : '100%';
  return (
    <>
      <span className="flex w-full items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium text-fg-mid">{item.name}</span>
          <BudgetBadge item={item} />
          {expanded !== undefined && (
            <ChevronDown size={16} className={`shrink-0 text-fg-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
          )}
        </span>
        {trailing}
      </span>
      <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-surface-inset">
        <span
          className="block h-1.5 rounded-full transition-[width] duration-500"
          style={{ width: barWidth, backgroundColor: INSIGHT_COLORS[item.budgetStatus] }}
        />
      </span>
      <span className="mt-1 text-xs text-fg-muted">
        {item.budgetLimit !== null ? `${formatAUD(item.budgetLimit)} budget` : 'No budget set'}
      </span>
    </>
  );
}

export default function InsightsScreen({
  budgets,
  income,
  transactions,
}: {
  budgets: Budget[];
  income: Income[];
  transactions: Transaction[];
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  // Kept after closing so the sheet's content survives its exit animation.
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [drillOpen, setDrillOpen] = useState(false);

  const currentMonthData = useMemo(
    () => computeMonthData(selectedDate, transactions, income, budgets),
    [selectedDate, transactions, income, budgets]
  );

  const historicalData = useMemo(
    () => computeHistoricalData(transactions, income),
    [transactions, income]
  );

  const drillTransactions = useMemo(() => {
    if (!drillCategory) return [];
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
    return transactions
      .filter(tx => {
        const d = new Date(tx.date);
        const matchesMonth = d >= start && d <= end;
        return matchesMonth && (tx.category === drillCategory || getCategoryGroup(tx.category) === drillCategory);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [drillCategory, selectedDate, transactions]);

  const now = new Date();
  const isCurrentMonth = selectedDate.getFullYear() === now.getFullYear() && selectedDate.getMonth() === now.getMonth();

  const moveMonth = (offset: number) => {
    // Day 1 avoids rollover (e.g. Jan 31 + 1 month landing in March).
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1));
  };

  const openDrill = (name: string) => {
    setDrillCategory(name);
    setDrillOpen(true);
  };

  const { paceData, chartData, totalSpent, totalIncome, netSavings, savingsRate } = currentMonthData;
  const lastActual = paceData.actual.length > 0 ? paceData.actual[paceData.actual.length - 1] : null;
  const yDomainMax = (Math.max(paceData.baseline, lastActual?.cumulative ?? 0) * 1.1) || 100;

  const drillItem = chartData.find(item => item.name === drillCategory);
  const drillTotal = drillItem?.value ?? 0;
  const drillBudgetLimit = drillItem?.budgetLimit ?? null;
  const isGroupCategory = drillItem ? Object.keys(drillItem.subs).length > 1 : false;

  const monthSwitcher = (
    <div className="-mr-3 flex items-center">
      <IconButton label="Previous month" onClick={() => moveMonth(-1)} className="text-fg-secondary">
        <ChevronLeft size={20} />
      </IconButton>
      <span suppressHydrationWarning aria-live="polite" className="min-w-[4.75rem] text-center text-sm font-semibold text-fg-base">
        {selectedDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
      </span>
      <IconButton label="Next month" onClick={() => moveMonth(1)} disabled={isCurrentMonth} className="text-fg-secondary">
        <ChevronRight size={20} />
      </IconButton>
    </div>
  );

  return (
    <main>
      <ScreenHeader title="Insights" trailing={monthSwitcher} />
      <div className="space-y-4 px-4 pb-6 pt-2">

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Spent</span>
            <span className="text-2xl font-semibold tracking-tight text-fg-base tabular-nums">{formatAUD(totalSpent)}</span>
            <span className="mt-1 text-xs text-fg-secondary">
              {totalIncome > 0 ? `of ${formatAUD(totalIncome)} income` : "No income logged"}
            </span>
          </div>
          <div className="flex flex-col rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Saved</span>
            <span className={`text-2xl font-semibold tracking-tight tabular-nums ${netSavings < 0 ? 'text-negative-fg' : 'text-positive-fg'}`}>
              {formatAUD(netSavings)}
            </span>
            <span className="mt-1 text-xs text-fg-secondary">
              {savingsRate !== null ? `${savingsRate.toFixed(0)}% of income` : "Log income to see savings"}
            </span>
          </div>
        </div>

        <section className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg-base">Monthly pace</h2>
            {paceData.currentDay > 0 && paceData.onTrack !== null && (
              <span className={`text-xs font-semibold ${paceData.onTrack ? 'text-positive-fg' : 'text-negative-fg'}`}>
                {paceData.onTrack ? 'On track' : 'Over pace'}
              </span>
            )}
          </div>
          {paceData.actual.length > 0 ? (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={paceData.actual} margin={{ top: 20, right: 12, left: 12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={INSIGHT_COLORS.paceActual} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={INSIGHT_COLORS.paceActual} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      type="number"
                      domain={[1, paceData.daysInMonth]}
                      ticks={[1, 10, 20, paceData.daysInMonth]}
                      axisLine={false}
                      tickLine={false}
                      tick={AXIS_TICK}
                    />
                    <YAxis hide domain={[0, yDomainMax]} />
                    {paceData.baselineKind && (
                      <ReferenceLine
                        segment={[
                          { x: 1, y: 0 },
                          { x: paceData.daysInMonth, y: paceData.baseline },
                        ]}
                        stroke={INSIGHT_COLORS.paceLine}
                        strokeDasharray="4 3"
                        strokeWidth={1.5}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke={INSIGHT_COLORS.paceActual}
                      strokeWidth={2}
                      fill="url(#paceGradient)"
                      dot={false}
                      isAnimationActive={false}
                    />
                    {lastActual && paceData.currentDay > 0 && (
                      <ReferenceDot
                        x={lastActual.day}
                        y={lastActual.cumulative}
                        r={4}
                        fill={INSIGHT_COLORS.paceActual}
                        stroke="var(--surface-card)"
                        strokeWidth={2}
                        label={{
                          value: formatAUDCompact(lastActual.cumulative),
                          position: 'top',
                          fontSize: 12,
                          fill: 'var(--fg-base)',
                        }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full bg-positive" />Spent so far
                </span>
                {paceData.baselineKind ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t-2 border-dashed border-fg-muted" />
                    {paceData.baselineKind === 'budget' ? 'Budget' : 'Income'} pace ({formatAUD(paceData.baseline)})
                  </span>
                ) : (
                  <span>Set budgets or log income to see your pace</span>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="Nothing to chart for this month" className="flex h-48 flex-col justify-center" />
          )}
        </section>

        <section className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">Spending by category</h2>
          {chartData.length > 0 ? (
            <ul className="space-y-3">
              {chartData.map(item => {
                const hasSubs = Object.keys(item.subs).length > 1;
                const isExpanded = !!expandedGroups[item.name];
                const subsId = `subs-${item.name}`;

                return (
                  <li key={item.name}>
                    {hasSubs ? (
                      // Groups: the row expands the breakdown; the amount opens the transactions.
                      <div className="relative">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={subsId}
                          onClick={() => setExpandedGroups(p => ({ ...p, [item.name]: !p[item.name] }))}
                          className={`${ROW_CLASS} w-[calc(100%+1rem)]`}
                        >
                          <CategoryRowBody item={item} expanded={isExpanded} trailing={<AmountLink value={item.value} hidden />} />
                        </button>
                        <button
                          type="button"
                          aria-label={`View ${item.name} transactions, ${formatAUD(item.value)}`}
                          onClick={() => openDrill(item.name)}
                          className="absolute -right-2 top-0 flex min-h-11 items-start rounded-xl px-2 pt-1.5 transition-colors active:bg-pressed"
                        >
                          <AmountLink value={item.value} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openDrill(item.name)}
                        className={`${ROW_CLASS} w-[calc(100%+1rem)]`}
                      >
                        <CategoryRowBody item={item} trailing={<AmountLink value={item.value} />} />
                      </button>
                    )}
                    {hasSubs && isExpanded && (
                      <ul id={subsId} className="ml-1 mt-2 space-y-2 border-l-2 border-line-subtle pl-3">
                        {Object.entries(item.subs).map(([subName, subValue]) => (
                          <li key={subName} className="flex items-center justify-between text-xs">
                            <span className="text-fg-secondary">{getCategorySubLabel(subName)}</span>
                            <span className="font-medium text-fg-mid tabular-nums">{formatAUD(subValue)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No spending this month" hint="Expenses you log will be grouped here by category." />
          )}
        </section>

        <section className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-fg-base">6-month trend</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line-subtle)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={10} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'var(--surface-inset)', opacity: 0.4 }}
                  formatter={(value, name) => [formatAUD(Number(value ?? 0)), name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--line-default)',
                    backgroundColor: 'var(--surface-card)',
                    color: 'var(--fg-base)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'var(--fg-secondary)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="Income" fill={INSIGHT_COLORS.incomeBar} radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={false} />
                <Bar dataKey="Spent" fill={INSIGHT_COLORS.spentBar} radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex justify-center gap-6">
            <span className="flex items-center gap-2 text-xs font-semibold text-fg-secondary">
              <span className="h-3 w-3 rounded-full bg-positive" />Income
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold text-fg-secondary">
              <span className="h-3 w-3 rounded-full bg-fg-mid" />Spent
            </span>
          </div>
        </section>
      </div>

      <Sheet
        open={drillOpen}
        onClose={() => setDrillOpen(false)}
        title={drillCategory ?? ""}
        description={drillBudgetLimit !== null ? `${formatAUD(drillTotal)} of ${formatAUD(drillBudgetLimit)} budget` : undefined}
        trailing={<span className="pt-0.5 text-base font-semibold text-fg-base tabular-nums">{formatAUD(drillTotal)}</span>}
      >
        <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain border-t border-line-subtle px-4 py-3">
          {drillTransactions.length > 0 ? drillTransactions.map(tx => {
            const dateLabel = new Date(tx.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
            const subLabel = isGroupCategory && tx.category !== drillCategory ? getCategorySubLabel(tx.category) : null;
            return (
              <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface-card p-3">
                <span className="w-12 shrink-0 text-xs text-fg-muted">{dateLabel}</span>
                <div className="min-w-0 flex-1">
                  {subLabel && <p className="truncate text-xs font-medium text-fg-mid">{subLabel}</p>}
                  {tx.notes && <p className="truncate text-xs text-fg-secondary">{tx.notes}</p>}
                  {!subLabel && !tx.notes && <p className="text-xs text-fg-muted">No note</p>}
                </div>
                <span className="shrink-0 text-sm font-semibold text-fg-base tabular-nums">{formatAUD(tx.amount)}</span>
              </div>
            );
          }) : (
            <EmptyState title={`No ${drillCategory} transactions this month`} />
          )}
        </div>
      </Sheet>
    </main>
  );
}
