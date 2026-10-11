import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Award,
  CreditCard,
  Mail,
  Settings,
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  RotateCw,
  Send,
  Lock,
  ChevronRight,
  Eye,
  Trash2,
  BookOpen,
  GraduationCap,
  Layers,
  UserCheck,
  Key,
  KeyRound,
  Copy,
  Check,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Edit,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Internship,
  InternshipApplication,
  OfferLetter,
  PaymentRecord,
  Certificate,
  LetterOfRecommendation,
} from '../../types';
import { CertificateViewer } from '../../components/documents/CertificateViewer';

export const AdminPanel: React.FC = () => {
  const { user, toast } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'stats' | 'batches' | 'students' | 'teachers' | 'applications' | 'offers' | 'documents' | 'payments' | 'programs' | 'emails' | 'audit' | 'settings'
  >('stats');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [recentPays, setRecentPays] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [certSettings, setCertSettings] = useState<any>({
    cert_company_name: 'AAGAM DIGITAL TECHNOLOGY PVT. LTD.',
    cert_tagline: 'LEARN • BUILD • INNOVATE',
    cert_iso_text: 'An ISO 9001: 2015 certified',
    cert_mca_text: 'Registered Under Ministry of Corporate Affairs, Govt. of India',
    cert_cin_number: 'Corporate Identification No. : U80904BR2021PTC054517',
    cert_ribbon_title: 'CERTIFICATE OF INDUSTRIAL INTERNSHIP EXCELLENCE',
    cert_corporate_office: 'Corporate office: Dak Bunglow Chauraha Near Biscoman Tower Patna',
    cert_director_name: 'Ayush Raj',
    cert_director_title: 'Director',
    cert_instructor_name: 'Akash Verma',
    cert_instructor_title: 'Course Instructor',
  });
  const [certSettingsSaving, setCertSettingsSaving] = useState(false);

  // Admin Change Password Modal State
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminPassLoading, setAdminPassLoading] = useState(false);
  const [showAdminPassPlain, setShowAdminPassPlain] = useState(false);

  // Student Credential Manager Modal State
  const [showCredModal, setShowCredModal] = useState(false);
  const [selectedStudentForCred, setSelectedStudentForCred] = useState<any | null>(null);
  const [credCustomPassword, setCredCustomPassword] = useState('');
  const [credAutoGenerate, setCredAutoGenerate] = useState(true);
  const [credLoading, setCredLoading] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Email System Test State
  const [testEmailTo, setTestEmailTo] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Student Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentYearFilter, setStudentYearFilter] = useState('All');
  const [studentCourseFilter, setStudentCourseFilter] = useState('All');

  const [offerSearchTerm, setOfferSearchTerm] = useState('');
  const [batchCertStartDate, setBatchCertStartDate] = useState('');
  const [batchCertEndDate, setBatchCertEndDate] = useState('');
  const [batchLorStartDate, setBatchLorStartDate] = useState('');
  const [batchLorEndDate, setBatchLorEndDate] = useState('');

  // Generation Modals state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedAppForOffer, setSelectedAppForOffer] = useState<InternshipApplication | null>(null);
  const [offerStartDate, setOfferStartDate] = useState('2026-11-01');
  const [offerEndDate, setOfferEndDate] = useState('2026-12-31');
  const [offerDuration, setOfferDuration] = useState('8 Weeks');
  const [offerFeeAmount, setOfferFeeAmount] = useState<number>(0);
  const [offerFeeReason, setOfferFeeReason] = useState<string>('Workspace infrastructure & digital credential registry');
  const [offerStipend, setOfferStipend] = useState<string>('Performance-based Stipend + LOR');
  const [offerTerms, setOfferTerms] = useState(
    '1. Intellectual Property rights belong to AAGAM Digital Technology.\n2. Adherence to engineering milestones & NDA guidelines is mandatory.\n3. Upon successful evaluation, official Certificate and LOR will be awarded.'
  );

  // Batch Management Modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTitle, setBatchTitle] = useState('');
  const [batchDepartment, setBatchDepartment] = useState('Software Engineering');
  const [batchProgramType, setBatchProgramType] = useState('internship');
  const [batchMaxSeats, setBatchMaxSeats] = useState(60);
  const [batchProgId, setBatchProgId] = useState('');
  const [batchStartDate, setBatchStartDate] = useState('2026-11-01');
  const [batchEndDate, setBatchEndDate] = useState('2026-12-31');
  const [batchDurationWeeks, setBatchDurationWeeks] = useState(8);
  const [batchInstructorName, setBatchInstructorName] = useState('Ayush Raj (Senior Lead)');
  const [batchInstructorEmail, setBatchInstructorEmail] = useState('ayush.raj@aagamdigital.com');
  const [batchModulesJson, setBatchModulesJson] = useState(
    '[\n  {\n    "module_no": 1,\n    "title": "Module 1: Foundations & Architecture",\n    "description": "TypeScript, Asynchronous Programming & Core Architecture",\n    "lectures": [{"title": "Architecture Setup", "type": "video", "duration_mins": 60}],\n    "tasks": [{"title": "Sprint 1 Deliverable", "max_score": 100}]\n  },\n  {\n    "module_no": 2,\n    "title": "Module 2: RESTful API Engineering",\n    "description": "Enterprise Express/Node.js, Authentication & Database modeling",\n    "lectures": [{"title": "API Design & Security", "type": "video", "duration_mins": 90}],\n    "tasks": [{"title": "Build Auth & Data API", "max_score": 100}]\n  }\n]'
  );

  // Edit Batch & Curriculum Modules state
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [selectedBatchForEdit, setSelectedBatchForEdit] = useState<any>(null);
  const [editBatchTitle, setEditBatchTitle] = useState('');
  const [editBatchStartDate, setEditBatchStartDate] = useState('');
  const [editBatchEndDate, setEditBatchEndDate] = useState('');
  const [editBatchDurationWeeks, setEditBatchDurationWeeks] = useState(8);
  const [editBatchInstructorName, setEditBatchInstructorName] = useState('');
  const [editBatchInstructorEmail, setEditBatchInstructorEmail] = useState('');
  const [editBatchMaxSeats, setEditBatchMaxSeats] = useState(60);
  const [editBatchStatus, setEditBatchStatus] = useState('Active');
  const [editBatchModulesJson, setEditBatchModulesJson] = useState('[]');
  const [editBatchSaving, setEditBatchSaving] = useState(false);

  // Batch Students Detail View Modal
  const [selectedBatchForDetail, setSelectedBatchForDetail] = useState<any>(null);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [loadingBatchStudents, setLoadingBatchStudents] = useState(false);

  // Batch Student Document Issuance Dialogs
  const [showBatchCertModal, setShowBatchCertModal] = useState(false);
  const [showBatchLorModal, setShowBatchLorModal] = useState(false);
  const [targetStudentForDoc, setTargetStudentForDoc] = useState<any>(null);
  const [batchCertGrade, setBatchCertGrade] = useState('Grade: A+ (Outstanding Performance)');
  const [batchLorRating, setBatchLorRating] = useState('Exceptional Performance (Top 5%)');
  const [batchLorBody, setBatchLorBody] = useState('Demonstrated outstanding technical problem solving, rigorous code quality, and proactive leadership throughout the tenure.');

  // Teacher / Faculty Modal state
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherDept, setTeacherDept] = useState('Software Engineering');
  const [teacherDesignation, setTeacherDesignation] = useState('Instructor & Technical Mentor');

  // Bulk Students State
  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false);
  const [bulkStudentsJson, setBulkStudentsJson] = useState(
    '[\n  {\n    "student_name": "Rohan Kumar",\n    "student_email": "candidate1@example.com",\n    "college_name": "NIT Patna",\n    "course": "B.Tech CSE"\n  }\n]'
  );
  const [bulkLoading, setBulkLoading] = useState(false);

  // Standalone Certificate / LOR modal
  const [showCertModal, setShowCertModal] = useState(false);
  const [certStudentName, setCertStudentName] = useState('');
  const [certCollege, setCertCollege] = useState('');
  const [certProgram, setCertProgram] = useState('');
  const [certDuration, setCertDuration] = useState('8 Weeks');
  const [certGrade, setCertGrade] = useState('Grade: A+ (Outstanding)');

  const [showLorModal, setShowLorModal] = useState(false);
  const [lorStudentName, setLorStudentName] = useState('');
  const [lorCollege, setLorCollege] = useState('');
  const [lorProgram, setLorProgram] = useState('');
  const [lorRating, setLorRating] = useState('Outstanding / Top 5%');

  // Program Modal
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [progTitle, setProgTitle] = useState('');
  const [progDept, setProgDept] = useState('Software Engineering');
  const [progTech, setProgTech] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progDuration, setProgDuration] = useState('8 Weeks');
  const [progEligibility, setProgEligibility] = useState('B.Tech / BCA / MCA students');
  const [progSkills, setProgSkills] = useState('JavaScript, React, Node.js');
  const [progMode, setProgMode] = useState<'Remote' | 'Hybrid' | 'Onsite'>('Remote');
  const [progSeats, setProgSeats] = useState(50);
  const [progFee, setProgFee] = useState(0);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, batchesRes, teachersRes, stuRes, appRes, intRes, payRes, emailTplRes, emailLogRes, auditRes, setRes, offersRes, certSetRes] =
        await Promise.all([
          api.getAdminStats(),
          api.getBatches(),
          api.getTeachers(),
          api.getAdminStudents(),
          api.getAdminApplications(),
          api.getInternships(),
          api.getAdminPayments(),
          api.getEmailTemplates(),
          api.getEmailLogs(),
          api.getAuditLogs(),
          api.getSettings(),
          api.getAdminOffers().catch(() => ({ success: false, offers: [] })),
          api.getAdminCertificateSettings().catch(() => ({ success: false, settings: {} })),
        ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setRecentApps(statsRes.recentApplications || []);
        setRecentPays(statsRes.recentPayments || []);
      }
      if (batchesRes.success) setBatches(batchesRes.batches || []);
      if (teachersRes.success) setTeachers(teachersRes.teachers || []);
      if (stuRes.success) setStudents(stuRes.students || []);
      if (appRes.success) setApplications(appRes.applications || []);
      if (intRes.success) setInternships(intRes.internships || []);
      if (payRes.success) {
        setPayments(payRes.payments || []);
        setPaymentStats(payRes.stats);
      }
      if (emailTplRes.success) setEmailTemplates(emailTplRes.templates || []);
      if (emailLogRes.success) setEmailLogs(emailLogRes.logs || []);
      if (auditRes.success) setAuditLogs(auditRes.logs || []);
      if (setRes.success) setSettings(setRes.settings || []);
      if (offersRes && offersRes.success) setOffers(offersRes.offers || []);
      if (certSetRes && certSetRes.success && certSetRes.settings) {
        setCertSettings((prev: any) => ({ ...prev, ...certSetRes.settings }));
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCertSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertSettingsSaving(true);
    try {
      const res = await api.updateAdminCertificateSettings(certSettings);
      toast(res.message || 'Certificate layout & license settings updated successfully!', 'success');
      loadAllAdminData();
    } catch (err: any) {
      toast(err.message || 'Failed to update certificate settings.', 'error');
    } finally {
      setCertSettingsSaving(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const openBatchDetail = async (batch: any) => {
    setSelectedBatchForDetail(batch);
    setLoadingBatchStudents(true);
    try {
      const res = await api.getBatchStudents(batch.id);
      if (res.success) {
        setBatchStudents(res.students || []);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load batch students', 'error');
    } finally {
      setLoadingBatchStudents(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedModules = [];
      try {
        parsedModules = JSON.parse(batchModulesJson);
      } catch (e) {
        throw new Error('Curriculum modules must be valid JSON');
      }

      const res = await api.createBatch({
        title: batchTitle,
        department: batchDepartment,
        program_type: batchProgramType,
        max_seats: Number(batchMaxSeats) || 60,
        program_id: batchProgId || null,
        start_date: batchStartDate,
        end_date: batchEndDate,
        duration_weeks: Number(batchDurationWeeks) || 8,
        instructor_name: batchInstructorName,
        instructor_email: batchInstructorEmail,
        curriculum_modules: parsedModules,
      });

      if (res.success) {
        toast(res.message || 'Batch created successfully!', 'success');
        setShowBatchModal(false);
        setBatchTitle('');
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to create batch', 'error');
    }
  };

  const openEditBatchModal = (batch: any) => {
    setSelectedBatchForEdit(batch);
    setEditBatchTitle(batch.title || '');
    setEditBatchStartDate(batch.start_date || '');
    setEditBatchEndDate(batch.end_date || '');
    setEditBatchDurationWeeks(batch.duration_weeks || 8);
    setEditBatchInstructorName(batch.instructor_name || '');
    setEditBatchInstructorEmail(batch.instructor_email || '');
    setEditBatchMaxSeats(batch.max_seats || 60);
    setEditBatchStatus(batch.status || 'Active');

    let modStr = '[]';
    if (batch.curriculum_modules) {
      if (typeof batch.curriculum_modules === 'string') {
        try {
          modStr = JSON.stringify(JSON.parse(batch.curriculum_modules), null, 2);
        } catch (e) {
          modStr = batch.curriculum_modules;
        }
      } else {
        modStr = JSON.stringify(batch.curriculum_modules, null, 2);
      }
    }
    setEditBatchModulesJson(modStr);
    setShowEditBatchModal(true);
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForEdit) return;
    setEditBatchSaving(true);
    try {
      let parsedModules = [];
      try {
        parsedModules = JSON.parse(editBatchModulesJson);
        if (!Array.isArray(parsedModules)) {
          throw new Error('Curriculum modules must be an array of objects.');
        }
      } catch (err: any) {
        throw new Error(err.message || 'Curriculum Modules must be a valid JSON array.');
      }

      const res = await api.updateBatch(selectedBatchForEdit.id, {
        title: editBatchTitle,
        start_date: editBatchStartDate,
        end_date: editBatchEndDate,
        duration_weeks: Number(editBatchDurationWeeks),
        instructor_name: editBatchInstructorName,
        instructor_email: editBatchInstructorEmail,
        max_seats: Number(editBatchMaxSeats),
        status: editBatchStatus,
        curriculum_modules: parsedModules,
      });

      if (res.success) {
        toast(`Batch "${editBatchTitle}" and curriculum modules updated successfully!`, 'success');
        setShowEditBatchModal(false);
        setSelectedBatchForEdit(null);
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update batch and modules', 'error');
    } finally {
      setEditBatchSaving(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createTeacher({
        full_name: teacherName,
        email: teacherEmail,
        phone: teacherPhone,
        department: teacherDept,
        designation: teacherDesignation,
      });

      if (res.success) {
        toast(res.message || 'Faculty registered & credentials sent!', 'success');
        setShowTeacherModal(false);
        setTeacherName('');
        setTeacherEmail('');
        setTeacherPhone('');
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to register faculty member', 'error');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to remove this faculty record?')) return;
    try {
      const res = await api.deleteTeacher(teacherId);
      if (res.success) {
        toast('Teacher record removed.', 'success');
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete teacher', 'error');
    }
  };

  const handleIssueBatchCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForDetail || !targetStudentForDoc) return;
    try {
      const res = await api.issueBatchCertificate(selectedBatchForDetail.id, {
        user_id: targetStudentForDoc.user_id,
        student_id: targetStudentForDoc.student_id,
        grade_or_remarks: batchCertGrade,
        start_date: batchCertStartDate || selectedBatchForDetail.start_date,
        end_date: batchCertEndDate || selectedBatchForDetail.end_date,
      });

      if (res.success) {
        toast(res.message || `Certificate ${res.certificate_id} issued!`, 'success');
        setShowBatchCertModal(false);
        setTargetStudentForDoc(null);
        openBatchDetail(selectedBatchForDetail);
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to issue certificate', 'error');
    }
  };

  const handleIssueBatchLor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForDetail || !targetStudentForDoc) return;
    try {
      const res = await api.issueBatchLor(selectedBatchForDetail.id, {
        user_id: targetStudentForDoc.user_id,
        student_id: targetStudentForDoc.student_id,
        performance_rating: batchLorRating,
        recommendation_body: batchLorBody,
        start_date: batchLorStartDate || selectedBatchForDetail.start_date,
        end_date: batchLorEndDate || selectedBatchForDetail.end_date,
      });

      if (res.success) {
        toast(res.message || `LOR ${res.lor_id} issued!`, 'success');
        setShowBatchLorModal(false);
        setTargetStudentForDoc(null);
        openBatchDetail(selectedBatchForDetail);
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to issue LOR', 'error');
    }
  };

  const handleVerifyAndAcceptOffer = async (offerId: string) => {
    try {
      const res = await api.verifyAndAcceptOffer(offerId);
      if (res.success) {
        toast(res.message || 'Offer verified and student enrolled into cohort!', 'success');
        if (res.provision?.user && res.provision?.tempPassword) {
          setSelectedStudentForCred({
            full_name: res.provision.user.full_name,
            email: res.provision.user.email,
            registration_no: res.provision.user.registration_no,
          });
          setGeneratedCreds({
            email: res.provision.user.email,
            password: res.provision.tempPassword,
            full_name: res.provision.user.full_name,
            registration_no: res.provision.user.registration_no,
          });
          setShowCredModal(true);
        }
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to verify offer', 'error');
    }
  };

  const handleGenerateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForOffer) return;

    try {
      const res = await api.generateAdminOffer({
        application_id: selectedAppForOffer.id,
        start_date: offerStartDate,
        end_date: offerEndDate,
        duration: offerDuration,
        fee_amount: Number(offerFeeAmount) || 0,
        fee_reason: offerFeeReason,
        stipend_amount: 0,
        stipend_fee_text: offerStipend,
        terms_conditions: offerTerms,
      });

      if (res.success) {
        const offerNo = res.offerId || res.offer?.offer_id || 'Generated';
        toast(`Offer Letter ${offerNo} generated & dispatched to ${selectedAppForOffer.student_email}!`, 'success');
        setShowOfferModal(false);
        setSelectedAppForOffer(null);
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to generate offer', 'error');
    }
  };

  const handleProvisionNow = async (targetId: string) => {
    try {
      const res = await api.provisionNow(targetId);
      if (res.success) {
        toast(res.message || 'Student workspace & credentials provisioned immediately!', 'success');
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to provision student credentials', 'error');
    }
  };

  const handleOpenCredModal = (student: any) => {
    setSelectedStudentForCred(student);
    setCredCustomPassword('');
    setCredAutoGenerate(true);
    setGeneratedCreds(null);
    setShowCredModal(true);
  };

  const handleGenerateStudentCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForCred) return;
    setCredLoading(true);
    try {
      const target = selectedStudentForCred.user_id || selectedStudentForCred.student_id || selectedStudentForCred.email;
      const res = await api.setStudentCredentials({
        target_id: target,
        password: credAutoGenerate ? undefined : credCustomPassword,
        auto_generate: credAutoGenerate,
      });
      if (res.success) {
        toast(res.message || 'Credentials generated successfully!', 'success');
        setGeneratedCreds(res.credentials || {
          email: res.user?.email || selectedStudentForCred.email,
          password: res.tempPassword,
          name: res.user?.full_name || selectedStudentForCred.full_name,
          registration_no: res.user?.registration_no || selectedStudentForCred.registration_no,
        });
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to generate credentials', 'error');
    } finally {
      setCredLoading(false);
    }
  };

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast(`${field} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewPass || adminNewPass.length < 6) {
      toast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (adminNewPass !== adminConfirmPass) {
      toast('New password and confirm password do not match.', 'error');
      return;
    }
    setAdminPassLoading(true);
    try {
      const res = await api.changeAdminPassword({
        current_password: adminCurrentPass || undefined,
        new_password: adminNewPass,
        confirm_password: adminConfirmPass,
      });
      if (res.success) {
        toast(res.message || 'Admin password updated successfully!', 'success');
        setAdminCurrentPass('');
        setAdminNewPass('');
        setAdminConfirmPass('');
        setShowAdminPassModal(false);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to change admin password', 'error');
    } finally {
      setAdminPassLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo) {
      toast('Please enter a recipient email address', 'error');
      return;
    }
    setSendingTestEmail(true);
    try {
      const res = await api.sendTestEmail({ to: testEmailTo, templateKey: 'otp_verification' });
      if (res.success) {
        toast(`Test email dispatched to ${testEmailTo}!`, 'success');
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to send test email', 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleBulkRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true);
    try {
      const parsed = JSON.parse(bulkStudentsJson);
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of student objects.');
      const res = await api.bulkRegisterStudents({ students: parsed });
      if (res.success) {
        toast(`Successfully registered students!`, 'success');
        setShowBulkStudentModal(false);
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Bulk registration failed. Check JSON format.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.saveInternship({
        title: progTitle,
        department: progDept,
        technology: progTech,
        description: progDesc,
        duration: progDuration,
        eligibility: progEligibility,
        skills_required: progSkills,
        mode: progMode,
        location: 'Online / Pan-India',
        start_date: '2026-11-01',
        application_deadline: '2026-10-31',
        total_seats: progSeats,
        fee_amount: progFee,
        is_paid: progFee > 0 ? 1 : 0,
        required_documents: ['NOC', 'College_ID', 'Resume'],
        ocr_enabled: 1,
        status: 'Active',
      });
      if (res.success) {
        toast('New internship program published successfully!', 'success');
        setShowProgramModal(false);
        setProgTitle('');
        setProgTech('');
        setProgDesc('');
        loadAllAdminData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to publish internship', 'error');
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !studentSearch ||
      s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.registration_no?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.college_name?.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesYear =
      studentYearFilter === 'All' ||
      s.semester_year?.toLowerCase().includes(studentYearFilter.toLowerCase());

    const matchesCourse =
      studentCourseFilter === 'All' ||
      s.course?.toLowerCase().includes(studentCourseFilter.toLowerCase());

    return matchesSearch && matchesYear && matchesCourse;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-purple-500 to-sky-500">
              <img src="/aagam-logo.jpg" alt="Logo" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <div className="truncate">
              <div className="font-heading font-bold text-sm text-white">AAGAM ERP</div>
              <div className="text-[10px] text-rose-400 font-semibold">{user?.full_name || 'Admin'}</div>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'stats' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Executive Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('batches')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'batches' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Cohorts & Curriculum</span>
              {batches.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-amber-300 font-bold">
                  {batches.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'students' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Students Registry</span>
              {students.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-purple-300">
                  {students.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'teachers' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Faculty & Mentors</span>
              {teachers.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-indigo-300">
                  {teachers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'applications' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Applications</span>
              {applications.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-purple-300">
                  {applications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'offers' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Offer Letters</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'documents' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certificates & LORs</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'payments' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Finance & Revenue</span>
            </button>

            <button
              onClick={() => setActiveTab('programs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'programs' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-sky-400" />
              <span>Program Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('emails')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'emails' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Email System</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'audit' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Audit Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'settings' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>System Settings</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setShowAdminPassModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition-all shadow-sm"
          >
            <Key className="w-3.5 h-3.5 text-rose-400" />
            <span>Admin Password</span>
          </button>
          <div className="text-[10px] text-slate-500 text-center font-mono">
            AAGAM Enterprise ERP
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-8">
        {/* VIEW 1: STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Executive Control Center</h1>
                <p className="text-xs text-slate-400 mt-1">Real-time enterprise metrics, live student registries, and cohort operations.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Batch</span>
                </button>
                <button
                  onClick={() => setShowTeacherModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Add Faculty</span>
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-slate-400 text-xs font-medium">Total Registered Users</div>
                <div className="text-2xl font-heading font-black text-white mt-1">
                  {stats?.totalRegistrations || 0}
                </div>
                <div className="text-[10px] text-sky-400 mt-1">Verified Platform Accounts</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-slate-400 text-xs font-medium">Active Cohorts / Batches</div>
                <div className="text-2xl font-heading font-black text-amber-400 mt-1">
                  {stats?.totalBatches || batches.length}
                </div>
                <div className="text-[10px] text-amber-500 mt-1">Curriculum Sprints Active</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-slate-400 text-xs font-medium">Faculty & Instructors</div>
                <div className="text-2xl font-heading font-black text-indigo-400 mt-1">
                  {stats?.totalTeachers || teachers.length}
                </div>
                <div className="text-[10px] text-indigo-400 mt-1">Academic Mentors</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-slate-400 text-xs font-medium">Total Revenue (₹)</div>
                <div className="text-2xl font-heading font-black text-emerald-400 mt-1">
                  ₹{stats?.totalCollection || 0}
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">Gateway Settlement</div>
              </div>
            </div>

            {/* Live Active Batches List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg text-white">Active Batches & Cohorts</h3>
                <button onClick={() => setActiveTab('batches')} className="text-xs text-sky-400 hover:underline">
                  Manage All Batches &rarr;
                </button>
              </div>

              {batches.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No active batches created yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batches.map((b) => (
                    <div key={b.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {b.batch_code}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {b.duration_weeks} Weeks • {b.start_date} to {b.end_date}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-white">{b.title}</h4>
                      <div className="text-xs text-slate-400">
                        Instructor: <strong className="text-slate-200">{b.instructor_name}</strong>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                        <span className="text-xs text-slate-400">Enrolled: {b.enrolled_count || 0}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditBatchModal(b)}
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1"
                            title="Edit batch timeline & modules"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => openBatchDetail(b)}
                            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-lg border border-rose-500/30 transition-colors"
                          >
                            Students &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: BATCHES & COHORTS */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Cohorts & Curriculum Engine</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Create engineering cohorts, structure multi-module curriculum, and issue certificates/LORs directly.
                </p>
              </div>

              <button
                onClick={() => setShowBatchModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Cohort</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((b) => (
                <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                        {b.batch_code}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                        {b.status}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-white">{b.title}</h3>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>Timeline: <strong className="text-slate-300">{b.start_date} to {b.end_date}</strong></div>
                      <div>Faculty Lead: <strong className="text-slate-300">{b.instructor_name}</strong></div>
                      <div>Enrolled: <strong className="text-amber-400">{b.enrolled_count || 0} Students</strong></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEditBatchModal(b)}
                      className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit & Modules</span>
                    </button>
                    <button
                      onClick={() => openBatchDetail(b)}
                      className="py-2.5 px-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1"
                    >
                      <span>Students & Docs &rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: STUDENTS REGISTRY WITH FILTERS */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Student Engineering Registry</h1>
                <p className="text-xs text-slate-400 mt-1">Filter by academic year, course, and enrollment status.</p>
              </div>

              <button
                onClick={() => setShowBulkStudentModal(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700"
              >
                + Bulk Register Students
              </button>
            </div>

            {/* Filters Bar */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by student name, email, or college..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={studentYearFilter}
                onChange={(e) => setStudentYearFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Academic Years</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year / Final Year</option>
                <option value="2026">Class of 2026</option>
              </select>

              <select
                value={studentCourseFilter}
                onChange={(e) => setStudentCourseFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Engineering Courses</option>
                <option value="B.Tech">B.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="B.Sc">B.Sc Computer Science</option>
              </select>
            </div>

            {/* Students Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">No student records found matching filter.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-4">Reg No</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">College</th>
                        <th className="p-4">Course & Year</th>
                        <th className="p-4">Docs Conferred</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredStudents.map((s) => (
                        <tr key={s.user_id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-mono text-amber-400 font-bold">
                            {s.registration_no || 'Pending'}
                          </td>
                          <td className="p-4 font-bold text-white">{s.full_name}</td>
                          <td className="p-4 font-mono text-slate-300">{s.email}</td>
                          <td className="p-4 text-slate-300 truncate max-w-xs">{s.college_name || 'N/A'}</td>
                          <td className="p-4 text-slate-400">
                            {s.course || 'B.Tech'} • {s.semester_year || '3rd Year'}
                          </td>
                          <td className="p-4">
                            <span className="text-emerald-400 font-bold">{s.cert_count || 0} Certs</span> /{' '}
                            <span className="text-sky-400 font-bold">{s.lor_count || 0} LORs</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenCredModal(s)}
                                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                                title="Generate or customize login credentials and password"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>ID & Password</span>
                              </button>
                              <button
                                onClick={() => handleProvisionNow(s.user_id || s.student_id || s.email)}
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-colors flex items-center gap-1"
                                title="Instant 1-click password generation & email dispatch"
                              >
                                <span>⚡ Quick</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: FACULTY & TEACHERS */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Faculty & Instructor Directory</h1>
                <p className="text-xs text-slate-400 mt-1">Manage technical mentors, cohort leads, and faculty portal logins.</p>
              </div>

              <button
                onClick={() => setShowTeacherModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Faculty Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((t) => (
                <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg font-heading">
                      {t.full_name?.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{t.full_name}</h3>
                      <div className="text-xs text-indigo-400 font-semibold">{t.designation}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div>Employee ID: <strong className="font-mono text-slate-200">{t.employee_id}</strong></div>
                    <div>Email: <strong className="text-slate-200">{t.email}</strong></div>
                    <div>Department: <strong className="text-slate-200">{t.department}</strong></div>
                    <div>Contact: <strong className="text-slate-200">{t.phone || 'N/A'}</strong></div>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Active Faculty
                    </span>
                    <button
                      onClick={() => handleDeleteTeacher(t.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Internship Applications Review</h1>
                <p className="text-xs text-slate-400 mt-1">Review candidates, verify submissions, and generate appointment letters.</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {applications.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">No pending applications in queue.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-4">App Ref</th>
                        <th className="p-4">Candidate</th>
                        <th className="p-4">Email / Phone</th>
                        <th className="p-4">Program</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-mono text-amber-400 font-bold">{app.application_no}</td>
                          <td className="p-4 font-bold text-white">{app.student_name}</td>
                          <td className="p-4 text-slate-300">
                            <div>{app.student_email}</div>
                            <div className="text-slate-500 text-[10px] font-mono">{app.student_phone}</div>
                          </td>
                          <td className="p-4 text-slate-300 font-medium">{app.internship_title}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                app.status === 'Selected' || app.status === 'Offer Generated' || app.status === 'Offer Accepted'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-sky-500/20 text-sky-400'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setSelectedAppForOffer(app);
                                setShowOfferModal(true);
                              }}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                            >
                              Generate Offer &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 6: DOCUMENTS ENGINE */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Certificates & LOR Engine</h1>
                <p className="text-xs text-slate-400 mt-1">Issue verifiable executive documents signed by CEO Ayush Raj & Head of HR Akash Verma.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Certificate & License Settings</span>
                </button>
                <button
                  onClick={() => setShowCertModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  + Issue Certificate
                </button>
                <button
                  onClick={() => setShowLorModal(true)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  + Issue LOR
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <h3 className="font-heading font-bold text-base text-white">Central Verification Ledger & Instructions</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Every certificate and letter of recommendation generated through AAGAM Digital Technology is assigned an immutable alphanumeric identifier (e.g. <span className="font-mono text-emerald-400">AAGAM-CERT-2026-000001</span>) with an SHA-256 tamper-proof QR code. Documents are publicly verifiable worldwide via the <strong className="text-white">Verify Engine</strong>.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 7: PAYMENTS & RAZORPAY */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-black text-3xl text-white">Financials & Gateway Transactions</h1>
              <p className="text-xs text-slate-400 mt-1">Live reconciliation of onboarding fee payments and invoices.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {payments.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">No transactions recorded in ledger.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-4">Ref No</th>
                        <th className="p-4">Candidate</th>
                        <th className="p-4">Purpose</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-mono font-bold text-sky-400">{p.payment_no}</td>
                          <td className="p-4 font-bold text-white">{p.student_name}</td>
                          <td className="p-4 text-slate-300">{p.purpose}</td>
                          <td className="p-4 font-bold text-emerald-400">₹{p.amount}</td>
                          <td className="p-4 font-mono text-slate-400">{p.razorpay_order_id}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 8: OFFER LETTERS REGISTRY */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Offer Letters & Candidate Provisioning</h1>
                <p className="text-xs text-slate-400 mt-1">Verifiable appointment documents, transparent fees, WhatsApp receipt verification (+91 7079823919), and candidate workspace activation.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400 font-mono">
                  {offers.length} Offers Total
                </span>
              </div>
            </div>

            {/* Candidate Search Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={offerSearchTerm}
                onChange={(e) => setOfferSearchTerm(e.target.value)}
                placeholder="Search by Candidate Phone Number (e.g. 7079823919), Name, Email, or Offer ID..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {offerSearchTerm && (
                <button
                  onClick={() => setOfferSearchTerm('')}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {offers.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">No offer letters have been issued yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-4">Offer ID</th>
                        <th className="p-4">Candidate & Phone</th>
                        <th className="p-4">Program & Duration</th>
                        <th className="p-4">Fee / Track</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Workspace</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {offers
                        .filter((o: any) => {
                          if (!offerSearchTerm) return true;
                          const term = offerSearchTerm.toLowerCase();
                          return (
                            o.offer_id?.toLowerCase().includes(term) ||
                            o.student_name?.toLowerCase().includes(term) ||
                            o.student_phone?.toLowerCase().includes(term) ||
                            o.user_phone?.toLowerCase().includes(term) ||
                            o.user_email?.toLowerCase().includes(term) ||
                            o.app_email?.toLowerCase().includes(term) ||
                            o.internship_title?.toLowerCase().includes(term)
                          );
                        })
                        .map((o: any) => (
                        <tr key={o.id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-mono font-bold text-amber-400">{o.offer_id}</td>
                          <td className="p-4">
                            <div className="font-bold text-white">{o.student_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{o.user_email || o.app_email}</div>
                            <div className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                              📞 {o.student_phone || '7079823919'}
                            </div>
                          </td>
                          <td className="p-4 text-slate-300">
                            <div>{o.internship_title}</div>
                            <div className="text-[10px] text-slate-500">{o.duration} • Starts {o.start_date}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-emerald-400">
                              {o.payable_amount > 0 ? `₹${o.payable_amount}` : 'Free Track'}
                            </div>
                            {o.utr_number && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  UTR: {o.utr_number}
                                </span>
                                <div className="text-[9px] text-slate-400 mt-0.5 font-medium">
                                  Payment: <span className={o.payment_status === 'Success' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{o.payment_status || 'Pending Verification'}</span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400">
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                o.provisioning_status === 'Provisioned'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {o.provisioning_status || 'Pending'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/?view=accept-offer&offerId=${o.offer_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>View</span>
                              </a>
                              {o.status !== 'Accepted' && (
                                <button
                                  onClick={() => handleVerifyAndAcceptOffer(o.offer_id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                  title={o.utr_number ? `Verify UTR ${o.utr_number} & Accept Offer` : 'Verify payment and accept offer'}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{o.utr_number ? 'Verify & Accept UTR' : 'Verify & Accept'}</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenCredModal({
                                  full_name: o.student_name,
                                  email: o.user_email || o.app_email,
                                  registration_no: o.application_no,
                                  user_id: o.user_id,
                                  offer_id: o.offer_id,
                                })}
                                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-colors flex items-center gap-1"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>Credentials</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}


        {/* VIEW 9: PROGRAM & INTERNSHIP CATALOG */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Program & Internship Catalog</h1>
                <p className="text-xs text-slate-400 mt-1">Configure live engineering cohort offerings, curriculum syllabi, and student seats.</p>
              </div>

              <button
                onClick={() => setShowProgramModal(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish New Program</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map((int) => (
                <div key={int.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400">
                        {int.department}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {int.fee_amount > 0 ? `₹${int.fee_amount}` : 'Free Track'}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-white">{int.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{int.description}</p>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 font-mono">
                    <div>Duration: <strong className="text-slate-200">{int.duration}</strong></div>
                    <div>Mode: <strong className="text-sky-400">{int.mode}</strong></div>
                    <div>Capacity: <strong className="text-slate-200">{int.total_seats} Seats</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 10: EMAIL SYSTEM & LOGS */}
        {activeTab === 'emails' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-3xl text-white">Automated Corporate Email Engine</h1>
                <p className="text-xs text-slate-400 mt-1">Live SMTP notification templates, student credential triggers, and delivery audit trail.</p>
              </div>
            </div>

            {/* Test Email Dispatch Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <span>Test Live SMTP Email Delivery</span>
              </h3>
              <p className="text-xs text-slate-400">Dispatch a live test email through Gmail SMTP to verify server mail delivery.</p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  placeholder="Enter recipient email (e.g. your email@gmail.com)"
                  className="flex-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  className="w-full sm:w-auto px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg disabled:opacity-50 transition-colors"
                >
                  {sendingTestEmail ? 'Sending...' : 'Send Test Notification'}
                </button>
              </div>
            </div>

            {/* Email Templates Table */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-lg text-white">Configured Email Templates</h3>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-4">Event Key</th>
                        <th className="p-4">Template Name</th>
                        <th className="p-4">Email Subject Line</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {emailTemplates.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-mono font-bold text-amber-400">{t.event_key}</td>
                          <td className="p-4 font-bold text-white">{t.name}</td>
                          <td className="p-4 text-slate-300 font-mono text-[11px]">{t.subject}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Email Logs Table */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-lg text-white">Recent Email Delivery Logs</h3>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                {emailLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">No email logs recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-4">Recipient</th>
                          <th className="p-4">Event / Template</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Dispatched At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {emailLogs.slice(0, 25).map((l: any) => (
                          <tr key={l.id} className="hover:bg-slate-800/40">
                            <td className="p-4 font-mono font-bold text-sky-400">{l.recipient}</td>
                            <td className="p-4 font-bold text-slate-200">{l.template_key}</td>
                            <td className="p-4 text-slate-300 truncate max-w-xs">{l.subject}</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  l.status === 'Sent' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-slate-500 text-[11px]">{new Date(l.sent_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 11: AUDIT LEDGER */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-black text-3xl text-white">Security & Administrative Audit Ledger</h1>
              <p className="text-xs text-slate-400 mt-1">Immutable audit trail of all credential generations, offer updates, and privileged operations.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {auditLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">No audit logs in trail.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-4">Event Type</th>
                        <th className="p-4">Entity</th>
                        <th className="p-4">Actor</th>
                        <th className="p-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-mono font-bold text-rose-400">{log.action}</td>
                          <td className="p-4 text-slate-300 font-mono text-[11px]">
                            {log.target_table} ({log.target_id?.substring(0, 8) || 'N/A'})
                          </td>
                          <td className="p-4 font-bold text-slate-200">{log.actor_email || 'System / Admin'}</td>
                          <td className="p-4 font-mono text-slate-400 text-[11px]">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 12: SETTINGS & ADMIN PASSWORD */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-heading font-black text-3xl text-white">System Settings & Security Management</h1>
              <p className="text-xs text-slate-400 mt-1">Manage administrative login credentials, platform parameters, and corporate info.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ADMIN PASSWORD CHANGE CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-lg text-white">Change Admin Password</h3>
                    <p className="text-xs text-slate-400">Update your primary administrative password.</p>
                  </div>
                </div>

                <form onSubmit={handleChangeAdminPassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Current Admin Password</label>
                    <input
                      type="password"
                      value={adminCurrentPass}
                      onChange={(e) => setAdminCurrentPass(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">New Password (Min 6 Characters)</label>
                    <div className="relative">
                      <input
                        type={showAdminPassPlain ? 'text' : 'password'}
                        required
                        value={adminNewPass}
                        onChange={(e) => setAdminNewPass(e.target.value)}
                        placeholder="Enter new secure password"
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassPlain(!showAdminPassPlain)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showAdminPassPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                    <input
                      type={showAdminPassPlain ? 'text' : 'password'}
                      required
                      value={adminConfirmPass}
                      onChange={(e) => setAdminConfirmPass(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                    <div>• 2-Factor Authentication OTP is enabled on this administrative account.</div>
                    <div>• New password takes effect immediately for all subsequent logins.</div>
                  </div>

                  <button
                    type="submit"
                    disabled={adminPassLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{adminPassLoading ? 'Updating Password...' : 'Save New Admin Password'}</span>
                  </button>
                </form>
              </div>

              {/* ADMINISTRATIVE PROFILE DETAILS */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-lg text-white">Administrator Profile</h3>
                      <p className="text-xs text-slate-400">Authenticated user credentials and system permissions.</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-xs">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-slate-400">Logged In Administrator:</div>
                      <div className="text-base font-bold text-white">{user?.full_name || 'Ramji Patel'}</div>
                      <div className="text-xs font-mono text-rose-400">{user?.email}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Assigned Role</div>
                        <div className="font-bold text-indigo-400 mt-1 uppercase font-mono">{user?.role || 'admin'}</div>
                      </div>
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-slate-400 text-[11px]">2FA Verification</div>
                        <div className="font-bold text-emerald-400 mt-1">Enforced Active</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-300">
                  AAGAM Security Engine requires OTP verification for administrative sessions. Keep your password confidential.
                </div>
              </div>
            </div>

            {/* ACCREDITED CERTIFICATE LAYOUT & LICENSE SETTINGS CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-lg text-white">
                      Official Certificate & License Configuration
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure company license CIN, ISO certification, MCA status, office address, and signatories.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    MSME • IAF • AICTE Verified Layout
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveCertSettings} className="space-y-6 text-xs">
                {/* 1. Legal Identification & Badges */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Government Registration & License Numbers</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Corporate Identification No. (CIN / License Number) *
                      </label>
                      <input
                        type="text"
                        required
                        value={certSettings.cert_cin_number || ''}
                        onChange={(e) => setCertSettings({ ...certSettings, cert_cin_number: e.target.value })}
                        placeholder="Corporate Identification No. : U80904BR2021PTC054517"
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        ISO Quality Certification Header *
                      </label>
                      <input
                        type="text"
                        required
                        value={certSettings.cert_iso_text || ''}
                        onChange={(e) => setCertSettings({ ...certSettings, cert_iso_text: e.target.value })}
                        placeholder="An ISO 9001: 2015 certified"
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Ministry of Corporate Affairs (MCA) Header Pill *
                    </label>
                    <input
                      type="text"
                      required
                      value={certSettings.cert_mca_text || ''}
                      onChange={(e) => setCertSettings({ ...certSettings, cert_mca_text: e.target.value })}
                      placeholder="Registered Under Ministry of Corporate Affairs, Govt. of India"
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </div>

                {/* 2. Company Name & Branding */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Company Header & Certificate Ribbon
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Company Legal Name (Red Header) *
                      </label>
                      <input
                        type="text"
                        required
                        value={certSettings.cert_company_name || ''}
                        onChange={(e) => setCertSettings({ ...certSettings, cert_company_name: e.target.value })}
                        placeholder="AAGAM DIGITAL TECHNOLOGY PVT. LTD."
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Tagline / Subtitle (Royal Blue) *
                      </label>
                      <input
                        type="text"
                        required
                        value={certSettings.cert_tagline || ''}
                        onChange={(e) => setCertSettings({ ...certSettings, cert_tagline: e.target.value })}
                        placeholder="LEARN • BUILD • INNOVATE"
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Center Ribbon Sub-Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={certSettings.cert_ribbon_title || ''}
                        onChange={(e) => setCertSettings({ ...certSettings, cert_ribbon_title: e.target.value })}
                        placeholder="CERTIFICATE OF INDUSTRIAL INTERNSHIP EXCELLENCE"
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Corporate Office Address (Bottom Center Capsule) *
                      </label>
                      <input
                        type="text"
                        required
                        value={certSettings.cert_corporate_office || ''}
                        onChange={(e) => setCertSettings({ ...certSettings, cert_corporate_office: e.target.value })}
                        placeholder="Corporate office: Dak Bunglow Chauraha Near Biscoman Tower Patna"
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Signatories */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Certificate Signatories & Titles
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="font-bold text-white text-xs">Director Signatory (Left Side)</div>
                      <div>
                        <label className="block text-slate-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={certSettings.cert_director_name || ''}
                          onChange={(e) => setCertSettings({ ...certSettings, cert_director_name: e.target.value })}
                          placeholder="Ayush Raj"
                          className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Designation Title</label>
                        <input
                          type="text"
                          required
                          value={certSettings.cert_director_title || ''}
                          onChange={(e) => setCertSettings({ ...certSettings, cert_director_title: e.target.value })}
                          placeholder="Director"
                          className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="font-bold text-white text-xs">Course Instructor Signatory (Right Side)</div>
                      <div>
                        <label className="block text-slate-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={certSettings.cert_instructor_name || ''}
                          onChange={(e) => setCertSettings({ ...certSettings, cert_instructor_name: e.target.value })}
                          placeholder="Akash Verma"
                          className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Designation Title</label>
                        <input
                          type="text"
                          required
                          value={certSettings.cert_instructor_title || ''}
                          onChange={(e) => setCertSettings({ ...certSettings, cert_instructor_title: e.target.value })}
                          placeholder="Course Instructor"
                          className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    Candidate passport photograph and MSME, IAF, AICTE accreditation badges are automatically bound and printed on all issued PDF certificates.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={certSettingsSaving}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>{certSettingsSaving ? 'Saving Certificate Layout...' : 'Save Certificate Layout & License Settings'}</span>
                  </button>
                </div>
              </form>

              {/* LIVE CERTIFICATE STUDIO & DESIGN PICKER */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-black text-lg text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>Live Certificate Studio &amp; Design Variation Selector</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Preview all 3 certificate designs live with student passport photo, QR ledger hash, and government accreditation logos. Switch themes and click &quot;Set Selected Theme As Default&quot; to apply company-wide.
                    </p>
                  </div>
                </div>

                <CertificateViewer
                  certificate={{
                    id: 'demo-cert-preview',
                    student_id: 'student-1',
                    user_id: 'user-1',
                    internship_id: 'int-1',
                    certificate_id: 'AAGAM-CERT-2026-000001',
                    student_name: 'Ramji Patel',
                    college_name: 'Government Polytechnic / Accredited University',
                    program_title: 'Full Stack Software Development',
                    duration: 'four weeks',
                    issue_date: new Date().toISOString().split('T')[0],
                    grade_or_remarks: 'Grade: A+ (Outstanding Performance)',
                    status: 'Valid',
                    issued_at: new Date().toISOString(),
                    roll_no: '50875',
                    branch: 'Computer Science & Engineering',
                    start_date: '02 June 2025',
                    end_date: '30 June 2025',
                    photo_url: '/uploads/1791730972019-849d0458.jpeg',
                    qr_code_data: '',
                    signatory_ceo: certSettings.cert_director_name ? `${certSettings.cert_director_name}, Director` : 'Ayush Raj, Director',
                    signatory_hr: certSettings.cert_instructor_name ? `${certSettings.cert_instructor_name}, Course Instructor` : 'Akash Verma, Course Instructor',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: BATCH DETAIL & STUDENTS VIEW */}
      {selectedBatchForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded">
                  {selectedBatchForDetail.batch_code}
                </span>
                <h2 className="font-heading font-black text-2xl text-white mt-1">
                  {selectedBatchForDetail.title}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Timeline: {selectedBatchForDetail.start_date} to {selectedBatchForDetail.end_date} • Faculty: {selectedBatchForDetail.instructor_name}
                </div>
              </div>

              <button
                onClick={() => setSelectedBatchForDetail(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Students List in this Batch */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-base text-white">
                  Enrolled Students ({batchStudents.length})
                </h3>
              </div>

              {loadingBatchStudents ? (
                <div className="text-center py-8 text-xs text-slate-400 animate-pulse">Loading enrolled students...</div>
              ) : batchStudents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                  No students enrolled in this batch yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="p-3.5">Student & Contact</th>
                        <th className="p-3.5">Modules & Sprints</th>
                        <th className="p-3.5">Progress</th>
                        <th className="p-3.5">Weekly Lock Override</th>
                        <th className="p-3.5">Confer Credentials</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {batchStudents.map((st) => (
                        <tr key={st.enrollment_id} className="hover:bg-slate-900/60">
                          <td className="p-3.5">
                            <div className="font-bold text-white">{st.student_name}</div>
                            <div className="font-mono text-slate-400 text-[11px]">{st.student_email}</div>
                            {st.student_phone && (
                              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">📞 {st.student_phone}</div>
                            )}
                          </td>

                          {/* Clickable Modules Completion Manager */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <div className="text-[10px] text-slate-400 font-medium">Click to toggle module completion:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(selectedBatchForDetail?.curriculum_modules) &&
                                  selectedBatchForDetail.curriculum_modules.map((m: any, mIdx: number) => {
                                    const modId = m.id || `mod-${m.module_no || mIdx + 1}`;
                                    const isDone = (st.completed_modules || []).includes(modId) || (st.completed_modules || []).includes(String(m.module_no || mIdx + 1));

                                    return (
                                      <button
                                        key={modId}
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const res = await api.toggleBatchModule(selectedBatchForDetail.id, st.enrollment_id, modId);
                                            toast(res.message, 'success');
                                            openBatchDetail(selectedBatchForDetail);
                                          } catch (e: any) {
                                            toast(e.message, 'error');
                                          }
                                        }}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                                          isDone
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                                        }`}
                                        title={`Click to mark ${m.title || `Module ${mIdx + 1}`} as ${isDone ? 'Incomplete' : 'Completed'}`}
                                      >
                                        M{m.module_no || mIdx + 1} {isDone ? '✓' : '○'}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400">{st.progress_percent || 0}%</span>
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-400"
                                  style={{ width: `${st.progress_percent || 0}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{st.status}</div>
                          </td>

                          {/* Override Weekly Lock */}
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await api.toggleBatchOverride(selectedBatchForDetail.id, st.enrollment_id);
                                  toast(res.message, 'success');
                                  openBatchDetail(selectedBatchForDetail);
                                } catch (e: any) {
                                  toast(e.message, 'error');
                                }
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                                st.admin_unlocked
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                              }`}
                              title="Override weekly schedule to unlock all modules immediately"
                            >
                              <span>⚡</span>
                              <span>{st.admin_unlocked ? 'All Unlocked (Active)' : 'Unlock All Modules'}</span>
                            </button>
                          </td>

                          <td className="p-3.5 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setTargetStudentForDoc(st);
                                setBatchCertStartDate(selectedBatchForDetail.start_date || '');
                                setBatchCertEndDate(selectedBatchForDetail.end_date || '');
                                setShowBatchCertModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-sm"
                            >
                              🎓 Certificate
                            </button>
                            <button
                              onClick={() => {
                                setTargetStudentForDoc(st);
                                setBatchLorStartDate(selectedBatchForDetail.start_date || '');
                                setBatchLorEndDate(selectedBatchForDetail.end_date || '');
                                setShowBatchLorModal(true);
                              }}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg shadow-sm"
                            >
                              📜 LOR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE BATCH */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-heading font-extrabold text-xl text-white">Create New Engineering Cohort</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Batch / Cohort Title</label>
                <input
                  type="text"
                  required
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder="e.g. Full Stack Web Engineering (Batch 2026-B)"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department / Track</label>
                  <select
                    value={batchDepartment}
                    onChange={(e) => setBatchDepartment(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data & AI Research">Data & AI Research</option>
                    <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
                    <option value="Information Security">Information Security</option>
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Seats Capacity</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={batchMaxSeats}
                    onChange={(e) => setBatchMaxSeats(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={batchEndDate}
                    onChange={(e) => setBatchEndDate(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Weeks)</label>
                  <input
                    type="number"
                    value={batchDurationWeeks}
                    onChange={(e) => setBatchDurationWeeks(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Faculty Lead</label>
                  <input
                    type="text"
                    value={batchInstructorName}
                    onChange={(e) => setBatchInstructorName(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Curriculum Modules (JSON Array)</label>
                <textarea
                  rows={4}
                  value={batchModulesJson}
                  onChange={(e) => setBatchModulesJson(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg"
              >
                Create & Publish Cohort
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2.5: EDIT BATCH & MODULES */}
      {showEditBatchModal && selectedBatchForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Batch Code: {selectedBatchForEdit.batch_code}
                </span>
                <h3 className="font-heading font-extrabold text-xl text-white">
                  Edit Cohort & Curriculum Modules
                </h3>
              </div>
              <button onClick={() => setShowEditBatchModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Batch / Cohort Title</label>
                <input
                  type="text"
                  required
                  value={editBatchTitle}
                  onChange={(e) => setEditBatchTitle(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={editBatchStatus}
                    onChange={(e) => setEditBatchStatus(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Seats Capacity</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={editBatchMaxSeats}
                    onChange={(e) => setEditBatchMaxSeats(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editBatchStartDate}
                    onChange={(e) => setEditBatchStartDate(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={editBatchEndDate}
                    onChange={(e) => setEditBatchEndDate(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Weeks)</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={editBatchDurationWeeks}
                    onChange={(e) => setEditBatchDurationWeeks(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Faculty Lead</label>
                  <input
                    type="text"
                    value={editBatchInstructorName}
                    onChange={(e) => setEditBatchInstructorName(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Faculty Email</label>
                <input
                  type="email"
                  value={editBatchInstructorEmail}
                  onChange={(e) => setEditBatchInstructorEmail(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">
                    Curriculum Modules (Weekly Syllabus & Tasks JSON)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    JSON Array of modules with week, title, lectures, tasks & quiz
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={editBatchModulesJson}
                  onChange={(e) => setEditBatchModulesJson(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditBatchModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editBatchSaving}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <span>{editBatchSaving ? 'Saving...' : 'Save Changes & Update Modules'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD FACULTY / TEACHER */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-heading font-extrabold text-xl text-white">Add Faculty / Instructor</h3>
              <button onClick={() => setShowTeacherModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="instructor@aagamdigital.com"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={teacherDept}
                    onChange={(e) => setTeacherDept(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  value={teacherDesignation}
                  onChange={(e) => setTeacherDesignation(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                A secure login account & temporary password will be auto-generated and emailed to the faculty member.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg"
              >
                Register & Dispatch Credentials
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ISSUE CERTIFICATE FROM BATCH */}
      {showBatchCertModal && targetStudentForDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-heading font-extrabold text-lg text-white">Confer Official Certificate</h3>
              <button onClick={() => setShowBatchCertModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueBatchCert} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>Student: <strong className="text-white">{targetStudentForDoc.student_name}</strong></div>
                <div>Cohort: <strong className="text-amber-400">{selectedBatchForDetail?.title}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Course Start Date</label>
                  <input
                    type="date"
                    required
                    value={batchCertStartDate || selectedBatchForDetail?.start_date || '2026-11-01'}
                    onChange={(e) => setBatchCertStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Course End Date</label>
                  <input
                    type="date"
                    required
                    value={batchCertEndDate || selectedBatchForDetail?.end_date || '2026-12-31'}
                    onChange={(e) => setBatchCertEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Grade / Performance Remarks</label>
                <input
                  type="text"
                  required
                  value={batchCertGrade}
                  onChange={(e) => setBatchCertGrade(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-lg"
              >
                Register in Ledger & Send Email
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ISSUE LOR FROM BATCH */}
      {showBatchLorModal && targetStudentForDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-heading font-extrabold text-lg text-white">Confer Executive LOR</h3>
              <button onClick={() => setShowBatchLorModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueBatchLor} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>Student: <strong className="text-white">{targetStudentForDoc.student_name}</strong></div>
                <div>Cohort: <strong className="text-sky-400">{selectedBatchForDetail?.title}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Course Start Date</label>
                  <input
                    type="date"
                    required
                    value={batchLorStartDate || selectedBatchForDetail?.start_date || '2026-11-01'}
                    onChange={(e) => setBatchLorStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Course End Date</label>
                  <input
                    type="date"
                    required
                    value={batchLorEndDate || selectedBatchForDetail?.end_date || '2026-12-31'}
                    onChange={(e) => setBatchLorEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Performance Rating</label>
                <input
                  type="text"
                  required
                  value={batchLorRating}
                  onChange={(e) => setBatchLorRating(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recommendation Body</label>
                <textarea
                  rows={3}
                  required
                  value={batchLorBody}
                  onChange={(e) => setBatchLorBody(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm rounded-xl shadow-lg"
              >
                Confer LOR & Send Email
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: GENERATE OFFER */}
      {showOfferModal && selectedAppForOffer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-heading font-extrabold text-xl text-white">Generate Offer Letter</h3>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateOffer} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div>Candidate: <strong className="text-white">{selectedAppForOffer.student_name}</strong></div>
                <div>Email: <strong className="text-sky-400 font-mono">{selectedAppForOffer.student_email}</strong></div>
                <div>Program: <strong className="text-amber-400">{selectedAppForOffer.internship_title}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={offerStartDate}
                    onChange={(e) => setOfferStartDate(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={offerEndDate}
                    onChange={(e) => setOfferEndDate(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payable Fee (₹0 for Free)</label>
                  <input
                    type="number"
                    value={offerFeeAmount}
                    onChange={(e) => setOfferFeeAmount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    value={offerDuration}
                    onChange={(e) => setOfferDuration(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fee Purpose / Transparent Reason</label>
                <input
                  type="text"
                  value={offerFeeReason}
                  onChange={(e) => setOfferFeeReason(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm rounded-xl shadow-lg"
              >
                Issue & Send Email with QR Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: BULK REGISTER STUDENTS */}
      {showBulkStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-heading font-extrabold text-lg text-white">Bulk Register Students</h3>
              <button onClick={() => setShowBulkStudentModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">JSON Array of Student Records</label>
                <textarea
                  rows={6}
                  value={bulkStudentsJson}
                  onChange={(e) => setBulkStudentsJson(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                disabled={bulkLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg disabled:opacity-50"
              >
                {bulkLoading ? 'Processing...' : 'Bulk Import & Register'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: ADMIN CHANGE PASSWORD MODAL */}
      {showAdminPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-white">Change Admin Password</h3>
              </div>
              <button onClick={() => setShowAdminPassModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeAdminPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  value={adminCurrentPass}
                  onChange={(e) => setAdminCurrentPass(e.target.value)}
                  placeholder="Enter current admin password"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Password (Min 6 Characters)</label>
                <div className="relative">
                  <input
                    type={showAdminPassPlain ? 'text' : 'password'}
                    required
                    value={adminNewPass}
                    onChange={(e) => setAdminNewPass(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassPlain(!showAdminPassPlain)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showAdminPassPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                <input
                  type={showAdminPassPlain ? 'text' : 'password'}
                  required
                  value={adminConfirmPass}
                  onChange={(e) => setAdminConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                Logged in account: <strong className="text-white">{user?.email}</strong>
              </div>

              <button
                type="submit"
                disabled={adminPassLoading}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm rounded-xl shadow-lg disabled:opacity-50 transition-all"
              >
                {adminPassLoading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: STUDENT CREDENTIAL & LOGIN MANAGER MODAL */}
      {showCredModal && selectedStudentForCred && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-white">Student Credential Manager</h3>
                  <div className="text-[11px] text-slate-400">Set custom password or auto-generate credentials</div>
                </div>
              </div>
              <button onClick={() => setShowCredModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Details Card */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Student Name:</span>
                <span className="font-bold text-white text-sm">{selectedStudentForCred.full_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-mono text-sky-400 font-semibold">{selectedStudentForCred.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Registration ID:</span>
                <span className="font-mono text-amber-400 font-bold">{selectedStudentForCred.registration_no || 'Pending Auto-Gen'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">College / Course:</span>
                <span className="text-slate-300">{selectedStudentForCred.college_name || 'N/A'} • {selectedStudentForCred.course || 'B.Tech'}</span>
              </div>
            </div>

            {/* Generated Result Banner */}
            {generatedCreds && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Credentials Successfully Generated & Dispatched via Email!</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Username / Email:</div>
                      <div className="font-mono font-bold text-white">{generatedCreds.email}</div>
                    </div>
                    <button
                      onClick={() => handleCopyText(generatedCreds.email, 'Email')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                    >
                      {copiedField === 'Email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'Email' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Generated Password:</div>
                      <div className="font-mono font-black text-amber-400 text-sm tracking-wide">{generatedCreds.password}</div>
                    </div>
                    <button
                      onClick={() => handleCopyText(generatedCreds.password, 'Password')}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-amber-500/30"
                    >
                      {copiedField === 'Password' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'Password' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Student Login URL:</div>
                      <div className="font-mono text-sky-400 text-[11px]">http://127.0.0.1:5173/?view=login</div>
                    </div>
                    <button
                      onClick={() => handleCopyText('http://127.0.0.1:5173/?view=login', 'Login URL')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                    >
                      {copiedField === 'Login URL' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'Login URL' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Credential Options Form */}
            <form onSubmit={handleGenerateStudentCreds} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">Password Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCredAutoGenerate(true)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      credAutoGenerate
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs">⚡ Auto-Generate</div>
                    <div className="text-[10px] text-indigo-300 mt-0.5">Secure Aagam@XXXXXX</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCredAutoGenerate(false)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !credAutoGenerate
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs">✍️ Custom Password</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Enter custom string</div>
                  </button>
                </div>
              </div>

              {!credAutoGenerate && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Enter Custom Password</label>
                  <input
                    type="text"
                    required
                    value={credCustomPassword}
                    onChange={(e) => setCredCustomPassword(e.target.value)}
                    placeholder="e.g. Student@2026"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                The student account will be activated, password hashed with bcrypt, and an automated credentials email will be dispatched to <strong className="text-sky-400">{selectedStudentForCred.email}</strong>.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCredModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  {generatedCreds ? 'Done' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={credLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>{credLoading ? 'Generating...' : (generatedCreds ? 'Re-Generate & Resend' : 'Generate & Send Email')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

