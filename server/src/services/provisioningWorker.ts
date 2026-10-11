import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { sendAutomatedEmail } from './emailService';
import { generateRegistrationNo } from './numberingService';
import { generateOfferLetterPDF } from './pdfService';
import { DOCUMENTS_DIR } from '../config';

/**
 * Provision student credentials for any identifier:
 * offer_id, application_id, user_id, student_id, or email.
 * Called when Admin verifies candidate's payment & accepts offer.
 */
export async function provisionStudentCredentials(
  targetIdOrRow: string | any,
  actorInfo: string = 'Admin Manual Verification',
  customPassword?: string
): Promise<{ success: boolean; user?: any; tempPassword?: string; message: string }> {
  try {
    let offer: any = null;
    let app: any = null;
    let user: any = null;
    let student: any = null;

    const targetStr = typeof targetIdOrRow === 'string' ? targetIdOrRow.trim() : '';

    // 1. Try resolving Offer Letter
    if (typeof targetIdOrRow === 'object' && targetIdOrRow !== null) {
      offer = targetIdOrRow;
    } else if (targetStr) {
      offer = db.prepare(`
        SELECT o.*, a.student_phone, a.course, a.roll_no, a.semester_year, i.title as internship_title
        FROM offer_letters o
        LEFT JOIN internship_applications a ON o.application_id = a.id
        LEFT JOIN internships i ON o.internship_id = i.id
        WHERE o.id = ? OR o.offer_id = ? OR o.application_id = ? OR o.user_id = ?
        LIMIT 1
      `).get(targetStr, targetStr, targetStr, targetStr) as any;
    }

    // 2. Try resolving Application
    if (offer && offer.application_id) {
      app = db.prepare('SELECT * FROM internship_applications WHERE id = ?').get(offer.application_id) as any;
    }
    if (!app && targetStr) {
      app = db.prepare(`
        SELECT * FROM internship_applications
        WHERE id = ? OR application_no = ? OR user_id = ? OR student_id = ? OR student_email = ?
        ORDER BY submitted_at DESC LIMIT 1
      `).get(targetStr, targetStr, targetStr, targetStr, targetStr.toLowerCase()) as any;
    }

    // 3. Try resolving User & Student
    if (offer && offer.user_id) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(offer.user_id) as any;
    } else if (app && app.user_id) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(app.user_id) as any;
    }

    if (!user && targetStr) {
      user = db.prepare(`
        SELECT * FROM users
        WHERE id = ? OR email = ?
        LIMIT 1
      `).get(targetStr, targetStr.toLowerCase()) as any;
    }

    // Also check students table by id or registration_no
    if (!user && targetStr) {
      student = db.prepare('SELECT * FROM students WHERE id = ? OR registration_no = ? OR user_id = ? LIMIT 1').get(targetStr, targetStr, targetStr) as any;
      if (student && student.user_id) {
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(student.user_id) as any;
      }
    }

    // If still no user found, but we have student email from app
    if (!user && app && app.student_email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(app.student_email.toLowerCase()) as any;
    }

    // If neither offer, nor app, nor user is found, error out cleanly
    if (!user && !app && !offer) {
      return { success: false, message: 'Student record or user account not found.' };
    }

    const studentName = (user && user.full_name) || (app && app.student_name) || (offer && offer.student_name) || 'Student';
    const studentEmail = ((user && user.email) || (app && app.student_email) || (offer && offer.student_email || '')).trim().toLowerCase();
    const studentPhone = (user && user.phone) || (app && app.student_phone) || 'N/A';
    const collegeName = (app && app.college_name) || (offer && offer.college_name) || 'Accredited College';
    const course = (app && app.course) || (offer && offer.course) || 'Engineering';
    const semesterYear = (app && app.semester_year) || 'N/A';
    const rollNo = (app && app.roll_no) || null;

    if (!studentEmail) {
      return { success: false, message: 'Student email address is missing.' };
    }

    const now = new Date().toISOString();
    const finalPassword = (customPassword && customPassword.trim().length >= 4)
      ? customPassword.trim()
      : `Aagam@${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = bcrypt.hashSync(finalPassword, 10);

    let userId: string;

    if (user) {
      userId = user.id;
      db.prepare(`
        UPDATE users 
        SET password_hash = ?, is_active = 1, email_verified = 1, updated_at = ?
        WHERE id = ?
      `).run(passwordHash, now, userId);
    } else {
      userId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, 'student', ?, ?, 1, 1, ?, ?)
      `).run(userId, studentEmail, passwordHash, studentName, studentPhone, now, now);
    }

    // Ensure Student Profile
    let studentRecord = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId) as any;
    let studentId: string;
    const regNo = (studentRecord && studentRecord.registration_no) || (app && app.application_no) || generateRegistrationNo();

    if (studentRecord) {
      studentId = studentRecord.id;
      db.prepare(`
        UPDATE students
        SET college_name = COALESCE(?, college_name),
            course = COALESCE(?, course),
            roll_no = COALESCE(?, roll_no),
            semester_year = COALESCE(?, semester_year),
            updated_at = ?
        WHERE id = ?
      `).run(collegeName, course, rollNo, semesterYear, now, studentId);
    } else {
      studentId = uuidv4();
      db.prepare(`
        INSERT INTO students (id, user_id, registration_no, college_name, course, semester_year, roll_no, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(studentId, userId, regNo, collegeName, course, semesterYear, rollNo, now, now);
    }

    // Mark Offer Letter as Provisioned if exists
    if (offer && offer.id) {
      db.prepare(`
        UPDATE offer_letters
        SET provisioning_status = 'Provisioned', user_id = ?, student_id = ?, accepted_at = COALESCE(accepted_at, ?)
        WHERE id = ?
      `).run(userId, studentId, now, offer.id);
    }

    // Update Application Status if exists
    if (app && app.id) {
      db.prepare(`
        UPDATE internship_applications
        SET status = CASE WHEN status = 'Submitted' THEN 'Active' ELSE status END,
            user_id = ?, student_id = ?, updated_at = ?
        WHERE id = ?
      `).run(userId, studentId, now, app.id);
    }

    // Log Provisioning Entry
    db.prepare(`
      INSERT INTO portal_provisioning (id, student_id, user_id, application_id, status, provisioned_at, notes)
      VALUES (?, ?, ?, ?, 'Provisioned', ?, ?)
    `).run(uuidv4(), studentId, userId, app ? app.id : userId, now, `Provisioned by ${actorInfo}`);

    // Auto-Enroll Student into Matching Batch ONLY IF an Admin-created batch exists
    const existingEnrollment = db.prepare('SELECT id FROM batch_enrollments WHERE user_id = ?').get(userId);
    if (!existingEnrollment) {
      let targetBatch: any = null;
      if (offer && offer.internship_id) {
        targetBatch = db.prepare("SELECT * FROM batches WHERE program_id = ? AND status IN ('Active', 'Upcoming') ORDER BY start_date ASC LIMIT 1").get(offer.internship_id);
      }
      if (!targetBatch && app && app.internship_id) {
        targetBatch = db.prepare("SELECT * FROM batches WHERE program_id = ? AND status IN ('Active', 'Upcoming') ORDER BY start_date ASC LIMIT 1").get(app.internship_id);
      }
      if (!targetBatch) {
        targetBatch = db.prepare("SELECT * FROM batches WHERE status = 'Active' ORDER BY created_at DESC LIMIT 1").get();
      }

      if (targetBatch && targetBatch.id) {
        db.prepare(`
          INSERT INTO batch_enrollments (
            id, batch_id, student_id, user_id, progress_percent,
            completed_modules, task_submissions, status, certificate_issued, lor_issued, enrolled_at
          ) VALUES (?, ?, ?, ?, 0, '[]', '[]', 'Enrolled', 0, 0, ?)
        `).run(uuidv4(), targetBatch.id, studentId, userId, now);

        db.prepare('UPDATE batches SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(targetBatch.id);
        console.log(`[PROVISIONER] Auto-enrolled student ${studentName} (${userId}) into batch ${targetBatch.id}`);
      }
    }

    // Generate Offer Letter PDF if offer exists and attach it to credentials email
    let offerPdfPath: string | null = null;
    if (offer && offer.offer_id) {
      try {
        const offerFileName = `${offer.offer_id}.pdf`;
        const expectedPath = path.join(DOCUMENTS_DIR, 'offers', offerFileName);
        if (fs.existsSync(expectedPath)) {
          offerPdfPath = expectedPath;
        } else {
          offerPdfPath = await generateOfferLetterPDF({
            offer_id: offer.offer_id,
            student_name: studentName,
            college_name: collegeName,
            course: course,
            internship_title: offer.internship_title || (app && app.internship_title) || 'Software Engineering Track',
            duration: offer.duration || (app && app.internship_duration) || '3 Months',
            start_date: offer.start_date || now.split('T')[0],
            end_date: offer.end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            stipend_fee_text: offer.stipend_fee_text || 'Performance Stipend + Certificate + LOR',
            payable_amount: offer.payable_amount || 0,
            fee_reason: offer.fee_reason,
            terms_conditions: offer.terms_conditions,
            issue_date: offer.issued_at ? offer.issued_at.split('T')[0] : now.split('T')[0],
            student_email: studentEmail,
            student_phone: studentPhone,
          });
        }
      } catch (pdfErr) {
        console.warn('[PROVISIONER OFFER PDF GENERATE NOTICE]', pdfErr);
      }
    }

    // Dispatch Credentials Email via SMTP with Offer Letter PDF attached!
    const loginUrl = 'http://127.0.0.1:5173/?view=login';
    const emailAttachments = offerPdfPath && fs.existsSync(offerPdfPath)
      ? [{ filename: `AAGAM_Offer_Letter_${offer.offer_id}.pdf`, path: offerPdfPath, contentType: 'application/pdf' }]
      : undefined;

    try {
      await sendAutomatedEmail({
        to: studentEmail,
        templateKey: 'credentials_provisioned',
        variables: {
          student_name: studentName,
          email: studentEmail,
          password: finalPassword,
          registration_no: regNo,
          login_url: loginUrl,
        },
        attachments: emailAttachments,
        userId,
        notificationTitle: `Student Engineering Portal Activated (${regNo})`,
        relatedId: offer ? offer.id : undefined,
      });
    } catch (mailErr) {
      console.error('[PROVISIONER MAIL ERROR]', mailErr);
    }

    console.log(`[PROVISIONER] Credentials generated for ${studentName} (${studentEmail}) - Password: ${finalPassword}`);

    return {
      success: true,
      user: { id: userId, email: studentEmail, full_name: studentName, registration_no: regNo },
      tempPassword: finalPassword,
      message: `Credentials provisioned for ${studentName} (${studentEmail})! Password dispatched via email.`,
    };
  } catch (error: any) {
    console.error('[PROVISIONING ERROR]', error);
    return { success: false, message: error.message || 'Failed to provision student credentials.' };
  }
}

/**
 * Background worker daemon is kept dormant.
 * Payments and credential generation are strictly manual admin verified.
 */
export function startProvisioningWorker() {
  console.log('[PROVISIONER] Strict Manual Verification active: Auto-timer provisioning is disabled per security policy.');
}

