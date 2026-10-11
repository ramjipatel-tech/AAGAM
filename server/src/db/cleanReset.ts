import { db } from './database';

export function cleanResetDatabase() {
  console.log('--- PURGING TEST DATA FOR FRESH COHORT & STUDENT ONBOARDING ---');

  db.pragma('foreign_keys = OFF');

  const tablesToClear = [
    'certificates',
    'lors',
    'offer_letters',
    'batch_enrollments',
    'batches',
    'task_submissions',
    'quiz_attempts',
    'application_documents',
    'internship_applications',
    'students',
    'payments',
    'email_logs',
    'otp_verifications',
  ];

  for (const table of tablesToClear) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
      console.log(`🧹 Cleared table: ${table}`);
    } catch (e: any) {
      console.warn(`Could not clear table ${table}: ${e.message}`);
    }
  }

  // Delete test student users only (preserve admin and staff!)
  const deletedStudents = db.prepare("DELETE FROM users WHERE role = 'student'").run();
  console.log(`🧹 Removed ${deletedStudents.changes} student test user account(s). Admin & staff accounts preserved.`);

  // Reset seats count on internships and delete batch-linked dynamic entries
  try {
    db.prepare("DELETE FROM internships WHERE slug LIKE 'aagam-batch-%' OR id NOT IN ('int-1', 'int-2', 'int-3', 'int-4')").run();
    db.prepare('UPDATE internships SET filled_seats = 0').run();
    console.log('🧹 Reset filled_seats on all internship programs and purged temporary cohort internships.');
  } catch (e) {}

  // Vacuum and optimize
  db.pragma('foreign_keys = ON');
  db.prepare('VACUUM').run();

  console.log('--- DATABASE SUCCESSFULLY RESET FOR CLEAN RE-TESTING ---');
}

if (require.main === module) {
  cleanResetDatabase();
}
