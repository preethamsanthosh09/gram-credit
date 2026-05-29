import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const vendorTypes = [
  { name: 'Kirana Store', icon: '🏪', avg_loan: 15000 },
  { name: 'Vegetable Seller', icon: '🥦', avg_loan: 5000 },
  { name: 'Milk Vendor', icon: '🥛', avg_loan: 8000 },
  { name: 'Hardware Shop', icon: '🔧', avg_loan: 25000 },
  { name: 'Cloth Merchant', icon: '🧵', avg_loan: 20000 },
  { name: 'Auto Driver', icon: '🛺', avg_loan: 12000 },
]

const weeklyData = [
  { day: 'Mon', sales: 1200, repaid: 150 },
  { day: 'Tue', sales: 980, repaid: 150 },
  { day: 'Wed', sales: 1450, repaid: 150 },
  { day: 'Thu', sales: 1100, repaid: 150 },
  { day: 'Fri', sales: 1800, repaid: 150 },
  { day: 'Sat', sales: 2100, repaid: 150 },
  { day: 'Sun', sales: 600, repaid: 0 },
]

const mockLoan = {
  amount: 15000, daily_emi: 150, days_remaining: 68,
  paid_days: 32, total_days: 100, next_due: 'Today',
  business: 'Ravi Kirana Store', status: 'active'
}

