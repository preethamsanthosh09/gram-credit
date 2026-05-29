import { useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';

export const ROSCAPage = () => {
  const [activeTab, setActiveTab] = useState('MyGroup');

  // Interactive My Group states
  const [highestBid, setHighestBid] = useState(9200);
  const [bidsCount, setBidsCount] = useState(3);
  const [myBid, setMyBid] = useState(9000);
  const [hasBidded, setHasBidded] = useState(false);
  const [isBiddingOpen, setIsBiddingOpen] = useState(false);

  const [totalPaid, setTotalPaid] = useState(3000);
  const [hasPaidCurrent, setHasPaidCurrent] = useState(true); // Month 3 paid
  const [isPaying, setIsPaying] = useState(false);

  // Tab 2 creation states
  const [newGroupName, setNewGroupName] = useState('');
  const [membersCount, setMembersCount] = useState(10);
  const [contributionFee, setContributionFee] = useState(1000);
  const [isCreating, setIsCreating] = useState(false);

  const handleBidSubmit = (e) => {
    e.preventDefault();
    const bidVal = Number(myBid);
    if (!bidVal || bidVal < 5000 || bidVal > 10000) {
      toast.error("Bid must be between ₹5,000 and ₹10,000.");
      return;
    }

    if (bidVal > highestBid) {
      toast.error("Your bid represents the payout you accept. A lower bid (higher discount) is standard to win the auction pool. Please try ₹9,000.");
      return;
    }

    setHighestBid(bidVal);
    setBidsCount(prev => prev + 1);
    setHasBidded(true);
    setIsBiddingOpen(false);
    toast.success("Bid submitted!");
  };

  const handlePayContribution = () => {
    setIsPaying(true);
    toast.loading("Connecting to UPI gateway...", { id: "payment-toast" });

    setTimeout(() => {
      setIsPaying(false);
      setTotalPaid(prev => prev + 1000);
      setHasPaidCurrent(true);
      toast.success("₹1,000 Contribution Paid Successfully!", { id: "payment-toast" });
    }, 1200);
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Please enter a valid Group Name.");
      return;
    }

    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      toast.success(`${newGroupName} created! Invites sent via SMS.`);
      // Reset creation form
      setNewGroupName('');
      // Redirect back to My Group to view active circle!
      setActiveTab('MyGroup');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Page Content with ml-60 layout offset */}
      <main className="ml-60 flex-1 p-6 sm:p-8 overflow-y-auto max-h-screen">
        
        {/* Page Header */}
        <header className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">ROSCA / Chit Fund Circles</h1>
            <p className="text-xs text-gray-500 mt-0.5">Participate in rotating community savings pools, place auction bids, and secure instant capital.</p>
          </div>

          {/* Tab Selection Row */}
          <div className="bg-white border border-gray-150 p-1 rounded-xl flex gap-1 shadow-sm text-xs font-bold">
            <button
              onClick={() => setActiveTab('MyGroup')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'MyGroup'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              My Group
            </button>
            <button
              onClick={() => setActiveTab('CreateGroup')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'CreateGroup'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Create Group
            </button>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="max-w-4xl mx-auto">
          
          {/* ========================================================
              TAB 1: MY GROUP VIEW
             ======================================================== */}
          {activeTab === 'MyGroup' && (
            <div className="space-y-6">
              
              {/* Header Card (green border) */}
              <div className="bg-white border-2 border-green-500 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                <div>
                  <span className="inline-flex px-2 py-0.5 rounded bg-green-100 text-green-800 text-[9px] font-black uppercase tracking-wider mb-2">
                    Active Chit Circle
                  </span>
                  <h2 className="text-xl font-black text-gray-800">Mandya Farmers Circle</h2>
                  <p className="text-xs text-gray-400 font-semibold mt-1">Cooperative Chit ID: GC-CHIT-9018</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-xs font-bold text-gray-500">
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Members</p>
                    <p className="text-gray-800 text-sm font-black mt-0.5">10 Farmers</p>
                  </div>
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Monthly Contribution</p>
                    <p className="text-gray-800 text-sm font-black mt-0.5">₹1,000</p>
                  </div>
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Pool Size</p>
                    <p className="text-green-600 text-sm font-black mt-0.5">₹10,000</p>
                  </div>
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Tenure</p>
                    <p className="text-gray-800 text-sm font-black mt-0.5">Month 3 of 10</p>
                  </div>
                </div>
              </div>

              {/* 10-Step Horizontal Timeline */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-8">Rotating Pool Timeline</h3>
                
                <div className="relative flex items-center justify-between px-2">
                  {/* Connecting Line background */}
                  <div className="absolute left-6 right-6 h-1 bg-gray-200 z-0"></div>
                  {/* Sowing progress highlight */}
                  <div className="absolute left-6 w-[22%] h-1 bg-green-500 z-0"></div>

                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => {
                    const isWinner = m <= 2;
                    const isActive = m === 3;
                    const isFuture = m > 3;

                    return (
                      <div key={m} className="relative z-10 flex flex-col items-center group cursor-pointer">
                        {/* Circle Node */}
                        {isWinner && (
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-green-500/25 border-2 border-white ring-4 ring-green-100">
                            ✓
                          </div>
                        )}
                        {isActive && (
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs border-2 border-white ring-4 ring-amber-100 animate-pulse">
                            3
                          </div>
                        )}
                        {isFuture && (
                          <div className="w-8 h-8 rounded-full bg-white text-gray-400 border-2 border-gray-300 flex items-center justify-center font-black text-xs">
                            {m}
                          </div>
                        )}

                        <span className="text-[10px] font-black text-gray-400 mt-2">M{m}</span>

                        {/* Tooltip on Winner Hover */}
                        {isWinner && (
                          <div className="absolute bottom-11 scale-0 group-hover:scale-100 transition-transform duration-200 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl w-32 text-center pointer-events-none z-30">
                            {m === 1 ? (
                              <>
                                <p className="font-extrabold text-green-400">Ravi Kumar</p>
                                <p className="opacity-80">Won ₹9,500</p>
                              </>
                            ) : (
                              <>
                                <p className="font-extrabold text-green-400">Lakshmi Devi</p>
                                <p className="opacity-80">Won ₹9,100</p>
                              </>
                            )}
                            <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 mx-auto -mb-2.5 mt-1"></div>
                          </div>
                        )}

                        {/* Pulser label for active */}
                        {isActive && (
                          <span className="absolute -top-6 text-[8px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wider animate-bounce">
                            Live
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Auction Card (Month 3) & Bidding Interface */}
              <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-sm space-y-5 relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="inline-flex px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider mb-2 animate-pulse">
                      ⚡ Month 3 Auction Live
                    </span>
                    <h3 className="text-base font-black text-gray-800">Current Pool Auction in Progress</h3>
                    <p className="text-xs text-gray-400 font-semibold mt-1">Bids are open to all 10 members. Dynamic discount returns to farmers.</p>
                  </div>
                  <span className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-50 border border-amber-200 text-amber-700">
                    2 days remaining
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-gray-100 py-4">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Current Highest Bid</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">₹{highestBid.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">Discount: ₹{Number(10000 - highestBid).toLocaleString()}</p>
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Participation</p>
                    <p className="text-xl font-black text-gray-800 mt-1">{bidsCount} of 10 Members</p>
                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">Active bids placed</p>
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left flex items-center justify-center sm:justify-start">
                    {!isBiddingOpen && !hasBidded ? (
                      <button
                        onClick={() => setIsBiddingOpen(true)}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/10 active:scale-95 transition-all"
                      >
                        Place Your Bid
                      </button>
                    ) : hasBidded ? (
                      <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                        ✓ Bid Placed: ₹{myBid.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Inline Bid Entry Form */}
                {isBiddingOpen && (
                  <form onSubmit={handleBidSubmit} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-end animate-slide-up">
                    <div className="flex-1 space-y-1.5">
                      <label htmlFor="bid-input" className="text-[10px] font-bold text-gray-500 uppercase">Your Bid (Requested Payout Amount)</label>
                      <div className="flex rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-amber-100 focus-within:border-amber-400 transition-all overflow-hidden shadow-inner">
                        <span className="flex items-center justify-center px-4 bg-gray-100 text-gray-500 font-black text-xs">
                          ₹
                        </span>
                        <input
                          id="bid-input"
                          type="number"
                          value={myBid}
                          onChange={(e) => setMyBid(e.target.value)}
                          className="w-full px-4 py-2.5 bg-transparent text-gray-800 text-sm font-black focus:outline-none"
                          min="5000"
                          max="10000"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsBiddingOpen(false)}
                        className="flex-1 sm:flex-initial px-5 py-3 border border-gray-200 hover:bg-white text-gray-600 text-xs font-bold rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 sm:flex-initial px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/10 transition-all active:scale-95"
                      >
                        Submit Bid
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Past Winners list */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Past Winners Ledger</h3>
                
                <div className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                  {/* Winner 1 */}
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-black text-xs">
                        R
                      </div>
                      <div>
                        <p className="text-gray-800">Ravi Kumar</p>
                        <p className="text-[10px] text-gray-400 font-medium">Month 1 Champion</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600">Won ₹9,500</p>
                      <p className="text-[9px] text-gray-400 font-medium">Discount dividend: ₹500 (Returned to pool)</p>
                    </div>
                  </div>

                  {/* Winner 2 */}
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-black text-xs">
                        L
                      </div>
                      <div>
                        <p className="text-gray-800">Lakshmi Devi</p>
                        <p className="text-[10px] text-gray-400 font-medium">Month 2 Champion</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600">Won ₹9,100</p>
                      <p className="text-[9px] text-gray-400 font-medium">Discount dividend: ₹900 (Returned to pool)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* My status */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Contribution Ledger</p>
                  <p className="text-sm font-black text-gray-800">
                    Total Paid: <span className="text-green-600">₹{totalPaid.toLocaleString()}</span> (3 × ₹1,000)
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold">Next Payment Due: June 1, 2026</p>
                </div>

                {!hasPaidCurrent ? (
                  <button
                    onClick={handlePayContribution}
                    disabled={isPaying}
                    className="w-full sm:w-auto px-6 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-green-600/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isPaying ? "Connecting UPI..." : "Pay Now (₹1,000)"}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ Month 3 Paid
                  </span>
                )}
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 2: CREATE GROUP VIEW
             ======================================================== */}
          {activeTab === 'CreateGroup' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">Create New Chit Circle</h2>
                <p className="text-sm text-gray-500 mt-1">Form a peer rotating micro-savings circle and invite verified farmers via Aadhaar links.</p>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-6">
                {/* Group Name */}
                <div className="space-y-1.5">
                  <label htmlFor="group-name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chit Circle Name</label>
                  <input
                    id="group-name"
                    type="text"
                    placeholder="e.g. Mandya Sugarcane Growers Circle"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl font-bold text-sm text-gray-800 transition-all shadow-inner"
                    disabled={isCreating}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Members Slider */}
                  <div className="space-y-3 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>Circle Members</span>
                      <span className="text-green-600 font-black text-sm">{membersCount} Farmers</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      step="1"
                      value={membersCount}
                      onChange={(e) => setMembersCount(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 focus:outline-none"
                      disabled={isCreating}
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-extrabold uppercase">
                      <span>Min 5</span>
                      <span>Max 20</span>
                    </div>
                  </div>

                  {/* Monthly Contribution Slider */}
                  <div className="space-y-3 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>Monthly Contribution</span>
                      <span className="text-green-600 font-black text-sm">₹{contributionFee.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={contributionFee}
                      onChange={(e) => setContributionFee(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 focus:outline-none"
                      disabled={isCreating}
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-extrabold uppercase">
                      <span>Min ₹500</span>
                      <span>Max ₹5,000</span>
                    </div>
                  </div>
                </div>

                {/* Duration Auto Display */}
                <div className="bg-green-50/40 border border-green-100/50 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs font-bold text-green-800">
                  <div className="flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-green-100/70 pb-3 sm:pb-0">
                    <p className="text-[10px] text-green-600/80 uppercase font-semibold">Computed Pool Tenure</p>
                    <p className="text-base font-black text-green-900 mt-1">{membersCount} Months</p>
                  </div>
                  <div className="flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-green-100/70 pb-3 sm:pb-0">
                    <p className="text-[10px] text-green-600/80 uppercase font-semibold">Total Pool Capital</p>
                    <p className="text-base font-black text-green-900 mt-1">₹{(membersCount * contributionFee).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] text-green-600/80 uppercase font-semibold">Invites Type</p>
                    <p className="text-base font-black text-green-900 mt-1">SMS e-Invite Links</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreating || !newGroupName}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-green-600/10 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Creating Circle & Sending Invites...</span>
                    </>
                  ) : (
                    "Create & Invite"
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ROSCAPage;
