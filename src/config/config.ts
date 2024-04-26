import dotenv from 'dotenv';
dotenv.config();

const config = {
  PORT: process.env.PORT || 3000,
  MONGOURI: process.env.MONGOURI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN,
  DEV_ENV: process.env.DEV_MODE,
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
  BACKENDURL: process.env.BACKENDURL,
  FRONTENDURL: process.env.FRONTENDURL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
};

export default config;
