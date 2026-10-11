import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { RAZORPAY_WEBHOOK_SECRET } from '../config';
import { completeVerifiedPayment } from '../services/razorpayService';
import { recordAuditLog } from '../services/auditService';

export const paymentRouter = express.Router();

// 1. GET /api/payments/my-history (Student Portal)
paymentRouter.get('/my-history', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const payments = db.prepare(`
      SELECT p.*, o.internship_title, o.offer_id as offer_code
      FROM payments p
      LEFT JOIN offer_letters o ON p.offer_id = o.offer_id OR p.offer_id = o.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(userId);

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load payment history.' });
  }
});

// 2. GET /api/payments/admin-list (Admin Payment Management)
paymentRouter.get('/admin-list', authenticateToken, requireRoles('admin', 'superadmin', 'staff'), (req: Request, res: Response) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, u.email as user_email, o.internship_title, o.offer_id as offer_code
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN offer_letters o ON p.offer_id = o.offer_id OR p.offer_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (p.student_name LIKE ? OR p.payment_no LIKE ? OR p.razorpay_order_id LIKE ? OR p.razorpay_payment_id LIKE ? OR u.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const payments = db.prepare(query).all(...params);

    // Summary statistics
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'Success' THEN amount ELSE 0 END) as total_collection,
        SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'Refunded' THEN 1 ELSE 0 END) as refunded_count
      FROM payments
    `).get() as any;

    res.json({
      success: true,
      payments,
      stats: {
        totalCollection: stats.total_collection || 0,
        totalCount: stats.total_count || 0,
        successfulCount: stats.successful_count || 0,
        pendingCount: stats.pending_count || 0,
        failedCount: stats.failed_count || 0,
        refundedCount: stats.refunded_count || 0,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN PAYMENTS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to load admin payments.' });
  }
});

// 3. POST /api/payments/webhook (Razorpay Webhook)
paymentRouter.post('/webhook', (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    if (RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('[WEBHOOK INVALID SIGNATURE]');
        res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
        return;
      }
    }

    const event = req.body.event;
    console.log(`[RAZORPAY WEBHOOK] Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload?.payment?.entity;
      if (paymentEntity) {
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;
        const method = paymentEntity.method || 'Online';

        completeVerifiedPayment(orderId, paymentId, signature || 'webhook_verified', method);
        recordAuditLog(null, 'WEBHOOK_PAYMENT_CAPTURED', 'payments', orderId, { event, paymentId });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    console.error('[WEBHOOK ERROR]', error);
    res.status(500).json({ error: error.message });
  }
});
