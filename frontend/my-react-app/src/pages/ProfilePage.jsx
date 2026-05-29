import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

// Custom Recharts Tooltip for a premium look
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 text-white p-3 rounded-xl shadow-xl text-xs font-bold">
        <p className="text-gray-400">Month: <span className="text-white font-extrabold">{payload[0].payload.month}</span></p>
        <p className="text-green-400 mt-1">Credit Score: <span className="font-extrabold text-sm text-green-400">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export const ProfilePage = () => {
  const { user } = useAuthStore();
  
  // Local profile state initialized with session values
  const [profile, setProfile] = useState({
    name: user?.name || 'Ravi Kumar',
    phone: user?.phone || '7975200593',
    district: 'Mandya',
    cropType: 'Sugarcane',
    landAcres: '6.4',
    shgMember: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [score, setScore] = useState(78);
  const [historyData, setHistoryData] = useState([
    { month: 'Jan', score: 50 },
    { month: 'Feb', score: 60 },
    { month: 'Mar', score: 70 },
    { month: 'Apr', score: 78 }
  ]);

  const targetScore = 85;
  const pointsNeeded = Math.max(0, targetScore - score);
  
  // Circumference calculation for SVG circular ring: 2 * Math.PI * r (r = 50 => circumference = 314.159)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Retrieve dynamic profile details from FastAPI
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchProfileData = async () => {
      try {
        const meRes = await api.get('/api/auth/me');
        setProfile({
          name: meRes.data.name || 'Ravi Kumar',
          phone: meRes.data.phone || '7975200593',
          district: meRes.data.district || 'Mandya',
          cropType: meRes.data.crop_type || 'Sugarcane',
          landAcres: String(meRes.data.land_acres || '6.4'),
          shgMember: meRes.data.shg_member !== undefined ? meRes.data.shg_member : true
        });
        
        const scoreRes = await api.get(`/api/auth/credit-score?user_id=${user.id}`);
        setScore(scoreRes.data.score);
        setHistoryData(scoreRes.data.history);
      } catch (err) {
        console.error("FastAPI profile retrieval failed, showing dynamic fallback session details:", err);
      }
    };
    
    fetchProfileData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = () => {
    setProfile(prev => ({
      ...prev,
      shgMember: !prev.shgMember
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (!profile.district.trim()) {
      toast.error("District cannot be empty.");
      return;
    }
    if (!profile.cropType.trim()) {
      toast.error("Crop type cannot be empty.");
      return;
    }
    if (!profile.landAcres || Number(profile.landAcres) <= 0) {
      toast.error("Please enter a valid land acreage.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.patch('/api/auth/profile', {
        name: profile.name,
        district: profile.district,
        crop_type: profile.cropType,
        land_acres: Number(profile.landAcres),
        shg_member: profile.shgMember
      });
      
      // Update global Zustand state to reflect instantly in layout headers and sidebars
      useAuthStore.setState({
        user: res.data
      });

      // Recalculate live score dynamically
      const scoreRes = await api.get(`/api/auth/credit-score?user_id=${user.id}`);
      setScore(scoreRes.data.score);
      setHistoryData(scoreRes.data.history);

      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Update to cooperative registry failed.";
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Page Area with ml-60 Layout Offset */}
      <main className="ml-60 flex-1 p-6 sm:p-8 overflow-y-auto max-h-screen">
        
        {/* Header */}
        <header className="max-w-4xl mx-auto mb-6">
          <h1 className="text-2xl font-black text-gray-900">My Farmer Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your digital agriculture footprint, track your creditworthiness score, and view milestones.</p>
        </header>

        {/* Dashboard Panels Grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT 1-COL: CREDIT SCORE CARD & MILESTONES */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Top Section - Circular Score Card */}
            <div className="bg-white border-2 border-green-500 rounded-3xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500"></div>
              
              <span className="inline-flex px-2 py-0.5 rounded bg-green-100 text-green-800 text-[9px] font-black uppercase tracking-wider mb-4">
                Credit Profile
              </span>

              {/* Circular SVG Ring */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Track ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="text-gray-100"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Progress ring filled proportionally */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="text-green-600 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                {/* Score Number overlay in center */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-gray-800">{score}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</span>
                </div>
              </div>

              <div className="text-center mt-3">
                <p className="text-xs font-black text-gray-800">GramCredit Score</p>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                    Good Standing
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-2">Last updated: today</p>
              </div>

              {/* Mini Stats inside scoring card */}
              <div className="w-full grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 mt-4 text-center text-xs font-bold text-gray-500">
                <div className="border-r border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">Repaid</p>
                  <p className="text-gray-800 font-black mt-0.5">1 Loan</p>
                </div>
                <div className="border-r border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">On-Time</p>
                  <p className="text-gray-800 font-black mt-0.5">3 PMTs</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">SHG</p>
                  <p className="text-green-600 font-black mt-0.5">✅ Yes</p>
                </div>
              </div>

            </div>

            {/* Next Milestone Amber Card */}
            <div className="bg-white border border-amber-400 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
              
              <div className="space-y-1">
                <span className="inline-flex px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-black uppercase tracking-wider mb-1">
                  ⚡ Score Goal
                </span>
                <h3 className="text-sm font-black text-gray-800 leading-snug">
                  Score {targetScore} unlocks ₹1,00,000 loan limit
                </h3>
              </div>

              {/* Progress bar tracker */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-gray-500">
                  <span>Current: {score}</span>
                  <span className="text-amber-600">Goal: {targetScore}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(score / targetScore) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-amber-700 font-extrabold uppercase text-right tracking-wider">
                  +{pointsNeeded} more points needed
                </p>
              </div>

              {/* Action items checklist to improve score */}
              <div className="border-t border-gray-50 pt-3">
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider mb-2">How to earn points:</p>
                <ul className="space-y-1.5 text-[10px] font-bold text-gray-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500">🌾</span>
                    <span>Repay next EMI on time <span className="text-green-600 font-extrabold">(+10 pts)</span></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500">📄</span>
                    <span>Upload land document <span className="text-green-600 font-extrabold">(+5 pts)</span></span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* RIGHT 2-COLS: HISTORY GRAPH & EDIT PROFILE */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Score History Recharts Bar Chart */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score Growth History</h3>
                <p className="text-[10px] text-gray-500 font-medium">Monthly progress mapping showing consecutive digital rating growth.</p>
              </div>
              
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb', radius: 8 }} />
                    <Bar 
                      dataKey="score" 
                      fill="#16a34a" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Farmer Profile Editable Form */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-black text-gray-800">Farmer Registry Details</h3>
                <p className="text-xs text-gray-400 font-medium">Keep your registration details accurate to increase credit limits and quicken KYC verify checks.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label htmlFor="name-input" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Full Name</label>
                    <input
                      id="name-input"
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl font-bold text-sm text-gray-800 transition-all shadow-inner"
                      disabled={isSaving}
                      required
                    />
                  </div>

                  {/* Readonly Phone field */}
                  <div className="space-y-1.5">
                    <label htmlFor="phone-input" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Phone Number</label>
                    <div className="flex rounded-xl border border-gray-200 bg-gray-100 text-gray-500 select-none shadow-inner overflow-hidden">
                      <span className="flex items-center justify-center px-4 border-r border-gray-200 font-bold text-xs bg-gray-50">
                        +91
                      </span>
                      <input
                        id="phone-input"
                        type="text"
                        value={profile.phone}
                        className="w-full px-4 py-3 bg-transparent text-sm font-bold text-gray-400 focus:outline-none cursor-not-allowed"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* District field */}
                  <div className="space-y-1.5">
                    <label htmlFor="district-input" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">District</label>
                    <input
                      id="district-input"
                      type="text"
                      name="district"
                      value={profile.district}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl font-bold text-sm text-gray-800 transition-all shadow-inner"
                      disabled={isSaving}
                      required
                    />
                  </div>

                  {/* Crop Type Select dropdown */}
                  <div className="space-y-1.5">
                    <label htmlFor="crop-input" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Primary Crop Type</label>
                    <select
                      id="crop-input"
                      name="cropType"
                      value={profile.cropType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl font-bold text-sm text-gray-800 transition-all shadow-inner"
                      disabled={isSaving}
                    >
                      <option value="Paddy">Paddy</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Sugarcane">Sugarcane</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Maize">Maize</option>
                    </select>
                  </div>

                  {/* Land Acres Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="acres-input" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Land Area (Acres)</label>
                    <input
                      id="acres-input"
                      type="number"
                      step="0.1"
                      name="landAcres"
                      value={profile.landAcres}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl font-bold text-sm text-gray-800 transition-all shadow-inner"
                      disabled={isSaving}
                      required
                    />
                  </div>
                </div>

                {/* SHG Member Toggle Switch */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-gray-800">Self Help Group (SHG) Member</p>
                    <p className="text-[10px] text-gray-400 font-semibold">Being a certified SHG member grants special low-interest crop refinancing.</p>
                  </div>
                  
                  {/* Toggle button element */}
                  <button
                    type="button"
                    onClick={handleToggleChange}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      profile.shgMember ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                    disabled={isSaving}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        profile.shgMember ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-green-600/10 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving Registry...</span>
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </form>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
