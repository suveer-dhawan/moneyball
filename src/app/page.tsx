"use client";

import { useState, useEffect, useMemo } from "react";
import { Delete, Check, Calendar, PenLine, Home, PieChart as PieChartIcon, Settings, Loader2, Trash2, Plus, X, ChevronDown, ChevronUp, Target } from "lucide-react";
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
// TOP HEADER COMPONENT (New)
// ----------------------------------------------------------------
// ----------------------------------------------------------------
// TOP HEADER COMPONENT (The Premium Brand Pill)
// ----------------------------------------------------------------
function TopHeader({ rightNode }: { rightNode?: React.ReactNode }) {
  return (
    <div className="sticky top-4 z-50 w-full px-4 flex justify-center pointer-events-none">
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
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoadingData(true);
    const { data: catData } = await supabase.from('user_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    if (catData && catData.length > 0) setCategories(catData);
    else {
      const seedData = DEFAULT_CATEGORIES.map(name => ({ name, user_id: user.id }));
      await supabase.from('user_categories').insert(seedData);
      const { data: newCatData } = await supabase.from('user_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      if (newCatData) setCategories(newCatData);
    }
    const { data: budData } = await supabase.from('budgets').select('*').eq('user_id', user.id);
    if (budData) setBudgets(budData);
    setLoadingData(false);
  };

  return (
    <div className="bg-gray-50 min-h-[100dvh]">
      {activeTab === "add" && <EntryScreen user={user} categories={categories} loadingCats={loadingData} />}
      {activeTab === "summary" && <InsightsScreen user={user} budgets={budgets} />}
      {activeTab === "settings" && <SettingsScreen user={user} categories={categories} budgets={budgets} fetchData={fetchData} />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// ----------------------------------------------------------------
// 1. ENTRY SCREEN
// ----------------------------------------------------------------
function EntryScreen({ user, categories, loadingCats }: { user: any, categories: any[], loadingCats: boolean }) {
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("");
  const [isToday, setIsToday] = useState(true);
  const [note, setNote] = useState("");
  const [recentTx, setRecentTx] = useState<any[]>([]);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(10);
    if (data) setRecentTx(data);
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
    if (amount === "0" || !category) return alert("Please enter an amount and select a category.");
    const numAmount = parseFloat(amount);
    const txDate = new Date();
    if (!isToday) txDate.setDate(txDate.getDate() - 1);

    const { error } = await supabase.from('transactions').insert({ amount: numAmount, category, notes: note, date: txDate.toISOString(), user_id: user.id });
    if (!error) {
      setAmount("0"); setCategory(""); setNote(""); setIsToday(true); fetchTransactions();
    } else alert("Error: " + error.message);
  };

  const handleDeleteTx = async (id: string) => {
    if (window.confirm("Delete this transaction?")) {
      await supabase.from('transactions').delete().eq('id', id);
      fetchTransactions();
    }
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50">
      <TopHeader />
      
      {/* 1. Restored Top Display Padding */}
      <div className="flex flex-col items-center justify-center px-6 py-6 bg-white rounded-b-3xl shadow-sm z-10 pt-6">
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

      {/* 2. Category Slider */}
      <div className="flex overflow-x-auto py-4 px-4 space-x-2 no-scrollbar shrink-0 min-h-[76px] items-center">
        {loadingCats ? <div className="w-full flex justify-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div> : 
          categories.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.name)} className={`whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${category === cat.name ? "bg-black text-white shadow-md scale-105" : "bg-white text-gray-600 shadow-sm border border-gray-100 active:bg-gray-100"}`}>{cat.name}</button>
          ))
        }
      </div>

      {/* 3. Balanced Numpad (h-[64px]) */}
      <div className="grid grid-cols-3 gap-2 px-6 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => <button key={num} onClick={() => handlePress(num.toString())} className="flex items-center justify-center bg-white text-2xl font-normal text-gray-800 rounded-2xl shadow-sm active:bg-gray-200 h-[64px]">{num}</button>)}
        <button onClick={() => handlePress(".")} className="flex items-center justify-center bg-white text-2xl font-normal text-gray-800 rounded-2xl shadow-sm active:bg-gray-200 h-[64px]">.</button>
        <button onClick={() => handlePress("0")} className="flex items-center justify-center bg-white text-2xl font-normal text-gray-800 rounded-2xl shadow-sm active:bg-gray-200 h-[64px]">0</button>
        <button onClick={handleDelete} className="flex items-center justify-center bg-gray-200 text-gray-700 rounded-2xl shadow-sm active:bg-gray-300 h-[64px]"><Delete size={24} /></button>
      </div>

      {/* 4. Restored Save Button Padding */}
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
        </div>
      </div>
    </main>
  );
}

