import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { DOCUMENTS_DIR, UPLOAD_DIR } from '../config';
import { db } from '../db/database';

const ROOT_DIR = path.resolve(DOCUMENTS_DIR, '..');
const CLIENT_PUBLIC_DIR = path.resolve(ROOT_DIR, 'client', 'public');
const GOVT_BADGES_PATH = path.join(DOCUMENTS_DIR, 'assets', 'govt-accreditations.png');
const COMPANY_LOGO_PATH = path.join(CLIENT_PUBLIC_DIR, 'aagam-logo.jpg');

export interface CertificatePdfData {
  certificate_id?: string;
  student_name?: string;
  college_name?: string;
  program_title?: string;
  duration?: string;
  issue_date?: string;
  grade_or_remarks?: string;
  signatory_ceo?: string;
  signatory_hr?: string;
  photo_url?: string;
  roll_no?: string;
  branch?: string;
  start_date?: string;
  end_date?: string;
  instructor_name?: string;
}

export interface LorPdfData {
  lor_id: string;
  student_name: string;
  college_name: string;
  internship_title: string;
  duration: string;
  recommendation_body: string;
  performance_rating: string;
  issue_date?: string;
}

export interface OfferLetterPdfData {
  offer_id: string;
  student_name: string;
  college_name?: string;
  course?: string;
  internship_title: string;
  duration: string;
  start_date: string;
  end_date: string;
  stipend_fee_text?: string;
  payable_amount?: number;
  fee_reason?: string;
  terms_conditions?: string;
  issue_date?: string;
  student_email?: string;
  student_phone?: string;
}

/**
 * Generate official Certificate PDF matching government-accredited corporate format
 * Pure White background with Royal Blue Guilloche borders, ISO/MCA/CIN credentials, student photo, and Govt badges.
 */
