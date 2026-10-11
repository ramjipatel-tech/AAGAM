import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { generateCertificateId, generateLorId, generateOfferId } from '../services/numberingService';
import { generateDocumentQrCode } from '../services/qrService';
import { sendAutomatedEmail } from '../services/emailService';
import { recordAuditLog } from '../services/auditService';

export const documentRouter = express.Router();

// 1. GET /api/documents/my-documents (Student Portal)
documentRouter.get('/my-documents', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const offers = db.prepare('SELECT * FROM offer_letters WHERE user_id = ? ORDER BY issued_at DESC').all(userId) as any[];
    const lors = db.prepare('SELECT * FROM lors WHERE user_id = ? ORDER BY issued_at DESC').all(userId) as any[];
    const certificates = db.prepare('SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC').all(userId) as any[];

    for (const doc of [...offers, ...lors, ...certificates]) {
      const docId = doc.offer_id || doc.lor_id || doc.certificate_id;
      if (!doc.qr_code_data && docId) {
        doc.qr_code_data = await generateDocumentQrCode(docId);
      }
    }

    res.json({
      success: true,
      documents: {
        offers,
        lors,
        certificates,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load documents.' });
  }
});

// 2. POST /api/documents/generate-offer (Admin generates Offer Letter)
documentRouter.post('/generate-offer', authenticateToken, requireRoles('admin', 'superadmin'), async (req: Request, res: Response) => {
  try {
    const { application_id, start_date, end_date, duration, stipend_fee_text, payable_amount = 0, terms_conditions, template_id } = req.body;

    if (!application_id) {
      res.status(400).json({ success: false, message: 'Application ID is required.' });
      return;
    }

    const app = db.prepare('SELECT * FROM internship_applications WHERE id = ?').get(application_id) as any;
    if (!app) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(app.internship_id) as any;
    const offerId = generateOfferId();
    const docId = uuidv4();
    const now = new Date().toISOString();
    const qrCode = await generateDocumentQrCode(offerId);

    const defaultTerms = terms_conditions || `1. The candidate agrees to abide by intellectual property and confidentiality policies.\n2. Timely completion of project deliverables is required.\n3. Upon satisfactory completion, official Certificate and LOR will be awarded.`;

    db.prepare(`
      INSERT INTO offer_letters (
        id, offer_id, application_id, student_id, user_id, internship_id, student_name,
        college_name, course, internship_title, duration, start_date, end_date,
        stipend_fee_text, payable_amount, terms_conditions, template_id, qr_code_data, status, issued_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Issued', ?)
    `).run(
      docId,
      offerId,
      application_id,
      app.student_id,
      app.user_id,
      app.internship_id,
      app.student_name,
      app.college_name,
      app.course,
      internship?.title || 'Internship Program',
      duration || internship?.duration || '3 Months',
      start_date || internship?.start_date || '2026-11-01',
      end_date || '2027-01-31',
      stipend_fee_text || (internship?.fee_amount > 0 ? `Program Fee: ₹${internship.fee_amount}` : 'Performance-based stipend + Official Certification'),
      payable_amount || internship?.fee_amount || 0,
      defaultTerms,
      template_id || 'default-offer-template',
      qrCode,
      now
    );

    // Update application status
    db.prepare('UPDATE internship_applications SET status = "Offer Generated", updated_at = ? WHERE id = ?').run(now, application_id);

    // Send Offer Letter Email
    await sendAutomatedEmail({
      to: app.student_email,
      templateKey: 'offer_generated',
      variables: {
        student_name: app.student_name,
        offer_id: offerId,
        internship_name: internship?.title || 'Internship',
        start_date: start_date || '2026-11-01',
      },
      userId: app.user_id,
      notificationTitle: `Offer Letter Generated - ${offerId}`,
      relatedId: docId,
    });

    recordAuditLog(req, 'OFFER_LETTER_GENERATED', 'offer_letters', docId, { offerId, student_name: app.student_name });

    res.json({
      success: true,
      message: `Offer Letter ${offerId} generated and published to student dashboard.`,
      offerId,
    });
  } catch (error: any) {
    console.error('[GENERATE OFFER ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate offer letter.' });
  }
});