// ----------------------------------------------------------------
// 2. INSIGHTS SCREEN (Now with Smart Drill-downs)
// ----------------------------------------------------------------
function InsightsScreen({ user, budgets }: { user: any, budgets: any[] }) {
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

  // SMART GROUPING: Retain sub-categories for the drill-down
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

    const data = Object.keys(grouped).map(key => ({ 
      name: key, 
      value: grouped[key].total,
      subs: grouped[key].subs
    })).sort((a, b) => b.value - a.value);
    
    return { chartData: data, totalSpent: total };
  }, [transactions]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Helper to render a progress bar
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
        <div className="flex justify-end mb-1 text-[10px] text-gray-400 font-medium">
           {isOver ? "Over Budget" : `${percent.toFixed(0)}% of $${limit}`}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: finalColor }}></div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex-grow flex items-center justify-center pt-20"><Loader2 className="animate-spin text-gray-300" /></div>;

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50">
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center mb-6">
          <span className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Spent</span>
          <span className="text-5xl font-light text-gray-900 tracking-tighter">${totalSpent.toFixed(2)}</span>
        </div>

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
                    {/* Top Level Row */}
                    <div 
                      className={`flex justify-between items-center ${hasSubs ? 'cursor-pointer active:opacity-70' : ''}`}
                      onClick={() => hasSubs && toggleGroup(item.name)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <span className="font-medium text-gray-700">{item.name}</span>
                        {hasSubs && (isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />)}
                      </div>
                      <span className="font-semibold text-gray-900">${item.value.toFixed(2)}</span>
                    </div>

                    {/* Progress bar for Top Level (if they budgeted the base category) */}
                    {renderProgressBar(item.name, item.value, color)}

                    {/* Drill-down Sub-categories */}
                    {hasSubs && isExpanded && (
                      <div className="mt-3 pl-5 space-y-3 border-l-2 border-gray-100 ml-1.5">
                        {Object.entries(item.subs).map(([subName, subValue]) => (
                          <div key={subName} className="flex flex-col">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">{subName.split(" - ")[1] || subName}</span>
                              <span className="font-medium text-gray-700">${subValue.toFixed(2)}</span>
                            </div>
                            {/* Progress bar for Specific Sub-category */}
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
// 3. SETTINGS SCREEN (Fixed Input State Bug!)
// ----------------------------------------------------------------
// Helper component to fix the disappearing input bug
function BudgetInput({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => void }) {
  const [val, setVal] = useState(initialValue);
  
  // If the database changes in the background, update our local input
  useEffect(() => { setVal(initialValue); }, [initialValue]);

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
      <input 
        type="number"
        placeholder="Limit"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onSave(val)}
        className="w-24 pl-6 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-gray-300"
      />
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
    if (!value) return; 
    const numValue = parseFloat(value);
    const { error } = await supabase.from('budgets').upsert({ 
      user_id: user.id, 
      category: categoryName, 
      limit_amount: numValue 
    }, { onConflict: 'user_id, category' });
    
    if (error) {
      alert("Failed to save budget: " + error.message);
    } else {
      fetchData();
    }
  };

  return (
    <main className="flex flex-col max-w-md mx-auto shadow-2xl relative min-h-[100dvh] pb-32 bg-gray-50">
      <TopHeader />
      <div className="pt-6 px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900 mb-4">Manage Categories & Budgets</h3>
            <div className="flex space-x-2">
              <input type="text" placeholder="New category..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="flex-grow bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
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
                  <span className="text-sm font-medium text-gray-700 w-1/3 truncate">{cat.name}</span>
                  <div className="flex items-center space-x-2">
                    {/* Fixed React Input Component! */}
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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full bg-white/90 backdrop-blur-md border-t border-gray-200 pb-8 pt-4 px-6 flex justify-around items-center z-50">
      <button onClick={() => setActiveTab("add")} className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === "add" ? "text-black" : "text-gray-400"}`}>
        <Home size={24} className={activeTab === "add" ? "stroke-[2.5px]" : ""} />
        <span className="text-[10px] font-semibold">Entry</span>
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