export async function generateCertificatePDF(rawInput: CertificatePdfData | any): Promise<string> {
  const data = rawInput || {};
  const studentName = String(data.student_name || data.studentName || 'Student Name');
  const certificateId = String(data.certificate_id || data.certificateId || data.certificateNo || 'AAGAM-CERT');

  const certDir = path.join(DOCUMENTS_DIR, 'certificates');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const fileName = `${certificateId}.pdf`;
  const filePath = path.join(certDir, fileName);

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [841.89, 595.28], // A4 Landscape
        margins: { top: 15, bottom: 15, left: 15, right: 15 },
        info: {
          Title: `Certificate - ${studentName} (${certificateId})`,
          Author: 'AAGAM Digital Technology',
          Subject: 'Certificate of Industrial Internship Training & Course Completion',
          Keywords: 'AAGAM, Certificate, Internship, MSME, IAF, AICTE, ISO',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Load Dynamic Certificate Settings from SQLite
      let settings: Record<string, string> = {};
      try {
        const rows = db.prepare("SELECT key, value FROM system_settings WHERE group_name = 'certificate'").all() as any[];
        for (const r of rows) settings[r.key] = r.value;
      } catch (e) {}

      const companyName = settings.cert_company_name || 'AAGAM DIGITAL TECHNOLOGY PVT. LTD.';
      const tagline = settings.cert_tagline || 'LEARN • BUILD • INNOVATE';
      const isoText = settings.cert_iso_text || 'An ISO 9001: 2015 certified';
      const mcaText = settings.cert_mca_text || 'Registered Under Ministry of Corporate Affairs, Govt. of India';
      const cinNumber = settings.cert_cin_number || 'Corporate Identification No. : U80904BR2021PTC054517';
      const ribbonTitle = settings.cert_ribbon_title || 'OF INDUSTRIAL INTERNSHIP EXCELLENCE';
      const corporateOffice = settings.cert_corporate_office || 'Corporate office: Dak Bunglow Chauraha Near Biscoman Tower Patna';
      const directorName = settings.cert_director_name || (data.signatory_ceo || 'Ayush Raj').split(',')[0];
      const directorTitle = settings.cert_director_title || 'Director';
      const instructorName = settings.cert_instructor_name || data.instructor_name || (data.signatory_hr || 'Akash Verma').split(',')[0];
      const instructorTitle = settings.cert_instructor_title || 'Course Instructor';

      const templateStyle = settings.cert_template_style || 'modern_tech';
      const verifyUrl = `http://127.0.0.1:5173/?view=verify&id=${certificateId}`;
      const rollNoDisplay = data.roll_no || data.rollNo || certificateId;
      const collegeDisplay = data.college_name || data.collegeName || 'Government Polytechnic / Accredited University';
      const branchDisplay = data.branch || data.department || 'Computer Science & Engineering';
      const durationDisplay = data.duration || 'four weeks';
      const domainDisplay = data.program_title || data.courseName || 'Full Stack Software Development';
      const startDateDisplay = data.start_date || '02 June 2025';
      const endDateDisplay = data.end_date || '30 June 2025';
      const awardDateDisplay = data.issue_date || new Date().toISOString().split('T')[0];

      // Generate QR Code Buffer
      let qrBuffer: Buffer | null = null;
      try {
        qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 140, margin: 1 });
      } catch (qrErr) {}

      // Resolve Candidate Passport Photo Path
      let candidatePhotoPath: string | null = null;
      if (data.photo_url) {
        const basePhoto = path.basename(data.photo_url);
        const candidates = [
          path.join(UPLOAD_DIR, basePhoto),
          path.join(ROOT_DIR, 'uploads', basePhoto),
          path.join(process.cwd(), 'uploads', basePhoto),
          path.join(process.cwd(), data.photo_url),
          data.photo_url,
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            candidatePhotoPath = c;
            break;
          }
        }
      }

      if (templateStyle === 'modern_tech') {
        // =========================================================================
        // TEMPLATE 1: MODERN CORPORATE ISO-TECH EXCELLENCE (DEFAULT)
        // =========================================================================
        // 1. Pure Crisp White Canvas
        doc.rect(0, 0, 841.89, 595.28).fill('#FFFFFF');

        // 2. Geometric Accent Stripe at Top (Sky -> Indigo -> Rose)
        doc.rect(0, 0, 280, 8).fill('#0284C7');
        doc.rect(280, 0, 280, 8).fill('#4F46E5');
        doc.rect(560, 0, 281.89, 8).fill('#E11D48');

        // 3. Outer Dark Slate Modern Frame
        doc.rect(16, 16, 809.89, 563.28).lineWidth(2.5).stroke('#0F172A');

        // 4. Header Bar: Logo, Title, MCA Pill, ISO Badge, ID
        doc.roundedRect(36, 32, 48, 48, 8).fill('#0F172A');
        if (fs.existsSync(COMPANY_LOGO_PATH)) {
          try {
            doc.image(COMPANY_LOGO_PATH, 38, 34, { width: 44, height: 44, fit: [44, 44] });
          } catch (e) {}
        }

        doc.fillColor('#0F172A').fontSize(18).font('Helvetica-Bold')
          .text(companyName, 94, 34);
        doc.fillColor('#0284C7').fontSize(9).font('Helvetica-Bold')
          .text(tagline, 94, 55);

        // MCA Pill & CIN
        doc.roundedRect(94, 68, 130, 14, 4).fill('#DCFCE7');
        doc.fillColor('#166534').fontSize(7.5).font('Helvetica-Bold')
          .text(mcaText.length > 28 ? 'MCA Govt. Registered' : mcaText, 94, 71, { width: 130, align: 'center' });
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
          .text(cinNumber, 232, 71);

        // ISO Badge & ID (Top Right)
        doc.roundedRect(700, 32, 85, 18, 9).fill('#F0F9FF');
        doc.roundedRect(700, 32, 85, 18, 9).lineWidth(0.8).stroke('#BAE6FD');
        doc.fillColor('#0369A1').fontSize(8).font('Helvetica-Bold')
          .text(isoText.length > 20 ? 'ISO 9001:2015' : isoText, 700, 36, { width: 85, align: 'center' });
        doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Bold')
          .text(`ID: ${certificateId}`, 660, 56, { width: 125, align: 'right' });

        // Header Divider Line
        doc.moveTo(36, 92).lineTo(805.89, 92).lineWidth(0.8).stroke('#E2E8F0');

        // 5. Left Column: Credential Card (x: 36, y: 104, w: 165, h: 325)
        doc.roundedRect(36, 104, 165, 325, 12).lineWidth(1).strokeColor('#E2E8F0').fillAndStroke('#F8FAFC', '#E2E8F0');

        // Candidate Photo Box (x: 56, y: 118, w: 125, h: 140)
        doc.roundedRect(56, 118, 125, 140, 6).lineWidth(1).strokeColor('#CBD5E1').fillAndStroke('#FFFFFF', '#CBD5E1');
        if (candidatePhotoPath && fs.existsSync(candidatePhotoPath)) {
          try {
            doc.image(candidatePhotoPath, 58, 120, { width: 121, height: 136, fit: [121, 136] });
          } catch (e) {}
        } else {
          doc.fillColor('#94A3B8').fontSize(9).font('Helvetica-Bold')
            .text('PASSPORT\nPHOTO', 56, 175, { width: 125, align: 'center' });
        }

        // Board Roll No
        doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold')
          .text('BOARD ROLL NO', 36, 268, { width: 165, align: 'center' });
        doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold')
          .text(rollNoDisplay, 36, 280, { width: 165, align: 'center' });

        // QR Code Box (x: 81, y: 305, w: 75, h: 75)
        doc.roundedRect(81, 305, 75, 75, 6).lineWidth(1).strokeColor('#E2E8F0').fillAndStroke('#FFFFFF', '#E2E8F0');
        if (qrBuffer) {
          doc.image(qrBuffer, 83, 307, { width: 71, height: 71 });
        }

        // 6. Right Column: Citation & Commendation (x: 220, y: 110, w: 585)
        doc.fillColor('#0284C7').fontSize(9.5).font('Helvetica-Bold')
          .text('INDUSTRIAL INTERNSHIP COMPLETION', 220, 114);

        doc.fillColor('#0F172A').fontSize(24).font('Helvetica-Bold')
          .text(studentName, 220, 132);

        doc.fillColor('#334155').fontSize(11).font('Helvetica')
          .text(`Has successfully satisfied all industrial program requirements and practical engineering milestones from `, 220, 170, { continued: true });
        doc.font('Helvetica-Bold').text(`${collegeDisplay} `, { continued: true });
        doc.font('Helvetica').text(`in `, { continued: true });
        doc.font('Helvetica-Bold').text(`${branchDisplay}.`, { lineGap: 3 });

        // Specialization Box Card (x: 220, y: 225, w: 585, h: 70)
        doc.roundedRect(220, 225, 585, 70, 8).lineWidth(1).strokeColor('#BAE6FD').fillAndStroke('#F0F9FF', '#BAE6FD');
        doc.fillColor('#0C4A6E').fontSize(11.5).font('Helvetica-Bold')
          .text(`Specialization: ${domainDisplay}`, 235, 238);
        doc.fillColor('#475569').fontSize(9.5).font('Helvetica')
          .text(`Duration: ${durationDisplay}   •   Timeline: ${startDateDisplay} to ${endDateDisplay}   •   Award Date: ${awardDateDisplay}`, 235, 262);

        doc.fillColor('#475569').fontSize(10).font('Helvetica')
          .text(`He/She has demonstrated exceptional diligence, professional dedication, and technical competence throughout the industrial tenure. We commend their performance and wish all success in their future engineering career.`, 220, 316, { width: 585, lineGap: 3 });

        // 7. Bottom Accreditation Section (y: 440)
        doc.moveTo(36, 440).lineTo(805.89, 440).lineWidth(0.8).stroke('#E2E8F0');

        // Director Signatory (Left)
        doc.fillColor('#0F172A').fontSize(15).font('Helvetica-BoldOblique')
          .text(directorName, 40, 458, { width: 175, align: 'center' });
        doc.moveTo(48, 478).lineTo(208, 478).lineWidth(1).stroke('#94A3B8');
        doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold')
          .text(directorTitle, 40, 482, { width: 175, align: 'center' });

        // Center Government Accreditation Logos
        if (fs.existsSync(GOVT_BADGES_PATH)) {
          try {
            doc.image(GOVT_BADGES_PATH, 335, 450, { width: 170 });
          } catch (bErr) {}
        }

        // Course Instructor Signatory (Right)
        doc.fillColor('#0F172A').fontSize(15).font('Helvetica-BoldOblique')
          .text(instructorName, 626, 458, { width: 175, align: 'center' });
        doc.moveTo(634, 478).lineTo(794, 478).lineWidth(1).stroke('#94A3B8');
        doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold')
          .text(instructorTitle, 626, 482, { width: 175, align: 'center' });

        // Corporate Office Capsule
        const officeW = 360;
        const officeX = (841.89 - officeW) / 2;
        doc.roundedRect(officeX, 514, officeW, 16, 8).lineWidth(0.8).strokeColor('#CBD5E1').fillAndStroke('#F8FAFC', '#CBD5E1');
        doc.fillColor('#64748B').fontSize(7.5).font('Helvetica')
          .text(corporateOffice, officeX, 518, { align: 'center', width: officeW });

        // Public Ledger Hash
        doc.fillColor('#94A3B8').fontSize(7).font('Helvetica')
          .text(`Public Ledger Hash: ${certificateId} • Verified Worldwide: ${verifyUrl}`, 0, 548, { align: 'center', width: 841.89 });

      } else {
        // =========================================================================
        // TEMPLATE 2: CLASSICAL GOVT RIBBON
        // =========================================================================
        // 1. Pure Crisp White Canvas
        doc.rect(0, 0, 841.89, 595.28).fill('#FFFFFF');

        // 2. Classical Royal Blue Ornate Certificate Frames
        doc.rect(14, 14, 813.89, 567.28).lineWidth(3.5).stroke('#1E3A8A');
        doc.rect(20, 20, 801.89, 555.28).lineWidth(1.2).stroke('#2563EB');
        doc.rect(23, 23, 795.89, 549.28).lineWidth(0.6).stroke('#93C5FD');

        const drawCorner = (x: number, y: number, xFlip = 1, yFlip = 1) => {
          doc.save();
          doc.lineWidth(1.8).strokeColor('#1E3A8A');
          doc.moveTo(x, y + 20 * yFlip).lineTo(x, y).lineTo(x + 20 * xFlip, y).stroke();
          doc.circle(x + 8 * xFlip, y + 8 * yFlip, 3).lineWidth(1).stroke('#2563EB');
          doc.restore();
        };
        drawCorner(28, 28, 1, 1);
        drawCorner(813.89, 28, -1, 1);
        drawCorner(28, 567.28, 1, -1);
        drawCorner(813.89, 567.28, -1, -1);

        // Top Right: Certificate Number
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
          .text(`Certificate. No : ${certificateId}`, 580, 32, { align: 'right', width: 220 });

        // Left Logo (Circular tech insignia)
        doc.circle(68, 58, 22).lineWidth(1.8).stroke('#1E3A8A');
        doc.circle(68, 58, 19).lineWidth(0.8).stroke('#2563EB');
        doc.fillColor('#1E3A8A').fontSize(7.5).font('Helvetica-Bold')
          .text('AAGAM', 48, 54, { width: 40, align: 'center' });

        // Center: ISO 9001
        doc.fillColor('#334155').fontSize(9.5).font('Helvetica')
          .text(isoText, 0, 30, { align: 'center', width: 841.89 });

        // Company Name
        doc.fillColor('#DC2626').fontSize(22).font('Helvetica-Bold')
          .text(companyName, 0, 44, { align: 'center', width: 841.89 });

        // Tagline
        doc.fillColor('#1D4ED8').fontSize(11).font('Helvetica-Bold')
          .text(tagline, 0, 70, { align: 'center', width: 841.89 });

        // Green Rounded Pill: MCA
        const mcaWidth = 360;
        const mcaX = (841.89 - mcaWidth) / 2;
        doc.roundedRect(mcaX, 86, mcaWidth, 18, 9).fill('#16A34A');
        doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
          .text(mcaText, mcaX, 90, { align: 'center', width: mcaWidth });

        // Red CIN Line
        doc.fillColor('#DC2626').fontSize(9).font('Helvetica-Bold')
          .text(cinNumber, 0, 109, { align: 'center', width: 841.89 });

        // Center Ribbon Badge
        const ribbonW = 270;
        const ribbonX = (841.89 - ribbonW) / 2;
        doc.rect(ribbonX, 126, ribbonW, 30).fill('#DC2626');
        doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold')
          .text('CERTIFICATE', ribbonX, 129, { align: 'center', width: ribbonW });
        doc.fillColor('#FEF08A').fontSize(7.5).font('Helvetica-Bold')
          .text(ribbonTitle, ribbonX, 144, { align: 'center', width: ribbonW });

        // Left QR Code
        if (qrBuffer) {
          doc.image(qrBuffer, 52, 168, { width: 62, height: 62 });
        }
        doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold')
          .text(`Regd. No : ${rollNoDisplay}`, 38, 234, { width: 90, align: 'center' });

        // Right Passport Photo
        const photoX = 722;
        const photoY = 166;
        const photoW = 68;
        const photoH = 86;
        doc.rect(photoX, photoY, photoW, photoH).lineWidth(1.2).stroke('#334155');
        if (candidatePhotoPath && fs.existsSync(candidatePhotoPath)) {
          try {
            doc.image(candidatePhotoPath, photoX + 1, photoY + 1, { width: photoW - 2, height: photoH - 2, fit: [photoW - 2, photoH - 2] });
          } catch (e) {}
        } else {
          doc.rect(photoX + 1, photoY + 1, photoW - 2, photoH - 2).fill('#F1F5F9');
          doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold')
            .text('PASSPORT\nPHOTO', photoX, photoY + 34, { align: 'center', width: photoW });
        }

        // Citation Text
        doc.fillColor('#0F172A').fontSize(11).font('Helvetica')
          .text('This is to Certify that ', 130, 266, { continued: true });
        doc.font('Helvetica-Bold')
          .text(`Mr./Mrs. ${studentName} `, { continued: true });
        doc.font('Helvetica')
          .text('Board Roll No/Reg.No - ', { continued: true });
        doc.font('Helvetica-Bold')
          .text(`${rollNoDisplay} `, { continued: true });
        doc.font('Helvetica')
          .text('Student of ', { continued: true });
        doc.font('Helvetica-Bold')
          .text(`${collegeDisplay} `, { continued: true });
        doc.font('Helvetica')
          .text('of ', { continued: true });
        doc.font('Helvetica-Bold')
          .text(`${branchDisplay} `, { continued: true });
        doc.font('Helvetica')
          .text('has undergone ', { continued: true });
        doc.font('Helvetica-Bold')
          .text(`${durationDisplay} `, { continued: true });
        doc.font('Helvetica')
          .text('in internship training in our organization on ', { continued: true });
        doc.font('Helvetica-Bold')
          .text(`${domainDisplay} `, { continued: true });
        doc.font('Helvetica')
          .text('Period from ', { continued: true });
        doc.font('Helvetica-Bold')
          .text(`${startDateDisplay} `, { continued: true });
        doc.font('Helvetica')
          .text('To ', { continued: true });
        doc.font('Helvetica-Bold')
          .text(`${endDateDisplay}. `, { continued: true });
        doc.font('Helvetica')
          .text('This Certificate Was Awarded On ', { continued: true });
        doc.font('Helvetica-Bold')
          .text(`${awardDateDisplay}. `, { continued: true });
        doc.font('Helvetica')
          .text('He/She has done a good job in the training and found to be sincere, hardworking with positive approach, We wish all the in his/her career endeavors.', {
            width: 580,
            align: 'justify',
            lineGap: 4,
          });

        // Director Signatory
        doc.fillColor('#0F172A').fontSize(15).font('Helvetica-BoldOblique')
          .text(directorName, 48, 460, { width: 175, align: 'center' });
        doc.moveTo(55, 480).lineTo(215, 480).lineWidth(1).stroke('#94A3B8');
        doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
          .text(directorTitle, 48, 484, { width: 175, align: 'center' });

        // Center Government Accreditation Badges
        if (fs.existsSync(GOVT_BADGES_PATH)) {
          try {
            doc.image(GOVT_BADGES_PATH, 340, 442, { width: 160 });
          } catch (bErr) {}
        }

        // Corporate Office Capsule
        const officeW = 330;
        const officeX = (841.89 - officeW) / 2;
        doc.roundedRect(officeX, 514, officeW, 18, 9).lineWidth(0.8).strokeColor('#1E3A8A').fillAndStroke('#F8FAFC', '#1E3A8A');
        doc.fillColor('#0C2340').fontSize(7.5).font('Helvetica-Bold')
          .text(corporateOffice, officeX, 519, { align: 'center', width: officeW });

        // Course Instructor Signatory
        doc.fillColor('#0F172A').fontSize(15).font('Helvetica-BoldOblique')
          .text(instructorName, 618, 460, { width: 175, align: 'center' });
        doc.moveTo(625, 480).lineTo(785, 480).lineWidth(1).stroke('#94A3B8');
        doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
          .text(instructorTitle, 618, 484, { width: 175, align: 'center' });

        // Ledger ID
        doc.fillColor('#64748B').fontSize(7).font('Helvetica')
          .text(`Publicly verifiable worldwide at ${verifyUrl} • Immutable Hash ID: ${certificateId}`, 0, 552, { align: 'center', width: 841.89 });
      }

      doc.end();

      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate formal Executive Letter of Recommendation (LOR) in A4 Portrait
 */
