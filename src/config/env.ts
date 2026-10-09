function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env variable: ${name}`);
  return value;
}

export const env = {
  isProduction: process.env.NODE_ENV === 'production',

  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 30,

  mailtrapApiKey: process.env.MAILTRAP_API_KEY || '',
  mailtrapInboxId: process.env.MAILTRAP_INBOX_ID || '',
  mailFromEmail: process.env.MAIL_FROM_EMAIL || 'hello@demomailtrap.co',
  mailFromName: process.env.MAIL_FROM_NAME || 'Study Coach',
};
