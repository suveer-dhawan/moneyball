"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import TopHeader from "./TopHeader";
import { computeMonthData, computeHistoricalData } from "../lib/insights";
import { CHART_COLORS } from "../lib/constants";

export default function InsightsScreen({
  budgets,
  income,
  transactions,
}: {
  user: any;
  budgets: any[];
  income: any[];
  transactions: any[];
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const currentMonthData = useMemo(
    () => computeMonthData(selectedDate, transactions, income),
    [selectedDate, transactions, income]
  );

  const historicalData = useMemo(
    () => computeHistoricalData(transactions, income),
    [transactions, income]
  );

  const moveMonth = (offset: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + offset);
    setSelectedDate(d);
  };

  const renderProgressBar = (categoryName: string, amountSpent: number, barColor: string) => {
    const limitObj = budgets.find(b => b.category === categoryName);
    const limit = limitObj ? limitObj.limit_amount : null;
    if (!limit) return null;
    const percent = Math.min((amountSpent / limit) * 100, 100);
    const isOver = amountSpent > limit;
    const finalColor = isOver ? '#EF4444' : percent >= 80 ? '#F59E0B' : barColor;
    return (
      <div className="w-full mt-2">
        <div className="flex justify-between mb-1 text-[10px] text-gray-400 font-medium">
          <span>{percent.toFixed(0)}% used</span>
          <span>${limit} limit</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: finalColor }}></div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50 pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">

        {/* DUAL DASHBOARD */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-900 p-5 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden border border-slate-800">
            <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-blue-500/20 blur-2xl"></div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 relative z-10">Total Spent</span>
            <span className="text-3xl font-light text-white tracking-tighter relative z-10">
              ${currentMonthData.totalSpent.toFixed(2)}
            </span>
          </div>

          <div className="bg-gray-900 p-5 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden border border-gray-800">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl ${currentMonthData.netSavings < 0 ? 'bg-red-500/15' : 'bg-emerald-500/20'}`}></div>
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1 relative z-10">Net Savings</span>
            <span className={`text-3xl font-light tracking-tighter relative z-10 ${currentMonthData.netSavings < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {currentMonthData.netSavings < 0 ? '-' : ''}${Math.abs(currentMonthData.netSavings).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="text-center mb-8">
          <span className="text-sm text-gray-500">
            Monthly Income: <span className="text-gray-800 font-semibold">${currentMonthData.totalIncome.toFixed(2)}</span>
          </span>
        </div>

        {/* TIME MACHINE & TRENDS BUTTON */}
        <div className="flex items-center justify-between mb-8 bg-white p-2 rounded-2xl border shadow-sm">
          <button onClick={() => moveMonth(-1)} className="p-2 text-gray-400 hover:text-black"><ChevronLeft size={20} /></button>
          <div className="flex flex-col items-center">
            <span suppressHydrationWarning className="text-sm font-bold text-gray-900">
              {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center">
            <button onClick={() => setIsTrendsOpen(true)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg mr-1"><TrendingUp size={20} /></button>
            <button onClick={() => moveMonth(1)} className="p-2 text-gray-400 hover:text-black"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* DONUT CHART */}
        {currentMonthData.chartData.length > 0 ? (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="h-64 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={currentMonthData.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {currentMonthData.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${Number(value || 0).toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {currentMonthData.chartData.map((item, index) => {
                const hasSubs = Object.keys(item.subs).length > 1;
                const isExpanded = expandedGroups[item.name];
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return (
                  <div key={item.name} className="flex flex-col text-sm border-b border-gray-50 pb-3 last:border-0">
                    <div className={`flex justify-between items-center ${hasSubs ? 'cursor-pointer' : ''}`} onClick={() => hasSubs && setExpandedGroups(p => ({ ...p, [item.name]: !p[item.name] }))}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <span className="font-medium text-gray-700">{item.name}</span>
                        {hasSubs && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </div>
                      <span className="font-semibold text-gray-900">${item.value.toFixed(2)}</span>
                    </div>
                    {renderProgressBar(item.name, item.value, color)}
                    {hasSubs && isExpanded && (
                      <div className="mt-3 pl-5 space-y-3 border-l-2 border-gray-100 ml-1.5">
                        {Object.entries(item.subs).map(([subName, subValue]) => (
                          <div key={subName} className="flex flex-col">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">{subName.split(" - ")[1] || subName}</span>
                              <span className="font-medium text-gray-700">${(subValue as number).toFixed(2)}</span>
                            </div>
                            {renderProgressBar(subName, subValue as number, color)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : <div className="text-center p-8 bg-white rounded-3xl border text-gray-400 italic">No data for this month.</div>}
      </div>

      {/* TRENDS MODAL */}
      {isTrendsOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom-full duration-300">
          <header className="flex justify-between items-center px-6 py-4 bg-white border-b">
            <button onClick={() => setIsTrendsOpen(false)}><ChevronLeft size={24} className="text-gray-400" /></button>
            <h2 className="font-bold text-gray-900 text-lg">Spending Trends</h2>
            <div className="w-8" />
          </header>
          <div className="p-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border mb-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">Last 6 Months</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Spent" fill="#9ca3af" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs font-bold text-gray-600">Income</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-gray-400"></div><span className="text-xs font-bold text-gray-600">Spent</span></div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 px-6">Compare your monthly cashflow. Keeping your gray bars below your green bars is the key to wealth building.</p>
          </div>
        </div>
      )}
    </main>
  );
}
