import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (token, user) => {
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
