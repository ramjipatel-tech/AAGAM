import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { authenticateToken } from '../middleware/auth';
import { recordAuditLog } from '../services/auditService';

export const studentRouter = express.Router();

// 1. GET /api/students/overview
studentRouter.get('/overview', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Student profile with mentor
    const student = db.prepare(`
      SELECT s.*, u.full_name as mentor_name, u.email as mentor_email, u.phone as mentor_phone, st.designation as mentor_designation
      FROM students s
      LEFT JOIN users u ON s.mentor_id = u.id
      LEFT JOIN staff st ON u.id = st.user_id
      WHERE s.user_id = ?
    `).get(userId) as any;

    // Applications
    const applications = db.prepare(`
      SELECT a.*, i.title as internship_title, i.slug as internship_slug, i.duration, i.mode
      FROM internship_applications a
      JOIN internships i ON a.internship_id = i.id
      WHERE a.user_id = ?
      ORDER BY a.submitted_at DESC
    `).all(userId);

    // Offers
    const offers = db.prepare(`
      SELECT o.*, i.title as internship_title
      FROM offer_letters o
      JOIN internships i ON o.internship_id = i.id
      WHERE o.user_id = ?
      ORDER BY o.issued_at DESC
    `).all(userId);

    // Payments
    const payments = db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    // Projects
    const projects = db.prepare(`
      SELECT pa.id as assignment_id, pa.status, p.title, p.deadline
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      WHERE pa.user_id = ?
    `).all(userId);

    // Tasks & Quizzes count
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM internship_tasks').get() as { count: number };
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM task_submissions WHERE user_id = ? AND status = 'Approved'").get(userId) as { count: number };

    // Documents count
    const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates WHERE user_id = ?').get(userId) as { count: number };
    const lorCount = db.prepare('SELECT COUNT(*) as count FROM lors WHERE user_id = ?').get(userId) as { count: number };

    // Notifications
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);

    res.json({
      success: true,
      data: {
        student,
        applications,
        offers,
        payments,
        projects,
        taskStats: {
          total: taskCount.count || 4,
          completed: completedTasks.count || 0,
        },
        documentStats: {
          certificates: certCount.count,
          lors: lorCount.count,
          offers: offers.length,
        },
        notifications,
      },
    });
  } catch (error: any) {
    console.error('[STUDENT OVERVIEW ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to load student dashboard overview.' });
  }
});

// 2. GET /api/students/applications
studentRouter.get('/applications', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const applications = db.prepare(`
      SELECT a.*, i.title as internship_title, i.slug as internship_slug, i.department, i.duration, i.mode, i.start_date,
             o.id as offer_letter_id, o.offer_id, o.status as offer_status
      FROM internship_applications a
      JOIN internships i ON a.internship_id = i.id
      LEFT JOIN offer_letters o ON a.id = o.application_id
      WHERE a.user_id = ?
      ORDER BY a.submitted_at DESC
    `).all(userId) as any[];

    // Fetch documents for each application
    const getDocs = db.prepare('SELECT * FROM application_documents WHERE application_id = ?');
    for (const app of applications) {
      app.documents = getDocs.all(app.id);
      if (app.ocr_data) {
        try {
          app.ocr_data = JSON.parse(app.ocr_data);
        } catch (e) {}
      }
    }

    res.json({ success: true, applications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load student applications.' });
  }
});

