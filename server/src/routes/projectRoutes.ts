import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { recordAuditLog } from '../services/auditService';
import { sendAutomatedEmail } from '../services/emailService';

export const projectRouter = express.Router();

// 1. GET /api/projects/my-projects (Student Portal)
projectRouter.get('/my-projects', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const assignments = db.prepare(`
      SELECT pa.id as assignment_id, pa.status as assignment_status, pa.assigned_at,
             p.id as project_id, p.title, p.department, p.technology, p.description,
             p.guidelines, p.deliverables, p.start_date, p.deadline,
             ps.id as submission_id, ps.github_url, ps.live_demo_url, ps.documentation_text,
             ps.student_notes, ps.staff_remarks, ps.status as submission_status, ps.submitted_at, ps.reviewed_at
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      LEFT JOIN project_submissions ps ON pa.id = ps.assignment_id
      WHERE pa.user_id = ?
      ORDER BY pa.assigned_at DESC
    `).all(userId);

    res.json({ success: true, projects: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load student projects.' });
  }
});

// 2. POST /api/projects/submit (Student Submits Project)
projectRouter.post('/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { assignment_id, project_id, github_url, live_demo_url, documentation_text, student_notes } = req.body;

    if (!assignment_id || !project_id || !github_url) {
      res.status(400).json({ success: false, message: 'Assignment ID, Project ID, and GitHub URL are required.' });
      return;
    }

    const assignment = db.prepare('SELECT * FROM project_assignments WHERE id = ? AND user_id = ?').get(assignment_id, userId) as any;
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found or unauthorized.' });
      return;
    }

    const submissionId = uuidv4();
    const now = new Date().toISOString();

    // Check if existing submission exists
    const existing = db.prepare('SELECT id FROM project_submissions WHERE assignment_id = ?').get(assignment_id) as any;

    if (existing) {
      db.prepare(`
        UPDATE project_submissions
        SET github_url = ?, live_demo_url = ?, documentation_text = ?, student_notes = ?, status = 'Submitted', submitted_at = ?
        WHERE id = ?
      `).run(github_url, live_demo_url || null, documentation_text || null, student_notes || null, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO project_submissions (
          id, assignment_id, project_id, student_id, user_id, github_url, live_demo_url, documentation_text, student_notes, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?)
      `).run(submissionId, assignment_id, project_id, assignment.student_id, userId, github_url, live_demo_url || null, documentation_text || null, student_notes || null, now);
    }

    // Update assignment status
    db.prepare('UPDATE project_assignments SET status = "Under Review" WHERE id = ?').run(assignment_id);

    recordAuditLog(req, 'PROJECT_SUBMITTED', 'project_submissions', assignment_id, { github_url, live_demo_url });

    res.json({
      success: true,
      message: 'Project submitted successfully! Your submission is now under review by the mentoring team.',
    });
  } catch (error: any) {
    console.error('[PROJECT SUBMIT ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to submit project.' });
  }
});

// 3. POST /api/projects/review (Staff/Admin Reviews Project)
projectRouter.post('/review', authenticateToken, requireRoles('admin', 'superadmin', 'staff'), async (req: Request, res: Response) => {
  try {
    const { submission_id, assignment_id, status, staff_remarks } = req.body;

    if (!assignment_id || !status) {
      res.status(400).json({ success: false, message: 'Assignment ID and review status are required.' });
      return;
    }

    const now = new Date().toISOString();

    if (submission_id) {
      db.prepare(`
        UPDATE project_submissions
        SET status = ?, staff_remarks = ?, reviewed_at = ?
        WHERE id = ?
      `).run(status, staff_remarks || null, now, submission_id);
    }

    const assignmentStatus = status === 'Approved' ? 'Completed' : status === 'Changes Required' ? 'Changes Required' : 'Under Review';
    db.prepare('UPDATE project_assignments SET status = ? WHERE id = ?').run(assignmentStatus, assignment_id);

    const assignment = db.prepare('SELECT user_id, project_id FROM project_assignments WHERE id = ?').get(assignment_id) as any;
    if (assignment) {
      const user = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(assignment.user_id) as any;
      const project = db.prepare('SELECT title FROM projects WHERE id = ?').get(assignment.project_id) as any;

      if (user) {
        await sendAutomatedEmail({
          to: user.email,
          templateKey: 'assignment',
          variables: {
            student_name: user.full_name,
            project_title: project?.title || 'Project',
            review_status: status,
            remarks: staff_remarks || 'Review completed by mentor.',
          },
          userId: assignment.user_id,
          notificationTitle: `Project Review: ${status}`,
          relatedId: assignment_id,
        });
      }
    }

    recordAuditLog(req, 'PROJECT_REVIEW_COMPLETED', 'project_assignments', assignment_id, { status, staff_remarks });

    res.json({ success: true, message: `Project marked as ${status}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to complete review.' });
  }
});

// 4. GET /api/projects/all (Admin / Staff overview)
projectRouter.get('/all', authenticateToken, requireRoles('admin', 'superadmin', 'staff'), (req: Request, res: Response) => {
  try {
    const submissions = db.prepare(`
      SELECT pa.id as assignment_id, pa.status as assignment_status, pa.assigned_at,
             p.title as project_title, p.technology,
             u.full_name as student_name, u.email as student_email,
             ps.id as submission_id, ps.github_url, ps.live_demo_url, ps.status as submission_status,
             ps.submitted_at, ps.staff_remarks
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      JOIN users u ON pa.user_id = u.id
      LEFT JOIN project_submissions ps ON pa.id = ps.assignment_id
      ORDER BY pa.assigned_at DESC
    `).all();

    res.json({ success: true, submissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch all projects.' });
  }
});
