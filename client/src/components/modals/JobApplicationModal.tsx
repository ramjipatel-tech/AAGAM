import React, { useState } from 'react';
import {
  X,
  Briefcase,
  Send,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Building,
  Mail,
  Phone,
  User,
  GraduationCap,
  FileText,
  Sparkles,
  Link,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { JobOpening, PlacementDrive } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobOpening | PlacementDrive | null;
  onSuccess?: (appData: any) => void;
}

/**
 * JobApplicationModal provides a dedicated candidate application gateway
 * for Corporate Job Openings and Campus Placement Drives.
 * Includes live Email OTP verification and generates unique application tracking IDs.
 */
export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  job,
  onSuccess,
}) => {
  const { toast } = useAuth();

  // Candidate Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [cgpa, setCgpa] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  // OTP Verification
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!isOpen || !job) return null;

  const jobTitle = 'title' in job ? job.title : 'role' in job ? (job as any).role : 'Engineering Position';
  const departmentOrCompany = 'department' in job ? (job as any).department : 'company_name' in job ? (job as any).company_name : 'AAGAM Digital Technology';
  const location = 'location' in job ? (job as any).location : 'Pan-India';

  /**
   * Dispatches live 6-digit application OTP
   */
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address to receive your application code.');
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
        toast(`Verification OTP dispatched to ${email}.`, 'success');
      } else {
        setError(res.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to send OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  /**
   * Submits job application
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !collegeName.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (!otpSent || !otp.trim()) {
      setError('Please verify your email address by entering the 6-digit OTP.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.applyJob({
        job_id: job.id,
        applicant_name: fullName.trim(),
        applicant_email: email.trim().toLowerCase(),
        applicant_phone: phone.trim(),
        college_name: collegeName.trim(),
        graduation_year: graduationYear,
        cgpa: cgpa.trim() || undefined,
        resume_url: resumeUrl.trim() || '/uploads/resumes/candidate_resume.pdf',
        portfolio_url: portfolioUrl.trim() || undefined,
        cover_letter: coverLetter.trim() || undefined,
        otp: otp.trim(),
      });

      if (res.success && res.application) {
        setResult(res.application);

        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });

        toast(`Application submitted for ${jobTitle}!`, 'success');
        if (onSuccess) onSuccess(res.application);
      } else {
        setError(res.message || 'Application submission failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setResult(null);
    setOtpSent(false);
    setOtp('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-600 to-slate-900 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 border border-white/25 text-[11px] font-bold uppercase tracking-wider text-amber-100">
              <Briefcase className="w-3.5 h-3.5" />
              Corporate Recruitment Gateway
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
              {jobTitle}
            </h2>
            <div className="text-xs text-amber-100 flex items-center gap-3">
              <span>{departmentOrCompany}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {location}
              </span>
            </div>
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
          {result ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-emerald-500/15 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Application Under Review
                </span>
                <h3 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                  Application Received, {result.applicant_name}!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Your application tracking number is{' '}
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {result.application_no}
                  </span>
                  . Our corporate talent acquisition desk will review your profile and update you via email within our 48 to 72 hours SLA.
                </p>
              </div>

              <button
                onClick={resetModal}
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
              >
                Close & Return
              </button>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aditi Roy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-500" /> Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-500" /> College / University *
                  </label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. IIT Patna / NIT / DTU"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-500" /> Passout Year *
                  </label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="2027">2027</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023 or Earlier">2023 or Earlier</option>
                  </select>
                </div>
              </div>

              {/* Resume & Portfolio Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" /> Google Drive / Resume Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-amber-500" /> GitHub / Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email & OTP Verification */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" /> Registered Email Address & Security OTP *
                </label>

                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. aditi@gmail.com"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || !email}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
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
                        className="w-48 px-3.5 py-2 rounded-xl border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-center tracking-widest text-sm focus:outline-none"
                      />
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched via Gmail SMTP
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
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Submit Application for {jobTitle}</span>
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
