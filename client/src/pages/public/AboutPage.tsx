import React from 'react';
import { ShieldCheck, Target, Eye, Award, CheckCircle2, Phone, Mail, MapPin, Users } from 'lucide-react';

interface AboutPageProps {
  setCurrentView: (view: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentView }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
          Company Overview
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900">
          About AAGAM Digital Technology
        </h1>
        <div className="text-sm font-bold text-amber-600 tracking-[0.2em] uppercase">
          Learn • Build • Innovate
        </div>
        <p className="text-slate-600 text-base leading-relaxed">
          AAGAM Digital Technology is an enterprise software engineering, training, and talent management firm dedicated to transforming passionate learners into industry-ready software engineers.
        </p>
      </div>

      {/* Mission & Vision Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-sky-400 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-xl text-slate-900">Our Mission</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            To provide high-rigor, hands-on software development internships and practical masterclass training that mirror enterprise engineering workflows and agile practices.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-xl text-slate-900">Our Vision</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            To become the benchmark technology incubator where academic knowledge seamlessly fuses with real production systems, cloud deployments, and verified digital credentials.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-emerald-400 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-xl text-slate-900">Core Values</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Technical rigor, institutional integrity, NOC compliance, mentor transparency, and empowering talent without artificial barriers.
          </p>
        </div>
      </div>

      {/* Leadership Profile Spotlight */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-heading font-extrabold text-3xl text-white">Company Leadership</h2>
          <p className="text-slate-400 text-sm">
            Meet the driving force behind AAGAM Digital Technology's educational and technical excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* CEO Card */}
          <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 font-extrabold text-2xl flex items-center justify-center font-heading">
                AR
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Ayush Raj</h3>
                <div className="text-xs font-semibold text-sky-400">Chief Executive Officer (CEO)</div>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Leading the executive strategy, cloud architecture benchmarks, and digital platform development for AAGAM Digital Technology. Ayush oversees the full lifecycle of software products and enterprise training curriculums.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              Official Email: <span className="text-slate-200">AAGAMDigitaltech@gmail.com</span>
            </div>
          </div>

          {/* HR Head Card */}
          <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 font-extrabold text-2xl flex items-center justify-center font-heading">
                AV
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Akash Verma</h3>
                <div className="text-xs font-semibold text-amber-400">Head of HR & Talent Acquisition</div>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Spearheading student admissions, collegiate NOC verifications, candidate onboarding, and corporate hiring partnerships. Direct point of contact for candidate queries and institute liaisons.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div>
                HR Phone: <a href="tel:9693335499" className="text-amber-300 font-semibold hover:underline">9693335499</a>
              </div>
              <div>
                HR Email: <a href="mailto:akashvermaofficialblogs@gmail.com" className="text-slate-200 hover:underline">akashvermaofficialblogs@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Contact Lines */}
      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="space-y-1">
          <Phone className="w-6 h-6 text-sky-600 mx-auto mb-2" />
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Helpline Numbers</div>
          <div className="font-bold text-slate-900 text-sm">7667204026 / 9142363927</div>
          <div className="text-xs text-slate-600">7091465676</div>
        </div>

        <div className="space-y-1">
          <Mail className="w-6 h-6 text-sky-600 mx-auto mb-2" />
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Corporate Email</div>
          <div className="font-bold text-slate-900 text-sm">AAGAMDigitaltech@gmail.com</div>
          <div className="text-xs text-slate-600">akashvermaofficialblogs@gmail.com</div>
        </div>

        <div className="space-y-1">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Guaranteed SLAs</div>
          <div className="font-bold text-emerald-700 text-sm">48-Hr Review Window</div>
          <div className="text-xs text-slate-600">2-Hr Portal Provisioning Target</div>
        </div>
      </div>
    </div>
  );
};
