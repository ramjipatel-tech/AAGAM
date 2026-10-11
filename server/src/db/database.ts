import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isVercel = !!process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

let dbDir: string;
let dbPath: string;

if (isVercel) {
  dbDir = path.join('/tmp', 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'aagam.sqlite');

  // If database does not exist in /tmp, copy the pre-seeded bundled database
  if (!fs.existsSync(dbPath)) {
    const candidateBundled = [
      path.resolve(__dirname, '../../../server/data/aagam.sqlite'),
      path.resolve(__dirname, '../../data/aagam.sqlite'),
      path.resolve(process.cwd(), 'server/data/aagam.sqlite'),
      path.resolve(process.cwd(), 'data/aagam.sqlite'),
    ];
    let copied = false;
    for (const c of candidateBundled) {
      if (fs.existsSync(c)) {
        try {
          fs.copyFileSync(c, dbPath);
          console.log(`[DB] Successfully hydrated /tmp database from ${c}`);
          copied = true;
          break;
        } catch (e) {
          console.warn(`[DB] Could not copy from ${c}:`, e);
        }
      }
    }
    if (!copied) {
      console.log('[DB] No bundled database found, initialized fresh database in /tmp');
    }
  }
} else {
  dbDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'aagam.sqlite');
}

export const db = new Database(dbPath);

