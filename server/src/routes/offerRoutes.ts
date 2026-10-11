import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { authenticateToken, optionalAuthenticate } from '../middleware/auth';
import { createRazorpayOrder, verifyPaymentSignature, completeVerifiedPayment } from '../services/razorpayService';
import { recordAuditLog } from '../services/auditService';
import { sendAutomatedEmail } from '../services/emailService';
import { generateDocumentQrCode } from '../services/qrService';
import { generatePaymentNo } from '../services/numberingService';
import { generateOfferLetterPDF } from '../services/pdfService';
import { DOCUMENTS_DIR } from '../config';

export const offerRouter = express.Router();

// 1. GET /api/offers/my-offers (Student Portal)
offerRouter.get('/my-offers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const offers = db.prepare(`
      SELECT o.*, i.slug as internship_slug, i.is_paid, i.fee_amount
      FROM offer_letters o
      JOIN internships i ON o.internship_id = i.id
      WHERE o.user_id = ?
      ORDER BY o.issued_at DESC
    `).all(userId) as any[];

    // Ensure QR code is attached
    for (const offer of offers) {
      if (!offer.qr_code_data) {
        offer.qr_code_data = await generateDocumentQrCode(offer.offer_id);
      }
    }

    res.json({ success: true, offers });
  } catch (error: any) {
    console.error('[MY OFFERS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letters.' });
  }
});

// 2. GET /api/offers/public/:offerId (Direct Access via Email Link)
offerRouter.get('/public/:offerId', async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const offer = db.prepare(`
      SELECT o.*, o.payable_amount as fee_amount, i.slug as internship_slug, i.is_paid as internship_is_paid, a.application_no, a.student_phone, COALESCE(u.email, a.student_email) as student_email
      FROM offer_letters o
      LEFT JOIN internships i ON o.internship_id = i.id
      LEFT JOIN internship_applications a ON o.application_id = a.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ? OR o.offer_id = ?
    `).get(offerId, offerId) as any;

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer letter not found.' });
      return;
    }

    if (!offer.qr_code_data) {
      offer.qr_code_data = await generateDocumentQrCode(offer.offer_id);
    }

    res.json({ success: true, offer });
  } catch (error: any) {
    console.error('[PUBLIC OFFER ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to load offer letter.' });
  }
});

// 3. GET /api/offers/:offerId (Protected detail view)
offerRouter.get('/:offerId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const userId = req.user!.id;
    const isStaffOrAdmin = ['admin', 'superadmin', 'staff'].includes(req.user!.role);

    const query = isStaffOrAdmin
      ? `SELECT o.*, o.payable_amount as fee_amount, i.slug as internship_slug, i.is_paid FROM offer_letters o LEFT JOIN internships i ON o.internship_id = i.id WHERE o.id = ? OR o.offer_id = ?`
      : `SELECT o.*, o.payable_amount as fee_amount, i.slug as internship_slug, i.is_paid FROM offer_letters o LEFT JOIN internships i ON o.internship_id = i.id WHERE (o.id = ? OR o.offer_id = ?) AND o.user_id = ?`;

    const params = isStaffOrAdmin ? [offerId, offerId] : [offerId, offerId, userId];
    const offer = db.prepare(query).get(...params) as any;

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer letter not found or unauthorized.' });
      return;
    }

    if (!offer.qr_code_data) {
      offer.qr_code_data = await generateDocumentQrCode(offer.offer_id);
    }

    res.json({ success: true, offer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load offer letter.' });
  }
});

// 4. POST /api/offers/accept & POST /api/offers/:offerId/accept (Initiate Acceptance or Razorpay Payment)
async function handleOfferAccept(req: Request, res: Response) {
  try {
    const offer_id = req.body.offer_id || req.body.offerId || req.params.offerId;

    if (!offer_id) {
      res.status(400).json({ success: false, message: 'Offer ID is required.' });
      return;
    }

    const offer = db.prepare(`
      SELECT o.*, o.payable_amount as fee_amount, i.is_paid as internship_is_paid, a.student_email, COALESCE(u.email, a.student_email) as user_email
      FROM offer_letters o
      LEFT JOIN internships i ON o.internship_id = i.id
      LEFT JOIN internship_applications a ON o.application_id = a.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ? OR o.offer_id = ?
    `).get(offer_id, offer_id) as any;

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer letter not found.' });
      return;
    }

    if (offer.status === 'Accepted') {
      res.status(400).json({ success: false, message: 'This offer letter has already been accepted.' });
      return;
    }

    if (offer.status === 'Revoked' || offer.status === 'Cancelled') {
      res.status(400).json({ success: false, message: `This offer letter is ${offer.status.toLowerCase()} and cannot be accepted.` });
      return;
    }

    const payableAmount = Number(offer.payable_amount || offer.fee_amount || 0);

    // Case A: Paid Internship -> Create Secure Razorpay Order
    if (payableAmount > 0 && !offer.is_paid) {
      const order = createRazorpayOrder({
        userId: offer.user_id || null,
        studentName: offer.student_name,
        offerId: offer.id,
        applicationId: offer.application_id,
        amount: payableAmount,
        purpose: `Internship Offer Acceptance Fee (${offer.internship_title})`,
      });

      recordAuditLog(req, 'PAYMENT_ORDER_CREATED', 'payments', order.paymentId, {
        offer_id: offer.offer_id,
        amount: payableAmount,
      });

      res.json({
        success: true,
        isPaymentRequired: true,
        order,
        student: {
          name: offer.student_name,
          email: offer.user_email || offer.student_email,
          offerId: offer.offer_id,
        },
        message: 'Payment order initiated. Please complete payment to finalize offer acceptance.',
      });
      return;
    }

    // Case B: Free / Zero Fee Offer -> Queue Provisioning (1-2hr SLA)
    const now = new Date().toISOString();
    const provisioningDueAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour SLA timer

    db.prepare(`
      UPDATE offer_letters
      SET status = 'Accepted', is_paid = 1, provisioning_status = 'Queued', provisioning_due_at = ?, accepted_at = ?
      WHERE id = ?
    `).run(provisioningDueAt, now, offer.id);

    db.prepare(`
      UPDATE internship_applications
      SET status = 'Offer Accepted', updated_at = ?
      WHERE id = ?
    `).run(now, offer.application_id);

    // Record Provisioning Queue Entry
    db.prepare(`
      INSERT INTO portal_provisioning (id, student_id, user_id, application_id, payment_id, status, provisioned_at, notes)
      VALUES (?, ?, ?, ?, null, 'Pending', ?, 'Queued for HR review or Auto-Provisioning (1-2hr SLA)')
    `).run(offer.id + '-prov', offer.student_name, offer.user_id, offer.application_id, now);

    // Trigger Payment & Acceptance Confirmation Email
    await sendAutomatedEmail({
      to: offer.user_email,
      templateKey: 'payment_success',
      variables: {
        student_name: offer.student_name,
        offer_id: offer.offer_id,
        amount: 0,
        payment_id: 'ACCEPTED-CONFIRMED',
      },
      userId: offer.user_id,
      notificationTitle: `Offer Accepted: ${offer.offer_id}`,
      relatedId: offer.id,
    });

    recordAuditLog(req, 'OFFER_ACCEPTED_FREE', 'offer_letters', offer.id, {
      offer_id: offer.offer_id,
      student_name: offer.student_name,
    });

    res.json({
      success: true,
      isPaymentRequired: false,
      provisioningStatus: 'Queued',
      slaNotice: 'Your Student Portal workspace and credentials will be reviewed by HR or automatically generated within 1 to 2 hours. Your login details will arrive in your email.',
      message: 'Congratulations! Your offer letter has been accepted. Your portal credentials will be dispatched to your email within 1-2 hours.',
    });
  } catch (error: any) {
    console.error('[OFFER ACCEPT ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to accept offer.' });
  }
}

offerRouter.post('/accept', optionalAuthenticate, handleOfferAccept);
offerRouter.post('/:offerId/accept', optionalAuthenticate, handleOfferAccept);

// 5. POST /api/offers/verify-payment (Server-side Razorpay verification & credential provisioning)
offerRouter.post('/verify-payment', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const razorpay_order_id = req.body.razorpay_order_id || req.body.razorpayOrderId || req.body.order_id || req.body.orderId;
    const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorpayPaymentId || req.body.payment_id || req.body.paymentId;
    const razorpay_signature = req.body.razorpay_signature || req.body.razorpaySignature || req.body.signature;
    const method = req.body.method || 'UPI / Online';

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: 'Payment verification parameters missing.' });
      return;
    }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Payment signature could not be verified. Please contact AAGAM support with your payment reference.',
      });
      return;
    }

    // Server side payment completion & order verification
    const result = completeVerifiedPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature, method);

    // Look up applicant/student email
    const payment = db.prepare('SELECT user_id, student_name, offer_id, amount, id FROM payments WHERE razorpay_order_id = ?').get(razorpay_order_id) as any;
    let studentEmail = '';

    if (payment) {
      let user = null;
      if (payment.user_id) {
        user = db.prepare('SELECT id, email, full_name FROM users WHERE id = ?').get(payment.user_id) as any;
      }
      
      if (!user && payment.offer_id) {
        const offer = db.prepare(`
          SELECT o.*, COALESCE(u.email, a.student_email) as candidate_email, o.student_name
          FROM offer_letters o
          LEFT JOIN users u ON o.user_id = u.id
          LEFT JOIN internship_applications a ON o.application_id = a.id
          WHERE o.id = ? OR o.offer_id = ?
        `).get(payment.offer_id, payment.offer_id) as any;

        if (offer) {
          studentEmail = offer.candidate_email;
        }
      } else if (user) {
        studentEmail = user.email;
      }

      if (studentEmail) {
        // Send Payment Success & Registration Confirmation Email
        await sendAutomatedEmail({
          to: studentEmail,
          templateKey: 'payment_success',
          variables: {
            student_name: payment.student_name,
            offer_id: payment.offer_id || 'AAGAM-OFFER',
            amount: payment.amount || 0,
            payment_id: razorpay_payment_id,
          },
          userId: payment.user_id,
          notificationTitle: 'Payment Verified & Offer Accepted',
          relatedId: payment.id,
        });
      }
    }

    recordAuditLog(req, 'PAYMENT_VERIFIED_SUCCESS', 'payments', result.paymentId, {
      razorpay_order_id,
      razorpay_payment_id,
    });

    res.json({
      success: true,
      message: 'Payment successfully verified! Your Offer Letter is accepted and your Student Portal onboarding details will be dispatched to your registered email address within 1-2 hours.',
      provisioningStatus: 'Queued',
      slaNotice: 'Your Student Portal workspace and credentials will arrive in your email within 1 to 2 hours.',
      result,
    });
  } catch (error: any) {
    console.error('[PAYMENT VERIFY ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed.' });
  }
});

// 6. POST /api/offers/submit-payment-proof (Candidate Submits UTR & Transaction Reference for Manual Verification)
offerRouter.post('/submit-payment-proof', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const offer_id = req.body.offer_id || req.body.offerId;
    const utr_number = (req.body.utr_number || req.body.utr || '').toString().trim();
    const amount = Number(req.body.amount || 0);

    if (!offer_id) {
      res.status(400).json({ success: false, message: 'Offer ID is required.' });
      return;
    }

    if (!utr_number || utr_number.length < 4) {
      res.status(400).json({
        success: false,
        message: 'Please enter a valid 12-digit UPI / Bank UTR Reference number (minimum 4 characters).',
      });
      return;
    }

    const offer = db.prepare(`
      SELECT o.*, COALESCE(u.email, a.student_email) as candidate_email, a.student_phone
      FROM offer_letters o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN internship_applications a ON o.application_id = a.id
      WHERE o.id = ? OR o.offer_id = ?
    `).get(offer_id, offer_id) as any;

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer letter not found.' });
      return;
    }

    const now = new Date().toISOString();
    const payable = amount > 0 ? amount : Number(offer.payable_amount || 0);

    // Look for existing payment record for this offer
    const existingPayment = db.prepare('SELECT id FROM payments WHERE offer_id = ? OR offer_id = ?').get(offer.id, offer.offer_id) as any;
    let paymentId: string;

    if (existingPayment) {
      paymentId = existingPayment.id;
      db.prepare(`
        UPDATE payments
        SET utr_number = ?, razorpay_payment_id = ?, amount = ?, status = 'Pending', method = 'UPI / Manual Transfer', created_at = ?
        WHERE id = ?
      `).run(utr_number, utr_number, payable, now, paymentId);
    } else {
      paymentId = uuidv4();
      const paymentNo = generatePaymentNo();
      const orderId = `UTR-${utr_number}-${Date.now()}`;
      db.prepare(`
        INSERT INTO payments (
          id, payment_no, offer_id, application_id, user_id, student_name,
          amount, currency, purpose, razorpay_order_id, razorpay_payment_id,
          utr_number, status, method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, 'Pending', 'UPI / Manual Transfer', ?)
      `).run(
        paymentId,
        paymentNo,
        offer.id,
        offer.application_id,
        offer.user_id || offer.student_id,
        offer.student_name,
        payable,
        `Internship Offer Acceptance Fee (${offer.internship_title})`,
        orderId,
        utr_number,
        utr_number,
        now
      );
    }

    // Set offer letter provisioning_status to 'Manual_Required' (Awaiting Admin verification)
    db.prepare(`
      UPDATE offer_letters
      SET provisioning_status = 'Manual_Required'
      WHERE id = ?
    `).run(offer.id);

    recordAuditLog(req, 'PAYMENT_PROOF_SUBMITTED', 'payments', paymentId, {
      offer_id: offer.offer_id,
      utr_number,
      amount: payable,
    });

    const whatsappMsg = `Hello AAGAM Team, I have paid the acceptance fee of INR ${payable} for Offer ID ${offer.offer_id}. My UTR / Transaction Reference Number is: ${utr_number}. Please find the payment screenshot attached. Candidate: ${offer.student_name}. Kindly verify and activate my Student ID.`;
    const whatsapp_url = `https://wa.me/917079823919?text=${encodeURIComponent(whatsappMsg)}`;

    res.json({
      success: true,
      message: 'Payment reference and UTR submitted successfully! Our administrative desk will verify your receipt and activate your credentials.',
      offer_id: offer.offer_id,
      utr_number,
      whatsapp_url,
    });
  } catch (error: any) {
    console.error('[SUBMIT PAYMENT PROOF ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit payment reference.' });
  }
});

