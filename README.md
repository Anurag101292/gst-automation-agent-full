# GST Automation Agent

This repository contains a personal automation agent to extract invoice data using Tesseract OCR
and file invoices into the GST portal using Playwright (MCP).

Features:
- Minimal web UI to upload invoices
- Background worker using BullMQ + Redis to process OCR and automation
- SQLite DB to track job status
- Playwright script with OTP pause (manual OTP input)
- Docker Compose for local deployment (app + worker + redis)

**IMPORTANT**: This project interacts with a government portal; use responsibly and only for personal tasks.

## Quickstart (local)

1. Copy `.env.example` to `.env` and edit values.
2. Install deps:
   ```bash
   npm ci
   npx playwright install
   ```
3. Start with Docker Compose (recommended):
   ```bash
   docker-compose up --build
   ```
Or run locally (ensure Redis running at REDIS_URL):
```bash
npm run dev
# in another shell
npm run worker
```

## Pushing to GitHub

Create a repo `gst-automation-agent` under your account (`Anurag101292`), then run:
```bash
git init
git add .
git commit -m "Initial commit - gst automation agent"


            🧑‍💻 USER
                |
                | Upload invoice image
                V
        +-------------------+
        |   server.js       |  Express server
        | (UI + API layer)  |
        +---------+---------+
                  |
                  | Save file + Insert into DB
                  V
         +--------+---------+
         | upload.js        |   Route Handler
         +--------+---------+
                  |
                  | Call addJob() 👇
                  V
        +---------+---------+
        | producer.js       |  Job dispatcher (BullMQ)
        +---------+---------+
                  |
                  | Job queued in Redis
                  V
        +---------+---------+
        |  Redis Queue      |
        +---------+---------+
                  |
                  | Worker picks job 🔔
                  V
        +---------+---------+
        | worker.js         |  Background processor
        |-------------------|
        | OCR via Tesseract |
        | Parse invoice     |
        | Playwright login  |
        | OTP wait          |
        | Invoice submission|
        +---------+---------+
                  |
                  | Update Status ✅
                  V
         +--------+--------+
         | SQLite DB       |
         +--------+--------+
                  |
                  | UI polls status
                  V
            🖥 Dashboard/HTML
            “✅ Completed / ❌ Failed”

git branch -M main
git remote add origin https://github.com/Anurag101292/gst-automation-agent.git
git push -u origin main
```

See `docker/docker-compose.yml` for services (app, worker, redis).
