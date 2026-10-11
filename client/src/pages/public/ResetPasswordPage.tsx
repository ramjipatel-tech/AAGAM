import React, { useState, useEffect } from 'react';
import { KeyRound, Mail, Lock, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

interface ResetPasswordPageProps {
  setCurrentView: (view: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ setCurrentView }) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');

    if (tokenParam) {
      setToken(tokenParam);
      if (emailParam) setEmail(emailParam);
      setStep('reset');
    }
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setInfoMessage(res.message || 'Verification OTP dispatched to your registered email address.');
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        email,
        new_password: newPassword,
        otp: otp.trim() ? otp.trim() : undefined,
        token: token.trim() ? token.trim() : undefined,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please check your OTP or link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-sky-400 to-amber-500" />

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 to-amber-500 mx-auto shadow-lg shadow-sky-500/20">
            <img src="/aagam-logo.jpg" alt="AAGAM Logo" className="w-full h-full rounded-full object-cover bg-white" />
          </div>
          <h2 className="text-2xl font-heading font-black tracking-tight text-white">
            AAGAM Digital Technology
          </h2>
          <p className="text-xs text-sky-400 font-bold uppercase tracking-widest">
            Student Account Security Gateway
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 bg-sky-950/70 border border-sky-800 rounded-xl text-xs text-sky-300 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: REQUEST OTP / RESET LINK */}
        {step === 'request' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Student Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                We will send a 6-digit verification OTP and a secure reset link to this email.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Dispatching OTP...' : 'Send Password Reset Code'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: ENTER OTP & NEW PASSWORD */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {!token && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.3em] font-mono text-xl py-2.5 bg-slate-950/70 border border-sky-500/60 rounded-xl text-white focus:outline-none focus:border-sky-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || (!otp && !token)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Updating Credentials...' : 'Save New Password'}
              <KeyRound className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="hover:text-white"
              >
                ← Request New Code
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="text-sky-400 hover:underline"
              >
                Back to Home
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-heading font-black text-white">
                Password Successfully Changed!
              </h3>
              <p className="text-xs text-slate-300">
                Your AAGAM student credentials have been securely updated. A confirmation email has been sent.
              </p>
            </div>

            <button
              onClick={() => {
                setCurrentView('home');
              }}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Return to Login & Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
