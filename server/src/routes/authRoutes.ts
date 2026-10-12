import express, { Request, Response } from 'express';
import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { JWT_SECRET, CLIENT_URL } from '../config';
import { authenticateToken, AuthenticatedUser } from '../middleware/auth';
import { sendAutomatedEmail } from '../services/emailService';
import { recordAuditLog } from '../services/auditService';

export const authRouter = express.Router();

// Helper to generate 6-digit numeric OTP
function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

// 1. POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone, college_name, course, semester_year, roll_no } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
      return;
    }

    const userId = uuidv4();
    const studentProfileId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    // Insert user
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, phone, avatar_url, is_active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, 'student', ?, ?, null, 1, 0, ?, ?)
    `).run(userId, email.toLowerCase(), passwordHash, full_name, phone || null, now, now);

    // Insert student profile
    db.prepare(`
      INSERT INTO students (id, user_id, registration_no, college_name, course, branch, semester_year, roll_no, cgpa, skills, address, city, state, pincode, resume_url, created_at, updated_at)
      VALUES (?, ?, null, ?, ?, null, ?, ?, null, null, null, null, null, null, null, ?, ?)
    `).run(studentProfileId, userId, college_name || null, course || null, semester_year || null, roll_no || null, now, now);

    // Generate and send OTP
    const otp = generateOtp();
    const otpId = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    db.prepare(`
      INSERT INTO otp_verifications (id, email, otp, purpose, attempts, expires_at, is_used, created_at)
      VALUES (?, ?, ?, 'registration', 0, ?, 0, ?)
    `).run(otpId, email.toLowerCase(), otp, expiresAt, now);

    await sendAutomatedEmail({
      to: email.toLowerCase(),
      templateKey: 'otp_verification',
      variables: { otp, email: email.toLowerCase() },
      userId,
      notificationTitle: 'Verify Your Email Address',
    });

    recordAuditLog(null, 'USER_REGISTER_INITIATED', 'users', userId, { email, full_name });

    res.json({
      success: true,
      message: 'Account created. A 6-digit OTP has been sent to your email address.',
      userId,
      email: email.toLowerCase(),
      requiresOtp: true,
    });
  } catch (error: any) {
    console.error('[REGISTER ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Internal registration error.' });
  }
});

// 2. POST /api/auth/verify-registration-otp
authRouter.post('/verify-registration-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
      return;
    }

    const otpRecord = db.prepare(`
      SELECT * FROM otp_verifications
      WHERE email = ? AND purpose = 'registration' AND is_used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(email.toLowerCase()) as any;

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'No active OTP found. Please request a new OTP.' });
      return;
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Your OTP has expired. Please request a new OTP.' });
      return;
    }

    if (otpRecord.otp !== otp.trim()) {
      db.prepare('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?').run(otpRecord.id);
      res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
      return;
    }

    // Mark OTP used
    db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(otpRecord.id);

    // Mark email verified
    db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE email = ?').run(
      new Date().toISOString(),
      email.toLowerCase()
    );

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id) as any;

    const tokenPayload: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      student_id: student?.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    recordAuditLog(null, 'USER_EMAIL_VERIFIED', 'users', user.id, { email });

    res.json({
      success: true,
      message: 'Email successfully verified. Welcome to AAGAM Digital Technology!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        email_verified: 1,
        student,
      },
    });
  } catch (error: any) {
    console.error('[OTP VERIFY ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
});

// 3. POST /api/auth/login (Standard Login)
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email or password.' });
      return;
    }

    if (user.is_active !== 1) {
      res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact AAGAM support/HR.' });
      return;
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please check your password.' });
      return;
    }

    let student: any = null;
    let staff: any = null;

    if (user.role === 'student') {
      student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id) as any;
    } else if (user.role === 'staff' || user.role === 'admin' || user.role === 'superadmin') {
      staff = db.prepare('SELECT * FROM staff WHERE user_id = ?').get(user.id) as any;
    }

    const tokenPayload: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      student_id: student?.id,
      staff_id: staff?.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    recordAuditLog(null, 'USER_LOGIN_SUCCESS', 'users', user.id, { email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
        student,
        staff,
      },
    });
  } catch (error: any) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ success: false, message: 'Internal login error.' });
  }
});

