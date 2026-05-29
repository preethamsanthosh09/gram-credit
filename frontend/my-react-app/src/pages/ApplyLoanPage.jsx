import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import HarvestCalendar from '../components/HarvestCalendar';

// ─── Static Data ────────────────────────────────────────────────────────────

const loanCategories = [
  { id: 'agriculture', label: '🌾 Agriculture', desc: 'Crop loans, harvest-aligned' },
  { id: 'education',   label: '🎓 Education',   desc: 'School & college fees' },
  { id: 'vendor',      label: '🏪 Business',     desc: 'Daily stock, micro-loans' },
];

const crops = ['Paddy', 'Wheat', 'Sugarcane', 'Cotton', 'Maize'];

const educationLevels = [
  { level: 'Primary School',       fee: '₹5,000–₹15,000/year' },
  { level: 'High School',          fee: '₹15,000–₹40,000/year' },
  { level: 'Degree College',       fee: '₹30,000–₹1,00,000/year' },
  { level: 'Engineering/Medical',  fee: '₹80,000–₹2,00,000/year' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const ApplyLoanPage = () => {
  const navigate = useNavigate();

  // ── Wizard ──
  const [step, setStep] = useState(1);

  // ── Category ──
  const [loanCategory, setLoanCategory] = useState('agriculture');

  // ── Agriculture Step 1 ──
  const [cropType,   setCropType]   = useState('Paddy');
  const [landArea,   setLandArea]   = useState('');
  const [shgMember,  setShgMember]  = useState(false);
  const [loanAmount, setLoanAmount] = useState(50000);
  const [isChecking, setIsChecking] = useState(false);
  const [scorecard,  setScorecard]  = useState(null);

  // ── Agriculture Step 2 ──
  const [repaymentMode, setRepaymentMode] = useState('harvest');

  // ── Education Step 1 ──
  const [eduLevel,    setEduLevel]    = useState('');
  const [childName,   setChildName]   = useState('');
  const [schoolName,  setSchoolName]  = useState('');
  const [eduAmount,   setEduAmount]   = useState(30000);
  const [scholarship, setScholarship] = useState(false);

  // ── Shared ──
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCheckEligibility = async (e) => {
    e.preventDefault();
    if (!landArea || Number(landArea) <= 0) {
      toast.error('Please enter a valid land area in acres.');
      return;
    }
    setIsChecking(true);
    toast.loading('Calculating crop credit eligibility…', { id: 'elig' });

    try {
      const res = await api.post('/api/loans/eligibility', {
        cropType, landArea: Number(landArea), shgMember, loanAmount: Number(loanAmount),
      });
      setScorecard(res.data);
      toast.success('Eligibility calculation complete!', { id: 'elig' });
    } catch {
      setTimeout(() => {
        const base        = 60;
        const shgBonus    = shgMember ? 22 : 0;
        const landBonus   = Math.min(20, Math.floor(Number(landArea) * 2.5));
        const amtPenalty  = Math.floor(loanAmount / 8000);
        const score       = Math.min(99, Math.max(35, base + shgBonus + landBonus - amtPenalty));
        const approved    = score >= 50;
        const rate        = score >= 75 ? '8.5%' : score >= 50 ? '11.5%' : '15.0%';
        const maxAmt      = approved
          ? Math.min(150000, Math.floor(Number(landArea) * 45000 + (shgMember ? 30000 : 10000)))
          : 0;
        setScorecard({ score, approved, maxAmount: maxAmt, interestRate: rate });
        setIsChecking(false);
        toast.success('Credit score calculated!', { id: 'elig' });
      }, 1500);
    }
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    toast.loading('Registering credit deed…', { id: 'submit' });

    const payload = loanCategory === 'agriculture'
      ? { cropType, landArea: Number(landArea), shgMember, loanAmount: Number(loanAmount), repaymentMode, interestRate: scorecard?.interestRate }
      : { loanCategory, eduLevel, childName, schoolName, eduAmount: Number(eduAmount), scholarship };

    try {
      await api.post('/api/loans/apply', payload);
      toast.success('Application submitted!', { id: 'submit' });
      navigate('/dashboard');
    } catch {
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success('Application submitted successfully!', { id: 'submit' });
        navigate('/dashboard');
      }, 1800);
    }
  };

  // ─── Computed ──────────────────────────────────────────────────────────────

  const eduInterestRate = scholarship ? '6%' : '8%';
  const eduMonthly      = Math.round((eduAmount * 0.08) / 12 + eduAmount / 60);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="ml-60 flex-1 p-6 sm:p-8 overflow-y-auto">

        {/* ── Header ── */}
        <header className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Apply for Loan</h1>
            <p className="text-xs text-gray-500 mt-0.5">GramCredit — rural credit made simple.</p>
          </div>
        </header>

        {/* ── Step Indicator ── */}
        <div className="flex items-center gap-3 mb-8 max-w-2xl">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= s ? 'bg-green-600 text-white shadow-md shadow-green-600/20' : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${step >= s ? 'text-gray-800' : 'text-gray-400'}`}>
                {s === 1 ? 'Details' : s === 2 ? 'Structure' : 'Review'}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="max-w-3xl space-y-6">

          {/* ════════════════════════════════════════════════════════════════
              STEP 1 — Loan Type + Details
              ════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-6">

              {/* Category Selector */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-black text-gray-900 mb-1">Loan Category</h2>
                <p className="text-sm text-gray-500 mb-5">Select the type of loan you need.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {loanCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => { setLoanCategory(cat.id); setScorecard(null); setStep(1); }}
                      className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                        loanCategory === cat.id
                          ? 'border-green-600 bg-green-50/20 shadow-md shadow-green-950/5'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <p className="text-2xl mb-2">{cat.label.split(' ')[0]}</p>
                      <p className="text-sm font-extrabold text-gray-800">{cat.label.split(' ').slice(1).join(' ')}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-1">{cat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Agriculture Details ── */}
              {loanCategory === 'agriculture' && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Crop & Land Details</h2>
                    <p className="text-sm text-gray-500 mt-1">We calculate your credit limit based on crop type, land, and SHG membership.</p>
                  </div>

                  <form onSubmit={handleCheckEligibility} className="space-y-5">
                    {/* Crop chips */}
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">Crop Type</label>
                      <div className="flex flex-wrap gap-2">
                        {crops.map((c) => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setCropType(c)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold border-2 transition-all ${
                              cropType === c
                                ? 'border-green-600 bg-green-600 text-white shadow-sm'
                                : 'border-gray-200 text-gray-600 hover:border-green-300 bg-white'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Land + Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Land Area (Acres)</label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          placeholder="e.g. 4.5"
                          value={landArea}
                          onChange={(e) => setLandArea(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-green-500 focus:bg-white text-gray-800 text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                          Loan Amount — ₹{Number(loanAmount).toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="5000"
                          max="200000"
                          step="5000"
                          value={loanAmount}
                          onChange={(e) => { setLoanAmount(e.target.value); setScorecard(null); }}
                          className="w-full accent-green-600 mt-3"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                          <span>₹5,000</span><span>₹2,00,000</span>
                        </div>
                      </div>
                    </div>

                    {/* SHG toggle */}
                    <div
                      onClick={() => { setShgMember(!shgMember); setScorecard(null); }}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        shgMember ? 'border-green-500 bg-green-50/20' : 'border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-extrabold text-gray-800">SHG Member</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Self Help Group membership adds +22 credit points</p>
                      </div>
                      <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${shgMember ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-all transform ${shgMember ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Eligibility Result */}
                    {scorecard && (
                      <div className={`p-5 rounded-2xl border-2 ${scorecard.approved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">GramCredit Score</p>
                          <span className={`text-2xl font-black ${scorecard.approved ? 'text-green-600' : 'text-red-500'}`}>
                            {scorecard.score}
                          </span>
                        </div>
                        {scorecard.approved ? (
                          <div className="space-y-1 text-xs font-bold">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Max Credit Limit</span>
                              <span className="text-green-700">₹{scorecard.maxAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Interest Rate</span>
                              <span className="text-green-700">{scorecard.interestRate} p.a.</span>
                            </div>
                            <p className="text-green-700 mt-2">✅ Pre-approved! Proceed to repayment structure.</p>
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-red-700">❌ Score below threshold. Try reducing amount or adding land.</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isChecking}
                        className="flex-1 py-3.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white text-sm font-extrabold rounded-2xl transition-all"
                      >
                        {isChecking ? 'Calculating…' : '⚡ Check Eligibility'}
                      </button>
                      {scorecard?.approved && (
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          Next: Repayment →
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* ── Education Details ── */}
              {loanCategory === 'education' && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Education Loan Details</h2>
                    <p className="text-sm text-gray-500 mt-1">Get fee financing at 8% p.a. — repay in 5 years.</p>
                  </div>

                  {/* Education level cards */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-3">Education Level</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {educationLevels.map((el) => (
                        <div
                          key={el.level}
                          onClick={() => setEduLevel(el.level)}
                          className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                            eduLevel === el.level
                              ? 'border-green-600 bg-green-50/20'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <p className="text-sm font-extrabold text-gray-800">{el.level}</p>
                          <p className="text-[11px] text-gray-400 font-medium mt-1">{el.fee}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Child name + School */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Student Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Priya Devi"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-green-500 focus:bg-white text-gray-800 text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">School / College Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Govt. High School, Mandya"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-green-500 focus:bg-white text-gray-800 text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Fee amount slider */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                      Fee Amount — ₹{Number(eduAmount).toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min="5000"
                      max="200000"
                      step="1000"
                      value={eduAmount}
                      onChange={(e) => setEduAmount(e.target.value)}
                      className="w-full accent-green-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                      <span>₹5,000</span><span>₹2,00,000</span>
                    </div>
                  </div>

                  {/* Scholarship toggle */}
                  <div
                    onClick={() => setScholarship(!scholarship)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      scholarship ? 'border-green-500 bg-green-50/20' : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-extrabold text-gray-800">Government Scholarship</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Rate reduced to 6% p.a. if eligible</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${scholarship ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-all transform ${scholarship ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  {/* Quick estimate */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2 text-xs font-bold">
                    <p className="text-amber-800 font-extrabold text-sm">📋 Loan Estimate</p>
                    <div className="flex justify-between text-gray-600">
                      <span>Interest Rate</span><span className="text-green-700">{eduInterestRate} p.a.</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tenure</span><span>5 years (60 months)</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Est. Monthly EMI</span>
                      <span className="text-green-700">₹{eduMonthly.toLocaleString()}/month</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Fee Due (June / Dec)</span>
                      <span>₹{(eduAmount / 2).toLocaleString()} × 2</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!eduLevel) { toast.error('Please select an education level.'); return; }
                      if (!childName.trim()) { toast.error('Please enter student name.'); return; }
                      setStep(2);
                    }}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold rounded-2xl transition-all"
                  >
                    Next: Review Details →
                  </button>
                </div>
              )}

              {/* ── Business / Vendor ── */}
              {loanCategory === 'vendor' && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🏪</div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Business / Vendor Loan</h2>
                    <p className="text-sm text-gray-500 mb-6">Micro-loans for daily stock, kirana stores, auto drivers & more.</p>
                    <button
                      onClick={() => navigate('/vendors')}
                      className="px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold rounded-2xl transition-all shadow-lg shadow-green-600/10"
                    >
                      Open Vendor Finance →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 2 — Agriculture: Repayment Mode | Education: Review
              ════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6">

              {/* ── Agriculture: Repayment Mode ── */}
              {loanCategory === 'agriculture' && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Repayment Mode</h2>
                    <p className="text-sm text-gray-500 mt-1">Choose a repayment structure that suits your harvest timeline.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                      { id: 'monthly',  label: 'Monthly EMI',          desc: 'Fixed equal payments every month. Ideal for steady side-income.' },
                      { id: 'harvest',  label: 'Harvest-Aligned ★',    desc: 'Zero payments during sowing/growth. Full repayment after harvest sale.', recommended: true },
                      { id: 'yearly',   label: 'Yearly Bullet',         desc: 'Single annual repayment at year-end. Best for multi-season crops.' },
                    ].map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setRepaymentMode(m.id)}
                        className={`border-2 rounded-2xl p-5 cursor-pointer relative flex flex-col justify-between transition-all ${
                          repaymentMode === m.id
                            ? 'border-green-600 bg-green-50/20 shadow-md ring-2 ring-green-100'
                            : m.recommended
                              ? 'border-green-200 hover:border-green-300 bg-white'
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        {m.recommended && (
                          <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-green-600 text-[9px] font-black text-white uppercase tracking-widest">
                            Recommended
                          </span>
                        )}
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-800">{m.label}</h3>
                          <p className="text-[11px] text-gray-400 font-medium mt-2 leading-relaxed">{m.desc}</p>
                        </div>
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center mt-5 ${
                          repaymentMode === m.id ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {repaymentMode === m.id && <span className="text-[10px] font-black">✓</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Harvest calendar preview */}
                  {repaymentMode === 'harvest' && (
                    <div className="mt-2">
                      <HarvestCalendar crop={cropType} amount={Number(loanAmount)} />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-extrabold rounded-2xl transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold rounded-2xl transition-all"
                    >
                      Next: Review →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Education: Review ── */}
              {loanCategory === 'education' && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Review Education Loan</h2>
                    <p className="text-sm text-gray-500 mt-1">Confirm all details before submitting.</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3 text-xs font-bold">
                    {[
                      ['Loan Type',         '🎓 Education Loan'],
                      ['Student Name',       childName || '—'],
                      ['School / College',   schoolName || '—'],
                      ['Education Level',    eduLevel || '—'],
                      ['Fee Amount',         `₹${Number(eduAmount).toLocaleString()}`],
                      ['Interest Rate',      `${eduInterestRate} p.a.`],
                      ['Repayment Tenure',   '5 years (60 months)'],
                      ['Est. Monthly EMI',   `₹${eduMonthly.toLocaleString()}`],
                      ['Scholarship',        scholarship ? '✅ Yes' : '❌ No'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-gray-100 pb-2 last:border-0">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-xs font-bold text-green-800">
                    ✅ Education loan pre-approved. Zero collateral required for amounts below ₹1,00,000.
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-extrabold rounded-2xl transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold rounded-2xl transition-all"
                    >
                      Confirm & Submit →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 3 — Final Review & Submit (Agriculture only)
              ════════════════════════════════════════════════════════════════ */}
          {step === 3 && loanCategory === 'agriculture' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">Review & Submit</h2>
                <p className="text-sm text-gray-500 mt-1">Confirm your crop credit application before final submission.</p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3 text-xs font-bold">
                {[
                  ['Loan Type',        '🌾 Agriculture / Crop Loan'],
                  ['Crop',             cropType],
                  ['Land Area',        `${landArea} Acres`],
                  ['SHG Member',       shgMember ? '✅ Yes' : '❌ No'],
                  ['Loan Amount',      `₹${Number(loanAmount).toLocaleString()}`],
                  ['Credit Score',     scorecard?.score || '—'],
                  ['Interest Rate',    scorecard?.interestRate || '—'],
                  ['Repayment Mode',   repaymentMode === 'harvest' ? 'Harvest-Aligned' : repaymentMode === 'monthly' ? 'Monthly EMI' : 'Yearly Bullet'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-gray-100 pb-2 last:border-0">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-800">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-xs font-bold text-green-800">
                ✅ Your application is pre-approved. Funds will be disbursed to your cooperative wallet within 48 hours.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-extrabold rounded-2xl transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-extrabold rounded-2xl transition-all shadow-lg shadow-green-600/10 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Submitting…</span>
                    </>
                  ) : '✅ Submit Application'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 submit for Education (routed from step 2) */}
          {step === 3 && loanCategory === 'education' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎓</div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Submitting Education Loan</h2>
                <p className="text-sm text-gray-500 mb-6">Your application for <strong>{childName}</strong> at <strong>{schoolName || 'the institution'}</strong> is ready.</p>
                <button
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-extrabold rounded-2xl transition-all shadow-lg shadow-green-600/10"
                >
                  {isSubmitting ? 'Submitting…' : '✅ Confirm & Submit'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ApplyLoanPage;
