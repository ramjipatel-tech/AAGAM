import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { recordAuditLog } from '../services/auditService';
import { sendAutomatedEmail } from '../services/emailService';
import { generateOfferId, generateCertificateId, generateLorId, generateRegistrationNo } from '../services/numberingService';
import { generateDocumentQrCode } from '../services/qrService';
import { provisionStudentCredentials } from '../services/provisioningWorker';
import { generateCertificatePDF, generateLorPDF, generateOfferLetterPDF } from '../services/pdfService';

export const adminRouter = express.Router();

// Require admin, superadmin, or staff for all admin endpoints
adminRouter.use(authenticateToken, requireRoles('admin', 'superadmin', 'staff'));

// 1. GET /api/admin/dashboard-stats
adminRouter.get('/dashboard-stats', (req: Request, res: Response) => {
  try {
    const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };
    const teacherCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('staff', 'admin', 'superadmin')").get() as { count: number };
    const totalUsersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const batchCount = db.prepare('SELECT COUNT(*) as count FROM batches').get() as { count: number };
    const appCount = db.prepare('SELECT COUNT(*) as count FROM internship_applications').get() as { count: number };
    const selectedCount = db.prepare("SELECT COUNT(*) as count FROM internship_applications WHERE status IN ('Selected', 'Offer Generated', 'Offer Accepted')").get() as { count: number };
    const offerCount = db.prepare('SELECT COUNT(*) as count FROM offer_letters').get() as { count: number };
    const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get() as { count: number };
    const lorCount = db.prepare('SELECT COUNT(*) as count FROM lors').get() as { count: number };
    const paymentsStat = db.prepare("SELECT COUNT(*) as count, SUM(CASE WHEN status = 'Success' THEN amount ELSE 0 END) as total_rev FROM payments").get() as any;
    const pendingReviews = db.prepare("SELECT COUNT(*) as count FROM internship_applications WHERE status IN ('Submitted', 'Under Review')").get() as { count: number };

    // Recent applications
    const recentApplications = db.prepare(`
      SELECT a.id, a.application_no, a.student_name, a.student_email, a.college_name, a.course, a.status, a.submitted_at,
             i.title as internship_title
      FROM internship_applications a
      JOIN internships i ON a.internship_id = i.id
      ORDER BY a.submitted_at DESC LIMIT 8
    `).all();

    // Recent payments
    const recentPayments = db.prepare(`
      SELECT p.*, u.email as user_email
      FROM payments p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 6
    `).all();

    // Active batches summary
    const activeBatches = db.prepare(`
      SELECT b.id, b.batch_code, b.title, b.start_date, b.end_date, b.duration_weeks, b.instructor_name, b.status,
             (SELECT COUNT(*) FROM batch_enrollments be WHERE be.batch_id = b.id) as enrolled_count
      FROM batches b
      ORDER BY b.created_at DESC LIMIT 5
    `).all();

    res.json({
      success: true,
      stats: {
        totalStudents: studentCount.count,
        totalTeachers: teacherCount.count,
        totalRegistrations: totalUsersCount.count,
        totalBatches: batchCount.count,
        totalApplications: appCount.count,
        selectedCandidates: selectedCount.count,
        offersGenerated: offerCount.count,
        certificatesIssued: certCount.count,
        lorsIssued: lorCount.count,
        totalCollection: paymentsStat.total_rev || 0,
        totalPayments: paymentsStat.count || 0,
        pendingReviews: pendingReviews.count,
      },
      recentApplications,
      recentPayments,
      activeBatches,
    });
  } catch (error: any) {
    console.error('[ADMIN STATS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to load admin stats.' });
  }
});

