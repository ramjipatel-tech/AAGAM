import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  ArrowRight,
  Sparkles,
  Flame,
  Calendar,
  Clock,
  GraduationCap,
  Layers,
  CheckCircle2,
  X,
  FileText,
  Video,
} from 'lucide-react';
import { Internship, Batch } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface InternshipListPageProps {
  setCurrentView: (view: string, params?: Record<string, string>) => void;
  setSelectedInternshipSlug: (slug: string) => void;
  openApplyModal: (internship: Internship | any) => void;
  openAuthModal: () => void;
}

/**
 * InternshipListPage renders live active batches and official catalog of engineering internships.
 * Features real-time department filtering, search queries, curriculum breakdown modals, and instant direct cohort registration.
 */
export const InternshipListPage: React.FC<InternshipListPageProps> = ({
  setCurrentView,
  setSelectedInternshipSlug,
  openApplyModal,
}) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'batches' | 'catalog'>('all');
  const [selectedBatchForCurriculum, setSelectedBatchForCurriculum] = useState<Batch | null>(null);

  // Load live batches and internships
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [batchRes, intRes] = await Promise.all([
          api.getPublicBatches(),
          api.getInternships({
            department: selectedDept !== 'All' ? selectedDept : undefined,
            mode: selectedMode !== 'All' ? selectedMode : undefined,
            search: search.trim() || undefined,
          }),
        ]);

        if (batchRes.success) setBatches(batchRes.batches || []);
        if (intRes.success) setInternships(intRes.internships || []);
      } catch (err) {
        console.error('[INTERNSHIPS LOAD ERROR]', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDept, selectedMode, search]);

  const handleApplyInternship = (item: Internship) => {
    openApplyModal(item);
  };

  const handleApplyBatch = (batch: Batch) => {
    openApplyModal({
      id: batch.id,
      slug: batch.batch_code.toLowerCase(),
      title: batch.title,
      department: batch.department,
      technology: batch.department,
      description: `Official Batch Cohort (${batch.batch_code}) under instructor ${batch.instructor_name}. Scheduled from ${batch.start_date} to ${batch.end_date}.`,
      full_description: `Batch Code: ${batch.batch_code}\nInstructor: ${batch.instructor_name}\nTimeline: ${batch.start_date} to ${batch.end_date} (${batch.duration_weeks} Weeks)\nCurriculum Modules: ${batch.modules?.length || 0}`,
      duration: `${batch.duration_weeks} Weeks`,
      eligibility: 'Open to B.Tech, BCA, MCA, B.Sc & M.Sc Students',
      skills_required: batch.department,
      mode: 'Remote',
      location: 'Online Live & Self-Paced',
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

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      !search.trim() ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.batch_code.toLowerCase().includes(search.toLowerCase()) ||
      (b.department && b.department.toLowerCase().includes(search.toLowerCase())) ||
      (b.instructor_name && b.instructor_name.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      selectedDept === 'All' ||
      (b.department && b.department.toLowerCase().includes(selectedDept.toLowerCase()));

    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider border border-sky-200 dark:border-sky-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Live Cohorts & Practical Engineering Tracks
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-white">
          Internship Batches & Programs
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Enroll into live upcoming cohort batches created by AAGAM engineering leads, gain structured sprint mentorship, and graduate with verified digital credentials.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch title, batch code, instructor..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-sky-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Data & AI">Data & AI Research</option>
            <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
            <option value="Information Security">Information Security</option>
            <option value="Full Stack Development">Full Stack Development</option>
            <option value="Mobile App Development">Mobile App Development</option>
          </select>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 focus:outline-none"
          >
            <option value="All">All Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: LIVE ACTIVE BATCHES (FROM ADMIN) */}
      {(activeViewTab === 'all' || activeViewTab === 'batches') && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 border border-amber-500/20">
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Live Cohort Batches (Direct Registration)
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
                Active Internship Batches
              </h2>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {filteredBatches.length} {filteredBatches.length === 1 ? 'Batch' : 'Batches'} Currently Open for Applications
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm animate-pulse">
              Loading active cohort batches...
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="py-12 px-6 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
              <div className="font-bold text-base text-slate-800 dark:text-slate-200">
                No active batches matching your filter.
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Admin is scheduling the next cohort rounds. Check other department tracks or submit a general application below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.map((batch) => {
                const enrolled = batch.enrolled_count || 0;
                const maxSeats = batch.max_seats || 50;
                const seatsLeft = batch.seats_left !== undefined ? batch.seats_left : Math.max(0, maxSeats - enrolled);
                const percentFilled = Math.min(100, Math.round((enrolled / maxSeats) * 100));

                return (
                  <div
                    key={batch.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-sky-500/30 hover:border-sky-500 p-6 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="space-y-4 relative z-10">
                      {/* Badge Row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-slate-950 text-amber-400 border border-amber-500/30">
                          {batch.batch_code}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Admissions Open
                        </span>
                      </div>

                      {/* Title & Department */}
                      <div>
                        <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors line-clamp-2">
                          {batch.title}
                        </h3>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>{batch.department}</span>
                          <span>•</span>
                          <span className="text-sky-600 dark:text-sky-400 font-bold">{batch.program_type}</span>
                        </div>
                      </div>

                      {/* Timeline & Instructor Details */}
                      <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                            <span>Timeline:</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {batch.start_date} ➔ {batch.end_date}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Duration:</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {batch.duration_weeks} Weeks
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 font-medium">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Faculty Lead:</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                            {batch.instructor_name}
                          </span>
                        </div>
                      </div>

                      {/* Modules Syllabus Preview */}
                      {Array.isArray(batch.modules) && batch.modules.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span>Syllabus Modules ({batch.modules.length}):</span>
                            <button
                              type="button"
                              onClick={() => setSelectedBatchForCurriculum(batch)}
                              className="text-sky-600 dark:text-sky-400 hover:underline text-[11px]"
                            >
                              View Full Syllabus
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {batch.modules.slice(0, 3).map((m, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[190px]"
                              >
                                M{m.module_number || idx + 1}: {m.title}
                              </span>
                            ))}
                            {batch.modules.length > 3 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                                +{batch.modules.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Live Seats Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">Seats Capacity</span>
                          <span className={`font-bold ${seatsLeft <= 10 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {seatsLeft} Seats Left ({enrolled}/{maxSeats})
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              percentFilled >= 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-500 to-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, percentFilled)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 relative z-10">
                      <button
                        type="button"
                        onClick={() => setSelectedBatchForCurriculum(batch)}
                        className="py-2.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
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
      )}

      {/* SECTION 2: SPECIALIZATION TRACKS CATALOG */}
      {(activeViewTab === 'all' || activeViewTab === 'catalog') && internships.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">
                Domain Specializations
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
                All Internship Tracks
              </h2>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {internships.length} Specialization Tracks
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {internships.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 p-6 shadow-sm hover:shadow-2xl dark:hover:shadow-sky-950/20 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                      {item.department}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      {item.mode}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                      Tech Stack: {item.technology}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Duration:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Open Seats:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.total_seats - item.filled_seats} Seats Left
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Required Documents: </span>
                    {Array.isArray(item.required_documents) ? item.required_documents.join(', ') : 'NOC, Resume'}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedInternshipSlug(item.slug);
                      setCurrentView('internship-detail', { slug: item.slug });
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-center"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleApplyInternship(item)}
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

      {/* CURRICULUM BREAKDOWN MODAL */}
      {selectedBatchForCurriculum && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-amber-400 font-mono text-xs font-bold mb-2">
                  {selectedBatchForCurriculum.batch_code}
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  {selectedBatchForCurriculum.title}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                  <span>Timeline: <b>{selectedBatchForCurriculum.start_date} to {selectedBatchForCurriculum.end_date}</b></span>
                  <span>•</span>
                  <span>Duration: <b>{selectedBatchForCurriculum.duration_weeks} Weeks</b></span>
                  <span>•</span>
                  <span>Faculty: <b>{selectedBatchForCurriculum.instructor_name}</b></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBatchForCurriculum(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Structured Syllabus & Sprint Modules
              </h4>

              {Array.isArray(selectedBatchForCurriculum.modules) && selectedBatchForCurriculum.modules.length > 0 ? (
                selectedBatchForCurriculum.modules.map((mod, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-sky-600 dark:text-sky-400">
                        Module {mod.module_number || mod.module_no || idx + 1}: {mod.title}
                      </span>
                      {mod.duration && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {mod.duration}
                        </span>
                      )}
                    </div>
                    {mod.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {mod.description}
                      </p>
                    )}

                    {Array.isArray(mod.lectures) && mod.lectures.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Interactive Sessions:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {mod.lectures.map((lec: any, lIdx: number) => (
                            <span
                              key={lIdx}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                            >
                              <Video className="w-3 h-3 text-sky-500" />
                              <span>{lec.title || lec}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(mod.tasks) && mod.tasks.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Hands-on Deliverables:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {mod.tasks.map((task: any, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-1.5"
                            >
                              <FileText className="w-3 h-3 text-amber-500" />
                              <span>{task.title || task}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-500 text-center">
                  Comprehensive industry syllabus with weekly live mentor reviews, milestone git commits, and capstone project deployment.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Admissions open for batch <b className="text-slate-900 dark:text-white">{selectedBatchForCurriculum.batch_code}</b>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = selectedBatchForCurriculum;
                  setSelectedBatchForCurriculum(null);
                  handleApplyBatch(target);
                }}
                className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                <span>Register for this Batch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
