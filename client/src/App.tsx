import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { Toast } from './components/common/Toast';
import { AuthModal } from './components/modals/AuthModal';
import { ApplicationFlowModal } from './components/modals/ApplicationFlowModal';
import { TrainingEnrollmentModal } from './components/modals/TrainingEnrollmentModal';
import { JobApplicationModal } from './components/modals/JobApplicationModal';

import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { InternshipListPage } from './pages/public/InternshipListPage';
import { InternshipDetailPage } from './pages/public/InternshipDetailPage';
import { TrainingPage } from './pages/public/TrainingPage';
import { PlacementPage } from './pages/public/PlacementPage';
import { JobOpeningsPage } from './pages/public/JobOpeningsPage';
import { BlogListPage } from './pages/public/BlogListPage';
import { VerifyPage } from './pages/public/VerifyPage';
import { ContactPage } from './pages/public/ContactPage';
import { LegalPolicyPage } from './pages/public/LegalPolicyPage';
import { AcceptOfferPage } from './pages/public/AcceptOfferPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';

import { StudentPortal } from './pages/portal/StudentPortal';
import { StaffPortal } from './pages/portal/StaffPortal';
import { AdminPanel } from './pages/portal/AdminPanel';
import { AdminLoginPage } from './pages/portal/AdminLoginPage';
import { Internship, TrainingProgram, JobOpening, PlacementDrive } from './types';

/**
 * MainApp orchestrates the full single-page routing, global state,
 * dedicated modal gateways for Internships, Trainings, Jobs, Authentication,
 * and high-contrast Dark/Light theme switching for AAGAM Digital Technology.
 */
