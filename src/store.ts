import { create } from 'zustand';

type Theme = 'light' | 'orange';

interface AppState {
  user: { id: number; email: string; username: string } | null;
  theme: Theme;
  setUser: (user: AppState['user']) => void;
  setTheme: (theme: Theme) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  theme: (localStorage.getItem('theme') as Theme) || 'light',
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
}));
