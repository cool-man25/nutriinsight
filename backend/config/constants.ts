const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

export const SERVER_CONFIG = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

export const JWT_CONFIG = {
  SECRET: jwtSecret,
  // Local development remains convenient, but deployed apps must receive a
  // unique secret from platform provisioning.
  FALLBACK_SECRET: isProduction ? undefined : 'development-jwt-secret',
  EXPIRES_IN: '24h',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_TOKEN: 'Invalid token',
  NO_TOKEN: 'No token provided',
  UNAUTHORIZED: 'Unauthorized access',
} as const;
