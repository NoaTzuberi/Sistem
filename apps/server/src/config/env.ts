import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PORT = 5002;
const DEFAULT_JWT_SECRET = 'JWT_SECRET';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || DEFAULT_PORT,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  voyageApiKey: process.env.VOYAGE_API_KEY || '',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Sistem <onboarding@resend.dev>',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

if (config.nodeEnv === 'production' && config.jwtSecret === DEFAULT_JWT_SECRET) {
  throw new Error(
    'JWT_SECRET must be set to a strong, unique value in production — refusing to start with the insecure default.',
  );
}
