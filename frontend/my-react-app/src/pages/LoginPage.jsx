import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

// Dynamic multi-language localizations
const LOCALIZATIONS = {
  EN: {
    tagline: "Formal credit for Rural Peoples",
    phoneTitle: "Welcome to GramCredit",
    phoneSubtitle: "Enter your mobile number to receive a secure login OTP.",
    phoneLabel: "Mobile Number",
    phonePlaceholder: "10-digit phone number",
    sendOtp: "Send OTP",
    otpTitle: "Verify OTP",
    otpSubtitle: "Enter the 6-digit code sent to",
    verifyOtp: "Verify OTP",
    changeNumber: "← Change number",
    errorPhone: "Please enter a valid 10-digit phone number.",
    errorPhoneNotFound: "This phone number is not registered. Please try 7975200593.",
    errorOtp: "Please enter a 6-digit OTP.",
    errorOtpInvalid: "Invalid OTP. Please try 090207.",
    otpSentSuccess: "OTP sent!",
    loginSuccess: "Logged in successfully! Welcome Ravi Kumar.",
    sending: "Sending...",
    verifying: "Verifying..."
  },
  HI: {
    tagline: "किसानों के लिए औपचारिक ऋण",
    phoneTitle: "ग्रामक्रेडिट में आपका स्वागत है",
    phoneSubtitle: "सुरक्षित लॉगिन ओटीपी प्राप्त करने के लिए अपना मोबाइल नंबर दर्ज करें।",
    phoneLabel: "मोबाइल नंबर",
    phonePlaceholder: "10-अंकों का फ़ोन नंबर",
    sendOtp: "ओटीपी भेजें",
    otpTitle: "ओटीपी सत्यापित करें",
    otpSubtitle: "भेजे गए 6-अंकीय कोड को दर्ज करें",
    verifyOtp: "ओटीपी सत्यापित करें",
    changeNumber: "← नंबर बदलें",
    errorPhone: "कृपया एक वैध 10-अंकीय फ़ोन नंबर दर्ज करें।",
    errorPhoneNotFound: "यह फ़ोन नंबर पंजीकृत नहीं है। कृपया 7975200593 का उपयोग करें।",
    errorOtp: "कृपया 6-अंकीय ओटीपी दर्ज करें।",
    errorOtpInvalid: "अमान्य ओटीपी। कृपया 090207 का उपयोग करें।",
    otpSentSuccess: "ओटीपी भेजा गया!",
    loginSuccess: "सफलतापूर्वक लॉगिन हुआ! स्वागत है रवि कुमार।",
    sending: "भेजा जा रहा है...",
    verifying: "सत्यापित किया जा रहा है..."
  },
  KN: {
    tagline: "ರೈತರಿಗಾಗಿ ಅಧಿಕೃತ ಸಾಲ",
    phoneTitle: "ಗ್ರಾಮಕ್ರೆಡಿಟ್‌ಗೆ ಸುಸ್ವಾಗತ",
    phoneSubtitle: "सुरक्षित लॉगिन OTP ಪಡೆಯಲು ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    phoneLabel: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    phonePlaceholder: "10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆ",
    sendOtp: "OTP ಕಳುಹಿಸಿ",
    otpTitle: "OTP ಪರಿಶೀಲಿಸಿ",
    otpSubtitle: "ಕಳುಹಿಸಲಾದ 6-ಅಂಕಿಯ ಕೋಡ್ ಅನ್ನು ನಮೂದಿಸಿ",
    verifyOtp: "OTP ಪರಿಶೀಲಿಸಿ",
    changeNumber: "← ಸಂಖ್ಯೆ ಬದಲಿಸಿ",
    errorPhone: "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    errorPhoneNotFound: "ಈ ಫೋನ್ ಸಂಖ್ಯೆ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿಲ್ಲ. ದಯವಿಟ್ಟು 7975200593 ಬಳಸಿ.",
    errorOtp: "ದಯವಿಟ್ಟು 6 ಅಂಕಿಯ OTP ನಮೂದಿಸಿ.",
    errorOtpInvalid: "ಅಮಾನ್ಯವಾದ OTP. ದಯವಿಟ್ಟು 090207 ಬಳಸಿ.",
    otpSentSuccess: "OTP ಕಳುಹಿಸಲಾಗಿದೆ!",
    loginSuccess: "ಯಶಸ್ವಿಯಾಗಿ ಲಾಗಿನ್ ಆಗಿದೆ! ಸುಸ್ವಾಗತ ರವಿ ಕುಮಾರ್.",
    sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
    verifying: "ಪриಶೀಲಿಸಲಾಗುತ್ತಿದೆ..."
  },
  TA: {
    tagline: "விவசாயிகளுக்கான முறைசார் கடன்",
    phoneTitle: "கிராம்கிரெடிட்டிற்கு உங்களை வரவேற்கிறோம்",
    phoneSubtitle: "பாதுகாப்பான உள்நுழைவு OTP பெற உங்கள் மொபைல் எண்ணை உள்ளிடவும்.",
    phoneLabel: "கைபேசி எண்",
    phonePlaceholder: "10 இலக்க தொலைபேசி எண்",
    sendOtp: "OTP அனுப்பவும்",
    otpTitle: "OTP ஐ சரிபார்க்கவும்",
    otpSubtitle: "அனுப்பப்பட்ட 6-இலக்க குறியீட்டை உள்ளிடவும்",
    verifyOtp: "OTP ஐ சரிபார்க்கவும்",
    changeNumber: "← எண் மாற்றவும்",
    errorPhone: "தயவுசெய்து சரியான 10-இலக்க தொலைபேசி எண்ணை உள்ளிடவும்.",
    errorPhoneNotFound: "தொலைபேசி எண் பதிவு செய்யப்படவில்லை. தயவுசெய்து 7975200593 ஐ முயற்சிக்கவும்.",
    errorOtp: "தயவுசெய்து 6 இலக்க OTP ஐ உள்ளிடவும்.",
    errorOtpInvalid: "தவறான OTP. தயவுசெய்து 090207 ஐ முயற்சிக்கவும்.",
    otpSentSuccess: "OTP அனுப்பப்பட்டது!",
    loginSuccess: "வெற்றிகரமாக உள்நுழைந்தீர்கள்! நல்வரவு ரவி குமார்.",
    sending: "அனுப்பப்படுகிறது...",
    verifying: "சரிபார்க்கப்படுகிறது..."
  },
  TE: {
    tagline: "రైతుల కోసం అధికారిక రుణం",
    phoneTitle: "గ్రామ్‌క్రెడిట్‌కి స్వాగతం",
    phoneSubtitle: "సురక్షిత లాగిన్ OTP పొందడానికి మీ మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    phoneLabel: "మొబైల్ నంబర్",
    phonePlaceholder: "10-అంకెల ఫోన్ నంబర్",
    sendOtp: "OTP పంపండి",
    otpTitle: "OTPని ధృవీకరించండి",
    otpSubtitle: "పంపిన 6-అంకెల కోడ్‌ను నమోదు చేయండి",
    verifyOtp: "OTPని ధృవీకరించండి",
    changeNumber: "← నంబర్ మార్చండి",
    errorPhone: "దయచేసి సరైన 10-అంకెల ఫోన్ నంబర్‌ను నమోదు చేయండి.",
    errorPhoneNotFound: "ఈ ఫోన్ నంబర్ నమోదు కాలేదు. దయచేసి 7975200593 ప్రయత్నించండి.",
    errorOtp: "దయచేసి 6-అంకెల OTPని నమోదు చేయండి.",
    errorOtpInvalid: "తప్పుడు OTP. దయచేసి 090207 ప్రయత్నించండి.",
    otpSentSuccess: "OTP పంపబడింది!",
    loginSuccess: "విజయవంతంగా లాగిన్ అయ్యారు! స్వాగతం రవి కుమార్.",
    sending: "పంపుతోంది...",
    verifying: "ధృవీకరిస్తోంది..."
  },
  ML: {
    tagline: "കർഷകർക്ക് ഔദ്യോഗിക വായ്പ",
    phoneTitle: "ഗ്രാംക്രെഡിറ്റിലേക്ക് സ്വാഗതം",
    phoneSubtitle: "സുരക്ഷിതമായ ലോഗിൻ ഒടിപി ലഭിക്കുന്നതിന് നിങ്ങളുടെ മൊബൈൽ നമ്പർ നൽകുക.",
    phoneLabel: "മൊബൈൽ നമ്പർ",
    phonePlaceholder: "10 അക്ക ഫോൺ നമ്പർ",
    sendOtp: "OTP അയയ്ക്കുക",
    otpTitle: "OTP പരിശോധിക്കുക",
    otpSubtitle: "അയച്ച 6 അക്ക കോഡ് നൽകുക",
    verifyOtp: "OTP പരിശോധിക്കുക",
    changeNumber: "← നമ്പർ മാറ്റുക",
    errorPhone: "ദയവായി സാധുവായ 10 അക്ക ഫോൺ നമ്പർ നൽകുക.",
    errorPhoneNotFound: "ഈ നമ്പർ രജിസ്റ്റർ ചെയ്തിട്ടില്ല. ദയവായി 7975200593 നൽകുക.",
    errorOtp: "ദയവായി 6 അക്ക OTP നൽകുക.",
    errorOtpInvalid: "തെറ്റായ OTP. ദയവായി 090207 നൽകുക.",
    otpSentSuccess: "OTP അയച്ചു!",
    loginSuccess: "വിജയകരമായി ലോഗിൻ ചെയ്തു! സ്വാഗതം രവി കുമാർ.",
    sending: "അയയ്ക്കുന്നു...",
    verifying: "പരിശോധിക്കുന്നു..."
  },
  MR: {
    tagline: "शेतकऱ्यांसाठी अधिकृत कर्ज",
    phoneTitle: "ग्रामक्रेडिटमध्ये आपले स्वागत आहे",
    phoneSubtitle: "सुरक्षित लॉगिन ओटीपी प्राप्त करण्यासाठी आपला मोबाईल नंबर प्रविष्ट करा.",
    phoneLabel: "मोबाईल नंबर",
    phonePlaceholder: "10-अंकी फोन नंबर",
    sendOtp: "OTP पाठवा",
    otpTitle: "OTP सत्यापित करा",
    otpSubtitle: "पाठवलेला ६-अंकी कोड प्रविष्ट करा",
    verifyOtp: "OTP सत्यापित करा",
    changeNumber: "← नंबर बदला",
    errorPhone: "कृपया वैध १०-अंकी फोन नंबर प्रविष्ट करा.",
    errorPhoneNotFound: "हा फोन नंबर नोंदणीकृत नाही. कृपया 7975200593 वापरा.",
    errorOtp: "कृपया ६-अंकी OTP प्रविष्ट करा.",
    errorOtpInvalid: "अवैध OTP. कृपया 090207 वापरा.",
    otpSentSuccess: "OTP पाठवला!",
    loginSuccess: "यशस्वीरीत्या लॉगिन केले! स्वागत आहे रवी कुमार।",
    sending: "पाठवत आहे...",
    verifying: "सत्यापित करत आहे..."
  }
};