// 3.1. POST /api/auth/admin-login-init (Step 1: Check Credentials & Dispatch 2FA OTP)
authRouter.post('/admin-login-init', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Admin email and password are required.' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'staff')) {
      res.status(401).json({ success: false, message: 'Unauthorized administrative credentials.' });
      return;
    }

    if (user.is_active !== 1) {
      res.status(403).json({ success: false, message: 'This administrative account is inactive.' });
      return;
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid administrative password. Access denied.' });
      return;
    }

    const otp = generateOtp();
    const otpId = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    db.prepare(`
      INSERT INTO otp_verifications (id, email, otp, purpose, attempts, expires_at, is_used, created_at)
      VALUES (?, ?, ?, 'admin_login', 0, ?, 0, ?)
    `).run(otpId, user.email, otp, expiresAt, now);

    await sendAutomatedEmail({
      to: user.email,
      templateKey: 'admin_login_otp',
      variables: { otp, email: user.email },
      userId: user.id,
      notificationTitle: 'Admin 2FA Security Passcode',
    });

    recordAuditLog(null, 'ADMIN_2FA_INITIATED', 'users', user.id, { email: user.email });

    res.json({
      success: true,
      requiresOtp: true,
      email: user.email,
      message: `2-Factor security verification code has been dispatched to ${user.email}.`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error: any) {
    console.error('[ADMIN LOGIN INIT ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to initiate admin authentication.' });
  }
});

// 3.2. POST /api/auth/admin-login-verify (Step 2: Verify 2FA OTP & Issue JWT)
authRouter.post('/admin-login-verify', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and 2FA code are required.' });
      return;
    }

    const otpRecord = db.prepare(`
      SELECT * FROM otp_verifications
      WHERE email = ? AND purpose = 'admin_login' AND is_used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(email.toLowerCase()) as any;

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'No active 2FA security request found. Please request a new code.' });
      return;
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Security passcode has expired. Please request a new one.' });
      return;
    }

    if (otpRecord.otp !== otp.trim()) {
      db.prepare('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?').run(otpRecord.id);
      res.status(400).json({ success: false, message: 'Incorrect 2FA passcode.' });
      return;
    }

    db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(otpRecord.id);

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
    const staff = db.prepare('SELECT * FROM staff WHERE user_id = ?').get(user.id) as any;

    const tokenPayload: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      staff_id: staff?.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    recordAuditLog(null, 'ADMIN_2FA_SUCCESS', 'users', user.id, { email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'Admin 2FA verified successfully. Welcome to AAGAM Admin Control Center!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        staff,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN LOGIN VERIFY ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to verify admin 2FA code.' });
  }
});

// 4. POST /api/auth/send-otp
authRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, purpose = 'application' } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const otp = generateOtp();
    const otpId = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO otp_verifications (id, email, otp, purpose, attempts, expires_at, is_used, created_at)
      VALUES (?, ?, ?, ?, 0, ?, 0, ?)
    `).run(otpId, email.toLowerCase(), otp, purpose, expiresAt, now);

    await sendAutomatedEmail({
      to: email.toLowerCase(),
      templateKey: 'otp_verification',
      variables: { otp, email: email.toLowerCase() },
      notificationTitle: `AAGAM OTP Code: ${otp}`,
    });

    res.json({
      success: true,
      message: `A verification OTP code has been sent to ${email}.`,
      expiresInMinutes: 10,
    });
  } catch (error: any) {
    console.error('[SEND OTP ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP code.' });
  }
});

// 5. POST /api/auth/verify-otp
authRouter.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are required.' });
      return;
    }

    const query = purpose
      ? `SELECT * FROM otp_verifications WHERE email = ? AND purpose = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1`
      : `SELECT * FROM otp_verifications WHERE email = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1`;

    const params = purpose ? [email.toLowerCase(), purpose] : [email.toLowerCase()];
    const otpRecord = db.prepare(query).get(...params) as any;

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'No active OTP verification code found. Please request a new one.' });
      return;
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Your OTP code has expired. Please request a new code.' });
      return;
    }

    if (otpRecord.otp !== otp.trim()) {
      db.prepare('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?').run(otpRecord.id);
      res.status(400).json({ success: false, message: 'Invalid OTP code. Please enter the correct code.' });
      return;
    }

    // Mark as used
    db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(otpRecord.id);

    res.json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error: any) {
    console.error('[VERIFY OTP ERROR]', error);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
});

