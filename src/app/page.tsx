"use client";

import { useState, useEffect, useMemo } from "react";
import { Delete, Check, Calendar, PenLine, Home, PieChart as PieChartIcon, Settings, Loader2, Trash2, Plus, X, ChevronDown, ChevronUp, Target, ChevronLeft, Wallet, TrendingUp, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { createClient } from "../lib/supabase";

const DEFAULT_CATEGORIES = [
  "Coffee", "Eating Out", "Groceries - Coles", "Groceries - Woolies", 
  "Groceries - Aldi", "Transport - Uber", "Transport - Public", 
  "Rent", "Bills", "Health", "Leisure", "Gym", "Gifts", 
  "Flights", "Laundry", "Internet", "Misc"
];

const CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1'];

const supabase = createClient();

export default function MoneyballWrapper() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" size={48} /></div>;
  if (!session) return <LoginScreen />;
  return <MoneyballApp user={session.user} />;
}

// ----------------------------------------------------------------
// LOGIN SCREEN 
// ----------------------------------------------------------------
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (action: 'login' | 'signup') => {
    if (!email || !password) return alert("Please enter both email and password.");
    setIsLoading(true);
    try {
      if (action === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) { alert(error.message); } finally { setIsLoading(false); }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 p-6 max-w-md mx-auto shadow-2xl">
      <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Moneyball</h1>
        <p className="text-gray-500 mb-8 text-sm">Sign in to sync your budget.</p>
        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-gray-900" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-gray-900" />
        </div>
        <div className="mt-8 space-y-3">
          <button onClick={() => handleAuth('login')} disabled={isLoading} className="w-full bg-black text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-all disabled:opacity-50">Sign In</button>
          <button onClick={() => handleAuth('signup')} disabled={isLoading} className="w-full bg-white text-black border border-gray-200 py-3 rounded-xl font-semibold active:bg-gray-50 transition-all disabled:opacity-50">Create Account</button>
        </div>
      </div>
    </main>
  );
}

// ----------------------------------------------------------------
// TOP HEADER COMPONENT
// ----------------------------------------------------------------
function TopHeader({ rightNode }: { rightNode?: React.ReactNode }) {
  return (
    <div className="sticky z-50 w-full px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 flex justify-center pointer-events-none">
      <header className="flex items-center space-x-2 px-6 py-3 bg-gray-900/95 backdrop-blur-md rounded-full shadow-xl pointer-events-auto">
        <Target size={18} className="text-emerald-400" />
        <h1 className="text-sm font-bold tracking-widest uppercase text-white">Moneyball</h1>
        {rightNode}
      </header>
    </div>
  );
}

