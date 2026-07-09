import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import chemistRoutes from './routes/chemist.routes.js';
import areaRoutes from './routes/area.routes.js';
import beatRoutes from './routes/beat.routes.js';
import visitRoutes from './routes/visit.routes.js';
import planRoutes from './routes/plan.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import geocodeRoutes from './routes/geocode.routes.js';
import brandRoutes from './routes/brand.routes.js';

const app = express();

// Security & compression
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/chemists', chemistRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/beats', beatRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/brands', brandRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
