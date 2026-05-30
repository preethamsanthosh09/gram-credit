import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { TRANSLATIONS, getTranslator } from '../utils/translations';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HarvestCalendar from '../components/HarvestCalendar';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const LoanDetailPage = () => {
  const { language: lang = 'EN' } = useAuthStore();
  const t_str = getTranslator(lang);
  const navigate = useNavigate();
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        const cleanId = id.replace('LN-', '');
        const res = await api.get(`/api/loans/${cleanId}`);
        setLoan(res.data);
      } catch (err) {
        console.error("Failed to fetch loan details:", err);
        toast.error("Failed to load loan details from backend.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoanDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="ml-60 flex-1 p-6 sm:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-bold text-gray-500">Retrieving dynamic credit ledger details…</p>
          </div>
        </main>
      </div>
    );
  }

  const displayedLoan = loan || {
    id: id || "LN-9082",
    amount: 45000,
    crop_type: t_str("Paddy"),
    status: "Disbursed",
    created_at: "May 12, 2026",
    approved_at: "May 15, 2026",
    score: 84,
    tier: "Standard",
    repayment_mode: "harvest",
  };

  const statusText = displayedLoan.status === "approved" 
    ? "Disbursed" 
    : displayedLoan.status === "pending" 
      ? "Pending Approval" 
      : displayedLoan.status === "rejected" 
        ? "Rejected" 
        : displayedLoan.status === "paid" 
          ? "Paid" 
          : displayedLoan.status;

  const appliedDate = new Date(displayedLoan.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const disbursementDate = displayedLoan.approved_at 
    ? new Date(displayedLoan.approved_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) 
    : "Pending Approval";

  const interestRate = displayedLoan.tier === "Premium" 
    ? "10% p.a." 
    : displayedLoan.tier === "Standard" 
      ? "12% p.a." 
      : "14% p.a.";

  const repaymentType = displayedLoan.repayment_mode === "harvest" 
    ? "Harvest-aligned" 
    : displayedLoan.repayment_mode === "yearly" 
      ? "Yearly Bullet" 
      : "Monthly EMI";

  const isAgri = !displayedLoan.crop_type.toLowerCase().includes('education') && 
                 !['kirana', 'vendor', 'store', 'seller', 'merchant', 'driver', 'business'].some(kw => displayedLoan.crop_type.toLowerCase().includes(kw));

  const loanDetails = {
    id: `LN-${displayedLoan.id}`,
    farmerName: displayedLoan.farmer_name || "Demo Farmer",
    amount: displayedLoan.amount,
    crop: displayedLoan.crop_type,
    status: statusText,
    appliedDate: appliedDate,
    disbursementDate: disbursementDate,
    interestRate: interestRate,
    repaymentType: repaymentType,
    tenureMonths: 12
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Page Content with ml-60 layout offset */}
      <main className="ml-60 flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* Top Header */}
        <header className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{t.loans.activeLoans} - {loanDetails.id}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Active credit contract particulars and repayment calendar for {loanDetails.farmerName}.</p>
          </div>
        </header>

        {/* Details Grid */}
        <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main particulars panel (Left 1/3) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
            <h3 className="font-extrabold text-sm text-gray-800 border-b border-gray-50 pb-2">{t.transactions.balanceSummary}</h3>
            
            <div className="space-y-3.5 text-xs font-bold">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">{t.profile.name}</span>
                <span className="text-gray-800 font-extrabold">{loanDetails.farmerName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">{t.dashboard.tableStatus}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  loanDetails.status === "Disbursed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {loanDetails.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">{isAgri ? t.profile.cropType : t.loans.cropType}</span>
                <span className="text-gray-800 truncate max-w-[150px]">{loanDetails.crop}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">{t.loans.disbursedAmt}</span>
                <span className="text-green-600 font-extrabold">₹{loanDetails.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">{t.loans.interestRate}</span>
                <span className="text-gray-800">{loanDetails.interestRate}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">{t.loans.repaymentMode}</span>
                <span className="text-gray-800">{loanDetails.repaymentType}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">{t.dashboard.tableDate}</span>
                <span className="text-gray-500 font-medium">{loanDetails.appliedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t.vendors.invoiceDate}</span>
                <span className="text-gray-500 font-medium">{loanDetails.disbursementDate}</span>
              </div>
            </div>
          </div>

          {/* Repayment Calendar integration (Right 2/3) */}
          <div className="md:col-span-2">
            <HarvestCalendar crop={loanDetails.crop} amount={loanDetails.amount} repayments={displayedLoan.repayments} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default LoanDetailPage;
