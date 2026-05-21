"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X } from "lucide-react";
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
import TopHeader from "./TopHeader";
import { computeMonthData, computeHistoricalData } from "../lib/insights";
import { INSIGHT_COLORS } from "../lib/constants";
import type { AppUser, Budget, Income, Transaction } from "@/lib/types";

export default function InsightsScreen({
  budgets,
  income,
  transactions,
}: {
  user: AppUser;
  budgets: Budget[];
  income: Income[];
  transactions: Transaction[];
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

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
        const groupName = tx.category.includes(' - ') ? tx.category.split(' - ')[0].trim() : tx.category;
        return matchesMonth && (tx.category === drillCategory || groupName === drillCategory);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [drillCategory, selectedDate, transactions]);

  const moveMonth = (offset: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + offset);
    setSelectedDate(d);
  };

  const { paceData, chartData, totalSpent, totalIncome, netSavings } = currentMonthData;
  const lastActual = paceData.actual.length > 0 ? paceData.actual[paceData.actual.length - 1] : null;
  const yDomainMax = (Math.max(paceData.budgetTotal, lastActual?.cumulative ?? 0) * 1.1) || 100;

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-surface pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-4 space-y-4">

        {/* SECTION 1: Month navigator */}
        <div className="flex items-center justify-between bg-surface-card border border-line-default rounded-full px-2 py-1.5">
          <button onClick={() => moveMonth(-1)} className="p-2 text-fg-muted hover:text-fg-base">
            <ChevronLeft size={18} />
          </button>
          <span suppressHydrationWarning className="text-sm font-semibold text-fg-base">
            {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => moveMonth(1)} className="p-2 text-fg-muted hover:text-fg-base">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* SECTION 2: Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Spent Card */}
          <div className="bg-surface-feature rounded-2xl border border-line-feature p-4 flex flex-col relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-surface-inset opacity-10 blur-2xl"></div>
            
            <span className="text-fg-on-feature-dim text-[10px] uppercase tracking-wider font-semibold mb-1 relative z-10">Total spent</span>
            <span className="text-3xl font-light text-fg-on-feature tracking-tight relative z-10">${totalSpent.toFixed(2)}</span>
            <span className="text-fg-on-feature-dim text-xs mt-1 relative z-10">of ${totalIncome.toFixed(2)} income</span>
          </div>

          {/* Savings Card */}
          <div className="bg-surface-feature rounded-2xl border border-line-feature p-4 flex flex-col relative overflow-hidden">
             {/* Dynamic glow based on positive/negative */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl ${netSavings < 0 ? 'bg-negative opacity-20' : 'bg-positive opacity-20'}`}></div>
            
            <span className="text-fg-on-feature-dim text-[10px] uppercase tracking-wider font-semibold mb-1 relative z-10">Net savings</span>
            <span className={`text-3xl font-light tracking-tight relative z-10 ${netSavings < 0 ? 'text-negative' : 'text-positive'}`}>
              {netSavings < 0 ? '-' : ''}${Math.abs(netSavings).toFixed(2)}
            </span>
            <span className="text-fg-on-feature-dim text-xs mt-1 relative z-10">{paceData.savingsRate.toFixed(1)}% savings rate</span>
          </div>
        </div>

        {/* SECTION 3: Pace chart */}
        <div className="bg-surface-card rounded-2xl border border-line-subtle p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-fg-base">Monthly pace</span>
            {paceData.currentDay > 0 && (
              <span className={`text-xs font-semibold ${paceData.onTrack ? 'text-positive' : 'text-negative'}`}>
                {paceData.onTrack ? 'On track' : 'Over pace'}
              </span>
            )}
          </div>
          {paceData.actual.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paceData.actual} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
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
                    tick={{ fontSize: 10, fill: 'var(--fg-muted)' }}
                  />
                  <YAxis hide domain={[0, yDomainMax]} />
                  <ReferenceLine
                    segment={[
                      { x: 1, y: 0 },
                      { x: paceData.daysInMonth, y: paceData.budgetTotal },
                    ]}
                    stroke={INSIGHT_COLORS.paceLine}
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                  />
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
                        value: `$${lastActual.cumulative.toFixed(0)}`,
                        position: 'top',
                        fontSize: 10,
                        fill: 'var(--fg-base)',
                      }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-fg-muted text-sm italic">
              No spending data
            </div>
          )}
        </div>

        {/* SECTION 4: Category spend bars */}
        <div className="bg-surface-card rounded-2xl border border-line-subtle p-4">
          <span className="text-fg-muted text-[10px] uppercase tracking-wider font-semibold block mb-3">
            Spending by category
          </span>
          {chartData.length > 0 ? (
            <div className="space-y-4">
              {chartData.map(item => {
                const hasSubs = Object.keys(item.subs).length > 1;
                const isExpanded = expandedGroups[item.name];
                const fillColor = INSIGHT_COLORS[item.budgetStatus];
                const barWidth = item.budgetPercent !== null
                  ? `${Math.min(item.budgetPercent, 100)}%`
                  : '100%';

                return (
                  <div key={item.name} className="flex flex-col">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        setDrillCategory(item.name);
                        if (hasSubs) setExpandedGroups(p => ({ ...p, [item.name]: !p[item.name] }));
                      }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-fg-mid truncate">{item.name}</span>
                        {item.budgetStatus === 'warning' && item.budgetPercent !== null && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--positive) 15%, transparent)',
                              color: INSIGHT_COLORS.warning,
                            }}
                          >
                            {item.budgetPercent.toFixed(0)}%
                          </span>
                        )}
                        {item.budgetStatus === 'over' && item.budgetPercent !== null && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--negative) 12%, transparent)',
                              color: 'var(--negative)',
                            }}
                          >
                            {item.budgetPercent.toFixed(0)}%
                          </span>
                        )}
                        {hasSubs && (isExpanded
                          ? <ChevronUp size={12} className="text-fg-muted shrink-0" />
                          : <ChevronDown size={12} className="text-fg-muted shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <span className="text-sm font-semibold text-fg-base">${item.value.toFixed(2)}</span>
                        <ChevronRight size={14} className="text-fg-muted" />
                      </div>
                    </div>
                    <div className="mt-1.5 w-full bg-surface-inset rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: barWidth, backgroundColor: fillColor }}
                      />
                    </div>
                    <span className="text-fg-muted text-[10px] mt-1">
                      {item.budgetLimit !== null ? `$${item.budgetLimit} budget` : 'No budget set'}
                    </span>
                    {hasSubs && isExpanded && (
                      <div className="mt-2 pl-3 space-y-2 border-l-2 border-line-subtle ml-1">
                        {Object.entries(item.subs).map(([subName, subValue]) => (
                          <div key={subName} className="flex justify-between items-center text-xs">
                            <span className="text-fg-secondary">{subName.split(' - ')[1] || subName}</span>
                            <span className="font-medium text-fg-mid">${(subValue as number).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-fg-muted text-sm italic text-center py-4">No data for this month.</p>
          )}
        </div>

        {/* SECTION 5: 6-month trend inline */}
        <div className="bg-surface-card rounded-2xl border border-line-subtle p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-fg-base">6-month trend</span>
          </div>
          
          {/* Increased height from h-20 to h-56 */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line-subtle)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--fg-muted)' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'var(--surface-inset)', opacity: 0.4 }}
                  formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, undefined]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--line-default)',
                    backgroundColor: 'var(--surface-card)',
                    color: 'var(--fg-base)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="Income" fill={INSIGHT_COLORS.incomeBar} radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={false} />
                <Bar dataKey="Spent" fill={INSIGHT_COLORS.spentBar} radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center space-x-6 mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-positive" />
              <span className="text-xs font-semibold text-fg-secondary">Income</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-fg-muted" />
              <span className="text-xs font-semibold text-fg-secondary">Spent</span>
            </div>
          </div>
        </div>

      </div>

      {/* CATEGORY DRILL-DOWN PANEL */}
      {drillCategory !== null && (() => {
        const drillItem = chartData.find(item => item.name === drillCategory);
        const drillTotal = drillItem?.value ?? 0;
        const drillBudgetLimit = drillItem?.budgetLimit ?? null;
        const isGroupCategory = drillItem ? Object.keys(drillItem.subs).length > 1 : false;
        return (
          <div className="fixed inset-0 z-[110] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrillCategory(null)}
            />
            <div className="relative bg-surface rounded-t-3xl max-h-[65vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
              {/* Panel header */}
              <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-line-subtle">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-fg-base truncate">{drillCategory}</h2>
                  {drillBudgetLimit !== null && (
                    <p className="text-xs text-fg-secondary mt-0.5">
                      spent ${drillTotal.toFixed(2)} of ${drillBudgetLimit} budget
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <span className="text-base font-semibold text-fg-base">${drillTotal.toFixed(2)}</span>
                  <button
                    onClick={() => setDrillCategory(null)}
                    className="p-1.5 text-fg-muted hover:text-fg-base"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              {/* Transaction list */}
              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 pb-[env(safe-area-inset-bottom)]">
                {drillTransactions.length > 0 ? drillTransactions.map(tx => {
                  const txDate = new Date(tx.date);
                  const dateLabel = txDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                  const showCategory = isGroupCategory && tx.category !== drillCategory;
                  const subLabel = showCategory ? (tx.category.split(' - ')[1] || tx.category) : null;
                  return (
                    <div
                      key={tx.id}
                      className="bg-surface-card rounded-xl border border-line-subtle p-3 flex items-center gap-3"
                    >
                      <span className="text-xs text-fg-muted w-12 shrink-0">{dateLabel}</span>
                      <div className="flex-1 min-w-0">
                        {subLabel && (
                          <p className="text-xs font-medium text-fg-mid truncate">{subLabel}</p>
                        )}
                        {tx.notes && (
                          <p className="text-xs text-fg-secondary truncate">{tx.notes}</p>
                        )}
                        {!subLabel && !tx.notes && (
                          <p className="text-xs text-fg-muted italic">No notes</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-fg-base shrink-0">${tx.amount.toFixed(2)}</span>
                    </div>
                  );
                }) : (
                  <p className="text-center text-fg-muted text-sm italic py-8">
                    No transactions for {drillCategory} this month.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      
    </main>
  );
}