// 2. GET /api/admin/students
adminRouter.get('/students', (req: Request, res: Response) => {
  try {
    const { search, year, course, batch_id, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT u.id as user_id, u.email, u.full_name, u.phone, u.is_active, u.email_verified, u.created_at,
             s.id as student_id, s.mentor_id, s.registration_no, s.college_name, s.course, s.semester_year, s.roll_no, s.cgpa, s.skills,
             m.full_name as mentor_name,
             (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) as cert_count,
             (SELECT COUNT(*) FROM lors l WHERE l.user_id = u.id) as lor_count
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN users m ON s.mentor_id = m.id
      WHERE u.role = 'student'
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR s.registration_no LIKE ? OR s.college_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (year) {
      query += ' AND s.semester_year LIKE ?';
      params.push(`%${year}%`);
    }

    if (course) {
      query += ' AND s.course LIKE ?';
      params.push(`%${course}%`);
    }

    if (batch_id) {
      query += ' AND u.id IN (SELECT user_id FROM batch_enrollments WHERE batch_id = ?)';
      params.push(batch_id);
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const students = db.prepare(query).all(...params);
    res.json({ success: true, students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
});

// 3. GET /api/admin/mentors (List of available Staff/Mentors)
adminRouter.get('/mentors', (req: Request, res: Response) => {
  try {
    const mentors = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.phone, st.designation, st.department
      FROM users u
      LEFT JOIN staff st ON u.id = st.user_id
      WHERE u.role IN ('staff', 'admin', 'superadmin')
      ORDER BY u.full_name ASC
    `).all();
    res.json({ success: true, mentors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch mentors.' });
  }
});

// 4. POST /api/admin/assign-mentor (Assign Mentor to Student)
adminRouter.post('/assign-mentor', async (req: Request, res: Response) => {
  try {
    const mentor_id = req.body.mentor_id || req.body.mentorId;
    const student_id = req.body.student_id || req.body.studentId;
    const user_id = req.body.user_id || req.body.userId;

    if (!mentor_id || (!student_id && !user_id)) {
      res.status(400).json({ success: false, message: 'Student and Mentor IDs are required.' });
      return;
    }

    const mentor = db.prepare('SELECT id, full_name, email, phone FROM users WHERE id = ?').get(mentor_id) as any;
    if (!mentor) {
      res.status(404).json({ success: false, message: 'Mentor not found.' });
      return;
    }

    if (student_id) {
      db.prepare('UPDATE students SET mentor_id = ? WHERE id = ?').run(mentor_id, student_id);
    } else if (user_id) {
      db.prepare('UPDATE students SET mentor_id = ? WHERE user_id = ?').run(mentor_id, user_id);
    }

    // Update project assignments
    if (user_id) {
      db.prepare('UPDATE project_assignments SET mentor_id = ? WHERE user_id = ?').run(mentor_id, user_id);
    }

    const targetUser = db.prepare(`
      SELECT u.id, u.email, u.full_name
      FROM users u
      JOIN students s ON u.id = s.user_id
      WHERE s.id = ? OR u.id = ?
    `).get(student_id, user_id) as any;

    if (targetUser) {
      // Create In-App Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link, type, is_read, created_at)
        VALUES (?, ?, 'Mentor Assigned', ?, '/portal/student', 'info', 0, ?)
      `).run(
        uuidv4(),
        targetUser.id,
        `${mentor.full_name} (${mentor.email}) has been assigned as your dedicated AAGAM technical mentor.`,
        new Date().toISOString()
      );
    }

    recordAuditLog(req, 'MENTOR_ASSIGNED', 'students', student_id || user_id, {
      mentor_id,
      mentor_name: mentor.full_name,
    });

    res.json({
      success: true,
      message: `Mentor ${mentor.full_name} successfully assigned to student!`,
    });
  } catch (error: any) {
    console.error('[ASSIGN MENTOR ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to assign mentor.' });
  }
});

// 4.5. GET /api/admin/applications (All Internship Applications)
adminRouter.get('/applications', (req: Request, res: Response) => {
  try {
    const { search, status, internship_id, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT a.*, 
             i.title as internship_title, i.duration as internship_duration, i.fee_amount,
             o.offer_id, o.id as offer_letter_id, o.status as offer_status, o.issued_at as offer_issued_at,
             o.start_date as offer_start_date, o.end_date as offer_end_date
      FROM internship_applications a
      LEFT JOIN internships i ON a.internship_id = i.id
      LEFT JOIN offer_letters o ON a.id = o.application_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (a.student_name LIKE ? OR a.student_email LIKE ? OR a.application_no LIKE ? OR a.college_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status && status !== 'all' && status !== 'All') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (internship_id) {
      query += ' AND a.internship_id = ?';
      params.push(internship_id);
    }

    query += ' ORDER BY a.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const applications = db.prepare(query).all(...params) as any[];

    // Fetch documents for each application
    const docStmt = db.prepare('SELECT * FROM application_documents WHERE application_id = ?');

    const formatted = applications.map((app) => {
      const docs = docStmt.all(app.id);
      let ocrParsed = null;
      try {
        if (app.ocr_data) {
          ocrParsed = typeof app.ocr_data === 'string' ? JSON.parse(app.ocr_data) : app.ocr_data;
        }
      } catch (e) {}

      return {
        ...app,
        documents: docs,
        ocr_data: ocrParsed,
      };
    });

    res.json({
      success: true,
      applications: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error('[ADMIN APPS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch internship applications.' });
  }
});

// 5. POST /api/admin/applications/generate-offer (1-Click Offer Letter Generation & Email Delivery)
adminRouter.post('/applications/generate-offer', async (req: Request, res: Response) => {
  try {
    const application_id = req.body.application_id || req.body.applicationId;
    const start_date = req.body.start_date || req.body.startDate;
    const end_date = req.body.end_date || req.body.endDate;
    const stipend_fee_text = req.body.stipend_fee_text || req.body.stipendFeeText;
    const terms_conditions = req.body.terms_conditions || req.body.termsConditions;

    const app = db.prepare(`
      SELECT a.*, i.title as internship_title, i.duration as internship_duration, i.fee_amount
      FROM internship_applications a
      JOIN internships i ON a.internship_id = i.id
      WHERE a.id = ?
    `).get(application_id) as any;

    if (!app) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const payable_amount = req.body.fee_amount !== undefined
      ? Number(req.body.fee_amount)
      : (req.body.payable_amount !== undefined ? Number(req.body.payable_amount) : (app.fee_amount || 0));
    const fee_reason = req.body.fee_reason || req.body.feeReason || (payable_amount > 0 ? 'Cloud Engineering Workspace, LMS Access & Digital Ledger Verification Setup' : 'Zero-Fee Technical Track');

    // Check if offer letter already exists for this application
    const existingOffer = db.prepare('SELECT * FROM offer_letters WHERE application_id = ?').get(app.id) as any;

    const offerNo = existingOffer ? existingOffer.offer_id : generateOfferId();
    const offerId = existingOffer ? existingOffer.id : uuidv4();
    const now = new Date().toISOString();
    const qrCodeData = await generateDocumentQrCode(offerNo);

    // Calculate dates
    const startDate = start_date || (existingOffer ? existingOffer.start_date : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const endDate = end_date || (existingOffer ? existingOffer.end_date : new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const defaultTerms = terms_conditions ||
      '1. Intellectual property created during internship belongs to AAGAM Digital Technology.\n2. Adhere to project deadlines, mentoring sessions, and code review standards.\n3. Upon verified completion, an official verifiable Certificate and LOR will be awarded.';

    // Insert or Replace Offer Letter
    db.prepare(`
      INSERT OR REPLACE INTO offer_letters (
        id, offer_id, application_id, student_id, user_id, internship_id, student_name, college_name,
        course, internship_title, duration, start_date, end_date, stipend_fee_text, payable_amount,
        fee_reason, terms_conditions, qr_code_data, pdf_path, status, issued_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Issued', ?)
    `).run(
      offerId,
      offerNo,
      app.id,
      app.student_id,
      app.user_id,
      app.internship_id,
      app.student_name,
      app.college_name,
      app.course,
      app.internship_title,
      app.internship_duration || '3 Months',
      startDate,
      endDate,
      stipend_fee_text || 'Performance Stipend + Certificate + LOR',
      payable_amount,
      fee_reason,
      defaultTerms,
      qrCodeData,
      `/documents/offers/${offerNo}.pdf`,
      existingOffer ? existingOffer.issued_at : now
    );

    // Update Application Status to 'Offer Generated'
    db.prepare("UPDATE internship_applications SET status = 'Offer Generated', updated_at = ? WHERE id = ?").run(now, app.id);

    // Direct Acceptance Link in Email
    const acceptUrl = `http://127.0.0.1:5173/?view=accept-offer&offerId=${offerNo}`;

    // Generate Official Vector Offer Letter PDF
    let offerPdfPath: string | null = null;
    try {
      offerPdfPath = await generateOfferLetterPDF({
        offer_id: offerNo,
        student_name: app.student_name,
        college_name: app.college_name,
        course: app.course,
        internship_title: app.internship_title,
        duration: app.internship_duration || '3 Months',
        start_date: startDate,
        end_date: endDate,
        stipend_fee_text: stipend_fee_text || 'Performance Stipend + Certificate + LOR',
        payable_amount: payable_amount,
        fee_reason: fee_reason,
        terms_conditions: defaultTerms,
        issue_date: now.split('T')[0],
        student_email: app.student_email,
        student_phone: app.student_phone,
      });
    } catch (pdfErr) {
      console.warn('[OFFER PDF GENERATION WARN]', pdfErr);
    }

    const offerAttachments = offerPdfPath && fs.existsSync(offerPdfPath)
      ? [{ filename: `AAGAM_Offer_Letter_${offerNo}.pdf`, path: offerPdfPath, contentType: 'application/pdf' }]
      : undefined;

    // Send Automated Email via Gmail SMTP with Offer Letter PDF attached
    await sendAutomatedEmail({
      to: app.student_email,
      templateKey: 'offer_generated',
      variables: {
        student_name: app.student_name,
        offer_id: offerNo,
        internship_name: app.internship_title,
        start_date: startDate,
        accept_url: acceptUrl,
        payable_amount: payable_amount > 0 ? `₹${payable_amount}` : 'Free / Sponsored',
        fee_reason: fee_reason,
        stipend_fee_text: stipend_fee_text || 'Performance Stipend + Certificate + LOR',
      },
      attachments: offerAttachments,
      userId: app.user_id,
      notificationTitle: `Internship Offer Letter Generated: ${offerNo}`,
      relatedId: offerId,
    });

    recordAuditLog(req, 'OFFER_LETTER_GENERATED', 'offer_letters', offerId, {
      offerNo,
      student_email: app.student_email,
      internship: app.internship_title,
      payable_amount,
    });

    res.json({
      success: true,
      message: `Offer Letter ${offerNo} generated and dispatched to ${app.student_email}!`,
      offerId: offerNo,
      offer: {
        id: offerId,
        offer_id: offerNo,
        student_name: app.student_name,
        payable_amount,
        fee_reason,
        acceptUrl,
      },
    });
  } catch (error: any) {
    console.error('[GENERATE OFFER ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate offer letter.' });
  }
});

// 5.0. GET /api/admin/offers (All Generated Offer Letters with Payment / UTR details)
adminRouter.get('/offers', (req: Request, res: Response) => {
  try {
    const offers = db.prepare(`
      SELECT o.*, 
             a.application_no, a.student_phone, a.student_email as app_email,
             u.email as user_email,
             p.utr_number, p.status as payment_status, p.amount as paid_amount, p.created_at as payment_submitted_at
      FROM offer_letters o
      LEFT JOIN internship_applications a ON o.application_id = a.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON (p.offer_id = o.id OR p.offer_id = o.offer_id)
      ORDER BY o.issued_at DESC
    `).all();
    res.json({ success: true, offers });
  } catch (error: any) {
    console.error('[ADMIN OFFERS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letters.' });
  }
});

// 5.1. POST /api/admin/offers/:offerId/verify-and-accept (Admin Verifies UTR Payment & Generates Credentials)
adminRouter.post('/offers/:offerId/verify-and-accept', async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const { custom_password } = req.body;

    const offer = db.prepare(`
      SELECT o.*, a.student_phone, a.student_email as app_email, u.email as user_email
      FROM offer_letters o
      LEFT JOIN internship_applications a ON o.application_id = a.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ? OR o.offer_id = ?
    `).get(offerId, offerId) as any;

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer letter not found.' });
      return;
    }

    const now = new Date().toISOString();

    // 1. Mark payment record as Success
    db.prepare(`
      UPDATE payments
      SET status = 'Success', verified_at = ?
      WHERE (offer_id = ? OR offer_id = ?) AND status != 'Success'
    `).run(now, offer.id, offer.offer_id);

    // 2. Mark offer letter as Accepted & paid
    db.prepare(`
      UPDATE offer_letters
      SET status = 'Accepted', is_paid = 1, provisioning_status = 'Provisioned', accepted_at = COALESCE(accepted_at, ?)
      WHERE id = ?
    `).run(now, offer.id);

    // 3. Update application status
    if (offer.application_id) {
      db.prepare(`
        UPDATE internship_applications
        SET status = 'Offer Accepted', updated_at = ?
        WHERE id = ?
      `).run(now, offer.application_id);
    }

    // 4. Provision credentials and send email with attached Offer Letter PDF
    const adminName = req.user ? req.user.full_name : 'Admin';
    const provisionResult = await provisionStudentCredentials(
      offer.id,
      `Admin Manual Verification (${adminName})`,
      custom_password
    );

    recordAuditLog(req, 'OFFER_VERIFIED_AND_ACCEPTED', 'offer_letters', offer.id, {
      offer_id: offer.offer_id,
      student_name: offer.student_name,
      admin: adminName,
    });

    res.json({
      success: true,
      message: `Offer ${offer.offer_id} verified & accepted! Student credentials generated, Offer Letter PDF dispatched to student email, and enrolled into cohort.`,
      provision: provisionResult,
    });
  } catch (error: any) {
    console.error('[VERIFY & ACCEPT OFFER ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to verify and accept offer.' });
  }
});

