import nodemailer from 'nodemailer';
import { config } from '../config';

// Built lazily so the app boots fine without SMTP configured.
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; text: string; html?: string }) {
  const tx = getTransporter();
  if (!tx) {
    // No SMTP configured — log so the flow is testable in dev without credentials.
    console.log(
      `\n[mailer] SMTP not configured — would have sent email:\n  to: ${opts.to}\n  subject: ${opts.subject}\n  ${opts.text}\n`,
    );
    return;
  }
  await tx.sendMail({
    from: config.smtp.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

export function passwordResetEmail(otp: string) {
  const subject = 'Your Pursuit password reset code';
  const text = `Your password reset code is ${otp}. It expires in ${config.otpTtlMinutes} minutes. If you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px;">
      <h2 style="margin:0 0 8px;">Reset your password</h2>
      <p style="color:#52525b;">Use this code to reset your Pursuit password:</p>
      <p style="font-size:28px; font-weight:700; letter-spacing:4px; margin:16px 0;">${otp}</p>
      <p style="color:#71717a; font-size:13px;">Expires in ${config.otpTtlMinutes} minutes. If you didn't request this, ignore this email.</p>
    </div>`;
  return { subject, text, html };
}
