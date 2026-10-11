import { db } from './database';

export function syncBatchesToInternships() {
  console.log('[SYNC] Starting batch-to-internship synchronization...');

  // 1. Remove old orphaned batch internships that do not match existing batch IDs
  const batches = db.prepare('SELECT * FROM batches').all() as any[];
  const batchIds = batches.map((b) => b.id);

  if (batchIds.length === 0) {
    db.prepare("DELETE FROM internships WHERE slug LIKE 'aagam-batch-%' OR id NOT IN ('int-1', 'int-2', 'int-3', 'int-4')").run();
    console.log('[SYNC] No active batches found. Cleaned orphaned batch internships.');
    return;
  }

  // Delete orphaned internships that have aagam-batch- in slug but ID does not match any current batch
  const placeholders = batchIds.map(() => '?').join(',');
  db.prepare(`DELETE FROM internships WHERE slug LIKE 'aagam-batch-%' AND id NOT IN (${placeholders})`).run(...batchIds);

  const now = new Date().toISOString();

  // 2. Insert/Upsert each batch into internships
  for (const b of batches) {
    const slug = b.batch_code.toLowerCase();
    const dept = b.department || 'Software Engineering';

    db.prepare(`
      INSERT INTO internships (
        id, slug, title, department, technology, description, full_description,
        duration, eligibility, skills_required, mode, location, start_date,
        application_deadline, total_seats, filled_seats, fee_amount, is_paid,
        required_documents, ocr_enabled, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Remote', 'Online Live', ?, ?, ?, 0, 0, 0, '["NOC","College_ID","Resume"]', 1, 'Active', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        title = excluded.title,
        department = excluded.department,
        start_date = excluded.start_date,
        updated_at = excluded.updated_at
    `).run(
      b.id,
      slug,
      b.title,
      dept,
      dept,
      `Live Cohort Batch (${b.batch_code}) under instructor ${b.instructor_name || 'Ayush Raj'}.`,
      `Cohort Batch Code: ${b.batch_code}\nInstructor: ${b.instructor_name || 'Ayush Raj'}\nTimeline: ${b.start_date} to ${b.end_date}`,
      `${b.duration_weeks || 8} Weeks`,
      'Open to B.Tech, BCA, MCA, B.Sc & M.Sc Students',
      dept,
      b.start_date,
      b.start_date,
      b.max_seats || 60,
      now,
      now
    );

    console.log(`[SYNC] Synced batch ${b.batch_code} (${b.title}) [ID: ${b.id}] to internships table.`);
  }

  console.log('[SYNC] Synchronization completed successfully.');
}

if (require.main === module) {
  syncBatchesToInternships();
}
