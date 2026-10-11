import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Calendar, CheckCircle2, ArrowRight, Award, Sparkles } from 'lucide-react';
import { TrainingProgram } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TrainingPageProps {
  setCurrentView: (view: string) => void;
  openAuthModal: () => void;
  openTrainingModal?: (program: TrainingProgram) => void;
}

/**
 * TrainingPage showcases corporate engineering masterclasses and practical training programs.
 * Allows candidates to view curriculum modules and directly enroll via Email OTP verification.
 */
export const TrainingPage: React.FC<TrainingPageProps> = ({
  setCurrentView,
  openAuthModal,
  openTrainingModal,
}) => {
  const { toast } = useAuth();
  const [trainings, setTrainings] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active training curriculum on component mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getTrainings();
        if (res.success) setTrainings(res.trainings);
      } catch (err) {
        console.error('[TRAINING LOAD ERROR]', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleEnrollClick = (program: TrainingProgram) => {
    if (openTrainingModal) {
      openTrainingModal(program);
    } else {
      toast(`Enquiry for "${program.title}" logged. Our counselor will contact you.`, 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider border border-sky-200 dark:border-sky-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Practical Skill Acceleration
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-white">
          Engineering Masterclasses & Training
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Deep-dive interactive training programs designed by senior engineers to build enterprise-grade software capabilities, hands-on production code, and verifiable corporate credentials.
        </p>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-sm">
          Loading training curriculum...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainings.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 shadow-sm hover:shadow-2xl dark:hover:shadow-sky-950/30 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                    {t.level}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {t.is_free ? 'Sponsored / Free' : `₹${t.fee_amount}`}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white leading-snug group-hover:text-sky-500 transition-colors">
                  {t.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {t.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    <span>Duration: <b className="text-slate-800 dark:text-slate-200">{t.duration}</b></span>
                  </div>
                  {t.schedule && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.schedule}</span>
                    </div>
                  )}
                </div>

                {/* Modules breakdown */}
                {Array.isArray(t.syllabus) && t.syllabus.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                      Curriculum Syllabus:
                    </div>
                    <div className="space-y-1">
                      {t.syllabus.slice(0, 3).map((m, idx) => (
                        <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                          <span className="truncate">{m.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleEnrollClick(t)}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                >
                  <span>Enroll in Program</span>
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
