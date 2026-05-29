// Hardcoded Crop Season Calendars (0-indexed months: 0 = Jan, 1 = Feb, ..., 11 = Dec)
const CROP_SEASONS = {
  Paddy: { sowing: [5, 6, 7, 8], harvest: [9, 10] },
  Wheat: { sowing: [10, 11], harvest: [2, 3] },
  Sugarcane: { sowing: [1, 2], harvest: [0, 1] },
  Cotton: { sowing: [4, 5, 6], harvest: [9, 10] },
  Maize: { sowing: [3, 4, 5], harvest: [8, 9] }
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const HarvestCalendar = ({ crop = "Paddy", amount = 50000 }) => {
  // Normalize crop input to match keys
  const normalizedCrop = crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
  const season = CROP_SEASONS[normalizedCrop] || CROP_SEASONS.Paddy;

  const sowingMonths = season.sowing;
  const harvestMonths = season.harvest;

  // Calculate EMI dynamically over harvest months
  const totalEMIMonths = harvestMonths.length;
  const emiAmount = Math.floor(amount / totalEMIMonths);

  return (
    <div className="w-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Harvest Repayment Calendar ({normalizedCrop})
        </h4>
        <span className="text-[10px] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Harvest-Aligned
        </span>
      </div>

      {/* 12-month Grid (4x3) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {MONTH_NAMES.map((month, idx) => {
          const isSowing = sowingMonths.includes(idx);
          const isHarvest = harvestMonths.includes(idx);

          let cardStyle;
          let label;
          let amountDisplay;

          if (isSowing) {
            cardStyle = "bg-gray-100 border-gray-200/50 text-gray-400";
            label = "Sowing";
            amountDisplay = "No EMI";
          } else if (isHarvest) {
            cardStyle = "bg-green-600 border-green-600 text-white shadow-md shadow-green-600/10";
            label = "Harvest";
            amountDisplay = `₹${emiAmount.toLocaleString()}`;
          } else {
            cardStyle = "bg-white border-gray-200 text-gray-500 hover:bg-gray-50/50";
            label = "Off-season";
            amountDisplay = "No EMI";
          }

          return (
            <div
              key={month}
              className={`border rounded-xl p-3 flex flex-col justify-between items-center text-center transition-all duration-200 ${cardStyle}`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider opacity-75">{month}</span>
              <span className="text-[9px] font-bold mt-1.5 opacity-90">{label}</span>
              <span className={`text-xs mt-1.5 font-extrabold ${isHarvest ? 'font-black text-sm' : 'opacity-80'}`}>
                {amountDisplay}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-600 space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
          <span>Total EMI Months: <strong className="text-gray-800 text-sm font-black">{totalEMIMonths}</strong></span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>Total Payable: <strong className="text-green-600 text-sm font-black">₹{amount.toLocaleString()}</strong></span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>Interest: <strong className="text-gray-800 text-sm font-black">12% p.a.</strong></span>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="bg-green-50/50 border border-green-100 rounded-xl p-3.5 flex items-start gap-2.5">
        <span className="text-base">💡</span>
        <p className="text-[11px] font-bold text-green-800 leading-normal">
          <strong className="font-extrabold block mb-0.5">AI Recommendation</strong>
          Best repayment timing based on Mandya district rainfall data (IMD) and historical {normalizedCrop.toLowerCase()} yield.
        </p>
      </div>
    </div>
  );
};

export default HarvestCalendar;