const LANGUAGES = [
  { code: 'EN', name: 'EN' },
  { code: 'HI', name: 'हिं' },
  { code: 'KN', name: 'ಕನ್ನ' },
  { code: 'TA', name: 'தமி' },
  { code: 'TE', name: 'తెలు' },
  { code: 'ML', name: 'മല' },
  { code: 'MR', name: 'मरा' }
];

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // States
  const [lang, setLang] = useState('EN');
  const [step, setStep] = useState(1); // 1 = Phone Entry, 2 = OTP Entry
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  // References for OTP fields
  const otpRefs = useRef([]);

  const t = LOCALIZATIONS[lang];

  // Auto-focus first input field when switching to OTP screen
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // Handle Phone input numeric filtering
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Allow digits only
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  // Handle OTP digit entry
  const handleOtpChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) {
      // Clear value if empty or non-numeric
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    // Take the last character typed if it's multiple (e.g. key repeat)
    newOtp[index] = numericValue.slice(-1);
    setOtp(newOtp);

    // Auto-focus next field if current filled
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard interaction (Backspace back-shifting)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Clear previous cell and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
        e.preventDefault();
      } else if (otp[index]) {
        // Clear current cell
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      otpRefs.current[5]?.focus();
    } else {
      toast.error(lang === 'EN' ? 'Please paste a valid 6-digit code' : t.errorOtp);
    }
  };

  // Submit Phone Number (Step 1)
  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error(t.errorPhone);
      return;
    }

    setIsLoading(true);
    // Simulate natural premium network delay (600ms)
    setTimeout(() => {
      setIsLoading(false);
      if (phone === "7975200593") {
        setStep(2);
        toast.success(t.otpSentSuccess);
      } else {
        toast.error(t.errorPhoneNotFound);
      }
    }, 600);
  };

  // Submit OTP Verification (Step 2)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error(t.errorOtp);
      return;
    }

    setIsLoading(true);
    try {
      if (otpCode === "090207") {
        try {
          // Log in to our real FastAPI backend using mock-login!
          const res = await api.post('/api/auth/mock-login', { phone });
          const { access_token } = res.data;
          
          // Retrieve full profile information to populate Zustand
          const meRes = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          
          login(access_token, meRes.data);
        } catch (apiErr) {
          console.warn("FastAPI backend is offline, running in premium mock-session mode:", apiErr);
          // Safe offline fallback: enable full local session demo if backend is not started
          login('mock-jwt-offline-token', {
            id: 1,
            name: 'Ravi Kumar',
            phone: phone || '7975200593',
            role: 'farmer',
            district: 'Mandya',
            crop_type: 'Paddy',
            land_acres: 4.0,
            shg_member: true
          });
        }
        
        toast.success(t.loginSuccess);
        navigate('/dashboard');
      } else {
        toast.error(t.errorOtpInvalid);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Connection to auth server failed.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking the "← Change number" back navigation
  const handleChangeNumber = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']); // Reset OTP fields
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-gray-50 to-emerald-50/50 p-4 sm:p-6 overflow-hidden">
      {/* Premium Background Ambient Glow Blurs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 sm:w-96 sm:h-96 bg-green-200/30 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-200/30 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-7000"></div>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white border border-white/80 shadow-xl shadow-green-950/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center relative z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
            {/* Custom leaf-credit shield premium vector */}
            <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4C18 12 14 26 14 40C14 48.8 20.2 56 32 60C43.8 56 50 48.8 50 40C50 26 46 12 32 4Z" fill="url(#leafGradient)" />
              <path d="M32 12C32 12 22 24 22 38C22 46 26.5 50 32 54C37.5 50 42 46 42 38C42 24 32 12 32 12Z" fill="white" fillOpacity="0.15" />
              <path d="M32 18V46M24 36H40M27 26H37" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="leafGradient" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#16A34A" />
                  <stop stopColor="#15803D" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-green-600 mb-1">
            GramCredit
          </h1>
          <p className="text-sm font-medium text-gray-500 transition-colors duration-300">
            {t.tagline}
          </p>
        </div>

        {/* Language Picker */}
        <div className="w-full border-t border-gray-100 pt-5 pb-5">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {LANGUAGES.map((item) => {
              const isSelected = lang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full border transition-all duration-300 ${
                    isSelected
                      ? 'bg-green-600 border-green-600 text-white shadow-md shadow-green-600/20 scale-105'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Screens */}
        <div className="w-full min-h-[220px] flex flex-col justify-between">
          {step === 1 ? (
            /* PHONE STATE (STEP 1) */
            <form onSubmit={handleSendOtp} className="space-y-5 flex flex-col flex-1 justify-between">
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-lg font-bold text-gray-800">{t.phoneTitle}</h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {t.phoneSubtitle}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone-input" className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                    {t.phoneLabel}
                  </label>
                  <div className="flex rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 focus-within:bg-white transition-all duration-300 overflow-hidden shadow-inner">
                    <span className="flex items-center justify-center px-3.5 bg-gray-100/80 border-r border-gray-200 text-gray-500 font-bold text-sm select-none">
                      +91
                    </span>
                    <input
                      id="phone-input"
                      type="tel"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder={t.phonePlaceholder}
                      className="w-full px-4 py-3 bg-transparent text-gray-800 text-base font-semibold placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phone.length !== 10}
                className="w-full mt-6 py-3.5 bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:scale-100 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-green-600/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t.sending}</span>
                  </>
                ) : (
                  t.sendOtp
                )}
              </button>
            </form>
          ) : (
            /* OTP STATE (STEP 2) */
            <form onSubmit={handleVerifyOtp} className="space-y-5 flex flex-col flex-1 justify-between">
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-lg font-bold text-gray-800">{t.otpTitle}</h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {t.otpSubtitle} <span className="font-bold text-gray-700">+91 {phone}</span>
                  </p>
                </div>

                {/* 6 Individual Digit inputs */}
                <div className="flex justify-between items-center gap-2 py-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 border border-gray-200 rounded-xl text-center text-2xl font-extrabold text-gray-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-gray-50 focus:bg-white shadow-inner transition-all duration-200"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <div className="text-center sm:text-left">
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-xs font-bold text-green-600 hover:text-green-700 hover:underline transition-all flex items-center gap-1 mx-auto sm:mx-0 group"
                    disabled={isLoading}
                  >
                    <span className="transform group-hover:-translate-x-0.5 transition-transform duration-200">{t.changeNumber}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full mt-6 py-3.5 bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:scale-100 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-green-600/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t.verifying}</span>
                  </>
                ) : (
                  t.verifyOtp
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
