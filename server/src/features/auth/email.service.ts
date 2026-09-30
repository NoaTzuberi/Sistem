import { Resend } from 'resend';
import { config } from '../../config/env';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!resend) {
    console.warn('RESEND_API_KEY is not configured — skipping password reset email send.');
    return;
  }

  await resend.emails.send({
    from: config.emailFrom,
    to,
    subject: 'Reset your Sistem password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p>We received a request to reset the password for your Sistem account. Click the button below to choose a new one — this link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #ff7a1a; color: #0b1929; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #666;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      </div>
    `,
  });
}
