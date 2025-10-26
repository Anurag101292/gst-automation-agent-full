import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import path from 'path';
import { initDb } from '../db/models.js';
import { extractText } from '../ocr/tesseractService.js';
import { parseInvoice } from '../ocr/parsing.js';
import { runAutomation } from '../automation/playwrightMcpAgent.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const worker = new Worker('invoice-processing', async job => {
  const { id, filename, path: filePath } = job.data;
  const db = initDb();
  try {
    // update status
    db.prepare('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?').run('OCR_RUNNING', new Date().toISOString(), id);
    const text = await extractText(filePath);
    db.prepare('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?').run('PARSING', new Date().toISOString(), id);
    const invoice = parseInvoice(text);
    // save parsed result
    db.prepare('UPDATE invoices SET status = ?, result = ?, updated_at = ? WHERE id = ?').run('READY_FOR_AUTOMATION', JSON.stringify(invoice), new Date().toISOString(), id);

    // call automation (Playwright) - this will pause for OTP input during login
    db.prepare('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?').run('AUTOMATION_RUNNING', new Date().toISOString(), id);
    const automationRes = await runAutomation({ id, filename, invoice });
    db.prepare('UPDATE invoices SET status = ?, result = ?, updated_at = ? WHERE id = ?').run(automationRes.success ? 'AUTOMATION_SUCCESS' : 'AUTOMATION_FAILED', JSON.stringify(automationRes), new Date().toISOString(), id);

    return { ok: true };
  } catch (err) {
    db.prepare('UPDATE invoices SET status = ?, result = ?, updated_at = ? WHERE id = ?').run('FAILED', err.message, new Date().toISOString(), id);
    throw err;
  }
}, { connection });

worker.on('failed', (job, err)=> {
  console.error('Job failed', job.id, err);
});
