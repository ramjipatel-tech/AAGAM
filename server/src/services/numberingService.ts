import { db } from '../db/database';

export function generateRegistrationNo(): string {
  const year = new Date().getFullYear();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM internship_applications').get() as { count: number };
  const seq = (countRow.count + 1).toString().padStart(6, '0');
  return `AAGAM-INT-${year}-${seq}`;
}

export function generateOfferId(): string {
  const year = new Date().getFullYear();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM offer_letters').get() as { count: number };
  const seq = (countRow.count + 1).toString().padStart(6, '0');
  return `AAGAM-OFFER-${year}-${seq}`;
}

export function generatePaymentNo(): string {
  const year = new Date().getFullYear();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM payments').get() as { count: number };
  const seq = (countRow.count + 1).toString().padStart(6, '0');
  return `AAGAM-PAY-${year}-${seq}`;
}

export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM certificates').get() as { count: number };
  const seq = (countRow.count + 1).toString().padStart(6, '0');
  return `AAGAM-CERT-${year}-${seq}`;
}

export function generateLorId(): string {
  const year = new Date().getFullYear();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM lors').get() as { count: number };
  const seq = (countRow.count + 1).toString().padStart(6, '0');
  return `AAGAM-LOR-${year}-${seq}`;
}
