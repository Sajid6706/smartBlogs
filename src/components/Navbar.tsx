import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { 
  User, 
  Settings, 
  Home, 
  FileText, 
  Moon, 
  Sun, 
  Zap,
  LogOut, 
  Shield,
  UserCircle,
  ChevronDown,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onViewChange: (view: 'dashboard' | 'editor' | 'view' | 'settings' | 'admin' | 'privacy', subView?: 'all' | 'my') => void;
  currentView: string;
  currentSubView?: string;
}

export const Navbar = ({ onViewChange, currentView, currentSubView }: NavbarProps) => {
  const { theme, setTheme, user, logout } = useStore();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light': return 'bg-white/80 border-slate-200 text-slate-900';
      case 'orange': return 'bg-black/80 border-orange-900/30 text-[#ff8c00]';
      default: return 'bg-white/80 border-slate-200 text-slate-900';
    }
  };

  const dropdownClasses = theme === 'orange' 
    ? 'bg-zinc-900 border-orange-500/20 text-orange-100' 
    : 'bg-white border-slate-200 text-slate-900';

  const itemHoverClasses = theme === 'orange'
    ? 'hover:bg-orange-500/10 hover:text-orange-500'
    : 'hover:bg-slate-100';

  const actionBtnClasses = `p-3 rounded-2xl border transition-all ${
    theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/5 text-orange-500' : 'border-slate-200 hover:bg-slate-100 text-slate-900'
  }`;

  return (
    <nav className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300 ${getThemeClasses()}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="text-3xl font-black tracking-tighter uppercase italic cursor-pointer flex items-center gap-2"
          onClick={() => onViewChange('dashboard', 'all')}
        >
          <span className={theme === 'orange' ? 'text-orange-500' : 'text-indigo-600'}>Smart</span>
          <span>Blog</span>
        </div>

        {/* Desktop Actions */}
        <div className="flex items-center gap-3">
          {/* Main Nav Buttons */}
          <div className="hidden md:flex items-center gap-2 mr-4 text-inherit">
            <button 
              onClick={() => onViewChange('dashboard', 'all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${currentView === 'dashboard' && currentSubView === 'all' ? (theme === 'orange' ? 'text-orange-500 bg-orange-500/10' : 'text-indigo-600 bg-indigo-50') : 'opacity-60 hover:opacity-100'}`}
            >
              <Users className="w-4 h-4" /> All Posts
            </button>
            <button 
              onClick={() => onViewChange('dashboard', 'my')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${currentView === 'dashboard' && currentSubView === 'my' ? (theme === 'orange' ? 'text-orange-500 bg-orange-500/10' : 'text-indigo-600 bg-indigo-50') : 'opacity-60 hover:opacity-100'}`}
            >
              <FileText className="w-4 h-4" /> My Posts
            </button>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'orange' : 'light')}
            className={actionBtnClasses}
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Profile Button */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowSettingsDropdown(false);
              }}
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${
                theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/5' : 'border-slate-200 hover:bg-slate-100 text-inherit'
              }`}
            >
              {user?.photo_url ? (
                <img src={user.photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  theme === 'orange' ? 'bg-orange-500/20 text-orange-500' : 'bg-indigo-600 text-white'
                }`}>
                  {user?.username?.[0].toUpperCase()}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black uppercase tracking-tighter leading-none mb-1">{user?.username}</p>
                <p className={`text-[10px] font-medium opacity-60 leading-none`}>Account</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-3 w-56 rounded-2xl border shadow-xl overflow-hidden z-50 ${dropdownClasses}`}
                >
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => {
                        onViewChange('dashboard', 'all');
                        setShowProfileDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${itemHoverClasses} md:hidden`}
                    >
                      <Users className="w-4 h-4" /> All Posts
                    </button>
                    <button 
                      onClick={() => {
                        onViewChange('dashboard', 'my');
                        setShowProfileDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${itemHoverClasses} md:hidden`}
                    >
                      <FileText className="w-4 h-4" /> My Posts
                    </button>
                    
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          onViewChange('admin');
                          setShowProfileDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${itemHoverClasses} text-indigo-600`}
                      >
                        <Shield className="w-4 h-4" /> Admin Panel
                      </button>
                    )}
                    <button 
                      onClick={logout}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-rose-500 hover:bg-rose-500/10`}
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Icon */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => {
                setShowSettingsDropdown(!showSettingsDropdown);
                setShowProfileDropdown(false);
              }}
              className={actionBtnClasses}
            >
              <Settings className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showSettingsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-3 w-56 rounded-2xl border shadow-xl overflow-hidden z-50 ${dropdownClasses}`}
                >
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => {
                        onViewChange('settings');
                        setShowSettingsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${itemHoverClasses}`}
                    >
                      <UserCircle className="w-4 h-4" /> Profile Settings
                    </button>
                    <button 
                      onClick={() => {
                        onViewChange('privacy');
                        setShowSettingsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${itemHoverClasses}`}
                    >
                      <Shield className="w-4 h-4" /> Privacy Settings
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};