adminRouter.post('/applications/provision-now', async (req: Request, res: Response) => {
  try {
    const { offer_id, application_id, user_id, student_id, target_id, email, password, custom_password } = req.body;
    const target = target_id || offer_id || application_id || user_id || student_id || email;
    if (!target) {
      res.status(400).json({ success: false, message: 'Offer ID, Application ID, Student ID or User ID is required.' });
      return;
    }

    const adminName = req.user ? req.user.full_name : 'Admin';
    const finalPassword = password || custom_password;
    const result = await provisionStudentCredentials(target, `Admin Manual (${adminName})`, finalPassword);

    if (result.success) {
      recordAuditLog(req, 'STUDENT_MANUALLY_PROVISIONED', 'users', result.user?.id, {
        target,
        email: result.user?.email,
      });
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('[PROVISION NOW ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to provision credentials.' });
  }
});

// 5.2. POST /api/admin/bulk-register-students (Bulk Student Registry & Auto Application Creation)
adminRouter.post('/bulk-register-students', async (req: Request, res: Response) => {
  try {
    const studentsData = req.body.students || []; // Array of { student_name, student_email, student_phone, college_name, course, semester_year, internship_id }
    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      res.status(400).json({ success: false, message: 'Please provide an array of student records.' });
      return;
    }

    const registered = [];
    const now = new Date().toISOString();

    for (const s of studentsData) {
      if (!s.student_name || !s.student_email) continue;
      const normalizedEmail = s.student_email.trim().toLowerCase();

      // Find or create user
      let user = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as any;
      let userId: string;
      if (user) {
        userId = user.id;
      } else {
        userId = uuidv4();
        const initialPass = `Aagam@${Math.floor(1000 + Math.random() * 9000)}`;
        const passHash = bcrypt.hashSync(initialPass, 10);
        db.prepare(`
          INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, email_verified, created_at, updated_at)
          VALUES (?, ?, ?, 'student', ?, ?, 1, 1, ?, ?)
        `).run(userId, normalizedEmail, passHash, s.student_name, s.student_phone || 'N/A', now, now);
      }

      // Default to first active internship if none specified
      let intId = s.internship_id;
      if (!intId) {
        const firstInt = db.prepare("SELECT id FROM internships WHERE status = 'Active' LIMIT 1").get() as any;
        intId = firstInt?.id || 'int-1';
      }

      const appId = uuidv4();
      const regNo = generateRegistrationNo();
      const studentId = uuidv4();

      // Student record
      let existingStu = db.prepare('SELECT id FROM students WHERE user_id = ?').get(userId) as any;
      if (!existingStu) {
        db.prepare(`
          INSERT INTO students (id, user_id, registration_no, college_name, course, semester_year, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(studentId, userId, regNo, s.college_name || 'N/A', s.course || 'B.Tech', s.semester_year || '3rd Year', now, now);
      }

      // Insert Application
      db.prepare(`
        INSERT INTO internship_applications (
          id, application_no, internship_id, student_id, user_id, student_name, student_email, student_phone,
          college_name, course, semester_year, roll_no, status, submitted_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)
      `).run(
        appId,
        regNo,
        intId,
        studentId,
        userId,
        s.student_name,
        normalizedEmail,
        s.student_phone || 'N/A',
        s.college_name || 'Institute of Technology',
        s.course || 'B.Tech',
        s.semester_year || '3rd Year',
        s.roll_no || null,
        now,
        now
      );

      registered.push({ id: appId, application_no: regNo, student_name: s.student_name, student_email: normalizedEmail });
    }

    recordAuditLog(req, 'BULK_STUDENTS_REGISTERED', 'internship_applications', null, { count: registered.length });

    res.json({
      success: true,
      message: `Successfully registered ${registered.length} candidate applications in bulk!`,
      registered,
    });
  } catch (error: any) {
    console.error('[BULK REGISTER ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to bulk register students.' });
  }
});

// 5.3. POST /api/admin/bulk-generate-offers (Bulk 1-Click Offer Issuance)
adminRouter.post('/bulk-generate-offers', async (req: Request, res: Response) => {
  try {
    const { application_ids, payable_amount = 0, fee_reason, start_date, end_date, stipend_fee_text } = req.body;
    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      res.status(400).json({ success: false, message: 'Please provide at least one application ID.' });
      return;
    }

    const generated = [];
    const now = new Date().toISOString();
    const startDate = start_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const appId of application_ids) {
      const app = db.prepare(`
        SELECT a.*, i.title as internship_title, i.duration as internship_duration
        FROM internship_applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.id = ?
      `).get(appId) as any;

      if (!app) continue;

      const offerNo = generateOfferId();
      const offerId = uuidv4();
      const qrCodeData = await generateDocumentQrCode(offerNo);

      db.prepare(`
        INSERT OR REPLACE INTO offer_letters (
          id, offer_id, application_id, student_id, user_id, internship_id, student_name, college_name,
          course, internship_title, duration, start_date, end_date, stipend_fee_text, payable_amount,
          fee_reason, terms_conditions, qr_code_data, pdf_path, status, issued_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Standard AAGAM Enterprise Terms', ?, ?, 'Issued', ?)
      `).run(
        offerId,
        offerNo,
        app.id,
        app.student_id,
        app.user_id,
        app.internship_id,
        app.student_name,
        app.college_name,
        app.course,
        app.internship_title,
        app.internship_duration || '3 Months',
        startDate,
        endDate,
        stipend_fee_text || 'Performance Stipend + Certificate + LOR',
        payable_amount,
        fee_reason || 'Cloud Workspace, LMS Access & Digital Ledger Verification Fee',
        qrCodeData,
        `/documents/offers/${offerNo}.pdf`,
        now
      );

      db.prepare("UPDATE internship_applications SET status = 'Offer Generated', updated_at = ? WHERE id = ?").run(now, app.id);

      const acceptUrl = `http://127.0.0.1:5173/?view=accept-offer&offerId=${offerNo}`;

      let bulkPdfPath: string | null = null;
      try {
        bulkPdfPath = await generateOfferLetterPDF({
          offer_id: offerNo,
          student_name: app.student_name,
          college_name: app.college_name,
          course: app.course,
          internship_title: app.internship_title,
          duration: app.internship_duration || '3 Months',
          start_date: startDate,
          end_date: endDate,
          stipend_fee_text: stipend_fee_text || 'Performance Stipend + Certificate + LOR',
          payable_amount: payable_amount,
          fee_reason: fee_reason || 'Cloud Workspace, LMS Access & Digital Ledger Verification Fee',
          terms_conditions: 'Standard AAGAM Enterprise Terms',
          issue_date: now.split('T')[0],
          student_email: app.student_email,
          student_phone: app.student_phone,
        });
      } catch (e) {}

      const bulkAttachments = bulkPdfPath && fs.existsSync(bulkPdfPath)
        ? [{ filename: `AAGAM_Offer_Letter_${offerNo}.pdf`, path: bulkPdfPath, contentType: 'application/pdf' }]
        : undefined;

      await sendAutomatedEmail({
        to: app.student_email,
        templateKey: 'offer_generated',
        variables: {
          student_name: app.student_name,
          offer_id: offerNo,
          internship_name: app.internship_title,
          start_date: startDate,
          accept_url: acceptUrl,
          payable_amount: payable_amount > 0 ? `₹${payable_amount}` : 'Free / Sponsored',
          fee_reason: fee_reason || 'Cloud Workspace & LMS Access Fee',
          stipend_fee_text: stipend_fee_text || 'Performance Stipend + Certificate + LOR',
        },
        attachments: bulkAttachments,
        userId: app.user_id,
        notificationTitle: `Internship Offer Letter Generated: ${offerNo}`,
        relatedId: offerId,
      });

      generated.push({ offer_id: offerNo, student_name: app.student_name, student_email: app.student_email });
    }

    recordAuditLog(req, 'BULK_OFFERS_GENERATED', 'offer_letters', null, { count: generated.length });

    res.json({
      success: true,
      message: `Successfully generated and dispatched ${generated.length} offer letters in bulk!`,
      generated,
    });
  } catch (error: any) {
    console.error('[BULK OFFER ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to generate bulk offers.' });
  }
});

// 5.4. POST /api/admin/lors/bulk-generate (Bulk LOR Generation)
adminRouter.post('/lors/bulk-generate', async (req: Request, res: Response) => {
  try {
    const student_ids = req.body.student_ids || req.body.studentIds || [];
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      res.status(400).json({ success: false, message: 'Please select at least one student for LOR generation.' });
      return;
    }

    const generatedLors = [];
    const now = new Date().toISOString();

    for (const sid of student_ids) {
      const studentData = db.prepare(`
        SELECT s.id as student_id, s.user_id, s.college_name, u.full_name as student_name, u.email as student_email,
               o.internship_id, o.internship_title, o.duration
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN offer_letters o ON s.id = o.student_id OR s.user_id = o.user_id
        WHERE s.id = ? OR s.user_id = ?
        ORDER BY o.issued_at DESC LIMIT 1
      `).get(sid, sid) as any;

      if (!studentData) continue;

      const lorNo = generateLorId();
      const lorId = uuidv4();
      const qrCodeData = await generateDocumentQrCode(lorNo);

      db.prepare(`
        INSERT INTO lors (
          id, lor_id, student_id, user_id, internship_id, student_name, college_name,
          internship_title, duration, recommendation_body, performance_rating, qr_code_data, pdf_path, status, issued_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Exceptional / Top 5%', ?, ?, 'Valid', ?)
      `).run(
        lorId,
        lorNo,
        studentData.student_id,
        studentData.user_id,
        studentData.internship_id || 'default_internship',
        studentData.student_name,
        studentData.college_name || 'Institute of Technology',
        studentData.internship_title || 'Software Engineering Internship',
        studentData.duration || '3 Months',
        `It gives us immense pleasure to recommend ${studentData.student_name}. During their internship tenure at AAGAM Digital Technology, they exhibited outstanding software engineering proficiency, problem-solving skills, and commendable professional commitment.`,
        qrCodeData,
        `/documents/lors/${lorNo}.pdf`,
        now
      );

      await sendAutomatedEmail({
        to: studentData.student_email,
        templateKey: 'lor_issued',
        variables: {
          student_name: studentData.student_name,
          program_title: studentData.internship_title || 'Software Engineering Internship',
          lor_id: lorNo,
          rating: 'Exceptional / Top 5%',
          verify_url: `http://127.0.0.1:5173/verify?id=${lorNo}`,
        },
        userId: studentData.user_id,
        notificationTitle: `Letter of Recommendation Issued: ${lorNo}`,
        relatedId: lorId,
      });

      generatedLors.push({ lor_id: lorNo, student_name: studentData.student_name });
    }

    recordAuditLog(req, 'BULK_LORS_GENERATED', 'lors', null, { count: generatedLors.length });

    res.json({
      success: true,
      message: `Successfully generated and dispatched ${generatedLors.length} verifiable Letters of Recommendation (LORs)!`,
      lors: generatedLors,
    });
  } catch (error: any) {
    console.error('[BULK LOR ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to generate bulk LORs.' });
  }
});