// Enable WAL mode for high concurrency performance and foreign keys
try {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (e) {}

export function initDatabase() {
  const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'staff', 'admin', 'superadmin')),
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1,
    email_verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    mentor_id TEXT,
    registration_no TEXT UNIQUE,
    college_name TEXT,
    course TEXT,
    branch TEXT,
    semester_year TEXT,
    roll_no TEXT,
    cgpa TEXT,
    skills TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    resume_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    designation TEXT,
    department TEXT,
    employee_id TEXT UNIQUE,
    phone TEXT,
    bio TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS internships (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    technology TEXT NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    duration TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    skills_required TEXT NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('Remote', 'Hybrid', 'Onsite')),
    location TEXT NOT NULL,
    start_date TEXT NOT NULL,
    application_deadline TEXT NOT NULL,
    total_seats INTEGER NOT NULL DEFAULT 50,
    filled_seats INTEGER NOT NULL DEFAULT 0,
    fee_amount REAL NOT NULL DEFAULT 0,
    is_paid INTEGER NOT NULL DEFAULT 0,
    required_documents TEXT NOT NULL DEFAULT '["NOC","College_ID","Resume"]',
    ocr_enabled INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Draft', 'Closed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS internship_applications (
    id TEXT PRIMARY KEY,
    application_no TEXT UNIQUE NOT NULL,
    internship_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    college_name TEXT NOT NULL,
    course TEXT NOT NULL,
    semester_year TEXT NOT NULL,
    roll_no TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted',
    review_notes TEXT,
    admin_feedback TEXT,
    ocr_data TEXT,
    submitted_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (internship_id) REFERENCES internships(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS application_documents (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY (application_id) REFERENCES internship_applications(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS otp_verifications (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    purpose TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    is_used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS offer_letters (
    id TEXT PRIMARY KEY,
    offer_id TEXT UNIQUE NOT NULL,
    application_id TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    internship_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    college_name TEXT NOT NULL,
    course TEXT NOT NULL,
    internship_title TEXT NOT NULL,
    duration TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    stipend_fee_text TEXT,
    payable_amount REAL DEFAULT 0,
    fee_reason TEXT,
    is_paid INTEGER DEFAULT 0,
    provisioning_status TEXT DEFAULT 'Pending' CHECK(provisioning_status IN ('Pending', 'Queued', 'Provisioned', 'Manual_Required')),
    provisioning_due_at TEXT,
    terms_conditions TEXT NOT NULL,
    template_id TEXT,
    qr_code_data TEXT,
    pdf_path TEXT,
    status TEXT NOT NULL DEFAULT 'Issued' CHECK(status IN ('Issued', 'Accepted', 'Expired', 'Revoked', 'Cancelled')),
    expires_at TEXT,
    issued_at TEXT NOT NULL,
    accepted_at TEXT,
    FOREIGN KEY (application_id) REFERENCES internship_applications(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    otp TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    is_used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    payment_no TEXT UNIQUE NOT NULL,
    offer_id TEXT,
    application_id TEXT,
    user_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    purpose TEXT NOT NULL,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Success', 'Failed', 'Refunded', 'Cancelled')),
    method TEXT,
    failure_reason TEXT,
    gateway_response TEXT,
    created_at TEXT NOT NULL,
    verified_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (offer_id) REFERENCES offer_letters(id)
  );

  CREATE TABLE IF NOT EXISTS portal_provisioning (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    application_id TEXT NOT NULL,
    payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'Provisioned' CHECK(status IN ('Pending', 'In Progress', 'Provisioned', 'Failed')),
    provisioned_at TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS training_programs (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    level TEXT NOT NULL,
    duration TEXT NOT NULL,
    fee_amount REAL NOT NULL DEFAULT 0,
    is_free INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    syllabus TEXT NOT NULL,
    schedule TEXT,
    mentor_name TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS training_enrollments (
    id TEXT PRIMARY KEY,
    training_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',
    enrolled_at TEXT NOT NULL,
    FOREIGN KEY (training_id) REFERENCES training_programs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    batch_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    program_id TEXT,
    program_type TEXT NOT NULL DEFAULT 'internship',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    duration_weeks INTEGER DEFAULT 8,
    instructor_name TEXT,
    instructor_email TEXT,
    curriculum_modules TEXT,
    max_seats INTEGER DEFAULT 100,
    enrolled_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Upcoming', 'Active', 'Completed', 'Archived')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS batch_enrollments (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    progress_percent INTEGER DEFAULT 0,
    completed_modules TEXT DEFAULT '[]',
    task_submissions TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'Enrolled' CHECK(status IN ('Enrolled', 'In Progress', 'Completed')),
    certificate_issued INTEGER DEFAULT 0,
    lor_issued INTEGER DEFAULT 0,
    certificate_id TEXT,
    lor_id TEXT,
    enrolled_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS placement_drives (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo TEXT,
    role TEXT NOT NULL,
    package_lpa TEXT NOT NULL,
    location TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    batch_year TEXT NOT NULL,
    deadline TEXT NOT NULL,
    drive_date TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    role_type TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    location TEXT NOT NULL,
    mode TEXT NOT NULL,
    salary_range TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    benefits TEXT NOT NULL,
    deadline TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    applicant_phone TEXT NOT NULL,
    resume_url TEXT,
    portfolio_url TEXT,
    cover_letter TEXT,
    status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected')),
    applied_at TEXT NOT NULL,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    internship_id TEXT,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    technology TEXT NOT NULL,
    description TEXT NOT NULL,
    guidelines TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    start_date TEXT NOT NULL,
    deadline TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_assignments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    mentor_id TEXT,
    status TEXT NOT NULL DEFAULT 'Assigned' CHECK(status IN ('Assigned', 'In Progress', 'Submitted', 'Under Review', 'Changes Required', 'Approved', 'Completed')),
    assigned_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS project_submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    github_url TEXT NOT NULL,
    live_demo_url TEXT,
    documentation_text TEXT,
    zip_file_url TEXT,
    screenshots TEXT,
    student_notes TEXT,
    staff_remarks TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Submitted', 'Under Review', 'Changes Required', 'Approved')),
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT,
    FOREIGN KEY (assignment_id) REFERENCES project_assignments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Mentorship Tasks & Milestones
  CREATE TABLE IF NOT EXISTS internship_tasks (
    id TEXT PRIMARY KEY,
    internship_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    week_no INTEGER DEFAULT 1,
    due_date TEXT,
    max_points INTEGER DEFAULT 100,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS task_submissions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    submission_text TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Submitted', 'Under Review', 'Revision Required', 'Approved')),
    grade TEXT,
    feedback TEXT,
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT,
    FOREIGN KEY (task_id) REFERENCES internship_tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Quizzes & Knowledge Checkpoints
  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    internship_id TEXT,
    title TEXT NOT NULL,
    questions_json TEXT NOT NULL,
    passing_score INTEGER DEFAULT 70,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passed INTEGER NOT NULL DEFAULT 1,
    attempted_at TEXT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lors (
    id TEXT PRIMARY KEY,
    lor_id TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    internship_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    college_name TEXT NOT NULL,
    internship_title TEXT NOT NULL,
    duration TEXT NOT NULL,
    recommendation_body TEXT NOT NULL,
    performance_rating TEXT NOT NULL,
    qr_code_data TEXT,
    pdf_path TEXT,
    status TEXT NOT NULL DEFAULT 'Valid' CHECK(status IN ('Valid', 'Revoked', 'Cancelled')),
    issued_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    certificate_id TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    internship_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    college_name TEXT NOT NULL,
    program_title TEXT NOT NULL,
    duration TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    grade_or_remarks TEXT NOT NULL,
    signatory_ceo TEXT NOT NULL DEFAULT 'Ayush Raj, CEO',
    signatory_hr TEXT NOT NULL DEFAULT 'Akash Verma, HR',
    qr_code_data TEXT,
    pdf_path TEXT,
    status TEXT NOT NULL DEFAULT 'Valid' CHECK(status IN ('Valid', 'Revoked', 'Cancelled')),
    issued_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS document_templates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('Offer_Letter', 'LOR', 'Certificate')),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    header_text TEXT,
    body_template TEXT NOT NULL,
    footer_text TEXT,
    terms_template TEXT,
    styling_json TEXT,
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    event_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    variables_available TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL,
    template_key TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_preview TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Sent' CHECK(status IN ('Sent', 'Failed', 'Queued')),
    error_message TEXT,
    related_id TEXT,
    sent_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'action')),
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    tags TEXT NOT NULL,
    featured_image TEXT,
    read_time TEXT NOT NULL,
    is_published INTEGER DEFAULT 1,
    published_at TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_enquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New', 'In Progress', 'Resolved', 'Closed')),
    assigned_to TEXT,
    staff_notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    ip_address TEXT,
    details_json TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    group_name TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- Performance Indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
  CREATE INDEX IF NOT EXISTS idx_students_registration_no ON students(registration_no);
  CREATE INDEX IF NOT EXISTS idx_internships_slug ON internships(slug);
  CREATE INDEX IF NOT EXISTS idx_applications_user_id ON internship_applications(user_id);
  CREATE INDEX IF NOT EXISTS idx_applications_app_no ON internship_applications(application_no);
  CREATE INDEX IF NOT EXISTS idx_applications_status ON internship_applications(status);
  CREATE INDEX IF NOT EXISTS idx_offer_letters_offer_id ON offer_letters(offer_id);
  CREATE INDEX IF NOT EXISTS idx_offer_letters_app_id ON offer_letters(application_id);
  CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
  CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
  CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates(certificate_id);
  CREATE INDEX IF NOT EXISTS idx_lors_lor_id ON lors(lor_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_batches_code ON batches(batch_code);
  CREATE INDEX IF NOT EXISTS idx_batch_enrollments_user ON batch_enrollments(user_id);
  CREATE INDEX IF NOT EXISTS idx_batch_enrollments_batch ON batch_enrollments(batch_id);
  CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `;

  db.exec(schema);

  // Safe runtime column migration for existing sqlite db
  try {
    db.prepare('ALTER TABLE students ADD COLUMN mentor_id TEXT').run();
  } catch (e) {}

  try {
    db.prepare('CREATE INDEX IF NOT EXISTS idx_students_mentor_id ON students(mentor_id)').run();
  } catch (e) {}

  try {
    const appTableInfo = db.prepare('PRAGMA table_info(internship_applications)').all() as any[];
    const appCols = appTableInfo.map((c) => c.name);
    if (!appCols.includes('batch_id')) {
      db.prepare('ALTER TABLE internship_applications ADD COLUMN batch_id TEXT').run();
    }
  } catch (e) {}

  try {
    const batchTableInfo = db.prepare('PRAGMA table_info(batches)').all() as any[];
    const batchCols = batchTableInfo.map((c) => c.name);
    if (!batchCols.includes('department')) {
      db.prepare("ALTER TABLE batches ADD COLUMN department TEXT DEFAULT 'Software Engineering'").run();
    }
  } catch (e) {}

  try {
    const offerTableInfo = db.prepare('PRAGMA table_info(offer_letters)').all() as any[];
    const offerCols = offerTableInfo.map((c) => c.name);
    if (!offerCols.includes('fee_reason')) {
      db.prepare('ALTER TABLE offer_letters ADD COLUMN fee_reason TEXT').run();
    }
    if (!offerCols.includes('is_paid')) {
      db.prepare('ALTER TABLE offer_letters ADD COLUMN is_paid INTEGER DEFAULT 0').run();
    }
    if (!offerCols.includes('provisioning_status')) {
      db.prepare("ALTER TABLE offer_letters ADD COLUMN provisioning_status TEXT DEFAULT 'Pending'").run();
    }
    if (!offerCols.includes('provisioning_due_at')) {
      db.prepare('ALTER TABLE offer_letters ADD COLUMN provisioning_due_at TEXT').run();
    }
  } catch (e) {}

  try {
    const enrollTableInfo = db.prepare('PRAGMA table_info(batch_enrollments)').all() as any[];
    const enrollCols = enrollTableInfo.map((c) => c.name);
    if (!enrollCols.includes('admin_unlocked')) {
      db.prepare('ALTER TABLE batch_enrollments ADD COLUMN admin_unlocked INTEGER DEFAULT 0').run();
    }
    if (!enrollCols.includes('compulsory_modules')) {
      db.prepare('ALTER TABLE batch_enrollments ADD COLUMN compulsory_modules INTEGER DEFAULT 1').run();
    }
  } catch (e) {}

  try {
    const paymentTableInfo = db.prepare('PRAGMA table_info(payments)').all() as any[];
    const paymentCols = paymentTableInfo.map((c) => c.name);
    if (!paymentCols.includes('utr_number')) {
      db.prepare('ALTER TABLE payments ADD COLUMN utr_number TEXT').run();
    }
  } catch (e) {}

  try {
    const appTableInfo = db.prepare('PRAGMA table_info(internship_applications)').all() as any[];
    const appCols = appTableInfo.map((c) => c.name);
    if (!appCols.includes('photo_url')) {
      db.prepare('ALTER TABLE internship_applications ADD COLUMN photo_url TEXT').run();
    }
  } catch (e) {}

  try {
    const studentTableInfo = db.prepare('PRAGMA table_info(students)').all() as any[];
    const studentCols = studentTableInfo.map((c) => c.name);
    if (!studentCols.includes('photo_url')) {
      db.prepare('ALTER TABLE students ADD COLUMN photo_url TEXT').run();
    }
  } catch (e) {}

  try {
    const certTableInfo = db.prepare('PRAGMA table_info(certificates)').all() as any[];
    const certCols = certTableInfo.map((c) => c.name);
    if (!certCols.includes('photo_url')) {
      db.prepare('ALTER TABLE certificates ADD COLUMN photo_url TEXT').run();
    }
    if (!certCols.includes('roll_no')) {
      db.prepare('ALTER TABLE certificates ADD COLUMN roll_no TEXT').run();
    }
    if (!certCols.includes('branch')) {
      db.prepare('ALTER TABLE certificates ADD COLUMN branch TEXT').run();
    }
    if (!certCols.includes('start_date')) {
      db.prepare('ALTER TABLE certificates ADD COLUMN start_date TEXT').run();
    }
    if (!certCols.includes('end_date')) {
      db.prepare('ALTER TABLE certificates ADD COLUMN end_date TEXT').run();
    }
    if (!certCols.includes('instructor_name')) {
      db.prepare('ALTER TABLE certificates ADD COLUMN instructor_name TEXT').run();
    }
  } catch (e) {}

  // Initialize or maintain Certificate Layout & License Settings in system_settings
  try {
    const insertSetting = db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value, group_name, updated_at)
      VALUES (?, ?, 'certificate', ?)
    `);
    const now = new Date().toISOString();
    insertSetting.run('cert_company_name', 'AAGAM DIGITAL TECHNOLOGY PVT. LTD.', now);
    insertSetting.run('cert_tagline', 'LEARN • BUILD • INNOVATE', now);
    insertSetting.run('cert_iso_text', 'An ISO 9001: 2015 certified', now);
    insertSetting.run('cert_mca_text', 'Registered Under Ministry of Corporate Affairs, Govt. of India', now);
    insertSetting.run('cert_cin_number', 'Corporate Identification No. : U80904BR2021PTC054517', now);
    insertSetting.run('cert_ribbon_title', 'CERTIFICATE OF INDUSTRIAL INTERNSHIP EXCELLENCE', now);
    insertSetting.run('cert_corporate_office', 'Corporate office: Dak Bunglow Chauraha Near Biscoman Tower Patna', now);
    insertSetting.run('cert_director_name', 'Ayush Raj', now);
    insertSetting.run('cert_director_title', 'Director', now);
    insertSetting.run('cert_instructor_name', 'Akash Verma', now);
    insertSetting.run('cert_instructor_title', 'Course Instructor', now);
  } catch (e) {}

  console.log('[DB] Database tables and indexes initialized successfully.');
}

