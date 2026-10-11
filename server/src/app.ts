import express from 'express';
import cors from 'cors';
import path from 'path';
import { UPLOAD_DIR, DOCUMENTS_DIR } from './config';
import { initDatabase } from './db/database';
import { seedDatabase } from './db/seed';
import { seedTasksAndQuizzes } from './db/seedTasks';
import { syncBatchesToInternships } from './db/syncBatchesToInternships';
import { startProvisioningWorker } from './services/provisioningWorker';

import { authRouter } from './routes/authRoutes';
import { internshipRouter } from './routes/internshipRoutes';
import { offerRouter } from './routes/offerRoutes';
import { paymentRouter } from './routes/paymentRoutes';
import { projectRouter } from './routes/projectRoutes';
import { documentRouter } from './routes/documentRoutes';
import { verificationRouter } from './routes/verificationRoutes';
import { studentRouter } from './routes/studentRoutes';
import { adminRouter } from './routes/adminRoutes';
import { publicRouter } from './routes/publicRoutes';

const app = express();

// Initialize DB and Seed data safely
try {
  initDatabase();
  seedDatabase();
  seedTasksAndQuizzes();
  syncBatchesToInternships();
  startProvisioningWorker();
} catch (initErr) {
  console.error('[SERVER INIT ERROR]', initErr);
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static Folders
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/documents', express.static(DOCUMENTS_DIR));

// Also serve fallback bundled assets if in serverless environment
const bundledAssetsDir = path.resolve(__dirname, '../../assets');
app.use('/assets', express.static(bundledAssetsDir));

const fallbackDocumentsDir = path.resolve(__dirname, '../../documents');
app.use('/documents', express.static(fallbackDocumentsDir));

const fallbackUploadsDir = path.resolve(__dirname, '../../uploads');
app.use('/uploads', express.static(fallbackUploadsDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/internships', internshipRouter);
app.use('/api/offers', offerRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/projects', projectRouter);
app.use('/api/documents', documentRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/students', studentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);

// Root Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'AAGAM Digital Technology Enterprise API',
    tagline: 'Learn • Build • Innovate',
    version: '2.0.0',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'nodejs-standalone',
    timestamp: new Date().toISOString(),
  });
});

export { app };
export default app;
