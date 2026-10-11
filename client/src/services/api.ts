import {
  User,
  Internship,
  InternshipApplication,
  OfferLetter,
  PaymentRecord,
  ProjectAssignment,
  Certificate,
  LetterOfRecommendation,
  TrainingProgram,
  PlacementDrive,
  JobOpening,
  BlogArticle,
  VerificationResult,
  CompanyInfo,
  Batch,
} from '../types';

const API_BASE = '/api';

export async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aagam_auth_token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyRegistrationOtp: (body: any) => request('/auth/verify-registration-otp', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  requestOtpLogin: (body: { email: string }) => request<{ success: boolean; message: string; devOtp?: string }>('/auth/otp-login-request', { method: 'POST', body: JSON.stringify(body) }),
  verifyOtpLogin: (body: { email: string; otp: string }) => request<{ success: boolean; token: string; user: User; message?: string }>('/auth/otp-login-verify', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body: { email: string }) => request<{ success: boolean; message: string; devOtp?: string; resetUrl?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body: { email: string; new_password: string; otp?: string; token?: string }) => request<{ success: boolean; message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  sendOtp: (body: any) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(body) }),
  verifyOtp: (body: any) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<{ success: boolean; user: User }>('/auth/me'),
  updateProfile: (body: any) => request('/auth/update-profile', { method: 'POST', body: JSON.stringify(body) }),

  // Internships
  getInternships: (params?: { department?: string; mode?: string; search?: string }) => {
    const cleanParams: Record<string, string> = {};
    if (params?.department && params.department !== 'All') cleanParams.department = params.department;
    if (params?.mode && params.mode !== 'All') cleanParams.mode = params.mode;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean; internships: Internship[] }>(`/internships${query ? `?${query}` : ''}`);
  },
  getInternship: (slug: string) => request<{ success: boolean; internship: Internship }>(`/internships/${slug}`),
  uploadDocument: (formData: FormData) => request<{ success: boolean; file: any; ocr: any }>('/internships/upload-document', { method: 'POST', body: formData }),
  sendApplyOtp: (emailOrBody: { email: string; student_name?: string } | string, student_name?: string) => {
    const payload = typeof emailOrBody === 'string' ? { email: emailOrBody, student_name } : emailOrBody;
    return request<{ success: boolean; message: string; devOtp?: string }>('/internships/send-otp', { method: 'POST', body: JSON.stringify(payload) });
  },
  applyInternship: (body: any) => request<{ success: boolean; application: any; message?: string }>('/internships/apply', { method: 'POST', body: JSON.stringify(body) }),

  // Offers & Payments
  getMyOffers: () => request<{ success: boolean; offers: OfferLetter[] }>('/offers/my-offers'),
  getPublicOffer: (offerId: string) => request<{ success: boolean; offer: any; message?: string }>(`/offers/public/${offerId}`),
  getOffer: (offerId: string) => request<{ success: boolean; offer: OfferLetter }>(`/offers/${offerId}`),
  acceptOfferPublic: (offerId: string) => request('/offers/accept', { method: 'POST', body: JSON.stringify({ offer_id: offerId }) }),
  acceptOffer: (offerId: string) => request('/offers/accept', { method: 'POST', body: JSON.stringify({ offer_id: offerId }) }),
  submitPaymentProof: (body: { offer_id: string; utr_number: string; amount?: number }) => request('/offers/submit-payment-proof', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (body: any) => request('/offers/verify-payment', { method: 'POST', body: JSON.stringify(body) }),
  getMyPayments: () => request<{ success: boolean; payments: PaymentRecord[] }>('/payments/my-history'),
  getAdminPayments: (params?: any) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = String(params[key]);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean; payments: PaymentRecord[]; stats: any }>(`/payments/admin-list${query ? `?${query}` : ''}`);
  },

  // Projects & Tasks
  getMyProjects: () => request<{ success: boolean; projects: ProjectAssignment[] }>('/projects/my-projects'),
  submitProject: (body: any) => request('/projects/submit', { method: 'POST', body: JSON.stringify(body) }),
  reviewProject: (body: any) => request('/projects/review', { method: 'POST', body: JSON.stringify(body) }),
  getAllProjects: () => request<{ success: boolean; submissions: any[] }>('/projects/all'),
  submitTask: (body: any) => request('/students/tasks/submit', { method: 'POST', body: JSON.stringify(body) }),
  submitQuiz: (body: any) => request('/students/quizzes/submit', { method: 'POST', body: JSON.stringify(body) }),

  // Documents
  getMyDocuments: () => request<{ success: boolean; documents: { offers: OfferLetter[]; lors: LetterOfRecommendation[]; certificates: Certificate[] } }>('/documents/my-documents'),
  generateOfferLetter: (body: any) => request('/documents/generate-offer', { method: 'POST', body: JSON.stringify(body) }),
  generateLor: (body: any) => request('/documents/generate-lor', { method: 'POST', body: JSON.stringify(body) }),
  generateCertificate: (body: any) => request('/documents/generate-certificate', { method: 'POST', body: JSON.stringify(body) }),
  updateDocumentStatus: (body: any) => request('/documents/update-status', { method: 'POST', body: JSON.stringify(body) }),
  getDocumentTemplates: () => request<{ success: boolean; templates: any[] }>('/documents/templates'),

  // Verification
  verifyDocument: (docId: string) => request<{ success: boolean; isVerified: boolean; document: VerificationResult; message?: string }>(`/verification/lookup?id=${encodeURIComponent(docId)}`),

  // Student Portal
  getStudentOverview: () => request<{ success: boolean; data: any }>('/students/overview'),
  getStudentApplications: () => request<{ success: boolean; applications: InternshipApplication[] }>('/students/applications'),
  getInternshipPortal: () => request<{ success: boolean; hasActiveInternship: boolean; internship: any }>('/students/internship-portal'),

  // Admin ERP
  getAdminStats: () => request<{ success: boolean; stats: any; recentApplications: any[]; recentPayments: any[] }>('/admin/dashboard-stats'),
  getAdminStudents: (params?: any) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = String(params[key]);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean; students: any[] }>(`/admin/students${query ? `?${query}` : ''}`);
  },
  toggleStudentStatus: (userId: string, isActive: boolean) => request('/admin/students/status', { method: 'POST', body: JSON.stringify({ user_id: userId, is_active: isActive }) }),
  getAdminApplications: (params?: any) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = String(params[key]);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean; applications: InternshipApplication[] }>(`/admin/applications${query ? `?${query}` : ''}`);
  },
  getAdminOffers: () => request<{ success: boolean; offers: OfferLetter[] }>('/admin/offers'),
  generateAdminOffer: (body: any) => request('/admin/applications/generate-offer', { method: 'POST', body: JSON.stringify(body) }),
  provisionNow: (targetId: string, password?: string) => request<{ success: boolean; message: string; credentials?: any; user?: any; tempPassword?: string }>('/admin/provision-now', { method: 'POST', body: JSON.stringify({ target_id: targetId, offer_id: targetId, password }) }),
  setStudentCredentials: (body: { target_id: string; password?: string; auto_generate?: boolean }) => request<{ success: boolean; message: string; credentials?: any; user?: any; tempPassword?: string }>('/admin/students/set-credentials', { method: 'POST', body: JSON.stringify(body) }),
  changeAdminPassword: (body: { current_password?: string; new_password: string; confirm_password?: string }) => request<{ success: boolean; message: string }>('/admin/change-password', { method: 'POST', body: JSON.stringify(body) }),
  bulkRegisterStudents: (body: { students: any[] }) => request<{ success: boolean; count: number; registered: any[]; errors: any[] }>('/admin/bulk-register-students', { method: 'POST', body: JSON.stringify(body) }),
  bulkGenerateOffers: (application_ids: string[], stipend_amount?: number, fee_amount?: number, fee_reason?: string) => request<{ success: boolean; generated_count: number; offers: any[] }>('/admin/bulk-generate-offers', { method: 'POST', body: JSON.stringify({ application_ids, stipend_amount, fee_amount, fee_reason }) }),
  bulkGenerateLors: (student_ids: string[], performance_rating?: string) => request<{ success: boolean; generated_count: number; lors: any[] }>('/admin/lors/bulk-generate', { method: 'POST', body: JSON.stringify({ student_ids, performance_rating }) }),
  reviewApplication: (body: any) => request('/admin/applications/review', { method: 'POST', body: JSON.stringify(body) }),
  getAdminMentors: () => request<{ success: boolean; mentors: any[] }>('/admin/mentors'),
  assignMentor: (body: { student_id?: string; user_id?: string; mentor_id: string }) => request('/admin/assign-mentor', { method: 'POST', body: JSON.stringify(body) }),
  bulkGenerateCertificates: (student_ids: string[]) => request('/admin/certificates/bulk-generate', { method: 'POST', body: JSON.stringify({ student_ids }) }),
  saveInternship: (body: any) => request('/admin/internships/save', { method: 'POST', body: JSON.stringify(body) }),
  getEmailTemplates: () => request<{ success: boolean; templates: any[] }>('/admin/email-templates'),
  saveEmailTemplate: (body: any) => request('/admin/email-templates/save', { method: 'POST', body: JSON.stringify(body) }),
  getEmailLogs: () => request<{ success: boolean; logs: any[] }>('/admin/email-logs'),
  sendTestEmail: (body: any) => request('/admin/send-test-email', { method: 'POST', body: JSON.stringify(body) }),
  getAuditLogs: () => request<{ success: boolean; logs: any[] }>('/admin/audit-logs'),
  getSettings: () => request<{ success: boolean; settings: any[] }>('/admin/settings'),
  saveSettings: (settings: Array<{ key: string; value: string }>) => request('/admin/settings', { method: 'POST', body: JSON.stringify({ settings }) }),
  getContactEnquiries: () => request<{ success: boolean; contacts: any[] }>('/admin/contacts'),
  updateContactStatus: (body: any) => request('/admin/contacts/status', { method: 'POST', body: JSON.stringify(body) }),

  // Admin 2FA
  adminLoginInit: (body: { email: string; password: string }) => request<{ success: boolean; requiresOtp: boolean; email: string; message: string; devOtp?: string }>('/auth/admin-login-init', { method: 'POST', body: JSON.stringify(body) }),
  adminLoginVerify: (body: { email: string; otp: string }) => request<{ success: boolean; token: string; user: User; message: string }>('/auth/admin-login-verify', { method: 'POST', body: JSON.stringify(body) }),

  // Student Learning Workspace & Batches
  getStudentBatches: () => request<{ success: boolean; batches: any[] }>('/students/my-batches'),
  completeStudentModule: (batchId: string, body: { moduleId: string; taskSubmission?: string; quizScore?: number }) => request<{ success: boolean; message: string; progress_percent: number; completed_modules: string[]; is_completed: boolean }>(`/students/batches/${batchId}/complete-module`, { method: 'POST', body: JSON.stringify(body) }),
  getStudentDocuments: () => request<{ success: boolean; documents: { offers: OfferLetter[]; certificates: Certificate[]; lors: LetterOfRecommendation[]; payments: PaymentRecord[] } }>('/students/my-documents'),

  // Teachers & Faculty Management
  getTeachers: () => request<{ success: boolean; teachers: any[] }>('/admin/teachers'),
  createTeacher: (body: any) => request<{ success: boolean; message: string; teacher: any }>('/admin/teachers/create', { method: 'POST', body: JSON.stringify(body) }),
  deleteTeacher: (id: string) => request<{ success: boolean; message: string }>(`/admin/teachers/${id}`, { method: 'DELETE' }),

  // Batches & Curriculum Management
  getBatches: () => request<{ success: boolean; batches: any[] }>('/admin/batches'),
  createBatch: (body: any) => request<{ success: boolean; message: string; batch: any }>('/admin/batches', { method: 'POST', body: JSON.stringify(body) }),
  updateBatch: (id: string, body: any) => request<{ success: boolean; message: string }>(`/admin/batches/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBatch: (id: string) => request<{ success: boolean; message: string }>(`/admin/batches/${id}`, { method: 'DELETE' }),
  getBatchStudents: (batchId: string) => request<{ success: boolean; students: any[] }>(`/admin/batches/${batchId}/students`),
  toggleBatchOverride: (batchId: string, enrollmentId: string) => request<{ success: boolean; admin_unlocked: boolean; message: string }>(`/admin/batches/${batchId}/students/${enrollmentId}/toggle-override`, { method: 'POST' }),
  toggleBatchModule: (batchId: string, enrollmentId: string, moduleId: string) => request<{ success: boolean; progress_percent: number; completed_modules: string[]; message: string }>(`/admin/batches/${batchId}/students/${enrollmentId}/toggle-module`, { method: 'POST', body: JSON.stringify({ moduleId }) }),
  issueBatchCertificate: (batchId: string, body: { student_id?: string; user_id?: string; grade_or_remarks?: string; start_date?: string; end_date?: string; duration?: string }) => request<{ success: boolean; message: string; certificate_id: string }>(`/admin/batches/${batchId}/issue-certificate`, { method: 'POST', body: JSON.stringify(body) }),
  issueBatchLor: (batchId: string, body: { student_id?: string; user_id?: string; performance_rating?: string; recommendation_body?: string; start_date?: string; end_date?: string; duration?: string }) => request<{ success: boolean; message: string; lor_id: string }>(`/admin/batches/${batchId}/issue-lor`, { method: 'POST', body: JSON.stringify(body) }),
  verifyAndAcceptOffer: (offerId: string, custom_password?: string) => request<{ success: boolean; message: string; provision?: any }>(`/admin/offers/${offerId}/verify-and-accept`, { method: 'POST', body: JSON.stringify({ custom_password }) }),

  // Public
  getCompanyInfo: () => request<{ success: boolean; company: CompanyInfo }>('/public/company-info'),
  getPublicBatches: () => request<{ success: boolean; batches: Batch[] }>('/public/batches'),
  getTrainings: () => request<{ success: boolean; trainings: TrainingProgram[] }>('/public/trainings'),
  enrollTraining: (body: any) => request('/public/trainings/enroll', { method: 'POST', body: JSON.stringify(body) }),
  getPlacements: () => request<{ success: boolean; placements: PlacementDrive[] }>('/public/placements'),
  getJobs: () => request<{ success: boolean; jobs: JobOpening[] }>('/public/jobs'),
  applyJob: (body: any) => request('/public/jobs/apply', { method: 'POST', body: JSON.stringify(body) }),
  getBlogs: () => request<{ success: boolean; blogs: BlogArticle[] }>('/public/blogs'),
  getBlog: (slug: string) => request<{ success: boolean; blog: BlogArticle }>(`/public/blogs/${slug}`),
  submitContact: (body: any) => request('/public/contact', { method: 'POST', body: JSON.stringify(body) }),
  getCertificateSettings: () => request<{ success: boolean; settings: any }>('/public/certificate-settings'),
  getAdminCertificateSettings: () => request<{ success: boolean; settings: any }>('/admin/certificate-settings'),
  updateAdminCertificateSettings: (settings: any) => request('/admin/certificate-settings', { method: 'POST', body: JSON.stringify({ settings }) }),
};
