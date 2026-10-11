import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  FileText,
  Users,
  Award,
  BookOpen,
} from 'lucide-react';
import { Internship } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface InternshipDetailPageProps {
  slug: string;
  setCurrentView: (view: string) => void;
  openApplyModal: (internship: Internship) => void;
  openAuthModal: () => void;
}

export const InternshipDetailPage: React.FC<InternshipDetailPageProps> = ({
  slug,
  setCurrentView,
  openApplyModal,
  openAuthModal,
}) => {
  const { isAuthenticated, toast } = useAuth();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const targetSlug = slug || new URLSearchParams(window.location.search).get('slug') || '';
        if (!targetSlug) {
          setLoading(false);
          return;
        }
        const res = await api.getInternship(targetSlug);
        if (res.success) {
          setInternship(res.internship);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return <div className="py-24 text-center text-slate-500 text-sm">Loading internship details...</div>;
  }

  if (!internship) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Internship Not Found</h2>
        <button
          onClick={() => setCurrentView('internships')}
          className="px-6 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-semibold"
        >
          Back to Programs
        </button>
      </div>
    );
  }

  const handleApply = () => {
    if (internship) {
      openApplyModal(internship);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <button
        onClick={() => setCurrentView('internships')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Internships
      </button>

      {/* Main Detail Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold uppercase tracking-wider">
              {internship.department}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              Mode: {internship.mode}
            </span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            {internship.title}
          </h1>

          <div className="text-sm font-semibold text-amber-400">
            Primary Stack: {internship.technology}
          </div>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {internship.full_description || internship.description}
          </p>

          {/* Quick Metrics */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Duration:</span>
              <span className="font-bold text-white text-sm">{internship.duration}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Start Date:</span>
              <span className="font-bold text-white text-sm">{internship.start_date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Deadline:</span>
              <span className="font-bold text-amber-400 text-sm">{internship.application_deadline}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Seats Available:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {internship.total_seats - internship.filled_seats} Seats Open
              </span>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-6">
            <button
              onClick={handleApply}
              className="px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-base rounded-xl shadow-xl shadow-sky-600/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>Apply for Internship</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Program Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Eligibility, Skills, Guidelines */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-xl text-slate-900">Eligibility & Target Candidates</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{internship.eligibility}</p>

            <h4 className="font-heading font-bold text-base text-slate-900 pt-3">Required Technical Competencies</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{internship.skills_required}</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-xl text-slate-900">Internship Milestones & Deliverables</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Phase 1: Architecture & Foundations</span>
                  <p className="text-xs text-slate-500">Mentored code sessions, repository initialization, and environment setup.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Phase 2: Full-Stack Core Development</span>
                  <p className="text-xs text-slate-500">Implementing core API microservices, database schemas, and modern responsive UI components.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Phase 3: Production Deployment & Code Review</span>
                  <p className="text-xs text-slate-500">Live cloud deployment, unit testing, staff code review, and final evaluation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Required Documents & HR Contact */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900">Required Application Documents</h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {Array.isArray(internship.required_documents) &&
                internship.required_documents.map((doc: string) => (
                  <li key={doc} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="font-semibold">{doc === 'NOC' ? 'College NOC Certificate' : doc === 'College_ID' ? 'College Student ID Card' : doc}</span>
                  </li>
                ))}
            </ul>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Our system includes intelligent OCR to auto-extract and verify student data from your uploaded NOC.
            </p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-3 text-xs">
            <div className="font-bold uppercase tracking-wider text-slate-400">Admissions & HR Desk</div>
            <div className="font-bold text-sm text-white">Akash Verma</div>
            <div className="text-slate-300">Head of Talent & Engineering Mentorship</div>
            <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-400">
              <div>Phone: <a href="tel:9693335499" className="text-amber-400 font-semibold hover:underline">9693335499</a></div>
              <div>Email: <span className="text-slate-300">akashvermaofficialblogs@gmail.com</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
