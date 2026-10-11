import { v4 as uuidv4 } from 'uuid';
import { db } from './database';

export function seedTasksAndQuizzes() {
  const now = new Date().toISOString();

  // Check if tasks already exist
  const existingTasks = db.prepare('SELECT COUNT(*) as count FROM internship_tasks').get() as { count: number };
  if (existingTasks.count === 0) {
    const insertTask = db.prepare(`
      INSERT INTO internship_tasks (id, internship_id, title, description, week_no, due_date, max_points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTask.run(
      uuidv4(),
      null,
      'Week 1: Git Workflow, Branching Strategy & Clean Architecture Setup',
      'Set up your local repository, configure ESLint & Prettier, establish feature branch rules, and build standard folder hierarchy (Controller-Service-Repository).',
      1,
      'Day 7',
      100,
      now
    );

    insertTask.run(
      uuidv4(),
      null,
      'Week 2: Secure JWT Authentication, Role-Based Access Control & DB Migrations',
      'Implement password hashing with bcrypt, stateless JWT token generation, auth middleware, and write SQLite/PostgreSQL migration scripts.',
      2,
      'Day 14',
      100,
      now
    );

    insertTask.run(
      uuidv4(),
      null,
      'Week 3: RESTful API Optimization, Error Handling & File Upload Engine',
      'Build scalable REST endpoints with parameterized queries, input validation, structured error responses, and secure multer file upload pipeline.',
      3,
      'Day 21',
      100,
      now
    );

    insertTask.run(
      uuidv4(),
      null,
      'Week 4: Capstone Project Deployment, Docker Containerization & Live Demo',
      'Containerize your application using Docker multi-stage builds, deploy to Vercel/Render, and submit live demo URL with architecture diagram.',
      4,
      'Day 30',
      100,
      now
    );

    console.log('[SEED] Tasks populated successfully.');
  }

  // Check if quizzes already exist
  const existingQuizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes').get() as { count: number };
  if (existingQuizzes.count === 0) {
    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (id, internship_id, title, questions_json, passing_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const questions = [
      {
        question: 'Which of the following prevents SQL Injection vulnerabilities in database operations?',
        options: [
          'Direct string concatenation in SQL queries',
          'Parameterized queries / Prepared statements with placeholders',
          'Disabling database foreign key constraints',
          'Storing SQL queries in client cookies'
        ],
        correctAnswer: 1,
      },
      {
        question: 'In modern Node.js web applications, why should passwords never be stored in plain text?',
        options: [
          'Plaintext takes more storage space than hashes',
          'Security best practice dictates cryptographic one-way hashing with salt (e.g. bcrypt) to prevent credential leaks',
          'Database engines automatically reject plaintext passwords',
          'Plaintext passwords prevent HTTP keep-alive connections'
        ],
        correctAnswer: 1,
      },
      {
        question: 'What is the primary function of an HMAC-SHA256 signature in payment gateways like Razorpay?',
        options: [
          'To compress the payment receipt PDF',
          'To cryptographically verify on the backend that payment response data was not tampered with on the client',
          'To speed up user login times',
          'To hide the payment amount from the database'
        ],
        correctAnswer: 1,
      },
      {
        question: 'What is the purpose of an NOC (No Objection Certificate) in corporate internship compliance?',
        options: [
          'To waive student tuition fees',
          'To formally certify university authorization for academic credit transfers and industry training compliance',
          'To replace the student resume',
          'To register domain names'
        ],
        correctAnswer: 1,
      }
    ];

    insertQuiz.run(
      uuidv4(),
      null,
      'Engineering Principles, Security & System Architecture Checkpoint',
      JSON.stringify(questions),
      75,
      now
    );

    console.log('[SEED] Quizzes populated successfully.');
  }
}

if (require.main === module) {
  seedTasksAndQuizzes();
}
