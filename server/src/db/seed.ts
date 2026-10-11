import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase } from './database';

export function resetAndSeedDatabase(force = false) {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0 && !force) {
    console.log('[SEED] Database already initialized. Skipping reset.');
    return;
  }

  console.log('[SEED] Resetting database to clean pristine baseline (0 mock applications/students)...');

  // Disable FK temporarily for clean wipe
  db.pragma('foreign_keys = OFF');

  const tablesToClear = [
    'internship_applications',
    'application_documents',
    'offer_letters',
    'payments',
    'portal_provisioning',
    'certificates',
    'lors',
    'project_submissions',
    'project_assignments',
    'task_submissions',
    'quiz_attempts',
    'training_enrollments',
    'job_applications',
    'batch_enrollments',
    'batches',
    'students',
    'staff',
    'users',
    'otp_verifications',
    'password_reset_tokens',
    'notifications',
    'email_logs',
    'audit_logs',
    'contact_enquiries',
    'internships',
    'training_programs',
    'placement_drives',
    'jobs',
    'blogs',
  ];

  for (const table of tablesToClear) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
    } catch (e) {}
  }

  db.pragma('foreign_keys = ON');

  const now = new Date().toISOString();
  const passwordHashAdmin = bcrypt.hashSync('Admin@123456', 10);
  const passwordHashStaff = bcrypt.hashSync('Staff@123456', 10);

  // 1. Seed Authorized Admin: ramji.patel8002@gmail.com
  const adminId = uuidv4();
  const staffId = uuidv4();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, role, full_name, phone, avatar_url, is_active, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
  `);

  insertUser.run(
    adminId,
    'ramji.patel8002@gmail.com',
    passwordHashAdmin,
    'admin',
    'Ayush Raj (CEO & Administrator)',
    '7667204026',
    null,
    now,
    now
  );

  insertUser.run(
    staffId,
    'akashvermaofficialblogs@gmail.com',
    passwordHashStaff,
    'staff',
    'Akash Verma (Head of HR)',
    '9693335499',
    null,
    now,
    now
  );

  // 2. Staff Profiles
  const insertStaff = db.prepare(`
    INSERT INTO staff (id, user_id, designation, department, employee_id, phone, bio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStaff.run(
    uuidv4(),
    adminId,
    'Chief Executive Officer',
    'Executive Leadership',
    'AAGAM-EXEC-001',
    '7667204026',
    'Chief Executive Officer leading strategic engineering and company vision.',
    now
  );

  insertStaff.run(
    uuidv4(),
    staffId,
    'Head of HR & Talent Acquisition',
    'Human Resources',
    'AAGAM-EMP-002',
    '9693335499',
    'Managing student onboarding, recruitment drives, and corporate placements.',
    now
  );

  // 3. Internships
  const int1Id = uuidv4();
  const int2Id = uuidv4();
  const int3Id = uuidv4();
  const int4Id = uuidv4();
  const int5Id = uuidv4();
  const int6Id = uuidv4();

  const insertInternship = db.prepare(`
    INSERT INTO internships (
      id, slug, title, department, technology, description, full_description, duration,
      eligibility, skills_required, mode, location, start_date, application_deadline,
      total_seats, filled_seats, fee_amount, is_paid, required_documents, ocr_enabled, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertInternship.run(
    int1Id,
    'full-stack-web-development',
    'Full Stack Web Development Internship',
    'Software Engineering',
    'React, Node.js, Next.js, TypeScript & PostgreSQL',
    'Build production-grade SaaS applications, scalable backend microservices, and interactive modern interfaces with industry mentors.',
    'Join AAGAM Digital Technology as a Full Stack Web Engineering Intern. You will design, build, and deploy real-world enterprise applications under the direct mentorship of senior engineers. You will master full lifecycle development: REST/GraphQL API design, database modeling, secure authentication, cloud deployment, and CI/CD pipelines.',
    '8 Weeks / 2 Months',
    'B.Tech / BCA / MCA / B.Sc IT (2nd, 3rd, 4th Year or Recent Graduates)',
    'HTML/CSS, JavaScript, React.js, Node.js, Git, SQL basics',
    'Remote',
    'Online / Pan-India',
    '2026-11-01',
    '2026-10-31',
    100,
    0,
    0,
    0,
    JSON.stringify(['NOC', 'College_ID', 'Resume']),
    1,
    'Active',
    now,
    now
  );

  insertInternship.run(
    int2Id,
    'ai-ml-data-intelligence',
    'Artificial Intelligence & Machine Learning Internship',
    'Data & AI Research',
    'Python, PyTorch, Transformers, LLMs & Computer Vision',
    'Develop cutting-edge deep learning models, fine-tune Generative AI agents, and build enterprise machine learning pipelines.',
    'Work directly on transformative AI solutions. Gain hands-on experience in feature engineering, model training, transformer architectures, prompt engineering, agentic orchestration, and deploying ML models as scalable APIs.',
    '8 Weeks / 2 Months',
    'B.Tech CS/IT/AI/DS, M.Tech, MCA, BCA with strong Python fundamentals',
    'Python, NumPy, Pandas, Scikit-Learn, PyTorch/TensorFlow, Math & Statistics',
    'Hybrid',
    'Noida / Remote',
    '2026-11-05',
    '2026-11-02',
    80,
    0,
    0,
    0,
    JSON.stringify(['NOC', 'Resume']),
    1,
    'Active',
    now,
    now
  );

  insertInternship.run(
    int3Id,
    'cloud-devops-engineering',
    'Cloud Computing & DevOps Internship',
    'Infrastructure & Cloud',
    'AWS, Docker, Kubernetes, Terraform & CI/CD Pipelines',
    'Master container orchestration, automated infrastructure as code, cloud monitoring, and high-availability architecture.',
    'Learn how high-traffic technology companies deploy, scale, and maintain cloud infrastructure with zero downtime. You will automate CI/CD workflows, build Docker images, configure Kubernetes clusters, and implement security guardrails.',
    '8 Weeks / 2 Months',
    'B.Tech, MCA, Diploma in CS/IT with Linux and Networking basics',
    'Linux CLI, Git, Docker fundamentals, Cloud basics, Bash scripting',
    'Remote',
    'Online',
    '2026-11-10',
    '2026-11-05',
    60,
    0,
    0,
    0,
    JSON.stringify(['NOC', 'College_ID', 'Resume']),
    1,
    'Active',
    now,
    now
  );

  insertInternship.run(
    int4Id,
    'cyber-security-vapt',
    'Cyber Security & Ethical Hacking Internship',
    'Information Security',
    'Vulnerability Assessment, Penetration Testing & OWASP Top 10',
    'Perform real-time penetration testing, identify application vulnerabilities, and implement zero-trust defense architectures.',
    'An intensive security program focusing on offensive and defensive security practices. You will practice on simulated targets, perform vulnerability assessments (VAPT), write security reports, and protect corporate web applications.',
    '8 Weeks / 2 Months',
    'All engineering & computer application students passionate about cybersecurity',
    'Networking, Web security concepts, Burp Suite basics, Linux, Cryptography',
    'Remote',
    'Online',
    '2026-11-15',
    '2026-11-10',
    50,
    0,
    0,
    0,
    JSON.stringify(['NOC', 'Resume']),
    1,
    'Active',
    now,
    now
  );

  insertInternship.run(
    int5Id,
    'data-science-analytics',
    'Data Science & Business Intelligence Internship',
    'Analytics & BI',
    'SQL, Power BI, Python, Tableau & Advanced Statistical Modeling',
    'Transform complex raw datasets into actionable enterprise intelligence, predictive dashboards, and executive reporting models.',
    'Work on big data transformation, predictive modeling, statistical testing, and executive dashboard design using SQL, Python, PowerBI, and Tableau.',
    '8 Weeks / 2 Months',
    'B.Tech, BCA, MCA, B.Sc, B.Com, MBA with analytical interest',
    'Excel, SQL basics, Python/R, Critical problem solving',
    'Remote',
    'Online',
    '2026-11-12',
    '2026-11-08',
    60,
    0,
    0,
    0,
    JSON.stringify(['NOC', 'Resume']),
    1,
    'Active',
    now,
    now
  );

  insertInternship.run(
    int6Id,
    'mobile-app-development-flutter',
    'Mobile Application Development Internship',
    'Mobile Engineering',
    'Flutter, Dart, Firebase, REST APIs & Native Device Integrations',
    'Build cross-platform iOS and Android applications with fluid 60 FPS animations, state management, and real-time backend sync.',
    'Develop scalable mobile applications using Flutter and Dart. Build beautiful UI layouts, state management with Bloc/Provider, local offline storage, and push notifications.',
    '8 Weeks / 2 Months',
    'B.Tech / BCA / MCA / Diploma with object-oriented programming foundation',
    'Dart/Java/Kotlin, OOP concepts, Flutter basics, REST APIs',
    'Remote',
    'Online',
    '2026-11-15',
    '2026-11-10',
    50,
    0,
    0,
    0,
    JSON.stringify(['NOC', 'Resume']),
    1,
    'Active',
    now,
    now
  );

  // 4. Default Batches with Comprehensive Multi-Module Curriculum
  const batch1Id = uuidv4();
  const batch2Id = uuidv4();

  const insertBatch = db.prepare(`
    INSERT INTO batches (
      id, batch_code, title, program_id, program_type, start_date, end_date,
      duration_weeks, instructor_name, instructor_email, curriculum_modules,
      max_seats, enrolled_count, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const fullStackModules = [
    {
      id: 'mod_1',
      module_no: 1,
      title: 'Module 1: Modern JavaScript (ES6+), TypeScript & DOM Mastery',
      description: 'Master asynchronous JS, event loops, promises, TypeScript typing, interfaces, and modular architecture.',
      lectures: [
        { id: 'lec_1_1', title: 'ES6+ Features, Closures & Event Loop Mechanics', type: 'video', duration_mins: 60, url: 'https://www.youtube.com/watch?v=sample1' },
        { id: 'lec_1_2', title: 'TypeScript Foundations: Types, Generics & Utility Types', type: 'video', duration_mins: 75, url: 'https://www.youtube.com/watch?v=sample2' },
        { id: 'lec_1_3', title: 'Module 1 Architecture Notes & Cheatsheet (PDF)', type: 'pdf', duration_mins: 30, url: '/documents/notes/module-1-notes.pdf' }
      ],
      tasks: [
        { id: 'task_1', title: 'Build a Strongly-Typed Async Task Pipeline in TypeScript', description: 'Implement error-resilient retry mechanisms and Promise orchestration.', deadline_days: 7, max_score: 100 }
      ],
      quiz: [
        { id: 'q_1_1', question: 'Which TypeScript keyword is used to enforce immutable properties?', options: ['constant', 'readonly', 'sealed', 'freeze'], correct_index: 1 },
        { id: 'q_1_2', question: 'What does Promise.allSettled() return?', options: ['Only resolved promises', 'Only rejected promises', 'Array of outcome objects for all promises', 'The first settled promise'], correct_index: 2 }
      ]
    },
    {
      id: 'mod_2',
      module_no: 2,
      title: 'Module 2: Frontend Engineering with React 18, Hooks & Tailwind CSS',
      description: 'Component lifecycles, advanced custom hooks, Context API, state machines, and responsive layout styling.',
      lectures: [
        { id: 'lec_2_1', title: 'React 18 Concurrent Features & Rendering Optimization', type: 'video', duration_mins: 80, url: 'https://www.youtube.com/watch?v=sample3' },
        { id: 'lec_2_2', title: 'Building Custom Reusable Hooks (useFetch, useDebounce, useLocalStorage)', type: 'video', duration_mins: 60, url: 'https://www.youtube.com/watch?v=sample4' },
        { id: 'lec_2_3', title: 'Tailwind CSS Design Systems & Micro-Interactions (PDF)', type: 'pdf', duration_mins: 25, url: '/documents/notes/module-2-notes.pdf' }
      ],
      tasks: [
        { id: 'task_2', title: 'Interactive Real-Time Analytics Dashboard Component', description: 'Build a multi-metric dashboard with live search, filters, and theme switching.', deadline_days: 7, max_score: 100 }
      ],
      quiz: [
        { id: 'q_2_1', question: 'What is the primary benefit of useMemo in React?', options: ['Trigger re-renders', 'Memoize expensive calculation results', 'Bind event handlers', 'Fetch data automatically'], correct_index: 1 }
      ]
    },
    {
      id: 'mod_3',
      module_no: 3,
      title: 'Module 3: Scalable Backend Services with Node.js, Express & REST APIs',
      description: 'REST API conventions, middleware chains, input sanitization, rate limiting, and JWT authentication.',
      lectures: [
        { id: 'lec_3_1', title: 'Node.js Event-Driven Architecture & Non-Blocking I/O', type: 'video', duration_mins: 70, url: 'https://www.youtube.com/watch?v=sample5' },
        { id: 'lec_3_2', title: 'Building Robust REST APIs with Express, Zod Validation & Error Handlers', type: 'video', duration_mins: 85, url: 'https://www.youtube.com/watch?v=sample6' },
        { id: 'lec_3_3', title: 'Backend Security Checklist & OWASP Best Practices (PDF)', type: 'pdf', duration_mins: 35, url: '/documents/notes/module-3-notes.pdf' }
      ],
      tasks: [
        { id: 'task_3', title: 'Secure Multi-Tenant Auth Service with Refresh Tokens', description: 'Build endpoints with bcrypt hashing, JWT issuance, and rate limiting middleware.', deadline_days: 7, max_score: 100 }
      ],
      quiz: [
        { id: 'q_3_1', question: 'Which HTTP status code indicates unauthorized client credentials?', options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'], correct_index: 1 }
      ]
    },
    {
      id: 'mod_4',
      module_no: 4,
      title: 'Module 4: Relational Databases, Query Optimization & Data Modeling',
      description: 'Database design, 3NF normalization, foreign key constraints, indexing strategies, and ORM integrations.',
      lectures: [
        { id: 'lec_4_1', title: 'Relational Schema Design & ACID Transaction Guarantees', type: 'video', duration_mins: 75, url: 'https://www.youtube.com/watch?v=sample7' },
        { id: 'lec_4_2', title: 'Indexing Deep Dive: B-Trees, Compound Indexes & Explain Plans', type: 'video', duration_mins: 65, url: 'https://www.youtube.com/watch?v=sample8' },
        { id: 'lec_4_3', title: 'SQL Reference Guide & High-Performance Queries (PDF)', type: 'pdf', duration_mins: 40, url: '/documents/notes/module-4-notes.pdf' }
      ],
      tasks: [
        { id: 'task_4', title: 'High-Throughput E-Commerce Database Schema & Queries', description: 'Design tables for products, inventory, orders, and ledger with transactions.', deadline_days: 7, max_score: 100 }
      ],
      quiz: [
        { id: 'q_4_1', question: 'What does the WAL pragma in SQLite stand for?', options: ['Write And Lock', 'Write-Ahead Logging', 'Wide Area Location', 'Weighted Access Log'], correct_index: 1 }
      ]
    },
    {
      id: 'mod_5',
      module_no: 5,
      title: 'Module 5: Full Stack Capstone Project & Cloud Deployment (CI/CD)',
      description: 'End-to-end integration, environment isolation, automated testing, Docker containers, and live deployment.',
      lectures: [
        { id: 'lec_5_1', title: 'Containerizing Full-Stack Applications with Docker & Docker Compose', type: 'video', duration_mins: 90, url: 'https://www.youtube.com/watch?v=sample9' },
        { id: 'lec_5_2', title: 'Automated CI/CD Pipelines with GitHub Actions & Cloud Hosting', type: 'video', duration_mins: 80, url: 'https://www.youtube.com/watch?v=sample10' },
        { id: 'lec_5_3', title: 'Capstone Project Submission Guidelines & Rubric (PDF)', type: 'pdf', duration_mins: 30, url: '/documents/notes/capstone-guidelines.pdf' }
      ],
      tasks: [
        { id: 'task_5', title: 'Production Capstone Deployment & Live Demo Link', description: 'Submit GitHub repository with passing CI tests and public live URL.', deadline_days: 14, max_score: 100 }
      ],
      quiz: [
        { id: 'q_5_1', question: 'What is the purpose of multi-stage Docker builds?', options: ['Run multiple containers', 'Reduce final image size and separate build dependencies', 'Speed up network requests', 'Enable database replication'], correct_index: 1 }
      ]
    }
  ];

  insertBatch.run(
    batch1Id,
    'AAGAM-BATCH-2026-01',
    'Full Stack Web Engineering (Batch 2026-A)',
    int1Id,
    'internship',
    '2026-11-01',
    '2026-12-31',
    8,
    'Ayush Raj (Senior Lead)',
    'ayush.raj@aagamdigital.com',
    JSON.stringify(fullStackModules),
    100,
    0,
    'Active',
    now,
    now
  );

  insertBatch.run(
    batch2Id,
    'AAGAM-BATCH-2026-02',
    'AI & Machine Learning Mastery (Batch 2026-A)',
    int2Id,
    'internship',
    '2026-11-05',
    '2027-01-05',
    8,
    'Akash Verma (AI Research Lead)',
    'akash.verma@aagamdigital.com',
    JSON.stringify(fullStackModules),
    80,
    0,
    'Active',
    now,
    now
  );

  // 5. Training Programs
  const train1Id = uuidv4();
  const train2Id = uuidv4();
  const train3Id = uuidv4();

  const insertTraining = db.prepare(`
    INSERT INTO training_programs (id, slug, title, department, level, duration, fee_amount, is_free, description, syllabus, schedule, mentor_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
  `);

  insertTraining.run(
    train1Id,
    'modern-fullstack-mastery',
    'Enterprise Full-Stack Web Development Bootcamp',
    'Software Engineering',
    'Beginner to Advanced',
    '12 Weeks',
    0,
    1,
    'Intensive hands-on training covering TypeScript, React 18, Node.js, Next.js 14, PostgreSQL, and AWS deployment.',
    '["HTML5 & Semantic CSS3", "Modern JavaScript & TypeScript", "React 18 & State Management", "Node.js & Express REST APIs", "Database Architecture (PostgreSQL/MongoDB)", "CI/CD & Docker Deployment"]',
    'Mon-Fri: 6:00 PM - 8:00 PM IST',
    'Ayush Raj (Lead Architect)',
    now
  );

  insertTraining.run(
    train2Id,
    'genai-agentic-engineering',
    'Generative AI & Agentic Application Development',
    'AI & Deep Learning',
    'Intermediate to Advanced',
    '8 Weeks',
    0,
    1,
    'Build production AI agents with LangChain, LlamaIndex, OpenAI, Anthropic Claude, and Vector Databases.',
    '["LLM Foundations & Prompt Engineering", "Vector Embeddings & Semantic Search", "RAG (Retrieval-Augmented Generation)", "Autonomous Agents & Tool Calling", "Fine-Tuning & Quantization", "Deploying Enterprise AI APIs"]',
    'Weekend Intensive: Sat-Sun 10:00 AM - 1:00 PM IST',
    'Akash Verma (AI Lead)',
    now
  );

  insertTraining.run(
    train3Id,
    'devops-cloud-architect',
    'Cloud Native DevOps & Kubernetes Certification Prep',
    'Cloud Architecture',
    'All Levels',
    '8 Weeks',
    0,
    1,
    'Learn Linux administration, Docker containerization, Kubernetes orchestration, Terraform IaC, and CI/CD pipelines.',
    '["Linux Systems & Networking", "Docker Container Deep Dive", "Kubernetes Cluster Orchestration", "Infrastructure as Code with Terraform", "GitHub Actions CI/CD", "Cloud Monitoring with Prometheus & Grafana"]',
    'Mon-Wed-Fri: 7:00 PM - 9:00 PM IST',
    'Ayush Raj (Cloud Architect)',
    now
  );

  // 6. Seed System Settings
  const insertSetting = db.prepare(`
    INSERT OR REPLACE INTO system_settings (key, value, group_name, updated_at)
    VALUES (?, ?, ?, ?)
  `);

  insertSetting.run('company_name', 'AAGAM Digital Technology Private Limited', 'general', now);
  insertSetting.run('tagline', 'Learn • Build • Innovate', 'general', now);
  insertSetting.run('ceo_name', 'Ayush Raj', 'leadership', now);
  insertSetting.run('hr_head_name', 'Akash Verma', 'leadership', now);
  insertSetting.run('support_email', 'support@aagamdigitaltech.com', 'contact', now);
  insertSetting.run('admin_email', 'ramji.patel8002@gmail.com', 'security', now);
  insertSetting.run('portal_url', 'http://127.0.0.1:5173', 'system', now);

  console.log('[SEED] Baseline initialization complete. Pristine zero-data state established!');
  console.log('[SEED] Master Admin: ramji.patel8002@gmail.com | Password: Admin@123456');
}

export function seedDatabase() {
  resetAndSeedDatabase(false);
}
