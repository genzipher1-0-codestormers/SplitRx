export const SECURITY_CONFIG = {
  jwt: {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    algorithm: "HS256" as const,
  },
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute (Relaxed for testing)
    maxRequests: 100,
    authMaxRequests: 100, // Increased for testing
  },
  password: {
    saltRounds: 12,
    minLength: 8,
  },
  encryption: {
    algorithm: "aes-256-gcm" as const,
    ivLength: 16,
    tagLength: 16, // GCM auth tag length
  },
  session: {
    maxFailedAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
  },
  riskThresholds: {
    warning: 50,
    critical: 80,
  },
};