// 6. POST /api/admin/certificates/bulk-generate (Bulk Certificate Generation)
adminRouter.post('/certificates/bulk-generate', async (req: Request, res: Response) => {
  try {
    const student_ids = req.body.student_ids || req.body.studentIds || []; // Array of student profile IDs or user IDs

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      res.status(400).json({ success: false, message: 'Please select at least one student for certificate generation.' });
      return;
    }

    const generatedCertificates = [];
    const now = new Date().toISOString();
    const issueDate = now.split('T')[0];

    for (const sid of student_ids) {
      // Find student and active/accepted internship
      const studentData = db.prepare(`
        SELECT s.id as student_id, s.user_id, s.college_name, s.roll_no, s.branch, s.photo_url,
               u.full_name as student_name, u.email as student_email, u.avatar_url,
               o.internship_id, o.internship_title, o.duration, o.start_date, o.end_date
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN offer_letters o ON s.id = o.student_id OR s.user_id = o.user_id
        WHERE s.id = ? OR s.user_id = ?
        ORDER BY o.issued_at DESC LIMIT 1
      `).get(sid, sid) as any;

      if (!studentData) continue;

      const certNo = generateCertificateId();
      const certId = uuidv4();
      const qrCodeData = await generateDocumentQrCode(certNo);
      const photoUrl = studentData.photo_url || studentData.avatar_url || null;

      try {
        await generateCertificatePDF({
          certificate_id: certNo,
          student_name: studentData.student_name,
          college_name: studentData.college_name || 'Institute of Technology',
          program_title: studentData.internship_title || 'Software Engineering Internship',
          duration: studentData.duration || '4 Weeks',
          issue_date: issueDate,
          grade_or_remarks: 'Grade: A+ (Outstanding Performance)',
          photo_url: photoUrl,
          roll_no: studentData.roll_no || '',
          branch: studentData.branch || 'Engineering',
          start_date: studentData.start_date || issueDate,
          end_date: studentData.end_date || issueDate,
          instructor_name: 'Akash Verma',
        });
      } catch (err) {}

      db.prepare(`
        INSERT INTO certificates (
          id, certificate_id, student_id, user_id, internship_id, student_name, college_name,
          program_title, duration, issue_date, grade_or_remarks, signatory_ceo, signatory_hr, qr_code_data, pdf_path, status, issued_at,
          photo_url, roll_no, branch, start_date, end_date, instructor_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Grade: A+ (Outstanding Performance)', 'Ayush Raj, Director', 'Akash Verma, Course Instructor', ?, ?, 'Valid', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        certId,
        certNo,
        studentData.student_id,
        studentData.user_id,
        studentData.internship_id || 'default_internship',
        studentData.student_name,
        studentData.college_name || 'Institute of Technology',
        studentData.internship_title || 'Software Engineering Internship',
        studentData.duration || '4 Weeks',
        issueDate,
        qrCodeData,
        `/documents/certificates/${certNo}.pdf`,
        now,
        photoUrl,
        studentData.roll_no || '',
        studentData.branch || 'Engineering',
        studentData.start_date || issueDate,
        studentData.end_date || issueDate,
        'Akash Verma'
      );

      // Send Certificate Email to Student
      await sendAutomatedEmail({
        to: studentData.student_email,
        templateKey: 'certificate_issued',
        variables: {
          student_name: studentData.student_name,
          program_title: studentData.internship_title || 'Internship Program',
          certificate_id: certNo,
          verify_url: `http://127.0.0.1:5173/verify?id=${certNo}`,
        },
        userId: studentData.user_id,
        notificationTitle: `Certificate of Completion Issued: ${certNo}`,
        relatedId: certId,
      });

      generatedCertificates.push({
        certificate_id: certNo,
        student_name: studentData.student_name,
        student_email: studentData.student_email,
        program_title: studentData.internship_title || 'Software Engineering',
        status: 'Valid',
      });
    }

    recordAuditLog(req, 'BULK_CERTIFICATES_GENERATED', 'certificates', null, {
      count: generatedCertificates.length,
      certificates: generatedCertificates.map((c) => c.certificate_id),
    });

    res.json({
      success: true,
      message: `Successfully generated and dispatched ${generatedCertificates.length} verified certificates!`,
      certificates: generatedCertificates,
    });
  } catch (error: any) {
    console.error('[BULK CERTIFICATE ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to generate certificates in bulk.' });
  }
});

// 7. Tasks & Quizzes Management
adminRouter.get('/tasks', (req: Request, res: Response) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, i.title as internship_title, COUNT(ts.id) as submission_count
      FROM internship_tasks t
      LEFT JOIN internships i ON t.internship_id = i.id
      LEFT JOIN task_submissions ts ON t.id = ts.task_id
      GROUP BY t.id
      ORDER BY t.week_no ASC
    `).all();
    res.json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
});

adminRouter.post('/tasks/save', (req: Request, res: Response) => {
  try {
    const { id, internship_id, title, description, week_no, due_date, max_points } = req.body;
    const now = new Date().toISOString();

    if (id) {
      db.prepare(`
        UPDATE internship_tasks
        SET title = ?, description = ?, week_no = ?, due_date = ?, max_points = ?
        WHERE id = ?
      `).run(title, description, week_no || 1, due_date || null, max_points || 100, id);
    } else {
      const newId = uuidv4();
      db.prepare(`
        INSERT INTO internship_tasks (id, internship_id, title, description, week_no, due_date, max_points, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newId, internship_id || null, title, description, week_no || 1, due_date || null, max_points || 100, now);
    }

    res.json({ success: true, message: 'Internship task saved successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to save task.' });
  }
});

