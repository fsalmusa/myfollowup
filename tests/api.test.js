/**
 * Integration test suite — boots a real server on a throwaway DB and exercises
 * every major feature via HTTP. Run with:  npm test
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.join(__dirname, '..', 'server');
const PORT = 3999;
const BASE = `http://localhost:${PORT}`;

const tmp = mkdtempSync(path.join(tmpdir(), 'crm-test-'));
const DB_PATH = path.join(tmp, 'test.db');

let pass = 0;
let fail = 0;

async function j(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${url}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function run(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

function spawnOnce(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, ...(opts.env || {}) },
      stdio: 'pipe',
    });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}: ${stderr}`))
    );
  });
}

async function waitForHealth() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server tidak dapat dijalankan.');
}

function subDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function main() {
  console.log(`\n🔧 DB test: ${DB_PATH}\n`);

  await spawnOnce('node', ['seed.js'], { cwd: SERVER_DIR, env: { DB_PATH, DB_RESET: '1' } });

  const server = spawn('node', ['index.js'], {
    cwd: SERVER_DIR,
    env: { ...process.env, DB_PATH, PORT: String(PORT) },
    stdio: 'ignore',
  });
  await waitForHealth();

  try {
    // ============ BASELINE ============
    const baseStats = (await j('GET', '/api/stats')).data;
    run('Seed: 6 groups / 60 customers', baseStats.total_groups === 6 && baseStats.total_customers === 60, JSON.stringify(baseStats));
    run('Seed: 33 dah follow up / 27 belum', baseStats.followed_up === 33 && baseStats.not_followed_up === 27, JSON.stringify(baseStats));

    // ============ 1. ADD GROUP + validation ============
    let testGroup = (await j('POST', '/api/groups', { name: 'Test Group', description: 'uji' })).data;
    run('1. Add group', testGroup.id && testGroup.status === 'KOSONG' && testGroup.total_customers === 0);
    run('Add group: reject empty name (400)', (await j('POST', '/api/groups', { name: '   ' })).status === 400);

    // ============ 2. EDIT GROUP ============
    testGroup = (await j('PUT', `/api/groups/${testGroup.id}`, { name: 'Test Group Edit', description: 'updated' })).data;
    run('2. Edit group', testGroup.name === 'Test Group Edit' && testGroup.description === 'updated');

    // ============ 19. EMPTY STATES ============
    const emptyCustomers = (await j('GET', `/api/groups/${testGroup.id}/customers`)).data;
    run('19. Empty group -> no customers', Array.isArray(emptyCustomers) && emptyCustomers.length === 0);

    // ============ 3. DELETE GROUP ============
    const delEmpty = await j('DELETE', `/api/groups/${testGroup.id}`);
    run('3. Delete group (empty)', delEmpty.data.deleted === true && delEmpty.data.deleted_customers === 0);

    // ============ 4. OPEN GROUP (seed colour logic) ============
    const groups = (await j('GET', '/api/groups')).data;
    const ahmad = groups.find((x) => x.name === 'Ahmad');
    const zaitun = groups.find((x) => x.name === 'Zaitun');
    run('4a. Group Ahmad = GREEN (0 pending)', ahmad.color === 'green' && ahmad.status === 'SELESAI' && ahmad.pending === 0);
    run('4b. Group Zaitun = RED (has pending)', zaitun.color === 'red' && zaitun.pending > 0);
    const ahmadCustomers = (await j('GET', `/api/groups/${ahmad.id}/customers`)).data;
    run('4c. Ahmad has 10 customers', ahmadCustomers.length === 10);

    // ============ Dedicated "Ujian" group for mutation tests ============
    const ujian = (await j('POST', '/api/groups', { name: 'Ujian', description: 'group ujian' })).data;
    const flip = (await j('POST', '/api/groups', { name: 'Flip Test', description: 'flip' })).data;

    // ============ 5. ADD CUSTOMER ============
    const cust = (await j('POST', '/api/customers', {
      group_id: ujian.id,
      name: 'Uji Pelanggan',
      phone: '0123456789',
      email_subscribe: 'uji@gmail.com',
      email_family: 'family.uji@yahoo.com',
      subscribe_date: '2026-09-01',
      expiry_date: '2027-09-01',
    })).data;
    run('5. Add customer', cust.id && cust.follow_up_status === 'PENDING');
    run('Add customer: reject empty name (400)', (await j('POST', '/api/customers', { group_id: ujian.id, name: '' })).status === 400);

    // ============ 11. WHATSAPP LINK ============
    run('11. WhatsApp link 0123456789 -> 60123456789', cust.whatsapp_link === 'https://wa.me/60123456789', cust.whatsapp_link);
    const noPhone = (await j('POST', '/api/customers', { group_id: ujian.id, name: 'Tanpa Nombor' })).data;
    run('11. WhatsApp link empty for empty phone', noPhone.whatsapp_link === '');

    // ============ 6. EDIT CUSTOMER ============
    const editedCust = (await j('PUT', `/api/customers/${cust.id}`, { name: 'Uji Pelanggan Edit', phone: '60123334444' })).data;
    run('6. Edit customer', editedCust.name === 'Uji Pelanggan Edit' && editedCust.phone === '60123334444');

    // ============ 8. SEARCH ============
    const searchByName = (await j('GET', `/api/groups/${ujian.id}/customers?search=Uji`)).data;
    run('8. Search customer by name', searchByName.length === 1 && searchByName[0].id === cust.id);
    const searchByEmail = (await j('GET', `/api/customers?search=uji@gmail.com`)).data;
    run('8. Search by email', searchByEmail.total >= 1);

    // ============ 9/10. FILTER PENDING / COMPLETED ============
    const zaitunPending = (await j('GET', `/api/groups/${zaitun.id}/customers?status=PENDING`)).data;
    run('9. Filter PENDING', zaitunPending.length === zaitun.pending && zaitunPending.every((c) => c.follow_up_status === 'PENDING'));
    const ahmadCompleted = (await j('GET', `/api/groups/${ahmad.id}/customers?status=COMPLETED`)).data;
    run('10. Filter COMPLETED', ahmadCompleted.every((c) => c.follow_up_status === 'COMPLETED'));

    // ============ 15. Group RED when pending exists ============
    const flipCust = (await j('POST', '/api/customers', { group_id: flip.id, name: 'Flip Customer' })).data;
    let flipGroup = (await j('GET', `/api/groups/${flip.id}`)).data;
    run('15. Group RED when any pending', flipGroup.color === 'red' && flipGroup.pending === 1);

    // ============ 12. FOLLOW UP -> COMPLETED ============
    const followRes = (await j('POST', `/api/customers/${flipCust.id}/followup`, { status: 'COMPLETED', note: 'WhatsApp customer' })).data;
    run('12. Follow up -> COMPLETED + last_follow_up_at set', followRes.customer.follow_up_status === 'COMPLETED' && !!followRes.customer.last_follow_up_at);
    // ============ 14. Group GREEN when all completed ============
    flipGroup = (await j('GET', `/api/groups/${flip.id}`)).data;
    run('14. Group turns GREEN when all completed', flipGroup.color === 'green' && flipGroup.pending === 0);

    // ============ 13. UNDO FOLLOW UP ============
    const undoRes = (await j('POST', `/api/customers/${flipCust.id}/followup`, { status: 'PENDING' })).data;
    run('13. Undo follow up -> PENDING + last cleared', undoRes.customer.follow_up_status === 'PENDING' && undoRes.customer.last_follow_up_at === null);
    flipGroup = (await j('GET', `/api/groups/${flip.id}`)).data;
    run('15. Group RED again after undo', flipGroup.color === 'red' && flipGroup.pending === 1);

    // ============ 18. FOLLOW-UP HISTORY ============
    const history = (await j('GET', `/api/customers/${flipCust.id}/history`)).data;
    run('18. History records FOLLOW_UP + UNFOLLOW_UP', history.some((h) => h.action === 'FOLLOW_UP') && history.some((h) => h.action === 'UNFOLLOW_UP'));
    const noteRes = await j('POST', `/api/customers/${flipCust.id}/history`, { note: 'Nota manual' });
    run('18. Add manual note to history', noteRes.status === 201 && noteRes.data.action === 'NOTE');

    // ============ 17. SUBSCRIPTION STATUS ============
    const makeSub = async (expiry) => (await j('POST', '/api/customers', { group_id: ujian.id, name: `Sub ${expiry}`, expiry_date: expiry })).data;
    const past = await makeSub('2020-01-01');
    const soon = await makeSub(subDate(+3));
    const future = await makeSub(subDate(+90));
    run('17. EXPIRED (past)', past.subscription_status === 'EXPIRED' && past.subscription_label === 'Expired');
    run('17. EXPIRING_SOON (<=7 days)', soon.subscription_status === 'EXPIRING_SOON' && soon.subscription_label === 'Akan Expired');
    run('17. ACTIVE (>7 days)', future.subscription_status === 'ACTIVE' && future.subscription_label === 'Masih Aktif');

    // ============ 16. DASHBOARD COUNTERS (dynamic) ============
    // Added: Uji Pelanggan, Tanpa Nombor, Flip Customer, Sub x3 = 6 customers
    const statsAfter = (await j('GET', '/api/stats')).data;
    run('16. Dashboard counters update dynamically', statsAfter.total_customers === baseStats.total_customers + 6, `${baseStats.total_customers} -> ${statsAfter.total_customers}`);

    // ============ 7. DELETE CUSTOMER ============
    const delCust = await j('DELETE', `/api/customers/${cust.id}`);
    run('7. Delete customer', delCust.data.deleted === true);
    run('7. Deleted customer -> 404', (await j('GET', `/api/customers/${cust.id}`)).status === 404);

    // ============ CALENDAR ============
    const cal = (await j('GET', '/api/calendar')).data;
    run('Calendar: has entries + days', cal.entries >= 0 && typeof cal.days === 'object');

    // ============ GLOBAL LIST PAGINATION ============
    const page1 = (await j('GET', '/api/customers?limit=25&page=1')).data;
    run('Global list pagination', page1.total > 0 && page1.data.length <= 25 && page1.total_pages >= 1);
  } finally {
    server.kill('SIGTERM');
  }

  console.log(`\n=====================================`);
  console.log(`✅ PASS: ${pass}   ❌ FAIL: ${fail}`);
  console.log(`=====================================\n`);

  rmSync(tmp, { recursive: true, force: true });
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('❌ Test suite gagal:', e);
  rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
});
