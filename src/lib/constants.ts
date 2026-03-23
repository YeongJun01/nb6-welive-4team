import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'welive-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'welive-refresh-secret-key';

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/welive';

export { PORT, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, DATABASE_URL, CORS_ORIGIN };
