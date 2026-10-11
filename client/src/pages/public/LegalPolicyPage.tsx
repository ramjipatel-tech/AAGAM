import React, { useState } from 'react';
import { Shield, Lock, FileText, RefreshCw, AlertCircle } from 'lucide-react';

interface LegalPolicyPageProps {
  initialTab?: 'terms' | 'privacy' | 'refund' | 'disclaimer';
}

export const LegalPolicyPage: React.FC<LegalPolicyPageProps> = ({ initialTab = 'terms' }) => {
  const [tab, setTab] = useState<'terms' | 'privacy' | 'refund' | 'disclaimer'>(initialTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
          Legal & Compliance
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900">
          Governance & Policies
        </h1>
        <p className="text-slate-600 text-sm">
          AAGAM Digital Technology operates under transparent corporate policies regarding admissions, data privacy, payments, and document validation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-2xl mx-auto text-xs font-bold">
        <button
          onClick={() => setTab('terms')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            tab === 'terms' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Terms & Conditions
        </button>
        <button
          onClick={() => setTab('privacy')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            tab === 'privacy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setTab('refund')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            tab === 'refund' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Refund & Cancellation
        </button>
        <button
          onClick={() => setTab('disclaimer')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            tab === 'disclaimer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Disclaimer & Cookies
        </button>
      </div>

      {/* Policy Content Body */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-slate-700 text-sm leading-relaxed space-y-6">
        {tab === 'terms' && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-2xl text-slate-900">Terms & Conditions of Service</h2>
            <p>Last updated: October 2026</p>
            <p>
              1. <b>Admissions & Eligibility:</b> Enrollment in AAGAM Digital Technology internship and training programs is subject to academic document verification, including college No Objection Certificates (NOC) and identity validation.
            </p>
            <p>
              2. <b>Code of Conduct:</b> All candidates must maintain professional integrity during project work, refrain from unauthorized distribution of proprietary code, and complete assigned deliverables before official certification.
            </p>
            <p>
              3. <b>Document Authenticity:</b> All official Offer Letters, Letters of Recommendation (LOR), and Certificates of Completion issued by AAGAM Digital Technology carry unique digital identifiers registered in our server database. Any tampering will result in immediate revocation.
            </p>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-2xl text-slate-900">Privacy Policy</h2>
            <p>
              AAGAM Digital Technology respects your privacy. We collect personal information (including student name, email, phone, college records, and uploaded NOC documents) strictly for admissions, mentor assignment, and official credential generation.
            </p>
            <p>
              Uploaded academic documents are stored in secure private storage and are accessible only to authorized reviewers and administrators. We do not sell or rent personal information to third parties.
            </p>
          </div>
        )}

        {tab === 'refund' && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-2xl text-slate-900">Refund & Cancellation Policy</h2>
            <p>
              1. <b>Transparent Pricing:</b> AAGAM Digital Technology provides both free performance-based internships and specialized paid engineering bootcamps. All payable amounts are configured transparently with no hidden fees.
            </p>
            <p>
              2. <b>Cancellation Window:</b> Students may request cancellation within 48 hours of payment verification if portal access has not been activated. Approved refunds will be processed via Razorpay within 5-7 business days.
            </p>
          </div>
        )}

        {tab === 'disclaimer' && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-2xl text-slate-900">Disclaimer & Cookie Policy</h2>
            <p>
              The materials and credentials provided by AAGAM Digital Technology are for technical skill acceleration and corporate training. We use essential cookies to maintain secure authenticated sessions and protect payment states.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
