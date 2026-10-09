import { Resend } from 'resend';
import type { Language } from '@sistem/types';
import { config } from '../../config/env';
import { translate } from '../../i18n';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

/** In her language (Phase 15): Hebrew right-to-left, or English. */
export async function sendPasswordResetEmail(to: string, resetUrl: string, language: Language): Promise<void> {
  if (!resend) {
    console.warn('RESEND_API_KEY is not configured — skipping password reset email send.');
    return;
  }

  const t = (code: Parameters<typeof translate>[1]) => translate(language, code);
  const dir = language === 'he' ? 'rtl' : 'ltr';
  await resend.emails.send({
    from: config.emailFrom,
    to,
    subject: t('email_reset_subject'),
    html: `
      <div dir="${dir}" lang="${language}" style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a; text-align: start;">
        <h2 style="margin-bottom: 8px;">${t('email_reset_title')}</h2>
        <p>${t('email_reset_body')}</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #ff7a1a; color: #0b1929; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">${t('email_reset_button')}</a>
        </p>
        <p style="color: #666;">${t('email_reset_ignore')}</p>
      </div>
    `,
  });
}
