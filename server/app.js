/**
 * Express app factory — API + static SPA server.
 * Separated from the listen call so tests can import and boot on an ephemeral port.
 */
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { groupsRouter } from './routes/groups.js';
import { customersRouter } from './routes/customers.js';
import { statsRouter } from './routes/stats.js';
import { calendarRouter } from './routes/calendar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ---- API routes ----
  app.use('/api/stats', statsRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/calendar', calendarRouter);

  app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  // ---- Static client (production build) ----
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // ---- 404 for unknown API routes ----
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint tidak dijumpai.' });
  });

  // ---- Error handler ----
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Ralat dalaman server.' });
  });

  return app;
}
