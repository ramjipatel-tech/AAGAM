# AAGAM Digital Technology — Enterprise Web Platform

![AAGAM Digital Technology Logo](./client/public/aagam-logo.jpg)

**Tagline:** *"Learn • Build • Innovate"*

---

## 🌟 Overview

**AAGAM Digital Technology** is a full-stack corporate web platform combining:
1. **Public Corporate Portal:** High-converting showcase with modern responsive UI, live statistics, dynamic training/internship catalogs, placement drives, career openings, tech blog CMS, contact enquiries, and universal document verification.
2. **Student Portal:** Multi-step internship applications with auto-fill, document upload, OCR preview, email OTP, 48-Hour SLA Offer Letter acceptance, server-verified Razorpay payments, 2-Hour SLA portal provisioning, project submissions (GitHub/Demo), training enrollment, and verifiable certificate/LOR downloads.
3. **Staff / HR Portal:** Applicant review pipeline, NOC & college ID verification, OCR inspection, project code evaluation, submission feedback, and candidate inquiries.
4. **Executive Admin ERP:** Student & staff management, 1-Click Offer Letter generation with customizable templates, dynamic Certificate & LOR generation with QR codes, payment reconciliation ledger, 20+ automated email triggers with live logs, security audit trail, and company settings.
5. **Universal QR Verification Engine (`/verify`):** Real-time database verification for Offer Letters, LORs, and Certificates with status tracking (VALID, REVOKED, CANCELLED, INVALID).

---

## 🏢 Corporate Profile & Leadership

- **Company:** AAGAM Digital Technology
- **Tagline:** Learn • Build • Innovate
- **CEO:** Ayush Raj
- **HR:** Akash Verma (`akashvermaofficialblogs@gmail.com` | `+91 9693335499`)
- **Official Inquiries:** `AAGAMDigitaltech@gmail.com`
- **Helplines:** `+91 7667204026`, `+91 9142363927`, `+91 7091465676`

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18.x or v20.x+)
- npm or yarn

### 1. Installation
```bash
# In project root
cd b:\Projects\AAGAM

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database Initialization & Seeding
```bash
# From server directory
cd ../server
npx tsx src/db/seed.ts
```

### 3. Run Platform Locally
```bash
# Start Backend Server (runs on http://localhost:5000)
cd server
npm run dev

# In a separate terminal, start Frontend (runs on http://localhost:5173)
cd client
npm run dev
```

---

## 🔐 Pre-Seeded Test Accounts

| Role | Name | Email | Password | Access / Notes |
|---|---|---|---|---|
| **Admin (CEO)** | Ayush Raj | `brightspark772@gmail.com` | `BrightSpark@772` | Full Admin ERP, Offer Generation, Certificate Issuance, Payments, Email Automation, System Settings |
| **Staff (HR)** | Akash Verma | `akashvermaofficialblogs@gmail.com` | `Staff@123` | HR & Staff Portal, Application Reviews, NOC Verification, Project Submissions Review |
| **Student** | Rohan Sharma | `student@aagam.com` | `Student@123` | Student Portal, Application `AAGAM-INT-2026-000001`, Active Offer, Project Submissions, Document Downloads |

---

## 📜 Verifiable Test Document IDs

Visit `/verify` or click **Verify** in the navigation bar to test QR/ID verification:

- **Certificate:** `AAGAM-CERT-2026-000001` (Full-Stack Web Development — Grade A+)
- **Offer Letter:** `AAGAM-OFFER-2026-000001` (Full-Stack Web Development Intern)
- **Letter of Recommendation (LOR):** `AAGAM-LOR-2026-000001` (Ayush Raj Signature Endorsement)

---

## 🔄 End-to-End Core Workflows

### 1. Internship Application Flow
```
Public Website (/internships)
  └── Select Internship (e.g., Full-Stack Web Development)
        └── "Apply Now" (Requires Student Auth)
              └── Step 1: Student Profile Auto-Fill & Review
              └── Step 2: Document Upload (NOC, College ID, Resume)
              └── Step 3: OCR Preview & Confirmation
              └── Step 4: Email OTP Verification (Rate-limited, expiring)
                    └── Submission Success ➔ Unique Reg No: AAGAM-INT-2026-XXXXXX
                          └── Auto-trigger Confirmation Email + Notification
