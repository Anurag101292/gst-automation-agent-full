import express from 'express';
import { initDb } from '../db/models.js';

const router = express.Router();

router.get('/', (req, res) => {
  const db = initDb();
  const rows = db.prepare('SELECT id, filename, status, result, created_at, updated_at FROM invoices ORDER BY id DESC LIMIT 100').all();
  res.json(rows);
});

export default router;
