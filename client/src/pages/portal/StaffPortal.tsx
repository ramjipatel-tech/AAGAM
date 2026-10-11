import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  GitBranch,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Search,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { InternshipApplication, ProjectAssignment } from '../../types';

export const StaffPortal: React.FC = () => {
  const { user, toast } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'projects' | 'students' | 'contacts'>('applications');
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [selectedApp, setSelectedApp] = useState<InternshipApplication | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Selected' | 'Shortlisted' | 'Documents Required' | 'Rejected'>('Selected');
  const [adminFeedback, setAdminFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Project review modal
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [projectStatus, setProjectStatus] = useState<'Approved' | 'Changes Required' | 'Under Review'>('Approved');
  const [staffRemarks, setStaffRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, projRes, stuRes, conRes] = await Promise.all([
        api.getAdminApplications(),
        api.getAllProjects(),
        api.getAdminStudents(),
        api.getContactEnquiries(),
      ]);
      if (appRes.success) setApplications(appRes.applications);
      if (projRes.success) setSubmissions(projRes.submissions);
      if (stuRes.success) setStudents(stuRes.students);
      if (conRes.success) setContacts(conRes.contacts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setReviewLoading(true);
    try {
      const res = await api.reviewApplication({
        application_id: selectedApp.id,
        status: reviewStatus,
        admin_feedback: adminFeedback,
      });
      if (res.success) {
        toast(`Application ${selectedApp.application_no} updated to ${reviewStatus}!`, 'success');
        setSelectedApp(null);
        setAdminFeedback('');
        loadData();
      }
    } catch (err: any) {
      toast(err.message || 'Review failed', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      const res = await api.reviewProject({
        submission_id: selectedSub.submission_id,
        assignment_id: selectedSub.assignment_id,
        status: projectStatus,
        staff_remarks: staffRemarks,
      });
      if (res.success) {
        toast(`Project marked as ${projectStatus}!`, 'success');
        setSelectedSub(null);
        setStaffRemarks('');
        loadData();
      }
    } catch (err: any) {
      toast(err.message || 'Project review failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-sky-500">
              <img src="/aagam-logo.jpg" alt="Logo" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-white">Staff / HR Portal</div>
              <div className="text-[10px] text-amber-400 font-semibold">{user?.full_name}</div>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'applications' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Application Reviews</span>
              {applications.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-amber-400">
                  {applications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'projects' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Project Submissions</span>
              {submissions.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  {submissions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'students' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Assigned Candidates</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'contacts' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Public Enquiries</span>
            </button>
          </nav>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
          <div className="font-bold text-white mb-0.5">HR Akash Verma</div>
          <div>Direct: 9693335499</div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-6">
        {/* TAB 1: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Admissions & Candidate Review Pipeline</h1>
              <p className="text-xs text-slate-400">Review candidate qualifications, inspect uploaded NOCs with OCR results, and record selection decisions.</p>
            </div>

            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">{app.application_no}</span>
                      <h3 className="font-heading font-bold text-xl text-white mt-0.5">{app.student_name}</h3>
                      <div className="text-xs text-slate-400">{app.college_name} • {app.course}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-300">
                        {app.status}
                      </span>
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
                      >
                        Review Candidate
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Internship Program:</span>
                      <span className="font-bold text-slate-200">{app.internship_title}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Student Contact:</span>
                      <span className="text-slate-300 font-mono">{app.student_phone} • {app.student_email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Submitted At:</span>
                      <span className="text-slate-300">{app.submitted_at ? app.submitted_at.split('T')[0] : 'Today'}</span>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  {Array.isArray(app.documents) && app.documents.length > 0 && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap gap-2 text-xs">
                      {app.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-1.5 text-sky-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                          <span>{doc.document_type}: {doc.original_filename}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* OCR Extractions */}
                  {app.ocr_data && (
                    <div className="p-3 bg-sky-950/30 border border-sky-800/40 rounded-xl text-xs text-sky-200 space-y-1">
                      <span className="font-bold text-sky-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> NOC OCR Extractions:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>Name: {app.ocr_data.extracted?.student_name}</div>
                        <div>College: {app.ocr_data.extracted?.college_name}</div>
                        <div>Roll: {app.ocr_data.extracted?.roll_no}</div>
                        <div>Confidence: {Math.round((app.ocr_data.confidence || 0.95) * 100)}%</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Project Submissions & Code Reviews</h1>
              <p className="text-xs text-slate-400">Inspect candidate GitHub repositories, live demo links, and provide architectural remarks.</p>
            </div>

            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub.assignment_id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="font-heading font-bold text-xl text-white">{sub.project_title}</h3>
                      <div className="text-xs text-slate-400">Candidate: <b className="text-white">{sub.student_name}</b> ({sub.student_email})</div>
                    </div>
                    <button
                      onClick={() => setSelectedSub(sub)}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                      Record Code Review
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block font-bold">GitHub Repository:</span>
                      {sub.github_url ? (
                        <a href={sub.github_url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-1 font-mono">
                          {sub.github_url} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500">Not submitted</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block font-bold">Live Demo URL:</span>
                      {sub.live_demo_url ? (
                        <a href={sub.live_demo_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center gap-1 font-mono">
                          {sub.live_demo_url} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGNED STUDENTS */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Registered Candidate Roster</h1>
              <p className="text-xs text-slate-400">Direct student contact details and registration numbers.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">College / Course</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {students.map((s) => (
                    <tr key={s.user_id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-mono font-bold text-sky-400">{s.registration_no || 'Pending'}</td>
                      <td className="p-4 font-bold text-white">{s.full_name}</td>
                      <td className="p-4">{s.college_name} - {s.course}</td>
                      <td className="p-4 font-mono text-[11px]">{s.phone || 'N/A'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          {s.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ENQUIRIES */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Public & University Inquiries</h1>
              <p className="text-xs text-slate-400">Enquiries from students, parents, and collegiate TPO coordinators.</p>
            </div>

            <div className="space-y-3">
              {contacts.map((c) => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{c.name} ({c.email})</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px]">
                      {c.status}
                    </span>
                  </div>
                  <div className="font-semibold text-amber-400">Subject: {c.subject}</div>
                  <p className="text-slate-300 leading-relaxed">{c.message}</p>
                  <div className="text-[11px] text-slate-500 pt-1 font-mono">Phone: {c.phone || 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] font-bold text-amber-400 uppercase">Review Application</div>
                <h3 className="font-heading font-bold text-lg text-white">{selectedApp.student_name}</h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewApp} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Decision Status *</label>
                <select
                  value={reviewStatus}
                  onChange={(e: any) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                >
                  <option value="Selected">Selected (Approve for Offer Generation)</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Documents Required">Documents Required / Correction</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Feedback / Notes to Student</label>
                <textarea
                  rows={4}
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="Congratulations! You have been selected for the internship..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {reviewLoading ? 'Recording Review...' : 'Submit Decision & Notify Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Project Review Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading font-bold text-lg text-white">Review Code: {selectedSub.student_name}</h3>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Evaluation Outcome</label>
                <select
                  value={projectStatus}
                  onChange={(e: any) => setProjectStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                >
                  <option value="Approved">Approved (Qualifies for Certificate & LOR)</option>
                  <option value="Changes Required">Changes Required (Request Revision)</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mentor Remarks & Suggestions</label>
                <textarea
                  rows={4}
                  value={staffRemarks}
                  onChange={(e) => setStaffRemarks(e.target.value)}
                  placeholder="Code quality is excellent. Architecture diagrams and unit tests verified..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl shadow-md"
              >
                Save Code Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
