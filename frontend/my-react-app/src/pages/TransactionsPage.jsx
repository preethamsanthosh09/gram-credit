import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuthStore } from '../store/useAuthStore'

// ─── Data ────────────────────────────────────────────────────────────────────

const INITIAL_TRANSACTIONS = [
  { id: 1,  type: 'loan_received', title: 'Loan Disbursed',      subtitle: 'GramCredit • Paddy loan',          amount: 50000, sign: '+', date: '2026-05-10', time: '10:32 AM', status: 'completed', category: 'Loan',       icon: '🏦', color: 'green'  },
  { id: 2,  type: 'expense',       title: 'Labour Payment',       subtitle: 'Field ploughing • Cash',            amount: 5000,  sign: '-', date: '2026-05-10', time: '2:15 PM',  status: 'completed', category: 'Labour',     icon: '👷', color: 'red'    },
  { id: 3,  type: 'expense',       title: 'Seeds Purchase',       subtitle: 'Paddy seeds • Mandya market',       amount: 3200,  sign: '-', date: '2026-05-08', time: '9:45 AM',  status: 'completed', category: 'Seeds',      icon: '🌱', color: 'red'    },
  { id: 4,  type: 'repayment',     title: 'Loan Repayment',       subtitle: 'EMI • November harvest',            amount: 8500,  sign: '-', date: '2026-05-07', time: '6:00 PM',  status: 'completed', category: 'Repayment',  icon: '💳', color: 'amber'  },
  { id: 5,  type: 'expense',       title: 'Fertilizer',           subtitle: 'Urea 2 bags • AgriStore',           amount: 1800,  sign: '-', date: '2026-05-06', time: '11:20 AM', status: 'completed', category: 'Fertilizer', icon: '🧪', color: 'red'    },
  { id: 6,  type: 'scheme',        title: 'PM-Kisan Credit',      subtitle: 'Govt scheme • PFMS transfer',       amount: 2000,  sign: '+', date: '2026-05-05', time: '8:00 AM',  status: 'completed', category: 'Scheme',     icon: '🏛️', color: 'green'  },
  { id: 7,  type: 'expense',       title: 'Equipment Repair',     subtitle: 'Pump repair • Local mechanic',      amount: 2500,  sign: '-', date: '2026-05-04', time: '3:30 PM',  status: 'completed', category: 'Equipment',  icon: '🚜', color: 'red'    },
  { id: 8,  type: 'repayment',     title: 'Vendor EMI',           subtitle: 'Daily repayment • Kirana loan',     amount: 150,   sign: '-', date: '2026-05-04', time: '8:05 AM',  status: 'completed', category: 'Repayment',  icon: '🏪', color: 'amber'  },
  { id: 9,  type: 'expense',       title: 'Food & Ration',        subtitle: 'Monthly ration • PDS shop',         amount: 1200,  sign: '-', date: '2026-05-03', time: '10:00 AM', status: 'completed', category: 'Food',       icon: '🍚', color: 'red'    },
  { id: 10, type: 'transfer',      title: 'SHG Contribution',     subtitle: 'Mandya Farmers Circle • ROSCA',     amount: 1000,  sign: '-', date: '2026-05-01', time: '9:00 AM',  status: 'completed', category: 'ROSCA',      icon: '🤝', color: 'purple' },
  { id: 11, type: 'loan_received', title: 'Education Loan',       subtitle: 'GramCredit • For Kavya Kumar',      amount: 35000, sign: '+', date: '2026-04-28', time: '11:00 AM', status: 'completed', category: 'Loan',       icon: '🎓', color: 'green'  },
  { id: 12, type: 'repayment',     title: 'Vendor EMI',           subtitle: 'Daily repayment • Kirana loan',     amount: 150,   sign: '-', date: '2026-04-28', time: '8:03 AM',  status: 'completed', category: 'Repayment',  icon: '🏪', color: 'amber'  },
  { id: 13, type: 'scheme',        title: 'PMFBY Insurance',      subtitle: 'Crop insurance • Premium deducted', amount: 650,   sign: '-', date: '2026-04-25', time: '12:00 PM', status: 'completed', category: 'Insurance',  icon: '🛡️', color: 'blue'   },
  { id: 14, type: 'transfer',      title: 'UPI Transfer',         subtitle: 'Received from Suresh Patil',        amount: 500,   sign: '+', date: '2026-04-20', time: '5:45 PM',  status: 'completed', category: 'Transfer',   icon: '📲', color: 'green'  },
  { id: 15, type: 'expense',       title: 'Seeds Purchase',       subtitle: 'Wheat seeds • Dharwad market',      amount: 2800,  sign: '-', date: '2026-04-18', time: '8:30 AM',  status: 'pending',   category: 'Seeds',      icon: '🌱', color: 'red'    },
]

const TYPE_FILTERS = [
  { id: 'all',          label: 'All' },
  { id: 'loan_received',label: 'Loans' },
  { id: 'repayment',    label: 'Repayments' },
  { id: 'expense',      label: 'Expenses' },
  { id: 'scheme',       label: 'Schemes' },
  { id: 'transfer',     label: 'Transfers' },
]

const CAT_META = {
  Seeds:      { icon: '🌱', color: '#16a34a', light: '#dcfce7', budget: 5000  },
  Fertilizer: { icon: '🧪', color: '#d97706', light: '#fef3c7', budget: 4000  },
  Labour:     { icon: '👷', color: '#2563eb', light: '#dbeafe', budget: 8000  },
  Equipment:  { icon: '🚜', color: '#6b7280', light: '#f3f4f6', budget: 5000  },
  Food:       { icon: '🍚', color: '#ea580c', light: '#ffedd5', budget: 3000  },
  Repayment:  { icon: '💳', color: '#f59e0b', light: '#fefce8', budget: 10000 },
  Loan:       { icon: '🏦', color: '#10b981', light: '#d1fae5', budget: 0     },
  Scheme:     { icon: '🏛️', color: '#8b5cf6', light: '#ede9fe', budget: 0     },
  ROSCA:      { icon: '🤝', color: '#ec4899', light: '#fce7f3', budget: 2000  },
  Insurance:  { icon: '🛡️', color: '#0ea5e9', light: '#e0f2fe', budget: 1500  },
  Transfer:   { icon: '📲', color: '#14b8a6', light: '#ccfbf1', budget: 0     },
  Other:      { icon: '📦', color: '#9ca3af', light: '#f9fafb', budget: 2000  },
}

