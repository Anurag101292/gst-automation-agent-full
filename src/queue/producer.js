import { Queue } from 'bullmq';
import IORedis from 'ioredis';
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const queue = new Queue('invoice-processing', { connection });

export async function addJob(data) {
  await queue.add('process-invoice', data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 } });
}
