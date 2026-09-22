/**
 * Stats route — dashboard counters (always computed live).
 */
import { Router } from 'express';
import { globalStats } from '../db.js';

export const statsRouter = Router();

statsRouter.get('/', (req, res) => {
  res.json(globalStats());
});
