// Express app setup: CORS, security middleware, and route mounting for all interview modules.
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './auth/userRoutes.js';
import mcqRoutes from './mcq/mcqRoutes.js';
import videoRoutes from './video/videoRoutes.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import codingRoutes from './coding/codingRoutes.js';
import resultsRoutes from './results/resultsRoutes.js';
import jobDescriptionRoutes from './jd/routes.js';

dotenv.config();

const app = express();

app.use(cors({origin: true, credentials: true}));

app.use(helmet());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP"
});

app.get('/', (req, res) => {
  res.json({ message: 'AI Interview Platform Backend - Running!' });
});

app.use('/api/user', userRoutes, limiter);
app.use('/api/mcq', mcqRoutes);
app.use('/api/jd', jobDescriptionRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/results', resultsRoutes);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;