import { useNavigate, useLocation } from 'react-router-dom';
import { getTranslator } from '../utils/translations';
import { useAuthStore } from '../store/useAuthStore';
import { TRANSLATIONS } from '../utils/translations';

export const Sidebar = () => {
  const { user, logout, language: lang = 'EN' } = useAuthStore();
  const t_str = getTranslator(lang);
  const navigate = useNavigate();
  const location = useLocation();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  const menuItems = [
    { name: t.sidebar.dashboard, path: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
    { name: t.sidebar.kyc, path: '/kyc', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { name: t.sidebar.loans, path: '/loans', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: t.sidebar.transactions, path: '/transactions', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { name: t.sidebar.rosca, path: '/rosca', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4' },
    { name: t.sidebar.chat, path: '/chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { name: t.sidebar.vendors, path: '/vendors', icon: '🏪' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 h-screen bg-green-900 text-white fixed top-0 left-0 flex flex-col justify-between p-5 z-20 shadow-2xl">
      {/* Brand */}
      <div>
        <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={() => navigate('/dashboard')}>
          <div className="transform group-hover:scale-105 transition-transform duration-300">
            <img 
              src="/logo.png" 
              alt="GramCredit Logo" 
              className="w-9 h-9 object-contain rounded-xl shadow-md border border-green-800 bg-white p-0.5" 
            />
          </div>
          <span className="text-xl font-extrabold tracking-wide text-white group-hover:text-green-200 transition-colors duration-250">GramCredit</span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const displayName = item.name;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-green-700 text-white shadow-lg shadow-green-950/20'
                    : 'text-green-100 hover:bg-green-800 hover:text-white'
                }`}
              >
                {item.icon.startsWith('M') ? (
                  <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                ) : (
                  <span className="text-lg opacity-90 w-5 h-5 flex items-center justify-center">{item.icon}</span>
                )}
                {displayName}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Profile Card */}
      <div className="border-t border-green-800 pt-4 mt-auto">
        {user ? (
          <div className="mb-4 bg-green-950/40 p-3.5 rounded-xl border border-green-800/50">
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">{user.role}</p>
            <p className="text-sm font-extrabold truncate text-white mt-0.5">{user.name}</p>
            <p className="text-xs text-green-200/70 truncate font-mono mt-0.5">{user.phone}</p>
          </div>
        ) : (
          <div className="mb-4 bg-green-950/40 p-3.5 rounded-xl border border-green-800/50">
            <p className="text-sm font-bold text-green-300">{t.sidebar.session}</p>
            <p className="text-xs text-green-200/50">{t.sidebar.notLoggedIn}</p>
          </div>
        )}

        {/* My Profile Link */}
        <button
          onClick={() => navigate('/profile')}
          className={`w-full mb-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
            location.pathname === '/profile'
              ? 'bg-green-700 text-white shadow-lg shadow-green-950/20'
              : 'text-green-100 hover:bg-green-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t.sidebar.profile}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-700/20 hover:bg-red-700 hover:text-white border border-red-700/30 text-red-200 font-bold rounded-xl transition-all duration-200 text-sm active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t.sidebar.logout}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
