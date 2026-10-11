import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { db } from '../db/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'student' | 'staff' | 'admin' | 'superadmin';
  full_name: string;
  student_id?: string;
  staff_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No access token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    
    // Verify user is still active in database
    const user = db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(decoded.id) as { id: string; is_active: number } | undefined;
    if (!user || user.is_active !== 1) {
      res.status(403).json({ success: false, message: 'Your account is deactivated or invalid. Please contact HR/Admin.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired session token. Please log in again.' });
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
    } catch (e) {
      // Ignore token error for optional auth
    }
  }
  next();
}

export function requireRoles(...allowedRoles: Array<'student' | 'staff' | 'admin' | 'superadmin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
      return;
    }

    // Superadmin has access to everything
    if (req.user.role === 'superadmin' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
    });
  };
}
