import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trash2,
  Copy,
  Check,
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Briefcase,
  Code,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Internship } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface ApplicationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  internship: Internship | null;
  onSubmitted?: (registrationNo: string) => void;
}

/**
 * ApplicationFlowModal orchestrates the 4-step direct public internship application.
 * Note: Document upload (NOC, College ID, Resume) is completely optional at initial submission.
 * Candidates can choose to upload available documents for OCR verification or proceed without them.
 */
export const ApplicationFlowModal: React.FC<ApplicationFlowModalProps> = ({
  isOpen,
  onClose,
  internship,
  onSubmitted,
}) => {
  const { user, toast } = useAuth();

  // Stepper state: 1: Profile & Academics, 2: Documents (Optional), 3: Live Email OTP, 4: Confirmed
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [semesterYear, setSemesterYear] = useState('6th Semester / 3rd Year');
  const [rollNo, setRollNo] = useState('');
  const [skills, setSkills] = useState('');

  // Uploaded Documents List (Optional)
  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{
      documentType: string;
      filePath: string;
      originalFilename: string;
      fileSize: number;
      mimeType: string;
    }>
  >([]);

  // OCR Extraction Data
  const [ocrData, setOcrData] = useState<any>(null);

  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Final Registration Info
  const [generatedRegNo, setGeneratedRegNo] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Candidate Passport Photo State
  const [studentPhotoUrl, setStudentPhotoUrl] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setStudentName(user.full_name || '');
      setStudentEmail(user.email || '');
      setStudentPhone(user.phone || '');
      if (user.avatar_url) {
        setStudentPhotoUrl(user.avatar_url);
      }
      if (user.student) {
        setCollegeName(user.student.college_name || '');
        setCourse(user.student.course || 'B.Tech');
        setBranch(user.student.branch || 'Computer Science & Engineering');
        setSemesterYear(user.student.semester_year || '6th Semester / 3rd Year');
        setRollNo(user.student.roll_no || '');
        setSkills(user.student.skills || '');
        if (user.student.photo_url) {
          setStudentPhotoUrl(user.student.photo_url);
        }
      }
    }
  }, [user, isOpen]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP) for your passport photo.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Passport photo must be smaller than 5MB.');
      return;
    }
    setPhotoUploading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setStudentPhotoUrl(dataUrl);
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('documentType', 'Passport_Photo');
          formData.append('studentName', studentName.trim() || 'Applicant');
          formData.append('course', course);
          const res = await api.uploadDocument(formData);
          if (res.success && res.file?.filePath) {
            setStudentPhotoUrl(res.file.filePath);
          }
        } catch (uploadErr) {
          // Data URL is already in state as fallback
        }
        toast('Passport photograph uploaded successfully!', 'success');
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError('Failed to process passport photo.');
      setPhotoUploading(false);
    }
  };

  if (!isOpen || !internship) return null;

  // List of optional document categories for this program
  const documentCategories = Array.isArray(internship.required_documents) && internship.required_documents.length > 0
    ? internship.required_documents
    : ['NOC', 'College_ID', 'Resume'];

  /**
   * Handles asynchronous file upload & OCR inspection
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('Selected file exceeds maximum limit of 15MB. Please choose a smaller file.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      formData.append('studentName', studentName.trim() || 'Applicant');
      formData.append('collegeName', collegeName.trim() || 'College');
      formData.append('course', course);
      formData.append('rollNo', rollNo.trim() || '');

      const res = await api.uploadDocument(formData);
      if (res.success) {
        setUploadedDocs((prev) => [
          ...prev.filter((d) => d.documentType !== docType),
          res.file,
        ]);

        if (res.ocr && (docType === 'NOC' || docType === 'College_ID')) {
          setOcrData(res.ocr);
          if (res.ocr.extracted) {
            toast('Document uploaded & OCR inspected! Review extracted information below.', 'info');
          }
        } else {
          toast(`${docType.replace('_', ' ')} uploaded successfully.`, 'success');
        }
      }
    } catch (err: any) {
      setError(err.message || 'File upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Removes an uploaded document
   */
  const handleRemoveDoc = (docType: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.documentType !== docType));
    if (docType === 'NOC') {
      setOcrData(null);
    }
    toast(`Removed ${docType.replace('_', ' ')}.`, 'info');
  };

  /**
   * Validates Step 1 profile inputs and advances to Step 2
   */
  const handleProceedToDocs = () => {
    if (!studentName.trim() || !studentEmail.trim() || !studentPhone.trim() || !collegeName.trim() || !course.trim()) {
      setError('Please fill all mandatory student and institution details.');
      return;
    }
    if (!studentEmail.includes('@') || !studentEmail.includes('.')) {
      setError('Please enter a valid personal or college email address.');
      return;
    }
    setError(null);
    setStep(2);
  };

  /**
   * Advances from Step 2 to Step 3 and dispatches verification OTP to candidate's email
   * (Documents are optional; no blocking checks)
   */
  const handleProceedToOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.sendApplyOtp({ email: studentEmail.trim().toLowerCase(), student_name: studentName.trim() });
      setOtpSent(true);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep(3);
      toast(`Verification OTP dispatched to ${studentEmail}.`, 'info');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch email verification code. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submits application with OTP verification and displays confirmation screen
   */
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.applyInternship({
        internship_id: internship.id,
        batch_id: (internship as any).batch_id || (internship as any).id,
        student_name: studentName.trim(),
        student_email: studentEmail.trim().toLowerCase(),
        student_phone: studentPhone.trim(),
        college_name: collegeName.trim(),
        course: course.trim(),
        branch: branch.trim(),
        semester_year: semesterYear.trim(),
        roll_no: rollNo.trim(),
        skills: skills.trim(),
        photo_url: studentPhotoUrl || undefined,
        otp: otp.trim(),
        documents: uploadedDocs,
        ocr_data: ocrData,
      });

      if (res.success && res.application) {
        setGeneratedRegNo(res.application.application_no);
        setStep(4);

        // Confetti celebration animation
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });

        if (onSubmitted) {
          onSubmitted(res.application.application_no);
        }
        toast('Internship application submitted successfully!', 'success');
      } else {
        setError(res.message || 'Application submission failed. Please verify your OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRegNo = () => {
    if (generatedRegNo) {
      navigator.clipboard.writeText(generatedRegNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast('Registration number copied to clipboard!', 'success');
    }
  };

  const handleModalClose = () => {
    setStep(1);
    setUploadedDocs([]);
    setOcrData(null);
    setOtp('');
    setOtpSent(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Top Header Strip */}
        <div className="p-6 bg-gradient-to-r from-sky-600 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold uppercase tracking-wider text-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {(internship as any).batch_code ? `Official Cohort Admission • ${(internship as any).batch_code}` : 'Direct Public Internship Gateway'}
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
              {internship.title}
            </h2>
            <div className="text-xs text-sky-200 flex flex-wrap items-center gap-2.5">
              <span>{internship.department}</span>
              <span>•</span>
              <span>{internship.duration}</span>
              <span>•</span>
              <span>{internship.mode}</span>
              {(internship as any).batch_code && (
                <>
                  <span>•</span>
                  <span className="font-mono text-amber-300 font-bold">{(internship as any).batch_code}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Stepper */}
        {step < 4 && (
          <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step > 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-sky-500 text-white'
              }`}>
                {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </span>
              <span className="hidden sm:inline">Profile & College</span>
            </div>

            <div className="h-0.5 w-8 sm:w-12 bg-slate-300 dark:bg-slate-800"></div>

            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step > 2
                  ? 'bg-emerald-500 text-white'
                  : step === 2
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </span>
              <span className="hidden sm:inline">Documents (Optional)</span>
            </div>

            <div className="h-0.5 w-8 sm:w-12 bg-slate-300 dark:bg-slate-800"></div>

            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 3 ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                3
              </span>
              <span className="hidden sm:inline">Email OTP</span>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Profile & Academics */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 text-xs text-sky-900 dark:text-sky-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Enter your candidate credentials. No prior registration or login is required to apply.</span>
              </div>

              {/* Candidate Passport Photo Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl border-2 border-dashed border-sky-400 dark:border-sky-500 overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center relative shrink-0 shadow-sm">
                  {studentPhotoUrl ? (
                    <img
                      src={studentPhotoUrl}
                      alt="Candidate Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400 dark:text-slate-500">
                      <User className="w-8 h-8 text-sky-400 mb-1" />
                      <span className="text-[9px] font-bold uppercase leading-tight">Passport Photo</span>
                    </div>
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold">
                      Uploading...
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Candidate Passport Photograph *
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Auto-Binds to Certificate
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upload your passport photo now. It will automatically be printed on your official government-accredited completion certificate and verified badge.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="cursor-pointer px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{studentPhotoUrl ? 'Change Photo' : 'Upload Passport Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                    </label>

                    {studentPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setStudentPhotoUrl('')}
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" /> Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-500" /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. rohan.sharma@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-500" /> WhatsApp / Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-500" /> College / University Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. NIT Patna / IIT BHU / DTU"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-500" /> Degree / Course *
                  </label>
                  <input
                    type="text"
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech / BCA / MCA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-sky-500" /> Branch / Specialization
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE / IT / ECE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-500" /> Semester / Year
                  </label>
                  <input
                    type="text"
                    value={semesterYear}
                    onChange={(e) => setSemesterYear(e.target.value)}
                    placeholder="e.g. 6th Sem / 3rd Year"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    University Roll / Registration No
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="e.g. 23BCSE089"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-sky-500" /> Key Technical Skills
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. React, Node.js, Python, SQL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedToDocs}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
                >
                  <span>Next: Upload Documents (Optional)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Document Uploads & OCR (Completely Optional) */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Optional Notice Banner */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Document Upload is Optional at this Stage</span>
                </div>
                <p className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-relaxed">
                  If you have your College NOC, Student ID, or Resume ready, upload them below for instant OCR validation.
                  If you do not have them right now, <b>you can skip and proceed immediately</b>, and submit them later during onboarding.
                </p>
              </div>

              {/* Upload Cards */}
              <div className="space-y-3">
                {documentCategories.map((docType) => {
                  const uploaded = uploadedDocs.find((d) => d.documentType === docType);
                  const title =
                    docType === 'NOC'
                      ? 'College No Objection Certificate (NOC)'
                      : docType === 'College_ID'
                      ? 'College Student ID Card'
                      : docType === 'Resume'
                      ? 'Curriculum Vitae / Resume'
                      : docType;

                  return (
                    <div
                      key={docType}
                      className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sky-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            Optional
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Accepted: PDF, PNG, JPG (Max 15MB)
                        </div>
                      </div>

                      {uploaded ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="truncate max-w-[140px]">{uploaded.originalFilename}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(docType)}
                            title="Remove Document"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            onChange={(e) => handleFileUpload(e, docType)}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* OCR Extracted Data Preview (if NOC uploaded) */}
              {ocrData && ocrData.extracted && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-sky-200 dark:border-sky-900/60 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>NOC OCR Auto-Inspection (Confidence: {Math.round((ocrData.confidence || 0.95) * 100)}%)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Candidate Name:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{ocrData.extracted.student_name || studentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">College / University:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{ocrData.extracted.college_name || collegeName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation CTA Buttons */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={handleProceedToOtp}
                  disabled={loading}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Processing...</span>
                  ) : uploadedDocs.length === 0 ? (
                    <>
                      <span>Skip & Proceed to Email Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Proceed to Email Verification ({uploadedDocs.length} Uploaded)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Email OTP Verification */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/60 border-2 border-sky-500 rounded-full flex items-center justify-center mx-auto text-sky-500 shadow-md">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-heading font-extrabold text-slate-900 dark:text-white text-lg">
                  Application Security Verification
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  We have dispatched a 6-digit verification OTP code to{' '}
                  <span className="text-sky-600 dark:text-sky-400 font-bold">{studentEmail}</span>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-48 text-center tracking-[0.4em] font-mono text-2xl py-3 bg-slate-50 dark:bg-slate-950 border-2 border-sky-500 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-400 mx-auto block shadow-lg shadow-sky-500/10"
                />
                {devOtpHint && (
                  <div className="text-[10px] text-amber-500 font-mono mt-1.5">
                    [Development Testing Hint: {devOtpHint}]
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Didn't receive verification code?</span>
                <button
                  type="button"
                  disabled={resendingOtp}
                  onClick={async () => {
                    setResendingOtp(true);
                    try {
                      const res = await api.sendApplyOtp({ email: studentEmail, student_name: studentName });
                      if (res.devOtp) setDevOtpHint(res.devOtp);
                      toast('Fresh OTP code dispatched to your email inbox.', 'info');
                    } catch (e: any) {
                      toast('Failed to resend code.', 'error');
                    } finally {
                      setResendingOtp(false);
                    }
                  }}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-bold disabled:opacity-50"
                >
                  {resendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-2/3 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Confirming Application...' : 'Submit Official Application'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success & Tracking ID Confirmation */}
          {step === 4 && (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 bg-emerald-500/15 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Official Application Logged
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Application Submitted Successfully!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Thank you, <span className="font-bold text-slate-900 dark:text-white">{studentName}</span>. Your application for <span className="text-sky-600 dark:text-sky-400 font-bold">{internship.title}</span> has been logged under our 48-Hour review SLA.
                </p>
              </div>

              {/* Highlighted Tracking Number Card with 1-Click Copy */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-sky-400 dark:border-sky-500/60 rounded-3xl max-w-sm mx-auto space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Unique Application Tracking Number
                </div>
                <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono tracking-wider">
                  {generatedRegNo}
                </div>
                <button
                  type="button"
                  onClick={handleCopyRegNo}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-sky-400 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-sky-500" />
                      <span>Copy Tracking Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Lifecycle explanation roadmap */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs max-w-md mx-auto space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span>Next Steps in Your Onboarding:</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px] list-disc list-inside">
                  <li>HR will review your profile & application details.</li>
                  <li>Your official Offer Letter will be issued directly to <b>{studentEmail}</b>.</li>
                  <li>Click <b>Accept Offer</b> from your email to unlock your Student Portal.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                <a
                  href={`/?view=verify&id=${generatedRegNo}`}
                  className="w-full sm:w-1/2 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Track Status Live &rarr;</span>
                </a>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-full sm:w-1/2 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all block"
                >
                  Return to Programs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
