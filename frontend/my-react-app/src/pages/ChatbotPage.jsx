import { useState, useEffect, useRef } from 'react';
import { getTranslator } from '../utils/translations';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import apiClient from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

// 🌐 Language configs
const LANGUAGE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  te: 'te-IN'
};

const LANG_LABELS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिं' },
  { code: 'kn', label: 'ಕನ್ನ' },
  { code: 'ta', label: 'தமி' },
  { code: 'te', label: 'తెలు' }
];

export const ChatbotPage = () => {
  const { user, language: globalLang = 'EN', setLanguage } = useAuthStore();
  const t_str = getTranslator(globalLang);

  // 💡 Suggestions
  const SUGGESTIONS = [
    { kannada: "ಬಡ್ಡಿ ದರ ಏನು?", english: t_str("What is the interest rate?") },
    { kannada: "ಮರುಪಾವತಿ ಹೇಗೆ?", english: t_str("How do I repay?") },
    { kannada: "ಯಾವ ಯೋಜನೆ?", english: t_str("Which schemes?") }
  ];

  // 👋 Welcome text
  const getWelcomeText = (lang) => {
    switch (lang) {
      case 'hi':
        return "नमस्ते! मैं साथी हूँ, आपका ग्रामक्रेडिट डिजिटल सहायक।";
      case 'kn':
        return "ನಮಸ್ಕಾರ! ನಾನು ಸಾಥಿ, ನಿಮ್ಮ ಗ್ರಾಮಕ್ರೆಡಿಟ್ ಸಹಾಯಕ.";
      case 'ta':
        return "வணக்கம்! நான் சாரதி, உங்கள் உதவியாளர்.";
      case 'te':
        return "నమస్కారం! నేను సారథి.";
      default:
        return t_str("Hello! I am Saathi, your GramCredit assistant.");
    }
  };

  // 🤖 Offline fallback
  const getOfflineFallbackResponse = (message, lang) => {
    const text = message.toLowerCase();

    if (text.includes('interest') || text.includes('rate') || text.includes('ಬಡ್ಡಿ')) {
      return lang === 'kn'
        ? "ಬಡ್ಡಿ ದರವು 4% ರಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ."
        : t_str("Interest rates start from 4% per annum.");
    }

    if (text.includes('repay') || text.includes('payment') || text.includes('ಮರುಪಾವತಿ')) {
      return lang === 'kn'
        ? "ನೀವು UPI ಅಥವಾ ಬ್ಯಾಂಕ್ ಮೂಲಕ ಮರುಪಾವತಿ ಮಾಡಬಹುದು."
        : t_str("You can repay using UPI or Net Banking.");
    }

    return lang === 'kn'
      ? "ದಯವಿಟ್ಟು ಇನ್ನಷ್ಟು ವಿವರವಾಗಿ ಕೇಳಿ."
      : t_str("Please ask more specifically.");
  };

  const selectedLang = globalLang.toLowerCase();
  const setSelectedLang = (l) => setLanguage(l.toUpperCase());
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: getWelcomeText(globalLang.toLowerCase()),
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const sendMessageRef = useRef(null);

  // 🔄 Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleLangChange = (code) => {
    setSelectedLang(code);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [
          {
            id: 'welcome',
            sender: 'bot',
            text: getWelcomeText(code),
            timestamp: prev[0].timestamp
          }
        ];
      }
      return prev;
    });
  };

  // 🎤 Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;

      rec.onstart = () => {
        setIsListening(true);
        toast.success(t_str("Listening..."));
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        sendMessageRef.current?.(transcript);
      };

      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      toast.error(t_str("Speech not supported"));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = LANGUAGE_MAP[selectedLang];
      recognitionRef.current.start();
    }
  };

  // 🚀 Send message
  async function sendMessage(text) {
    const msg = text || inputText;
    if (!msg.trim()) return;

    setInputText('');

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: msg,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await apiClient.post('/api/chatbot/message', {
        message: msg,
        language: selectedLang,
        user_id: user?.id || null
      });

      const reply =
        res.data?.reply ||
        getOfflineFallbackResponse(msg, selectedLang);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: reply,
        timestamp: new Date()
      }]);

    } catch {
      const reply = getOfflineFallbackResponse(msg, selectedLang);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: reply,
        timestamp: new Date()
      }]);
    }

    setIsTyping(false);
  }

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col h-screen ml-60 bg-gray-50">
        
        {/* Sleek, Premium Header */}
        <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/20">
              S
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                {t_str("Saathi AI Assistant")}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">GramCredit Refinance Guide</p>
            </div>
          </div>

          {/* Glassmorphism Language Selector */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/50 shadow-inner">
            {LANG_LABELS.map(l => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLangChange(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  selectedLang === l.code
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </header>

        {/* Elegant Message Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/50">
          {messages.map(m => {
            const isBot = m.sender === 'bot';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[80%] ${
                  isBot ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0 ${
                  isBot ? 'bg-emerald-100 text-emerald-800' : 'bg-green-600 text-white'
                }`}>
                  {isBot ? '🤖' : '👤'}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1">
                  <div className={`px-4 py-3 rounded-2xl text-xs font-bold leading-normal shadow-sm ${
                    isBot
                      ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}>
                    {m.text}
                  </div>
                  {/* Timestamp */}
                  <span className="text-[8px] text-gray-400 font-bold block px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Bouncing Animated Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[80%] mr-auto text-left">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0">
                🤖
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-6 py-3 flex flex-wrap gap-2 bg-white border-t border-gray-100">
          {SUGGESTIONS.map((s, idx) => {
            const label = selectedLang === 'kn' ? s.kannada : s.english;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(label)}
                className="px-3.5 py-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-500 hover:text-emerald-700 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 hover:-translate-y-0.5"
              >
                💡 {label}
              </button>
            );
          })}
        </div>

        {/* Capsule Input Form */}
        <div className="p-4 bg-white border-t border-gray-100 relative z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="max-w-4xl mx-auto flex items-center gap-3 bg-gray-50/50 border border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 rounded-2xl p-2 transition-all shadow-inner"
          >
            {/* Pulsing Mic Button */}
            <button
              type="button"
              onClick={handleMicToggle}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all duration-200 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white hover:bg-gray-100 text-gray-500 shadow-sm border border-gray-100'
              }`}
            >
              🎙️
            </button>

            {/* Input Element */}
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent px-2 py-3 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none"
              placeholder={selectedLang === 'kn' ? "ಇಲ್ಲಿ ಸಂದೇಶ ಬರೆಯಿರಿ..." : selectedLang === 'hi' ? "संदेह यहाँ लिखें..." : t_str("Ask Saathi anything about GramCredit crop finance...")}
            />

            {/* Premium Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-150 disabled:text-gray-400 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-md shadow-emerald-600/10 transition-all active:scale-95"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;