import { env } from '../config/env';
import { log } from '../utils/logger';
import { HttpError } from '../utils/httpError';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  category?: string;
}

// Sends through Mailtrap's API. With MAILTRAP_INBOX_ID set, mail goes to the sandbox inbox.
export async function sendMail({ to, subject, text, html, category }: MailOptions): Promise<void> {
  if (!env.mailtrapApiKey) {
    if (env.isProduction) throw new Error('MAILTRAP_API_KEY is not set');
    log(`[mail] MAILTRAP_API_KEY not set, printing email instead\n    to: ${to}\n    subject: ${subject}\n    ${text}`);
    return;
  }

  const url = env.mailtrapInboxId
    ? `https://sandbox.api.mailtrap.io/api/send/${env.mailtrapInboxId}`
    : 'https://send.api.mailtrap.io/api/send';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.mailtrapApiKey}`,
    },
    body: JSON.stringify({
      from: { email: env.mailFromEmail, name: env.mailFromName },
      to: [{ email: to }],
      subject,
      text,
      html,
      category,
    }),
  });

  if (!res.ok) {
    log(`[mail] Mailtrap error ${res.status}: ${await res.text()}`);
    throw new HttpError(502, 'Could not send email, please try again', 'MAIL_FAILED');
  }
}

export type CodePurpose = 'verify_email' | 'reset_password';

const CODE_EMAILS: Record<CodePurpose, { subject: string; intro: string; category: string }> = {
  verify_email: {
    subject: 'Your Study Coach verification code',
    intro: 'Your verification code is',
    category: 'Email verification',
  },
  reset_password: {
    subject: 'Reset your Study Coach password',
    intro: 'Your password reset code is',
    category: 'Password reset',
  },
};

export async function sendCodeEmail(to: string, code: string, purpose: CodePurpose): Promise<void> {
  const { subject, intro, category } = CODE_EMAILS[purpose];
  const outro = purpose === 'reset_password' ? " If you didn't request this, you can ignore this email." : '';

  await sendMail({
    to,
    subject,
    text: `${intro} ${code}. It expires in 10 minutes.${outro}`,
    html: `<p>${intro}</p><h2 style="letter-spacing:4px">${code}</h2><p>It expires in 10 minutes.${outro}</p>`,
    category,
  });
}
