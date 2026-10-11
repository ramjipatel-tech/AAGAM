import React, { useState } from 'react';
import { X, Mail, Lock, KeyRound, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login', onSuccess }) => {
  const { login, register, verifyRegistrationOtp, toast, setUser } = useAuth();
  const [tab, setTab] = useState<'login' | 'otp-login' | 'register' | 'otp' | 'forgot-password'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [course, setCourse] = useState('');
  const [semesterYear, setSemesterYear] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [otp, setOtp] = useState('');

  // Forgot password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');

  if (!isOpen) return null;

  // 1. Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP for OTP Login
  const handleRequestOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.requestOtpLogin({ email });
      setInfoMessage(res.message || '6-digit login OTP sent to your email.');
      setForgotStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send login OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP for OTP Login
  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOtpLogin({ email, otp });
      if (res.token && res.user) {
        localStorage.setItem('aagam_auth_token', res.token);
        if (setUser) setUser(res.user);
        toast('Logged in successfully via OTP!', 'success');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Student Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register({
        email,
        password,
        full_name: fullName,
        phone,
        college_name: collegeName,
        course,
        semester_year: semesterYear,
        roll_no: rollNo,
      });
      if (res.requiresOtp) {
        setTab('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Verify Registration OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyRegistrationOtp(email, otp);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password - Request OTP
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setInfoMessage(res.message || 'Password reset OTP sent to your registered email.');
      setForgotStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Forgot Password - Submit Reset
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({
        email,
        otp: otp.trim(),
        new_password: newPassword,
      });
      toast(res.message || 'Password reset successfully! Please log in.', 'success');
      setTab('login');
      setPassword(newPassword);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 to-amber-500 shadow-md">
              <img src="/aagam-logo.jpg" alt="Logo" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                {tab === 'login'
                  ? 'Student Portal Login'
                  : tab === 'otp-login'
                  ? 'Instant OTP Sign-In'
                  : tab === 'register'
                  ? 'New Student Registration'
                  : tab === 'forgot-password'
                  ? 'Reset Account Password'
                  : 'Verify Email OTP'}
              </h3>
              <p className="text-xs text-slate-400">
                {tab === 'login' || tab === 'otp-login'
                  ? 'Access your applications, offer letters, tasks, and credentials'
                  : tab === 'register'
                  ? 'Join our industry internship and practical training programs'
                  : tab === 'forgot-password'
                  ? 'Receive a secure 6-digit OTP code to update your password'
                  : `Enter the 6-digit code sent to ${email}`}
              </p>
            </div>
          </div>

          {/* Navigation Pill Switches */}
          {tab !== 'otp' && (
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 mt-5 text-xs font-semibold">
              <button
                onClick={() => {
                  setTab('login');
                  setError(null);
                  setInfoMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  tab === 'login' || tab === 'otp-login' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setTab('register');
                  setError(null);
                  setInfoMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  tab === 'register' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 bg-sky-950/60 border border-sky-800/80 rounded-xl text-sky-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              {infoMessage}
            </div>
          )}

          {/* 1. PASSWORD LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Student Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot-password');
                      setForgotStep('request');
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In with Password'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* OTP Login Alternative Option */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTab('otp-login');
                    setForgotStep('request');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-xs text-slate-300 hover:text-sky-400 font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Sign In with 1-Click Email OTP (No Password)
                </button>
              </div>
            </form>
          )}

          {/* 2. OTP-ONLY LOGIN */}
          {tab === 'otp-login' && (
            <div>
              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestOtpLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Student Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Dispatching Code...' : 'Send Login OTP Code'}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ← Back to Password Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpLogin} className="space-y-4 text-center py-2">
                  <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/30 rounded-full flex items-center justify-center mx-auto text-sky-400">
                    <ShieldCheck className="w-7 h-7" />
                  </div>

                  <p className="text-xs text-slate-300">
                    Enter the 6-digit OTP code sent to <strong className="text-white">{email}</strong>
                  </p>

                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-44 text-center tracking-[0.35em] font-mono text-2xl py-2.5 bg-slate-950 border-2 border-sky-500/60 rounded-xl text-white focus:outline-none focus:border-sky-400 mx-auto block"
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="w-1/3 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Change Email
                    </button>
                    <button
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="w-2/3 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-sky-600/30 disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Sign In Now'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 3. FORGOT PASSWORD MODAL FLOW */}
          {tab === 'forgot-password' && (
            <div>
              {forgotStep === 'request' ? (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Sending Code...' : 'Send Password Reset OTP'}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.3em] font-mono text-xl py-2 bg-slate-950 border border-sky-500 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !otp || !newPassword || !confirmPassword}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Save New Password & Login'}
                    <KeyRound className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="hover:text-white"
                    >
                      ← Resend Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="text-sky-400 hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Set Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">College / Institute Name *</label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Course</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="B.Tech / BCA"
                    className="w-full px-2.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Semester/Year</label>
                  <input
                    type="text"
                    value={semesterYear}
                    onChange={(e) => setSemesterYear(e.target.value)}
                    placeholder="6th Sem / 3rd Yr"
                    className="w-full px-2.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="Roll/Reg No"
                    className="w-full px-2.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                By registering, a secure email verification OTP will be sent to confirm your identity.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Continue & Verify Email OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 5. REGISTRATION OTP VERIFICATION FORM */}
          {tab === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 text-center py-2">
              <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-full flex items-center justify-center mx-auto text-sky-400">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-heading font-bold text-white text-base">Enter 6-Digit Email OTP</h4>
                <p className="text-xs text-slate-400 mt-1">
                  We've sent a verification code to <span className="text-sky-300 font-semibold">{email}</span>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-48 text-center tracking-[0.4em] font-mono text-2xl py-3 bg-slate-950 border-2 border-sky-500/60 rounded-xl text-white focus:outline-none focus:border-sky-400 mx-auto block"
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>Didn't receive code?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await api.sendOtp({ email, purpose: 'registration' });
                    toast('Fresh OTP code dispatched to your email.', 'info');
                  }}
                  className="text-sky-400 hover:underline font-semibold"
                >
                  Resend OTP
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="w-1/3 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-2/3 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-sky-600/30 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Activate'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