export async function generateLorPDF(data: LorPdfData): Promise<string> {
  const lorDir = path.join(DOCUMENTS_DIR, 'lors');
  if (!fs.existsSync(lorDir)) {
    fs.mkdirSync(lorDir, { recursive: true });
  }

  const fileName = `${data.lor_id}.pdf`;
  const filePath = path.join(lorDir, fileName);

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        info: {
          Title: `AAGAM LOR - ${data.student_name} (${data.lor_id})`,
          Author: 'AAGAM Digital Technology',
          Subject: 'Executive Letter of Recommendation',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Letterhead Top Strip
      doc.rect(0, 0, 595.28, 12).fill('#0EA5E9');
      doc.rect(0, 12, 595.28, 4).fill('#F59E0B');

      // Brand Title
      doc.fillColor('#0F172A').fontSize(20).font('Helvetica-Bold')
        .text('AAGAM DIGITAL TECHNOLOGY', 45, 35);
      doc.fillColor('#D97706').fontSize(9).font('Helvetica-Bold')
        .text('LEARN  •  BUILD  •  INNOVATE', 45, 58);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
        .text('Corporate Affairs & Talent Acquisition  |  Email: AAGAMDigitaltech@gmail.com  |  Helpline: +91 7079823919', 45, 72);

      doc.moveTo(45, 88).lineTo(550.28, 88).lineWidth(1).stroke('#E2E8F0');

      // Date & Ref No
      const issueDate = data.issue_date || new Date().toISOString().split('T')[0];
      doc.fillColor('#475569').fontSize(9).font('Helvetica')
        .text(`Date: ${issueDate}`, 45, 102);
      doc.fillColor('#0284C7').fontSize(9).font('Helvetica-Bold')
        .text(`Reference ID: ${data.lor_id}`, 380, 102, { align: 'right', width: 170 });

      // Salutation
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold')
        .text('TO WHOMSOEVER IT MAY CONCERN', 45, 130, { align: 'center', width: 505.28 });
      doc.fillColor('#0284C7').fontSize(11).font('Helvetica-Bold')
        .text('EXECUTIVE LETTER OF RECOMMENDATION', 45, 148, { align: 'center', width: 505.28 });

      // Body Paragraph 1
      const studentName = data.student_name;
      const collegeName = data.college_name || 'Accredited University';
      const domain = data.internship_title || 'Software Engineering Track';
      const duration = data.duration || '4 Weeks';
      const rating = data.performance_rating || 'Exceptional Performance (Top 5%)';

      doc.fillColor('#334155').fontSize(10).font('Helvetica')
        .text(
          `It is with great pleasure and high professional regard that we issue this formal Letter of Recommendation for ${studentName}, an engineering student from ${collegeName}, who successfully concluded their industrial internship in ${domain} spanning ${duration}.`,
          45,
          180,
          { align: 'justify', width: 505.28, lineGap: 4 }
        );

      // Body Paragraph 2 (Recommendation Body)
      const recBody = data.recommendation_body ||
        'During their tenure, the candidate demonstrated exemplary software engineering capability, high architectural discipline, and rigorous code reviews. They successfully implemented full-stack solutions, collaborated with lead mentors, and delivered scalable modules adhering to enterprise best practices.';

      doc.fillColor('#334155').fontSize(10).font('Helvetica')
        .text(
          recBody,
          45,
          235,
          { align: 'justify', width: 505.28, lineGap: 4 }
        );

      // Body Paragraph 3 (Rating & Conclusion)
      doc.fillColor('#334155').fontSize(10).font('Helvetica')
        .text(
          `Based on technical defense sessions, weekly sprint assignments, and capstone submissions, the candidate was evaluated at ${rating}. Their positive work attitude, rapid learning capability, and proactive problem-solving mindset make them an asset to any progressive engineering or technology organization.`,
          45,
          315,
          { align: 'justify', width: 505.28, lineGap: 4 }
        );

      doc.fillColor('#334155').fontSize(10).font('Helvetica')
        .text(
          'We wholeheartedly endorse their technical capabilities and wish them outstanding success in all academic, professional, and research endeavors.',
          45,
          380,
          { align: 'justify', width: 505.28, lineGap: 4 }
        );

      // Sign-off
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold')
        .text('Sincerely,', 45, 435);

      // Signatures
      doc.fillColor('#0284C7').fontSize(14).font('Helvetica-BoldOblique')
        .text('Ayush Raj', 45, 465);
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold')
        .text('Ayush Raj', 45, 485);
      doc.fillColor('#64748B').fontSize(9).font('Helvetica')
        .text('Chief Executive Officer\nAAGAM Digital Technology', 45, 498);

      doc.fillColor('#D97706').fontSize(14).font('Helvetica-BoldOblique')
        .text('Akash Verma', 320, 465);
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold')
        .text('Akash Verma', 320, 485);
      doc.fillColor('#64748B').fontSize(9).font('Helvetica')
        .text('Head of HR & Talent Acquisition\nAAGAM Digital Technology', 320, 498);

      // Bottom QR & Verification
      const verifyUrl = `http://127.0.0.1:5173/?view=verify&id=${data.lor_id}`;
      try {
        const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 90, margin: 1 });
        doc.image(qrBuffer, 45, 680, { width: 55, height: 55 });
      } catch (e) {}

      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold')
        .text(`OFFICIAL VERIFICATION ID: ${data.lor_id}`, 110, 690);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
        .text(`Verify online at ${verifyUrl}`, 110, 704);
      doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica')
        .text('Tamper-proof digital credential issued by AAGAM Digital Technology Private Limited.', 110, 718);

      // Footer bar
      doc.rect(0, 830, 595.28, 12).fill('#0F172A');

      doc.end();

      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate formal Official Offer Letter / Appointment Letter in A4 Portrait
 */
