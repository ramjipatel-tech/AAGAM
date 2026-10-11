import React, { useState } from 'react';
import {
  Menu,
  X,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openAuthModal: (initialTab?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, openAuthModal }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'internships', label: 'Internship' },
    { id: 'training', label: 'Training' },
    { id: 'placement', label: 'Placement' },
    { id: 'jobs', label: 'Job Openings' },
    { id: 'blog', label: 'Blog' },
    { id: 'verify', label: 'Track & Verify', highlight: true },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg shadow-slate-950/20">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Authentic Brand Identity & Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <div className="relative w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 via-sky-600 to-amber-500 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300">
              <img
                src="/aagam-logo.jpg"
                alt="AAGAM Digital Technology Official Logo"
                className="w-12 h-12 rounded-full object-cover bg-white"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent group-hover:to-amber-300 transition-colors">
                AAGAM
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-sky-400 -mt-0.5">
                Digital Technology
              </span>
              <span className="text-[9px] text-amber-400/90 tracking-widest uppercase font-medium">
                Learn • Build • Innovate
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === link.id
                    ? 'bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30'
                    : link.highlight
                    ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons: Student Login & Authenticated Profile Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-sky-950/70 border border-sky-800/70 rounded-xl hover:bg-sky-900/70 transition-all text-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="font-semibold text-xs text-white leading-tight">{user.full_name}</div>
                    <div className="text-[10px] text-sky-400 capitalize">
                      {user.role === 'student' ? 'Student' : user.role === 'staff' ? 'Staff' : 'Administrator'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-800 text-xs">
                      <div className="font-bold text-white">{user.full_name}</div>
                      <div className="text-slate-400 truncate">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        handleNavClick(
                          user.role === 'admin' || user.role === 'superadmin'
                            ? 'portal-admin'
                            : user.role === 'staff'
                            ? 'portal-staff'
                            : 'portal-student'
                        );
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-sky-300 hover:bg-slate-800 flex items-center gap-2 font-medium"
                    >
                      {user.role === 'student' ? (
                        <>
                          <GraduationCap className="w-4 h-4 text-sky-400" />
                          My Student Portal
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Management Console
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 border-t border-slate-800"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all"
                >
                  Student Login
                </button>
                <button
                  onClick={() => handleNavClick('internships')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 rounded-lg shadow-md shadow-sky-600/30 hover:shadow-sky-500/50 transition-all transform hover:-translate-y-0.5"
                >
                  Apply Internship
                </button>
              </div>
            )}

            {/* Theme Toggle Button (Dark / Light Mode) */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark/Light Mode Theme"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700/80 transition-all shadow-sm flex items-center justify-center cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-sky-400" />
              )}
            </button>
          </div>

          {/* Mobile Menu & Theme Toggle */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentView === link.id
                  ? 'bg-sky-500/20 text-sky-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-4 border-t border-slate-800 flex gap-2">
            {isAuthenticated ? (
              <div className="w-full space-y-2">
                <button
                  onClick={() =>
                    handleNavClick(
                      user?.role === 'admin' || user?.role === 'superadmin'
                        ? 'portal-admin'
                        : user?.role === 'staff'
                        ? 'portal-staff'
                        : 'portal-student'
                    )
                  }
                  className="w-full py-2.5 bg-sky-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" /> Go to My Dashboard
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-rose-900/40 text-rose-300 border border-rose-800/60 rounded-lg font-semibold text-xs"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-1/2 py-2.5 bg-slate-800 text-white rounded-lg font-medium text-sm"
                >
                  Student Login
                </button>
                <button
                  onClick={() => {
                    handleNavClick('internships');
                    setMobileMenuOpen(false);
                  }}
                  className="w-1/2 py-2.5 bg-sky-500 text-white rounded-lg font-semibold text-sm"
                >
                  Apply Internship
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
