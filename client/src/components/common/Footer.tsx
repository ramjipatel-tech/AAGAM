import React from 'react';
import {
  Mail,
  Phone,
  ShieldCheck,
  Award,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface FooterProps {
  setCurrentView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  const handleNav = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => handleNav('home')}
              className="flex items-center gap-3.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 via-sky-600 to-amber-500 shadow-lg shadow-sky-500/20">
                <img
                  src="/aagam-logo.jpg"
                  alt="AAGAM Logo"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <div>
                <span className="font-heading font-extrabold text-2xl tracking-tight text-white group-hover:text-sky-400 transition-colors">
                  AAGAM
                </span>
                <span className="block text-[11px] font-bold text-sky-400 uppercase tracking-wider -mt-0.5">
                  Digital Technology
                </span>
                <span className="block text-[10px] text-amber-400 font-semibold tracking-widest uppercase">
                  Learn • Build • Innovate
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed pr-6">
              AAGAM Digital Technology provides industry-oriented software engineering internships, practical masterclass training, corporate recruitment, and verifiable digital credentials for the next generation of technology leaders.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/80 border border-sky-800/80 text-sky-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                48-Hour Review SLA
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Verifiable QR Credentials
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white text-base tracking-wide">
              Programs & Opportunities
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => handleNav('internships')}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-sky-500" />
                  Internship Programs
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('training')}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-sky-500" />
                  Practical Training
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('placement')}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-sky-500" />
                  Placement Drives
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('jobs')}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-sky-500" />
                  Job Openings
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('verify')}
                  className="text-amber-400 font-semibold hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Verify Document
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('blog')}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-sky-500" />
                  Tech Blog & Insights
                </button>
              </li>
            </ul>
          </div>

          {/* Leadership & HR Direct Lines */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white text-base tracking-wide">
              Corporate Contacts
            </h4>
            <div className="space-y-2.5 text-sm text-slate-300">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Head of HR & Talent
                </div>
                <div className="font-semibold text-white">Akash Verma</div>
                <div className="text-xs text-amber-400 font-medium mt-0.5">
                  <a href="tel:9693335499" className="hover:underline">
                    Phone: 9693335499
                  </a>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  <a href="mailto:akashvermaofficialblogs@gmail.com" className="hover:underline">
                    akashvermaofficialblogs@gmail.com
                  </a>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Chief Executive Officer
                </div>
                <div className="font-semibold text-white">Ayush Raj</div>
                <div className="text-[11px] text-sky-400 mt-0.5">
                  AAGAM Digital Technology
                </div>
              </div>
            </div>
          </div>

          {/* Corporate Helpline & Legal */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white text-base tracking-wide">
              Support & Inquiries
            </h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <a
                  href="mailto:AAGAMDigitaltech@gmail.com"
                  className="hover:text-white transition-colors text-xs leading-relaxed"
                >
                  AAGAMDigitaltech@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-300 space-y-0.5">
                  <div>7667204026</div>
                  <div>9142363927</div>
                  <div>7091465676</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Legal & Governance
              </div>
              <ul className="space-y-1 text-xs text-slate-400">
                <li>
                  <button
                    onClick={() => handleNav('legal-terms')}
                    className="hover:text-sky-400 transition-colors"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('legal-privacy')}
                    className="hover:text-sky-400 transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('legal-refund')}
                    className="hover:text-sky-400 transition-colors"
                  >
                    Refund & Cancellation Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('legal-disclaimer')}
                    className="hover:text-sky-400 transition-colors"
                  >
                    Disclaimer & Cookies
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar with discreet admin link */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} AAGAM DIGITAL TECHNOLOGY PRIVATE LIMITED • Learn • Build • Innovate | <span className="text-slate-400 font-medium">Developed by Zyvionex Technologies</span>
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              256-Bit Encrypted Platform
            </span>
            <span>Razorpay Verified Gateway</span>
            {/* Discreet Management Portal Trigger */}
            <button
              onClick={() => handleNav('admin-login')}
              title="Restricted Staff & Admin Gateway"
              className="p-1 text-slate-700 hover:text-slate-400 transition-colors rounded"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
