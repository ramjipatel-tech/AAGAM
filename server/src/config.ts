import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try loading .env from server folder or project root
const serverEnvPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'aagam_super_secure_enterprise_jwt_secret_2026_production';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_aagam_live_demo';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_aagam_2026_key';
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_2026';

// SMTP Configuration
export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
export const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
export const SMTP_USER = process.env.SMTP_USER || 'shantisetu.business@gmail.com';
export const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || 'easy xsrm vuuk rban';
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'AAGAM Digital Technology';
export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || SMTP_USER;

export const IS_VERCEL = !!process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

export const UPLOAD_DIR = IS_VERCEL
  ? path.join('/tmp', 'uploads')
  : (process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.resolve(__dirname, '../../uploads'));

export const DOCUMENTS_DIR = IS_VERCEL
  ? path.join('/tmp', 'documents')
  : (process.env.DOCUMENT_DIR ? path.resolve(process.env.DOCUMENT_DIR) : path.resolve(__dirname, '../../documents'));

// Ensure directories exist safely without crashing on read-only serverless filesystems
[UPLOAD_DIR, DOCUMENTS_DIR].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn(`[CONFIG] Could not create directory ${dir}:`, err);
  }
});

// If running in Vercel, copy bundled document assets to /tmp/documents/assets if available
if (IS_VERCEL) {
  try {
    const tmpAssetsDir = path.join(DOCUMENTS_DIR, 'assets');
    if (!fs.existsSync(tmpAssetsDir)) {
      fs.mkdirSync(tmpAssetsDir, { recursive: true });
    }
    const sourceCandidates = [
      path.resolve(__dirname, '../../documents/assets'),
      path.resolve(process.cwd(), 'documents/assets'),
    ];
    for (const src of sourceCandidates) {
      if (fs.existsSync(src)) {
        const files = fs.readdirSync(src);
        for (const file of files) {
          const destFile = path.join(tmpAssetsDir, file);
          if (!fs.existsSync(destFile)) {
            fs.copyFileSync(path.join(src, file), destFile);
          }
        }
        break;
      }
    }
  } catch (e) {
    console.warn('[CONFIG] Failed copying bundled document assets:', e);
  }
}

