import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Uploaded application documents / complaint photos. Swap for a signed S3
// URL in production (see src/utils/upload.ts).
app.use('/uploads', express.static(path.resolve(process.cwd(), UPLOAD_DIR)));

app.use('/api', routes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Student Accommodation API listening on http://localhost:${PORT}`);
});

export default app;
