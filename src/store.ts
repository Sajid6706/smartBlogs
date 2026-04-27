import { create } from 'zustand';

type Theme = 'light' | 'orange';

interface User {
  id: number;
  email: string;
  username: string;
  role?: string;
  bio?: string;
  photo_url?: string;
}

interface AppState {
  user: User | null;
  accounts: User[];
  theme: Theme;
  setUser: (user: User) => void;
  addAccount: (user: User) => void;
  switchAccount: (userId: number) => void;
  removeAccount: (userId: number) => void;
  setTheme: (theme: Theme) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
  theme: (localStorage.getItem('theme') as Theme) || 'light',
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    // Also update in accounts list
    if (user) {
      set(state => {
        const otherAccounts = state.accounts.filter(a => a.id !== user.id);
        const newAccounts = [user, ...otherAccounts];
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        return { user, accounts: newAccounts };
      });
    } else {
      set({ user });
    }
  },
  addAccount: (user) => {
    set(state => {
      const exists = state.accounts.find(a => a.id === user.id);
      if (exists) return state;
      const newAccounts = [...state.accounts, user];
      localStorage.setItem('accounts', JSON.stringify(newAccounts));
      return { accounts: newAccounts };
    });
  },
  switchAccount: (userId) => {
    set(state => {
      const target = state.accounts.find(a => a.id === userId);
      if (target) {
        localStorage.setItem('user', JSON.stringify(target));
        return { user: target };
      }
      return state;
    });
  },
  removeAccount: (userId) => {
    set(state => {
      const newAccounts = state.accounts.filter(a => a.id !== userId);
      localStorage.setItem('accounts', JSON.stringify(newAccounts));
      let newUser = state.user;
      if (state.user?.id === userId) {
        newUser = newAccounts.length > 0 ? newAccounts[0] : null;
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      return { accounts: newAccounts, user: newUser };
    });
  },
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accounts');
    set({ user: null, accounts: [] });
  },
}));
