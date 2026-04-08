"use client";

import { useState, useEffect, useMemo } from "react";
import { Delete, Check, Calendar, PenLine, Home, PieChart as PieChartIcon, Settings, Loader2, Trash2, Plus, X, ChevronDown, ChevronUp, Target, ChevronLeft, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
// TOP HEADER COMPONENT (Notch-Aware)
// ----------------------------------------------------------------
function TopHeader({ rightNode }: { rightNode?: React.ReactNode }) {
  return (
    // Added pt-[calc(env(safe-area-inset-top)+16px)] so it dynamically clears the iPhone notch
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
  const [income, setIncome] = useState<any[]>([]); // NEW: Income State
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoadingData(true);
    // Fetch Categories
    const { data: catData } = await supabase.from('user_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    if (catData && catData.length > 0) setCategories(catData);
    else {
      const seedData = DEFAULT_CATEGORIES.map(name => ({ name, user_id: user.id }));
      await supabase.from('user_categories').insert(seedData);
      const { data: newCatData } = await supabase.from('user_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      if (newCatData) setCategories(newCatData);
    }
    // Fetch Budgets
    const { data: budData } = await supabase.from('budgets').select('*').eq('user_id', user.id);
    if (budData) setBudgets(budData);
    
    // NEW: Fetch Income
    const { data: incData } = await supabase.from('income').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if (incData) setIncome(incData);

    setLoadingData(false);
  };

  return (
    <div className="bg-gray-50 min-h-[100dvh]">
      {activeTab === "add" && <EntryScreen user={user} categories={categories} loadingCats={loadingData} />}
      {activeTab === "income" && <IncomeScreen user={user} income={income} fetchData={fetchData} />}
      {activeTab === "summary" && <InsightsScreen user={user} budgets={budgets} income={income} />}
      {activeTab === "settings" && <SettingsScreen user={user} categories={categories} budgets={budgets} fetchData={fetchData} />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// ----------------------------------------------------------------
// 1. ENTRY SCREEN (With Toasts, Haptics, and Modal)
// ----------------------------------------------------------------
function EntryScreen({ user, categories, loadingCats }: { user: any, categories: any[], loadingCats: boolean }) {
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("");
  const [isToday, setIsToday] = useState(true);
  const [note, setNote] = useState("");
  const [recentTx, setRecentTx] = useState<any[]>([]);
  
  // New States for Phase 1
  const [toastMsg, setToastMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allMonthTx, setAllMonthTx] = useState<any[]>([]);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(5);
    if (data) setRecentTx(data);
  };

  const fetchAllMonthTransactions = async () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', firstDay).order('date', { ascending: false });
    if (data) setAllMonthTx(data);
  };

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
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]); // Error vibration pattern
      return alert("Please enter an amount and select a category.");
    }
    
    const numAmount = parseFloat(amount);
    const txDate = new Date();
    if (!isToday) txDate.setDate(txDate.getDate() - 1);

    const { error } = await supabase.from('transactions').insert({ amount: numAmount, category, notes: note, date: txDate.toISOString(), user_id: user.id });
    
    if (!error) {
      // PHASE 1: Haptic & Toast Feedback
      if (navigator.vibrate) navigator.vibrate(50); // Single success tick
      setToastMsg(`Saved $${numAmount} for ${category}`);
      setTimeout(() => setToastMsg(""), 2500);

      setAmount("0"); setCategory(""); setNote(""); setIsToday(true); 
      fetchTransactions();
      if (isModalOpen) fetchAllMonthTransactions(); // Refresh modal if it's magically open
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (window.confirm("Delete this transaction?")) {
      await supabase.from('transactions').delete().eq('id', id);
      fetchTransactions();
      fetchAllMonthTransactions(); // Keep modal perfectly synced
    }
  };

  const openModal = () => {
    fetchAllMonthTransactions();
    setIsModalOpen(true);
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center space-x-2 border border-gray-700/50">
            <Check size={16} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      <TopHeader />
      
      <div className="flex flex-col items-center justify-center px-6 py-6 bg-white rounded-b-3xl shadow-sm z-10 pt-6 -mt-[env(safe-area-inset-top)]">
        <h1 className="text-6xl font-light text-gray-900 tracking-tighter mb-4">${amount}</h1>
        <div className="flex space-x-3 mb-4 w-full justify-center">
          <button onClick={() => setIsToday(!isToday)} className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-medium text-gray-600 transition-colors">
            <Calendar size={16} /><span>{isToday ? "Today" : "Yesterday"}</span>
          </button>
          <div className="flex items-center space-x-1.5 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-600 focus-within:ring-2 focus-within:ring-black transition-all">
            <PenLine size={16} />
            <input type="text" placeholder="Add note..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-transparent outline-none w-20 focus:w-32 transition-all text-gray-900 placeholder:text-gray-400" />
          </div>
        </div>
        <p className="text-gray-400 font-medium text-sm h-5">{category ? <span className="text-black bg-gray-100 px-3 py-1 rounded-md">{category}</span> : "Select a category"}</p>
      </div>

      <div className="flex overflow-x-auto py-4 px-4 space-x-2 no-scrollbar shrink-0 min-h-[76px] items-center">
        {loadingCats ? <div className="w-full flex justify-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div> : 
          categories.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.name)} className={`whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${category === cat.name ? "bg-black text-white shadow-md scale-105" : "bg-white text-gray-600 shadow-sm border border-gray-100 active:bg-gray-100"}`}>{cat.name}</button>
          ))
        }
      </div>

      <div className="grid grid-cols-3 gap-2 px-6 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => <button key={num} onClick={() => handlePress(num.toString())} className="flex items-center justify-center bg-white text-2xl font-normal text-gray-800 rounded-2xl shadow-sm active:bg-gray-200 h-[64px]">{num}</button>)}
        <button onClick={() => handlePress(".")} className="flex items-center justify-center bg-white text-2xl font-normal text-gray-800 rounded-2xl shadow-sm active:bg-gray-200 h-[64px]">.</button>
        <button onClick={() => handlePress("0")} className="flex items-center justify-center bg-white text-2xl font-normal text-gray-800 rounded-2xl shadow-sm active:bg-gray-200 h-[64px]">0</button>
        <button onClick={handleDelete} className="flex items-center justify-center bg-gray-200 text-gray-700 rounded-2xl shadow-sm active:bg-gray-300 h-[64px]"><Delete size={24} /></button>
      </div>

      <div className="px-6 pb-6">
        <button onClick={handleSave} className="w-full flex items-center justify-center space-x-2 bg-black text-white py-4 rounded-2xl text-lg font-bold active:scale-[0.98] transition-transform shadow-lg"><span>Save Entry</span><Check size={20} /></button>
      </div>

      <div className="px-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Recent Activity</h3>
        <div className="space-y-3">
          {recentTx.length === 0 ? <p className="text-gray-400 text-sm italic">No entries yet.</p> : recentTx.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">{tx.category}</span>
                <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                  <span>{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  {tx.notes && (<><span>•</span><span className="italic max-w-[120px] truncate">{tx.notes}</span></>)}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold text-gray-900">${tx.amount.toFixed(2)}</span>
                <button onClick={() => handleDeleteTx(tx.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          
          {/* Phase 1: View All Ledger Button */}
          {recentTx.length > 0 && (
            <button onClick={openModal} className="w-full text-center py-3 text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors">
              View all month activity
            </button>
          )}
        </div>
      </div>

      {/* Phase 1: Full Ledger Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom-full duration-300">
          <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
            <button onClick={() => setIsModalOpen(false)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900"><ChevronLeft size={24} /></button>
            <h2 className="font-bold text-gray-900 text-lg">This Month</h2>
            <div className="w-8" /> {/* Spacer for centering */}
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-32">
            {allMonthTx.length === 0 ? <p className="text-center text-gray-400 mt-10">No entries this month.</p> : allMonthTx.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{tx.category}</span>
                  <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                    <span>{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    {tx.notes && (<><span>•</span><span className="italic max-w-[120px] truncate">{tx.notes}</span></>)}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-gray-900">${tx.amount.toFixed(2)}</span>
                  <button onClick={() => handleDeleteTx(tx.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}

// ----------------------------------------------------------------
// NEW: INCOME SCREEN
// ----------------------------------------------------------------
function IncomeScreen({ user, income, fetchData }: { user: any, income: any[], fetchData: () => void }) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveIncome = async () => {
    if (!amount || !source) return alert("Please enter an amount and source.");
    setIsAdding(true);
    
    const numAmount = parseFloat(amount);
    const { error } = await supabase.from('income').insert({
      amount: numAmount,
      source: source,
      date: new Date().toISOString(),
      user_id: user.id
    });

    if (!error) {
      if (navigator.vibrate) navigator.vibrate(50);
      setAmount(""); setSource(""); fetchData();
    } else {
      alert("Error saving income: " + error.message);
    }
    setIsAdding(false);
  };

  const handleDeleteIncome = async (id: string) => {
    if (window.confirm("Delete this income entry?")) {
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
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-[16px]" />
            </div>
            <input type="text" placeholder="Source (e.g. Salary, Side Hustle)" value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-[16px]" />
            <button onClick={handleSaveIncome} disabled={isAdding} className="w-full flex items-center justify-center space-x-2 bg-emerald-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-transform shadow-sm disabled:opacity-50">
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : <span>Add Income</span>}
            </button>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Income History</h3>
        <div className="space-y-3">
          {income.length === 0 ? <p className="text-gray-400 text-sm italic">No income logged yet.</p> : income.map((inc) => (
            <div key={inc.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">{inc.source}</span>
                <span className="text-xs text-gray-500 mt-1">{new Date(inc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold text-emerald-500">+${inc.amount.toFixed(2)}</span>
                <button onClick={() => handleDeleteIncome(inc.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ----------------------------------------------------------------
// 2. INSIGHTS SCREEN (Upgraded with Savings Engine)
// ----------------------------------------------------------------
function InsightsScreen({ user, budgets, income }: { user: any, budgets: any[], income: any[] }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchThisMonth = async () => {
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', firstDay);
      if (data) setTransactions(data);
      setLoading(false);
    };
    fetchThisMonth();
  }, [user.id]);

  const { chartData, totalSpent } = useMemo(() => {
    let total = 0;
    const grouped: Record<string, { total: number, subs: Record<string, number> }> = {};
    
    transactions.forEach(tx => {
      total += tx.amount;
      const groupName = tx.category.includes(" - ") ? tx.category.split(" - ")[0].trim() : tx.category;
      if (!grouped[groupName]) grouped[groupName] = { total: 0, subs: {} };
      grouped[groupName].total += tx.amount;
      grouped[groupName].subs[tx.category] = (grouped[groupName].subs[tx.category] || 0) + tx.amount;
    });

    const data = Object.keys(grouped).map(key => ({ name: key, value: grouped[key].total, subs: grouped[key].subs })).sort((a, b) => b.value - a.value);
    return { chartData: data, totalSpent: total };
  }, [transactions]);

  // CALCULATION ENGINE: Filter income for this month and calculate savings
  const { totalIncome, netSavings } = useMemo(() => {
    const date = new Date();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    
    const thisMonthIncome = income.filter(inc => new Date(inc.date) >= firstDayOfMonth);
    const totalInc = thisMonthIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const net = totalInc - totalSpent;
    
    return { totalIncome: totalInc, netSavings: net };
  }, [income, totalSpent]);

  const toggleGroup = (name: string) => { setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] })); };

  const renderProgressBar = (categoryName: string, amountSpent: number, barColor: string) => {
    const limitObj = budgets.find(b => b.category === categoryName);
    const limit = limitObj ? limitObj.limit_amount : null;
    if (!limit) return null;

    const percent = Math.min((amountSpent / limit) * 100, 100);
    const isOver = amountSpent > limit;
    const isWarning = percent >= 80 && !isOver; 
    let finalColor = barColor; 
    if (isWarning) finalColor = '#F59E0B'; 
    if (isOver) finalColor = '#EF4444'; 

    return (
      <div className="w-full mt-2">
        <div className="flex justify-end mb-1 text-[10px] text-gray-400 font-medium">{isOver ? "Over Budget" : `${percent.toFixed(0)}% of $${limit}`}</div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: finalColor }}></div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex-grow flex items-center justify-center pt-20"><Loader2 className="animate-spin text-gray-300" /></div>;

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50 pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">
        
        {/* WEALTH DASHBOARD (Upgraded Card) */}
        <div className="bg-gray-900 p-6 rounded-3xl shadow-xl mb-6 text-white overflow-hidden relative">
          {/* Subtle background decoration */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 block">Net Savings (This Month)</span>
          <span className={`text-5xl font-light tracking-tighter block mb-6 ${netSavings < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
             {netSavings < 0 ? '-' : ''}${Math.abs(netSavings).toFixed(2)}
          </span>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <div>
              <span className="text-gray-500 text-xs uppercase block mb-0.5">Income</span>
              <span className="font-semibold">${totalIncome.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-xs uppercase block mb-0.5">Spent</span>
              <span className="font-semibold">${totalSpent.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ... The rest of your pie chart code stays exactly the same from here down ... */}

        {chartData.length > 0 ? (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="h-64 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${Number(value || 0).toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {chartData.map((item, index) => {
                const hasSubs = Object.keys(item.subs).length > 1;
                const isExpanded = expandedGroups[item.name];
                const color = CHART_COLORS[index % CHART_COLORS.length];

                return (
                  <div key={item.name} className="flex flex-col text-sm border-b border-gray-50 pb-3 last:border-0">
                    <div className={`flex justify-between items-center ${hasSubs ? 'cursor-pointer active:opacity-70' : ''}`} onClick={() => hasSubs && toggleGroup(item.name)}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <span className="font-medium text-gray-700">{item.name}</span>
                        {hasSubs && (isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />)}
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
                              <span className="font-medium text-gray-700">${subValue.toFixed(2)}</span>
                            </div>
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
        ) : <div className="text-center p-8 bg-white rounded-3xl border border-gray-100 text-gray-400 italic">No data yet for this month.</div>}
      </div>
    </main>
  );
}

// ----------------------------------------------------------------
// 3. SETTINGS SCREEN
// ----------------------------------------------------------------
function BudgetInput({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => void }) {
  const [val, setVal] = useState(initialValue);
  useEffect(() => { setVal(initialValue); }, [initialValue]);

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">$</span>
      {/* Changed to text-[16px] to prevent iOS Auto-Zoom */}
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
    if (window.confirm(`Delete "${name}"?`)) {
      await supabase.from('user_categories').delete().eq('id', id);
      fetchData();
    }
  };

  const handleSetBudget = async (categoryName: string, value: string) => {
    // FIX: If the box is cleared, delete the budget limit from the database
    if (!value || value.trim() === "") {
      const { error } = await supabase.from('budgets').delete().match({ user_id: user.id, category: categoryName });
      if (!error) fetchData();
      return;
    } 
    
    const numValue = parseFloat(value);
    const { error } = await supabase.from('budgets').upsert({ user_id: user.id, category: categoryName, limit_amount: numValue }, { onConflict: 'user_id, category' });
    if (error) alert("Failed to save budget: " + error.message);
    else fetchData();
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50 pt-[env(safe-area-inset-top)]">
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900 mb-4">Manage Categories & Budgets</h3>
            <div className="flex space-x-2">
              {/* Changed to text-[16px] here as well */}
              <input type="text" placeholder="New category..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="flex-grow bg-white border border-gray-200 px-4 py-2 rounded-xl text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
              <button onClick={handleAddCategory} disabled={isAdding || !newCatName.trim()} className="bg-black text-white p-2 px-4 rounded-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center">
                {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {categories.map((cat) => {
              const currentBudget = budgets.find(b => b.category === cat.name)?.limit_amount?.toString() || '';
              return (
                <div key={cat.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  {/* FIX: Replaced w-1/3 and truncate with flex-1 and leading-tight so long names wrap nicely */}
                  <span className="text-sm font-medium text-gray-700 flex-1 pr-3 leading-tight break-words">{cat.name}</span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <BudgetInput initialValue={currentBudget} onSave={(val) => handleSetBudget(cat.name, val)} />
                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"><X size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 mb-6 text-sm">Account: <span className="font-semibold text-gray-900">{user.email}</span></p>
          <button onClick={handleLogout} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold active:scale-[0.98] transition-all">Log Out</button>
        </div>
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
      <button onClick={() => setActiveTab("add")} className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === "add" ? "text-black" : "text-gray-400"}`}>
        <Home size={24} className={activeTab === "add" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Entry</span>
      </button>
      <button onClick={() => setActiveTab("income")} className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === "income" ? "text-black" : "text-gray-400"}`}>
        <Wallet size={24} className={activeTab === "income" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Income</span>
      </button>
      <button onClick={() => setActiveTab("summary")} className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === "summary" ? "text-black" : "text-gray-400"}`}>
        <PieChartIcon size={24} className={activeTab === "summary" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Insights</span>
      </button>
      <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === "settings" ? "text-black" : "text-gray-400"}`}>
        <Settings size={24} className={activeTab === "settings" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Settings</span>
      </button>
    </nav>
  );
}