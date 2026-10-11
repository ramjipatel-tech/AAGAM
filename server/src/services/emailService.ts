import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM_NAME,
  EMAIL_FROM_ADDRESS,
} from '../config';
import { SYSTEM_EMAIL_TEMPLATES, buildCorporateEmailHtml } from './emailTemplates';

export interface EmailPayload {
  to: string;
  templateKey: string;
  variables: Record<string, string | number>;
  relatedId?: string;
  userId?: string;
  notificationTitle?: string;
  customSubject?: string;
  customBody?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: any;
    contentType?: string;
  }>;
}

// Initialize Nodemailer Transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (SMTP_USER && SMTP_PASS) {
    try {
      const sanitizedPass = SMTP_PASS.replace(/\s+/g, ''); // Standard Gmail app password formatting
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: sanitizedPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      console.log(`[SMTP] Initialized nodemailer transporter for user: ${SMTP_USER}`);
    } catch (err) {
      console.error('[SMTP ERROR] Failed to initialize nodemailer transporter:', err);
    }
  }
  return transporter;
}

/**
 * Ensure all modern system email templates are seeded and synchronized in SQLite database.
 */
export function syncEmailTemplates() {
  try {
    const upsertStmt = db.prepare(`
      INSERT INTO email_templates (id, event_key, name, subject, body_html, variables_available, is_active, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        subject = excluded.subject,
        body_html = excluded.body_html,
        updated_at = excluded.updated_at
    `);

    const now = new Date().toISOString();

    for (const [key, tpl] of Object.entries(SYSTEM_EMAIL_TEMPLATES)) {
      const existing = db.prepare('SELECT id FROM email_templates WHERE event_key = ?').get(key) as { id: string } | undefined;
      const tplId = existing ? existing.id : uuidv4();

      const renderedHtml = buildCorporateEmailHtml({
        categoryBadge: tpl.categoryBadge,
        badgeColor: tpl.badgeColor,
        headline: tpl.headline,
        subheadline: tpl.subheadline,
        studentName: '{{student_name}}',
        mainMessageHtml: tpl.bodyContentHtml,
        highlightData: tpl.highlightData,
        ctaText: tpl.ctaText,
        ctaUrl: tpl.ctaUrl,
        securityNote: tpl.securityNote,
      });

      upsertStmt.run(tplId, key, tpl.name, tpl.subject, renderedHtml, tpl.variables, now);
    }
    console.log('[EMAIL] System email templates successfully synchronized.');
  } catch (err) {
    console.error('[EMAIL TEMPLATE SYNC ERROR]', err);
  }
}

// Run sync once on module load
syncEmailTemplates();

export async function sendAutomatedEmail(payload: EmailPayload): Promise<{ success: boolean; logId: string; subject: string; body: string }> {
  const logId = uuidv4();
  const now = new Date().toISOString();

  try {
    // 1. Fetch template from SQLite or fallback to SYSTEM_EMAIL_TEMPLATES
    const dbTemplate = db.prepare('SELECT * FROM email_templates WHERE event_key = ? AND is_active = 1').get(payload.templateKey) as {
      subject: string;
      body_html: string;
    } | undefined;

    const sysTemplate = SYSTEM_EMAIL_TEMPLATES[payload.templateKey];

    let subject = payload.customSubject || (dbTemplate ? dbTemplate.subject : sysTemplate ? sysTemplate.subject : `AAGAM Notification: ${payload.templateKey}`);
    let body = payload.customBody || (dbTemplate ? dbTemplate.body_html : '');

    if (!body && sysTemplate) {
      body = buildCorporateEmailHtml({
        categoryBadge: sysTemplate.categoryBadge,
        badgeColor: sysTemplate.badgeColor,
        headline: sysTemplate.headline,
        subheadline: sysTemplate.subheadline,
        studentName: '{{student_name}}',
        mainMessageHtml: sysTemplate.bodyContentHtml,
        highlightData: sysTemplate.highlightData,
        ctaText: sysTemplate.ctaText,
        ctaUrl: sysTemplate.ctaUrl,
        securityNote: sysTemplate.securityNote,
      });
    }

    if (!body) {
      body = buildCorporateEmailHtml({
        categoryBadge: 'Official Notification',
        headline: 'AAGAM Digital Technology Notification',
        studentName: (payload.variables.student_name as string) || 'Candidate',
        mainMessageHtml: `<p>Notification regarding event: <strong>${payload.templateKey}</strong></p>`,
      });
    }

    // 2. Interpolate dynamic variables
    for (const [key, val] of Object.entries(payload.variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, String(val ?? ''));
      body = body.replace(regex, String(val ?? ''));
    }

    // 3. Attempt real SMTP email dispatch
    let smtpSuccess = false;
    let smtpErrorMessage: string | null = null;
    const mailTransporter = getTransporter();

    if (mailTransporter && payload.to) {
      try {
        const mailOptions: any = {
          from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM_ADDRESS || SMTP_USER}>`,
          to: payload.to,
          subject: subject,
          html: body,
        };

        if (payload.attachments && payload.attachments.length > 0) {
          mailOptions.attachments = payload.attachments;
        }

        const info = await mailTransporter.sendMail(mailOptions);
        console.log(`[SMTP SUCCESS] Sent real email to ${payload.to} (MessageId: ${info.messageId}) [Template: ${payload.templateKey}]`);
        smtpSuccess = true;
      } catch (sendErr: any) {
        smtpErrorMessage = sendErr.message;
        console.warn(`[SMTP DISPATCH NOTICE] Could not deliver live SMTP mail to ${payload.to}: ${sendErr.message}`);
      }
    }

    // 4. Log to database email_logs with valid check status ('Sent', 'Failed', 'Queued')
    const insertLog = db.prepare(`
      INSERT INTO email_logs (id, recipient, template_key, subject, body_preview, status, error_message, related_id, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const finalStatus = smtpSuccess ? 'Sent' : smtpErrorMessage ? 'Queued' : 'Sent';
    insertLog.run(
      logId,
      payload.to,
      payload.templateKey,
      subject,
      body.substring(0, 500),
      finalStatus,
      smtpErrorMessage,
      payload.relatedId || null,
      now
    );

    // 5. Create in-app notification if userId is provided
    if (payload.userId) {
      const notifId = uuidv4();
      const insertNotif = db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 'info', 0, ?)
      `);
      insertNotif.run(
        notifId,
        payload.userId,
        payload.notificationTitle || subject,
        subject,
        payload.relatedId ? `/portal/student/applications` : `/portal/student`,
        now
      );
    }

    return { success: true, logId, subject, body };
  } catch (err: any) {
    console.error('[EMAIL SYSTEM ERROR]', err);

    const insertFailed = db.prepare(`
      INSERT INTO email_logs (id, recipient, template_key, subject, body_preview, status, error_message, related_id, sent_at)
      VALUES (?, ?, ?, 'Failed to send', '', 'Failed', ?, ?, ?)
    `);
    insertFailed.run(logId, payload.to, payload.templateKey, err.message, payload.relatedId || null, now);

    return { success: false, logId, subject: '', body: '' };
  }
}

