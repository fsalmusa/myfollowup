/**
 * Group routes — CRUD + live stats.
 */
import { Router } from 'express';
import { db, shapeGroup, groupStats } from '../db.js';
import { enrichCustomer } from '../utils/helpers.js';

export const groupsRouter = Router();

// List all groups (with live stats). Optional ?search= filter on name/description.
groupsRouter.get('/', (req, res) => {
  const search = (req.query.search || '').toString().trim().toLowerCase();
  let rows;
  if (search) {
    rows = db
      .prepare(
        `SELECT * FROM groups
         WHERE lower(name) LIKE ? OR lower(description) LIKE ?
         ORDER BY name COLLATE NOCASE`
      )
      .all(`%${search}%`, `%${search}%`);
  } else {
    rows = db.prepare('SELECT * FROM groups ORDER BY name COLLATE NOCASE').all();
  }
  res.json(rows.map(shapeGroup));
});

// Create a group.
groupsRouter.post('/', (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const description = String(req.body?.description ?? '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Nama Group diperlukan.' });
  }

  const info = db
    .prepare('INSERT INTO groups (name, description) VALUES (?, ?)')
    .run(name, description);
  const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(shapeGroup(row));
});

// Get a single group detail.
groupsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Group tidak dijumpai.' });
  res.json(shapeGroup(row));
});

// Update a group.
groupsRouter.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Group tidak dijumpai.' });

  const name = String(req.body?.name ?? existing.name).trim();
  const description =
    req.body?.description === undefined
      ? existing.description
      : String(req.body.description).trim();

  if (!name) return res.status(400).json({ error: 'Nama Group diperlukan.' });

  db.prepare('UPDATE groups SET name = ?, description = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    name,
    description,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  res.json(shapeGroup(row));
});

// Delete a group (customers cascade). Returns count of deleted customers for confirmation.
groupsRouter.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Group tidak dijumpai.' });

  const { total_customers } = groupStats(req.params.id);
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.json({ deleted: true, deleted_customers: total_customers });
});

// Customers belonging to a group (used by the Group Detail page).
groupsRouter.get('/:id/customers', (req, res) => {
  const existing = db.prepare('SELECT id FROM groups WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Group tidak dijumpai.' });

  const search = (req.query.search || '').toString().trim().toLowerCase();
  const status = (req.query.status || '').toString().toUpperCase();

  let sql = `SELECT c.*, g.name AS group_name FROM customers c
             JOIN groups g ON g.id = c.group_id
             WHERE c.group_id = ?`;
  const params = [req.params.id];

  if (search) {
    sql += ` AND (lower(c.name) LIKE ? OR lower(c.phone) LIKE ? OR lower(c.email_subscribe) LIKE ? OR lower(c.email_family) LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (status === 'PENDING' || status === 'COMPLETED') {
    sql += ` AND c.follow_up_status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY CASE c.follow_up_status WHEN 'PENDING' THEN 0 ELSE 1 END, c.name COLLATE NOCASE`;

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(enrichCustomer));
});
