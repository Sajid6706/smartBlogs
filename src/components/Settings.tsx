import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  User, 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle2,
  ArrowLeft,
  Mail,
  UserCircle,
  Plus,
  Trash2,
  Camera,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';

export const Settings = ({ onBack, onNavigateToAuth }: { onBack: () => void, onNavigateToAuth?: () => void }) => {
  const { user, accounts, theme, setUser, switchAccount, removeAccount } = useStore();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await apiFetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          newPassword,
          bio,
          photo_url: photoUrl
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately for better UX
    const localUrl = URL.createObjectURL(file);
    setPhotoUrl(localUrl);

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPhotoUrl(data.url);
      }
    } catch (error) {
      console.error("Photo Upload Error:", error);
      setPhotoUrl(user?.photo_url || ''); // Revert on failure
    } finally {
      setUploading(false);
    }
  };

  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/20' 
    : 'bg-white border-slate-200 backdrop-blur-xl shadow-sm';

  const inputClasses = theme === 'orange' 
    ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' 
    : 'bg-slate-50 border-slate-200 focus:ring-indigo-500 text-slate-900';

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={onBack}
          className={`p-3 rounded-2xl transition-all border ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : 'border-slate-200 hover:bg-slate-100 text-slate-900'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-4xl font-black uppercase italic tracking-tight underline decoration-indigo-600 underline-offset-8">Profile Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Settings */}
        <div className="space-y-8">
          <section className={`p-8 rounded-[2.5rem] border shadow-sm ${cardClasses}`}>
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic text-indigo-600">
              <UserCircle /> Profile Details
            </h2>

            {/* Profile Photo Section */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-indigo-500/10">
              <div className="relative group">
                <div className={`w-32 h-32 rounded-[2rem] overflow-hidden border-4 transition-all relative ${theme === 'orange' ? 'border-orange-500/20 group-hover:border-orange-500' : 'border-slate-100 group-hover:border-indigo-600'}`}>
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Profile" 
                      className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`} 
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-4xl font-black ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-100 text-indigo-600'}`}>
                      {username[0]?.toUpperCase()}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${theme === 'orange' ? 'border-orange-500' : 'border-indigo-600'}`}></div>
                    </div>
                  )}
                </div>
                <label className={`absolute -right-2 -bottom-2 p-3 rounded-2xl cursor-pointer shadow-xl transition-all ${theme === 'orange' ? 'bg-orange-500 text-black hover:bg-orange-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  <Camera className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" disabled={uploading} />
                </label>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2 italic">{username}</h3>
                <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">{user?.role} Account</p>
                <div className="flex gap-2 justify-center md:justify-start">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-50 text-indigo-600'}`}>
                    ID: #{user?.id}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Bio / Description</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-4 h-4 opacity-30" />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all font-medium min-h-[120px] resize-none ${inputClasses}`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-indigo-500/5">
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60 italic">Security Upgrade</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Current Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Verify identity"
                      className={`w-full px-4 py-4 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Optional update"
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
                disabled={loading || uploading}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 ${theme === 'orange' ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-orange-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Profile
              </button>
            </form>
          </section>

          <section className={`p-8 rounded-[2.5rem] border shadow-sm ${cardClasses}`}>
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic text-indigo-600">
              <Plus className="w-5 h-5" /> Account Management
            </h2>
            <div className="mb-0">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Linked Sessions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map(acc => (
                  <div 
                    key={acc.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      user?.id === acc.id 
                        ? (theme === 'orange' ? 'border-orange-500 bg-orange-500/10' : 'border-indigo-600 bg-indigo-50') 
                        : (theme === 'orange' ? 'border-orange-500/20' : 'border-slate-100')
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {acc.photo_url ? (
                        <img src={acc.photo_url} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${theme === 'orange' ? 'bg-orange-500/20 text-orange-500' : 'bg-indigo-600 text-white'}`}>
                          {acc.username[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-black uppercase tracking-tighter">{acc.username}</p>
                        <p className="text-[10px] opacity-40">{acc.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {user?.id !== acc.id && (
                        <button 
                          onClick={() => switchAccount(acc.id)}
                          className={`p-2 rounded-xl text-[10px] font-black uppercase transition-all ${theme === 'orange' ? 'bg-orange-500 text-black' : 'bg-indigo-600 text-white'}`}
                        >
                          Switch
                        </button>
                       )}
                       <button 
                        onClick={() => removeAccount(acc.id)}
                        className={`p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all`}
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => window.location.reload()}
                  className={`p-4 rounded-2xl border border-dashed flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-all ${theme === 'orange' ? 'border-orange-500/20' : 'border-slate-200'}`}
                >
                  <Plus className="w-4 h-4" /> Add Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
