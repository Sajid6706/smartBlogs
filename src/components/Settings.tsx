import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  User, 
  Lock, 
  Shield, 
  Eye, 
  Save, 
  Loader2, 
  CheckCircle2,
  ArrowLeft,
  Mail,
  UserCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export const Settings = ({ onBack }: { onBack: () => void }) => {
  const { user, theme, setUser } = useStore();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Privacy states
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [allowSearch, setAllowSearch] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          newPassword 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setSuccess(true);
        setPassword('');
        setNewPassword('');
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/20' 
    : theme === 'dark' 
      ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-xl' 
      : 'bg-white border-slate-200 backdrop-blur-xl';

  const inputClasses = theme === 'orange' 
    ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' 
    : theme === 'dark' 
      ? 'bg-slate-900/50 border-slate-700 focus:ring-indigo-500 text-white' 
      : 'bg-slate-50 border-slate-200 focus:ring-indigo-500 text-slate-900';

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={onBack}
          className={`p-3 rounded-2xl transition-all border ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-4xl font-black uppercase italic tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile Section */}
        <div className="md:col-span-7 space-y-8">
          <section className={`p-8 rounded-[2.5rem] border shadow-sm ${cardClasses}`}>
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic">
              <UserCircle className="text-indigo-600" /> Profile Information
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-60">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Current Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Required to save changes"
                      className={`w-full px-4 py-4 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className={`w-full px-4 py-4 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
              {success && (
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 ${theme === 'orange' ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-orange-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </form>
          </section>
        </div>

        {/* Privacy Section */}
        <div className="md:col-span-5 space-y-8">
          <section className={`p-8 rounded-[2.5rem] border shadow-sm ${cardClasses}`}>
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic">
              <Shield className="text-emerald-500" /> Privacy
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Public Profile</p>
                  <p className="text-[10px] opacity-40 uppercase font-bold">Allow others to see your profile</p>
                </div>
                <button 
                  onClick={() => setIsPublicProfile(!isPublicProfile)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isPublicProfile ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublicProfile ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Search Indexing</p>
                  <p className="text-[10px] opacity-40 uppercase font-bold">Allow search engines to find you</p>
                </div>
                <button 
                  onClick={() => setAllowSearch(!allowSearch)}
                  className={`w-12 h-6 rounded-full transition-all relative ${allowSearch ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${allowSearch ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Show Email</p>
                  <p className="text-[10px] opacity-40 uppercase font-bold">Display email on your profile</p>
                </div>
                <button 
                  onClick={() => setShowEmail(!showEmail)}
                  className={`w-12 h-6 rounded-full transition-all relative ${showEmail ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showEmail ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className={`mt-12 p-6 rounded-3xl border ${theme === 'orange' ? 'bg-orange-500/5 border-orange-500/10' : 'bg-indigo-50/50 border-indigo-100'}`}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Lock className="w-3 h-3" /> Data Security
              </h3>
              <p className="text-[10px] leading-relaxed opacity-60">
                Your data is encrypted and stored securely. We never share your personal information with third parties without your explicit consent.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
