import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  language: (typeof window !== 'undefined' ? localStorage.getItem('language') : 'EN') || 'EN',
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
    set({ language: lang });
  },
  login: (token, user) => {
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
