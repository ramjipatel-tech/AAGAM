import express, { Request, Response } from 'express';
import { db } from '../db/database';
import { recordAuditLog } from '../services/auditService';

export const verificationRouter = express.Router();

function verifyDocument(rawId: string, res: Response) {
  if (!rawId || !rawId.trim()) {
    res.status(400).json({ success: false, message: 'Document or Application ID is required.' });
    return;
  }

  const queryTerm = rawId.trim();
  const upperQuery = queryTerm.toUpperCase();

  // 1. Check Certificates (e.g. AAGAM-CERT-2026-000001)
  const cert = db.prepare(`
    SELECT c.*,
           COALESCE(c.photo_url, s.photo_url, u.avatar_url) as photo_url,
           COALESCE(c.roll_no, s.roll_no, s.registration_no) as roll_no,
           COALESCE(c.branch, s.branch, s.course) as branch
    FROM certificates c
    LEFT JOIN students s ON c.student_id = s.id OR c.user_id = s.user_id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE UPPER(c.certificate_id) = ? OR UPPER(c.id) = ?
  `).get(upperQuery, upperQuery) as any;

  if (cert) {
    recordAuditLog(null, 'PUBLIC_DOCUMENT_VERIFIED', 'certificates', cert.certificate_id, { queryId: queryTerm });
    res.json({
      success: true,
      isVerified: true,
      document: {
        documentType: 'Certificate of Completion',
        documentId: cert.certificate_id,
        certificate_id: cert.certificate_id,
        studentName: cert.student_name,
        student_name: cert.student_name,
        collegeName: cert.college_name,
        college_name: cert.college_name,
        programTitle: cert.program_title,
        program_title: cert.program_title,
        duration: cert.duration,
        issueDate: cert.issue_date,
        issue_date: cert.issue_date,
        gradeOrRemarks: cert.grade_or_remarks,
        grade_or_remarks: cert.grade_or_remarks,
        signatories: `${cert.signatory_ceo} & ${cert.signatory_hr}`,
        signatory_ceo: cert.signatory_ceo,
        signatory_hr: cert.signatory_hr,
        status: cert.status,
        isValid: cert.status === 'Valid',
        organization: 'AAGAM Digital Technology',
        tagline: 'Learn • Build • Innovate',
        verificationUrl: `/verify?id=${cert.certificate_id}`,
        qr_code_data: cert.qr_code_data,
        photo_url: cert.photo_url,
        photoUrl: cert.photo_url,
        roll_no: cert.roll_no,
        rollNo: cert.roll_no,
        branch: cert.branch,
        start_date: cert.start_date,
        end_date: cert.end_date,
        instructor_name: cert.instructor_name,
      },
    });
    return;
  }

  // 2. Check LORs (e.g. AAGAM-LOR-2026-000001)
  const lor = db.prepare('SELECT * FROM lors WHERE UPPER(lor_id) = ? OR UPPER(id) = ?').get(upperQuery, upperQuery) as any;
  if (lor) {
    recordAuditLog(null, 'PUBLIC_DOCUMENT_VERIFIED', 'lors', lor.lor_id, { queryId: queryTerm });
    res.json({
      success: true,
      isVerified: true,
      document: {
        documentType: 'Letter of Recommendation (LOR)',
        documentId: lor.lor_id,
        studentName: lor.student_name,
        collegeName: lor.college_name,
        programTitle: lor.internship_title,
        duration: lor.duration,
        issueDate: lor.issued_at.split('T')[0],
        performanceRating: lor.performance_rating,
        recommendationSummary: lor.recommendation_body,
        signatories: 'Ayush Raj (CEO) & Akash Verma (HR)',
        status: lor.status,
        isValid: lor.status === 'Valid',
        organization: 'AAGAM Digital Technology',
        tagline: 'Learn • Build • Innovate',
        verificationUrl: `/verify?id=${lor.lor_id}`,
      },
    });
    return;
  }

  // 3. Check Offer Letters (e.g. AAGAM-OFFER-2026-000001)
  const offer = db.prepare('SELECT * FROM offer_letters WHERE UPPER(offer_id) = ? OR UPPER(id) = ?').get(upperQuery, upperQuery) as any;
  if (offer) {
    recordAuditLog(null, 'PUBLIC_DOCUMENT_VERIFIED', 'offer_letters', offer.offer_id, { queryId: queryTerm });
    res.json({
      success: true,
      isVerified: true,
      document: {
        documentType: 'Official Internship Offer Letter',
        documentId: offer.offer_id,
        studentName: offer.student_name,
        collegeName: offer.college_name,
        programTitle: offer.internship_title,
        duration: offer.duration,
        issueDate: offer.issued_at.split('T')[0],
        startDate: offer.start_date,
        endDate: offer.end_date,
        stipendFeeText: offer.stipend_fee_text,
        payableAmount: offer.payable_amount,
        status: offer.status,
        isValid: offer.status === 'Issued' || offer.status === 'Accepted',
        acceptUrl: `/?view=accept-offer&offerId=${offer.offer_id}`,
        organization: 'AAGAM Digital Technology',
        tagline: 'Learn • Build • Innovate',
        verificationUrl: `/verify?id=${offer.offer_id}`,
      },
    });
    return;
  }

  // 4. Check Internship Applications (e.g. AAGAM-INT-2026-000014)
  const app = db.prepare(`
    SELECT a.*, 
           i.title as internship_title, i.duration as internship_duration, i.mode as internship_mode,
           o.offer_id, o.id as offer_letter_id, o.status as offer_status, o.issued_at as offer_issued_at,
           o.start_date as offer_start_date, o.end_date as offer_end_date,
           u.email_verified, u.is_active as user_active
    FROM internship_applications a
    LEFT JOIN internships i ON a.internship_id = i.id
    LEFT JOIN offer_letters o ON a.id = o.application_id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE UPPER(a.application_no) = ? OR UPPER(a.id) = ?
  `).get(upperQuery, upperQuery) as any;

  if (app) {
    recordAuditLog(null, 'PUBLIC_APPLICATION_TRACKED', 'internship_applications', app.application_no, { queryId: queryTerm });

    // Build timeline milestones
    const isSubmitted = true;
    const isUnderReviewOrBeyond = app.status !== 'Submitted';
    const isOfferGenerated = !!app.offer_id || app.status === 'Offer Generated' || app.status === 'Offer Accepted';
    const isOfferAccepted = app.offer_status === 'Accepted' || app.status === 'Offer Accepted';
    const isCredentialsProvisioned = app.user_active === 1 && isOfferAccepted;

    const timeline = [
      {
        step: 1,
        title: 'Application Submitted',
        status: 'Completed',
        timestamp: app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified',
        description: `Application received under ID ${app.application_no}.`,
      },
      {
        step: 2,
        title: 'HR & Academic Review (SLA ≤ 48h)',
        status: isOfferGenerated || isOfferAccepted ? 'Completed' : isUnderReviewOrBeyond ? 'In Progress' : 'In Progress',
        timestamp: isOfferGenerated ? 'Review Completed' : 'Under 48h SLA Review',
        description: app.admin_feedback || 'Academic credentials, NOC status, and domain alignment evaluated by HR Head Akash Verma.',
      },
      {
        step: 3,
        title: 'Offer Letter Issuance',
        status: isOfferGenerated || isOfferAccepted ? 'Completed' : 'Pending',
        timestamp: app.offer_issued_at ? new Date(app.offer_issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Awaiting HR Evaluation',
        description: app.offer_id ? `Offer Letter ${app.offer_id} issued.` : 'Official offer letter will be generated upon profile selection.',
        offerId: app.offer_id,
        acceptUrl: app.offer_id ? `/?view=accept-offer&offerId=${app.offer_id}` : null,
      },
      {
        step: 4,
        title: 'Offer Acceptance & Onboarding',
        status: isOfferAccepted ? 'Completed' : isOfferGenerated ? 'Action Required' : 'Upcoming',
        timestamp: isOfferAccepted ? 'Accepted & Confirmed' : isOfferGenerated ? 'Pending Candidate Acceptance' : 'Upcoming',
        description: isOfferAccepted ? 'Offer terms accepted and enrollment confirmed.' : 'Candidate to review and digitally accept the offer letter.',
      },
      {
        step: 5,
        title: 'Student Portal Credentials & Mentorship',
        status: isCredentialsProvisioned ? 'Completed' : isOfferAccepted ? 'Provisioning (≤ 2 Hours)' : 'Upcoming',
        timestamp: isCredentialsProvisioned ? 'Active Access' : 'Post-Acceptance SLA',
        description: 'Dedicated student portal access, live project assignments, and mentor allocation.',
      },
    ];

    res.json({
      success: true,
      isVerified: true,
      document: {
        documentType: 'Internship Application',
        documentId: app.application_no,
        applicationNo: app.application_no,
        studentName: app.student_name,
        studentEmail: app.student_email,
        studentPhone: app.student_phone,
        collegeName: app.college_name,
        course: app.course,
        semesterYear: app.semester_year,
        rollNo: app.roll_no,
        programTitle: app.internship_title || 'Software Engineering Internship',
        duration: app.internship_duration || '3 Months',
        mode: app.internship_mode || 'Remote',
        status: app.status,
        isValid: true,
        submittedAt: app.submitted_at,
        reviewNotes: app.review_notes,
        adminFeedback: app.admin_feedback,
        offerId: app.offer_id || null,
        offerStatus: app.offer_status || null,
        acceptUrl: app.offer_id ? `/?view=accept-offer&offerId=${app.offer_id}` : null,
        timeline,
        organization: 'AAGAM Digital Technology',
        tagline: 'Learn • Build • Innovate',
        verificationUrl: `/verify?id=${app.application_no}`,
      },
    });
    return;
  }

  // 5. Check Job Applications
  const jobApp = db.prepare(`
    SELECT ja.*, j.title as job_title, j.department, j.location, j.role_type
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE UPPER(ja.id) = ? OR UPPER(ja.applicant_email) = ?
  `).get(upperQuery, queryTerm.toLowerCase()) as any;

  if (jobApp) {
    recordAuditLog(null, 'PUBLIC_JOB_APPLICATION_TRACKED', 'job_applications', jobApp.id, { queryId: queryTerm });
    res.json({
      success: true,
      isVerified: true,
      document: {
        documentType: 'Corporate Recruitment Application',
        documentId: jobApp.id,
        studentName: jobApp.applicant_name,
        studentEmail: jobApp.applicant_email,
        studentPhone: jobApp.applicant_phone,
        programTitle: jobApp.job_title,
        status: jobApp.status,
        isValid: true,
        submittedAt: jobApp.applied_at,
        organization: 'AAGAM Digital Technology',
        tagline: 'Learn • Build • Innovate',
        verificationUrl: `/verify?id=${jobApp.id}`,
      },
    });
    return;
  }

  // Not found
  recordAuditLog(null, 'PUBLIC_DOCUMENT_NOT_FOUND', 'unknown', queryTerm, { queryId: queryTerm });
  res.json({
    success: false,
    isVerified: false,
    message: `No application, certificate, or offer letter found matching ID "${queryTerm}". Please verify the number and try again.`,
    status: 'INVALID / NOT FOUND',
  });
}

// 1. GET /api/verification/lookup?id=AAGAM-...
verificationRouter.get('/lookup', (req: Request, res: Response) => {
  try {
    const rawId = req.query.id as string;
    verifyDocument(rawId, res);
  } catch (error: any) {
    console.error('[VERIFY LOOKUP ERROR]', error);
    res.status(500).json({ success: false, message: 'Verification lookup error.' });
  }
});

// 2. GET /api/verification/:id
verificationRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const rawId = String(req.params.id);
    verifyDocument(rawId, res);
  } catch (error: any) {
    console.error('[VERIFY PARAM ERROR]', error);
    res.status(500).json({ success: false, message: 'Verification lookup error.' });
  }
});

