import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { UPLOAD_DIR } from '../config';
import { optionalAuthenticate } from '../middleware/auth';
import { generateRegistrationNo } from '../services/numberingService';
import { performNocOcrExtraction } from '../services/ocrService';
import { sendAutomatedEmail } from '../services/emailService';
import { recordAuditLog } from '../services/auditService';

export const internshipRouter = express.Router();

// Multer storage for secure document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed: PDF, JPG, PNG, DOC, DOCX'));
    }
  },
});

// 1. GET /api/internships (Public listings)
internshipRouter.get('/', (req: Request, res: Response) => {
  try {
    const { department, mode, search } = req.query;
    let query = "SELECT * FROM internships WHERE status = 'Active'";
    const params: any[] = [];

    if (department && department !== 'All') {
      query += ' AND department = ?';
      params.push(department);
    }
    if (mode && mode !== 'All') {
      query += ' AND mode = ?';
      params.push(mode);
    }
    if (search) {
      query += ' AND (title LIKE ? OR technology LIKE ? OR description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC';
    const internships = db.prepare(query).all(...params);

    const formatted = internships.map((i: any) => {
      let docs: string[] = ['NOC', 'College_ID', 'Resume'];
      try {
        if (i.required_documents) {
          docs = JSON.parse(i.required_documents);
        }
      } catch (e) {
        docs = ['NOC', 'College_ID', 'Resume'];
      }
      return {
        ...i,
        required_documents: docs,
      };
    });

    res.json({ success: true, internships: formatted });
  } catch (error: any) {
    console.error('[INTERNSHIPS GET ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch internships.' });
  }
});

// 2. GET /api/internships/:slug (Detail)
internshipRouter.get('/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const internship = db.prepare('SELECT * FROM internships WHERE slug = ? OR id = ?').get(slug, slug) as any;

    if (!internship) {
      res.status(404).json({ success: false, message: 'Internship program not found.' });
      return;
    }

    try {
      internship.required_documents = JSON.parse(internship.required_documents || '[]');
    } catch (e) {
      internship.required_documents = ['NOC', 'College_ID', 'Resume'];
    }

    res.json({ success: true, internship });
  } catch (error: any) {
    console.error('[INTERNSHIP DETAIL ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch internship detail.' });
  }
});

// 3. POST /api/internships/upload-document (Upload & OCR)
internshipRouter.post('/upload-document', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    const { documentType, studentName, collegeName, course, rollNo } = req.body;
    const filePath = `/uploads/${req.file.filename}`;

    let ocrResult = null;
    if (documentType === 'NOC' || documentType === 'College_ID') {
      ocrResult = performNocOcrExtraction(req.file.path, req.file.originalname, {
        name: studentName,
        college: collegeName,
        course,
        roll: rollNo,
      });
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully.',
      file: {
        documentType: documentType || 'Other',
        filePath,
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
      ocr: ocrResult,
    });
  } catch (error: any) {
    console.error('[FILE UPLOAD ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'File upload failed.' });
  }
});

// 4. POST /api/internships/send-otp (Send Application-time Verification OTP)
internshipRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, student_name } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalidate previous OTPs
    db.prepare("UPDATE otp_verifications SET is_used = 1 WHERE email = ? AND purpose = 'application'").run(normalizedEmail);

    // Insert new OTP record
    db.prepare(`
      INSERT INTO otp_verifications (id, email, otp, purpose, attempts, expires_at, is_used, created_at)
      VALUES (?, ?, ?, 'application', 0, ?, 0, ?)
    `).run(otpId, normalizedEmail, otp, expiresAt, now.toISOString());

    // Send Real Email OTP via SMTP
    await sendAutomatedEmail({
      to: normalizedEmail,
      templateKey: 'otp_verification',
      variables: {
        otp,
        email: normalizedEmail,
        student_name: student_name || 'Candidate',
      },
      notificationTitle: `AAGAM Verification OTP: ${otp}`,
    });

    res.json({
      success: true,
      message: `A 6-digit verification OTP has been sent to ${normalizedEmail}.`,
      devOtp: otp,
    });
  } catch (error: any) {
    console.error('[SEND APPLICATION OTP ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to dispatch verification OTP.' });
  }
});

