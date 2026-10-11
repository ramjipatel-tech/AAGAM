import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { optionalAuthenticate } from '../middleware/auth';
import { recordAuditLog } from '../services/auditService';
import { sendAutomatedEmail } from '../services/emailService';

export const publicRouter = express.Router();

// 1. GET /api/public/company-info
publicRouter.get('/company-info', (req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT key, value FROM system_settings').all() as Array<{ key: string; value: string }>;
    const configMap: Record<string, string> = {};
    settings.forEach((s) => {
      configMap[s.key] = s.value;
    });

    res.json({
      success: true,
      company: {
        name: configMap['company_name'] || 'AAGAM Digital Technology',
        tagline: configMap['tagline'] || 'Learn • Build • Innovate',
        ceo: {
          name: configMap['ceo_name'] || 'Ayush Raj',
          title: 'Chief Executive Officer',
        },
        hr: {
          name: configMap['hr_name'] || 'Akash Verma',
          phone: configMap['hr_phone'] || '9693335499',
          email: configMap['hr_email'] || 'akashvermaofficialblogs@gmail.com',
          title: 'Head of HR & Talent Acquisition',
        },
        officialEmail: configMap['company_email'] || 'AAGAMDigitaltech@gmail.com',
        phoneNumbers: (configMap['contact_numbers'] || '7667204026, 9142363927, 7091465676').split(',').map((s) => s.trim()),
        slas: {
          reviewWindowHours: parseInt(configMap['review_sla_hours'] || '48', 10),
          provisioningWindowHours: parseInt(configMap['provisioning_sla_hours'] || '2', 10),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load company info.' });
  }
});

// 2. GET /api/public/trainings
publicRouter.get('/trainings', (req: Request, res: Response) => {
  try {
    const trainings = db.prepare("SELECT * FROM training_programs WHERE status = 'Active' ORDER BY created_at DESC").all() as any[];
    const formatted = trainings.map((t) => ({
      ...t,
      syllabus: JSON.parse(t.syllabus || '[]'),
    }));
    res.json({ success: true, trainings: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load trainings.' });
  }
});

// 3. GET /api/public/placements
publicRouter.get('/placements', (req: Request, res: Response) => {
  try {
    const drives = db.prepare("SELECT * FROM placement_drives WHERE status = 'Active' ORDER BY drive_date ASC").all();
    res.json({ success: true, placements: drives });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load placement drives.' });
  }
});

// 4. GET /api/public/jobs
publicRouter.get('/jobs', (req: Request, res: Response) => {
  try {
    const jobs = db.prepare("SELECT * FROM jobs WHERE status = 'Active' ORDER BY created_at DESC").all();
    res.json({ success: true, jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load job openings.' });
  }
});

// 4.1. GET /api/public/batches (Live Active Batches created by Admin)
publicRouter.get('/batches', (req: Request, res: Response) => {
  try {
    const batches = db.prepare(`
      SELECT b.*, 
             (SELECT COUNT(*) FROM batch_enrollments be WHERE be.batch_id = b.id) as enrolled_students_count
      FROM batches b
      WHERE b.status IN ('Active', 'Upcoming', 'Ongoing')
      ORDER BY b.created_at DESC
    `).all() as any[];

    const formatted = batches.map((b) => {
      let modules = [];
      try {
        modules = JSON.parse(b.curriculum_modules || b.modules || '[]');
      } catch (e) {
        modules = [];
      }

      const enrolled = b.enrolled_students_count || b.enrolled_count || 0;
      const maxSeats = Number(b.max_seats) || 50;
      const seatsLeft = Math.max(0, maxSeats - enrolled);

      return {
        ...b,
        modules,
        department: b.department || (b.program_type === 'internship' ? 'Software Engineering' : 'Technical Masterclass'),
        enrolled_count: enrolled,
        max_seats: maxSeats,
        seats_left: seatsLeft,
        is_filling_fast: seatsLeft <= 15,
        is_open: b.status === 'Upcoming' || b.status === 'Active' || b.status === 'Ongoing',
      };
    });

    res.json({ success: true, batches: formatted });
  } catch (error: any) {
    console.error('[GET PUBLIC BATCHES ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to load active batches.' });
  }
});

// 5. POST /api/public/trainings/enroll (Dedicated Training Enrollment with OTP & Email Delivery)
publicRouter.post('/trainings/enroll', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const {
      training_id,
      student_name,
      student_email,
      student_phone,
      college_name,
      qualification,
      batch_preference,
      otp,
    } = req.body;

    if (!training_id || !student_name || !student_email || !student_phone) {
      res.status(400).json({ success: false, message: 'Missing required enrollment details.' });
      return;
    }

    const normalizedEmail = student_email.trim().toLowerCase();

    // 1. Verify OTP if provided
    if (otp) {
      const now = new Date().toISOString();
      const validOtp = db.prepare(`
        SELECT * FROM otp_verifications
        WHERE email = ? AND otp = ? AND purpose = 'application' AND is_used = 0 AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
      `).get(normalizedEmail, otp.trim(), now) as any;

      if (!validOtp && process.env.NODE_ENV === 'production') {
        res.status(400).json({ success: false, message: 'Invalid or expired verification OTP.' });
        return;
      }
      if (validOtp) {
        db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(validOtp.id);
      }
    }

    // 2. Fetch Training Program Details
    const training = db.prepare('SELECT * FROM training_programs WHERE id = ?').get(training_id) as any;
    if (!training) {
      res.status(404).json({ success: false, message: 'Training program not found.' });
      return;
    }

    const enrollmentId = uuidv4();
    const enrollmentNo = `AAGAM-TRN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    // 3. Find or Create User Record
    let user = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as any;
    let userId = user ? user.id : uuidv4();

    if (!user) {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, 'pending_provisioning', 'student', ?, ?, 1, 1, ?, ?)
      `).run(userId, normalizedEmail, student_name, student_phone, now, now);
    }

    // 4. Create Enrollment Record
    db.prepare(`
      INSERT INTO training_enrollments (id, training_id, user_id, student_id, progress_percentage, status, enrolled_at)
      VALUES (?, ?, ?, ?, 0, 'Active', ?)
    `).run(enrollmentId, training_id, userId, userId, now);

    // 5. Send Real Email Notification via SMTP
    try {
      await sendAutomatedEmail({
        to: normalizedEmail,
        templateKey: 'application_submitted',
        variables: {
          student_name,
          registration_no: enrollmentNo,
          internship_name: training.title,
          status: 'Enrolled & Verified',
          review_timeline: 'Batch details and calendar invite will follow shortly',
          track_url: `http://127.0.0.1:5173/?view=training`,
        },
        notificationTitle: `AAGAM Training Enrollment Confirmed: ${training.title} (${enrollmentNo})`,
      });
    } catch (mailErr) {
      console.error('[TRAINING EMAIL ERROR]', mailErr);
    }

    recordAuditLog(req, 'TRAINING_ENROLLED', 'training_enrollments', enrollmentId, {
      enrollmentNo,
      training_title: training.title,
      student_email: normalizedEmail,
    });

    res.json({
      success: true,
      message: `Successfully enrolled in ${training.title}! An official enrollment receipt has been sent to ${normalizedEmail}.`,
      enrollment: {
        id: enrollmentId,
        enrollment_no: enrollmentNo,
        training_title: training.title,
        student_name,
        student_email: normalizedEmail,
        batch_preference: batch_preference || 'Regular Weekday Batch',
      },
    });
  } catch (error: any) {
    console.error('[TRAINING ENROLL ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to process training enrollment.' });
  }
});

// 5b. POST /api/public/jobs/apply (Dedicated Job & Placement Drive Application)
publicRouter.post('/jobs/apply', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const {
      job_id,
      applicant_name,
      applicant_email,
      applicant_phone,
      college_name,
      graduation_year,
      cgpa,
      resume_url,
      portfolio_url,
      cover_letter,
      otp,
    } = req.body;

    if (!job_id || !applicant_name || !applicant_email || !applicant_phone) {
      res.status(400).json({ success: false, message: 'Missing required application details.' });
      return;
    }

    const normalizedEmail = applicant_email.trim().toLowerCase();

    // 1. Verify OTP if provided
    if (otp) {
      const now = new Date().toISOString();
      const validOtp = db.prepare(`
        SELECT * FROM otp_verifications
        WHERE email = ? AND otp = ? AND purpose = 'application' AND is_used = 0 AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
      `).get(normalizedEmail, otp.trim(), now) as any;

      if (!validOtp && process.env.NODE_ENV === 'production') {
        res.status(400).json({ success: false, message: 'Invalid or expired verification OTP.' });
        return;
      }
      if (validOtp) {
        db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(validOtp.id);
      }
    }

    // 2. Find or Create Candidate User Record for application foreign key
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;
    let userId: string;

    if (req.user?.id) {
      userId = req.user.id;
    } else if (user) {
      userId = user.id;
    } else {
      userId = uuidv4();
      const initialRandomPass = uuidv4().substring(0, 10);
      const passwordHash = bcrypt.hashSync(initialRandomPass, 10);
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, 'student', ?, ?, 1, 1, ?, ?)
      `).run(userId, normalizedEmail, passwordHash, applicant_name, applicant_phone || null, now, now);
    }

    const appId = uuidv4();
    const appNo = `AAGAM-JOB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO job_applications (id, job_id, user_id, applicant_name, applicant_email, applicant_phone, resume_url, portfolio_url, cover_letter, status, applied_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Applied', ?)
    `).run(appId, job_id, userId, applicant_name, normalizedEmail, applicant_phone, resume_url || null, portfolio_url || null, cover_letter || null, now);

    // Send confirmation email
    try {
      await sendAutomatedEmail({
        to: normalizedEmail,
        templateKey: 'application_submitted',
        variables: {
          student_name: applicant_name,
          registration_no: appNo,
          internship_name: 'Job / Placement Opening',
          status: 'Under HR Review',
          review_timeline: '48 to 72 hours SLA',
          track_url: `http://127.0.0.1:5173/?view=jobs`,
        },
        notificationTitle: `AAGAM Application Acknowledged (${appNo})`,
      });
    } catch (mailErr) {
      console.error('[JOB EMAIL ERROR]', mailErr);
    }

    recordAuditLog(req, 'JOB_APPLICATION_SUBMITTED', 'job_applications', appId, {
      appNo,
      applicant_name,
      applicant_email: normalizedEmail,
    });

    res.json({
      success: true,
      message: `Your application has been received with tracking ID ${appNo}. Our talent acquisition team will review your profile.`,
      application: {
        id: appId,
        application_no: appNo,
        applicant_name,
        applicant_email: normalizedEmail,
        status: 'Applied',
      },
    });
  } catch (error: any) {
    console.error('[JOB APPLICATION ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to submit job application.' });
  }
});