// 3. POST /api/documents/generate-lor (Admin generates Letter of Recommendation)
documentRouter.post('/generate-lor', authenticateToken, requireRoles('admin', 'superadmin'), async (req: Request, res: Response) => {
  try {
    const { student_id, internship_id, student_name, college_name, internship_title, duration, recommendation_body, performance_rating } = req.body;

    if (!student_name || !internship_title) {
      res.status(400).json({ success: false, message: 'Student name and internship title are required.' });
      return;
    }

    const student = db.prepare('SELECT user_id, id FROM students WHERE id = ? OR user_id = ?').get(student_id, student_id) as any;
    const userId = student ? student.user_id : req.user!.id;

    const lorId = generateLorId();
    const docId = uuidv4();
    const now = new Date().toISOString();
    const qrCode = await generateDocumentQrCode(lorId);

    const body = recommendation_body || `It gives us great pleasure to recommend ${student_name} from ${college_name || 'Institute'}. During their internship in ${internship_title}, they demonstrated outstanding dedication, strong engineering mindset, and exemplary team collaboration.`;

    db.prepare(`
      INSERT INTO lors (
        id, lor_id, student_id, user_id, internship_id, student_name, college_name,
        internship_title, duration, recommendation_body, performance_rating, qr_code_data, status, issued_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Valid', ?)
    `).run(
      docId,
      lorId,
      student?.id || student_id || 'STU',
      userId,
      internship_id || 'INT',
      student_name,
      college_name || 'Engineering Institute',
      internship_title,
      duration || '3 Months',
      body,
      performance_rating || 'Outstanding (Top 5%)',
      qrCode,
      now
    );

    recordAuditLog(req, 'LOR_GENERATED', 'lors', docId, { lorId, student_name });

    res.json({
      success: true,
      message: `Letter of Recommendation ${lorId} generated successfully.`,
      lorId,
    });
  } catch (error: any) {
    console.error('[GENERATE LOR ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to generate LOR.' });
  }
});

// 4. POST /api/documents/generate-certificate (Admin generates Certificate of Completion)
documentRouter.post('/generate-certificate', authenticateToken, requireRoles('admin', 'superadmin'), async (req: Request, res: Response) => {
  try {
    const { student_id, internship_id, student_name, college_name, program_title, duration, grade_or_remarks, signatory_ceo, signatory_hr } = req.body;

    if (!student_name || !program_title) {
      res.status(400).json({ success: false, message: 'Student name and program title are required.' });
      return;
    }

    const student = db.prepare('SELECT user_id, id FROM students WHERE id = ? OR user_id = ?').get(student_id, student_id) as any;
    const userId = student ? student.user_id : req.user!.id;

    const certId = generateCertificateId();
    const docId = uuidv4();
    const now = new Date().toISOString();
    const qrCode = await generateDocumentQrCode(certId);

    db.prepare(`
      INSERT INTO certificates (
        id, certificate_id, student_id, user_id, internship_id, student_name, college_name,
        program_title, duration, issue_date, grade_or_remarks, signatory_ceo, signatory_hr, qr_code_data, status, issued_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Valid', ?)
    `).run(
      docId,
      certId,
      student?.id || student_id || 'STU',
      userId,
      internship_id || 'INT',
      student_name,
      college_name || 'Engineering Institute',
      program_title,
      duration || '3 Months',
      now.split('T')[0],
      grade_or_remarks || 'Grade: A+ (Outstanding)',
      signatory_ceo || 'Ayush Raj, CEO',
      signatory_hr || 'Akash Verma, HR',
      qrCode,
      now
    );

    // Send Certificate Email
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as any;
    if (user) {
      await sendAutomatedEmail({
        to: user.email,
        templateKey: 'certificate_issued',
        variables: {
          student_name,
          program_title,
          certificate_id: certId,
        },
        userId,
        notificationTitle: `Certificate Issued: ${certId}`,
        relatedId: docId,
      });
    }

    recordAuditLog(req, 'CERTIFICATE_GENERATED', 'certificates', docId, { certId, student_name });

    res.json({
      success: true,
      message: `Official Certificate ${certId} generated and registered in verification ledger.`,
      certificateId: certId,
    });
  } catch (error: any) {
    console.error('[GENERATE CERT ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to generate certificate.' });
  }
});

// 5. POST /api/documents/update-status (Revoke / Cancel / Validate document)
documentRouter.post('/update-status', authenticateToken, requireRoles('admin', 'superadmin'), (req: Request, res: Response) => {
  try {
    const { document_type, document_id, status } = req.body;

    if (!document_type || !document_id || !status) {
      res.status(400).json({ success: false, message: 'Document type, document ID, and status are required.' });
      return;
    }

    if (document_type === 'Certificate') {
      db.prepare('UPDATE certificates SET status = ? WHERE id = ? OR certificate_id = ?').run(status, document_id, document_id);
    } else if (document_type === 'LOR') {
      db.prepare('UPDATE lors SET status = ? WHERE id = ? OR lor_id = ?').run(status, document_id, document_id);
    } else if (document_type === 'Offer_Letter') {
      db.prepare('UPDATE offer_letters SET status = ? WHERE id = ? OR offer_id = ?').run(status, document_id, document_id);
    }

    recordAuditLog(req, 'DOCUMENT_STATUS_CHANGED', document_type, document_id, { new_status: status });

    res.json({ success: true, message: `Document status updated to ${status}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update document status.' });
  }
});

// 6. GET /api/documents/templates
documentRouter.get('/templates', authenticateToken, requireRoles('admin', 'superadmin', 'staff'), (req: Request, res: Response) => {
  try {
    const templates = db.prepare('SELECT * FROM document_templates ORDER BY created_at DESC').all();
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load document templates.' });
  }
});
