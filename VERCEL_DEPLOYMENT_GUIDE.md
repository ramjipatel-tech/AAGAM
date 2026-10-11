# 🚀 Vercel Live Deployment Guide - AAGAM Enterprise Platform

A complete step-by-step guide to deploying the **AAGAM Digital Technology** platform (React Vite Client + Express Serverless API + Hydrated SQLite Database) live on **Vercel**.

---

## 🛠️ Architecture & What Has Been Configured

1. **`vercel.json` (Root Configuration)**:
   - Configures `client/dist` as the static output directory for the high-performance React SPA.
   - Routes all API calls (`/api/*`), file uploads (`/uploads/*`), and document downloads (`/documents/*`) directly to the serverless function `api/index.ts`.
   - Preserves SPA client routing by directing page requests to `/index.html`.
   - Bundles the pre-seeded SQLite database (`server/data/**`) and accreditation assets (`documents/assets/**`) into the Lambda container via `includeFiles`.

2. **`api/index.ts` (Vercel Serverless Function)**:
   - Wraps and exports the Express application (`server/src/app.ts`) for `@vercel/node`.

3. **Dynamic `/tmp` Database & File Hydration**:
   - In serverless environments (`VERCEL=1`), the root file system is read-only.
   - The application automatically copies the bundled pre-seeded `aagam.sqlite` into the writable `/tmp/data/aagam.sqlite` directory on container startup.
   - Uploads and generated PDFs use `/tmp/uploads` and `/tmp/documents` safely without throwing `EROFS: read-only file system` errors.

4. **Root `package.json`**:
   - Configured with npm workspaces (`client`, `server`) and unified build scripts (`npm run build`).

---

## 🚀 How to Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Commit and Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: configure full-stack Vercel deployment with serverless API and SQLite hydration"
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository (`AAGAM`).
   - **Framework Preset**: Leave as **Other** (or **Vite**). Vercel will automatically read `vercel.json`.
   - **Root Directory**: Leave as `./` (Root).

3. **Add Environment Variables in Vercel**:
   In the **Environment Variables** section on Vercel, add the following key-value pairs:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `JWT_SECRET` | `aagam_super_secure_enterprise_jwt_secret_2026_production` | JWT Auth Secret |
   | `REFRESH_TOKEN_SECRET` | `aagam_super_secure_refresh_secret_2026` | Refresh Token Secret |
   | `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP Server |
   | `SMTP_PORT` | `587` | Port |
   | `SMTP_SECURE` | `false` | TLS |
   | `SMTP_USER` | `shantisetu.business@gmail.com` | Sender Email |
   | `SMTP_PASS` | `easy xsrm vuuk rban` | App Password |
   | `EMAIL_FROM_NAME` | `AAGAM Digital Technology` | Sender Display Name |
   | `EMAIL_FROM_ADDRESS` | `shantisetu.business@gmail.com` | From Address |
   | `RAZORPAY_KEY_ID` | `rzp_test_placeholder_key_id` | Payment Key |
   | `RAZORPAY_KEY_SECRET` | `rzp_test_placeholder_secret` | Payment Secret |

4. **Click "Deploy"**:
   - Vercel will run `npm run build`, compile the client into `client/dist`, bundle the `api/index.ts` serverless function, and give you your live URL (e.g. `https://aagam-xxx.vercel.app`)!

---

### Option B: Deploy via Vercel CLI (Direct from Terminal)

1. Open PowerShell / Terminal in `b:/Projects/AAGAM`:
   ```bash
   npx vercel
   ```
2. Log in and confirm the project settings (accept default `./` root directory).
3. To deploy directly to production:
   ```bash
   npx vercel --prod
   ```

---

## 🔍 How to Test Once Live on Vercel

1. **Health Check API**:
   - Open: `https://your-domain.vercel.app/api/health`
   - Expected JSON:
     ```json
     {
       "status": "healthy",
       "name": "AAGAM Digital Technology Enterprise API",
       "environment": "vercel-serverless"
     }
     ```
2. **Public Website**:
   - Open: `https://your-domain.vercel.app`
   - All courses, internships, and admissions will load from the hydrated API.
3. **Certificate Verification**:
   - Open: `https://your-domain.vercel.app/?view=verify&id=AAGAM-CERT-2026-000001`
   - The modern tech certificate with clean MSME, IAF, AICTE accreditations will render immediately.

---

> [!NOTE]
> **Important Note Regarding Serverless Database Storage:**
> In Vercel's serverless environment, data in `/tmp` remains active while the serverless function is warm. If the application stays idle and Vercel recycles the container (cold start), it will re-hydrate from the bundled database (`server/data/aagam.sqlite`).
> If you require permanent, multi-year cloud database storage that never resets under any circumstance, you can simply connect a cloud database (like Turso / Supabase / Neon) or deploy the backend to a persistent server (Render / Railway / VPS).
