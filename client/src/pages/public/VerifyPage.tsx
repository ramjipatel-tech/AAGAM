import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  FileText,
  Calendar,
  UserCheck,
  QrCode,
  Lock,
  ArrowRight,
  Clock,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { VerificationResult } from '../../types';
import { api } from '../../services/api';

export const VerifyPage: React.FC = () => {
  const [queryId, setQueryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);

  // Read URL query parameter "?id=..." on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam) {
      setQueryId(idParam);
      handleLookup(idParam);
    }
  }, []);

  const handleLookup = async (idToSearch?: string) => {
    const target = idToSearch || queryId;
    if (!target.trim()) return;

    setLoading(true);
    setResult(null);
    setNotFoundMessage(null);

    try {
      const res = await api.verifyDocument(target.trim());
      if (res.success && res.isVerified) {
        setResult(res.document);
      } else {
        setNotFoundMessage(res.message || `No official credential or application found matching ID "${target}".`);
      }
    } catch (err: any) {
      setNotFoundMessage(err.message || 'Verification lookup failed. Please check ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoId: string) => {
    setQueryId(demoId);
    handleLookup(demoId);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Official Document & Application Registry
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900">
          Track Status & Verify Credentials
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Track your real-time <strong>Internship Application Status</strong> (e.g. <code>AAGAM-INT-...</code>) or verify the authenticity of any official AAGAM <strong>Certificate</strong>, <strong>LOR</strong>, or <strong>Offer Letter</strong>.
        </p>
      </div>

      {/* Verification Search Box */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="space-y-4"
        >
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Enter Application Number (e.g. AAGAM-INT-...) or Document ID
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                placeholder="e.g. AAGAM-INT-2026-000014 or AAGAM-CERT-2026-000001"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Checking Registry...</span>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Check Status & Verify</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Demo Test Buttons */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Quick Test Samples:</span>
          <button
            type="button"
            onClick={() => handleQuickDemo('AAGAM-INT-2026-000014')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-mono transition-colors"
          >
            Application: AAGAM-INT-2026-000014
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('AAGAM-OFFER-2026-000001')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-lg font-mono transition-colors"
          >
            Offer: AAGAM-OFFER-2026-000001
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('AAGAM-CERT-2026-000001')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg font-mono transition-colors"
          >
            Certificate: AAGAM-CERT-2026-000001
          </button>
        </div>
      </div>

      {/* APPLICATION TRACKING RESULT CARD */}
      {result && result.documentType === 'Internship Application' && (
        <div className="bg-white rounded-3xl border-2 border-sky-500 p-8 sm:p-10 shadow-2xl space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-sky-100 text-sky-800">
                  APPLICATION STATUS: {result.status?.toUpperCase()}
                </span>
                <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
                  Internship Application Tracking
                </h3>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">{result.documentId}</div>
              <div className="text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Registered in Database
              </div>
            </div>
          </div>

          {/* Applicant Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Candidate Name</span>
                <span className="font-bold text-sky-900 text-lg">{result.studentName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Candidate Email & Phone</span>
                <span className="font-mono text-slate-700">{result.studentEmail} &bull; {result.studentPhone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Institution / College</span>
                <span className="font-semibold text-slate-700">{result.collegeName}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Applied Internship Program</span>
                <span className="font-bold text-slate-900 text-base">{result.programTitle}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Course / Semester</span>
                <span className="font-semibold text-slate-700">{result.course} ({result.semesterYear})</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Submission Date</span>
                <span className="font-semibold text-slate-700">
                  {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* 5-STAGE VISUAL APPLICATION TIMELINE */}
          {Array.isArray(result.timeline) && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <span>Live Milestone Timeline</span>
              </h4>

              <div className="space-y-3">
                {result.timeline.map((step: any) => (
                  <div
                    key={step.step}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      step.status === 'Completed'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : step.status === 'In Progress' || step.status === 'Action Required'
                        ? 'bg-sky-50/70 border-sky-300 shadow-sm'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          step.status === 'Completed'
                            ? 'bg-emerald-600 text-white'
                            : step.status === 'In Progress' || step.status === 'Action Required'
                            ? 'bg-sky-600 text-white animate-pulse'
                            : 'bg-slate-300 text-slate-600'
                        }`}
                      >
                        {step.status === 'Completed' ? <CheckCircle2 className="w-5 h-5" /> : step.step}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{step.title}</div>
                        <div className="text-xs text-slate-600">{step.description}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          step.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : step.status === 'Action Required'
                            ? 'bg-amber-100 text-amber-800'
                            : step.status === 'In Progress'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.status}
                      </span>
                      <div className="text-[11px] text-slate-500 font-mono mt-1">{step.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-white text-base">Need Assistance or Offer Acceptance?</div>
              <div className="text-xs text-slate-400">
                {result.offerId
                  ? `Offer Letter ${result.offerId} is ready for digital review & acceptance.`
                  : 'Our HR team evaluates submissions within 24-48 hours. Offer letter will be dispatched to your email.'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {result.offerId && result.acceptUrl && (
                <a
                  href={result.acceptUrl}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Review & Accept Offer &rarr;</span>
                </a>
              )}
              <a
                href="https://wa.me/919693335499"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Contact HR (9693335499)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD DOCUMENT VERIFICATION RESULT CARD (CERTIFICATES / LORS / OFFERS) */}
      {result && result.documentType !== 'Internship Application' && (
        <div className="bg-white rounded-3xl border-2 border-emerald-500 p-8 sm:p-10 shadow-2xl space-y-8 animate-fadeIn">
          {/* Top Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  result.status === 'Valid' || result.status === 'Issued' || result.status === 'Accepted'
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-rose-500 text-white shadow-rose-500/20'
                }`}
              >
                {result.status === 'Valid' || result.status === 'Issued' || result.status === 'Accepted' ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <XCircle className="w-8 h-8" />
                )}
              </div>
              <div>
                <span
                  className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    result.status === 'Valid' || result.status === 'Issued' || result.status === 'Accepted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  STATUS: {result.status?.toUpperCase()}
                </span>
                <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
                  Officially Verified Credential
                </h3>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">{result.documentId}</div>
              <div className="text-emerald-600 font-semibold">Digital Hash Verified &bull; 100% Genuine</div>
            </div>
          </div>

          {/* Credential Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Document Type</span>
                <span className="font-bold text-slate-900 text-base">{result.documentType}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Recipient / Student Name</span>
                <span className="font-bold text-sky-800 text-lg">{result.studentName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Institution / College</span>
                <span className="font-semibold text-slate-700">{result.collegeName || 'AAGAM Partner Institute'}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Program / Position</span>
                <span className="font-bold text-slate-900 text-base">{result.programTitle}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Tenure / Duration</span>
                <span className="font-semibold text-slate-700">{result.duration || '3 Months'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Issue / Active Date</span>
                <span className="font-semibold text-slate-700">{result.issueDate || result.startDate || 'Official Record'}</span>
              </div>
            </div>
          </div>

          {/* Direct CTA if Offer Letter */}
          {result.documentType?.includes('Offer Letter') && result.acceptUrl && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-purple-900 text-sm">Accept This Offer Letter</div>
                <div className="text-xs text-purple-700">You can complete your onboarding and payment directly.</div>
              </div>
              <a
                href={result.acceptUrl}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Accept Offer &rarr;
              </a>
            </div>
          )}

          {/* Signatories & Security Assurance */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Authorized Signatories: <b className="text-slate-800">{result.signatories || 'Ayush Raj (CEO) & Akash Verma (HR)'}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Registered on AAGAM Digital Technology Global Ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* Not Found State */}
      {notFoundMessage && (
        <div className="bg-rose-50 border-2 border-rose-300 p-8 rounded-3xl text-center space-y-3 animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-xl text-rose-900">Document or Application Lookup Unsuccessful</h3>
          <p className="text-sm text-rose-700 max-w-md mx-auto">{notFoundMessage}</p>
          <div className="text-xs text-slate-500 pt-2">
            Please check the application or document ID for any typo, or contact AAGAM HR at{' '}
            <a href="mailto:akashvermaofficialblogs@gmail.com" className="font-semibold underline">
              akashvermaofficialblogs@gmail.com
            </a>{' '}
            / Phone: <span className="font-bold text-slate-700">+91 9693335499</span>.
          </div>
        </div>
      )}
    </div>
  );
};