// 5. POST /api/internships/apply (Direct Application - No prior website registration required)
internshipRouter.post('/apply', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const internship_id = req.body.internship_id || req.body.internshipId;
    const student_name = req.body.student_name || req.body.fullName || req.body.studentName;
    const student_email = req.body.student_email || req.body.email || req.body.studentEmail;
    const student_phone = req.body.student_phone || req.body.phone || req.body.studentPhone;
    const college_name = req.body.college_name || req.body.collegeName;
    const course = req.body.course;
    const branch = req.body.branch;
    const semester_year = req.body.semester_year || req.body.semester;
    const roll_no = req.body.roll_no || req.body.rollNo;
    const skills = req.body.skills;
    const otp = req.body.otp;
    const documents = req.body.documents || [];
    const ocr_data = req.body.ocr_data || req.body.ocrData;

    const photo_url = req.body.photo_url || req.body.photoUrl || req.body.avatar_url || null;

    if (!internship_id || !student_name || !student_email || !college_name || !course) {
      res.status(400).json({ success: false, message: 'Missing required application fields.' });
      return;
    }

    const normalizedEmail = student_email.trim().toLowerCase();

    // 1. Verify Internship or Batch exists
    const batch_id = req.body.batch_id || req.body.batchId;
    let targetBatch = null;

    if (batch_id) {
      targetBatch = db.prepare('SELECT * FROM batches WHERE id = ? OR batch_code = ?').get(batch_id, batch_id) as any;
    }

    if (!targetBatch && internship_id) {
      targetBatch = db.prepare('SELECT * FROM batches WHERE id = ? OR batch_code = ?').get(internship_id, internship_id) as any;
    }

    let internship = null;
    if (internship_id) {
      internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(internship_id) as any;
    }

    // If candidate is applying to a batch, ensure an internship record exists with targetBatch.id
    if (targetBatch) {
      if (!internship) {
        internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(targetBatch.id) as any;
      }
      if (!internship && targetBatch.program_id) {
        internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(targetBatch.program_id) as any;
      }
      if (!internship) {
        const slugCode = targetBatch.batch_code.toLowerCase();
        internship = db.prepare('SELECT * FROM internships WHERE slug = ?').get(slugCode) as any;
      }

      // If still no internship record, create/upsert one for this batch
      if (!internship) {
        const now = new Date().toISOString();
        const dept = targetBatch.department || 'Software Engineering';
        const safeSlug = `${targetBatch.batch_code.toLowerCase()}-${targetBatch.id.substring(0, 8)}`;

        db.prepare(`
          INSERT INTO internships (
            id, slug, title, department, technology, description, full_description,
            duration, eligibility, skills_required, mode, location, start_date,
            application_deadline, total_seats, filled_seats, fee_amount, is_paid,
            required_documents, ocr_enabled, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Remote', 'Online Live', ?, ?, ?, ?, 0, 0, '["NOC","College_ID","Resume"]', 1, 'Active', ?, ?)
          ON CONFLICT(id) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at
        `).run(
          targetBatch.id,
          safeSlug,
          targetBatch.title,
          dept,
          dept,
          `Live Cohort Batch (${targetBatch.batch_code}) under instructor ${targetBatch.instructor_name}.`,
          `Cohort Batch Code: ${targetBatch.batch_code}\nInstructor: ${targetBatch.instructor_name}\nTimeline: ${targetBatch.start_date} to ${targetBatch.end_date}`,
          `${targetBatch.duration_weeks} Weeks`,
          'Open to B.Tech, BCA, MCA, B.Sc & M.Sc Students',
          dept,
          targetBatch.start_date,
          targetBatch.start_date,
          targetBatch.max_seats,
          targetBatch.enrolled_count || 0,
          now,
          now
        );

        internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(targetBatch.id) as any;
      }
    }

    if (!internship) {
      res.status(404).json({ success: false, message: 'Internship program or batch not found.' });
      return;
    }

    // 2. Validate Application-Time Email OTP
    if (!otp) {
      res.status(400).json({ success: false, message: 'Email verification OTP is required before submitting.' });
      return;
    }

    const otpRecord = db.prepare(`
      SELECT * FROM otp_verifications
      WHERE email = ? AND purpose IN ('application', 'registration') AND is_used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(normalizedEmail) as any;

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'No active OTP verification code found. Please click "Send OTP".' });
      return;
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Your verification OTP has expired. Please request a new OTP.' });
      return;
    }

    if (otpRecord.otp !== otp.trim()) {
      db.prepare('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?').run(otpRecord.id);
      res.status(400).json({ success: false, message: 'Invalid OTP code entered. Please check and try again.' });
      return;
    }

    // Mark OTP as used
    db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(otpRecord.id);

    const now = new Date().toISOString();

    // 3. Find or Create User Record (Seamless Guest Enrollment)
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;
    let userId: string;

    if (!user) {
      userId = uuidv4();
      const initialRandomPass = uuidv4().substring(0, 10);
      const passwordHash = bcrypt.hashSync(initialRandomPass, 10);

      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, full_name, phone, avatar_url, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, 'student', ?, ?, ?, 0, 1, ?, ?)
      `).run(userId, normalizedEmail, passwordHash, student_name, student_phone || null, photo_url, now, now);
    } else {
      userId = user.id;
      // Update contact details and avatar if provided
      db.prepare(`
        UPDATE users
        SET full_name = ?, phone = ?, avatar_url = COALESCE(?, avatar_url), email_verified = 1, updated_at = ?
        WHERE id = ?
      `).run(student_name, student_phone || user.phone, photo_url, now, userId);
    }

    // 4. Find or Create Student Profile
    let student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(userId) as any;
    let studentId: string;

    if (!student) {
      studentId = uuidv4();
      const studentRegNo = `AAGAM-REG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      db.prepare(`
        INSERT INTO students (id, user_id, registration_no, college_name, course, branch, semester_year, roll_no, skills, photo_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        studentId,
        userId,
        studentRegNo,
        college_name,
        course,
        branch || null,
        semester_year || null,
        roll_no || null,
        skills || null,
        photo_url,
        now,
        now
      );
    } else {
      studentId = student.id;
      db.prepare(`
        UPDATE students
        SET college_name = ?, course = ?, branch = ?, semester_year = ?, roll_no = ?, skills = ?, photo_url = COALESCE(?, photo_url), updated_at = ?
        WHERE id = ?
      `).run(
        college_name,
        course,
        branch || null,
        semester_year || null,
        roll_no || null,
        skills || null,
        photo_url,
        now,
        studentId
      );
    }

    // 5. Generate Deterministic Registration Number (e.g. AAGAM-INT-2026-00000X)
    const registrationNo = generateRegistrationNo();
    const applicationId = uuidv4();

    // 6. Insert Application Record
    db.prepare(`
      INSERT INTO internship_applications (
        id, application_no, internship_id, student_id, user_id, student_name, student_email, student_phone,
        college_name, course, semester_year, roll_no, photo_url, status, ocr_data, batch_id, submitted_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?)
    `).run(
      applicationId,
      registrationNo,
      internship.id,
      studentId,
      userId,
      student_name,
      normalizedEmail,
      student_phone,
      college_name,
      course,
      semester_year || 'N/A',
      roll_no || null,
      photo_url,
      ocr_data ? JSON.stringify(ocr_data) : null,
      targetBatch ? targetBatch.id : (batch_id || null),
      now,
      now
    );

    // 7. Insert Uploaded Documents (NOC, College ID, Resume)
    if (Array.isArray(documents) && documents.length > 0) {
      const insertDoc = db.prepare(`
        INSERT INTO application_documents (id, application_id, document_type, file_path, original_filename, file_size, mime_type, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const doc of documents) {
        insertDoc.run(
          uuidv4(),
          applicationId,
          doc.documentType || doc.document_type || 'NOC',
          doc.filePath || doc.file_path || '/uploads/sample.pdf',
          doc.originalFilename || doc.original_filename || doc.file_name || 'Document.pdf',
          doc.fileSize || doc.file_size || 100000,
          doc.mimeType || doc.mime_type || 'application/pdf',
          now
        );
      }
    }

    // 8. Update filled seats on internship
    db.prepare('UPDATE internships SET filled_seats = filled_seats + 1 WHERE id = ?').run(internship_id);

    // 9. Dispatch Real Confirmation Email via Gmail SMTP
    await sendAutomatedEmail({
      to: normalizedEmail,
      templateKey: 'application_submitted',
      variables: {
        student_name,
        registration_no: registrationNo,
        internship_name: internship.title,
      },
      userId,
      notificationTitle: `Application Submitted - ${registrationNo}`,
      relatedId: applicationId,
    });

    // 10. Record Security Audit Log
    recordAuditLog(req, 'INTERNSHIP_APPLICATION_SUBMITTED', 'internship_applications', applicationId, {
      registrationNo,
      internship: internship.title,
      student_email: normalizedEmail,
      hasDocuments: documents.length,
    });

    res.json({
      success: true,
      message: 'Your internship application has been successfully submitted!',
      application: {
        id: applicationId,
        application_no: registrationNo,
        internship_title: internship.title,
        student_name,
        student_email: normalizedEmail,
        status: 'Submitted',
        reviewTimeline: 'Within 48 hours SLA',
      },
    });
  } catch (error: any) {
    console.error('[APPLY ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit application.' });
  }
});
