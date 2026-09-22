/**
 * Customer routes — CRUD, follow-up toggle, history, global list with filters.
 */
import { Router } from 'express';
import { db, shapeGroup } from '../db.js';
import { enrichCustomer } from '../utils/helpers.js';

export const customersRouter = Router();

function getCustomerOr404(id) {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  return row || null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanDates(body) {
  const out = {};
  for (const key of ['subscribe_date', 'expiry_date']) {
    const v = body[key];
    if (v === undefined || v === null || v === '') {
      out[key] = '';
    } else {
      const s = String(v).trim();
      if (!DATE_RE.test(s)) {
        const err = new Error(
          key === 'subscribe_date'
            ? 'Format Tarikh Subscribe tidak sah. Guna YYYY-MM-DD.'
            : 'Format Tarikh Expired tidak sah. Guna YYYY-MM-DD.'
        );
        err.status = 400;
        throw err;
      }
      out[key] = s;
    }
  }
  return out;
}

// ---- Global list (Senarai Customer) ----
// Query params: search, group_id, follow_up_status, subscription_status, sort, page, limit
customersRouter.get('/', (req, res) => {
  const search = (req.query.search || '').toString().trim().toLowerCase();
  const groupId = req.query.group_id ? Number(req.query.group_id) : null;
  const followup = (req.query.follow_up_status || '').toString().toUpperCase();
  const subStatus = (req.query.subscription_status || '').toString().toUpperCase();
  const sort = (req.query.sort || 'name').toString();

  let sql = `SELECT c.*, g.name AS group_name FROM customers c
             JOIN groups g ON g.id = c.group_id WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (lower(c.name) LIKE ? OR lower(c.phone) LIKE ? OR lower(c.email_subscribe) LIKE ? OR lower(c.email_family) LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (groupId) {
    sql += ` AND c.group_id = ?`;
    params.push(groupId);
  }
  if (followup === 'PENDING' || followup === 'COMPLETED') {
    sql += ` AND c.follow_up_status = ?`;
    params.push(followup);
  }

  let rows = db.prepare(sql).all(...params).map(enrichCustomer);

  // Subscription status is derived — filter in JS.
  if (subStatus === 'ACTIVE' || subStatus === 'EXPIRING_SOON' || subStatus === 'EXPIRED') {
    rows = rows.filter((r) => r.subscription_status === subStatus);
  }

  // Sort (pending-first is the default).
  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name, 'ms'),
    subscribe_date: (a, b) => (a.subscribe_date || '').localeCompare(b.subscribe_date || ''),
    expiry_date: (a, b) => (a.expiry_date || '').localeCompare(b.expiry_date || ''),
    follow_up_status: (a, b) =>
      a.follow_up_status === b.follow_up_status
        ? a.name.localeCompare(b.name, 'ms')
        : a.follow_up_status === 'PENDING'
          ? -1
          : 1,
  };
  const baseSorter = (a, b) =>
    a.follow_up_status === b.follow_up_status
      ? a.name.localeCompare(b.name, 'ms')
      : a.follow_up_status === 'PENDING'
        ? -1
        : 1;
  rows.sort(sorters[sort] || baseSorter);

  // Pagination.
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const page = Math.max(1, Number(req.query.page) || 1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit);

  res.json({ data, total, page, limit, total_pages: totalPages });
});

// ---- Create customer ----
customersRouter.post('/', (req, res, next) => {
  try {
    const body = req.body || {};
    const name = String(body.name ?? '').trim();
    const groupId = body.group_id ? Number(body.group_id) : null;

    if (!name) return res.status(400).json({ error: 'Nama customer diperlukan.' });
    if (!groupId) return res.status(400).json({ error: 'Group diperlukan.' });

    const group = db.prepare('SELECT id FROM groups WHERE id = ?').get(groupId);
    if (!group) return res.status(400).json({ error: 'Group tidak wujud.' });

    const dates = cleanDates(body);
    const phone = String(body.phone ?? '').replace(/\s+/g, '').trim();
    const emailSubscribe = String(body.email_subscribe ?? '').trim();
    const emailFamily = String(body.email_family ?? '').trim();

    const info = db
      .prepare(
        `INSERT INTO customers
         (group_id, name, phone, email_subscribe, email_family, subscribe_date, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(groupId, name, phone, emailSubscribe, emailFamily, dates.subscribe_date, dates.expiry_date);

    const row = getCustomerOr404(info.lastInsertRowid);
    res.status(201).json(enrichCustomer(row));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

// ---- Get single customer detail (+ history) ----
customersRouter.get('/:id', (req, res) => {
  const row = getCustomerOr404(req.params.id);
  if (!row) return res.status(404).json({ error: 'Customer tidak dijumpai.' });
  const history = db
    .prepare('SELECT * FROM follow_up_history WHERE customer_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.params.id);
  res.json({ ...enrichCustomer(row), history });
});

// ---- Update customer (supports "Pindah Group" via group_id) ----
customersRouter.put('/:id', (req, res, next) => {
  try {
    const existing = getCustomerOr404(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Customer tidak dijumpai.' });

    const body = req.body || {};
    const name = String(body.name ?? existing.name).trim();
    if (!name) return res.status(400).json({ error: 'Nama customer diperlukan.' });

    let groupId = existing.group_id;
    if (body.group_id !== undefined && body.group_id !== null && body.group_id !== '') {
      groupId = Number(body.group_id);
      const g = db.prepare('SELECT id FROM groups WHERE id = ?').get(groupId);
      if (!g) return res.status(400).json({ error: 'Group destinasi tidak wujud.' });
    }

    const dates = cleanDates({
      subscribe_date: body.subscribe_date ?? existing.subscribe_date,
      expiry_date: body.expiry_date ?? existing.expiry_date,
    });
    const phone =
      body.phone !== undefined ? String(body.phone).replace(/\s+/g, '').trim() : existing.phone;
    const emailSubscribe =
      body.email_subscribe !== undefined ? String(body.email_subscribe).trim() : existing.email_subscribe;
    const emailFamily =
      body.email_family !== undefined ? String(body.email_family).trim() : existing.email_family;

    db.prepare(
      `UPDATE customers SET group_id=?, name=?, phone=?, email_subscribe=?, email_family=?,
       subscribe_date=?, expiry_date=?, updated_at=datetime('now') WHERE id=?`
    ).run(groupId, name, phone, emailSubscribe, emailFamily, dates.subscribe_date, dates.expiry_date, req.params.id);

    const row = getCustomerOr404(req.params.id);
    res.json(enrichCustomer(row));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

// ---- Delete customer ----
customersRouter.delete('/:id', (req, res) => {
  const existing = getCustomerOr404(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer tidak dijumpai.' });
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// ---- Toggle / set follow-up status (core feature) ----
// Body: { status: 'COMPLETED' | 'PENDING', note?: string }
customersRouter.post('/:id/followup', (req, res) => {
  const existing = getCustomerOr404(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer tidak dijumpai.' });

  const body = req.body || {};
  let target = String(body.status || '').toUpperCase();
  if (target !== 'COMPLETED' && target !== 'PENDING') {
    // Toggle when no explicit status provided.
    target = existing.follow_up_status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
  }
  const note = String(body.note ?? '').trim();

  const now = new Date().toISOString();
  if (target === 'COMPLETED') {
    db.prepare(
      `UPDATE customers SET follow_up_status='COMPLETED', last_follow_up_at=?, updated_at=datetime('now') WHERE id=?`
    ).run(now, req.params.id);
    db.prepare(
      `INSERT INTO follow_up_history (customer_id, action, note) VALUES (?, 'FOLLOW_UP', ?)`
    ).run(req.params.id, note);
  } else {
    db.prepare(
      `UPDATE customers SET follow_up_status='PENDING', last_follow_up_at=NULL, updated_at=datetime('now') WHERE id=?`
    ).run(req.params.id);
    db.prepare(
      `INSERT INTO follow_up_history (customer_id, action, note) VALUES (?, 'UNFOLLOW_UP', ?)`
    ).run(req.params.id, note || 'Ditanda semula sebagai belum follow up');
  }

  const row = getCustomerOr404(req.params.id);
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(row.group_id);
  res.json({
    customer: enrichCustomer(row),
    group: shapeGroup(group),
  });
});

// ---- Follow-up history ----
customersRouter.get('/:id/history', (req, res) => {
  const existing = getCustomerOr404(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer tidak dijumpai.' });
  const history = db
    .prepare('SELECT * FROM follow_up_history WHERE customer_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.params.id);
  res.json(history);
});

// ---- Add a manual note to history ----
customersRouter.post('/:id/history', (req, res) => {
  const existing = getCustomerOr404(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer tidak dijumpai.' });
  const note = String(req.body?.note ?? '').trim();
  if (!note) return res.status(400).json({ error: 'Nota diperlukan.' });
  const info = db
    .prepare(`INSERT INTO follow_up_history (customer_id, action, note) VALUES (?, 'NOTE', ?)`)
    .run(req.params.id, note);
  const row = db.prepare('SELECT * FROM follow_up_history WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});