// 6. GET /api/public/blogs
publicRouter.get('/blogs', (req: Request, res: Response) => {
  try {
    const blogs = db.prepare('SELECT * FROM blogs WHERE is_published = 1 ORDER BY published_at DESC').all();
    res.json({ success: true, blogs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load blogs.' });
  }
});

// 7. GET /api/public/blogs/:slug
publicRouter.get('/blogs/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const blog = db.prepare('SELECT * FROM blogs WHERE slug = ? OR id = ?').get(slug, slug);
    if (!blog) {
      res.status(404).json({ success: false, message: 'Blog article not found.' });
      return;
    }
    res.json({ success: true, blog });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load blog.' });
  }
});

// 8. POST /api/public/contact (Enquiry)
publicRouter.post('/contact', (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ success: false, message: 'Please provide name, email, and message.' });
      return;
    }

    const enquiryId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO contact_enquiries (id, name, email, phone, subject, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'New', ?)
    `).run(enquiryId, name, email, phone || null, subject || 'General Corporate Enquiry', message, now);

    recordAuditLog(null, 'CONTACT_ENQUIRY_RECEIVED', 'contact_enquiries', enquiryId, { name, email, subject });

    res.json({
      success: true,
      message: 'Thank you for contacting AAGAM Digital Technology. Our corporate desk or HR team will get back to you shortly.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to submit enquiry.' });
  }
});

// 9. GET /api/public/certificate-settings
publicRouter.get('/certificate-settings', (req: Request, res: Response) => {
  try {
    const rows = db.prepare("SELECT key, value FROM system_settings WHERE group_name = 'certificate'").all() as any[];
    const settings: Record<string, string> = {
      cert_company_name: 'AAGAM DIGITAL TECHNOLOGY PVT. LTD.',
      cert_tagline: 'LEARN • BUILD • INNOVATE',
      cert_iso_text: 'An ISO 9001: 2015 certified',
      cert_mca_text: 'Registered Under Ministry of Corporate Affairs, Govt. of India',
      cert_cin_number: 'Corporate Identification No. : U80904BR2021PTC054517',
      cert_ribbon_title: 'CERTIFICATE OF INDUSTRIAL INTERNSHIP EXCELLENCE',
      cert_corporate_office: 'Corporate office: Dak Bunglow Chauraha Near Biscoman Tower Patna',
      cert_director_name: 'Ayush Raj',
      cert_director_title: 'Director',
      cert_instructor_name: 'Akash Verma',
      cert_instructor_title: 'Course Instructor',
    };
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch certificate settings.' });
  }
});

