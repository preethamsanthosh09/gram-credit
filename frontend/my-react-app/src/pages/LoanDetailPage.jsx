import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HarvestCalendar from '../components/HarvestCalendar';

export const LoanDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock details for the active crop loan
  const loanDetails = {
    id: id || "LN-9082",
    amount: 45000,
    crop: "Paddy",
    status: "Disbursed",
    appliedDate: "May 12, 2026",
    disbursementDate: "May 15, 2026",
    interestRate: "12% p.a.",
    repaymentType: "Harvest-aligned",
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
            <h1 className="text-2xl font-black text-gray-900">Loan Details - {loanDetails.id}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Active credit contract particulars and harvest-aligned repayment calendar.</p>
          </div>
        </header>

        {/* Details Grid */}
        <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main particulars panel (Left 1/3) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
            <h3 className="font-extrabold text-sm text-gray-800 border-b border-gray-50 pb-2">Contract Summary</h3>
            
            <div className="space-y-3.5 text-xs font-bold">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">Status</span>
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-800 uppercase">
                  {loanDetails.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">Crop Cultivation</span>
                <span className="text-gray-800">{loanDetails.crop}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">Principal Principal</span>
                <span className="text-green-600 font-extrabold">₹{loanDetails.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">Annual Interest</span>
                <span className="text-gray-800">{loanDetails.interestRate}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">Repayment Mode</span>
                <span className="text-gray-800">{loanDetails.repaymentType}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">Applied Date</span>
                <span className="text-gray-500 font-medium">{loanDetails.appliedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Disbursed Date</span>
                <span className="text-gray-500 font-medium">{loanDetails.disbursementDate}</span>
              </div>
            </div>
          </div>

          {/* Harvest Calendar integration (Right 2/3) */}
          <div className="md:col-span-2">
            <HarvestCalendar crop={loanDetails.crop} amount={loanDetails.amount} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default LoanDetailPage;
