import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Shield, 
  Eye, 
  ArrowLeft,
  Bell,
  Palette,
  Globe,
  Mail
} from 'lucide-react';

export const PrivacySettings = ({ onBack }: { onBack: () => void }) => {
  const { theme } = useStore();
  
  // Privacy states (In a real app, these would be synced with backend)
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [allowSearch, setAllowSearch] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/20' 
    : 'bg-white border-slate-200 backdrop-blur-xl shadow-sm';

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={onBack}
          className={`p-3 rounded-2xl transition-all border ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : 'border-slate-200 hover:bg-slate-100 text-slate-900'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-4xl font-black uppercase italic tracking-tight underline decoration-emerald-500 underline-offset-8">Privacy & Options</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className={`p-8 rounded-[2.5rem] border shadow-sm ${cardClasses}`}>
          <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic text-emerald-500">
            <Shield /> Security & Visibility
          </h2>

          <div className="space-y-8">
            <ToggleOption 
              icon={Eye} 
              label="Public Profile" 
              subLabel="Make your profile visible to everyone" 
              enabled={isPublicProfile} 
              onToggle={() => setIsPublicProfile(!isPublicProfile)} 
            />
            <ToggleOption 
              icon={Globe} 
              label="Discoverability" 
              subLabel="Appear in public search results" 
              enabled={allowSearch} 
              onToggle={() => setAllowSearch(!allowSearch)} 
            />
            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Preferences</h3>
              <div className="space-y-8">
                <ToggleOption 
                  icon={Bell} 
                  label="Push Notifications" 
                  subLabel="Instant alerts for local activity" 
                  enabled={pushNotifications} 
                  onToggle={() => setPushNotifications(!pushNotifications)} 
                />
                <ToggleOption 
                  icon={Mail} 
                  label="Email Digest" 
                  subLabel="Weekly summary of your blogs" 
                  enabled={emailDigest} 
                  onToggle={() => setEmailDigest(!emailDigest)} 
                />
              </div>
            </div>
          </div>
        </section>

        <section className={`p-8 rounded-[2.5rem] border shadow-sm ${cardClasses}`}>
          <h2 className="text-xl font-black mb-4 flex items-center gap-3 uppercase tracking-widest italic text-indigo-600">
            <Palette className="w-5 h-5" /> Appearance
          </h2>
          <p className="text-xs font-medium opacity-60 leading-relaxed mb-6">
            Customize how you see SmartBlog. These settings are stored locally on your device for maximum speed.
          </p>
          <div className={`p-6 rounded-3xl border ${theme === 'orange' ? 'bg-orange-500/5 border-orange-500/10 text-orange-500/60' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest">Theme Engine 2.0</p>
            <p className="text-[10px] opacity-60 mt-1 italic">Active theme: {theme.toUpperCase()}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

const ToggleOption = ({ icon: Icon, label, subLabel, enabled, onToggle }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl opacity-60">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-base font-black uppercase tracking-tighter">{label}</p>
        <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">{subLabel}</p>
      </div>
    </div>
    <button 
      onClick={onToggle}
      className={`w-14 h-7 rounded-full transition-all relative ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${enabled ? 'right-1' : 'left-1'}`} />
    </button>
  </div>
);
