import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('seeds');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeLoans, setActiveLoans] = useState([
    { id: 'LN-9082', amount: 45000, purpose: 'Tractor Maintenance', status: 'Disbursed', date: 'May 12, 2026' },
    { id: 'LN-7612', amount: 15000, purpose: 'Organic Fertilizer', status: 'Paid', date: 'April 02, 2026' }
  ]);

  const stats = [
    { title: 'Total Active Credit', value: '₹45,000', subtitle: '1 active loan', color: 'text-green-600' },
    { title: 'Approved Limit', value: '₹1,500,000', subtitle: 'Based on land holding', color: 'text-emerald-600' },
    { title: 'Next Payment Due', value: '₹3,750', subtitle: 'Due on June 15, 2026', color: 'text-amber-600' },
    { title: 'Registered Acreage', value: '6.4 Acres', subtitle: 'Verified via Bhoomi API', color: 'text-blue-600' }
  ];

  const handleApplyLoan = (e) => {
    e.preventDefault();
    const amount = parseFloat(loanAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid loan amount');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newLoan = {
        id: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
        amount,
        purpose: loanPurpose.charAt(0).toUpperCase() + loanPurpose.slice(1) + ' Purchase',
        status: 'Pending Approval',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      };
      setActiveLoans([newLoan, ...activeLoans]);
      setLoanAmount('');
      toast.success('Credit Application submitted successfully!');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area with ml-60 Layout Offset */}
      <main className="ml-60 flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">GramCredit Farmer Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Hello, {user?.name || 'Ravi Kumar'} • Harvesting progress and credit statements.</p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
              ● Server Connected
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              ₹ INR (English)
            </span>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</p>
              <h3 className={`text-2xl font-black mt-2 ${stat.color}`}>{stat.value}</h3>
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            </div>
          ))}
        </section>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Apply for Quick Credit (Left / 2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Quick Credit Apply
                </h2>
                <button
                  onClick={() => navigate('/apply')}
                  className="text-xs font-extrabold text-green-600 hover:text-green-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-all"
                >
                  Full Application →
                </button>
              </div>
              <form onSubmit={handleApplyLoan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 block">Credit Category</label>
                    <select
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-green-500 focus:bg-white text-gray-800 transition-all text-sm"
                    >
                      <option value="seeds">High-Yield Seeds</option>
                      <option value="fertilizer">Organic Fertilizers</option>
                      <option value="equipment">Farming Machinery</option>
                      <option value="irrigation">Drip Irrigation System</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 block">Required Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-green-500 focus:bg-white text-gray-800 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-600/10 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Credit Application'}
                </button>
              </form>
            </div>

            {/* Active Credit Table */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Credit Statements</h2>
                <button
                  onClick={() => navigate('/loans')}
                  className="text-xs font-extrabold text-green-600 hover:text-green-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-all"
                >
                  View All Loans →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                      <th className="pb-3 font-semibold">Loan ID</th>
                      <th className="pb-3 font-semibold">Purpose</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                      <th className="pb-3 font-semibold text-right">Date</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm font-bold text-gray-700">
                    {activeLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        className="hover:bg-green-50/30 transition-colors cursor-pointer"
                      >
                        <td className="py-4 text-xs font-mono text-green-600 underline underline-offset-2">{loan.id}</td>
                        <td className="py-4 text-gray-800">{loan.purpose}</td>
                        <td className="py-4 text-right text-green-600">₹{loan.amount.toLocaleString()}</td>
                        <td className="py-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold ${
                              loan.status === 'Disbursed'
                                ? 'bg-green-100 text-green-800'
                                : loan.status === 'Paid'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-4 text-right text-gray-500 text-xs">{loan.date}</td>
                        <td className="py-4 text-right">
                          <span className="text-[10px] text-green-600 font-extrabold">View →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Harvest Calendar & Market Rates (Right / 1 Col) */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-base font-extrabold mb-2">💡 Farmer Tip of the Day</h3>
              <p className="text-xs text-green-100 leading-relaxed">
                Applying fertilizer 2 weeks prior to monsoon peak yields up to 14% higher wheat quality. Use GramCredit fertilizers micro-financing to purchase supplies now and pay after harvest.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-4">🌾 APMC Market Rates (Today)</h3>
              <div className="space-y-3 text-xs font-bold">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Wheat (Premium)</span>
                  <span className="text-gray-900">₹2,450 <span className="text-gray-400">/ Quintal</span></span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Rice (Basmati)</span>
                  <span className="text-gray-900">₹6,800 <span className="text-gray-400">/ Quintal</span></span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Cotton</span>
                  <span className="text-gray-900">₹7,200 <span className="text-gray-400">/ Quintal</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
