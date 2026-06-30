import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory store (replace with database in production)
const rsvps: Array<{
  id: string;
  name: string;
  attendance: string;
  guests: number;
  wishes: string;
  createdAt: Date;
}> = [];

const comments: Array<{
  id: string;
  name: string;
  message: string;
  attendance: string;
  createdAt: Date;
}> = [];

// RSVP endpoint
app.post('/api/rsvp', (req, res) => {
  const { name, attendance, guests, wishes } = req.body;
  if (!name || !attendance) {
    return res.status(400).json({ error: 'Name and attendance are required' });
  }
  const rsvp = {
    id: Date.now().toString(),
    name,
    attendance,
    guests: Number(guests) || 1,
    wishes: wishes || '',
    createdAt: new Date(),
  };
  rsvps.push(rsvp);

  // Also add as a comment
  comments.push({
    id: Date.now().toString() + '-c',
    name,
    message: wishes || 'Selamat!',
    attendance,
    createdAt: new Date(),
  });

  res.json({ success: true, data: rsvp });
});

// Get comments with pagination
app.get('/api/comments', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = 10;
  const start = (page - 1) * perPage;
  const paginated = comments.slice(start, start + perPage);
  const totalPages = Math.ceil(comments.length / perPage);

  res.json({
    success: true,
    data: {
      comments: paginated,
      page,
      totalPages,
      total: comments.length,
    },
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});