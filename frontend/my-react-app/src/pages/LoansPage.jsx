import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { TRANSLATIONS, getTranslator } from '../utils/translations';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export const LoansPage = () => {
  const navigate = useNavigate();
  const { language: lang = 'EN' } = useAuthStore();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;
  const t_str = getTranslator(lang);

  const getLoanIcon = (cropType) => {
    const lower = (cropType || '').toLowerCase();
    if (lower.includes('education')) return '🎓';
    if (lower.includes('kirana') || lower.includes('vendor') || lower.includes('store') || lower.includes('seller') || lower.includes('milk') || lower.includes('hardware') || lower.includes('cloth') || lower.includes('driver') || lower.includes('business')) return '🏪';
    return '🌾';
  };

  // Active filter tab: 'All', 'Pending', 'Approved', 'Rejected'
  const [activeTab, setActiveTab] = useState('All');

  // Selected loan for the right panel inspect drawer
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Decsisioning loader states
  const [isDecisioning, setIsDecisioning] = useState(false);

  // Registry dynamic state
  const [loans, setLoans] = useState([]);

  // Fetch all loans from FastAPI
  const fetchLoans = async () => {
    try {
      const res = await api.get('/api/loans');
      const formatted = res.data.map(loan => {
        const dateObj = new Date(loan.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        
        let statusText = "Pending";
        if (loan.status === "approved") statusText = "Approved";
        else if (loan.status === "rejected") statusText = "Rejected";
        else if (loan.status === "paid") statusText = "Paid";
        
        return {
          id: `LN-${loan.id}`,
          rawId: loan.id,
          name: loan.farmer_name || "Demo Farmer",
          phone: "+91 7975200593",
          crop: loan.crop_type,
          district: loan.district,
          amount: loan.amount,
          score: Math.round(loan.score),
          status: statusText,
          date: formattedDate,
          land: `${loan.land_acres} Acres`,
          shg: loan.shg_member ? "Yes" : "No",
          interest: "8.5%",
          avatar: (loan.farmer_name || "Demo Farmer").charAt(0)
        };
      });
      setLoans(formatted);
    } catch (err) {
      console.error("Cooperative registry fetch failed, using fallback:", err);
      setLoans([
        {
          id: "LN-9082",
          rawId: 1,
          name: "Ravi Kumar",
          phone: "+91 7975200593",
          crop: t_str("Paddy"),
          district: "Mandya",
          amount: 45000,
          score: 84,
          status: "Approved",
          date: "May 12, 2026",
          land: "6.4 Acres",
          shg: "Yes (Mandya Farmers Co-op)",
          interest: "8.5%",
          avatar: "R"
        },
        {
          id: "LN-3829",
          rawId: 2,
          name: "Lakshmi Devi",
          phone: "+91 9845209812",
          crop: t_str("Wheat"),
          district: "Belagavi",
          amount: 65000,
          score: 78,
          status: "Pending",
          date: "May 25, 2026",
          land: "4.2 Acres",
          shg: "Yes (Kittur Mahila SHG)",
          interest: "8.5%",
          avatar: "L"
        }
      ]);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Handle Approve (PATCH /api/loans/{id}/approve)
  const handleApprove = async (id, rawId) => {
    setIsDecisioning(true);
    toast.loading("Uploading e-signature to registry...", { id: "decision-toast" });

    try {
      const targetId = rawId || parseInt(id.replace("LN-", ""));
      await api.patch(`/api/loans/${targetId}/approve`);
      updateLoanStatus(id, "Approved");
      toast.success(t_str("Approved! SMS sent."), { id: "decision-toast" });
    } catch (err) {
      console.error(err);
      toast.error("Cooperative approval failed.", { id: "decision-toast" });
    } finally {
      setIsDecisioning(false);
    }
  };

  // Handle Reject (PATCH /api/loans/{id}/reject)
  const handleReject = async (id, rawId) => {
    setIsDecisioning(true);
    toast.loading("Registering rejection deed...", { id: "decision-toast" });

    try {
      const targetId = rawId || parseInt(id.replace("LN-", ""));
      await api.patch(`/api/loans/${targetId}/reject`, { reason: "Did not clear cooperative credit thresholds" });
      updateLoanStatus(id, "Rejected");
      toast.error(t_str("Application Rejected."), { id: "decision-toast" });
    } catch (err) {
      console.error(err);
      toast.error("Cooperative rejection failed.", { id: "decision-toast" });
    } finally {
      setIsDecisioning(false);
    }
  };

  const updateLoanStatus = (id, newStatus) => {
    const updated = loans.map((loan) => {
      if (loan.id === id) {
        const nextLoan = { ...loan, status: newStatus };
        // Sync open inspector state as well
        setSelectedLoan(nextLoan);
        return nextLoan;
      }
      return loan;
    });
    setLoans(updated);
  };

  // Filter computation
  const filteredLoans = loans.filter((loan) => {
    if (activeTab === 'All') return true;
    return loan.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Page Content with ml-60 Layout Offset */}
      <main className="ml-60 flex-1 p-6 sm:p-8 flex gap-6 overflow-hidden max-h-screen">
        
        {/* Left Side: Directory & List Panel */}
        <section className="flex-1 flex flex-col bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden min-w-0">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-gray-900">{t.loans.title}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{t.loans.subtitle}</p>
            </div>
            
            <button
              onClick={() => navigate('/apply')}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-green-600/10 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ {t.loans.applyNewLoan}</span>
            </button>
          </div>

          {/* Filter Tabs Row */}
          <div className="flex border-b border-gray-100 mb-5 text-xs font-bold">
            {[t.sidebar.all || 'All', t.dashboard.pending, t.dashboard.disbursed, t.dashboard.rejected].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-4 border-b-2 transition-all ${
                    isActive
                      ? 'border-green-600 text-green-600 font-extrabold'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">{t.profile.name}</th>
                  <th className="pb-3">{t.profile.cropType}</th>
                  <th className="pb-3">{t.profile.district}</th>
                  <th className="pb-3 text-right">{t.dashboard.tableAmount}</th>
                  <th className="pb-3 text-center">{t.profile.trustScore}</th>
                  <th className="pb-3 text-center">{t.dashboard.tableStatus}</th>
                  <th className="pb-3 text-right">{t.dashboard.tableDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400 font-medium">No registrations match this filter.</td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const isSelected = selectedLoan?.id === loan.id;
                    return (
                      <tr
                        key={loan.id}
                        onClick={() => setSelectedLoan(loan)}
                        className={`hover:bg-gray-50/50 cursor-pointer transition-all ${
                          isSelected ? 'bg-green-50/40 border-l-4 border-green-500 pl-3' : ''
                        }`}
                      >
                        <td className="py-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-black text-xs shadow-sm">
                            {loan.avatar}
                          </div>
                          <div>
                            <p className="text-gray-800 font-extrabold">{loan.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 font-mono">{loan.phone}</p>
                          </div>
                        </td>
                        <td className="py-3.5 text-gray-800 flex items-center gap-1.5">
                          <span>{getLoanIcon(loan.crop)}</span>
                          <span>{loan.crop}</span>
                        </td>
                        <td className="py-3.5 text-gray-500 font-semibold">{loan.district}</td>
                        <td className="py-3.5 text-right text-gray-800 font-extrabold">₹{loan.amount.toLocaleString()}</td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-block w-8 py-0.5 rounded font-black text-[10px] ${
                            loan.score >= 70
                              ? 'text-green-600 bg-green-50'
                              : loan.score >= 50
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-red-500 bg-red-50'
                          }`}>
                            {loan.score}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            loan.status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : loan.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right text-gray-400 font-medium font-mono">{loan.date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Side: Inspection Drawer Panel (w-80) */}
        {selectedLoan && (
          <aside className="w-80 bg-white border border-gray-100 shadow-sm rounded-3xl p-5 flex flex-col justify-between overflow-y-auto animate-slide-in relative z-10">
            {/* Close Button */}
            <button
              onClick={() => setSelectedLoan(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-6">
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center mt-2 border-b border-gray-50 pb-5">
                <div className="w-14 h-14 rounded-full bg-green-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-green-950/15 mb-3">
                  {selectedLoan.avatar}
                </div>
                <h3 className="text-base font-black text-gray-800">{selectedLoan.name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedLoan.phone}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedLoan.id}</p>
              </div>

              {/* Score Meter */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">NABARD Risk Score</p>
                <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 font-black text-lg ${
                  selectedLoan.score >= 70
                    ? 'border-green-500 text-green-600 bg-green-50/10'
                    : selectedLoan.score >= 50
                    ? 'border-amber-500 text-amber-500 bg-amber-50/10'
                    : 'border-red-500 text-red-500 bg-red-50/10'
                }`}>
                  {selectedLoan.score}
                </div>
              </div>

              {/* Borrowing Details */}
              {/* Borrowing Details */}
              {(() => {
                const isAgri = !selectedLoan.crop.toLowerCase().includes('education') && 
                               !['kirana', 'vendor', 'store', 'seller', 'milk', 'hardware', 'cloth', 'driver', 'business'].some(kw => selectedLoan.crop.toLowerCase().includes(kw));
                return (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3 text-xs font-bold text-gray-700">
                    <div className="flex justify-between border-b border-gray-100/50 pb-1.5">
                      <span className="text-gray-400">{isAgri ? "Crop Cultivation" : "Loan Category"}</span>
                      <span className="text-gray-800 flex items-center gap-1">
                        <span>{getLoanIcon(selectedLoan.crop)}</span>
                        <span>{selectedLoan.crop}</span>
                      </span>
                    </div>
                    {isAgri && (
                      <div className="flex justify-between border-b border-gray-100/50 pb-1.5">
                        <span className="text-gray-400">Land Area</span>
                        <span className="text-gray-800">{selectedLoan.land}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-gray-100/50 pb-1.5">
                      <span className="text-gray-400">District</span>
                      <span className="text-gray-800">{selectedLoan.district}</span>
                    </div>
                    {isAgri && (
                      <div className="flex justify-between border-b border-gray-100/50 pb-1.5">
                        <span className="text-gray-400">SHG Affiliation</span>
                        <span className="text-gray-800 truncate max-w-[120px]">{selectedLoan.shg}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-gray-100/50 pb-1.5">
                      <span className="text-gray-400">{t_str("Principal Amount")}</span>
                      <span className="text-green-600">₹{selectedLoan.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t_str("Annual Interest")}</span>
                      <span className="text-gray-800">{selectedLoan.interest}</span>
                    </div>
                  </div>
                );
              })()}

              {/* KYC Document Placeholders */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t_str("KYC Verifications")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center gap-1.5">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5" />
                    </svg>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{t_str("Aadhaar Card")}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center gap-1.5">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Land Deed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decisions Pane */}
            <div className="border-t border-gray-150 pt-5 mt-6">
              {selectedLoan.status === 'Pending' ? (
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleApprove(selectedLoan.id, selectedLoan.rawId)}
                    disabled={isDecisioning}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-green-600/10 flex items-center justify-center gap-1.5"
                  >
                    <span>✅ Approve Application</span>
                  </button>
                  <button
                    onClick={() => handleReject(selectedLoan.id, selectedLoan.rawId)}
                    disabled={isDecisioning}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 border border-red-100 disabled:bg-gray-100 disabled:text-gray-300 disabled:border-gray-250 text-red-600 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>❌ Reject Application</span>
                  </button>
                </div>
              ) : (
                <div className={`p-4 rounded-2xl border text-center text-xs font-bold leading-normal ${
                  selectedLoan.status === 'Approved'
                    ? 'bg-green-50 border-green-100 text-green-800'
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                  <p className="font-extrabold uppercase text-[10px] tracking-wider mb-1">
                    {selectedLoan.status === 'Approved' ? t_str("Cooperative Approved") : t_str("Risk Rejected")}
                  </p>
                  <p className="font-medium text-[11px] opacity-80 leading-relaxed">
                    {selectedLoan.status === 'Approved'
                      ? 'This application has been successfully verified, signed, and the crop credit amount disbursed to the cooperative wallet.'
                      : 'This application did not clear cooperative credit thresholds due to historical crop risks.'}
                  </p>
                </div>
              )}
            </div>

          </aside>
        )}

      </main>
    </div>
  );
};

export default LoansPage;