// 3. GET /api/students/internship-portal
studentRouter.get('/internship-portal', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Check active offer / application
    const activeInternship = db.prepare(`
      SELECT o.*, i.title, i.department, i.technology, i.duration, i.full_description,
             u.full_name as mentor_name, u.email as mentor_email, u.phone as mentor_phone, st.designation as mentor_designation
      FROM offer_letters o
      JOIN internships i ON o.internship_id = i.id
      LEFT JOIN students s ON o.student_id = s.id
      LEFT JOIN users u ON s.mentor_id = u.id OR (s.mentor_id IS NULL AND u.role = 'staff')
      LEFT JOIN staff st ON u.id = st.user_id
      WHERE o.user_id = ? AND o.status IN ('Accepted', 'Issued')
      ORDER BY o.issued_at DESC LIMIT 1
    `).get(userId) as any;

    if (!activeInternship) {
      res.json({
        success: true,
        hasActiveInternship: false,
        message: 'No active or accepted internship found for this account.',
      });
      return;
    }

    // Fetch student projects
    const projects = db.prepare(`
      SELECT pa.id as assignment_id, pa.status as assignment_status, pa.assigned_at,
             p.*, ps.id as submission_id, ps.github_url, ps.live_demo_url, ps.status as submission_status, ps.staff_remarks
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      LEFT JOIN project_submissions ps ON pa.id = ps.assignment_id
      WHERE pa.user_id = ?
      ORDER BY pa.assigned_at DESC
    `).all(userId);

    // Fetch tasks & submissions
    const tasks = db.prepare(`
      SELECT t.*, ts.id as submission_id, ts.submission_text, ts.attachment_url, ts.status as submission_status, ts.grade, ts.feedback, ts.submitted_at
      FROM internship_tasks t
      LEFT JOIN task_submissions ts ON t.id = ts.task_id AND ts.user_id = ?
      ORDER BY t.week_no ASC
    `).all(userId);

    // Fetch quizzes & attempts
    const quizzes = db.prepare(`
      SELECT q.id, q.title, q.passing_score, q.questions_json,
             qa.id as attempt_id, qa.score, qa.total_questions, qa.passed, qa.attempted_at
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.user_id = ?
    `).all(userId) as any[];

    const formattedQuizzes = quizzes.map((q) => {
      let parsed = [];
      try {
        parsed = JSON.parse(q.questions_json);
      } catch (e) {
        parsed = [];
      }
      return {
        ...q,
        questions: parsed,
      };
    });

    res.json({
      success: true,
      hasActiveInternship: true,
      internship: {
        ...activeInternship,
        orientationDetails: {
          title: 'AAGAM Engineering Induction & Security Guidelines',
          time: 'Every Monday & Wednesday, 6:00 PM IST',
          platform: 'Google Meet / AAGAM Live Portal',
          recordingUrl: 'https://aagamtech.com/orientation/archive',
        },
        mentor: {
          name: activeInternship.mentor_name || 'Akash Verma',
          designation: activeInternship.mentor_designation || 'Head of Talent & Engineering Mentorship',
          phone: activeInternship.mentor_phone || '9693335499',
          email: activeInternship.mentor_email || 'akashvermaofficialblogs@gmail.com',
        },
        projects,
        tasks,
        quizzes: formattedQuizzes,
      },
    });
  } catch (error: any) {
    console.error('[INTERNSHIP PORTAL ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to load internship portal.' });
  }
});

// 3b. GET /api/students/tasks
studentRouter.get('/tasks', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const tasks = db.prepare(`
      SELECT t.*, ts.id as submission_id, ts.submission_text, ts.attachment_url, ts.status as submission_status, ts.grade, ts.feedback, ts.submitted_at
      FROM internship_tasks t
      LEFT JOIN task_submissions ts ON t.id = ts.task_id AND ts.user_id = ?
      ORDER BY t.week_no ASC
    `).all(userId);
    res.json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load tasks.' });
  }
});

// 3c. GET /api/students/quizzes
studentRouter.get('/quizzes', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const quizzes = db.prepare(`
      SELECT q.id, q.title, q.passing_score, q.questions_json,
             qa.id as attempt_id, qa.score, qa.total_questions, qa.passed, qa.attempted_at
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.user_id = ?
    `).all(userId) as any[];

    const formattedQuizzes = quizzes.map((q) => {
      let parsed = [];
      try {
        parsed = JSON.parse(q.questions_json);
      } catch (e) {
        parsed = [];
      }
      return { ...q, questions: parsed };
    });

    res.json({ success: true, quizzes: formattedQuizzes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load quizzes.' });
  }
});