const MainApp: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedInternshipSlug, setSelectedInternshipSlug] = useState<string>('');

  // Authentication Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Direct Internship Application Modal (No Login Required)
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedInternshipForApply, setSelectedInternshipForApply] = useState<Internship | null>(null);

  // Dedicated Training Program Enrollment Modal (No Login Required)
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [selectedTrainingForEnroll, setSelectedTrainingForEnroll] = useState<TrainingProgram | null>(null);

  // Dedicated Job Opening / Placement Drive Application Modal (No Login Required)
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobOpening | PlacementDrive | null>(null);

  // Helper to sync view and params from current window.location.search
  const syncViewFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const idParam = params.get('id');
    const offerIdParam = params.get('offerId');
    const tokenParam = params.get('token');
    const slugParam = params.get('slug');

    if (slugParam) {
      setSelectedInternshipSlug(slugParam);
    }

    if (tokenParam || viewParam === 'reset-password') {
      setCurrentView('reset-password');
    } else if (idParam || viewParam === 'verify') {
      setCurrentView('verify');
    } else if (offerIdParam || viewParam === 'accept-offer') {
      setCurrentView('accept-offer');
    } else if (viewParam === 'admin-login' || viewParam === 'admin' || params.get('admin') === 'true') {
      if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        setCurrentView('portal-admin');
      } else if (user && user.role === 'staff') {
        setCurrentView('portal-staff');
      } else {
        setCurrentView('admin-login');
      }
    } else if (viewParam) {
      setCurrentView(viewParam);
    } else {
      setCurrentView('home');
    }
  };

  // Synchronized view navigation that updates React state and browser URL / history stack
  const navigateToView = (view: string, extraParams?: Record<string, string>, replace = false) => {
    setCurrentView(view);

    let newUrl = window.location.pathname;
    const searchParams = new URLSearchParams();

    if (view !== 'home') {
      searchParams.set('view', view);
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => {
          if (v) searchParams.set(k, v);
        });
      } else if (view === 'internship-detail' && selectedInternshipSlug) {
        searchParams.set('slug', selectedInternshipSlug);
      }
      const qs = searchParams.toString();
      if (qs) {
        newUrl += `?${qs}`;
      }
    }

    const currentFullUrl = window.location.pathname + window.location.search;
    if (currentFullUrl !== newUrl) {
      if (replace) {
        window.history.replaceState({ view, ...(extraParams || {}) }, '', newUrl);
      } else {
        window.history.pushState({ view, ...(extraParams || {}) }, '', newUrl);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Initial URL inspection on mount & 2. Listen to browser Back/Forward (popstate)
  useEffect(() => {
    syncViewFromUrl();

    const handlePopState = () => {
      syncViewFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3. Persist admin session: auto-redirect from admin-login if authenticated
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'staff')) {
      if (currentView === 'admin-login') {
        const target = user.role === 'staff' ? 'portal-staff' : 'portal-admin';
        navigateToView(target, undefined, true);
      }
    }
  }, [user, currentView]);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const openApplyModal = (internship: Internship) => {
    setSelectedInternshipForApply(internship);
    setApplyModalOpen(true);
  };

  const openTrainingModal = (training: TrainingProgram) => {
    setSelectedTrainingForEnroll(training);
    setTrainingModalOpen(true);
  };

  const openJobModal = (job: JobOpening | PlacementDrive) => {
    setSelectedJobForApply(job);
    setJobModalOpen(true);
  };

  const isPortalView =
    currentView === 'portal-student' || currentView === 'portal-staff' || currentView === 'portal-admin';
  const isAdminLoginView = currentView === 'admin-login';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* Public Top Navbar */}
      {!isPortalView && !isAdminLoginView && (
        <Navbar
          currentView={currentView}
          setCurrentView={navigateToView}
          openAuthModal={openAuthModal}
        />
      )}

      {/* Portal Top Bar */}
      {isPortalView && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-300 shadow-md">
          <div className="flex items-center gap-3">
            <img src="/aagam-logo.jpg" alt="Logo" className="w-6 h-6 rounded-full" />
            <span className="font-heading font-bold text-white tracking-wide">
              AAGAM DIGITAL TECHNOLOGY • {currentView.replace('portal-', '').toUpperCase()} CONSOLE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                navigateToView('home');
              }}
              className="text-sky-400 hover:text-white font-semibold transition-colors flex items-center gap-1.5"
            >
              ← Back to Corporate Website
            </button>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <div className="flex-1">
        {currentView === 'home' && (
          <HomePage
            setCurrentView={navigateToView}
            openApplyModal={openApplyModal}
            openAuthModal={openAuthModal}
            setSelectedInternshipSlug={setSelectedInternshipSlug}
          />
        )}

        {currentView === 'about' && <AboutPage setCurrentView={navigateToView} />}

        {currentView === 'internships' && (
          <InternshipListPage
            setCurrentView={navigateToView}
            setSelectedInternshipSlug={setSelectedInternshipSlug}
            openApplyModal={openApplyModal}
            openAuthModal={openAuthModal}
          />
        )}

        {currentView === 'internship-detail' && (
          <InternshipDetailPage
            slug={selectedInternshipSlug}
            setCurrentView={navigateToView}
            openApplyModal={openApplyModal}
            openAuthModal={openAuthModal}
          />
        )}

        {currentView === 'training' && (
          <TrainingPage
            setCurrentView={navigateToView}
            openAuthModal={openAuthModal}
            openTrainingModal={openTrainingModal}
          />
        )}

        {currentView === 'placement' && (
          <PlacementPage
            setCurrentView={navigateToView}
            openAuthModal={openAuthModal}
            openJobModal={openJobModal}
          />
        )}

        {currentView === 'jobs' && (
          <JobOpeningsPage
            openJobModal={openJobModal}
          />
        )}

        {currentView === 'blog' && <BlogListPage />}

        {currentView === 'verify' && <VerifyPage />}

        {currentView === 'contact' && <ContactPage />}

        {/* Public Offer Acceptance & Onboarding View */}
        {currentView === 'accept-offer' && (
          <AcceptOfferPage setCurrentView={navigateToView} />
        )}

        {/* Public Password Reset View */}
        {currentView === 'reset-password' && (
          <ResetPasswordPage setCurrentView={navigateToView} />
        )}

        {/* Legal & Compliance Policies */}
        {currentView === 'legal-terms' && <LegalPolicyPage initialTab="terms" />}
        {currentView === 'legal-privacy' && <LegalPolicyPage initialTab="privacy" />}
        {currentView === 'legal-refund' && <LegalPolicyPage initialTab="refund" />}
        {currentView === 'legal-disclaimer' && <LegalPolicyPage initialTab="disclaimer" />}

        {/* Dedicated Admin Login Gateway */}
        {currentView === 'admin-login' && (
          <AdminLoginPage setCurrentView={navigateToView} />
        )}

        {/* Secure Portals with Auth Guards */}
        {currentView === 'portal-student' && <StudentPortal />}
        {currentView === 'portal-staff' && (
          isAuthenticated && (user?.role === 'staff' || user?.role === 'admin' || user?.role === 'superadmin') ? (
            <StaffPortal />
          ) : (
            <AdminLoginPage setCurrentView={navigateToView} />
          )
        )}
        {currentView === 'portal-admin' && (
          isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin') ? (
            <AdminPanel />
          ) : (
            <AdminLoginPage setCurrentView={navigateToView} />
          )
        )}
      </div>

      {/* Public Footer */}
      {!isPortalView && !isAdminLoginView && <Footer setCurrentView={navigateToView} />}

      {/* Global Toast Notifications */}
      <Toast />

      {/* Global Student Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        onSuccess={() => {
          if (user?.role === 'admin' || user?.role === 'superadmin') {
            navigateToView('portal-admin');
          } else if (user?.role === 'staff') {
            navigateToView('portal-staff');
          } else {
            navigateToView('portal-student');
          }
        }}
      />

      {/* Direct Public Internship Application Modal (No Login Required) */}
      <ApplicationFlowModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        internship={selectedInternshipForApply}
        onSubmitted={() => {
          // Keep feedback on modal
        }}
      />

      {/* Dedicated Training Program Enrollment Modal (No Login Required) */}
      <TrainingEnrollmentModal
        isOpen={trainingModalOpen}
        onClose={() => setTrainingModalOpen(false)}
        program={selectedTrainingForEnroll}
      />

      {/* Dedicated Job & Placement Application Modal (No Login Required) */}
      <JobApplicationModal
        isOpen={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        job={selectedJobForApply}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
