import uploadRoutes from './routes/upload';
import passport from './config/passport';
import authRoutes from './routes/auth';
import speechRoutes from './routes/speech';
import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';

import nutritionRoutes from './routes/nutrition';

const PORT = process.env.PORT || 3000;

// Middleware
import { errorHandler } from './middleware/errorHandler';

const app = express();

const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');

// API Routes import here
console.log('Environment variables loaded:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'set' : 'not set',
});
// token based (no cross-origin cookies or credentials).
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});
/**
 * Body Parser Middleware
 * Note: Stripe webhook requires raw body for signature verification
 * Must be configured before JSON parser
 */
app.use(passport.initialize());

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));


/**
 * API Routes
 */

/**
 * Install Stripe Routes here
 */

app.use('/api/auth', authRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/nutrition', nutritionRoutes);

/**
 * Static Files (after API routes)
 * - /assets: 带内容哈希的构建产物，可长期缓存（immutable）
 * - 根路径: index.html 与其他公共文件，协商缓存保证发版即生效
 */
app.use(
  '/assets',
  express.static(path.join(REACT_BUILD_FOLDER, 'assets'), {
    immutable: true,
    maxAge: '30d',
  })
);

app.use(express.static(REACT_BUILD_FOLDER));

app.use('/api/upload', uploadRoutes);

// 未匹配到的 /api 路由返回 JSON 404，避免落入 SPA 兜底返回 HTML
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

/**
 * SPA Fallback Route
 * Handles client-side routing for React Router
 * Must be registered after all API routes
 */
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

/**
 * Error Handler
 * Must be the last middleware
 */
app.use(errorHandler as ErrorRequestHandler);

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

export default app;