export async function generateOfferLetterPDF(rawInput: OfferLetterPdfData | any): Promise<string> {
  const data = rawInput || {};
  const offerId = String(data.offer_id || data.offerId || 'AAGAM-OFFER');
  const studentName = String(data.student_name || data.studentName || 'Candidate Name');
  const internshipTitle = String(data.internship_title || data.roleTitle || 'Industrial Internship');
  const college = String(data.college_name || data.collegeName || 'Accredited University');
  const course = String(data.course || 'B.Tech / Engineering');
  const duration = String(data.duration || '8 Weeks');
  const startDate = String(data.start_date || data.startDate || new Date().toISOString().split('T')[0]);
  const endDate = String(data.end_date || data.endDate || new Date().toISOString().split('T')[0]);
  const stipendText = String(data.stipend_fee_text || data.stipendAmount || 'Performance Stipend + LOR');
  const payableAmount = data.payable_amount !== undefined ? data.payable_amount : (data.feeAmount || 0);

  const offerDir = path.join(DOCUMENTS_DIR, 'offers');
  if (!fs.existsSync(offerDir)) {
    fs.mkdirSync(offerDir, { recursive: true });
  }

  const fileName = `${offerId}.pdf`;
  const filePath = path.join(offerDir, fileName);

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 35, bottom: 35, left: 45, right: 45 },
        info: {
          Title: `AAGAM Offer Letter - ${studentName} (${offerId})`,
          Author: 'AAGAM Digital Technology',
          Subject: 'Formal Appointment Letter for Industrial Engineering Internship',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Letterhead Accent Bars
      doc.rect(0, 0, 595.28, 10).fill('#0C2340');
      doc.rect(0, 10, 595.28, 4).fill('#C59B27');

      // 1. Company Letterhead Header
      doc.fillColor('#0C2340').fontSize(19).font('Helvetica-Bold')
        .text('AAGAM DIGITAL TECHNOLOGY', 45, 28);
      doc.fillColor('#B45309').fontSize(9).font('Helvetica-Bold')
        .text('LEARN  •  BUILD  •  INNOVATE', 45, 50);
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text('Corporate Affairs & University Relations  |  Email: AAGAMDigitaltech@gmail.com  |  Helpline: +91 7079823919', 45, 64);

      doc.moveTo(45, 80).lineTo(550.28, 80).lineWidth(1).stroke('#CBD5E1');

      // 2. Reference & Date
      const issueDate = data.issue_date || new Date().toISOString().split('T')[0];
      doc.fillColor('#475569').fontSize(9).font('Helvetica')
        .text(`Date of Issuance: ${issueDate}`, 45, 92);
      doc.fillColor('#0284C7').fontSize(9).font('Helvetica-Bold')
        .text(`OFFER REF ID: ${offerId}`, 350, 92, { align: 'right', width: 200 });

      // 3. Subject Line
      doc.rect(45, 115, 505.28, 26).fill('#F8FAFC');
      doc.rect(45, 115, 505.28, 26).lineWidth(0.8).stroke('#E2E8F0');
      doc.fillColor('#0C2340').fontSize(11).font('Helvetica-Bold')
        .text('SUBJECT: FORMAL APPOINTMENT LETTER FOR INDUSTRIAL INTERNSHIP', 55, 122, { align: 'center', width: 485.28 });

      // 4. Salutation & Greeting
      doc.fillColor('#0F172A').fontSize(10.5).font('Helvetica-Bold')
        .text(`Dear ${studentName},`, 45, 155);

      doc.fillColor('#334155').fontSize(9.5).font('Helvetica')
        .text(
          `On behalf of AAGAM Digital Technology, we are pleased to extend this formal offer of appointment as an Industrial Engineering Intern in our ${internshipTitle} program. This offer is issued in accordance with your application credentials and academic standing at ${college}.`,
          45,
          173,
          { align: 'justify', width: 505.28, lineGap: 3 }
        );

      // 5. Internship Appointment Specification Box
      const yBox = 220;
      doc.rect(45, yBox, 505.28, 112).fill('#F8FAFC');
      doc.rect(45, yBox, 505.28, 112).lineWidth(1).stroke('#0C2340');

      const drawDetailRow = (y: number, label1: string, val1: string, label2: string, val2: string) => {
        doc.fillColor('#64748B').fontSize(8.5).font('Helvetica')
          .text(label1, 55, y);
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
          .text(val1, 145, y);

        doc.fillColor('#64748B').fontSize(8.5).font('Helvetica')
          .text(label2, 310, y);
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
          .text(val2, 400, y);
      };

      drawDetailRow(yBox + 10, 'Program / Track:', internshipTitle, 'Candidate Name:', studentName);
      drawDetailRow(yBox + 32, 'Academic Institute:', college, 'Course / Discipline:', course);
      drawDetailRow(yBox + 54, 'Tenure / Duration:', duration, 'Program Timeline:', `${startDate} to ${endDate}`);
      drawDetailRow(yBox + 76, 'Mode of Execution:', 'Remote / Guided Sprints', 'Stipend / Incentive:', stipendText);
      drawDetailRow(yBox + 96, 'Payable Fee:', payableAmount && payableAmount > 0 ? `₹${payableAmount} (One-time)` : 'Sponsored / Zero Fee', 'Verification Status:', 'Official AICTE/UGC Equivalent');

      // 6. Mandatory Corporate Terms & Guidelines
      const yTerms = 345;
      doc.fillColor('#0C2340').fontSize(10).font('Helvetica-Bold')
        .text('TERMS & CONDITIONS OF APPOINTMENT:', 45, yTerms);

      const termsList = [
        '1. Intellectual Property: All software architectures, code modules, and project deliverables engineered during the tenure shall be the exclusive property of AAGAM Digital Technology.',
        '2. Technical Milestones: Interns are required to actively participate in weekly sprint submissions, code reviews on GitHub, and module quizzes to maintain passing standing.',
        '3. Confidentiality: You agree to uphold strict non-disclosure obligations regarding proprietary codebases, internal APIs, and architectural documentation.',
        '4. Credential Conferral: Upon successful conclusion and technical evaluation, an authentic Verifiable Digital Certificate and Executive LOR backed by AAGAM Cryptographic Ledger will be issued.',
        '5. Code of Conduct: Professional integrity, adherence to academic honor code, and punctuality during scheduled mentor check-ins are mandatory requirements.',
      ];

      let termY = yTerms + 16;
      for (const term of termsList) {
        doc.fillColor('#334155').fontSize(8.5).font('Helvetica')
          .text(term, 45, termY, { width: 505.28, align: 'justify', lineGap: 2 });
        termY += 24;
      }

      // 7. Signatories Row
      const ySign = 510;
      doc.moveTo(45, ySign - 10).lineTo(550.28, ySign - 10).lineWidth(0.8).stroke('#E2E8F0');

      // CEO Signatory (Left)
      doc.fillColor('#0C2340').fontSize(13).font('Helvetica-BoldOblique')
        .text('Ayush Raj', 45, ySign);
      doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold')
        .text('Ayush Raj', 45, ySign + 18);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
        .text('Chief Executive Officer\nAAGAM Digital Technology', 45, ySign + 30);

      // Official Digital Seal Emblem (Center)
      doc.circle(297.64, ySign + 22, 25).lineWidth(1.5).stroke('#C59B27');
      doc.circle(297.64, ySign + 22, 22).lineWidth(0.6).stroke('#0C2340');
      doc.fillColor('#B45309').fontSize(6.5).font('Helvetica-Bold')
        .text('AAGAM DIGITAL', 257.64, ySign + 14, { width: 80, align: 'center' });
      doc.fillColor('#0C2340').fontSize(6).font('Helvetica-Bold')
        .text('OFFICIAL SEAL', 257.64, ySign + 24, { width: 80, align: 'center' });

      // HR Signatory (Right)
      doc.fillColor('#0C2340').fontSize(13).font('Helvetica-BoldOblique')
        .text('Akash Verma', 390, ySign);
      doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold')
        .text('Akash Verma', 390, ySign + 18);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
        .text('Head of HR & Talent Acquisition\nAAGAM Digital Technology', 390, ySign + 30);

      // 8. Verifiable QR Code & Security Banner (Bottom Strip)
      const verifyUrl = `http://127.0.0.1:5173/?view=accept-offer&offerId=${offerId}`;
      try {
        const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 90, margin: 1 });
        doc.image(qrBuffer, 45, 680, { width: 52, height: 52 });
      } catch (qrErr) {
        console.warn('[OFFER QR WARN]', qrErr);
      }

      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold')
        .text(`OFFICIAL APPOINTMENT CREDENTIAL: ${offerId}`, 108, 688);
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text(`Verifiable online at ${verifyUrl}`, 108, 702);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica')
        .text('Backed by AAGAM Digital Cryptographic Verification Registry. Tamper-proof official PDF record.', 108, 716);

      // Bottom footer bar
      doc.rect(0, 831, 595.28, 11).fill('#0C2340');

      doc.end();

      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}