// ----------------------------------------------------------------
// MAIN APP ROUTER
// ----------------------------------------------------------------
function MoneyballApp({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("add");
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]); // Global Tx storage
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoadingData(true);
    
    // Fetch everything!
    const [catRes, budRes, incRes, txRes] = await Promise.all([
      supabase.from('user_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('income').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
    ]);

    if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
    else {
      const seedData = DEFAULT_CATEGORIES.map(name => ({ name, user_id: user.id }));
      await supabase.from('user_categories').insert(seedData);
      fetchData(); // Recursively fetch seeded cats
      return;
    }

    if (budRes.data) setBudgets(budRes.data);
    if (incRes.data) setIncome(incRes.data);
    if (txRes.data) setTransactions(txRes.data);

    setLoadingData(false);
  };

  return (
    <div className="bg-gray-50 min-h-[100dvh]">
      {activeTab === "add" && <EntryScreen user={user} categories={categories} loadingCats={loadingData} transactions={transactions} fetchData={fetchData} />}
      {activeTab === "income" && <IncomeScreen user={user} income={income} fetchData={fetchData} />}
      {activeTab === "summary" && <InsightsScreen user={user} budgets={budgets} income={income} transactions={transactions} />}
      {activeTab === "settings" && <SettingsScreen user={user} categories={categories} budgets={budgets} fetchData={fetchData} />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// ----------------------------------------------------------------
// 1. ENTRY SCREEN
// ----------------------------------------------------------------
function EntryScreen({ user, categories, loadingCats, transactions, fetchData }: { user: any, categories: any[], loadingCats: boolean, transactions: any[], fetchData: () => void }) {
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("");
  const [isToday, setIsToday] = useState(true);
  const [note, setNote] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions]);

  const allMonthTx = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions.filter(tx => new Date(tx.date) >= firstDay);
  }, [transactions]);

  const handlePress = (val: string) => {
    if (amount === "0" && val !== ".") setAmount(val);
    else if (val === "." && amount.includes(".")) return;
    else {
      const parts = amount.split(".");
      if (parts.length === 2 && parts[1].length >= 2 && val !== ".") return;
      setAmount((prev) => prev + val);
    }
  };

  const handleDelete = () => { amount.length === 1 ? setAmount("0") : setAmount((prev) => prev.slice(0, -1)); };

  const handleSave = async () => {
    if (amount === "0" || !category) {
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
      return alert("Please enter an amount and select a category.");
    }
    const numAmount = parseFloat(amount);
    const txDate = new Date();
    if (!isToday) txDate.setDate(txDate.getDate() - 1);

    const { error } = await supabase.from('transactions').insert({ amount: numAmount, category, notes: note, date: txDate.toISOString(), user_id: user.id });
    if (!error) {
      if (navigator.vibrate) navigator.vibrate(50);
      setToastMsg(`Saved $${numAmount} for ${category}`);
      setTimeout(() => setToastMsg(""), 2500);
      setAmount("0"); setCategory(""); setNote(""); setIsToday(true); 
      fetchData();
    } else alert("Error: " + error.message);
  };

  const handleDeleteTx = async (id: string) => {
    if (window.confirm("Delete this transaction?")) {
      await supabase.from('transactions').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50">
      {toastMsg && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] transition-all">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center space-x-2 border border-gray-700/50">
            <Check size={16} className="text-emerald-400" /><span>{toastMsg}</span>
          </div>
        </div>
      )}
      <TopHeader />
      <div className="flex flex-col items-center justify-center px-6 py-6 bg-white rounded-b-3xl shadow-sm z-10 pt-6 -mt-[env(safe-area-inset-top)]">
        <h1 className="text-6xl font-light text-gray-900 tracking-tighter mb-4">${amount}</h1>
        <div className="flex space-x-3 mb-4 w-full justify-center">
          <button onClick={() => setIsToday(!isToday)} className="flex items-center space-x-1.5 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-600 transition-colors">
            <Calendar size={16} /><span>{isToday ? "Today" : "Yesterday"}</span>
          </button>
          <div className="flex items-center space-x-1.5 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-600 focus-within:ring-2 focus-within:ring-black">
            <PenLine size={16} /><input type="text" placeholder="Note..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-transparent outline-none w-20 focus:w-32 transition-all text-gray-900" />
          </div>
        </div>
        <p className="text-gray-400 font-medium text-sm h-5">{category ? <span className="text-black bg-gray-100 px-3 py-1 rounded-md">{category}</span> : "Select category"}</p>
      </div>
      <div className="flex overflow-x-auto py-4 px-4 space-x-2 no-scrollbar min-h-[76px] items-center">
        {loadingCats ? <Loader2 className="animate-spin mx-auto text-gray-400" /> : 
          categories.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.name)} className={`whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold ${category === cat.name ? "bg-black text-white shadow-md scale-105" : "bg-white text-gray-600 border active:bg-gray-100"}`}>{cat.name}</button>
          ))
        }
      </div>
      <div className="grid grid-cols-3 gap-2 px-6 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => <button key={num} onClick={() => handlePress(num.toString())} className="flex items-center justify-center bg-white text-3xl font-normal text-gray-800 rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">{num}</button>)}
        <button onClick={() => handlePress(".")} className="flex items-center justify-center bg-white text-3xl font-normal text-gray-800 rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">.</button>
        <button onClick={() => handlePress("0")} className="flex items-center justify-center bg-white text-3xl font-normal text-gray-800 rounded-2xl shadow-sm h-[64px] active:bg-gray-200 transition-colors">0</button>
        <button onClick={handleDelete} className="flex items-center justify-center bg-gray-200 text-gray-700 rounded-2xl shadow-sm h-[64px] active:bg-gray-300 transition-colors"><Delete size={24} /></button>
      </div>
      <div className="px-6 pb-6"><button onClick={handleSave} className="w-full bg-black text-white py-4 rounded-2xl text-lg font-bold shadow-lg active:scale-[0.98]">Save Entry</button></div>
      <div className="px-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Recent Activity</h3>
        <div className="space-y-3">
          {recentTx.length === 0 ? <p className="text-gray-400 text-sm italic">No entries.</p> : recentTx.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col"><span className="font-semibold text-gray-900">{tx.category}</span><span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {tx.notes && `• ${tx.notes}`}</span></div>
              <div className="flex items-center space-x-4"><span className="font-bold text-gray-900">${tx.amount.toFixed(2)}</span><button onClick={() => handleDeleteTx(tx.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button></div>
            </div>
          ))}
          {recentTx.length > 0 && <button onClick={() => setIsModalOpen(true)} className="w-full text-center py-3 text-sm font-semibold text-gray-400 hover:text-gray-900">View all month activity</button>}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom-full duration-300">
          <header className="flex justify-between items-center px-6 py-4 bg-white border-b shadow-sm"><button onClick={() => setIsModalOpen(false)}><ChevronLeft size={24} className="text-gray-400" /></button><h2 className="font-bold text-gray-900 text-lg">This Month</h2><div className="w-8" /></header>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-32">
            {allMonthTx.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col"><span className="font-semibold text-gray-900">{tx.category}</span><span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                <div className="flex items-center space-x-4"><span className="font-bold text-gray-900">${tx.amount.toFixed(2)}</span><button onClick={() => handleDeleteTx(tx.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// ----------------------------------------------------------------
// 2. INCOME SCREEN
// ----------------------------------------------------------------
function IncomeScreen({ user, income, fetchData }: { user: any, income: any[], fetchData: () => void }) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveIncome = async () => {
    if (!amount || !source) return alert("Enter amount and source.");
    setIsAdding(true);
    const { error } = await supabase.from('income').insert({ amount: parseFloat(amount), source, date: new Date().toISOString(), user_id: user.id });
    if (!error) {
      if (navigator.vibrate) navigator.vibrate(50);
      setAmount(""); setSource(""); fetchData();
    } else alert("Error: " + error.message);
    setIsAdding(false);
  };

  const handleDeleteIncome = async (id: string) => {
    if (window.confirm("Delete entry?")) {
      await supabase.from('income').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50 pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Log Paycheck</h2>
          <div className="space-y-4">
            <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span><input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-[16px]" /></div>
            <input type="text" placeholder="Source (Salary, Side Hustle)" value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-[16px]" />
            <button onClick={handleSaveIncome} disabled={isAdding} className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] shadow-sm flex items-center justify-center">
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : <span>Add Income</span>}
            </button>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Income History</h3>
        <div className="space-y-3">
          {income.map((inc) => (
            <div key={inc.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col"><span className="font-semibold text-gray-900">{inc.source}</span><span className="text-xs text-gray-500">{new Date(inc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
              <div className="flex items-center space-x-4"><span className="font-bold text-emerald-500">+${inc.amount.toFixed(2)}</span><button onClick={() => handleDeleteIncome(inc.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ----------------------------------------------------------------
// 3. INSIGHTS SCREEN (The Major Overhaul)
// ----------------------------------------------------------------
function InsightsScreen({ user, budgets, income, transactions }: { user: any, budgets: any[], income: any[], transactions: any[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // TIME MACHINE LOGIC
  const currentMonthData = useMemo(() => {
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
    const grouped: Record<string, { total: number, subs: Record<string, number> }> = {};
    monthTx.forEach(tx => {
      totalSpent += tx.amount;
      const groupName = tx.category.includes(" - ") ? tx.category.split(" - ")[0].trim() : tx.category;
      if (!grouped[groupName]) grouped[groupName] = { total: 0, subs: {} };
      grouped[groupName].total += tx.amount;
      grouped[groupName].subs[tx.category] = (grouped[groupName].subs[tx.category] || 0) + tx.amount;
    });

    const totalIncome = monthInc.reduce((s, i) => s + i.amount, 0);
    const netSavings = totalIncome - totalSpent;

    const chartData = Object.keys(grouped).map(key => ({ name: key, value: grouped[key].total, subs: grouped[key].subs })).sort((a, b) => b.value - a.value);

    return { totalSpent, totalIncome, netSavings, chartData };
  }, [selectedDate, transactions, income]);

  // HISTORICAL BAR CHART LOGIC (Last 6 Months)
  const historicalData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const monthSpent = transactions.filter(tx => { const d = new Date(tx.date); return d >= start && d <= end; }).reduce((s, t) => s + t.amount, 0);
      const monthIncome = income.filter(inc => { const d = new Date(inc.date); return d >= start && d <= end; }).reduce((s, i) => s + i.amount, 0);

      data.push({
        month: d.toLocaleDateString(undefined, { month: 'short' }),
        Spent: monthSpent,
        Income: monthIncome
      });
    }
    return data;
  }, [transactions, income]);

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
          <span>$${limit} limit</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: finalColor }}></div></div>
      </div>
    );
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50 pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">
        
        {/* DUAL DASHBOARD */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Spent Card (Premium Deep Blue Vibe) */}
          <div className="bg-slate-900 p-5 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden border border-slate-800">
            {/* Subtle blue glowing background decoration */}
            <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-blue-500/20 blur-2xl"></div>
            
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 relative z-10">Total Spent</span>
            <span className="text-3xl font-light text-white tracking-tighter relative z-10">
              ${currentMonthData.totalSpent.toFixed(2)}
            </span>
          </div>
          
          {/* Savings Card (Premium Wealth Vibe) */}
          <div className="bg-gray-900 p-5 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden border border-gray-800">
            {/* Subtle glowing background decoration */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl ${currentMonthData.netSavings < 0 ? 'bg-red-500/15' : 'bg-emerald-500/20'}`}></div>
            
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1 relative z-10">Net Savings</span>
            <span className={`text-3xl font-light tracking-tighter relative z-10 ${currentMonthData.netSavings < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {currentMonthData.netSavings < 0 ? '-' : ''}${Math.abs(currentMonthData.netSavings).toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Enlarged Monthly Income Text */}
        <div className="text-center mb-8">
          <span className="text-sm text-gray-500">
            Monthly Income: <span className="text-gray-800 font-semibold">${currentMonthData.totalIncome.toFixed(2)}</span>
          </span>
        </div>

        {/* TIME MACHINE & TRENDS BUTTON */}
        <div className="flex items-center justify-between mb-8 bg-white p-2 rounded-2xl border shadow-sm">
          <button onClick={() => moveMonth(-1)} className="p-2 text-gray-400 hover:text-black"><ChevronLeft size={20} /></button>
          <div className="flex flex-col items-center">
            {/* Added suppressHydrationWarning to fix the Next.js vs Timezone/Grammarly crash */}
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
                      <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div><span className="font-medium text-gray-700">{item.name}</span>{hasSubs && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                      <span className="font-semibold text-gray-900">${item.value.toFixed(2)}</span>
                    </div>
                    {renderProgressBar(item.name, item.value, color)}
                    {hasSubs && isExpanded && (
                      <div className="mt-3 pl-5 space-y-3 border-l-2 border-gray-100 ml-1.5">
                        {Object.entries(item.subs).map(([subName, subValue]) => (
                          <div key={subName} className="flex flex-col">
                            <div className="flex justify-between items-center text-xs"><span className="text-gray-500">{subName.split(" - ")[1] || subName}</span><span className="font-medium text-gray-700">${subValue.toFixed(2)}</span></div>
                            {renderProgressBar(subName, subValue, color)}
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

      {/* TRENDS MODAL (Historical Deep-Dive) */}
      {isTrendsOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom-full duration-300">
          <header className="flex justify-between items-center px-6 py-4 bg-white border-b"><button onClick={() => setIsTrendsOpen(false)}><ChevronLeft size={24} className="text-gray-400" /></button><h2 className="font-bold text-gray-900 text-lg">Spending Trends</h2><div className="w-8" /></header>
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

// ----------------------------------------------------------------
// 4. SETTINGS SCREEN
// ----------------------------------------------------------------
function BudgetInput({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => void }) {
  const [val, setVal] = useState(initialValue);
  useEffect(() => { setVal(initialValue); }, [initialValue]);
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">$</span>
      <input type="number" placeholder="Limit" value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => onSave(val)} className="w-24 pl-6 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[16px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-gray-300" />
    </div>
  );
}

function SettingsScreen({ user, categories, budgets, fetchData }: { user: any, categories: any[], budgets: any[], fetchData: () => void }) {
  const [newCatName, setNewCatName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const handleLogout = async () => await supabase.auth.signOut();
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsAdding(true);
    const { error } = await supabase.from('user_categories').insert({ name: newCatName.trim(), user_id: user.id });
    if (!error) { setNewCatName(""); fetchData(); }
    setIsAdding(false);
  };
  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) { await supabase.from('user_categories').delete().eq('id', id); fetchData(); }
  };
  const handleSetBudget = async (categoryName: string, value: string) => {
    if (!value || value.trim() === "") {
      const { error } = await supabase.from('budgets').delete().match({ user_id: user.id, category: categoryName });
      if (!error) fetchData();
      return;
    } 
    const { error } = await supabase.from('budgets').upsert({ user_id: user.id, category: categoryName, limit_amount: parseFloat(value) }, { onConflict: 'user_id, category' });
    if (!error) fetchData();
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50 pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-6">
          <div className="p-6 border-b bg-gray-50/50"><h3 className="font-semibold text-gray-900 mb-4">Manage Categories & Budgets</h3><div className="flex space-x-2"><input type="text" placeholder="New category..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="flex-grow bg-white border px-4 py-2 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-black" /><button onClick={handleAddCategory} disabled={isAdding || !newCatName.trim()} className="bg-black text-white p-2 px-4 rounded-xl active:scale-95 disabled:opacity-50">{isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}</button></div></div>
          <div className="max-h-80 overflow-y-auto p-2">
            {categories.map((cat) => {
              const currentBudget = budgets.find(b => b.category === cat.name)?.limit_amount?.toString() || '';
              return (<div key={cat.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors"><span className="text-sm font-medium text-gray-700 flex-1 pr-3 leading-tight break-words">{cat.name}</span><div className="flex items-center space-x-2 shrink-0"><BudgetInput initialValue={currentBudget} onSave={(val) => handleSetBudget(cat.name, val)} /><button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-gray-300 hover:text-red-500 p-2"><X size={16} /></button></div></div>);
            })}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border"><p className="text-gray-500 mb-6 text-sm">Account: <span className="font-semibold text-gray-900">{user.email}</span></p><button onClick={handleLogout} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold">Log Out</button></div>
      </div>
    </main>
  );
}

// ----------------------------------------------------------------
// BOTTOM NAVIGATION
// ----------------------------------------------------------------
function BottomNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full bg-white/90 backdrop-blur-md border-t border-gray-200 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 px-6 flex justify-around items-center z-50">
      <button onClick={() => setActiveTab("add")} className={`flex flex-col items-center space-y-1 ${activeTab === "add" ? "text-black" : "text-gray-400"}`}><Home size={24} className={activeTab === "add" ? "stroke-[2.5px]" : ""} /><span className="text-[10px] font-semibold">Entry</span></button>
      <button onClick={() => setActiveTab("income")} className={`flex flex-col items-center space-y-1 ${activeTab === "income" ? "text-black" : "text-gray-400"}`}><Wallet size={24} className={activeTab === "income" ? "stroke-[2.5px]" : ""} /><span className="text-[10px] font-semibold">Income</span></button>
      <button onClick={() => setActiveTab("summary")} className={`flex flex-col items-center space-y-1 ${activeTab === "summary" ? "text-black" : "text-gray-400"}`}><PieChartIcon size={24} className={activeTab === "summary" ? "stroke-[2.5px]" : ""} /><span className="text-[10px] font-semibold">Insights</span></button>
      <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center space-y-1 ${activeTab === "settings" ? "text-black" : "text-gray-400"}`}><Settings size={24} className={activeTab === "settings" ? "stroke-[2.5px]" : ""} /><span className="text-[10px] font-semibold">Settings</span></button>
    </nav>
  );
}