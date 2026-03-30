import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, Loader2, Lock, User as UserIcon, ArrowLeft, Moon, Info, Zap } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';

const TypingText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setDisplayedText('');
        setIndex(0);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return (
    <span className="inline-block min-h-[1.2em]">
      {displayedText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-1 h-8 bg-orange-500 ml-1 align-middle"
      />
    </span>
  );
};

export const Auth = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'otp' | 'forgot-password' | 'otp-reset' | 'new-password'>('info');
  const [showAbout, setShowAbout] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { setUser, theme, setTheme } = useStore();

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // If email is available, it means user doesn't exist
      if (checkRes.ok) {
        alert("No account found with this email.");
        setLoading(false);
        return;
      }

      const newOtp = generateOTP();
      const serviceId = process.env.VITE_EMAILJS_SERVICE_ID || "service_67f772n";
      const templateId = process.env.VITE_EMAILJS_TEMPLATE_ID || "template_5pvqoh3";
      const publicKey = process.env.VITE_EMAILJS_PUBLIC_KEY || "_CVskgaXxQLa-k1ik";

      if (serviceId && templateId && publicKey) {
        await emailjs.send(serviceId, templateId, {
          to_email: email,
          user_name: 'User',
          otp: newOtp,
        }, publicKey);
      }

      setSentOtp(newOtp);
      setStep('otp-reset');
    } catch (error: any) {
      alert("Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === sentOtp) {
      setStep('new-password');
    } else {
      alert("Invalid OTP");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error);
        setLoading(false);
        return;
      }

      alert("Password reset successfully! Please login.");
      setStep('info');
      setMode('login');
    } catch (error) {
      alert("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error);
          setLoading(false);
          return;
        }

        const user = await res.json();
        setUser(user);
      } else {
        const checkRes = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });

        if (!checkRes.ok) {
          const error = await checkRes.json();
          alert(error.error);
          setLoading(false);
          return;
        }

        const newOtp = generateOTP();
        const serviceId = process.env.VITE_EMAILJS_SERVICE_ID || "service_67f772n";
        const templateId = process.env.VITE_EMAILJS_TEMPLATE_ID || "template_5pvqoh3";
        const publicKey = process.env.VITE_EMAILJS_PUBLIC_KEY || "_CVskgaXxQLa-k1ik";

        if (serviceId && templateId && publicKey) {
          try {
            await emailjs.send(serviceId, templateId, {
              to_email: email,
              user_name: username || 'User',
              otp: newOtp,
            }, publicKey);
          } catch (emailError) {
            console.error("EmailJS Send Error:", emailError);
          }
        }

        setSentOtp(newOtp);
        setStep('otp');
      }
    } catch (error: any) {
      alert(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === sentOtp) {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), username: username.trim(), password }),
        });
        
        if (!res.ok) {
          const error = await res.json();
          alert(error.error);
          setLoading(false);
          return;
        }

        const user = await res.json();
        setUser(user);
      } catch (error) {
        console.error("Registration Error:", error);
      } finally {
        setLoading(false);
      }
    } else {
      alert("Invalid OTP");
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark': return 'bg-slate-900 text-white';
      case 'orange': return 'bg-black text-[#ff8c00]';
      case 'focus': return 'bg-stone-50 text-stone-900';
      case 'creative': return 'bg-indigo-50 text-indigo-900';
      default: return 'bg-slate-50 text-slate-900';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${getThemeClasses()}`}>
      {/* Navbar */}
      <nav className={`flex items-center justify-between px-8 py-4 border-b ${theme === 'orange' ? 'border-orange-900/30' : 'border-slate-200'}`}>
        <div className="text-3xl font-black tracking-tighter uppercase italic cursor-pointer" onClick={() => { setMode('login'); setStep('info'); }}>
          Smart Blog
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'orange' : 'dark')}
            className={`p-2 rounded-full transition-colors ${theme === 'orange' ? 'hover:bg-orange-500/10' : 'hover:bg-slate-800'}`}
          >
            {theme === 'dark' ? <Zap className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity"
          >
            <Info className="w-5 h-5" /> About
          </button>
          {mode === 'login' ? (
            <button 
              onClick={() => { setMode('register'); setStep('info'); }}
              className={`px-6 py-2 rounded-full font-black transition-all shadow-lg ${theme === 'orange' ? 'bg-[#ff8c00] text-black shadow-orange-500/20 hover:bg-orange-400' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
            >
              SIGNUP
            </button>
          ) : (
            <button 
              onClick={() => { setMode('login'); setStep('info'); }}
              className={`px-6 py-2 rounded-full font-black transition-all border ${theme === 'orange' ? 'border-[#ff8c00] text-[#ff8c00] hover:bg-orange-500/10' : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}
            >
              LOGIN
            </button>
          )}
        </div>
      </nav>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`p-8 rounded-[2rem] max-w-2xl w-full relative border ${theme === 'orange' ? 'bg-zinc-900 border-orange-500/20' : 'bg-white border-slate-200'}`}
            >
              <button 
                onClick={() => setShowAbout(false)}
                className={`absolute top-6 right-6 transition-colors ${theme === 'orange' ? 'text-orange-500/40 hover:text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ArrowLeft className="w-6 h-6 rotate-90" />
              </button>
              <h2 className="text-4xl font-black mb-6 uppercase italic tracking-tighter">About Smart Blog</h2>
              <div className={`space-y-4 leading-relaxed font-medium ${theme === 'orange' ? 'text-orange-500/80' : 'text-slate-600'}`}>
                <p>
                  Smart Blog is an AI-powered platform for modern storytellers. We combine cutting-edge technology with elegant design to provide a seamless writing and reading experience.
                </p>
                <p>
                  Our mission is to empower voices through intelligent tools and a vibrant community. Whether you're a professional writer or just starting out, Smart Blog provides the perfect canvas for your ideas.
                </p>
                <p>
                  Features include AI-assisted tag suggestions, real-time collaboration, and advanced content filtering to ensure a safe and engaging environment for everyone.
                </p>
              </div>
              <button 
                onClick={() => setShowAbout(false)}
                className={`mt-8 w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${theme === 'orange' ? 'bg-[#ff8c00] text-black hover:bg-orange-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow flex flex-col lg:flex-row items-center justify-center px-8 lg:px-24 gap-16 py-12">
        {/* Left Side: Typing Text */}
        <div className="lg:w-1/2 text-center lg:text-left">
          <h1 className="text-6xl lg:text-8xl font-black leading-tight mb-6">
            <TypingText text="Welcome to smart blog" />
          </h1>
          <p className={`text-xl max-w-xl font-medium ${theme === 'orange' ? 'text-orange-500/60' : 'text-slate-500'}`}>
            Your intelligent space for sharing thoughts, connecting with readers, and exploring the future of blogging.
          </p>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:w-1/2 w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-[2rem] border backdrop-blur-xl shadow-2xl ${theme === 'orange' ? 'bg-zinc-900/50 border-orange-500/20' : 'bg-white/80 border-slate-200'}`}
          >
            <h2 className="text-3xl font-black mb-8 text-center uppercase tracking-tight">
              {step === 'otp' ? 'Verify OTP' : step === 'otp-reset' ? 'Verify OTP' : step === 'new-password' ? 'New Password' : step === 'forgot-password' ? 'Reset Password' : mode === 'login' ? 'Login' : 'Register'}
            </h2>

            <AnimatePresence mode="wait">
              {step === 'info' ? (
                <motion.form 
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleAuth} 
                  className="space-y-6"
                >
                  {mode === 'register' && (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1">Username</label>
                      <div className="relative">
                        <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'orange' ? 'text-orange-500/40' : 'text-slate-400'}`} />
                        <input
                          required
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-2 outline-none transition-all ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' : 'bg-white border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                          placeholder="johndoe"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'orange' ? 'text-orange-500/40' : 'text-slate-400'}`} />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-2 outline-none transition-all ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' : 'bg-white border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'orange' ? 'text-orange-500/40' : 'text-slate-400'}`} />
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-2 outline-none transition-all ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' : 'bg-white border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div className="text-right">
                      <button 
                        type="button" 
                        onClick={() => setStep('forgot-password')}
                        className={`text-sm font-bold hover:opacity-80 transition-opacity ${theme === 'orange' ? 'text-orange-500' : 'text-indigo-600'}`}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${theme === 'orange' ? 'bg-[#ff8c00] text-black shadow-orange-500/20 hover:bg-orange-400' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : mode === 'login' ? 'Sign In' : 'Get Started'}
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setStep('info'); }}
                      className={`text-sm font-bold hover:opacity-80 transition-opacity ${theme === 'orange' ? 'text-orange-500' : 'text-indigo-600'}`}
                    >
                      {mode === 'login' ? "New here? Create an account" : "Already have an account? Login"}
                    </button>
                  </div>
                </motion.form>
              ) : step === 'forgot-password' ? (
                <motion.form 
                  key="forgot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleForgotPassword} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'orange' ? 'text-orange-500/40' : 'text-slate-400'}`} />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-2 outline-none transition-all ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' : 'bg-white border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <button
                    disabled={loading}
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${theme === 'orange' ? 'bg-[#ff8c00] text-black shadow-orange-500/20 hover:bg-orange-400' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Reset Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="w-full text-sm font-bold hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to login
                  </button>
                </motion.form>
              ) : step === 'otp-reset' ? (
                <motion.form 
                  key="otp-reset"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleVerifyResetOTP} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1 text-center block">Enter 6-digit OTP</label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={`w-full px-4 py-6 text-center text-4xl tracking-[0.5em] border rounded-2xl focus:ring-2 outline-none transition-all font-black ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' : 'bg-white border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                      placeholder="000000"
                    />
                  </div>
                  <button
                    disabled={loading}
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${theme === 'orange' ? 'bg-[#ff8c00] text-black shadow-orange-500/20 hover:bg-orange-400' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('forgot-password')}
                    className="w-full text-sm font-bold hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                </motion.form>
              ) : step === 'new-password' ? (
                <motion.form 
                  key="new-password"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleResetPassword} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'orange' ? 'text-orange-500/40' : 'text-slate-400'}`} />
                      <input
                        required
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-2 outline-none transition-all ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' : 'bg-white border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    disabled={loading}
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${theme === 'orange' ? 'bg-[#ff8c00] text-black shadow-orange-500/20 hover:bg-orange-400' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Reset Password'}
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleVerifyOTP} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1 text-center block">Enter 6-digit OTP</label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={`w-full px-4 py-6 text-center text-4xl tracking-[0.5em] border rounded-2xl focus:ring-2 outline-none transition-all font-black ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' : 'bg-white border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                      placeholder="000000"
                    />
                  </div>
                  <button
                    disabled={loading}
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${theme === 'orange' ? 'bg-[#ff8c00] text-black shadow-orange-500/20 hover:bg-orange-400' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify & Register'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="w-full text-sm font-bold hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to details
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`px-8 py-6 border-t ${theme === 'orange' ? 'border-orange-900/30 bg-zinc-950' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-black tracking-tighter uppercase italic">
            Smart Blog
          </div>
          <div className={`flex gap-8 text-sm font-bold ${theme === 'orange' ? 'text-orange-500/60' : 'text-slate-400'}`}>
            <a href="#" className="hover:opacity-80 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-80 transition-opacity">Terms of Service</a>
            <a href="#" className="hover:opacity-80 transition-opacity">Contact Us</a>
          </div>
          <div className={`text-sm font-medium ${theme === 'orange' ? 'text-orange-500/40' : 'text-slate-400'}`}>
            © 2026 Smart Blog AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
