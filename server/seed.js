/**
 * Seed script — creates 6 groups x 10 customers (60 total) with realistic
 * Malaysian names/phones, a mix of PENDING/COMPLETED follow-ups, and varied
 * subscription expiry dates so status logic + calendar are testable instantly.
 *
 * Run:  node server/seed.js
 */
import { db } from './db.js';
import { todayISO } from './utils/helpers.js';

function addDaysISO(baseISO, days) {
  const m = baseISO.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setDate(d.getDate() + days);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const today = todayISO();

// Group definitions — [name, description, completedCount (out of 10)]
const GROUPS = [
  ['Ahmad', 'Customer dari iklan Facebook', 10], // all completed -> GREEN
  ['Zaitun', 'Customer dari TikTok', 7],
  ['Ali', 'Customer dari Instagram', 5],
  ['Siti', 'Customer dari referral kawan', 8],
  ['Mei', 'Customer dari WhatsApp group', 3],
  ['Rizal', 'Customer dari Google Ads', 0], // all pending -> RED
];

const FIRST = [
  'Ahmad', 'Muhammad', 'Nur', 'Siti', 'Aisyah', 'Zainab', 'Fatimah', 'Ali',
  'Omar', 'Hassan', 'Hussein', 'Aminah', 'Khadijah', 'Maryam', 'Yusuf', 'Ibrahim',
  'Ismail', 'Hafiz', 'Farah', 'Nadia', 'Aiman', 'Syafiq', 'Amir', 'Daniel',
  'Izzah', 'Lina', 'Wan', 'Hakim', 'Rizal', 'Mei', 'Sarah', 'Melissa',
  'Johan', 'Arif', 'Syafiqah', 'Aqilah', 'Farid', 'Zaki', 'Rahman', 'Salim',
  'Fauzi', 'Kamal', 'Nordin', 'Roslan', 'Adam', 'Idris', 'Sofea', 'Balqis',
  'Wei', 'Ling', 'Chong', 'Tan', 'Raj', 'Devi', 'Kumar', 'Suresh', 'Anita', 'Priya',
];
const LAST = [
  'bin Abdullah', 'binti Hassan', 'bin Ismail', 'binti Omar', 'bin Yusof', 'binti Ali',
  'bin Zainal', 'binti Rahman', 'bin Salleh', 'binti Ahmad', 'Lee', 'Wong', 'Lim', 'Tan',
  'Naidu', 'Krishnan', 'A/L Muthu', 'A/P Devi', 'bin Rahim', 'binti Karim', 'bin Osman',
];

const EXPIRY_OFFSETS = [-12, -4, +2, +5, +15, +30, +60, +90, +180, +365];
const PHONE_PREFIX = ['012', '013', '014', '016', '017', '018', '019', '011'];

function makePhone(i) {
  const prefix = PHONE_PREFIX[i % PHONE_PREFIX.length];
  const body = String(1000000 + i * 137).slice(-7);
  return prefix + body;
}

function makeName(i) {
  const f = FIRST[(i * 7 + 3) % FIRST.length];
  const l = LAST[(i * 5 + 1) % LAST.length];
  return `${f} ${l}`.trim();
}

// ---- Reset existing data ----
db.exec('PRAGMA foreign_keys = OFF;');
db.prepare('DELETE FROM follow_up_history').run();
db.prepare('DELETE FROM customers').run();
db.prepare('DELETE FROM groups').run();
db.prepare('DELETE FROM sqlite_sequence').run();
db.exec('PRAGMA foreign_keys = ON;');

const insertGroup = db.prepare('INSERT INTO groups (name, description) VALUES (?, ?)');
const insertCustomer = db.prepare(
  `INSERT INTO customers
   (group_id, name, phone, email_subscribe, email_family, subscribe_date, expiry_date, follow_up_status, last_follow_up_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertHistory = db.prepare(
  `INSERT INTO follow_up_history (customer_id, action, note, created_at) VALUES (?, ?, ?, ?)`
);

let customerIndex = 0;
for (const [gName, gDesc, completedCount] of GROUPS) {
  const gInfo = insertGroup.run(gName, gDesc);
  const groupId = gInfo.lastInsertRowid;

  for (let k = 0; k < 10; k++) {
    const isCompleted = k < completedCount;
    const expiry = addDaysISO(today, EXPIRY_OFFSETS[k % EXPIRY_OFFSETS.length]);
    const subscribe = addDaysISO(expiry, -365);

    const name = makeName(customerIndex);
    const phone = makePhone(customerIndex);
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 12);
    const emailSubscribe = `${slug}${customerIndex}@gmail.com`;
    const emailFamily = `family.${slug}@yahoo.com`;

    let lastFollowUp = null;
    if (isCompleted) {
      const followUpDay = addDaysISO(today, -(customerIndex % 25));
      const hh = String(9 + (customerIndex % 10)).padStart(2, '0');
      lastFollowUp = `${followUpDay} ${hh}:${String((customerIndex * 7) % 60).padStart(2, '0')}:00`;
    }

    const cInfo = insertCustomer.run(
      groupId,
      name,
      phone,
      emailSubscribe,
      emailFamily,
      subscribe,
      expiry,
      isCompleted ? 'COMPLETED' : 'PENDING',
      lastFollowUp
    );

    // History entry for completed customers (feeds the calendar).
    if (isCompleted) {
      insertHistory.run(cInfo.lastInsertRowid, 'FOLLOW_UP', 'Follow up melalui WhatsApp', lastFollowUp);
    }
    customerIndex++;
  }
}

const gCount = db.prepare('SELECT COUNT(*) AS n FROM groups').get().n;
const cCount = db.prepare('SELECT COUNT(*) AS n FROM customers').get().n;
const hCount = db.prepare('SELECT COUNT(*) AS n FROM follow_up_history').get().n;
console.log(`✅ Seed selesai: ${gCount} groups, ${cCount} customers, ${hCount} history entries.`);