// 7. GET /api/offers/:offerId/pdf (Stream or Generate Official Vector Offer Letter PDF)
offerRouter.get('/:offerId/pdf', async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const offer = db.prepare(`
      SELECT o.*, a.student_phone, a.course, a.roll_no, a.semester_year, i.title as int_title, COALESCE(u.email, a.student_email) as candidate_email
      FROM offer_letters o
      LEFT JOIN internship_applications a ON o.application_id = a.id
      LEFT JOIN internships i ON o.internship_id = i.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ? OR o.offer_id = ?
    `).get(offerId, offerId) as any;

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer letter not found.' });
      return;
    }

    const offerFileName = `${offer.offer_id}.pdf`;
    const filePath = path.join(DOCUMENTS_DIR, 'offers', offerFileName);

    if (!fs.existsSync(filePath)) {
      await generateOfferLetterPDF({
        offer_id: offer.offer_id,
        student_name: offer.student_name,
        college_name: offer.college_name,
        course: offer.course,
        internship_title: offer.internship_title || offer.int_title || 'Software Engineering Track',
        duration: offer.duration || '3 Months',
        start_date: offer.start_date,
        end_date: offer.end_date,
        stipend_fee_text: offer.stipend_fee_text || 'Performance Stipend + Certificate + LOR',
        payable_amount: offer.payable_amount || 0,
        fee_reason: offer.fee_reason,
        terms_conditions: offer.terms_conditions,
        issue_date: offer.issued_at ? offer.issued_at.split('T')[0] : new Date().toISOString().split('T')[0],
        student_email: offer.candidate_email,
        student_phone: offer.student_phone,
      });
    }

    res.download(filePath, `AAGAM_Offer_Letter_${offer.offer_id}.pdf`);
  } catch (error: any) {
    console.error('[OFFER PDF DOWNLOAD ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to generate or download offer letter PDF.' });
  }
});