const MONTHLY_TREND = [
  { month: 'Jan', income: 35000, expense: 12000 },
  { month: 'Feb', income: 20000, expense: 15000 },
  { month: 'Mar', income: 55000, expense: 22000 },
  { month: 'Apr', income: 37500, expense: 18500 },
  { month: 'May', income: 87000, expense: 23000 },
]

const EXPENSE_CATS = ['Seeds', 'Fertilizer', 'Labour', 'Equipment', 'Food', 'ROSCA', 'Other']

// ─── UPI Static Data ─────────────────────────────────────────────────────────
const UPI_CONTACTS = [
  { id: 1, name: 'Suresh Patil',   upi: 'suresh.patil@okaxis',  initials: 'SP', color: '#16a34a', lastPaid: '₹500',   lastDate: 'May 20' },
  { id: 2, name: 'Kavitha Devi',   upi: 'kavitha@ybl',          initials: 'KD', color: '#2563eb', lastPaid: '₹1,200', lastDate: 'May 18' },
  { id: 3, name: 'AgriMart Store', upi: 'agrimart@okhdfc',      initials: 'AM', color: '#d97706', lastPaid: '₹3,200', lastDate: 'May 8'  },
  { id: 4, name: 'Ramu Mechanic',  upi: 'ramu123@paytm',        initials: 'RM', color: '#6b7280', lastPaid: '₹2,500', lastDate: 'May 4'  },
  { id: 5, name: 'GramCredit',     upi: 'gramcredit@okicici',   initials: 'GC', color: '#10b981', lastPaid: '₹8,500', lastDate: 'May 7'  },
  { id: 6, name: 'Mandya FPC',     upi: 'mandyafpc@okhdfcbank', initials: 'MF', color: '#8b5cf6', lastPaid: '₹6,000', lastDate: 'Apr 28' },
]

const UPI_BANKS = [
  { id: 1, name: 'State Bank of India',  last4: '4832', balance: '₹12,450', logo: '🏛️', primary: true  },
  { id: 2, name: 'Punjab National Bank', last4: '9201', balance: '₹5,200',  logo: '🏦', primary: false },
]

const UPI_RECENT = [
  { id: 'U1', to: 'Suresh Patil',   upi: 'suresh.patil@okaxis', amount: 500,  date: 'May 20', type: 'sent',     initials: 'SP', color: '#16a34a' },
  { id: 'U2', to: 'AgriMart Store', upi: 'agrimart@okhdfc',     amount: 3200, date: 'May 8',  type: 'sent',     initials: 'AM', color: '#d97706' },
  { id: 'U3', to: 'Kavitha Devi',   upi: 'kavitha@ybl',         amount: 1200, date: 'May 18', type: 'received', initials: 'KD', color: '#2563eb' },
  { id: 'U4', to: 'GramCredit EMI', upi: 'gramcredit@okicici',  amount: 8500, date: 'May 7',  type: 'sent',     initials: 'GC', color: '#10b981' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByDate(transactions) {
  const groups = {}
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  transactions.forEach(t => {
    const label = t.date === today ? 'Today' : t.date === yesterday ? 'Yesterday' : t.date
    if (!groups[label]) groups[label] = []
    groups[label].push(t)
  })
  return groups
}

// SVG Donut chart — no external deps
function DonutChart({ data, size = 160, thickness = 28 }) {
  const r = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="flex items-center justify-center" style={{ width: size, height: size }}><span className="text-3xl">💰</span></div>

  let offset = 0
  const slices = data.map(d => {
    const dash = (d.value / total) * circ
    const slice = { ...d, dash, offset }
    offset += dash
    return slice
  })

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash - 2} ${circ - s.dash + 2}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs font-bold text-gray-400">Total Spent</p>
        <p className="text-base font-black text-gray-800">₹{total.toLocaleString()}</p>
      </div>
    </div>
  )
}

// Animated progress bar
function BudgetBar({ spent, budget, color }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const over = budget > 0 && spent > budget
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: over ? '#ef4444' : color,
        }}
      />
    </div>
  )
}

