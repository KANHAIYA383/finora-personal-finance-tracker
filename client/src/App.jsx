import { useEffect, useMemo, useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownRight, Plus, Search, Bell, LayoutDashboard,
  ReceiptText, ChartNoAxesCombined, Settings, Menu, X,
  Utensils, Car, ShoppingBag, House, HeartPulse, Briefcase,
  MoreHorizontal, CalendarDays
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from "recharts";
import "./index.css";

const initialTransactions = [];
const API_URL = "/api/transactions";
const BUDGET_API_URL = "/api/budgets";

function getCurrentMonth() {
  const today = new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
}

async function fetchMonthlyBudget(month) {
  const response = await fetch(`${BUDGET_API_URL}/${month}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load budget (${response.status})`);
  }

  return await response.json();
}

async function saveMonthlyBudget(month, amount) {
  const response = await fetch(`${BUDGET_API_URL}/${month}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: Number(amount) }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save budget (${response.status})`);
  }

  return await response.json();
}

async function fetchTransactions() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to load transactions (${response.status})`);
  }

  const data = await response.json();

  return data.map((transaction) => ({
    ...transaction,
    date: transaction.transactionDate,
  }));
}

async function createTransaction(transaction) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: transaction.title,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      transactionDate: transaction.date,
      notes: transaction.notes || "",
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to save transaction (${response.status})`);
  }

  const savedTransaction = await response.json();

  return {
    ...savedTransaction,
    date: savedTransaction.transactionDate,
  };
}
async function updateTransaction(id, transaction) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: transaction.title,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      transactionDate: transaction.date,
      notes: transaction.notes || "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update transaction (${response.status})`);
  }

  const saved = await response.json();

  return {
    ...saved,
    date: saved.transactionDate,
  };
}