```

### 2. 48-Hour SLA Offer Letter Workflow
```
Admin Panel (/admin/applications)
  └── Review Submitted Documents (NOC, ID)
        └── Change Status to "Selected"
              └── Click "Generate Offer Letter"
                    └── Select Approved Template & Preview
                          └── System Generates Offer ID: AAGAM-OFFER-2026-XXXXXX
                                └── Live QR Code Embedded + Stored in DB
                                      └── Notification & Offer Letter Email Sent to Student
```

### 3. Acceptance & Server-Verified Razorpay Payment Flow
```
Student Dashboard (/student/offers)
  └── View Offer Letter with dynamic Terms & QR
        └── Click "Accept Offer" ➔ Razorpay Payment Modal
              └── Backend Creates Secure Order (Frontend cannot manipulate amount)
                    └── Razorpay Checkout Simulation / Live Gateway
                          └── Server-Side HMAC-SHA256 Signature Verification
                                └── Status: SUCCESS ➔ Payment Record Created
                                      └── Offer Acceptance Status: ACCEPTED
                                            └── 2-Hour SLA Portal Provisioning Triggered
                                                  └── Automated Receipt & Provisioning Email Sent
```

### 4. Project Submission & Review Flow
```
Student Dashboard (/student/projects)
  └── View Assigned Projects & Guidelines
        └── Submit Deliverables (GitHub Repo URL, Live Demo URL, Comments)
              └── Staff Portal (/staff/submissions)
                    └── Staff Reviews Code & Demo
                          └── Approve / Request Changes with Feedback
```

### 5. Completion, LOR & Certificate Generation
```
Admin Panel (/admin/certificates | /admin/lors)
  └── Click "Issue Certificate" for completed student
        └── Generates Certificate ID: AAGAM-CERT-2026-XXXXXX
              └── Embeds Official Seal, CEO Signature & Verification QR Code
                    └── Immediately accessible in Student Portal & Publicly Verifiable at /verify
```

---

## 🛡️ Security & Enterprise Architecture

- **Authentication & RBAC:** JWT Bearer tokens with distinct role scopes (`student`, `staff`, `admin`, `superadmin`).
- **Data Protection:** Password hashing with bcrypt, parameterized SQL queries preventing SQLi, private file storage paths.
- **Payment Integrity:** Server-side order calculation, HMAC-SHA256 signature verification, and idempotent webhook handling.
- **Audit Logging:** Comprehensive logging of all critical actions (logins, application status changes, offer creations, certificate revocations, payments).
- **Responsive UI:** Built with Tailwind CSS v4, Lucide React icons, and high-DPI corporate branding elements.

---

## 📁 Repository Structure

```
AAGAM/
├── client/                     # Vite + React + TypeScript Frontend
│   ├── public/                 # Public assets & authentic AAGAM logo
│   └── src/
│       ├── assets/             # Brand images
│       ├── components/         # Reusable UI components & document viewers
│       │   ├── Navbar.tsx      # Responsive desktop/mobile header
│       │   ├── Footer.tsx      # Corporate footer with dynamic links
│       │   ├── ApplicationFlowModal.tsx # 4-step application with OCR & OTP
│       │   ├── PaymentModal.tsx         # Razorpay checkout & signature verify
│       │   ├── CertificateViewer.tsx    # Gold-bordered certificate + PDF export
│       │   ├── OfferLetterViewer.tsx    # Corporate offer letter + PDF export
│       │   └── LorViewer.tsx            # Verifiable recommendation letter
│       ├── context/            # AuthContext with persistent session
│       ├── pages/              # Public, Student, Staff, and Admin Pages
│       └── services/           # Axios API client
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── data/                   # SQLite database (aagam.sqlite)
│   ├── src/
│   │   ├── db/                 # Database schema initialization & seeding
│   │   ├── middleware/         # Auth, RBAC & error handlers
│   │   ├── routes/             # RESTful API routes
│   │   │   ├── admin.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── document.routes.ts
│   │   │   ├── internship.routes.ts
│   │   │   ├── offer.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── public.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   └── verification.routes.ts
│   │   └── services/           # Core business logic
│   │       ├── auditService.ts
│   │       ├── emailService.ts # 20+ automated email triggers & logs
│   │       ├── numberingService.ts # Deterministic ID sequencing
│   │       ├── ocrService.ts   # Document parsing engine
│   │       ├── qrService.ts    # QR code generator
│   │       └── razorpayService.ts # Payment validation & provisioning
└── uploads/                    # Secure student document uploads
```

---

## 📄 License & Ownership
Copyright © 2026 **AAGAM Digital Technology**. All rights reserved.
Developed for production enterprise deployment.
