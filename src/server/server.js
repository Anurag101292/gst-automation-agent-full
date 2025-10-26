import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import uploadRouter from '../api/upload.js';
import statusRouter from '../api/status.js';

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.json());

app.use('/api/upload', uploadRouter);
app.use('/api/status', statusRouter);

// Basic upload UI
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, ()=>{
  console.log(`Server started on http://localhost:${PORT}`);
});
