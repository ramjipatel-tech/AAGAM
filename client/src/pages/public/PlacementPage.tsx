import React, { useState, useEffect } from 'react';
import { Briefcase, Building, MapPin, Calendar, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { PlacementDrive } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface PlacementPageProps {
  setCurrentView: (view: string) => void;
  openAuthModal: () => void;
  openJobModal?: (drive: PlacementDrive) => void;
}

/**
 * PlacementPage showcases corporate recruitment and campus hiring drives
 * facilitated through AAGAM Digital Technology's partner network.
 */
export const PlacementPage: React.FC<PlacementPageProps> = ({
  setCurrentView,
  openAuthModal,
  openJobModal,
}) => {
  const { toast } = useAuth();
  const [placements, setPlacements] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active placement drives
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getPlacements();
        if (res.success) setPlacements(res.placements);
      } catch (e) {
        console.error('[PLACEMENT LOAD ERROR]', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRegisterClick = (drive: PlacementDrive) => {
    if (openJobModal) {
      openJobModal(drive);
    } else {
      toast(`Registration for "${drive.title}" logged. HR will contact you.`, 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Campus Recruitment & Talent Pipeline
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-white">
          Placement Opportunities & Hiring Drives
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Direct recruitment drives with top tech companies and high-growth startups for graduating interns and qualified engineering students.
        </p>
      </div>

      {/* Grid of Placement Drives */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-sm">
          Loading placement opportunities...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {placements.map((drive) => (
            <div
              key={drive.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl dark:hover:shadow-amber-950/20 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Batch: {drive.batch_year}
                    </span>
                    <h3 className="font-heading font-bold text-2xl text-slate-900 dark:text-white mt-2 group-hover:text-amber-500 transition-colors">
                      {drive.title}
                    </h3>
                    <div className="text-sm font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                      {drive.company_name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block uppercase font-semibold">Compensation</span>
                    <span className="font-heading font-black text-xl text-emerald-600 dark:text-emerald-400">
                      {drive.package_lpa}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {drive.description}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {drive.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Drive Date:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {drive.drive_date}
                    </span>
                  </div>
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Eligibility Criteria:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block">
                      {drive.eligibility}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleRegisterClick(drive)}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                >
                  <span>Register for Placement Drive</span>
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