// Mini bar chart
function BarChart({ data }) {
  const maxIncome = Math.max(...data.map(d => d.income))
  const maxAll = Math.max(maxIncome, ...data.map(d => d.expense))
  const barH = 80

  return (
    <div className="flex items-end gap-2">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end gap-0.5 w-full" style={{ height: barH }}>
            <div
              className="flex-1 rounded-t-md bg-green-400/80 transition-all duration-700"
              style={{ height: `${(d.income / maxAll) * barH}px` }}
              title={`Income ₹${d.income.toLocaleString()}`}
            />
            <div
              className="flex-1 rounded-t-md bg-red-400/80 transition-all duration-700"
              style={{ height: `${(d.expense / maxAll) * barH}px` }}
              title={`Expense ₹${d.expense.toLocaleString()}`}
            />
          </div>
          <p className="text-[10px] font-bold text-gray-400">{d.month}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onAdd }) {
  const [cat, setCat] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleAdd = () => {
    if (!cat) return toast.error('Select a category')
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount')
    onAdd({ cat, amount: Number(amount), note, date })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Top gradient bar */}
        <div className="bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold opacity-75 uppercase tracking-widest">Expense Tracker</p>
            <h2 className="text-xl font-black">Log an Expense</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Category grid */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATS.map(c => {
                const m = CAT_META[c]
                return (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-200 ${
                      cat === c ? 'border-transparent shadow-lg scale-105' : 'border-gray-100 hover:border-gray-200'
                    }`}
                    style={cat === c ? { background: m.light, borderColor: m.color } : {}}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-[10px] font-bold text-gray-600">{c}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount</p>
            <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-rose-400 transition-all">
              <span className="px-4 text-xl font-black text-gray-400 border-r border-gray-200 py-3">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 px-4 py-3 text-2xl font-black text-gray-900 focus:outline-none bg-transparent"
              />
            </div>
            {/* Quick amounts */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[500, 1000, 2000, 5000].map(q => (
                <button key={q} onClick={() => setAmount(String(q))} className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all">
                  ₹{q.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Note & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note</p>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Mandya market"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-rose-400 transition-all"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</p>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-rose-400 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-400 text-white font-black rounded-2xl shadow-lg shadow-rose-400/25 hover:shadow-rose-400/40 transition-all active:scale-95 text-base"
          >
            Add Expense →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Transaction Detail Panel ─────────────────────────────────────────────────
function DetailPanel({ txn, onClose, onDelete }) {
  const colorMap = { green: '#16a34a', red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6', purple: '#8b5cf6' }
  const bgMap = { green: '#dcfce7', red: '#fee2e2', amber: '#fef3c7', blue: '#dbeafe', purple: '#ede9fe' }
  return (
    <div className="p-5 h-full overflow-auto">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-gray-800">Transaction Detail</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all text-xs">✕</button>
      </div>

      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: bgMap[txn.color] || '#f3f4f6' }}>
        {txn.icon}
      </div>
      <div className="text-center mb-5">
        <p className="text-3xl font-black" style={{ color: txn.sign === '+' ? '#16a34a' : '#ef4444' }}>
          {txn.sign}₹{txn.amount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-1 font-semibold">{txn.title}</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm mb-4">
        {[
          ['Description', txn.subtitle],
          ['Category', txn.category],
          ['Date', txn.date],
          ['Time', txn.time],
          ['Status', txn.status === 'completed' ? '✅ Completed' : '⏳ Pending'],
          ['Txn ID', `#TXN-2026-${String(txn.id).padStart(4,'0')}`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-gray-400 font-semibold text-xs uppercase tracking-wider">{label}</span>
            <span className="font-bold text-gray-800 text-right text-xs capitalize">{value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <button onClick={() => toast.success('Receipt downloaded!')} className="w-full border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all">
          📄 Download Receipt
        </button>
        {txn.type === 'expense' && (
          <button onClick={() => onDelete(txn.id)} className="w-full border-2 border-red-100 text-red-500 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">
            🗑 Delete Expense
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Expense Tracker Tab ──────────────────────────────────────────────────────
function ExpenseTracker({ transactions, trendData, onAddExpense }) {
  const [budgets, setBudgets] = useState(
    Object.fromEntries(Object.entries(CAT_META).map(([k, v]) => [k, v.budget]))
  )
  const [editingBudget, setEditingBudget] = useState(null)
  const [budgetInput, setBudgetInput] = useState('')

  const expenses = transactions.filter(t => t.sign === '-')
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter(t => t.sign === '+').reduce((s, t) => s + t.amount, 0)

  // Category breakdown (only expenses)
  const catBreakdown = useMemo(() => {
    const map = {}
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
    return Object.entries(map).map(([name, value]) => ({
      name, value,
      color: CAT_META[name]?.color || '#9ca3af',
      light: CAT_META[name]?.light || '#f9fafb',
      icon:  CAT_META[name]?.icon  || '📦',
    })).sort((a, b) => b.value - a.value)
  }, [expenses])

  // Insights
  const insights = useMemo(() => {
    const tips = []
    catBreakdown.forEach(c => {
      const bud = budgets[c.name]
      if (bud > 0 && c.value > bud) tips.push({ type: 'warning', text: `${c.icon} ${c.name} budget exceeded by ₹${(c.value - bud).toLocaleString()}!` })
      else if (bud > 0 && c.value / bud > 0.8) tips.push({ type: 'caution', text: `${c.icon} ${c.name} is at ${Math.round((c.value / bud) * 100)}% of budget — watch out!` })
    })
    if (totalExpense > totalIncome * 0.6) tips.push({ type: 'warning', text: '📊 Spending is over 60% of income this period.' })
    if (tips.length === 0) tips.push({ type: 'success', text: '🎉 Great job! All categories are within budget limits.' })
    return tips
  }, [catBreakdown, budgets, totalExpense, totalIncome])

  const saveBudget = (cat) => {
    const val = Number(budgetInput)
    if (isNaN(val) || val < 0) return toast.error('Enter a valid budget')
    setBudgets(p => ({ ...p, [cat]: val }))
    setEditingBudget(null)
    setBudgetInput('')
    toast.success(`Budget updated for ${cat}`)
  }

  return (
    <div className="p-6 space-y-7">

      {/* Top summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Income', value: `+₹${totalIncome.toLocaleString()}`, sub: 'This period', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Total Expenses', value: `-₹${totalExpense.toLocaleString()}`, sub: 'All outflows', color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
          { label: 'Net Savings', value: `${totalIncome - totalExpense >= 0 ? '+' : ''}₹${(totalIncome - totalExpense).toLocaleString()}`, sub: 'Income − Expenses', color: totalIncome >= totalExpense ? 'text-indigo-600' : 'text-red-500', bg: 'bg-indigo-50 border-indigo-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-5`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut + legend */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-800">Spending by Category</h2>
            <button
              onClick={onAddExpense}
              className="text-xs font-black text-rose-500 hover:text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-all border border-rose-200"
            >+ Add</button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <DonutChart data={catBreakdown} size={160} thickness={28} />
            <div className="flex-1 space-y-2 w-full">
              {catBreakdown.slice(0, 6).map(c => {
                const pct = totalExpense > 0 ? ((c.value / totalExpense) * 100).toFixed(1) : 0
                return (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-xs font-bold text-gray-700 flex-1 truncate">{c.icon} {c.name}</span>
                    <span className="text-xs font-black text-gray-800">₹{c.value.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 font-semibold w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Monthly trends */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="font-black text-gray-800 mb-1">Monthly Trends</h2>
          <p className="text-xs text-gray-400 font-medium mb-4">Income vs Expenses — Jan to May 2026</p>
          <BarChart data={trendData} />
          <div className="flex items-center gap-4 mt-4">
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><span className="w-3 h-3 rounded-sm bg-green-400/80 inline-block" />Income</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><span className="w-3 h-3 rounded-sm bg-red-400/80 inline-block" />Expenses</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {trendData.slice(-1).map(m => (
              <>
                <div key="inc" className="bg-green-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-green-600 uppercase">May Income</p>
                  <p className="text-base font-black text-green-700">₹{m.income.toLocaleString()}</p>
                </div>
                <div key="exp" className="bg-rose-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-rose-600 uppercase">May Expense</p>
                  <p className="text-base font-black text-rose-700">₹{m.expense.toLocaleString()}</p>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-lg">🤖</span> Smart Insights
        </h2>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl text-sm font-semibold ${
              ins.type === 'warning' ? 'bg-red-50 text-red-700 border border-red-100' :
              ins.type === 'caution' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
              'bg-green-50 text-green-700 border border-green-100'
            }`}>
              <span className="text-lg mt-0.5">{ins.type === 'warning' ? '⚠️' : ins.type === 'caution' ? '💡' : '✅'}</span>
              <p>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget manager */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-black text-gray-800">Monthly Budgets</h2>
            <p className="text-xs text-gray-400 mt-0.5">Set limits per category · click to edit</p>
          </div>
          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
            {catBreakdown.filter(c => budgets[c.name] > 0 && c.value <= budgets[c.name]).length} / {catBreakdown.filter(c => budgets[c.name] > 0).length} on track
          </span>
        </div>

        <div className="space-y-4">
          {catBreakdown.map(c => {
            const budget = budgets[c.name] || 0
            const over = budget > 0 && c.value > budget
            const pct = budget > 0 ? Math.min((c.value / budget) * 100, 100) : 0
            const isEditing = editingBudget === c.name

            return (
              <div key={c.name} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-sm font-black text-gray-700">{c.name}</span>
                    {over && <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full">OVER</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        <span className="text-xs text-gray-400 font-bold">₹</span>
                        <input
                          autoFocus
                          type="number"
                          value={budgetInput}
                          onChange={e => setBudgetInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveBudget(c.name); if (e.key === 'Escape') setEditingBudget(null) }}
                          className="w-20 border-2 border-indigo-400 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none text-center"
                          placeholder={String(budget)}
                        />
                        <button onClick={() => saveBudget(c.name)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-indigo-700 transition-all">✓</button>
                        <button onClick={() => setEditingBudget(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-xs font-bold ${over ? 'text-red-500' : 'text-gray-500'}`}>
                          ₹{c.value.toLocaleString()} {budget > 0 && `/ ₹${budget.toLocaleString()}`}
                        </span>
                        <button
                          onClick={() => { setEditingBudget(c.name); setBudgetInput(String(budget)) }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-all px-2 py-0.5 rounded-lg hover:bg-indigo-50"
                        >Edit</button>
                      </>
                    )}
                  </div>
                </div>

                <BudgetBar spent={c.value} budget={budget} color={c.color} />

                {budget > 0 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{pct.toFixed(0)}% used</span>
                    {!over && <span className="text-[10px] text-gray-400">₹{(budget - c.value).toLocaleString()} remaining</span>}
                    {over && <span className="text-[10px] text-red-500 font-bold">₹{(c.value - budget).toLocaleString()} over limit!</span>}
                  </div>
                )}
                {budget === 0 && <p className="text-[10px] text-gray-400 mt-1">No budget set · hover to add one</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Expense Log (filtered) */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-800">Expense Log</h2>
          <button
            onClick={onAddExpense}
            className="flex items-center gap-1.5 text-sm font-black text-white bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-2 rounded-xl shadow-md shadow-rose-400/20 hover:shadow-rose-400/35 transition-all active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Expense
          </button>
        </div>

        <div className="space-y-2">
          {expenses.slice(0, 8).map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: CAT_META[t.category]?.light || '#f9fafb' }}>
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-800 truncate">{t.title}</p>
                <p className="text-xs text-gray-400 truncate">{t.subtitle} · {t.date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-rose-500">-₹{t.amount.toLocaleString()}</p>
                <p className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5" style={{ background: CAT_META[t.category]?.light || '#f9fafb', color: CAT_META[t.category]?.color || '#9ca3af' }}>
                  {t.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SVG QR Code (decorative) ───────────────────────────────────────────────
function QRCode({ value, size = 160 }) {
  // Generate a visually convincing QR-like SVG pattern
  const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng = (i) => ((seed * 9301 + i * 49297) % 233280) / 233280
  const cells = 21
  const cell = size / cells
  const blocks = []
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const inFinder = (r < 8 && c < 8) || (r < 8 && c > cells - 9) || (r > cells - 9 && c < 8)
      if (inFinder) continue
      if (rng(r * cells + c) > 0.52) {
        blocks.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell - 0.5} height={cell - 0.5} rx={0.5} fill="#111827" />)
      }
    }
  }
  const fp = (x, y) => (
    <g key={`fp${x}${y}`}>
      <rect x={x} y={y} width={cell*7} height={cell*7} rx={2} fill="#111827" />
      <rect x={x+cell} y={y+cell} width={cell*5} height={cell*5} rx={1.5} fill="white" />
      <rect x={x+cell*2} y={y+cell*2} width={cell*3} height={cell*3} rx={1} fill="#111827" />
    </g>
  )
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" rx={4} />
      {blocks}
      {fp(0, 0)}
      {fp((cells - 7) * cell, 0)}
      {fp(0, (cells - 7) * cell)}
    </svg>
  )
}

// ─── UPI Pay Tab ─────────────────────────────────────────────────────────────
function UPIPayTab({ onPaymentDone }) {
  const [screen, setScreen]   = useState('home')   // home | send | pin | success | myqr | request
  const [step, setStep]       = useState(1)         // 1=upiid, 2=amount
  const [upiInput, setUpiInput] = useState('')
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [amount, setAmount]   = useState('')
  const [note, setNote]       = useState('')
  const [pin, setPin]         = useState('')
  const [paying, setPaying]   = useState(false)
  const [paidTo, setPaidTo]   = useState(null)
  const [reqAmount, setReqAmount] = useState('')
  const [reqNote, setReqNote] = useState('')
  const [copied, setCopied]   = useState(false)
  const MY_UPI = 'ravikumar.farmer@gramcredit'

  const quickAmounts = [200, 500, 1000, 2000, 5000]

  const handleVerify = () => {
    if (!upiInput.includes('@') && !/^\d{10}$/.test(upiInput)) {
      toast.error('Enter a valid UPI ID (e.g. name@bank) or 10-digit mobile'); return
    }
    setVerifying(true)
    setTimeout(() => { setVerifying(false); setVerified(true); setStep(2) }, 1200)
  }

  const handleContactPick = (c) => {
    setUpiInput(c.upi); setVerified(true); setStep(2); setScreen('send')
  }

  const handlePay = () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    setScreen('pin'); setPin('')
  }

  const handlePinKey = (k) => {
    if (k === 'del') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= 6) return
    const next = pin + k
    setPin(next)
    if (next.length === 6) {
      setPaying(true)
      setTimeout(() => {
        setPaying(false)
        setPaidTo({ upi: upiInput, amount: Number(amount), note })
        setScreen('success')
        onPaymentDone({ upi: upiInput, amount: Number(amount), note })
      }, 1800)
    }
  }

  const resetFlow = () => {
    setScreen('home'); setStep(1); setUpiInput(''); setVerified(false)
    setAmount(''); setNote(''); setPin(''); setPaying(false); setPaidTo(null)
  }

  const handleCopyUPI = () => {
    navigator.clipboard?.writeText(MY_UPI).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast.success('UPI ID copied!')
  }

  const handleCopyReqLink = () => {
    const link = `upi://pay?pa=${MY_UPI}&am=${reqAmount}&tn=${encodeURIComponent(reqNote)}`
    navigator.clipboard?.writeText(link).catch(() => {})
    toast.success('Payment request link copied!')
  }

  // ── Home screen ──────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <div className="max-w-2xl mx-auto p-6 space-y-7">

      {/* Wallet balance strip */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white p-6 shadow-2xl shadow-violet-800/30">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-4 w-28 h-28 bg-white/5 rounded-full" />
        <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">GramCredit UPI Wallet</p>
        <p className="text-4xl font-black tracking-tight">₹12,450<span className="text-lg opacity-60">.00</span></p>
        <p className="text-xs text-violet-200 font-semibold mt-1 font-mono">{MY_UPI}</p>
        <div className="flex gap-3 mt-5">
          <div className="bg-white/15 rounded-2xl px-4 py-2 text-xs font-bold">
            <p className="opacity-70 text-violet-100 mb-0.5">Linked Bank</p>
            <p>SBI •••• 4832</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-2 text-xs font-bold">
            <p className="opacity-70 text-violet-100 mb-0.5">UPI Limit</p>
            <p>₹1,00,000/day</p>
          </div>
        </div>
      </div>

      {/* Quick action grid */}
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Send Money',  icon: '↑', grad: 'from-violet-500 to-indigo-600',  action: () => { setScreen('send'); setStep(1) } },
            { label: 'Request',     icon: '↓', grad: 'from-green-500 to-emerald-600', action: () => setScreen('request') },
            { label: 'My QR',       icon: '⬛', grad: 'from-gray-700 to-gray-900',    action: () => setScreen('myqr') },
            { label: 'Pay Contact', icon: '👤', grad: 'from-blue-500 to-cyan-600',     action: () => { setScreen('send'); setStep(1) } },
            { label: 'Pay EMI',     icon: '📋', grad: 'from-amber-500 to-orange-600', action: () => { setUpiInput('gramcredit@okicici'); setVerified(true); setStep(2); setScreen('send') } },
            { label: 'Pay Bills',   icon: '🧾', grad: 'from-rose-500 to-pink-600',    action: () => toast.success('Bill payment coming soon!') },
            { label: 'History',     icon: '🕐', grad: 'from-teal-500 to-cyan-600',    action: () => toast.success('Showing recent UPI transactions') },
            { label: 'More',        icon: '⋯',  grad: 'from-slate-500 to-slate-700',  action: () => toast.success('More services coming soon!') },
          ].map(qa => (
            <button key={qa.label} onClick={qa.action} className="flex flex-col items-center gap-2.5 group">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${qa.grad} text-white text-xl font-black flex items-center justify-center shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-200`}>
                {qa.icon}
              </div>
              <span className="text-[11px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors text-center leading-tight">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent Contacts</p>
          <button className="text-xs font-bold text-violet-600 hover:text-violet-800">See all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {UPI_CONTACTS.map(c => (
            <button key={c.id} onClick={() => handleContactPick(c)} className="flex flex-col items-center gap-2 flex-shrink-0 group">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-sm font-black shadow-md group-hover:scale-110 group-active:scale-95 transition-all duration-200" style={{ background: c.color }}>
                {c.initials}
              </div>
              <p className="text-[11px] font-bold text-gray-700 text-center w-16 truncate">{c.name.split(' ')[0]}</p>
              <p className="text-[10px] text-gray-400 font-semibold">{c.lastPaid}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent UPI transactions */}
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Recent UPI Transactions</p>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {UPI_RECENT.map((u, idx) => (
            <div key={u.id} className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all ${idx < UPI_RECENT.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{ background: u.color }}>
                {u.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-800 truncate">{u.to}</p>
                <p className="text-xs text-gray-400 font-medium">{u.upi} · {u.date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-black ${u.type === 'received' ? 'text-green-600' : 'text-rose-500'}`}>
                  {u.type === 'received' ? '+' : '-'}₹{u.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{u.type === 'received' ? 'Received' : 'Paid'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked accounts */}
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Linked Bank Accounts</p>
        <div className="space-y-2">
          {UPI_BANKS.map(b => (
            <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <span className="text-2xl">{b.logo}</span>
              <div className="flex-1">
                <p className="text-sm font-black text-gray-800">{b.name}</p>
                <p className="text-xs text-gray-400 font-mono">•••• •••• •••• {b.last4}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">{b.balance}</p>
                {b.primary && <span className="text-[10px] font-black bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Primary</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Send Money screen ─────────────────────────────────────────────────────
  if (screen === 'send') return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={resetFlow} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h2 className="text-lg font-black text-gray-900">Send Money</h2>
          <p className="text-xs text-gray-400 font-medium">Step {step} of 2</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex gap-2 mb-8">
        {[1,2].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-violet-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">UPI ID or Mobile Number</p>
            <div className="relative">
              <input
                type="text"
                value={upiInput}
                onChange={e => { setUpiInput(e.target.value); setVerified(false) }}
                placeholder="name@bank or 9876543210"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-violet-500 transition-all pr-24"
              />
              {verified
                ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-green-600 flex items-center gap-1">✓ Verified</span>
                : <button onClick={handleVerify} disabled={verifying || !upiInput}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-violet-600 text-white text-xs font-black px-3 py-1.5 rounded-xl disabled:opacity-50 hover:bg-violet-700 transition-all">
                    {verifying ? '…' : 'Verify'}
                  </button>
              }
            </div>
          </div>

          {/* Recent picks */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Recent Contacts</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {UPI_CONTACTS.map(c => (
                <button key={c.id} onClick={() => handleContactPick(c)} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md group-hover:scale-110 transition-all" style={{ background: c.color }}>
                    {c.initials}
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 w-12 text-center truncate">{c.name.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          {/* Recipient chip */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
              {upiInput[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">{upiInput}</p>
              <p className="text-xs text-violet-600 font-bold flex items-center gap-1"><span className="text-green-500">✓</span> UPI ID Verified</p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Amount</p>
            <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-violet-500 transition-all bg-white">
              <span className="px-5 text-2xl font-black text-gray-300 border-r border-gray-200 py-4">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 px-4 py-4 text-3xl font-black text-gray-900 focus:outline-none bg-transparent"
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {quickAmounts.map(q => (
                <button key={q} onClick={() => setAmount(String(q))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                    amount === String(q) ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-700'
                  }`}>
                  ₹{q.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Note (optional)</p>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Seed payment, EMI..."
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>

          <button
            onClick={handlePay}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 transition-all active:scale-95 text-base"
          >
            Pay ₹{amount ? Number(amount).toLocaleString() : '0'} →
          </button>
        </div>
      )}
    </div>
  )

  // ── PIN screen ────────────────────────────────────────────────────────────
  if (screen === 'pin') return (
    <div className="max-w-sm mx-auto p-6 flex flex-col items-center">
      <button onClick={() => setScreen('send')} className="self-start w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all mb-6">
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>

      {/* Lock icon */}
      <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
        {paying
          ? <svg className="animate-spin w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        }
      </div>

      <p className="text-lg font-black text-gray-900 mb-1">{paying ? 'Processing...' : 'Enter UPI PIN'}</p>
      <p className="text-xs text-gray-400 font-medium mb-8">Paying ₹{Number(amount).toLocaleString()} to {upiInput}</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
            i < pin.length
              ? 'bg-violet-600 border-violet-600 scale-110'
              : 'border-gray-300'
          }`} />
        ))}
      </div>

      {/* Keypad */}
      {!paying && (
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
            <button
              key={i}
              onClick={() => k && handlePinKey(k)}
              disabled={!k}
              className={`h-14 rounded-2xl text-lg font-black transition-all active:scale-90 ${
                !k ? 'invisible' :
                k === 'del' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm' :
                'bg-white border-2 border-gray-200 text-gray-900 hover:border-violet-400 hover:bg-violet-50 shadow-sm'
              }`}
            >
              {k === 'del' ? '⌫' : k}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ── Success screen ────────────────────────────────────────────────────────
  if (screen === 'success') return (
    <div className="max-w-sm mx-auto p-6 flex flex-col items-center text-center" style={{ animation: 'fadeIn .4s ease both' }}>
      {/* Animated checkmark */}
      <div className="relative mb-6 mt-6">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center" style={{ animation: 'popIn .5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {/* Confetti rings */}
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 0 8px #dcfce7, 0 0 0 16px #f0fdf4', animation: 'ringOut .6s ease .3s both' }} />
      </div>

      <p className="text-2xl font-black text-gray-900 mb-1">Payment Successful!</p>
      <p className="text-sm text-gray-500 font-medium mb-6">Your payment has been processed</p>

      <div className="bg-gray-50 rounded-2xl p-5 w-full text-left space-y-3 mb-7">
        {[
          ['Paid To',    paidTo?.upi],
          ['Amount',     `₹${paidTo?.amount?.toLocaleString()}`],
          ['Note',       paidTo?.note || '—'],
          ['Date & Time', new Date().toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })],
          ['Txn Ref',    `GC${Date.now().toString().slice(-10)}`],
          ['Status',     '✅ Completed'],
        ].map(([l,v]) => (
          <div key={l} className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{l}</span>
            <span className="text-xs font-black text-gray-800 text-right font-mono">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <button onClick={() => toast.success('Receipt downloaded!')} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl text-sm font-black text-gray-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all">
          📄 Receipt
        </button>
        <button onClick={resetFlow} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-sm font-black shadow-md hover:shadow-lg transition-all active:scale-95">
          New Payment
        </button>
      </div>
    </div>
  )

  // ── My QR screen ─────────────────────────────────────────────────────────
  if (screen === 'myqr') return (
    <div className="max-w-sm mx-auto p-6">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={resetFlow} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-lg font-black text-gray-900">My Payment QR</h2>
      </div>

      <div className="bg-white border-2 border-gray-100 rounded-3xl p-7 flex flex-col items-center shadow-sm mb-5">
        {/* GramCredit brand above QR */}
        <div className="flex items-center gap-2 mb-5">
          <svg className="w-7 h-7 text-green-600" viewBox="0 0 64 64" fill="none"><path d="M32 4C18 12 14 26 14 40C14 48.8 20.2 56 32 60C43.8 56 50 48.8 50 40C50 26 46 12 32 4Z" fill="currentColor"/><path d="M32 18V46M24 36H40M27 26H37" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-base font-black text-gray-800">GramCredit Pay</span>
        </div>

        <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
          <QRCode value={MY_UPI} size={180} />
        </div>

        <p className="text-sm font-black text-gray-800 mt-5">{MY_UPI}</p>
        <p className="text-xs text-gray-400 font-medium mt-1">Scan to pay Ravi Kumar</p>
      </div>

      <div className="flex gap-3">
        <button onClick={handleCopyUPI} className={`flex-1 py-3.5 border-2 rounded-2xl text-sm font-black transition-all ${
          copied ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50'
        }`}>
          {copied ? '✓ Copied!' : '📋 Copy UPI ID'}
        </button>
        <button onClick={() => toast.success('QR image saved!')} className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-sm font-black shadow-md hover:shadow-lg transition-all active:scale-95">
          ⬇ Save QR
        </button>
      </div>
    </div>
  )

  // ── Request Money screen ──────────────────────────────────────────────────
  if (screen === 'request') return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={resetFlow} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-lg font-black text-gray-900">Request Money</h2>
      </div>

      <div className="space-y-5">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-sm">RC</div>
          <div>
            <p className="text-sm font-black text-gray-900">Ravi Kumar</p>
            <p className="text-xs text-green-600 font-mono font-bold">{MY_UPI}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Amount to Request</p>
          <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-green-500 transition-all">
            <span className="px-5 text-2xl font-black text-gray-300 border-r border-gray-200 py-4">₹</span>
            <input
              type="number"
              value={reqAmount}
              onChange={e => setReqAmount(e.target.value)}
              placeholder="0"
              className="flex-1 px-4 py-4 text-3xl font-black text-gray-900 focus:outline-none bg-transparent"
              autoFocus
            />
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {quickAmounts.map(q => (
              <button key={q} onClick={() => setReqAmount(String(q))}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                  reqAmount === String(q) ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700'
                }`}>
                ₹{q.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Reason (optional)</p>
          <input
            type="text"
            value={reqNote}
            onChange={e => setReqNote(e.target.value)}
            placeholder="e.g. For seed payment"
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:border-green-500 transition-all"
          />
        </div>

        <button
          onClick={handleCopyReqLink}
          disabled={!reqAmount}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          📤 Copy Request Link
        </button>
        <p className="text-center text-xs text-gray-400">Share the link — anyone with a UPI app can pay you</p>
      </div>
    </div>
  )

  return null
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('transactions') // 'transactions' | 'tracker'
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [trendData, setTrendData] = useState([
    { month: 'Jan', income: 35000, expense: 12000 },
    { month: 'Feb', income: 20000, expense: 15000 },
    { month: 'Mar', income: 55000, expense: 22000 },
    { month: 'Apr', income: 37500, expense: 18500 },
    { month: 'May', income: 87000, expense: 23000 },
  ])

  // Compute live calculations from state
  const filtered = useMemo(() => transactions.filter(t => {
    const matchFilter = filter === 'all' || t.type === filter
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.subtitle.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  }), [transactions, filter, search])

  const grouped = groupByDate(filtered)

  const totalIn  = transactions.filter(t => t.sign === '+').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.sign === '-').reduce((s, t) => s + t.amount, 0)
  const balance  = totalIn - totalOut

  // Fetch real ledger data from FastAPI
  const fetchLedger = async () => {
    if (!user?.id) return;
    
    try {
      // 1. Fetch expenses
      const expRes = await api.get(`/api/expenses?user_id=${user.id}`);
      const apiExpenses = expRes.data.expenses.map(exp => {
        const catMeta = CAT_META[exp.category] || CAT_META.Other;
        return {
          id: `EXP-${exp.id}`,
          rawId: exp.id,
          type: 'expense',
          title: `${exp.category} Purchase`,
          subtitle: exp.note || 'Manual entry',
          amount: exp.amount,
          sign: '-',
          date: exp.date,
          time: '12:00 PM',
          status: 'completed',
          category: exp.category,
          icon: catMeta.icon,
          color: 'red'
        };
      });
      
      // 2. Fetch loans & parse disbursals & repayments
      const loansRes = await api.get(`/api/loans?user_id=${user.id}`);
      const apiLoans = [];
      
      loansRes.data.forEach(loan => {
        const dateObj = new Date(loan.created_at);
        const formattedDate = dateObj.toISOString().split('T')[0];
        
        if (loan.status === 'approved' || loan.status === 'paid') {
          apiLoans.push({
            id: `LN-DISB-${loan.id}`,
            rawId: loan.id,
            type: 'loan_received',
            title: 'Loan Disbursed',
            subtitle: `GramCredit • ${loan.crop_type} loan`,
            amount: loan.amount,
            sign: '+',
            date: formattedDate,
            time: '10:30 AM',
            status: 'completed',
            category: 'Loan',
            icon: '🏦',
            color: 'green'
          });
        }
        
        if (loan.repayments) {
          loan.repayments.forEach(rep => {
            if (rep.status === 'paid') {
              const repDateObj = new Date(rep.due_date);
              const repFormattedDate = repDateObj.toISOString().split('T')[0];
              apiLoans.push({
                id: `LN-REP-${rep.id}`,
                rawId: rep.id,
                type: 'repayment',
                title: 'Loan Repayment',
                subtitle: `EMI • GramCredit Repayment`,
                amount: rep.amount,
                sign: '-',
                date: repFormattedDate,
                time: '6:00 PM',
                status: 'completed',
                category: 'Repayment',
                icon: '💳',
                color: 'amber'
              });
            }
          });
        }
      });
      
      const merged = [...apiLoans, ...apiExpenses].sort((a, b) => b.date.localeCompare(a.date));
      
      if (merged.length === 0) {
        setTransactions(INITIAL_TRANSACTIONS);
      } else {
        setTransactions(merged);
      }
      
      // 3. Fetch monthly trends
      const trendRes = await api.get(`/api/expenses/monthly-trend?user_id=${user.id}`);
      const formattedTrend = trendRes.data.map(item => ({
        month: item.month,
        income: item.amount * 1.5 + 10000,
        expense: item.amount
      }));
      setTrendData(formattedTrend);
    } catch (err) {
      console.error("FastAPI ledger fetch failed, using fallback:", err);
      setTransactions(INITIAL_TRANSACTIONS);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [user]);

  const handleAddExpense = async ({ cat, amount, note, date }) => {
    try {
      await api.post('/api/expenses', {
        user_id: user.id,
        category: cat,
        amount,
        note,
        expense_date: date
      });
      toast.success(`₹${amount.toLocaleString()} ${cat} expense logged!`);
      setShowAddExpense(false);
      fetchLedger();
    } catch (err) {
      console.error("Add expense failed:", err);
      // Simulated fallback
      const t = {
        id: `EXP-MOCK-${Date.now()}`,
        type: 'expense',
        title: `${cat} Expense`,
        subtitle: note || 'Manual entry',
        amount, sign: '-', date,
        time: '12:00 PM',
        status: 'completed', category: cat,
        icon: CAT_META[cat]?.icon || '📦', color: 'red',
      }
      setTransactions(prev => [t, ...prev]);
      setShowAddExpense(false);
      toast.success(`₹${amount.toLocaleString()} ${cat} expense logged!`);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (String(id).startsWith("EXP-")) {
        const rawId = parseInt(id.replace("EXP-", ""));
        await api.delete(`/api/expenses/${rawId}?user_id=${user.id}`);
      } else {
        // Mock delete for initial seeding items if clicked
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
      toast.success('Expense deleted');
      setSelected(null);
      fetchLedger();
    } catch (err) {
      console.error("Delete expense failed:", err);
      setTransactions(prev => prev.filter(t => t.id !== id));
      setSelected(null);
      toast.success('Expense deleted');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        .animate-slide-up { animation: slideUp .3s cubic-bezier(0.34,1.3,.64,1) both }
        .animate-fade-in  { animation: fadeIn .2s ease both }
        .txn-row          { animation: fadeIn .25s ease both }
      `}</style>

      <Sidebar />

      <div className="ml-60 flex-1 flex flex-col">

        {/* ── Top Header ── */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-black text-gray-900">Transactions & Expenses</h1>
            <p className="text-sm text-gray-400 font-medium">Track every rupee in and out</p>
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-400 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-md shadow-rose-400/20 hover:shadow-rose-400/35 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Expense
          </button>
        </div>

        {/* ── Tab switcher ── */}
        <div className="bg-white border-b border-gray-100 px-8">
          <div className="flex gap-0">
            {[
              { id: 'transactions', label: '💳 Transactions',   desc: 'All money movement' },
              { id: 'tracker',      label: '📊 Expense Tracker', desc: 'Charts & budgets'   },
              { id: 'upi',          label: '🔷 UPI Pay',          desc: 'Send & receive money' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm font-black border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Transactions Tab ── */}
        {activeTab === 'transactions' && (
          <div className="flex flex-1 overflow-hidden">

            {/* Left: list */}
            <div className="flex-1 p-6 overflow-auto">

              {/* Balance cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Net Balance',     value: `${balance >= 0 ? '+' : ''}₹${Math.abs(balance).toLocaleString()}`, color: balance >= 0 ? 'text-green-600' : 'text-red-600', sub: 'This period', bg: 'bg-white' },
                  { label: 'Total Received',  value: `+₹${totalIn.toLocaleString()}`,  color: 'text-green-600', sub: 'Loans + schemes', bg: 'bg-white' },
                  { label: 'Total Spent',     value: `-₹${totalOut.toLocaleString()}`, color: 'text-rose-500',  sub: 'Expenses + EMI',  bg: 'bg-white' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-2xl p-5 shadow-sm border border-gray-100`}>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" /></svg>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-green-400 focus:bg-white bg-white transition-all"
                />
                {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>}
              </div>

              {/* Filter pills */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {TYPE_FILTERS.map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      filter === f.id ? 'bg-green-600 text-white shadow-md shadow-green-600/20' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
                    }`}>
                    {f.label}
                    <span className={`ml-1 ${filter === f.id ? 'text-green-100' : 'text-gray-400'}`}>
                      ({transactions.filter(t => f.id === 'all' || t.type === f.id).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Transaction groups */}
              {Object.entries(grouped).map(([dateLabel, txns]) => (
                <div key={dateLabel} className="mb-5">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{dateLabel}</p>
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="flex gap-2 text-xs font-bold">
                      {txns.some(t => t.sign === '+') && <span className="text-green-600">+₹{txns.filter(t=>t.sign==='+').reduce((s,t)=>s+t.amount,0).toLocaleString()}</span>}
                      {txns.some(t => t.sign === '-') && <span className="text-rose-500">-₹{txns.filter(t=>t.sign==='-').reduce((s,t)=>s+t.amount,0).toLocaleString()}</span>}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {txns.map((t, idx) => {
                      const bgMap = { green:'#dcfce7', red:'#fee2e2', amber:'#fef3c7', blue:'#dbeafe', purple:'#ede9fe' }
                      return (
                        <button key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)}
                          className={`txn-row w-full flex items-center gap-3 px-4 py-3 transition-all text-left hover:bg-gray-50 ${selected?.id === t.id ? 'bg-green-50' : ''} ${idx < txns.length - 1 ? 'border-b border-gray-50' : ''}`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: bgMap[t.color] || '#f3f4f6' }}>
                            {t.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-gray-800 truncate">{t.title}</p>
                              {t.status === 'pending' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Pending</span>}
                            </div>
                            <p className="text-xs text-gray-400 truncate font-medium">{t.subtitle} · {t.time}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-black ${t.sign === '+' ? 'text-green-600' : 'text-rose-500'}`}>
                              {t.sign}₹{t.amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{t.category}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="font-bold text-gray-500">No transactions found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>

            {/* Right: detail panel */}
            <div className="w-72 border-l border-gray-200 bg-white flex-shrink-0 overflow-auto">
              {selected ? (
                <DetailPanel txn={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />
              ) : (
                <div className="p-5">
                  <h3 className="font-black text-gray-800 mb-4">Spending Snapshot</h3>
                  {/* Mini donut in sidebar */}
                  {(() => {
                    const expenses = transactions.filter(t => t.sign === '-')
                    const map = {}
                    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
                    const catData = Object.entries(map).map(([name, value]) => ({ name, value, color: CAT_META[name]?.color || '#9ca3af' }))
                    return (
                      <>
                        <div className="flex justify-center mb-4">
                          <DonutChart data={catData} size={140} thickness={24} />
                        </div>
                        <div className="space-y-2">
                          {catData.sort((a,b)=>b.value-a.value).slice(0,5).map(c => (
                            <div key={c.name} className="flex items-center gap-2 text-xs">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                              <span className="text-gray-600 font-semibold flex-1">{CAT_META[c.name]?.icon} {c.name}</span>
                              <span className="font-black text-gray-800">₹{c.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <button onClick={() => setActiveTab('tracker')} className="w-full py-3 rounded-2xl border-2 border-dashed border-green-300 text-green-600 text-sm font-black hover:bg-green-50 transition-all">
                      📊 View Full Expense Tracker →
                    </button>
                  </div>
                  <div className="mt-3">
                    <button onClick={() => setShowAddExpense(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-rose-200 text-rose-500 text-sm font-black hover:bg-rose-50 transition-all">
                      + Log an Expense
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Expense Tracker Tab ── */}
        {activeTab === 'tracker' && (
          <div className="flex-1 overflow-auto">
            <ExpenseTracker transactions={transactions} trendData={trendData} onAddExpense={() => setShowAddExpense(true)} />
          </div>
        )}

        {/* ── UPI Pay Tab ── */}
        {activeTab === 'upi' && (
          <div className="flex-1 overflow-auto">
            <style>{`
              @keyframes popIn { from { opacity:0; transform:scale(0.4) } to { opacity:1; transform:scale(1) } }
              @keyframes ringOut { from { box-shadow:0 0 0 0 #dcfce7,0 0 0 0 #f0fdf4; opacity:1 } to { box-shadow:0 0 0 24px #dcfce7,0 0 0 48px #f0fdf4; opacity:0 } }
            `}</style>
            <UPIPayTab
              onPaymentDone={({ upi, amount, note }) => {
                const newTxn = {
                  id: Date.now(), type: 'transfer',
                  title: `UPI Pay — ${upi.split('@')[0]}`,
                  subtitle: `${note || 'UPI Transfer'} • ${upi}`,
                  amount, sign: '-',
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  status: 'completed', category: 'Transfer',
                  icon: '📲', color: 'purple',
                }
                setTransactions(prev => [newTxn, ...prev])
              }}
            />
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} onAdd={handleAddExpense} />}
    </div>
  )
}