adminRouter.get('/quizzes', (req: Request, res: Response) => {
  try {
    const quizzes = db.prepare(`
      SELECT q.*, i.title as internship_title, COUNT(qa.id) as attempt_count
      FROM quizzes q
      LEFT JOIN internships i ON q.internship_id = i.id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `).all() as any[];

    const formatted = quizzes.map((q) => {
      let questions = [];
      try {
        questions = JSON.parse(q.questions_json);
      } catch (e) {}
      return {
        ...q,
        questions,
      };
    });

    res.json({ success: true, quizzes: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes.' });
  }
});

adminRouter.post('/quizzes/save', (req: Request, res: Response) => {
  try {
    const { id, internship_id, title, questions, passing_score } = req.body;
    const now = new Date().toISOString();
    const questionsJson = JSON.stringify(questions || []);

    if (id) {
      db.prepare(`
        UPDATE quizzes
        SET title = ?, questions_json = ?, passing_score = ?
        WHERE id = ?
      `).run(title, questionsJson, passing_score || 70, id);
    } else {
      const newId = uuidv4();
      db.prepare(`
        INSERT INTO quizzes (id, internship_id, title, questions_json, passing_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(newId, internship_id || null, title, questionsJson, passing_score || 70, now);
    }

    res.json({ success: true, message: 'Quiz assessment saved successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to save quiz.' });
  }
});

// 8. Applications Review
adminRouter.post('/applications/review', (req: Request, res: Response) => {
  try {
    const { application_id, status, review_notes, admin_feedback } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE internship_applications
      SET status = ?, review_notes = ?, admin_feedback = ?, updated_at = ?
      WHERE id = ?
    `).run(status, review_notes || null, admin_feedback || null, now, application_id);

    const app = db.prepare('SELECT student_email, student_name FROM internship_applications WHERE id = ?').get(application_id) as any;

    recordAuditLog(req, 'APPLICATION_REVIEW_STATUS_CHANGED', 'internship_applications', application_id, {
      new_status: status,
      student_email: app?.student_email,
    });

    res.json({ success: true, message: `Application status updated to ${status}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to review application.' });
  }
});

// 9. Email Templates & Logs
adminRouter.get('/email-templates', (req: Request, res: Response) => {
  try {
    const templates = db.prepare('SELECT * FROM email_templates ORDER BY updated_at DESC').all();
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch email templates.' });
  }
});

adminRouter.post('/email-templates/save', (req: Request, res: Response) => {
  try {
    const { id, subject, body_html, is_active } = req.body;
    db.prepare(`
      UPDATE email_templates
      SET subject = ?, body_html = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(subject, body_html, is_active ? 1 : 0, new Date().toISOString(), id);
    res.json({ success: true, message: 'Email template updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update email template.' });
  }
});

adminRouter.get('/email-logs', (req: Request, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100').all();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch email logs.' });
  }
});

adminRouter.post('/send-test-email', async (req: Request, res: Response) => {
  try {
    const { to, templateKey } = req.body;
    const result = await sendAutomatedEmail({
      to: to || 'test@example.com',
      templateKey: templateKey || 'otp_verification',
      variables: {
        otp: '984521',
        student_name: 'Test Student',
        registration_no: 'AAGAM-INT-2026-999999',
        internship_name: 'Full Stack Engineering',
        offer_id: 'AAGAM-OFFER-2026-999999',
        amount: 0,
        payment_id: 'PAY-TEST-001',
        certificate_id: 'AAGAM-CERT-2026-999999',
      },
      notificationTitle: 'Test Email Dispatch',
    });

    res.json({ success: true, message: `Test email dispatched to ${to}.`, result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to dispatch test email.' });
  }
});

// 10. Audit Logs
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 150').all();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

// 11. System Settings
adminRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings').all();
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load settings.' });
  }
});

adminRouter.post('/settings', (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    const now = new Date().toISOString();
    const update = db.prepare('UPDATE system_settings SET value = ?, updated_at = ? WHERE key = ?');

    for (const item of settings) {
      update.run(String(item.value), now, item.key);
    }

    recordAuditLog(req, 'SYSTEM_SETTINGS_UPDATED', 'system_settings');
    res.json({ success: true, message: 'System settings updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

// 11.1. Certificate Layout & License Settings
adminRouter.get('/certificate-settings', (req: Request, res: Response) => {
  try {
    const rows = db.prepare("SELECT key, value FROM system_settings WHERE group_name = 'certificate'").all() as any[];
    const settings: Record<string, string> = {
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
    };
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load certificate settings.' });
  }
});

adminRouter.post('/certificate-settings', (req: Request, res: Response) => {
  try {
    const settings = req.body.settings || req.body;
    const now = new Date().toISOString();
    const upsert = db.prepare(`
      INSERT INTO system_settings (key, value, group_name, updated_at)
      VALUES (?, ?, 'certificate', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    for (const [key, val] of Object.entries(settings)) {
      if (typeof val === 'string' || typeof val === 'number') {
        upsert.run(key, String(val), now);
      }
    }

    recordAuditLog(req, 'CERTIFICATE_SETTINGS_UPDATED', 'system_settings');
    res.json({ success: true, message: 'Certificate layout & license settings saved successfully!' });
  } catch (error: any) {
    console.error('[CERTIFICATE SETTINGS UPDATE ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to update certificate settings.' });
  }
});

// 12. Contact Enquiries Management
adminRouter.get('/contacts', (req: Request, res: Response) => {
  try {
    const contacts = db.prepare('SELECT * FROM contact_enquiries ORDER BY created_at DESC').all();
    res.json({ success: true, contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load enquiries.' });
  }
});

adminRouter.post('/contacts/status', (req: Request, res: Response) => {
  try {
    const { id, status, staff_notes } = req.body;
    db.prepare('UPDATE contact_enquiries SET status = ?, staff_notes = ? WHERE id = ?').run(status, staff_notes || null, id);
    res.json({ success: true, message: 'Enquiry updated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update enquiry.' });
  }
});

// 13. POST /api/admin/provision-now (⚡ Universal Instant Provisioning for Candidate Workspace)
adminRouter.post('/provision-now', async (req: Request, res: Response) => {
  try {
    const { offer_id, user_id, student_id, application_id, target_id, email, password, custom_password } = req.body;
    const target = target_id || offer_id || user_id || student_id || application_id || email;
    if (!target) {
      res.status(400).json({ success: false, message: 'Target ID, User ID, Student ID, or Offer ID is required.' });
      return;
    }

    const adminName = req.user ? req.user.full_name : 'Admin';
    const finalPassword = password || custom_password;
    const result = await provisionStudentCredentials(target, `Admin (${adminName})`, finalPassword);

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    recordAuditLog(req, 'STUDENT_PROVISIONED_IMMEDIATE', 'users', result.user?.id, {
      admin: adminName,
      target,
      user_id: result.user?.id,
      email: result.user?.email,
    });

    res.json({
      success: true,
      message: result.message || 'Student Portal workspace & credentials provisioned immediately!',
      user: result.user,
      tempPassword: result.tempPassword,
      credentials: {
        email: result.user?.email,
        password: result.tempPassword,
        name: result.user?.full_name,
        registration_no: result.user?.registration_no,
      },
    });
  } catch (error: any) {
    console.error('[PROVISION NOW ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to provision credentials.' });
  }
});

// 13.1. POST /api/admin/students/set-credentials (Generate or Set Custom Password for Student)
adminRouter.post('/students/set-credentials', async (req: Request, res: Response) => {
  try {
    const { user_id, student_id, target_id, email, password, custom_password, auto_generate } = req.body;
    const target = target_id || user_id || student_id || email;
    if (!target) {
      res.status(400).json({ success: false, message: 'Target Student or User identifier is required.' });
      return;
    }

    const finalPassword = auto_generate ? undefined : (password || custom_password);
    const adminName = req.user ? req.user.full_name : 'Admin';
    const result = await provisionStudentCredentials(target, `Admin (${adminName})`, finalPassword);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    recordAuditLog(req, 'STUDENT_CREDENTIALS_SET_BY_ADMIN', 'users', result.user?.id, {
      admin: adminName,
      target,
      email: result.user?.email,
    });

    res.json({
      success: true,
      message: result.message,
      user: result.user,
      tempPassword: result.tempPassword,
      credentials: {
        email: result.user?.email,
        password: result.tempPassword,
        name: result.user?.full_name,
        registration_no: result.user?.registration_no,
      },
    });
  } catch (error: any) {
    console.error('[SET STUDENT CREDENTIALS ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update student credentials.' });
  }
});

// 13.2. POST /api/admin/change-password (Admin Self-Password Management)
adminRouter.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!new_password || new_password.trim().length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      return;
    }

    if (confirm_password && new_password !== confirm_password) {
      res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
      return;
    }

    const adminUser = db.prepare('SELECT id, email, password_hash, full_name, role FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!adminUser) {
      res.status(404).json({ success: false, message: 'Admin user account not found.' });
      return;
    }

    // Verify current password if provided
    if (current_password) {
      const isMatch = bcrypt.compareSync(current_password, adminUser.password_hash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }
    }

    const newHash = bcrypt.hashSync(new_password.trim(), 10);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, adminUser.id);

    recordAuditLog(req, 'ADMIN_PASSWORD_CHANGED', 'users', adminUser.id, {
      email: adminUser.email,
      role: adminUser.role,
    });

    res.json({
      success: true,
      message: 'Admin password updated successfully! Please keep your new credentials secure.',
    });
  } catch (error: any) {
    console.error('[ADMIN CHANGE PASSWORD ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to update admin password.' });
  }
});


// 14. POST /api/admin/bulk-register-students
adminRouter.post('/bulk-register-students', async (req: Request, res: Response) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ success: false, message: 'students must be a non-empty array' });
      return;
    }

    const now = new Date().toISOString();
    const registered: any[] = [];
    const errors: any[] = [];

    for (const item of students) {
      try {
        if (!item.email || !item.full_name) {
          errors.push({ item, error: 'Missing email or full_name' });
          continue;
        }

        const normalizedEmail = item.email.trim().toLowerCase();
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;
        const tempPassword = item.password || `Aagam@${Math.floor(100000 + Math.random() * 900000)}`;
        const passwordHash = bcrypt.hashSync(tempPassword, 10);

        let userId: string;
        if (user) {
          userId = user.id;
          db.prepare('UPDATE users SET password_hash = ?, is_active = 1, updated_at = ? WHERE id = ?').run(passwordHash, now, userId);
        } else {
          userId = uuidv4();
          db.prepare(`
            INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, 'student', ?, ?, 1, 1, ?, ?)
          `).run(userId, normalizedEmail, passwordHash, item.full_name, item.phone || 'N/A', now, now);
        }

        const regNo = generateRegistrationNo();
        const existingStudent = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId) as any;

        if (!existingStudent) {
          db.prepare(`
            INSERT INTO students (id, user_id, registration_no, college_name, course, branch, semester_year, roll_no, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            userId,
            regNo,
            item.college_name || 'N/A',
            item.course || 'B.Tech',
            item.branch || 'CSE',
            item.semester_year || 'Final Year',
            item.roll_no || null,
            now,
            now
          );
        }

        // Send Welcome Credentials Email
        await sendAutomatedEmail({
          to: normalizedEmail,
          templateKey: 'credentials_provisioned',
          variables: {
            student_name: item.full_name,
            email: normalizedEmail,
            password: tempPassword,
            registration_no: regNo,
            login_url: 'http://127.0.0.1:5173/portal/student',
          },
          userId,
          notificationTitle: 'Welcome to AAGAM Digital Technology',
        });

        registered.push({ email: normalizedEmail, name: item.full_name, registration_no: regNo });
      } catch (err: any) {
        errors.push({ item, error: err.message });
      }
    }

    recordAuditLog(req, 'BULK_STUDENTS_REGISTERED', 'users', 'BULK', {
      count: registered.length,
      errorsCount: errors.length,
    });

    res.json({
      success: true,
      message: `Bulk registration completed: ${registered.length} created, ${errors.length} failed.`,
      count: registered.length,
      registered,
      errors,
    });
  } catch (error: any) {
    console.error('[BULK REGISTER ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk student registration.' });
  }
});

// 15. POST /api/admin/bulk-generate-offers
adminRouter.post('/bulk-generate-offers', async (req: Request, res: Response) => {
  try {
    const { application_ids, start_date, end_date, duration, fee_amount, fee_reason, stipend_amount } = req.body;
    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      res.status(400).json({ success: false, message: 'application_ids must be a non-empty array' });
      return;
    }

    const generated: any[] = [];
    const now = new Date().toISOString();

    for (const appId of application_ids) {
      try {
        const app = db.prepare(`
          SELECT a.*, i.title as internship_title, i.duration as internship_duration
          FROM internship_applications a
          JOIN internships i ON a.internship_id = i.id
          WHERE a.id = ?
        `).get(appId) as any;

        if (!app) continue;

        const offerNo = generateOfferId();
        const offerId = uuidv4();
        const qrCodeData = await generateDocumentQrCode(offerNo);
        const payable = fee_amount !== undefined ? Number(fee_amount) : 0;

        db.prepare(`
          INSERT INTO offer_letters (
            id, offer_id, application_id, student_id, user_id, internship_id, student_name, college_name,
            course, internship_title, duration, start_date, end_date, stipend_fee_text, payable_amount,
            fee_reason, terms_conditions, qr_code_data, pdf_path, status, issued_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Issued', ?)
        `).run(
          offerId,
          offerNo,
          app.id,
          app.student_id || app.user_id || app.id,
          app.user_id || app.student_id || app.id,
          app.internship_id,
          app.student_name,
          app.college_name,
          app.course,
          app.internship_title,
          duration || app.internship_duration || '3 Months',
          start_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          end_date || new Date(Date.now() + 97 * 86400000).toISOString().split('T')[0],
          'Performance-based Stipend + Certificate + LOR',
          payable,
          fee_reason || (payable > 0 ? 'Cloud workspace infrastructure' : 'Zero-Fee Track'),
          'Standard terms and conditions apply.',
          qrCodeData,
          `/documents/offers/${offerNo}.pdf`,
          now
        );

        db.prepare("UPDATE internship_applications SET status = 'Offer Generated', updated_at = ? WHERE id = ?").run(now, app.id);

        await sendAutomatedEmail({
          to: app.student_email,
          templateKey: 'offer_generated',
          variables: {
            student_name: app.student_name,
            offer_id: offerNo,
            internship_name: app.internship_title,
            start_date: start_date || 'Upcoming Batch',
            accept_url: `http://127.0.0.1:5173/?view=accept-offer&offerId=${offerNo}`,
          },
          notificationTitle: 'Official Offer Letter Issued',
        });

        generated.push({ application_id: app.id, offer_id: offerNo });
      } catch (e: any) {
        console.error('[BULK OFFER ERROR for app]', appId, e.message);
      }
    }

    res.json({
      success: true,
      message: `Generated ${generated.length} offer letters!`,
      generated_count: generated.length,
      offers: generated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to bulk generate offer letters.' });
  }
});

// =========================================================================
// 12. TEACHERS & FACULTY MANAGEMENT
// =========================================================================

// 12.1. GET /api/admin/teachers
adminRouter.get('/teachers', (req: Request, res: Response) => {
  try {
    const teachers = db.prepare(`
      SELECT st.id, st.user_id, st.designation, st.department, st.employee_id, st.phone, st.bio, st.created_at,
             u.email, u.full_name, u.is_active, u.avatar_url
      FROM staff st
      JOIN users u ON st.user_id = u.id
      ORDER BY st.created_at DESC
    `).all();

    res.json({ success: true, teachers });
  } catch (error: any) {
    console.error('[GET TEACHERS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers list.' });
  }
});

// 12.2. POST /api/admin/teachers/create
adminRouter.post('/teachers/create', async (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, department, designation, bio } = req.body;

    if (!full_name || !email) {
      res.status(400).json({ success: false, message: 'Full name and email are required.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      res.status(400).json({ success: false, message: 'A user account with this email already exists.' });
      return;
    }

    const userId = uuidv4();
    const staffId = uuidv4();
    const employeeId = `AAGAM-FAC-${Math.floor(100 + Math.random() * 900)}`;
    const tempPassword = `AagamFac@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = bcrypt.hashSync(tempPassword, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, phone, avatar_url, is_active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, 'staff', ?, ?, null, 1, 1, ?, ?)
    `).run(userId, email.toLowerCase(), passwordHash, full_name, phone || null, now, now);

    db.prepare(`
      INSERT INTO staff (id, user_id, designation, department, employee_id, phone, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      staffId,
      userId,
      designation || 'Instructor / Technical Mentor',
      department || 'Software Engineering',
      employeeId,
      phone || null,
      bio || 'Faculty mentor overseeing student engineering cohorts.',
      now
    );

    // Send Welcome Email with credentials
    await sendAutomatedEmail({
      to: email.toLowerCase(),
      templateKey: 'teacher_welcome_credentials',
      variables: {
        instructor_name: full_name,
        email: email.toLowerCase(),
        temporary_password: tempPassword,
        department: department || 'Engineering Faculty',
        designation: designation || 'Technical Instructor',
      },
      userId,
      notificationTitle: 'Faculty Onboarding Credentials',
    });

    recordAuditLog(req, 'TEACHER_REGISTERED', 'staff', staffId, { email, full_name, employeeId });

    res.json({
      success: true,
      message: `Teacher ${full_name} registered successfully. Login credentials dispatched to ${email}.`,
      teacher: {
        id: staffId,
        user_id: userId,
        full_name,
        email: email.toLowerCase(),
        employee_id: employeeId,
        department,
        designation,
        temp_password: tempPassword,
      },
    });
  } catch (error: any) {
    console.error('[CREATE TEACHER ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to create teacher account.' });
  }
});

// 12.3. DELETE /api/admin/teachers/:id
adminRouter.delete('/teachers/:id', (req: Request, res: Response) => {
  try {
    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id) as any;
    if (!staff) {
      res.status(404).json({ success: false, message: 'Teacher record not found.' });
      return;
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(staff.user_id);
    db.prepare('DELETE FROM staff WHERE id = ?').run(staff.id);

    recordAuditLog(req, 'TEACHER_DELETED', 'staff', staff.id, { user_id: staff.user_id });
    res.json({ success: true, message: 'Teacher record removed successfully.' });
  } catch (error: any) {
    console.error('[DELETE TEACHER ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to delete teacher record.' });
  }
});

// =========================================================================
// 13. BATCH & CURRICULUM MANAGEMENT
// =========================================================================

// 13.1. GET /api/admin/batches
adminRouter.get('/batches', (req: Request, res: Response) => {
  try {
    const batches = db.prepare(`
      SELECT b.*, 
             (SELECT COUNT(*) FROM batch_enrollments be WHERE be.batch_id = b.id) as enrolled_count,
             (SELECT COUNT(*) FROM batch_enrollments be WHERE be.batch_id = b.id AND be.status = 'Completed') as completed_count
      FROM batches b
      ORDER BY b.created_at DESC
    `).all();

    const formatted = batches.map((b: any) => ({
      ...b,
      curriculum_modules: b.curriculum_modules ? JSON.parse(b.curriculum_modules) : [],
    }));

    res.json({ success: true, batches: formatted });
  } catch (error: any) {
    console.error('[GET BATCHES ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch batches.' });
  }
});

// 13.2. POST /api/admin/batches
adminRouter.post('/batches', (req: Request, res: Response) => {
  try {
    const {
      title,
      department = 'Software Engineering',
      program_id,
      program_type = 'internship',
      start_date,
      end_date,
      duration_weeks = 8,
      instructor_name,
      instructor_email,
      curriculum_modules,
      max_seats = 60,
    } = req.body;

    if (!title || !start_date || !end_date) {
      res.status(400).json({ success: false, message: 'Batch title, start date, and end date are required.' });
      return;
    }

    const batchId = uuidv4();
    const batchCount = (db.prepare('SELECT COUNT(*) as count FROM batches').get() as any).count + 1;
    const year = new Date().getFullYear();
    const batchCode = `AAGAM-BATCH-${year}-${String(batchCount).padStart(2, '0')}`;
    const now = new Date().toISOString();

    const modulesJson = typeof curriculum_modules === 'string' 
      ? curriculum_modules 
      : JSON.stringify(curriculum_modules || []);

    db.prepare(`
      INSERT INTO batches (
        id, batch_code, title, department, program_id, program_type, start_date, end_date,
        duration_weeks, instructor_name, instructor_email, curriculum_modules,
        max_seats, enrolled_count, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Active', ?, ?)
    `).run(
      batchId,
      batchCode,
      title,
      department,
      program_id || null,
      program_type,
      start_date,
      end_date,
      duration_weeks,
      instructor_name || 'Ayush Raj (Senior Lead)',
      instructor_email || 'ayush.raj@aagamdigital.com',
      modulesJson,
      max_seats,
      now,
      now
    );

    // Auto-sync into internships table so public catalog and candidate applications find it immediately
    const safeSlug = `${batchCode.toLowerCase()}-${batchId.substring(0, 8)}`;
    db.prepare(`
      INSERT INTO internships (
        id, slug, title, department, technology, description, full_description,
        duration, eligibility, skills_required, mode, location, start_date,
        application_deadline, total_seats, filled_seats, fee_amount, is_paid,
        required_documents, ocr_enabled, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Remote', 'Online Live', ?, ?, ?, 0, 0, 0, '["NOC","College_ID","Resume"]', 1, 'Active', ?, ?)
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at
    `).run(
      batchId,
      safeSlug,
      title,
      department,
      department,
      `Live Cohort Batch (${batchCode}) under instructor ${instructor_name || 'Ayush Raj'}.`,
      `Cohort Batch Code: ${batchCode}\nInstructor: ${instructor_name || 'Ayush Raj'}\nTimeline: ${start_date} to ${end_date}`,
      `${duration_weeks} Weeks`,
      'Open to B.Tech, BCA, MCA, B.Sc & M.Sc Students',
      department,
      start_date,
      start_date,
      max_seats,
      now,
      now
    );

    recordAuditLog(req, 'BATCH_CREATED', 'batches', batchId, { batchCode, title, department });

    res.json({
      success: true,
      message: `Batch ${batchCode} (${title}) created successfully!`,
      batch: { id: batchId, batch_code: batchCode, title, start_date, end_date },
    });
  } catch (error: any) {
    console.error('[CREATE BATCH ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to create batch.' });
  }
});

// 13.3. PUT /api/admin/batches/:id
adminRouter.put('/batches/:id', (req: Request, res: Response) => {
  try {
    const { title, start_date, end_date, duration_weeks, instructor_name, instructor_email, status, max_seats } = req.body;
    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id) as any;
    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found.' });
      return;
    }

    const now = new Date().toISOString();
    const rawModules = req.body.modules !== undefined ? req.body.modules : req.body.curriculum_modules;
    const modulesJson = rawModules !== undefined
      ? (typeof rawModules === 'string' ? rawModules : JSON.stringify(rawModules))
      : batch.curriculum_modules;

    db.prepare(`
      UPDATE batches
      SET title = COALESCE(?, title),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          duration_weeks = COALESCE(?, duration_weeks),
          instructor_name = COALESCE(?, instructor_name),
          instructor_email = COALESCE(?, instructor_email),
          curriculum_modules = ?,
          status = COALESCE(?, status),
          max_seats = COALESCE(?, max_seats),
          updated_at = ?
      WHERE id = ?
    `).run(
      title,
      start_date,
      end_date,
      duration_weeks,
      instructor_name,
      instructor_email,
      modulesJson,
      status,
      max_seats,
      now,
      batch.id
    );

    recordAuditLog(req, 'BATCH_UPDATED', 'batches', batch.id, { title });
    res.json({ success: true, message: 'Batch updated successfully.' });
  } catch (error: any) {
    console.error('[UPDATE BATCH ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to update batch.' });
  }
});

// 13.4. DELETE /api/admin/batches/:id
adminRouter.delete('/batches/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM batches WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM internships WHERE id = ?').run(req.params.id);
    recordAuditLog(req, 'BATCH_DELETED', 'batches', String(req.params.id));
    res.json({ success: true, message: 'Batch removed successfully.' });
  } catch (error: any) {
    console.error('[DELETE BATCH ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to delete batch.' });
  }
});

// 13.5. GET /api/admin/batches/:id/students
adminRouter.get('/batches/:id/students', (req: Request, res: Response) => {
  try {
    const students = db.prepare(`
      SELECT be.id as enrollment_id, be.batch_id, be.student_id, be.user_id, be.progress_percent,
             be.completed_modules, be.task_submissions, be.status, be.certificate_issued, be.lor_issued,
             be.certificate_id, be.lor_id, be.enrolled_at, be.completed_at, be.admin_unlocked,
             u.full_name as student_name, u.email as student_email, u.phone as student_phone,
             s.registration_no, s.college_name, s.course, s.semester_year
      FROM batch_enrollments be
      JOIN users u ON be.user_id = u.id
      LEFT JOIN students s ON be.student_id = s.id OR s.user_id = u.id
      WHERE be.batch_id = ?
      ORDER BY be.enrolled_at DESC
    `).all(req.params.id);

    const formatted = students.map((s: any) => ({
      ...s,
      admin_unlocked: Boolean(s.admin_unlocked),
      completed_modules: s.completed_modules ? JSON.parse(s.completed_modules) : [],
      task_submissions: s.task_submissions ? JSON.parse(s.task_submissions) : [],
    }));

    res.json({ success: true, students: formatted });
  } catch (error: any) {
    console.error('[GET BATCH STUDENTS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch batch students.' });
  }
});

// 13.51. POST /api/admin/batches/:id/students/:enrollmentId/toggle-override (Toggle Weekly Unlock Override)
adminRouter.post('/batches/:id/students/:enrollmentId/toggle-override', (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;
    const current = db.prepare('SELECT admin_unlocked FROM batch_enrollments WHERE id = ?').get(enrollmentId) as any;
    if (!current) {
      res.status(404).json({ success: false, message: 'Enrollment record not found.' });
      return;
    }

    const nextState = current.admin_unlocked ? 0 : 1;
    db.prepare('UPDATE batch_enrollments SET admin_unlocked = ? WHERE id = ?').run(nextState, enrollmentId);

    res.json({
      success: true,
      admin_unlocked: Boolean(nextState),
      message: nextState
        ? 'Admin override active: All modules are now instantly unlocked for this student.'
        : 'Weekly unlock schedule restored for this student.',
    });
  } catch (error: any) {
    console.error('[TOGGLE OVERRIDE ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to toggle override.' });
  }
});

// 13.52. POST /api/admin/batches/:id/students/:enrollmentId/toggle-module (Toggle Module Completion)
adminRouter.post('/batches/:id/students/:enrollmentId/toggle-module', (req: Request, res: Response) => {
  try {
    const { id: batchId, enrollmentId } = req.params;
    const { moduleId } = req.body;

    const enrollment = db.prepare('SELECT * FROM batch_enrollments WHERE id = ?').get(enrollmentId) as any;
    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment record not found.' });
      return;
    }

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(batchId) as any;
    const rawModules = batch && batch.curriculum_modules ? JSON.parse(batch.curriculum_modules) : [];
    const totalModules = Math.max(rawModules.length, 1);

    let completedModules: string[] = [];
    try {
      completedModules = JSON.parse(enrollment.completed_modules || '[]');
    } catch (e) {
      completedModules = [];
    }

    if (completedModules.includes(moduleId)) {
      completedModules = completedModules.filter((m) => m !== moduleId);
    } else {
      completedModules.push(moduleId);
    }

    const progressPercent = Math.min(100, Math.round((completedModules.length / totalModules) * 100));
    const isCompleted = progressPercent === 100;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE batch_enrollments
      SET completed_modules = ?, progress_percent = ?, status = ?, completed_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(completedModules),
      progressPercent,
      isCompleted ? 'Completed' : 'In Progress',
      isCompleted ? now : enrollment.completed_at,
      enrollmentId
    );

    res.json({
      success: true,
      message: `Module updated. Overall Progress: ${progressPercent}%`,
      progress_percent: progressPercent,
      completed_modules: completedModules,
    });
  } catch (error: any) {
    console.error('[TOGGLE MODULE ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to toggle module completion.' });
  }
});

// 13.6. POST /api/admin/batches/:id/issue-certificate
adminRouter.post('/batches/:id/issue-certificate', async (req: Request, res: Response) => {
  try {
    const { student_id, user_id, grade_or_remarks = 'Outstanding Performance (Grade A+)', start_date, end_date, duration } = req.body;
    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id) as any;
    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found.' });
      return;
    }

    const user = db.prepare(`
      SELECT u.id as user_id, u.email, u.full_name, u.avatar_url,
             s.id as student_id, s.college_name, s.roll_no, s.branch, s.photo_url, s.registration_no
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = ? OR s.id = ?
    `).get(user_id || student_id, student_id || user_id) as any;

    if (!user) {
      res.status(404).json({ success: false, message: 'Student user account not found.' });
      return;
    }

    const certId = uuidv4();
    const certNo = generateCertificateId();
    const qrCodeData = await generateDocumentQrCode(certNo);
    const now = new Date().toISOString();

    const photoUrl = user.photo_url || user.avatar_url || null;
    const rollNo = user.roll_no || user.registration_no || '';
    const branch = user.branch || batch.department || 'Engineering & Technology';
    const startDate = start_date || batch.start_date || now.split('T')[0];
    const endDate = end_date || batch.end_date || now.split('T')[0];

    const courseDuration = duration || (start_date && end_date
      ? `${start_date} to ${end_date}`
      : `${batch.duration_weeks || 4} Weeks`);

    // Generate high-resolution Certificate PDF file with Photo & Accreditation badges
    let pdfFilePath: string | undefined;
    try {
      pdfFilePath = await generateCertificatePDF({
        certificate_id: certNo,
        student_name: user.full_name,
        college_name: user.college_name || 'Accredited University',
        program_title: batch.title,
        duration: courseDuration,
        issue_date: now.split('T')[0],
        grade_or_remarks: grade_or_remarks,
        photo_url: photoUrl,
        roll_no: rollNo,
        branch: branch,
        start_date: startDate,
        end_date: endDate,
        instructor_name: batch.instructor_name || 'Akash Verma',
      });
    } catch (pdfErr) {
      console.error('[CERTIFICATE PDF GEN ERROR]', pdfErr);
    }

    db.prepare(`
      INSERT INTO certificates (
        id, certificate_id, student_id, user_id, internship_id, student_name, college_name,
        program_title, duration, issue_date, grade_or_remarks, qr_code_data, pdf_path, status, issued_at,
        photo_url, roll_no, branch, start_date, end_date, instructor_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Valid', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      certId,
      certNo,
      user.student_id || user.user_id,
      user.user_id,
      batch.program_id || batch.id,
      user.full_name,
      user.college_name || 'Accredited University',
      batch.title,
      courseDuration,
      now.split('T')[0],
      grade_or_remarks,
      qrCodeData,
      `/documents/certificates/${certNo}.pdf`,
      now,
      photoUrl,
      rollNo,
      branch,
      startDate,
      endDate,
      batch.instructor_name || 'Akash Verma'
    );

    // Update batch enrollment status
    db.prepare(`
      UPDATE batch_enrollments
      SET certificate_issued = 1, certificate_id = ?, status = 'Completed', completed_at = COALESCE(completed_at, ?)
      WHERE batch_id = ? AND (user_id = ? OR student_id = ?)
    `).run(certNo, now, batch.id, user.user_id, user.student_id || user.user_id);

    // Send email to student with Certificate PDF attached
    const certAttachments = pdfFilePath && fs.existsSync(pdfFilePath)
      ? [{ filename: `${certNo}.pdf`, path: pdfFilePath, contentType: 'application/pdf' }]
      : undefined;

    await sendAutomatedEmail({
      to: user.email,
      templateKey: 'certificate_issued',
      variables: {
        student_name: user.full_name,
        certificate_id: certNo,
        program_title: batch.title,
        verify_url: `http://127.0.0.1:5173/?view=verify&id=${certNo}`,
      },
      attachments: certAttachments,
      userId: user.user_id,
      notificationTitle: 'Official Certificate Conferred',
    });

    recordAuditLog(req, 'CERTIFICATE_ISSUED_FROM_BATCH', 'certificates', certId, { certNo, student: user.full_name });

    res.json({
      success: true,
      message: `Official Certificate ${certNo} issued to ${user.full_name} and dispatched via email with attached PDF!`,
      certificate_id: certNo,
      verify_url: `http://127.0.0.1:5173/?view=verify&id=${certNo}`,
      download_url: `/documents/certificates/${certNo}.pdf`,
    });
  } catch (error: any) {
    console.error('[ISSUE BATCH CERT ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to issue certificate.' });
  }
});

// 13.7. POST /api/admin/batches/:id/issue-lor
adminRouter.post('/batches/:id/issue-lor', async (req: Request, res: Response) => {
  try {
    const {
      student_id,
      user_id,
      performance_rating = 'Exceptional Performance (Top 5%)',
      recommendation_body = 'Demonstrated outstanding technical problem solving, rigorous code quality, and proactive leadership throughout the tenure.',
      start_date,
      end_date,
      duration,
    } = req.body;

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id) as any;
    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found.' });
      return;
    }

    const user = db.prepare(`
      SELECT u.id as user_id, u.email, u.full_name, s.id as student_id, s.college_name
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = ? OR s.id = ?
    `).get(user_id || student_id, student_id || user_id) as any;

    if (!user) {
      res.status(404).json({ success: false, message: 'Student user account not found.' });
      return;
    }

    const lorId = uuidv4();
    const lorNo = generateLorId();
    const qrCodeData = await generateDocumentQrCode(lorNo);
    const now = new Date().toISOString();

    const courseDuration = duration || (start_date && end_date
      ? `${start_date} to ${end_date}`
      : `${batch.duration_weeks} Weeks (${batch.start_date} to ${batch.end_date})`);

    // Generate formal LOR PDF
    let lorFilePath: string | undefined;
    try {
      lorFilePath = await generateLorPDF({
        lor_id: lorNo,
        student_name: user.full_name,
        college_name: user.college_name || 'Accredited University',
        internship_title: batch.title,
        duration: courseDuration,
        recommendation_body: recommendation_body,
        performance_rating: performance_rating,
        issue_date: now.split('T')[0],
      });
    } catch (lorErr) {
      console.error('[LOR PDF GEN ERROR]', lorErr);
    }

    db.prepare(`
      INSERT INTO lors (
        id, lor_id, student_id, user_id, internship_id, student_name, college_name,
        internship_title, duration, recommendation_body, performance_rating, qr_code_data, pdf_path, status, issued_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Valid', ?)
    `).run(
      lorId,
      lorNo,
      user.student_id || user.user_id,
      user.user_id,
      batch.program_id || batch.id,
      user.full_name,
      user.college_name || 'Accredited University',
      batch.title,
      courseDuration,
      recommendation_body,
      performance_rating,
      qrCodeData,
      `/documents/lors/${lorNo}.pdf`,
      now
    );

    // Update batch enrollment status
    db.prepare(`
      UPDATE batch_enrollments
      SET lor_issued = 1, lor_id = ?, completed_at = COALESCE(completed_at, ?)
      WHERE batch_id = ? AND (user_id = ? OR student_id = ?)
    `).run(lorNo, now, batch.id, user.user_id, user.student_id || user.user_id);

    // Send email to student with LOR PDF attached
    const lorAttachments = lorFilePath && fs.existsSync(lorFilePath)
      ? [{ filename: `${lorNo}.pdf`, path: lorFilePath, contentType: 'application/pdf' }]
      : undefined;

    await sendAutomatedEmail({
      to: user.email,
      templateKey: 'lor_issued',
      variables: {
        student_name: user.full_name,
        lor_id: lorNo,
        rating: performance_rating,
        verify_url: `http://127.0.0.1:5173/?view=verify&id=${lorNo}`,
      },
      attachments: lorAttachments,
      userId: user.user_id,
      notificationTitle: 'Executive Letter of Recommendation Conferred',
    });

    recordAuditLog(req, 'LOR_ISSUED_FROM_BATCH', 'lors', lorId, { lorNo, student: user.full_name });

    res.json({
      success: true,
      message: `Executive LOR ${lorNo} conferred to ${user.full_name} and dispatched via email with attached PDF!`,
      lor_id: lorNo,
      verify_url: `http://127.0.0.1:5173/?view=verify&id=${lorNo}`,
      download_url: `/documents/lors/${lorNo}.pdf`,
    });
  } catch (error: any) {
    console.error('[ISSUE BATCH LOR ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to issue LOR.' });
  }
});

