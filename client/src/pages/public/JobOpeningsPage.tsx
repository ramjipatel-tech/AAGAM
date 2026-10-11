import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { JobOpening } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface JobOpeningsPageProps {
  openJobModal?: (job: JobOpening) => void;
}

/**
 * JobOpeningsPage showcases full-time and contract positions at AAGAM Digital Technology.
 * Candidates can apply directly with live Email OTP authentication.
 */
export const JobOpeningsPage: React.FC<JobOpeningsPageProps> = ({ openJobModal }) => {
  const { toast } = useAuth();
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active career openings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getJobs();
        if (res.success) setJobs(res.jobs);
      } catch (err) {
        console.error('[JOBS LOAD ERROR]', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApplyClick = (job: JobOpening) => {
    if (openJobModal) {
      openJobModal(job);
    } else {
      toast(`Application for "${job.title}" initiated. Please proceed with details.`, 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider border border-sky-200 dark:border-sky-800">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          Career Openings
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-white">
          Work with AAGAM Digital Technology
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Join our fast-paced product engineering and digital talent team. Shape high-impact technologies, build scalable products, and collaborate with passionate builders.
        </p>
      </div>

      {/* Grid of Jobs */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-sm">
          Loading job openings...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl dark:hover:shadow-sky-950/20 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                    {job.department}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {job.role_type} • {job.mode}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-2xl text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                    {job.title}
                  </h3>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Salary Range: {job.salary_range}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {job.description}
                </p>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Key Requirements:</span>
                  <span className="text-slate-600 dark:text-slate-400 leading-relaxed block">
                    {job.requirements}
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleApplyClick(job)}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                >
                  <span>Apply for Position</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
