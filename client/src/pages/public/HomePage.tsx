import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  Users,
  Briefcase,
  BookOpen,
  Code2,
  Clock,
  TrendingUp,
  MapPin,
  ChevronRight,
  ExternalLink,
  Laptop,
  Check,
  Send,
  Phone,
  Mail,
  Calendar,
  Layers,
  GraduationCap,
  FileText,
  X,
  Flame,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { Internship, Batch } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface HomePageProps {
  setCurrentView: (view: string, params?: Record<string, string>) => void;
  openApplyModal: (internship: Internship | any) => void;
  openAuthModal: () => void;
  setSelectedInternshipSlug: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setCurrentView,
  openApplyModal,
  openAuthModal,
  setSelectedInternshipSlug,
}) => {
  const { toast } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedBatchForCurriculum, setSelectedBatchForCurriculum] = useState<Batch | null>(null);

  // Quick enquiry form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSending, setContactSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchRes, intRes] = await Promise.all([
          api.getPublicBatches(),
          api.getInternships(),
        ]);
        if (batchRes.success && Array.isArray(batchRes.batches)) {
          setBatches(batchRes.batches);
        }
        if (intRes.success && Array.isArray(intRes.internships)) {
          setInternships(intRes.internships);
        }
      } catch (e) {
        console.error('Home load error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApplyClick = (internship: Internship) => {
    openApplyModal(internship);
  };

  const handleApplyBatch = (batch: Batch) => {
    openApplyModal({
      id: batch.id,
      slug: batch.batch_code.toLowerCase(),
      title: batch.title,
      department: batch.department,
      technology: batch.department,
      description: `Official Cohort Sprint (${batch.batch_code}) under lead instructor ${batch.instructor_name}. Scheduled from ${batch.start_date} to ${batch.end_date}.`,
      full_description: `Batch Code: ${batch.batch_code}\nInstructor: ${batch.instructor_name}\nTimeline: ${batch.start_date} to ${batch.end_date} (${batch.duration_weeks} Weeks)\nCurriculum Modules: ${batch.modules?.length || 0}`,
      duration: `${batch.duration_weeks} Weeks`,
      eligibility: 'Open to B.Tech, BCA, MCA, B.Sc & M.Sc Students',
      skills_required: batch.department,
      mode: 'Remote',
      location: 'Online Live & Structured Sprints',
      start_date: batch.start_date,
      application_deadline: batch.start_date,
      total_seats: batch.max_seats,
      filled_seats: batch.enrolled_count || 0,
      fee_amount: 0,
      is_paid: 0,
      required_documents: ['NOC', 'College_ID', 'Resume'],
      ocr_enabled: 1,
      status: 'Active',
      created_at: batch.created_at,
      batch_code: batch.batch_code,
      batch_id: batch.id,
    } as any);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    try {
      await api.submitContact({
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        message: contactMsg,
      });
      toast('Your inquiry has been submitted. Our admissions team will reach out shortly.', 'success');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMsg('');
    } catch (e) {
      toast('Failed to submit enquiry. You can chat directly on WhatsApp at 7079823919.', 'error');
    } finally {
      setContactSending(false);
    }
  };

  const filteredInternships =
    selectedDept === 'All'
      ? internships
      : internships.filter((i) => i.department.toLowerCase().includes(selectedDept.toLowerCase()));

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen space-y-28 pb-24 selection:bg-sky-500 selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-slate-900">
        {/* Ambient atmospheric gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-sky-500/15 via-blue-600/10 to-transparent blur-[140px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-7">
            {/* Top Brand Tag & Live Status */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-white font-bold">AAGAM Digital Technology</span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-400">Admissions Open 2026</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-mono">48-Hr Review SLA</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.1]">
              Production-Grade Software. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-400">
                Verifiable Engineering Careers.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Industry-structured cohorts, weekly progressive curriculum unlocking, university NOC compliance, and verifiable digital credentials engineered for modern technologists.
            </p>

            {/* Main CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="#cohorts-section"
                className="px-8 py-4 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-sky-600/30 hover:shadow-sky-500/50 transition-all transform hover:-translate-y-0.5 flex items-center gap-2.5"
              >
                <span>Explore Active Cohorts</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => {
                  setCurrentView('internships');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-7 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-sky-400" />
                <span>All Internship Tracks</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('verify');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-4 bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 border border-amber-500/30 font-semibold text-xs sm:text-sm rounded-2xl transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Verify Credentials</span>
              </button>
            </div>

            {/* Core Value Pillars Grid */}
            <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-sm hover:border-sky-500/40 transition-colors">
                <ShieldCheck className="w-5 h-5 text-sky-400 mb-2" />
                <div className="text-sm font-bold text-white">NOC Compliant</div>
                <div className="text-xs text-slate-400 mt-0.5">AICTE & UGC College Credits</div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-sm hover:border-amber-500/40 transition-colors">
                <Clock className="w-5 h-5 text-amber-400 mb-2" />
                <div className="text-sm font-bold text-white">48-Hr Review</div>
                <div className="text-xs text-slate-400 mt-0.5">Swift technical evaluation</div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
                <Layers className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="text-sm font-bold text-white">Weekly Unlocking</div>
                <div className="text-xs text-slate-400 mt-0.5">Sprint-by-sprint structured modules</div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
                <Award className="w-5 h-5 text-purple-400 mb-2" />
                <div className="text-sm font-bold text-white">QR Verifiable</div>
                <div className="text-xs text-slate-400 mt-0.5">Tamper-proof Certificate & LOR</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ACTIVE COHORT BATCHES (CORE FEATURE) */}
      <section id="cohorts-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Active Enrollment Cohorts
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-white">
              Scheduled Engineering Batches
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Each cohort follows a mandatory weekly curriculum. Modules unlock sequentially each week to ensure solid conceptual and practical foundation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              {batches.length} Live {batches.length === 1 ? 'Cohort' : 'Cohorts'} Scheduled
            </span>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white">
              Upcoming Cohorts Under Scheduling
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Faculty mentors are currently scheduling upcoming engineering tracks. Pre-register below or reach out via WhatsApp at <span className="text-amber-400 font-mono">+91 7079823919</span>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => {
              const enrolled = batch.enrolled_count || 0;
              const seatsLeft = batch.seats_left !== undefined ? batch.seats_left : Math.max(0, batch.max_seats - enrolled);
              const percentFilled = Math.min(100, Math.round((enrolled / batch.max_seats) * 100));

              return (
                <div
                  key={batch.id}
                  className="bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-sky-500/50 p-6 shadow-xl hover:shadow-2xl hover:shadow-sky-500/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle corner highlight */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="space-y-4 relative z-10">
                    {/* Header Badge Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black px-3 py-1 rounded-full bg-slate-950 text-amber-400 border border-amber-500/30">
                        {batch.batch_code}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Admissions Open
                      </span>
                    </div>

                    {/* Title & Program Type */}
                    <div>
                      <h3 className="font-heading font-bold text-xl text-white group-hover:text-sky-400 transition-colors line-clamp-2">
                        {batch.title}
                      </h3>
                      <div className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-2">
                        <span>{batch.department}</span>
                        <span>•</span>
                        <span className="text-sky-400 font-bold">{batch.program_type || 'Internship'}</span>
                      </div>
                    </div>

                    {/* Timeline, Duration & Instructor info */}
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 font-medium text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          <span>Timeline:</span>
                        </span>
                        <span className="font-bold text-white font-mono text-[11px]">
                          {batch.start_date} ➔ {batch.end_date}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 font-medium text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Duration:</span>
                        </span>
                        <span className="font-bold text-white">
                          {batch.duration_weeks} Weeks (Sequential)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 font-medium text-slate-400">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Lead Mentor:</span>
                        </span>
                        <span className="font-bold text-white truncate max-w-[140px]">
                          {batch.instructor_name}
                        </span>
                      </div>
                    </div>

                    {/* Modules Syllabus Preview */}
                    {Array.isArray(batch.modules) && batch.modules.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                          <span>Weekly Syllabus ({batch.modules.length} Modules):</span>
                          <button
                            type="button"
                            onClick={() => setSelectedBatchForCurriculum(batch)}
                            className="text-sky-400 hover:text-sky-300 text-[11px] font-semibold hover:underline"
                          >
                            View Breakdown
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {batch.modules.slice(0, 3).map((m, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 truncate max-w-[190px]"
                            >
                              M{m.module_number || idx + 1}: {m.title}
                            </span>
                          ))}
                          {batch.modules.length > 3 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800">
                              +{batch.modules.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Live Seats Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-400">Capacity Status</span>
                        <span className={`font-bold ${seatsLeft <= 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {seatsLeft} Seats Left ({enrolled}/{batch.max_seats})
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            percentFilled >= 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-500 to-emerald-400'
                          }`}
                          style={{ width: `${Math.max(6, percentFilled)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 mt-5 border-t border-slate-800/80 grid grid-cols-2 gap-3 relative z-10">
                    <button
                      type="button"
                      onClick={() => setSelectedBatchForCurriculum(batch)}
                      className="py-2.5 px-3 text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700 rounded-xl border border-slate-750 transition-colors text-center flex items-center justify-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Curriculum</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBatch(batch)}
                      className="py-2.5 px-3 text-xs font-extrabold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-xl shadow-md shadow-sky-600/30 transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <span>Register Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. SPECIALIZATION ENGINEERING TRACKS (INTERNSHIPS) */}
      {internships.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-900 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2 border border-sky-500/20">
                Specialization Catalog
              </div>
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-white">
                Industrial Internship Domains
              </h2>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                Choose your domain, upload college NOC, work on production architectures, and receive accredited evaluation.
              </p>
            </div>

            <button
              onClick={() => {
                setCurrentView('internships');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-sky-400 hover:text-sky-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 self-start md:self-end hover:underline"
            >
              <span>View All Internship Listings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Software Engineering', 'Data & AI', 'Infrastructure', 'Security'].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedDept === dept
                    ? 'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/20'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Internship Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-sky-500/40 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800/80">
                      {item.department}
                    </span>
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {item.mode}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-lg text-white group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-xs font-medium text-amber-400 mt-1">
                      Stack: {item.technology}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Duration:</span>
                      <span className="font-semibold text-slate-200">{item.duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Available Seats:</span>
                      <span className="font-semibold text-emerald-400">
                        {Math.max(0, item.total_seats - item.filled_seats)} Open
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">Prerequisites: </span>
                    {Array.isArray(item.required_documents) ? item.required_documents.join(', ') : 'NOC, Resume'}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedInternshipSlug(item.slug);
                      setCurrentView('internship-detail', { slug: item.slug });
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-750 transition-colors text-center"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleApplyClick(item)}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-600/20 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. THE 4-STAGE ENGINEERING LIFECYCLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/80 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-wider border border-sky-500/20">
              Clear Transparent Journey
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-white">
              The 4-Stage Student Lifecycle
            </h2>
            <p className="text-slate-400 text-sm">
              From application and institutional sign-off to weekly module unlocks and QR verifiable graduation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 relative hover:border-sky-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 font-black text-base flex items-center justify-center font-mono">
                01
              </div>
              <h3 className="font-heading font-bold text-base text-white">
                Application & NOC
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit academic profile, upload college NOC / ID card, complete OTP email verification, and receive your Registration ID.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 relative hover:border-amber-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-base flex items-center justify-center font-mono">
                02
              </div>
              <h3 className="font-heading font-bold text-base text-white">
                48-Hr Review & Offer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Technical review committee assesses your eligibility. Selected applicants receive an official digital Offer Letter with unique Offer ID.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 relative hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center font-mono">
                03
              </div>
              <h3 className="font-heading font-bold text-base text-white">
                WhatsApp & Auto-Enroll
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirm acceptance via WhatsApp desk (7079823919), receive login ID & password, and get auto-enrolled with weekly module unlocking.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 relative hover:border-purple-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-black text-base flex items-center justify-center font-mono">
                04
              </div>
              <h3 className="font-heading font-bold text-base text-white">
                Graduation & Verifiable QR
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete assignments, defend capstone project, and receive an authentic Certificate of Completion + LOR with tamper-proof QR code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRAINING MASTERCLASSES & PLACEMENT ACCELERATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Practical Training Box */}
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 hover:border-sky-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                Practical Training
              </span>
              <BookOpen className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-2xl text-white">
                Full Stack & AI Masterclasses
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Live interactive evening and weekend sprints covering TypeScript, React 19, Node.js Microservices, GenAI RAG Workflows, and Cloud Deployment.
              </p>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hands-on weekly assignments pushed directly to GitHub</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Industry mentors conducting 1-on-1 code reviews and architecture walkthroughs</span>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentView('training');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <span>Explore Training Curriculum</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Placement Drives Box */}
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                Recruitment Accelerator
              </span>
              <Briefcase className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-2xl text-white">
                Placement & Hiring Drives
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Direct hiring pipelines for top-performing interns and training graduates with leading software firms and high-growth technology startups.
              </p>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Salary packages ranging from ₹4.5 LPA to ₹8.5 LPA</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rigorous mock technical interviews, DSA rounds, and resume revamps</span>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentView('placement');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <span>View Placement Drives</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. INSTANT DOCUMENT AUTHENTICITY BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" /> Universal QR Ledger
            </div>
            <h2 className="font-heading font-black text-3xl text-white">
              Instant Document Authenticity Verification
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Universities, background verification officers, and candidates can verify any official Offer Letter, Letter of Recommendation, or Certificate using our cryptographic ledger.
            </p>
            <div className="text-xs text-slate-400 font-mono">
              Format: AAGAM-OFFER-2026-XXXXXX / AAGAM-CERT-2026-XXXXXX
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentView('verify');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <ShieldCheck className="w-5 h-5 text-slate-950" />
            <span>Verify Document Now</span>
          </button>
        </div>
      </section>

      {/* 7. LEADERSHIP SPOTLIGHT & CORPORATE CONTACT DESK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-slate-900/70 rounded-3xl border border-slate-800 p-8 sm:p-12 shadow-2xl">
          {/* Company & Leadership Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-wider border border-sky-500/20">
              Corporate Office & Leadership
            </div>

            <div>
              <h2 className="font-heading font-black text-3xl text-white">
                AAGAM Digital Technology
              </h2>
              <div className="text-xs text-amber-400 font-mono font-bold uppercase tracking-widest mt-1">
                Learn • Build • Innovate
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering technology students across India with real-world engineering rigor, college credit NOC integrations, and certified industrial exposure.
            </p>

            {/* Leadership Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850">
                <div className="text-sm font-bold text-white">Ayush Raj</div>
                <div className="text-[11px] text-sky-400 font-semibold">Chief Executive Officer</div>
                <div className="text-[10px] text-slate-500 mt-1">Product vision & enterprise architecture.</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850">
                <div className="text-sm font-bold text-white">Akash Verma</div>
                <div className="text-[11px] text-amber-400 font-semibold">Head of HR & Talent</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Direct Line: <a href="tel:9693335499" className="text-slate-300 font-bold hover:underline">9693335499</a>
                </div>
              </div>
            </div>

            {/* Official Contact Lines with WhatsApp */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
              {/* Primary WhatsApp Action */}
              <a
                href="https://wa.me/917079823919?text=Hello%20AAGAM%20Team%2C%20I%20have%20an%20inquiry%20regarding%20internships%20and%20batches."
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    WhatsApp Admissions Desk (Instant)
                  </div>
                  <div className="font-mono font-bold text-white text-sm">+91 7079823919</div>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-850">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">HR Direct Telephone</div>
                  <a href="tel:9693335499" className="font-bold text-white hover:underline">
                    9693335499 / 7667204026
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-850">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Corporate Email</div>
                  <a href="mailto:AAGAMDigitaltech@gmail.com" className="font-bold text-white hover:underline">
                    AAGAMDigitaltech@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Inquiry Form */}
          <div className="lg:col-span-7 bg-slate-950/80 p-6 sm:p-8 rounded-3xl border border-slate-850">
            <h3 className="font-heading font-bold text-xl text-white mb-1">
              Admissions & Institutional Inquiry
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Inquire about current batch admissions, university NOC sign-offs, or training schedules.
            </p>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile / WhatsApp Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 7079823919"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Inquiry Details *</label>
                <textarea
                  rows={4}
                  required
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Tell us about your engineering course, university, or desired cohort track..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={contactSending}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {contactSending ? 'Submitting Inquiry...' : 'Submit Admissions Inquiry'}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CURRICULUM PREVIEW MODAL */}
      {selectedBatchForCurriculum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    {selectedBatchForCurriculum.batch_code}
                  </span>
                  <span className="text-xs text-sky-400 font-bold">
                    {selectedBatchForCurriculum.duration_weeks} Weeks • {selectedBatchForCurriculum.department}
                  </span>
                </div>
                <h2 className="font-heading font-black text-xl text-white">
                  {selectedBatchForCurriculum.title}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Mentor: {selectedBatchForCurriculum.instructor_name}</span>
                  <span>•</span>
                  <span>Timeline: {selectedBatchForCurriculum.start_date} to {selectedBatchForCurriculum.end_date}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBatchForCurriculum(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modules List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Weekly Sequential Syllabus Breakdown
              </div>

              {Array.isArray(selectedBatchForCurriculum.modules) && selectedBatchForCurriculum.modules.length > 0 ? (
                selectedBatchForCurriculum.modules.map((mod, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 font-heading font-bold text-sm text-white">
                        <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center font-mono">
                          {mod.module_number || i + 1}
                        </span>
                        <span>{mod.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Week {mod.module_number || i + 1}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {mod.description}
                    </p>

                    {mod.task_assignment && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                        <Code2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Weekly Capstone Task: </span>
                          <span>{mod.task_assignment}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Comprehensive syllabus modules are scheduled weekly by faculty mentors.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedBatchForCurriculum(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = selectedBatchForCurriculum;
                  setSelectedBatchForCurriculum(null);
                  handleApplyBatch(target);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2"
              >
                <span>Register for this Cohort</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
