import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { Request } from 'express';

export function recordAuditLog(
  req: Request | null,
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: Record<string, any>
) {
  try {
    const logId = uuidv4();
    const actorId = req?.user?.id || 'system';
    const actorEmail = req?.user?.email || 'system@aagam.internal';
    const actorRole = req?.user?.role || 'system';
    const ipAddress = req?.ip || req?.headers['x-forwarded-for']?.toString() || '127.0.0.1';
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_email, actor_role, action, target_type, target_id, ip_address, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      logId,
      actorId,
      actorEmail,
      actorRole,
      action,
      targetType,
      targetId || null,
      ipAddress,
      details ? JSON.stringify(details) : null,
      now
    );
  } catch (error) {
    console.error('[AUDIT ERROR]', error);
  }
}