// 6. GET /api/auth/me
authRouter.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.prepare('SELECT id, email, role, full_name, phone, avatar_url, is_active, email_verified, created_at FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    let student = null;
    let staff = null;

    if (user.role === 'student') {
      student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);
    } else if (user.role === 'staff') {
      staff = db.prepare('SELECT * FROM staff WHERE user_id = ?').get(userId);
    }

    const unreadNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId) as { count: number };

    res.json({
      success: true,
      user: {
        ...user,
        student,
        staff,
        unreadNotificationsCount: unreadNotifs.count,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

// 8. POST /api/auth/otp-login-request (Passwordless OTP Login)
authRouter.post('/otp-login-request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, full_name, role, is_active FROM users WHERE email = ?').get(normalizedEmail) as any;

    if (!user) {
      res.status(404).json({ success: false, message: 'No registered account found with this email address.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'Your account is suspended. Please contact AAGAM administration.' });
      return;
    }

    const otp = generateOtp();
    const otpId = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO otp_verifications (id, email, otp, purpose, attempts, expires_at, is_used, created_at)
      VALUES (?, ?, ?, 'login', 0, ?, 0, ?)
    `).run(otpId, normalizedEmail, otp, expiresAt, now);

    await sendAutomatedEmail({
      to: normalizedEmail,
      templateKey: 'otp_verification',
      variables: {
        otp,
        student_name: user.full_name,
      },
      userId: user.id,
      notificationTitle: `AAGAM Portal Login Security Code: ${otp}`,
    });

    res.json({
      success: true,
      message: `Login verification code dispatched to ${normalizedEmail}.`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      expiresInMinutes: 10,
    });
  } catch (error: any) {
    console.error('[OTP LOGIN REQUEST ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to send login OTP.' });
  }
});

// 9. POST /api/auth/otp-login-verify
authRouter.post('/otp-login-verify', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    const otpRecord = db.prepare(`
      SELECT * FROM otp_verifications
      WHERE email = ? AND purpose = 'login' AND is_used = 0 AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).get(normalizedEmail, now) as any;

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please request a new one.' });
      return;
    }

    if (otpRecord.otp !== otp.trim()) {
      db.prepare('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?').run(otpRecord.id);
      res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
      return;
    }

    db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(otpRecord.id);

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;
    let student: any = null;
    let staff: any = null;

    if (user.role === 'student') {
      student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
    } else if (user.role === 'staff' || user.role === 'admin') {
      staff = db.prepare('SELECT * FROM staff WHERE user_id = ?').get(user.id);
    }

    const tokenPayload: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      student_id: student?.id,
      staff_id: staff?.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    recordAuditLog(null, 'USER_OTP_LOGIN_SUCCESS', 'users', user.id, { email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'OTP login successful. Welcome back!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
        student,
        staff,
      },
    });
  } catch (error: any) {
    console.error('[OTP LOGIN VERIFY ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to verify login OTP.' });
  }
});

// 10. POST /api/auth/forgot-password (Dispatches 1-Hour Token Link & 6-Digit OTP)
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, full_name FROM users WHERE email = ?').get(normalizedEmail) as any;

    if (!user) {
      // Return success without revealing user absence for security
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link and OTP have been dispatched.',
      });
      return;
    }

    const resetToken = uuidv4();
    const resetOtp = generateOtp();
    const tokenId = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiration

    db.prepare(`
      INSERT INTO password_reset_tokens (id, user_id, email, token, otp, expires_at, is_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(tokenId, user.id, normalizedEmail, resetToken, resetOtp, expiresAt, now);

    const resetUrl = `${CLIENT_URL}/?view=reset-password&token=${resetToken}`;

    await sendAutomatedEmail({
      to: normalizedEmail,
      templateKey: 'password_reset_request',
      variables: {
        student_name: user.full_name,
        otp: resetOtp,
        reset_url: resetUrl,
        expires_in: '1 Hour',
      },
      userId: user.id,
      notificationTitle: 'Password Reset Request',
      relatedId: tokenId,
    });

    recordAuditLog(req, 'PASSWORD_RESET_REQUESTED', 'users', user.id, { email: normalizedEmail });

    res.json({
      success: true,
      message: 'Password reset link and OTP dispatched to your registered email address (valid for 1 hour).',
      devOtp: process.env.NODE_ENV !== 'production' ? resetOtp : undefined,
      resetUrl,
    });
  } catch (error: any) {
    console.error('[FORGOT PASSWORD ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
  }
});

// 11. POST /api/auth/reset-password (Set New Password with Token or OTP)
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, otp, email, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const now = new Date().toISOString();
    let resetRecord: any = null;

    if (token) {
      resetRecord = db.prepare(`
        SELECT * FROM password_reset_tokens
        WHERE token = ? AND is_used = 0 AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
      `).get(token, now) as any;
    } else if (email && otp) {
      resetRecord = db.prepare(`
        SELECT * FROM password_reset_tokens
        WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
      `).get(email.trim().toLowerCase(), otp.trim(), now) as any;
    }

    if (!resetRecord) {
      res.status(400).json({ success: false, message: 'Invalid or expired password reset token / OTP.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(new_password, 10);

    // Update password
    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, now, resetRecord.user_id);

    // Mark token as used
    db.prepare('UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?').run(resetRecord.id);

    const user = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(resetRecord.user_id) as any;

    // Send confirmation email
    await sendAutomatedEmail({
      to: user.email,
      templateKey: 'password_reset_success',
      variables: {
        student_name: user.full_name,
        email: user.email,
        login_url: `${CLIENT_URL}/?view=student-login`,
      },
      userId: resetRecord.user_id,
      notificationTitle: 'Password Updated Successfully',
    });

    recordAuditLog(req, 'PASSWORD_RESET_SUCCESS', 'users', resetRecord.user_id, { email: user.email });

    res.json({
      success: true,
      message: 'Your password has been successfully updated! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[RESET PASSWORD ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

