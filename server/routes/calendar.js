/**
 * Calendar route — follow-up activity grouped by date for a month.
 * Source of truth: follow_up_history table.
 */
import { Router } from 'express';
import { db } from '../db.js';

export const calendarRouter = Router();

// GET /api/calendar?month=YYYY-MM  (defaults to current month)
calendarRouter.get('/', (req, res) => {
  let month = (req.query.month || '').toString();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    const now = new Date();
    month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  const start = `${month}-01`;
  // Next month start (handles Dec -> Jan).
  const [y, m] = month.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;

  const rows = db
    .prepare(
      `SELECT h.id, h.action, h.note, h.created_at,
              date(h.created_at) AS day,
              c.id AS customer_id, c.name AS customer_name,
              g.name AS group_name
       FROM follow_up_history h
       JOIN customers c ON c.id = h.customer_id
       JOIN groups g ON g.id = c.group_id
       WHERE h.created_at >= ? AND h.created_at < ?
       ORDER BY h.created_at ASC, h.id ASC`
    )
    .all(start, next);

  // Group entries by day and attach a friendly time.
  const days = {};
  const seen = new Set();
  for (const r of rows) {
    const t = String(r.created_at).match(/(\d{2}:\d{2})/);
    const entry = {
      id: r.id,
      action: r.action,
      note: r.note,
      time: t ? t[1] : '',
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      group_name: r.group_name,
    };
    (days[r.day] = days[r.day] || []).push(entry);
    seen.add(r.customer_id);
  }

  res.json({ month, entries: rows.length, customer_count: seen.size, days });
});
