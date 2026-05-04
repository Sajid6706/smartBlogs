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
  Droplets,
  LogOut, 
  Shield,
  UserCircle,
  ChevronDown,
  Users,
  Bell,
  Check,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

interface NavbarProps {
  onViewChange: (view: 'dashboard' | 'editor' | 'view' | 'settings' | 'admin' | 'privacy' | 'profile' | 'security', subView?: 'all' | 'my') => void;
  onViewProfile?: (userId: number) => void;
  currentView: string;
  currentSubView?: string;
}

export const Navbar = ({ onViewChange, onViewProfile, currentView, currentSubView }: NavbarProps) => {
  const { theme, setTheme, user, logout } = useStore();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/notifications?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      await apiFetch('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id })
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'light': return 'bg-white/80 border-slate-200 text-slate-900';
      case 'orange': return 'bg-black/80 border-orange-900/30 text-[#ff8c00]';
      case 'glass': return 'bg-white/30 backdrop-blur-2xl border-white/40 text-indigo-950';
      default: return 'bg-white/80 border-slate-200 text-slate-900';
    }
  };

  const dropdownClasses = theme === 'orange' 
    ? 'bg-zinc-900 border-orange-500/20 text-orange-100' 
    : theme === 'glass'
      ? 'bg-white/40 backdrop-blur-3xl border-white/40 text-black shadow-2xl'
      : 'bg-white border-slate-200 text-slate-900';

  const itemHoverClasses = theme === 'orange'
    ? 'hover:bg-orange-500/10 hover:text-orange-500'
    : theme === 'glass'
      ? 'hover:bg-white/30'
      : 'hover:bg-slate-100';

  const actionBtnClasses = `p-3 rounded-2xl border transition-all ${
    theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/5 text-orange-500' : 
    theme === 'glass' ? 'border-white/40 bg-white/20 text-indigo-600 hover:bg-white/40' :
    'border-slate-200 hover:bg-slate-100 text-slate-900'
  }`;

  const toggleTheme = () => {
    if (theme === 'light') setTheme('orange');
    else if (theme === 'orange') setTheme('glass');
    else setTheme('light');
  };

  return (
    <nav className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300 ${getThemeClasses()}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="text-3xl font-black tracking-tighter uppercase italic cursor-pointer flex items-center gap-2"
          onClick={() => onViewChange('dashboard', 'all')}
        >
          <span className={theme === 'orange' ? 'text-orange-500' : theme === 'glass' ? 'text-indigo-600 drop-shadow-sm' : 'text-indigo-600'}>Smart</span>
          <span className={theme === 'glass' ? 'text-indigo-950/80' : ''}>Blog</span>
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
            onClick={toggleTheme}
            className={actionBtnClasses}
            title={`Switch to ${theme === 'light' ? 'Dark' : theme === 'orange' ? 'Glass' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : theme === 'orange' ? <Sun className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
                setShowSettingsDropdown(false);
                if (!showNotifications) markAsRead();
              }}
              className={`${actionBtnClasses} relative`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full font-black ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-3 w-80 rounded-3xl border shadow-2xl overflow-hidden z-50 ${dropdownClasses}`}
                >
                  <div className="p-4 border-b border-inherit flex justify-between items-center">
                    <h3 className="font-black uppercase tracking-widest text-xs">Notifications</h3>
                    <button className="text-[10px] font-bold opacity-40 hover:opacity-100 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-12 text-center opacity-30">
                        <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-4 border-b border-inherit last:border-0 hover:bg-slate-50 transition-all cursor-pointer ${!n.is_read ? (theme === 'orange' ? 'bg-orange-500/5' : 'bg-indigo-50/30') : ''}`}>
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0">
                              {n.from_photo ? <img src={n.from_photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-bold">{n.from_name?.[0]}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs leading-relaxed"><span className="font-black">@{n.from_name}</span> {n.message}</p>
                              <p className="text-[10px] opacity-40 font-bold mt-1">
                                {formatDistanceToNow(new Date(n.created_at))} ago
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                        if (user && onViewProfile) onViewProfile(user.id);
                        setShowProfileDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${itemHoverClasses}`}
                    >
                      <UserCircle className="w-4 h-4" /> View My Profile
                    </button>
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
                        onViewChange('security');
                        setShowSettingsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${itemHoverClasses}`}
                    >
                      <Lock className="w-4 h-4" /> Privacy & Security
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
