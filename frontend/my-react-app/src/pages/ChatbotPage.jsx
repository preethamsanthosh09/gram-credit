import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import apiClient from '../api/axios';

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

// 💡 Suggestions
const SUGGESTIONS = [
  { kannada: "ಬಡ್ಡಿ ದರ ಏನು?", english: "What is the interest rate?" },
  { kannada: "ಮರುಪಾವತಿ ಹೇಗೆ?", english: "How do I repay?" },
  { kannada: "ಯಾವ ಯೋಜನೆ?", english: "Which schemes?" }
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
      return "Hello! I am Saathi, your GramCredit assistant.";
  }
};

// 🤖 Offline fallback
const getOfflineFallbackResponse = (message, lang) => {
  const text = message.toLowerCase();

  if (text.includes('interest') || text.includes('rate') || text.includes('ಬಡ್ಡಿ')) {
    return lang === 'kn'
      ? "ಬಡ್ಡಿ ದರವು 4% ರಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ."
      : "Interest rates start from 4% per annum.";
  }

  if (text.includes('repay') || text.includes('payment') || text.includes('ಮರುಪಾವತಿ')) {
    return lang === 'kn'
      ? "ನೀವು UPI ಅಥವಾ ಬ್ಯಾಂಕ್ ಮೂಲಕ ಮರುಪಾವತಿ ಮಾಡಬಹುದು."
      : "You can repay using UPI or Net Banking.";
  }

  return lang === 'kn'
    ? "ದಯವಿಟ್ಟು ಇನ್ನಷ್ಟು ವಿವರವಾಗಿ ಕೇಳಿ."
    : "Please ask more specifically.";
};

export const ChatbotPage = () => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: getWelcomeText('en'),
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
        toast.success("Listening...");
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
      toast.error("Speech not supported");
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
        language: selectedLang
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
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-60">
        
        {/* Header */}
        <div className="p-4 bg-white border-b flex justify-between">
          <h1 className="font-bold">Saathi Assistant</h1>

          <div className="flex gap-2">
            {LANG_LABELS.map(l => (
              <button key={l.code} onClick={() => handleLangChange(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(m => (
            <div key={m.id} className={m.sender === 'bot' ? 'text-left' : 'text-right'}>
              <div className="inline-block p-2 m-1 bg-gray-100 rounded">
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && <p>Typing...</p>}

          <div ref={messagesEndRef} />
        </div>

        {/* Clickable Suggestions */}
        <div className="px-4 py-2 flex flex-wrap gap-2 bg-gray-50 border-t">
          {SUGGESTIONS.map((s, idx) => {
            const label = selectedLang === 'kn' ? s.kannada : s.english;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(label)}
                className="px-3 py-1 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 text-gray-600 hover:text-green-700 rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-4 flex gap-2"
        >
          <button type="button" onClick={handleMicToggle}>
            🎤
          </button>

          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 border p-2"
            placeholder="Type message..."
          />

          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPage;