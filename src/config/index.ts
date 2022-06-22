import { config } from 'dotenv';

config({ path: '.env' });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const {
  NODE_ENV,
  PORT,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_DATABASE,
  STREAM_API_KEY,
  STREAM_API_SECRET,
  CHATBOT_ID,
  CHATBOT_NAME,
  CHATBOT_IMAGE,
  LOG_FORMAT,
  LOG_DIR,
  ORIGIN,
} = process.env;
