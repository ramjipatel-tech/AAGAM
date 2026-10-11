/**
 * AAGAM DIGITAL TECHNOLOGY - Premium Enterprise HTML Email Template System
 * Designed for cross-client responsiveness (Gmail, Apple Mail, Outlook, Mobile).
 * Brand Identity: "Learn • Build • Innovate"
 * Leadership: Ayush Raj (CEO), Akash Verma (Head of HR)
 */

export interface EmailTemplateDefinition {
  key: string;
  name: string;
  subject: string;
  categoryBadge: string;
  badgeColor: string; // Hex color for badge
  headline: string;
  subheadline: string;
  bodyContentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  highlightData?: Array<{ label: string; value: string }>;
  securityNote?: string;
  variables: string;
}

/**
 * Base layout wrapper that wraps dynamic email content into an ultra-premium,
 * responsive corporate layout with AAGAM branding, top gradient bar, card styling,
 * CTA buttons, and verified leadership sign-offs.
 */
export function buildCorporateEmailHtml(params: {
  categoryBadge: string;
  badgeColor?: string;
  headline: string;
  subheadline?: string;
  studentName?: string;
  mainMessageHtml: string;
  highlightData?: Array<{ label: string; value: string }>;
  ctaText?: string;
  ctaUrl?: string;
  securityNote?: string;
}): string {
  const badgeColor = params.badgeColor || '#0284c7';
  const highlightRows = params.highlightData && params.highlightData.length > 0
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; border-collapse: separate;">
        <tbody>
          ${params.highlightData
            .map(
              (item, idx) => `
            <tr style="border-bottom: ${idx === params.highlightData!.length - 1 ? 'none' : '1px solid #e2e8f0'};">
              <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 38%; background-color: #f1f5f9; border-bottom: ${idx === params.highlightData!.length - 1 ? 'none' : '1px solid #e2e8f0'};">
                ${item.label}
              </td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #0f172a; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: ${idx === params.highlightData!.length - 1 ? 'none' : '1px solid #e2e8f0'};">
                ${item.value}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
    : '';

  const ctaButtonHtml = params.ctaText && params.ctaUrl
    ? `
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${params.ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 10px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); text-transform: uppercase;">
          ${params.ctaText} &rarr;
        </a>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">
          If the button does not work, visit: <a href="${params.ctaUrl}" style="color: #0284c7; word-break: break-all;">${params.ctaUrl}</a>
        </p>
      </div>
    `
    : '';

  const securityBoxHtml = params.securityNote
    ? `
      <div style="background-color: #eff6ff; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
          <strong>Security & Compliance Notice:</strong> ${params.securityNote}
        </p>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${params.headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 35px rgba(0,0,0,0.35); border: 1px solid #1e293b;">
          
          <!-- Top Gradient Accent Bar -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #0284c7 0%, #38bdf8 35%, #f59e0b 70%, #0284c7 100%);"></td>
          </tr>

          <!-- Corporate Brand Header -->
          <tr>
            <td style="background-color: #07101e; padding: 28px 32px; text-align: center; border-bottom: 1px solid #1e293b;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-size: 24px; font-weight: 900; letter-spacing: 1.5px; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
                      AAGAM <span style="color: #38bdf8;">DIGITAL</span> TECHNOLOGY
                    </div>
                    <div style="display: inline-block; margin-top: 6px; padding: 4px 14px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px;">
                      <span style="font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px;">
                        Learn &bull; Build &bull; Innovate
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; color: #334155; font-size: 14px; line-height: 1.6;">
              
              <!-- Category Status Pill -->
              <div style="margin-bottom: 16px;">
                <span style="display: inline-block; padding: 4px 12px; background-color: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}40; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">
                  &bull; ${params.categoryBadge}
                </span>
              </div>

              <!-- Main Title -->
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3; font-family: 'Segoe UI', Arial, sans-serif;">
                ${params.headline}
              </h1>

              ${params.subheadline ? `<p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b;">${params.subheadline}</p>` : ''}

              <!-- Greeting -->
              ${params.studentName ? `<p style="margin: 16px 0 12px 0; font-size: 14px; color: #1e293b;">Dear <strong>${params.studentName}</strong>,</p>` : ''}

              <!-- Main Message -->
              <div style="font-size: 14px; color: #334155; line-height: 1.65;">
                ${params.mainMessageHtml}
              </div>

              <!-- Highlights / Table -->
              ${highlightRows}

              <!-- CTA Button -->
              ${ctaButtonHtml}

              <!-- Security Box -->
              ${securityBoxHtml}

              <!-- Signature Section -->
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: top;">
                      <p style="margin: 0; font-size: 12px; color: #64748b;">Sincerely,</p>
                      <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #0f172a;">AAGAM Engineering & HR Operations</p>
                      
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                        <tr>
                          <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                            <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Ayush Raj</div>
                            <div style="font-size: 11px; color: #64748b;">Chief Executive Officer</div>
                            <div style="font-size: 10px; color: #0284c7; margin-top: 2px;">AAGAM Digital Technology</div>
                          </td>
                          <td style="width: 50%; vertical-align: top; padding-left: 10px; border-left: 1px solid #e2e8f0;">
                            <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Akash Verma</div>
                            <div style="font-size: 11px; color: #64748b;">Head of HR & Talent Acquisition</div>
                            <div style="font-size: 10px; color: #0284c7; margin-top: 2px;">Phone: +91 9693335499</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Corporate Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #0f172a;">
                AAGAM DIGITAL TECHNOLOGY PRIVATE LIMITED &bull; Learn &bull; Build &bull; Innovate
              </p>
              <p style="margin: 0 0 8px 0;">
                Registered Office: Patna, Bihar, India &bull; Support: <a href="mailto:AAGAMDigitaltech@gmail.com" style="color: #0284c7; text-decoration: none;">AAGAMDigitaltech@gmail.com</a>
              </p>
              <p style="margin: 0 0 12px 0;">
                Helpline: +91 9693335499 &bull; +91 7667204026 &bull; +91 9142363927
              </p>
              <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 8px;">
                This is an automated official communication from AAGAM Digital Technology Secure Portal. All documents issued carry digital QR verification.<br/>
                <span style="display:inline-block; margin-top:4px; font-weight:600; color:#64748b;">Developed by Zyvionex Technologies</span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Standard templates catalogue
 */
export const SYSTEM_EMAIL_TEMPLATES: Record<string, EmailTemplateDefinition> = {
  otp_verification: {
    key: 'otp_verification',
    name: 'Email OTP Verification',
    subject: 'Your AAGAM Verification Code: {{otp}}',
    categoryBadge: 'Security Verification',
    badgeColor: '#0284c7',
    headline: 'One-Time Security Verification Code',
    subheadline: 'Enter this 6-digit code to verify your identity and proceed.',
    bodyContentHtml: `
      <p>You recently initiated an authentication or application action on <strong>AAGAM Digital Technology</strong> portal.</p>
      <div style="text-align: center; margin: 28px 0; padding: 20px; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px;">
        <div style="font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your One-Time Password (OTP)</div>
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #166534; font-family: monospace;">{{otp}}</div>
        <div style="font-size: 11px; color: #65a30d; margin-top: 6px;">Valid for 10 minutes &bull; Do not disclose to anyone</div>
      </div>
      <p style="font-size: 13px; color: #64748b;">If you did not request this verification code, please ignore this email or contact support immediately.</p>
    `,
    securityNote: 'AAGAM representatives will never ask for your confidential OTP or passwords over phone calls or SMS.',
    variables: '{{otp}}, {{student_name}}',
  },

  application_submitted: {
    key: 'application_submitted',
    name: 'Application Submitted Confirmation',
    subject: 'Application Received: {{registration_no}} | AAGAM Digital Technology',
    categoryBadge: 'Application Intake Acknowledged',
    badgeColor: '#0284c7',
    headline: 'Internship Application Successfully Submitted',
    subheadline: 'Your profile is now queued for evaluation under our 48-Hour Review SLA.',
    bodyContentHtml: `
      <p>Thank you for applying to <strong>AAGAM Digital Technology</strong>. We have successfully received your application along with your academic details and documents.</p>
      <p>Our review team led by <strong>HR Akash Verma</strong> will verify your credentials, NOC/College ID, and project suitability.</p>
    `,
    highlightData: [
      { label: 'Application ID', value: '{{registration_no}}' },
      { label: 'Candidate Name', value: '{{student_name}}' },
      { label: 'Applied Domain', value: '{{internship_name}}' },
      { label: 'Status', value: 'Submitted &bull; Under HR Review' },
      { label: 'Review SLA', value: 'Within 24 to 48 Hours' },
    ],
    ctaText: 'Track Application Status Online',
    ctaUrl: 'http://127.0.0.1:5173/verify?id={{registration_no}}',
    securityNote: 'Keep your Application ID safe. You can track your real-time review status, offer letter generation, and onboarding milestones anytime on our official verification portal.',
    variables: '{{student_name}}, {{registration_no}}, {{internship_name}}, {{track_url}}',
  },

  offer_generated: {
    key: 'offer_generated',
    name: 'Offer Letter Issued',
    subject: '🎉 Congratulations! Internship Offer Letter Generated: {{offer_id}}',
    categoryBadge: 'Official Offer of Internship',
    badgeColor: '#16a34a',
    headline: 'Congratulations! You Have Been Selected',
    subheadline: 'Official Offer Letter issued by AAGAM Digital Technology Executive Board.',
    bodyContentHtml: `
      <p>We are thrilled to inform you that based on your academic profile and application review, you have been <strong>SELECTED</strong> for the <strong>{{internship_name}}</strong> program at AAGAM Digital Technology!</p>
      <p>Your official verifiable Offer Letter has been prepared and registered in our central ledger. Please review the details below and click the button to accept the offer and initiate onboarding.</p>
    `,
    highlightData: [
      { label: 'Offer Letter ID', value: '{{offer_id}}' },
      { label: 'Candidate Name', value: '{{student_name}}' },
      { label: 'Program Domain', value: '{{internship_name}}' },
      { label: 'Commencement Date', value: '{{start_date}}' },
      { label: 'Offer Validity', value: '7 Days from Issuance' },
    ],
    ctaText: 'Review & Accept Offer Letter',
    ctaUrl: 'http://127.0.0.1:5173/?view=accept-offer&offerId={{offer_id}}',
    securityNote: 'This offer letter is digitally verifiable via encrypted QR code. Acceptance confirms your commitment to engineering sprints and non-disclosure standards.',
    variables: '{{student_name}}, {{offer_id}}, {{internship_name}}, {{start_date}}, {{accept_url}}',
  },

  payment_success: {
    key: 'payment_success',
    name: 'Payment & Offer Acceptance Confirmation',
    subject: 'Payment Confirmed & Offer Accepted: {{offer_id}}',
    categoryBadge: 'Onboarding Activated',
    badgeColor: '#16a34a',
    headline: 'Offer Accepted & Enrollment Confirmed',
    subheadline: 'Your payment was verified and student workspace provisioning is in progress.',
    bodyContentHtml: `
      <p>We have successfully verified your payment and confirmed your formal acceptance of Offer <strong>{{offer_id}}</strong>.</p>
      <p>Your dedicated Student Portal workspace, task board, and project repository access are being configured.</p>
    `,
    highlightData: [
      { label: 'Offer ID', value: '{{offer_id}}' },
      { label: 'Candidate Name', value: '{{student_name}}' },
      { label: 'Amount Paid', value: '₹{{amount}}' },
      { label: 'Transaction ID', value: '{{payment_id}}' },
      { label: 'Provisioning SLA', value: 'Within 2 Hours' },
    ],
    ctaText: 'Go to Student Portal',
    ctaUrl: 'http://127.0.0.1:5173/portal/student',
    securityNote: 'Your official credentials and mentor assignment notification will arrive shortly via email.',
    variables: '{{student_name}}, {{offer_id}}, {{amount}}, {{payment_id}}',
  },

  credentials_provisioned: {
    key: 'credentials_provisioned',
    name: 'Student Portal Credentials Dispatched',
    subject: 'Your AAGAM Student Portal Access Credentials: {{email}}',
    categoryBadge: 'Workspace Provisioned',
    badgeColor: '#9333ea',
    headline: 'Welcome to AAGAM Student Engineering Portal',
    subheadline: 'Your account is ready. Log in to access project milestones and submit tasks.',
    bodyContentHtml: `
      <p>Your personal student workspace has been activated. You now have full access to your assigned projects, coding quizzes, task submissions, and digital certificates.</p>
    `,
    highlightData: [
      { label: 'Portal URL', value: 'http://127.0.0.1:5173/portal/student' },
      { label: 'Login Email', value: '{{email}}' },
      { label: 'Temporary Password', value: '{{password}}' },
      { label: 'Registration No', value: '{{registration_no}}' },
    ],
    ctaText: 'Login to Student Portal',
    ctaUrl: 'http://127.0.0.1:5173/portal/student',
    securityNote: 'For security reasons, please update your password upon first login from your profile settings.',
    variables: '{{student_name}}, {{email}}, {{password}}, {{registration_no}}, {{login_url}}',
  },

  password_reset_request: {
    key: 'password_reset_request',
    name: 'Password Reset Verification',
    subject: 'Security Alert: Password Reset Requested for AAGAM Account',
    categoryBadge: 'Account Security',
    badgeColor: '#e11d48',
    headline: 'Password Reset Instructions',
    subheadline: 'A password reset request was initiated for your AAGAM Digital Technology account.',
    bodyContentHtml: `
      <p>We received a request to reset the password for your student portal account associated with <strong>{{email}}</strong>.</p>
      <div style="text-align: center; margin: 24px 0; padding: 18px; background-color: #fff1f2; border: 2px dashed #e11d48; border-radius: 12px;">
        <div style="font-size: 11px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your 6-Digit Password Reset OTP</div>
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #be123c; font-family: monospace;">{{otp}}</div>
        <div style="font-size: 11px; color: #e11d48; margin-top: 6px;">Valid for 15 minutes &bull; Never share with anyone</div>
      </div>
      <p>You can also click the secure one-click link below to reset your password directly:</p>
    `,
    ctaText: 'Reset My Password Now',
    ctaUrl: '{{reset_url}}',
    securityNote: 'If you did not request this password reset, your account is still secure. Please disregard this email or report to security@aagamdigitaltech.com.',
    variables: '{{student_name}}, {{email}}, {{otp}}, {{reset_url}}',
  },

  password_reset_success: {
    key: 'password_reset_success',
    name: 'Password Updated Confirmation',
    subject: 'Security Alert: Your AAGAM Account Password Was Changed',
    categoryBadge: 'Security Confirmation',
    badgeColor: '#16a34a',
    headline: 'Password Changed Successfully',
    subheadline: 'Your student account credentials have been updated.',
    bodyContentHtml: `
      <p>This is confirmation that the password for your AAGAM Student Portal account (<strong>{{email}}</strong>) was successfully changed on <strong>{{changed_at}}</strong>.</p>
      <p>You can now sign in using your new password or via instant OTP verification.</p>
    `,
    ctaText: 'Login to Student Portal',
    ctaUrl: 'http://127.0.0.1:5173/portal/student',
    securityNote: 'If you did not perform this change, please immediately reset your password or contact our emergency technical helpline.',
    variables: '{{student_name}}, {{email}}, {{changed_at}}',
  },

  certificate_issued: {
    key: 'certificate_issued',
    name: 'Certificate of Completion Issued',
    subject: '🎓 Official Certificate of Completion Issued: {{certificate_id}}',
    categoryBadge: 'Credential Conferred',
    badgeColor: '#f59e0b',
    headline: 'Certificate of Excellence & Completion',
    subheadline: 'Congratulations on completing your industry engineering tenure at AAGAM.',
    bodyContentHtml: `
      <p>On behalf of the leadership and technical mentors at <strong>AAGAM Digital Technology</strong>, congratulations on successfully completing your <strong>{{program_title}}</strong>!</p>
      <p>Your official verifiable Certificate has been registered with a tamper-proof QR code in our global ledger.</p>
    `,
    highlightData: [
      { label: 'Certificate ID', value: '{{certificate_id}}' },
      { label: 'Student Name', value: '{{student_name}}' },
      { label: 'Program Title', value: '{{program_title}}' },
      { label: 'Status', value: 'Valid &bull; Verifiable Worldwide' },
    ],
    ctaText: 'View & Verify Certificate',
    ctaUrl: 'http://127.0.0.1:5173/verify?id={{certificate_id}}',
    securityNote: 'You can attach this credential to your LinkedIn profile, resume, and share the verification link with prospective employers.',
    variables: '{{student_name}}, {{program_title}}, {{certificate_id}}, {{verify_url}}',
  },

  lor_issued: {
    key: 'lor_issued',
    name: 'Letter of Recommendation Issued',
    subject: 'Official Letter of Recommendation (LOR): {{lor_id}}',
    categoryBadge: 'Executive Recommendation',
    badgeColor: '#0284c7',
    headline: 'Letter of Recommendation Conferred',
    subheadline: 'Executive commendation signed by CEO Ayush Raj and Head of HR Akash Verma.',
    bodyContentHtml: `
      <p>We are pleased to confer your official Letter of Recommendation (LOR) celebrating your outstanding technical contributions during your tenure with us.</p>
    `,
    highlightData: [
      { label: 'LOR ID', value: '{{lor_id}}' },
      { label: 'Student Name', value: '{{student_name}}' },
      { label: 'Performance Rating', value: '{{rating}}' },
      { label: 'Status', value: 'Officially Endorsed' },
    ],
    ctaText: 'View & Verify LOR',
    ctaUrl: 'http://127.0.0.1:5173/verify?id={{lor_id}}',
    variables: '{{student_name}}, {{lor_id}}, {{rating}}, {{verify_url}}',
  },

  admin_login_otp: {
    key: 'admin_login_otp',
    name: 'Admin 2FA Security Code',
    subject: '🔐 Admin Portal Security OTP: {{otp}} - AAGAM Digital Technology',
    categoryBadge: 'Admin 2FA Security',
    badgeColor: '#dc2626',
    headline: 'Administrator 2-Factor Authentication',
    subheadline: 'A login request was initiated for the AAGAM Admin Control Center.',
    bodyContentHtml: `
      <p>Hello Administrator,</p>
      <p>A secure sign-in attempt was made for your administrative console account (<strong>{{email}}</strong>).</p>
      <div style="text-align: center; margin: 24px 0; padding: 18px; background-color: #fef2f2; border: 2px dashed #dc2626; border-radius: 12px;">
        <div style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your 6-Digit Admin 2FA Passcode</div>
        <div style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #b91c1c; font-family: monospace;">{{otp}}</div>
        <div style="font-size: 11px; color: #dc2626; margin-top: 6px;">Expires in 10 minutes &bull; Restricted to Authorized Staff Only</div>
      </div>
      <p style="font-size: 13px; color: #64748b;">If you did not initiate this login request, please verify your server security logs immediately.</p>
    `,
    securityNote: 'This OTP grants top-level administrative access to student registries, document generation, and financials. Never share this code.',
    variables: '{{email}}, {{otp}}',
  },

  teacher_welcome_credentials: {
    key: 'teacher_welcome_credentials',
    name: 'Instructor Portal Provisioning',
    subject: '👨‍🏫 Welcome to AAGAM Faculty: Your Instructor Portal Credentials',
    categoryBadge: 'Faculty Onboarding',
    badgeColor: '#7c3aed',
    headline: 'Faculty & Instructor Access Granted',
    subheadline: 'Your instructor account has been created on AAGAM Digital Technology.',
    bodyContentHtml: `
      <p>Dear <strong>{{instructor_name}}</strong>,</p>
      <p>Welcome to the instructional faculty at <strong>AAGAM Digital Technology</strong>. You have been appointed to oversee student cohorts, lecture delivery, and project evaluations.</p>
    `,
    highlightData: [
      { label: 'Portal Access URL', value: 'http://127.0.0.1:5173/portal/admin' },
      { label: 'Login Email', value: '{{email}}' },
      { label: 'Temporary Password', value: '{{temporary_password}}' },
      { label: 'Department / Role', value: '{{department}} &bull; {{designation}}' },
    ],
    ctaText: 'Sign In to Faculty Portal',
    ctaUrl: 'http://127.0.0.1:5173/portal/admin',
    securityNote: 'Please sign in and change your default password upon first access under your Profile settings.',
    variables: '{{instructor_name}}, {{email}}, {{temporary_password}}, {{department}}, {{designation}}',
  },
};
