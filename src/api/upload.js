import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { addJob } from '../queue/producer.js';
import { initDb } from '../db/models.js';

const router = express.Router();
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/', upload.single('invoice'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const db = initDb();
  const stmt = db.prepare('INSERT INTO invoices (filename, status, created_at) VALUES (?, ?, ?)');
  const info = stmt.run(req.file.filename, 'UPLOADED', new Date().toISOString());
  // enqueue job
  await addJob({ id: info.lastInsertRowid, filename: req.file.filename, path: req.file.path });
  res.json({ id: info.lastInsertRowid, filename: req.file.filename });
});

export default router;