// 4. POST /api/students/tasks/submit (Submit task milestone)
studentRouter.post('/tasks/submit', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const task_id = req.body.task_id || req.body.taskId;
    const submission_text = req.body.submission_text || req.body.submissionText || req.body.notes || req.body.submissionUrl || 'Completed';
    const attachment_url = req.body.attachment_url || req.body.attachmentUrl || req.body.submissionUrl || req.body.liveDemoUrl;

    if (!task_id) {
      res.status(400).json({ success: false, message: 'Task ID is required.' });
      return;
    }

    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(userId) as any;
    const submissionId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO task_submissions (id, task_id, student_id, user_id, submission_text, attachment_url, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?)
    `).run(submissionId, task_id, student ? student.id : userId, userId, submission_text, attachment_url || null, now);

    res.json({ success: true, message: 'Task submitted for mentor review!' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to submit task.' });
  }
});

// 5. POST /api/students/quizzes/submit (Submit quiz responses)
studentRouter.post('/quizzes/submit', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const quiz_id = req.body.quiz_id || req.body.quizId;
    const answers = req.body.answers;

    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quiz_id) as any;
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found.' });
      return;
    }

    let questions = [];
    try {
      questions = JSON.parse(quiz.questions_json);
    } catch (e) {
      questions = [];
    }

    let correctCount = 0;
    questions.forEach((q: any, idx: number) => {
      let ans = answers ? (Array.isArray(answers) ? (answers.find((a: any) => a.questionIndex === idx)?.selectedOption) : answers[idx]) : undefined;
      if (ans === q.correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length || 1;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= (quiz.passing_score || 70) ? 1 : 0;

    const attemptId = uuidv4();
    const now = new Date().toISOString();
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(userId) as any;

    db.prepare(`
      INSERT INTO quiz_attempts (id, quiz_id, student_id, user_id, score, total_questions, passed, attempted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(attemptId, quiz_id, student ? student.id : userId, userId, scorePercentage, totalQuestions, passed, now);

    res.json({
      success: true,
      result: {
        scorePercentage,
        correctCount,
        totalQuestions,
        passed: passed === 1,
        passingScore: quiz.passing_score || 70,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to submit quiz.' });
  }
});

// 6. GET /api/students/my-batches (Learning Workspace & Modules)
studentRouter.get('/my-batches', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(userId) as any;
    const studentId = student ? student.id : userId;

    // Check if student has accepted offers and auto-enroll them in matching active batches
    const acceptedOffers = db.prepare(`
      SELECT o.* FROM offer_letters o
      WHERE (o.user_id = ? OR o.student_id = ?) AND o.status = 'Accepted'
    `).all(userId, studentId) as any[];

    for (const offer of acceptedOffers) {
      const matchBatch = db.prepare(`
        SELECT * FROM batches 
        WHERE program_id = ? OR title LIKE ?
        ORDER BY created_at DESC LIMIT 1
      `).get(offer.internship_id, `%${offer.internship_title}%`) as any;

      if (matchBatch) {
        const existingEnrollment = db.prepare(`
          SELECT id FROM batch_enrollments 
          WHERE batch_id = ? AND (user_id = ? OR student_id = ?)
        `).get(matchBatch.id, userId, studentId);

        if (!existingEnrollment) {
          db.prepare(`
            INSERT INTO batch_enrollments (
              id, batch_id, student_id, user_id, progress_percent, completed_modules, task_submissions,
              status, certificate_issued, lor_issued, enrolled_at
            ) VALUES (?, ?, ?, ?, 0, '[]', '[]', 'Enrolled', 0, 0, ?)
          `).run(uuidv4(), matchBatch.id, studentId, userId, new Date().toISOString());

          db.prepare('UPDATE batches SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(matchBatch.id);
        }
      }
    }

    // Auto-enroll in default active batch if none exists so student immediately has learning modules
    const enrolledCount = (db.prepare('SELECT COUNT(*) as count FROM batch_enrollments WHERE user_id = ?').get(userId) as any).count;
    if (enrolledCount === 0) {
      const defaultBatch = db.prepare("SELECT * FROM batches WHERE status = 'Active' ORDER BY created_at ASC LIMIT 1").get() as any;
      if (defaultBatch) {
        db.prepare(`
          INSERT INTO batch_enrollments (
            id, batch_id, student_id, user_id, progress_percent, completed_modules, task_submissions,
            status, certificate_issued, lor_issued, enrolled_at
          ) VALUES (?, ?, ?, ?, 0, '[]', '[]', 'Enrolled', 0, 0, ?)
        `).run(uuidv4(), defaultBatch.id, studentId, userId, new Date().toISOString());

        db.prepare('UPDATE batches SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(defaultBatch.id);
      }
    }

    const enrollments = db.prepare(`
      SELECT be.*, be.id as enrollment_id, b.id as batch_id, b.batch_code, b.title as batch_title, b.start_date, b.end_date, b.duration_weeks,
             b.instructor_name, b.instructor_email, b.curriculum_modules, b.status as batch_status
      FROM batch_enrollments be
      JOIN batches b ON be.batch_id = b.id
      WHERE be.user_id = ? OR be.student_id = ?
      ORDER BY be.enrolled_at DESC
    `).all(userId, studentId);

    const nowTime = Date.now();
    const formatted = enrollments.map((e: any) => {
      let rawModules: any[] = [];
      try {
        rawModules = e.curriculum_modules ? JSON.parse(e.curriculum_modules) : [];
      } catch (err) {
        rawModules = [];
      }
      let completedMods: string[] = [];
      try {
        completedMods = e.completed_modules ? JSON.parse(e.completed_modules) : [];
      } catch (err) {
        completedMods = [];
      }
      let taskSubs: any[] = [];
      try {
        taskSubs = e.task_submissions ? JSON.parse(e.task_submissions) : [];
      } catch (err) {
        taskSubs = [];
      }

      // Calculate elapsed weeks from start_date or enrolled_at
      const refDate = new Date(e.start_date || e.enrolled_at || nowTime);
      const diffMs = Math.max(0, nowTime - refDate.getTime());
      const weeksElapsed = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
      const isAdminUnlocked = Boolean(e.admin_unlocked);

      const processedModules = rawModules.map((m: any, idx: number) => {
        const modId = m.id || `mod-${m.module_no || idx + 1}`;
        const modWeek = Number(m.week || m.module_no || idx + 1);
        const isCompleted = completedMods.includes(modId) || completedMods.includes(String(m.module_no || idx + 1));
        const isUnlocked = isAdminUnlocked || modWeek <= weeksElapsed || isCompleted;

        let daysUntilUnlock = 0;
        if (!isUnlocked) {
          const unlockTime = refDate.getTime() + (modWeek - 1) * 7 * 24 * 60 * 60 * 1000;
          daysUntilUnlock = Math.max(1, Math.ceil((unlockTime - nowTime) / (24 * 60 * 60 * 1000)));
        }

        return {
          ...m,
          id: modId,
          module_no: m.module_no || idx + 1,
          week: modWeek,
          is_unlocked: isUnlocked,
          is_completed: isCompleted,
          days_until_unlock: daysUntilUnlock,
        };
      });

      return {
        ...e,
        title: e.batch_title || e.title,
        current_week: weeksElapsed,
        admin_unlocked: isAdminUnlocked,
        curriculum_modules: processedModules,
        modules: processedModules,
        completed_modules: completedMods,
        task_submissions: taskSubs,
      };
    });

    res.json({ success: true, batches: formatted });
  } catch (error: any) {
    console.error('[GET STUDENT BATCHES ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrolled batches.' });
  }
});

// 7. POST /api/students/batches/:batchId/complete-module
studentRouter.post('/batches/:batchId/complete-module', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { batchId } = req.params;
    const { moduleId, taskSubmission, quizScore } = req.body;

    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(userId) as any;
    const studentId = student ? student.id : userId;

    const enrollment = db.prepare(`
      SELECT * FROM batch_enrollments 
      WHERE (batch_id = ? OR id = ?) AND (user_id = ? OR student_id = ?)
    `).get(batchId, batchId, userId, studentId) as any;

    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment record not found for this batch.' });
      return;
    }

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(enrollment.batch_id) as any;
    const rawModules = batch && batch.curriculum_modules ? JSON.parse(batch.curriculum_modules) : [];
    const totalModules = Math.max(rawModules.length, 1);

    // Verify weekly unlock status unless admin overridden
    const nowTime = Date.now();
    const refDate = new Date(batch?.start_date || enrollment.enrolled_at || nowTime);
    const weeksElapsed = Math.floor(Math.max(0, nowTime - refDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const isAdminUnlocked = Boolean(enrollment.admin_unlocked);

    const targetMod = rawModules.find((m: any, idx: number) => (m.id || `mod-${m.module_no || idx + 1}`) === moduleId || String(m.module_no || idx + 1) === String(moduleId));
    if (targetMod) {
      const modWeek = Number(targetMod.week || targetMod.module_no || 1);
      if (!isAdminUnlocked && modWeek > weeksElapsed) {
        res.status(400).json({
          success: false,
          message: `This module unlocks in Week ${modWeek}. Please wait for its scheduled release or contact admin.`,
        });
        return;
      }
    }

    let completedModules: string[] = [];
    try {
      completedModules = JSON.parse(enrollment.completed_modules || '[]');
    } catch (e) {
      completedModules = [];
    }

    if (moduleId && !completedModules.includes(moduleId)) {
      completedModules.push(moduleId);
    }

    let taskSubs = [];
    try {
      taskSubs = JSON.parse(enrollment.task_submissions || '[]');
    } catch (e) {
      taskSubs = [];
    }

    if (taskSubmission) {
      taskSubs.push({
        module_id: moduleId,
        submission: taskSubmission,
        submitted_at: new Date().toISOString(),
        score: quizScore || 100,
      });
    }

    const progressPercent = Math.min(100, Math.round((completedModules.length / totalModules) * 100));
    const isCompleted = progressPercent === 100;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE batch_enrollments
      SET completed_modules = ?,
          task_submissions = ?,
          progress_percent = ?,
          status = ?,
          completed_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(completedModules),
      JSON.stringify(taskSubs),
      progressPercent,
      isCompleted ? 'Completed' : 'In Progress',
      isCompleted ? now : enrollment.completed_at,
      enrollment.id
    );

    res.json({
      success: true,
      message: isCompleted
        ? '🎉 Congratulations! You have completed all curriculum modules for this batch! Your completion has been reported to the Admin for Certificate & LOR issuance.'
        : `Module completed! Overall Progress: ${progressPercent}%`,
      progress_percent: progressPercent,
      completed_modules: completedModules,
      is_completed: isCompleted,
    });
  } catch (error: any) {
    console.error('[COMPLETE MODULE ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to update module completion.' });
  }
});

// 8. GET /api/students/my-documents
studentRouter.get('/my-documents', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(userId) as any;
    const studentId = student ? student.id : userId;

    const offers = db.prepare(`
      SELECT o.*, i.title as internship_title
      FROM offer_letters o
      LEFT JOIN internships i ON o.internship_id = i.id
      WHERE o.user_id = ? OR o.student_id = ?
      ORDER BY o.issued_at DESC
    `).all(userId, studentId);

    const certificates = db.prepare(`
      SELECT * FROM certificates
      WHERE user_id = ? OR student_id = ?
      ORDER BY issued_at DESC
    `).all(userId, studentId);

    const lors = db.prepare(`
      SELECT * FROM lors
      WHERE user_id = ? OR student_id = ?
      ORDER BY issued_at DESC
    `).all(userId, studentId);

    const payments = db.prepare(`
      SELECT * FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    res.json({
      success: true,
      documents: {
        offers,
        certificates,
        lors,
        payments,
      },
    });
  } catch (error: any) {
    console.error('[GET STUDENT DOCUMENTS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student documents.' });
  }
});