async function deleteTransactionAPI(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete transaction (${response.status})`);
  }
}



const categoryColors = ["#6d5dfc", "#20b8a6", "#f5a742", "#ef6b83", "#5896f8"];

const categoryIcons = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Housing: House,
  Health: HeartPulse,
  Salary: Briefcase,
  Freelance: Briefcase,
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function App() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [monthlyBudget, setMonthlyBudget] = useState(12000);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "EXPENSE",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
  });
  useEffect(() => {
  async function loadTransactions() {
    try {
      const data = await fetchTransactions();
      setTransactions(data);
      setApiError("");
    } catch (error) {
      setApiError(error.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  loadTransactions();
}, []);
useEffect(() => {
  async function loadBudget() {
    try {
      const budget = await fetchMonthlyBudget(getCurrentMonth());

      if (budget) {
        setMonthlyBudget(Number(budget.amount));
      }
    } catch (error) {
      setApiError(error.message || "Could not load monthly budget.");
    }
  }

  loadBudget();
}, []);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);
  const monthlyExpense = useMemo(() => {
  const currentMonth = getCurrentMonth();

  return transactions
    .filter(t =>
      t.type === "EXPENSE" &&
      t.date &&
      t.date.startsWith(currentMonth)
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);
}, [transactions]);
  const weeklyData = useMemo(() => {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dateString = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const dayTransactions = transactions.filter(
      (t) => t.date === dateString
    );

    days.push({
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      income: dayTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0),
      expense: dayTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0),
    });
  }

  return days;
}, [transactions]);

  const expensesByCategory = useMemo(() => {
    const grouped = {};
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const visibleTransactions = transactions.filter((t) => {
    const matchesFilter = filter === "ALL" || t.type === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  async function addTransaction(event) {
  event.preventDefault();

  if (!form.title.trim() || Number(form.amount) <= 0) {
    setApiError("Enter a title and an amount greater than zero.");
    return;
  }

  setSaving(true);
  setApiError("");

  try {
    if (editingId !== null) {
      const updated = await updateTransaction(editingId, {
        ...form,
        title: form.title.trim(),
      });

      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === editingId ? updated : transaction
        )
      );
    } else {
      const saved = await createTransaction({
        ...form,
        title: form.title.trim(),
      });

      setTransactions((current) => [saved, ...current]);
    }

    setForm({
      title: "",
      amount: "",
      type: "EXPENSE",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
    });

    setEditingId(null);
    setShowForm(false);
  } catch (error) {
    setApiError(error.message || "Could not save the transaction.");
  } finally {
    setSaving(false);
  }
}
async function handleEditBudget() {
  const enteredAmount = window.prompt(
    "Enter your monthly spending budget (₹):",
    String(monthlyBudget)
  );

  if (enteredAmount === null) return;

  const amount = Number(enteredAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid budget greater than zero.");
    return;
  }

  setBudgetLoading(true);

  try {
    const savedBudget = await saveMonthlyBudget(
      getCurrentMonth(),
      amount
    );

    setMonthlyBudget(Number(savedBudget.amount));
  } catch (error) {
    setApiError(error.message || "Could not update budget.");
  } finally {
    setBudgetLoading(false);
  }
}
  function startEditing(transaction) {
  setEditingId(transaction.id);

  setForm({
    title: transaction.title,
    amount: String(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: transaction.date,
    notes: transaction.notes || "",
  });

  setShowForm(true);
}

async function handleDelete(id) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this transaction?"
  );

  if (!confirmed) return;

  try {
    setApiError("");
    await deleteTransactionAPI(id);

    setTransactions((current) =>
      current.filter((transaction) => transaction.id !== id)
    );
  } catch (error) {
    setApiError(error.message || "Could not delete transaction.");
  }
}

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Wallet size={23} /></div>
          <span>Finora<span className="brand-dot">.</span></span>
          <button className="mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X /></button>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav className="nav-links">
          <button className="nav-item active"><LayoutDashboard size={19} /> Dashboard</button>
          <button className="nav-item" onClick={() => document.getElementById("transactions")?.scrollIntoView({ behavior: "smooth" })}><ReceiptText size={19} /> Transactions</button>
          <button className="nav-item" onClick={() => document.getElementById("analytics")?.scrollIntoView({ behavior: "smooth" })}><ChartNoAxesCombined size={19} /> Analytics</button>
        </nav>

        <div className="sidebar-budget">
  <div className="budget-icon"><TrendingUp size={20} /></div>
  <p className="budget-title">Monthly budget</p>
  <p className="budget-amount">{money(monthlyBudget)}</p>

  <div className="budget-track">
    <span style={{
      width: `${Math.min((monthlyExpense / monthlyBudget) * 100, 100)}%`
    }} />
  </div>

  <p className="budget-caption">
    {Math.round((monthlyExpense / monthlyBudget) * 100)}% of budget used
  </p>

  <p className="budget-caption">
    {money(Math.max(monthlyBudget - monthlyExpense, 0))} remaining
  </p>

  <button
    type="button"
    className="secondary-button"
    onClick={handleEditBudget}
    disabled={budgetLoading}
  >
    {budgetLoading ? "Saving..." : "Edit Budget"}
  </button>

  {monthlyExpense > monthlyBudget && (
    <p style={{ color: "#ef6b83", fontSize: "12px" }}>
      Budget exceeded!
    </p>
  )}
</div>
        <div className="sidebar-bottom">
          <button className="nav-item"><Settings size={19} /> Settings</button>
          <div className="profile">
            <div className="avatar">K</div>
            <div className="profile-info"><strong>My Account</strong><span>Personal workspace</span></div>
            <MoreHorizontal size={20} />
          </div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu /></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>Dashboard</strong></div>
          <div className="topbar-right">
            <div className="date-label"><CalendarDays size={16} /> October 2026</div>
            <button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="avatar top-avatar">K</div>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <p className="eyebrow">YOUR FINANCIAL OVERVIEW</p>
            <h1>Good morning! <span>✦</span></h1>
            <p className="muted">Here's what's happening with your money today.</p>
          </div>
          <button
  className="primary-button"
  onClick={() => {
    setEditingId(null);
    setForm({
      title: "",
      amount: "",
      type: "EXPENSE",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  }}
><Plus size={19} /> Add transaction</button>
        </section>
        {loading && (
  <p className="empty-state">Loading your transactions...</p>
)}

{apiError && (
  <p role="alert" style={{ color: "#d64545", marginBottom: "16px" }}>
    {apiError}
  </p>
)}

        <section className="summary-grid">
          <article className="summary-card balance-card">
            <div className="summary-top"><span>Total balance</span><span className="summary-icon purple"><Wallet size={20} /></span></div>
            <h2>{money(totals.balance)}</h2>
            <div className="summary-foot"><span className="trend positive"><ArrowUpRight size={15} /> Healthy</span><span>Income minus expenses</span></div>
            <div className="balance-decoration" />
          </article>
          <article className="summary-card">
            <div className="summary-top"><span>Total income</span><span className="summary-icon green"><TrendingUp size={20} /></span></div>
            <h2>{money(totals.income)}</h2>
            <div className="summary-foot"><span className="trend positive"><ArrowUpRight size={15} /> Incoming</span><span>This period</span></div>
          </article>
          <article className="summary-card">
            <div className="summary-top"><span>Total expenses</span><span className="summary-icon orange"><TrendingDown size={20} /></span></div>
            <h2>{money(totals.expense)}</h2>
            <div className="summary-foot"><span className="trend neutral"><ArrowDownRight size={15} /> Outgoing</span><span>This period</span></div>
          </article>
        </section>

        <section className="analytics-grid" id="analytics">
          <article className="panel spending-panel">
            <div className="panel-heading">
              <div><h3>Cash flow</h3><p>Income vs expenses this week</p></div>
              <button className="select-button">This week <span>⌄</span></button>
            </div>
            <div className="chart-legend"><span><i className="legend-income" /> Income</span><span><i className="legend-expense" /> Expenses</span></div>
            <div className="area-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d5dfc" stopOpacity={0.2} /><stop offset="95%" stopColor="#6d5dfc" stopOpacity={0} /></linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#20b8a6" stopOpacity={0.16} /><stop offset="95%" stopColor="#20b8a6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#edf0f5" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9299aa", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9299aa", fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => money(value)} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#6d5dfc" strokeWidth={2.5} fill="url(#incomeGradient)" />
                  <Area type="monotone" dataKey="expense" name="Expenses" stroke="#20b8a6" strokeWidth={2.5} fill="url(#expenseGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel category-panel">
            <div className="panel-heading"><div><h3>Spending breakdown</h3><p>Where your money goes</p></div><button className="dots-button" aria-label="More options"><MoreHorizontal /></button></div>
            {expensesByCategory.length > 0 ? (
              <>
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expensesByCategory} dataKey="value" nameKey="name" innerRadius={63} outerRadius={85} paddingAngle={4} stroke="none">
                        {expensesByCategory.map((entry, index) => <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center"><span>Total spent</span><strong>{money(totals.expense)}</strong></div>
                </div>
                <div className="category-legend">
                  {expensesByCategory.slice(0, 4).map((item, index) => (
                    <div className="category-row" key={item.name}><span className="category-name"><i style={{ background: categoryColors[index % categoryColors.length] }} />{item.name}</span><strong>{money(item.value)}</strong></div>
                  ))}
                </div>
              </>
            ) : <p className="empty-state">Add an expense to see your breakdown.</p>}
          </article>
        </section>

        <section className="panel transactions-panel" id="transactions">
          <div className="panel-heading transaction-heading">
            <div><h3>Recent transactions</h3><p>Keep track of your latest activity</p></div>
            <button className="text-button" onClick={() => setFilter(filter === "ALL" ? "EXPENSE" : "ALL")}>{filter === "ALL" ? "View expenses" : "View all"} <ArrowUpRight size={16} /></button>
          </div>
          <div className="transaction-tools">
            <div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." /></div>
            <div className="filter-tabs">
              {["ALL", "INCOME", "EXPENSE"].map((item) => <button key={item} className={filter === item ? "filter-tab selected" : "filter-tab"} onClick={() => setFilter(item)}>{item === "ALL" ? "All" : item === "INCOME" ? "Income" : "Expenses"}</button>)}
            </div>
          </div>
          <div className="transaction-table">
            <div className="transaction-table-head"><span>TRANSACTION</span><span>CATEGORY</span><span>DATE</span><span>AMOUNT</span></div>
            {visibleTransactions.length ? visibleTransactions.map((t) => {
              const Icon = categoryIcons[t.category] || ReceiptText;
              return (
                <div className="transaction-row" key={t.id}>
                  <div className="transaction-name"><div className={`transaction-icon ${t.type === "INCOME" ? "income-bg" : "expense-bg"}`}><Icon size={18} /></div><div><strong>{t.title}</strong><span>{t.type === "INCOME" ? "Money received" : "Money spent"}</span></div></div>
                  <span className="category-pill">{t.category}</span>
                  <span className="transaction-date">{new Date(`${t.date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <strong className={t.type === "INCOME" ? "amount-positive" : "amount-negative"}>{t.type === "INCOME" ? "+" : "−"}{money(t.amount)}</strong>
                  <div style={{ display: "flex", gap: "8px" }}>
  <button
    type="button"
    className="secondary-button"
    onClick={() => startEditing(t)}
  >
    Edit
  </button>

  <button
    type="button"
    className="secondary-button"
    onClick={() => handleDelete(t.id)}
  >
    Delete
  </button>
</div>
                </div>
              );
            }) : <p className="empty-state">No transactions match your search.</p>}
          </div>
          <div className="table-footer">Showing <strong>{visibleTransactions.length}</strong> transactions <span>Amounts in INR (₹)</span></div>
        </section>

        <footer className="page-footer">Made for better money habits <span>✦</span> <span>Finora Personal Finance</span></footer>
      </main>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form className="transaction-modal" onSubmit={addTransaction}>
            <div className="modal-heading"><div><h2>{editingId !== null ? "Edit transaction" : "Add transaction"}</h2><p>Record income or an expense</p></div><button
  type="button"
  className="icon-button"
  onClick={() => {
    setShowForm(false);
    setEditingId(null);
  }}
  aria-label="Close"
>
  <X />
</button></div>
            <label>Transaction title<input required maxLength={150} placeholder="e.g. Grocery shopping" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Amount (₹)<input required type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            <label>Transaction type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select></label>
            <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{["Food", "Transport", "Shopping", "Housing", "Health", "Salary", "Freelance", "Other"].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <div className="modal-actions"><button
  type="button"
  className="secondary-button"
  onClick={() => {
    setShowForm(false);
    setEditingId(null);
  }}
>
  Cancel
</button><button
  type="submit"
  className="primary-button"
  disabled={saving}
>
  <Plus size={17} />
  {saving ? "Saving..." : "Save transaction"}
</button></div>
            
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
