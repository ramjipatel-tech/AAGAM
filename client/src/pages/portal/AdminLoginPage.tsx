import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  Key,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface AdminLoginPageProps {
  setCurrentView: (view: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ setCurrentView }) => {
  const { user, setUser, toast, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('brightspark772@gmail.com');
  const [password, setPassword] = useState('BrightSpark@772');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Auto-redirect if already logged in within 24 hours / active token
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'staff')) {
      setCurrentView(user.role === 'staff' ? 'portal-staff' : 'portal-admin');
    }
  }, [user, isAuthenticated, isLoading]);

  // Step 1: Initiate Admin 2FA
  const handleInitiate2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setDevOtpHint(null);

    try {
      const res = await api.adminLoginInit({ email, password });
      if (res.success && res.requiresOtp) {
        setStep('otp');
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
        toast(`2FA code sent to ${email}`, 'success');
      } else {
        setError(res.message || 'Authentication failed. Please verify administrative credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrative credentials or unauthorized email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 2FA OTP & Log in
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.adminLoginVerify({ email, otp });
      if (res.success && res.token) {
        localStorage.setItem('aagam_auth_token', res.token);
        setUser(res.user);
        toast('Admin 2FA Verified! Access Granted.', 'success');
        
        if (res.user.role === 'staff') {
          setCurrentView('portal-staff');
        } else {
          setCurrentView('portal-admin');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.message || 'Invalid 2FA security code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify 2FA security code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Back Link */}
        <button
          onClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          Return to Public Website
        </button>

        {/* Brand Logo & Security Header */}
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-sky-400 via-rose-500 to-amber-500 shadow-2xl shadow-rose-950/40 mx-auto">
            <img
              src="/aagam-logo.jpg"
              alt="AAGAM Logo"
              className="w-full h-full rounded-full object-cover bg-white"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-rose-600 text-white rounded-full shadow-lg border-2 border-slate-950">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-2xl font-heading font-extrabold tracking-tight text-white">
          AAGAM DIGITAL TECHNOLOGY
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-800/80 text-rose-300">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          Restricted Administrative & Faculty Gateway (2FA Required)
        </div>
        <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
          Authorized personnel only. All access attempts are cryptographically signed and audit-logged.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl border border-slate-800/80 rounded-3xl space-y-6">
          {error && (
            <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-2xl text-xs text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' ? (
            /* Step 1: Email & Password */
            <form onSubmit={handleInitiate2FA} className="space-y-4">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-slate-300">
                    Admin Portal: <strong className="text-white font-mono">brightspark772@gmail.com</strong>
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium font-mono">
                  2FA Active
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Administrative Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="brightspark772@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying Credentials & Sending OTP...</span>
                  ) : (
                    <>
                      <span>Proceed to 2FA Email Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: 2-Factor OTP Verification */
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-center space-y-1">
                <span className="text-xs font-bold text-rose-300 block">2-Factor Security Verification</span>
                <p className="text-[11px] text-slate-300">
                  A 6-digit 2FA passcode was sent to: <strong className="text-white">{email}</strong>
                </p>
                {devOtpHint && (
                  <div className="mt-1 text-[10px] text-amber-300 font-mono">
                    Dev Code: <strong>{devOtpHint}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit Admin Passcode
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full py-3.5 text-center tracking-[12px] font-mono text-2xl font-black bg-slate-950 border-2 border-rose-500/60 rounded-xl text-rose-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/40 transition-all"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating Session...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Access Admin Control Center</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setOtp('');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors text-center py-1"
                >
                  &larr; Back to Email & Password
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">
              AAGAM DIGITAL TECHNOLOGY PRIVATE LIMITED • Security Gateway
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Need technical assistance? Contact security@aagamdigitaltech.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