export default function VendorPage() {
  const [tab, setTab] = useState('dashboard')
  const [vendorType, setVendorType] = useState('')
  const [step, setStep] = useState(1)
  const [loanAmount, setLoanAmount] = useState(15000)
  const [businessName, setBusinessName] = useState('')
  const [dailySales, setDailySales] = useState('')

  const progressPct = Math.round((mockLoan.paid_days / mockLoan.total_days) * 100)

  const handleApply = () => {
    if (step === 1 && !vendorType) return toast.error('Select your business type')
    if (step === 2 && !businessName) return toast.error('Enter business name')
    if (step < 3) { setStep(s => s + 1); return }
    toast.success('Vendor loan applied! Approval in 2 hours.')
    setTab('dashboard')
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-60 flex-1 min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Vendor Finance</h1>
            <p className="text-sm text-gray-500">Daily repayment micro-loans for small businesses</p>
          </div>
          <button onClick={() => { setTab('apply'); setStep(1) }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            + Apply for Vendor Loan
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-white px-8">
          {['dashboard', 'apply', 'repay'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium border-b-2 capitalize transition
                ${tab === t ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'dashboard' ? '📊 My Loan' : t === 'apply' ? '📝 Apply' : '💳 Daily Repay'}
            </button>
          ))}
        </div>

        <div className="p-8">
          {tab === 'dashboard' && (
            <div className="space-y-6">
              {/* Active loan card */}
              <div className="bg-white rounded-xl border border-green-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{mockLoan.business}</h2>
                    <p className="text-sm text-gray-500">Active vendor loan</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">Active</span>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-800">₹{mockLoan.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Loan amount</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">₹{mockLoan.daily_emi}</div>
                    <div className="text-xs text-gray-500">Daily EMI</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-xl font-bold text-amber-600">{mockLoan.days_remaining}</div>
                    <div className="text-xs text-gray-500">Days remaining</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{mockLoan.paid_days}</div>
                    <div className="text-xs text-gray-500">Days paid</div>
                  </div>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-500">Repayment progress</span>
                  <span className="font-medium text-gray-800">{progressPct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-green-600 rounded-full" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Today's repayment */}
              <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">Today's repayment due</h3>
                    <p className="text-2xl font-bold text-amber-600 mt-1">₹150</p>
                    <p className="text-sm text-gray-500 mt-1">Pay before 8 PM via UPI</p>
                  </div>
                  <button onClick={() => { setTab('repay'); toast.success('Opening payment...') }}
                    className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600">
                    Pay Now ₹150
                  </button>
                </div>
              </div>

              {/* Weekly chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">This week — daily sales vs repayment</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#dbeafe" name="Sales ₹" radius={[4,4,0,0]} />
                    <Bar dataKey="repaid" fill="#16a34a" name="Repaid ₹" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab === 'apply' && (
            <div className="max-w-xl mx-auto">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-0 mb-8">
                {['Business Type', 'Details', 'Loan Terms'].map((label, i) => (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm
                        ${step > i+1 ? 'bg-green-600 text-white' : step === i+1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {step > i+1 ? '✓' : i+1}
                      </div>
                      <span className={`text-xs mt-1 ${step===i+1?'text-green-600 font-medium':'text-gray-400'}`}>{label}</span>
                    </div>
                    {i < 2 && <div className={`w-20 h-1 mx-2 mb-4 ${step>i+1?'bg-green-600':'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                {step === 1 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">What type of business do you run?</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {vendorTypes.map(v => (
                        <button key={v.name} onClick={() => setVendorType(v.name)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition
                            ${vendorType === v.name ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <span className="text-2xl">{v.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{v.name}</div>
                            <div className="text-xs text-gray-500">Avg loan ₹{v.avg_loan.toLocaleString()}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold text-gray-800">Business details</h2>
                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">Business name</label>
                      <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                        placeholder="e.g. Ravi Kirana Store"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">Average daily sales (₹)</label>
                      <input type="number" value={dailySales} onChange={e => setDailySales(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">Years in business</label>
                      <div className="flex gap-2">
                        {['<1 year', '1–3 years', '3–5 years', '5+ years'].map(y => (
                          <button key={y} className="flex-1 py-2 text-xs border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50">{y}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold text-gray-800">Loan terms</h2>
                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">
                        Loan amount: <span className="text-green-600 font-bold text-lg">₹{loanAmount.toLocaleString()}</span>
                      </label>
                      <input type="range" min={2000} max={50000} step={1000} value={loanAmount}
                        onChange={e => setLoanAmount(Number(e.target.value))} className="w-full accent-green-600" />
                      <div className="flex justify-between text-xs text-gray-400 mt-1"><span>₹2,000</span><span>₹50,000</span></div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-800 mb-2">Your repayment plan</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between"><span>Daily EMI</span><span className="font-bold text-green-600">₹{Math.round(loanAmount / 100)}/day</span></div>
                        <div className="flex justify-between"><span>Duration</span><span className="font-medium">100 days</span></div>
                        <div className="flex justify-between"><span>Interest</span><span className="font-medium">18% p.a.</span></div>
                        <div className="flex justify-between"><span>Total repayable</span><span className="font-bold">₹{Math.round(loanAmount * 1.05).toLocaleString()}</span></div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                      💡 Daily repayment of ₹{Math.round(loanAmount/100)} = just 10% of your estimated daily sales. Manageable!
                    </div>
                  </div>
                )}

                <button onClick={handleApply}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 mt-6">
                  {step < 3 ? 'Continue →' : 'Apply for Vendor Loan ✓'}
                </button>
                {step > 1 && (
                  <button onClick={() => setStep(s => s-1)} className="w-full text-gray-500 text-sm mt-2">← Back</button>
                )}
              </div>
            </div>
          )}

          {tab === 'repay' && (
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-5xl mb-4">💳</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Daily Repayment</h2>
                <div className="text-4xl font-bold text-green-600 mb-1">₹150</div>
                <p className="text-gray-500 text-sm mb-6">Day 33 of 100</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Business</span><span className="font-medium">Ravi Kirana Store</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Loan ID</span><span className="font-medium">#VL-2026-001</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">UPI ID</span><span className="font-medium">gramcredit@upi</span></div>
                </div>
                <button onClick={() => toast.success('Payment of ₹150 received! Day 33/100 complete.')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 mb-3">
                  Pay ₹150 via UPI
                </button>
                <p className="text-xs text-gray-400">Payment auto-debits at 8 PM if not done manually</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
