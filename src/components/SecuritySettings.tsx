import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle2,
  ArrowLeft,
  ShieldHalf
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export const SecuritySettings = ({ onBack }: { onBack: () => void }) => {
  const { user, theme } = useStore();
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await apiFetch(`/api/users/${user?.id}/security`, {
        method: 'PUT',
        body: JSON.stringify({ 
          password, 
          newPassword
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to update security');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/20' 
    : theme === 'glass'
      ? 'glass-card p-8 rounded-[2.5rem]'
      : 'bg-white border-slate-200 backdrop-blur-xl shadow-sm p-8 rounded-[2.5rem] border';

  const inputClasses = theme === 'orange' 
    ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' 
    : 'bg-slate-50 border-slate-200 focus:ring-indigo-500 text-slate-900';

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={onBack}
          className={`p-3 rounded-2xl transition-all border ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : theme === 'glass' ? 'border-white/40 bg-white/20 text-indigo-600 hover:bg-white/40' : 'border-slate-200 hover:bg-slate-100 text-slate-900'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-4xl font-black uppercase italic tracking-tight underline decoration-rose-500 underline-offset-8">Security</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className={cardClasses}>
          <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic text-rose-500">
            <ShieldHalf /> Change Password
          </h2>

          <form onSubmit={handleUpdateSecurity} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 text-rose-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 characters"
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 text-rose-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Password updated successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 ${theme === 'orange' ? 'bg-orange-500 text-black hover:bg-orange-400' : theme === 'glass' ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Update Security
            </button>
          </form>
        </section>

        <section className={cardClasses}>
          <h2 className="text-xl font-black mb-4 flex items-center gap-3 uppercase tracking-widest italic text-indigo-600">
            Account Status
          </h2>
          <div className={`p-6 rounded-3xl border ${theme === 'orange' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/60' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest">Two-Factor Authentication</p>
            <p className="text-[10px] opacity-60 mt-1 italic">Active: Verified via Email ID #{user?.id}</p>
          </div>
        </section>
      </div>
    </div>
  );
};
