export type UserRole = 'student' | 'staff' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: number;
  email_verified: number;
  created_at: string;
  student?: StudentProfile;
  staff?: StaffProfile;
  unreadNotificationsCount?: number;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  registration_no?: string;
  college_name?: string;
  course?: string;
  branch?: string;
  semester_year?: string;
  roll_no?: string;
  cgpa?: string;
  skills?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  resume_url?: string;
  photo_url?: string;
  created_at: string;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  designation: string;
  department: string;
  employee_id: string;
  phone: string;
  bio?: string;
}

export interface Internship {
  id: string;
  slug: string;
  title: string;
  department: string;
  technology: string;
  description: string;
  full_description: string;
  duration: string;
  eligibility: string;
  skills_required: string;
  mode: 'Remote' | 'Hybrid' | 'Onsite';
  location: string;
  start_date: string;
  application_deadline: string;
  total_seats: number;
  filled_seats: number;
  fee_amount: number;
  is_paid: number;
  required_documents: string[];
  ocr_enabled: number;
  status: 'Active' | 'Draft' | 'Closed';
  created_at: string;
}

export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Documents Required'
  | 'Shortlisted'
  | 'Selected'
  | 'Offer Generated'
  | 'Offer Accepted'
  | 'Payment Pending'
  | 'Payment Verified'
  | 'Portal Provisioning'
  | 'Active'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: 'NOC' | 'College_ID' | 'Resume' | 'Academic_Marksheet' | 'Other';
  file_path: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface InternshipApplication {
  id: string;
  application_no: string;
  internship_id: string;
  student_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  college_name: string;
  course: string;
  semester_year: string;
  roll_no?: string;
  status: ApplicationStatus;
  review_notes?: string;
  admin_feedback?: string;
  ocr_data?: any;
  submitted_at: string;
  updated_at: string;
  internship_title?: string;
  internship_slug?: string;
  internship_duration?: string;
  duration?: string;
  mode?: string;
  documents?: ApplicationDocument[];
  offer_letter_id?: string;
  offer_id?: string;
  offer_status?: string;
}

export interface OfferLetter {
  id: string;
  offer_id: string;
  application_id: string;
  student_id: string;
  user_id: string;
  internship_id: string;
  student_name: string;
  college_name: string;
  course: string;
  internship_title: string;
  duration: string;
  start_date: string;
  end_date: string;
  stipend_fee_text?: string;
  payable_amount: number;
  terms_conditions: string;
  template_id?: string;
  qr_code_data?: string;
  pdf_path?: string;
  status: 'Issued' | 'Accepted' | 'Expired' | 'Revoked' | 'Cancelled';
  expires_at?: string;
  issued_at: string;
  accepted_at?: string;
}

export interface PaymentRecord {
  id: string;
  payment_no: string;
  offer_id?: string;
  application_id?: string;
  user_id: string;
  student_name: string;
  amount: number;
  currency: string;
  purpose: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Refunded' | 'Cancelled';
  method?: string;
  created_at: string;
  verified_at?: string;
  internship_title?: string;
  offer_code?: string;
  user_email?: string;
}

export interface ProjectAssignment {
  assignment_id: string;
  assignment_status: 'Assigned' | 'In Progress' | 'Submitted' | 'Under Review' | 'Changes Required' | 'Approved' | 'Completed';
  assigned_at: string;
  project_id: string;
  title: string;
  department: string;
  technology: string;
  description: string;
  guidelines: string;
  deliverables: string;
  start_date: string;
  deadline: string;
  submission_id?: string;
  github_url?: string;
  live_demo_url?: string;
  documentation_text?: string;
  student_notes?: string;
  staff_remarks?: string;
  submission_status?: string;
  submitted_at?: string;
  reviewed_at?: string;
  student_name?: string;
  student_email?: string;
}

export interface Certificate {
  id: string;
  certificate_id: string;
  student_id: string;
  user_id: string;
  internship_id: string;
  student_name: string;
  college_name: string;
  program_title: string;
  duration: string;
  issue_date: string;
  grade_or_remarks: string;
  signatory_ceo: string;
  signatory_hr: string;
  qr_code_data?: string;
  status: 'Valid' | 'Revoked' | 'Cancelled';
  issued_at: string;
  photo_url?: string;
  roll_no?: string;
  branch?: string;
  start_date?: string;
  end_date?: string;
  instructor_name?: string;
}

export interface LetterOfRecommendation {
  id: string;
  lor_id: string;
  student_id: string;
  user_id: string;
  internship_id: string;
  student_name: string;
  college_name: string;
  internship_title: string;
  duration: string;
  recommendation_body: string;
  performance_rating: string;
  qr_code_data?: string;
  status: 'Valid' | 'Revoked' | 'Cancelled';
  issued_at: string;
}

export interface TrainingProgram {
  id: string;
  slug: string;
  title: string;
  department: string;
  level: string;
  duration: string;
  fee_amount: number;
  is_free: number;
  description: string;
  syllabus: Array<{ module: string; title: string; lessons: number }>;
  schedule?: string;
  mentor_name?: string;
  status: string;
}

export interface PlacementDrive {
  id: string;
  title: string;
  company_name: string;
  company_logo?: string;
  role: string;
  package_lpa: string;
  location: string;
  eligibility: string;
  batch_year: string;
  deadline: string;
  drive_date: string;
  description: string;
  status: string;
}

export interface JobOpening {
  id: string;
  slug: string;
  title: string;
  department: string;
  role_type: string;
  experience_level: string;
  location: string;
  mode: string;
  salary_range: string;
  description: string;
  requirements: string;
  benefits: string;
  deadline: string;
  status: string;
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  tags: string;
  featured_image?: string;
  read_time: string;
  published_at: string;
}

export interface VerificationResult {
  documentType: string;
  documentId: string;
  studentName: string;
  collegeName: string;
  programTitle: string;
  duration: string;
  issueDate: string;
  startDate?: string;
  endDate?: string;
  gradeOrRemarks?: string;
  performanceRating?: string;
  recommendationSummary?: string;
  signatories: string;
  status: 'Valid' | 'Issued' | 'Accepted' | 'Revoked' | 'Cancelled';
  isValid: boolean;
  organization: string;
  tagline: string;
  verificationUrl: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  ceo: { name: string; title: string };
  hr: { name: string; phone: string; email: string; title: string };
  officialEmail: string;
  phoneNumbers: string[];
  slas: { reviewWindowHours: number; provisioningWindowHours: number };
}

export interface BatchModule {
  module_number?: number;
  module_no?: number;
  title: string;
  description?: string;
  duration?: string;
  lectures?: Array<{ title: string; type?: string; duration_mins?: number } | string>;
  tasks?: Array<{ title: string; max_score?: number } | string>;
  lecture_url?: string;
  resource_pdf_url?: string;
  task_assignment?: string;
  quiz_questions?: string[];
}

export interface Batch {
  id: string;
  batch_code: string;
  title: string;
  program_type: 'Internship' | 'Training' | 'Workshop';
  program_id?: string;
  department: string;
  instructor_name: string;
  instructor_email?: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  max_seats: number;
  enrolled_count: number;
  seats_left: number;
  is_filling_fast?: boolean;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Archived';
  meeting_link?: string;
  modules: BatchModule[];
  created_at: string;
}
