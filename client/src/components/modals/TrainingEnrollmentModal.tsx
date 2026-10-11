import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  Calendar,
  Building2,
  Mail,
  Phone,
  User,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TrainingProgram } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TrainingEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: TrainingProgram | null;
  onSuccess?: (enrollmentData: any) => void;
}

/**
 * TrainingEnrollmentModal provides a dedicated, direct enrollment workflow
 * for AAGAM Engineering Masterclasses & Training programs.
 * Includes live Email OTP verification and generates an official tracking number.
 */
export const TrainingEnrollmentModal: React.FC<TrainingEnrollmentModalProps> = ({
  isOpen,
  onClose,
  program,
  onSuccess,
}) => {
  const { toast } = useAuth();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [qualification, setQualification] = useState('B.Tech 3rd/4th Year');
  const [batchPreference, setBatchPreference] = useState('Weekend Intensive (Sat-Sun)');

  // OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentResult, setEnrollmentResult] = useState<any>(null);

  if (!isOpen || !program) return null;

  /**
   * Dispatches a live 6-digit verification OTP to the candidate's email address
   */
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address to receive your verification code.');
      return;
    }
    setError(null);
    setOtpSending(true);

    try {
      const res = await api.sendApplyOtp(email.trim(), fullName.trim() || 'Candidate');
      if (res.success) {
        setOtpSent(true);
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
        toast(`Verification code dispatched to ${email}. Please check your inbox.`, 'success');
      } else {
        setError(res.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to send OTP. Please verify your connection.');
    } finally {
      setOtpSending(false);
    }
  };

  /**
   * Validates details and submits training enrollment
   */
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !collegeName.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (!otpSent || !otp.trim()) {
      setError('Please verify your email address by requesting and entering the 6-digit OTP.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.enrollTraining({
        training_id: program.id,
        student_name: fullName.trim(),
        student_email: email.trim().toLowerCase(),
        student_phone: phone.trim(),
        college_name: collegeName.trim(),
        qualification,
        batch_preference: batchPreference,
        otp: otp.trim(),
      });

      if (res.success && res.enrollment) {
        setEnrollmentResult(res.enrollment);

        // Trigger celebratory confetti animation
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });

        toast(`Enrollment confirmed for ${program.title}!`, 'success');
        if (onSuccess) onSuccess(res.enrollment);
      } else {
        setError(res.message || 'Enrollment submission failed. Please check your OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete training enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setEnrollmentResult(null);
    setOtpSent(false);
    setOtp('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Top Header Strip */}
        <div className="p-6 bg-gradient-to-r from-sky-600 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold uppercase tracking-wider text-sky-200">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              Masterclass Training Enrollment
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
              {program.title}
            </h2>
          </div>
          <button
            onClick={resetModal}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-2xl flex items-center gap-3 text-xs text-rose-700 dark:text-rose-200 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success State */}
          {enrollmentResult ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-emerald-500/15 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Official Enrollment Confirmed
                </span>
                <h3 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                  Welcome aboard, {enrollmentResult.student_name}!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Your registration has been logged under Tracking ID{' '}
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {enrollmentResult.enrollment_no}
                  </span>
                  . Complete batch schedule, Google Meet induction links, and syllabus materials have been sent to your email.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Program:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{program.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Batch:</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">{enrollmentResult.batch_preference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered Email:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{enrollmentResult.student_email}</span>
                </div>
              </div>

              <button
                onClick={resetModal}
                className="w-full sm:w-auto px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all"
              >
                Close & Return to Programs
              </button>
            </div>
          ) : (
            /* Enrollment Form */
            <form onSubmit={handleEnrollSubmit} className="space-y-6">
              {/* Program Highlight Bar */}
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Duration: <strong>{program.duration}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Level: <strong>{program.level}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Certification: <strong>QR Verified</strong></span>
                </div>
              </div>

              {/* Personal & College Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-500" /> WhatsApp / Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* College & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-500" /> College / University Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. NIT Patna / IIT BHU / DTU"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-500" /> Qualification / Year *
                  </label>
                  <select
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="B.Tech 1st/2nd Year">B.Tech 1st / 2nd Year</option>
                    <option value="B.Tech 3rd/4th Year">B.Tech 3rd / 4th Year</option>
                    <option value="BCA / MCA Student">BCA / MCA Student</option>
                    <option value="B.Sc / M.Sc Computer Science">B.Sc / M.Sc Computer Science</option>
                    <option value="Working Professional / Graduate">Working Professional / Graduate</option>
                  </select>
                </div>
              </div>

              {/* Batch Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" /> Preferred Batch Schedule *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      batchPreference === 'Weekend Intensive (Sat-Sun)'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 font-semibold text-sky-900 dark:text-sky-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>Weekend Intensive (Sat-Sun 6:00 PM)</span>
                    <input
                      type="radio"
                      name="batch"
                      checked={batchPreference === 'Weekend Intensive (Sat-Sun)'}
                      onChange={() => setBatchPreference('Weekend Intensive (Sat-Sun)')}
                      className="accent-sky-500"
                    />
                  </label>

                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      batchPreference === 'Regular Weekday (Mon-Wed-Fri)'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 font-semibold text-sky-900 dark:text-sky-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>Regular Weekday (Mon-Wed-Fri 7:30 PM)</span>
                    <input
                      type="radio"
                      name="batch"
                      checked={batchPreference === 'Regular Weekday (Mon-Wed-Fri)'}
                      onChange={() => setBatchPreference('Regular Weekday (Mon-Wed-Fri)')}
                      className="accent-sky-500"
                    />
                  </label>
                </div>
              </div>

              {/* Email Address & Live OTP Verification */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-500" /> Registered Email Address & Security OTP *
                </label>

                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@gmail.com"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || !email}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {otpSending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>

                {otpSent && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-Digit Email OTP"
                        className="w-48 px-3.5 py-2 rounded-xl border border-sky-400 dark:border-sky-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-center tracking-widest text-sm focus:outline-none"
                      />
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Code dispatched via Gmail SMTP
                      </span>
                    </div>

                    {devOtpHint && (
                      <div className="text-[10px] text-amber-500 font-mono">
                        [Test Hint: {devOtpHint}]
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Confirming Enrollment...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Complete Masterclass Enrollment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
