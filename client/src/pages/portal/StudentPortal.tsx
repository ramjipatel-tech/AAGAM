import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Award,
  CheckCircle2,
  Clock,
  Briefcase,
  BookOpen,
  CreditCard,
  Bell,
  User as UserIcon,
  LogOut,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  AlertTriangle,
  Lock,
  Sparkles,
  GitBranch,
  X,
  PlayCircle,
  FileDown,
  CheckSquare,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  InternshipApplication,
  OfferLetter,
  PaymentRecord,
  ProjectAssignment,
  Certificate,
  LetterOfRecommendation,
} from '../../types';
import { CertificateViewer } from '../../components/documents/CertificateViewer';
import { OfferLetterViewer } from '../../components/documents/OfferLetterViewer';
import { LorViewer } from '../../components/documents/LorViewer';
import { PaymentModal } from '../../components/modals/PaymentModal';

export const StudentPortal: React.FC = () => {
  const { user, logout, toast } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'batches' | 'applications' | 'offers' | 'projects' | 'documents' | 'payments' | 'profile'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [projects, setProjects] = useState<ProjectAssignment[]>([]);
  const [documents, setDocuments] = useState<{
    offers: OfferLetter[];
    lors: LetterOfRecommendation[];
    certificates: Certificate[];
    payments?: PaymentRecord[];
  }>({ offers: [], lors: [], certificates: [] });

  // Selected document for preview
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferLetter | null>(null);
  const [selectedLor, setSelectedLor] = useState<LetterOfRecommendation | null>(null);

  // Active batch module task state
  const [selectedModuleTask, setSelectedModuleTask] = useState<{ batchId: string; moduleId: string; moduleTitle: string } | null>(null);
  const [taskSubmissionText, setTaskSubmissionText] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  // Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeOrderData, setActiveOrderData] = useState<any>(null);

  // Project Submission form
  const [submittingProject, setSubmittingProject] = useState<ProjectAssignment | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [docText, setDocText] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadAllStudentData = async () => {
    setLoading(true);
    try {
      const [overviewRes, batchRes, appRes, offerRes, payRes, projRes, docRes] = await Promise.all([
        api.getStudentOverview(),
        api.getStudentBatches(),
        api.getStudentApplications(),
        api.getMyOffers(),
        api.getMyPayments(),
        api.getMyProjects(),
        api.getStudentDocuments(),
      ]);

      if (overviewRes.success) setDashboardData(overviewRes.data);
      if (batchRes.success) setBatches(batchRes.batches);
      if (appRes.success) setApplications(appRes.applications);
      if (offerRes.success) setOffers(offerRes.offers);
      if (payRes.success) setPayments(payRes.payments);
      if (projRes.success) setProjects(projRes.projects);
      if (docRes.success && docRes.documents) setDocuments(docRes.documents);
    } catch (err) {
      console.error('Failed to load student portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllStudentData();
  }, []);

  const handleAcceptOffer = async (offer: OfferLetter) => {
    try {
      const res = await api.acceptOffer(offer.offer_id);
      if (res.success) {
        if (res.isPaymentRequired && res.order) {
          setActiveOrderData(res.order);
          setPaymentModalOpen(true);
        } else {
          toast('Offer accepted successfully! Your workspace has been queued.', 'success');
          loadAllStudentData();
        }
      }
    } catch (err: any) {
      toast(err.message || 'Failed to accept offer.', 'error');
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    toast('Payment verified! Workspace active.', 'success');
    loadAllStudentData();
  };

  const handleCompleteModule = async (batchId: string, moduleId: string) => {
    try {
      const res = await api.completeStudentModule(batchId, {
        moduleId,
        taskSubmission: taskSubmissionText || 'Module review & practical exercises completed.',
        quizScore: 100,
      });

      if (res.success) {
        toast(res.message || 'Module marked as completed!', 'success');
        setSelectedModuleTask(null);
        setTaskSubmissionText('');
        loadAllStudentData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update module progress.', 'error');
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingProject) return;
    setSubmitLoading(true);

    try {
      const res = await api.submitProject({
        assignment_id: submittingProject.assignment_id,
        github_url: githubUrl,
        live_demo_url: liveDemoUrl,
        documentation_text: docText,
        student_notes: studentNotes,
      });

      if (res.success) {
        toast('Project code & documentation submitted for mentor review!', 'success');
        setSubmittingProject(null);
        setGithubUrl('');
        setLiveDemoUrl('');
        setDocText('');
        setStudentNotes('');
        loadAllStudentData();
      }
    } catch (err: any) {
      toast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const primaryBatch = batches.length > 0 ? batches[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-sky-500 to-amber-500">
              <img
                src="/aagam-logo.jpg"
                alt="Logo"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div className="truncate">
              <div className="font-heading font-bold text-sm text-white truncate">
                {user?.full_name || 'Engineering Student'}
              </div>
              <div className="text-[10px] text-sky-400 font-mono">
                {user?.email}
              </div>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'overview'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Student Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('batches')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'batches'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Learning & Modules</span>
              {primaryBatch && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] text-amber-300 font-bold">
                  {primaryBatch.progress_percent || 0}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'applications'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Applications Tracker</span>
              {applications.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  {applications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'offers'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Offer Letters</span>
              {offers.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] text-amber-300">
                  {offers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'projects'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GitBranch className="w-4 h-4 text-sky-400" />
              <span>Projects & Code</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'documents'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certificates & LORs</span>
              {((documents.certificates?.length || 0) + (documents.lors?.length || 0)) > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300 font-bold">
                  {(documents.certificates?.length || 0) + (documents.lors?.length || 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'payments'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Invoices</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'profile'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile & Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 bg-slate-950 rounded-xl text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-200">AAGAM Support & Mentorship</div>
            <div>Helpline: +91 9693335499</div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-8">
        {/* VIEW 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                  Welcome back, {user?.full_name}!
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  AAGAM Student Engineering Portal • "Learn • Build • Innovate"
                </p>
              </div>

              {primaryBatch && (
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Active Cohort</div>
                    <div className="text-xs font-bold text-white">{primaryBatch.batch_title}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-slate-400 text-xs font-medium">Curriculum Progress</div>
                <div className="text-2xl font-heading font-extrabold text-white mt-1">
                  {primaryBatch ? `${primaryBatch.progress_percent || 0}%` : '0%'}
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">Live Module Tracking</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-slate-400 text-xs font-medium">Offer Letters</div>
                <div className="text-2xl font-heading font-extrabold text-amber-400 mt-1">
                  {offers.length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Official Appointments</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-slate-400 text-xs font-medium">Certificates Conferred</div>
                <div className="text-2xl font-heading font-extrabold text-emerald-400 mt-1">
                  {documents.certificates?.length || 0}
                </div>
                <div className="text-[10px] text-emerald-500 mt-1">QR Verified Ledger</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-slate-400 text-xs font-medium">Letters of Rec. (LOR)</div>
                <div className="text-2xl font-heading font-extrabold text-sky-400 mt-1">
                  {documents.lors?.length || 0}
                </div>
                <div className="text-[10px] text-sky-400 mt-1">Executive Signed</div>
              </div>
            </div>

            {/* Active Learning Banner */}
            {primaryBatch && (
              <div className="p-6 bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border border-sky-500/40 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300 bg-sky-900/60 px-2.5 py-0.5 rounded-full border border-sky-700">
                      Enrolled Batch: {primaryBatch.batch_code}
                    </span>
                    <h3 className="font-heading font-bold text-xl text-white">
                      {primaryBatch.batch_title}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Duration: {primaryBatch.duration_weeks} Weeks ({primaryBatch.start_date} to {primaryBatch.end_date}) • Faculty: {primaryBatch.instructor_name}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('batches')}
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all shrink-0 flex items-center gap-2"
                  >
                    <span>Open Learning Modules</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Cohort Completion Progress</span>
                    <span className="text-sky-400 font-bold">{primaryBatch.progress_percent || 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${primaryBatch.progress_percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LEARNING & MODULES (BATCHES) */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                  Interactive Learning Workspace
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Access lectures, download PDF notes, complete sprint tasks, and earn your credentials.
                </p>
              </div>
            </div>

            {batches.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs bg-slate-900 rounded-3xl border border-slate-800">
                No active cohorts found. Accept your offer letter to unlock curriculum workspace.
              </div>
            ) : (
              batches.map((b) => (
                <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  {/* Cohort Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                          {b.batch_code}
                        </span>
                        <span className="text-xs text-slate-400">
                          {b.duration_weeks} Weeks • {b.start_date} to {b.end_date}
                        </span>
                      </div>
                      <h2 className="font-heading font-extrabold text-2xl text-white mt-1.5">
                        {b.batch_title}
                      </h2>
                      <div className="text-xs text-slate-400 mt-1">
                        Assigned Faculty: <strong className="text-slate-200">{b.instructor_name}</strong> ({b.instructor_email})
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-xs text-slate-400">Completion Status</div>
                      <div className="text-2xl font-black font-heading text-emerald-400">
                        {b.progress_percent || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Celebration if 100% */}
                  {b.progress_percent === 100 && (
                    <div className="p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500 rounded-2xl text-center space-y-2">
                      <div className="text-emerald-400 font-bold text-base flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>All Curriculum Modules Completed!</span>
                      </div>
                      <p className="text-xs text-slate-300 max-w-lg mx-auto">
                        Your completion has been reported to the Academic Evaluation Committee. Your official verifiable QR Certificate and Letter of Recommendation (LOR) are ready under the "Certificates & LORs" tab.
                      </p>
                    </div>
                  )}

                  {/* Curriculum Modules List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Curriculum Roadmap & Weekly Sprints:
                      </h3>
                      {b.admin_unlocked ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⚡ Admin Fast-Track: All Modules Unlocked
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-sky-400 font-semibold">
                          Current Progress: Week {b.current_week || 1}
                        </span>
                      )}
                    </div>

                    {b.curriculum_modules && b.curriculum_modules.length > 0 ? (
                      b.curriculum_modules.map((mod: any, idx: number) => {
                        const isCompleted = mod.is_completed ?? (b.completed_modules || []).includes(mod.id);
                        const isUnlocked = mod.is_unlocked ?? true;

                        return (
                          <div
                            key={mod.id || idx}
                            className={`p-5 rounded-2xl border transition-all ${
                              isCompleted
                                ? 'bg-emerald-950/20 border-emerald-500/40'
                                : isUnlocked
                                ? 'bg-slate-950/80 border-slate-800 hover:border-sky-500/40'
                                : 'bg-slate-950/40 border-slate-900 opacity-75'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      isCompleted
                                        ? 'bg-emerald-500 text-slate-950'
                                        : isUnlocked
                                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                        : 'bg-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {mod.module_no || idx + 1}
                                  </span>
                                  <h4 className="font-bold text-base text-white">{mod.title}</h4>
                                  {isCompleted && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                                      Completed
                                    </span>
                                  )}
                                  {!isUnlocked && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1">
                                      <Lock className="w-3 h-3" />
                                      Week {mod.week || mod.module_no || idx + 1} ({mod.days_until_unlock || 7}d left)
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 pl-8">{mod.description}</p>
                              </div>

                              <button
                                onClick={() => isUnlocked && handleCompleteModule(b.batch_id || b.id, mod.id)}
                                disabled={!isUnlocked || isCompleted}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                                  isCompleted
                                    ? 'bg-emerald-900/60 text-emerald-300 cursor-default'
                                    : isUnlocked
                                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-md'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                                }`}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Marked Completed</span>
                                  </>
                                ) : isUnlocked ? (
                                  <>
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    <span>Complete Module</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Unlocks in Week {mod.week || mod.module_no || idx + 1}</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Lectures & Materials Row */}
                            {isUnlocked && mod.lectures && mod.lectures.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-slate-800/80 pl-8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {mod.lectures.map((lec: any, lIdx: number) => (
                                  <div key={lIdx} className="flex items-center gap-2 text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                                    {lec.type === 'pdf' ? (
                                      <FileDown className="w-4 h-4 text-rose-400 shrink-0" />
                                    ) : (
                                      <PlayCircle className="w-4 h-4 text-sky-400 shrink-0" />
                                    )}
                                    <span className="truncate">{lec.title}</span>
                                    {lec.duration_mins && (
                                      <span className="ml-auto text-[10px] text-slate-500 font-mono">
                                        {lec.duration_mins}m
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-500 py-4">Curriculum modules are being uploaded by faculty.</div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW 3: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                Internship Applications Tracker
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Complete status history, uploaded references, and review feedback.
              </p>
            </div>

            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-900 rounded-3xl border border-slate-800">
                  No applications submitted yet.
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">{app.course}</span>
                        <h3 className="font-heading font-bold text-xl text-white mt-0.5">{app.internship_title}</h3>
                        <div className="text-xs text-slate-400 font-mono mt-1">Registration No: {app.application_no}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            app.status === 'Selected' || app.status === 'Offer Generated' || app.status === 'Offer Accepted'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Submitted On:</span>
                        <span className="font-bold text-white">{app.submitted_at?.split('T')[0]}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">College:</span>
                        <span className="font-bold text-white truncate block">{app.college_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Duration:</span>
                        <span className="font-bold text-white">{app.duration || '8 Weeks'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Mode:</span>
                        <span className="font-bold text-white">{app.mode || 'Remote'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: OFFERS */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                Official Offer Letters
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Executive appointments issued by CEO Ayush Raj and Head of HR Akash Verma.
              </p>
            </div>

            {selectedOffer ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  &larr; Back to Offer Letters List
                </button>
                <OfferLetterViewer
                  offer={selectedOffer}
                  isStudentView={true}
                  onAccept={() => handleAcceptOffer(selectedOffer)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {offers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs bg-slate-900 rounded-3xl border border-slate-800">
                    No offer letters generated yet. Applications are reviewed under SLA.
                  </div>
                ) : (
                  offers.map((offer) => (
                    <div key={offer.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-amber-400">{offer.offer_id}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              offer.status === 'Accepted'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-sky-500/20 text-sky-400'
                            }`}
                          >
                            {offer.status}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-xl text-white mt-1">{offer.internship_title}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Period: {offer.start_date} to {offer.end_date} ({offer.duration || '8 Weeks'})
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => setSelectedOffer(offer)}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                        >
                          View Official Letter
                        </button>
                        {offer.status === 'Issued' && (
                          <button
                            onClick={() => handleAcceptOffer(offer)}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                          >
                            Accept Offer
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: DOCUMENTS & CREDENTIALS (CERTIFICATES & LORs) */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                Official Verifiable Credentials & Documents
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Tamper-proof digital credentials registered with QR verification checksums.
              </p>
            </div>

            {selectedCert && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedCert(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  &larr; Back to Documents List
                </button>
                <CertificateViewer certificate={selectedCert} />
              </div>
            )}

            {selectedLor && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedLor(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  &larr; Back to Documents List
                </button>
                <LorViewer lor={selectedLor} />
              </div>
            )}

            {!selectedCert && !selectedLor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Certificates Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base border-b border-slate-800 pb-3">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Certificates of Completion</span>
                  </div>

                  {documents.certificates?.length === 0 ? (
                    <div className="text-xs text-slate-500 py-6 text-center">
                      No certificates conferred yet. Complete your batch modules to generate your certificate.
                    </div>
                  ) : (
                    documents.certificates?.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-emerald-400">{c.certificate_id}</span>
                          <span className="text-[10px] text-slate-400">{c.issue_date}</span>
                        </div>
                        <div className="font-bold text-sm text-white">{c.program_title}</div>
                        <button
                          onClick={() => setSelectedCert(c)}
                          className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs rounded-xl border border-emerald-500/30 transition-colors"
                        >
                          View Verifiable Certificate &rarr;
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Letters of Recommendation Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-base border-b border-slate-800 pb-3">
                    <Award className="w-5 h-5" />
                    <span>Letters of Recommendation (LOR)</span>
                  </div>

                  {documents.lors?.length === 0 ? (
                    <div className="text-xs text-slate-500 py-6 text-center">
                      No LORs issued yet. Conferred upon successful batch milestone completion.
                    </div>
                  ) : (
                    documents.lors?.map((l) => (
                      <div key={l.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-sky-400">{l.lor_id}</span>
                          <span className="text-[10px] text-amber-300 font-bold">{l.performance_rating}</span>
                        </div>
                        <div className="font-bold text-sm text-white">{l.internship_title}</div>
                        <button
                          onClick={() => setSelectedLor(l)}
                          className="w-full py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-semibold text-xs rounded-xl border border-sky-500/30 transition-colors"
                        >
                          View Official LOR &rarr;
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: PAYMENTS & INVOICES */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                Payment History & GST Receipts
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Verified payment receipts with Razorpay transaction identifiers.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {payments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No payment transactions recorded for this account.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-4">Payment Ref</th>
                        <th className="p-4">Purpose</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Gateway Order</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-mono font-bold text-sky-400">{p.payment_no}</td>
                          <td className="p-4 text-white font-medium">{p.purpose}</td>
                          <td className="p-4 font-bold text-emerald-400">₹{p.amount}</td>
                          <td className="p-4 font-mono text-slate-400 text-[11px]">{p.razorpay_order_id}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{p.created_at?.split('T')[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 7: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                Student Profile & Credentials
              </h1>
              <p className="text-xs text-slate-400 mt-1">Manage personal contact details and academic verification.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.full_name || ''}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Verified Email Address</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    disabled
                    value={user?.phone || 'Not Specified'}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Role / Tier</label>
                  <input
                    type="text"
                    disabled
                    value="Enrolled Engineering Student"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-400 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Razorpay Payment Modal */}
      {activeOrderData && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          orderData={activeOrderData}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
