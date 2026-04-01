import { Resend } from "resend";

import { env } from "~/env";

const resend = new Resend(env.RESEND_API_KEY ?? "");

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const FROM_ADDRESS = env.AUTH_EMAIL_FROM ?? "noreply@localhost";

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your Spellbook account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Verify your email</h1>
        <p style="color: #555; margin-bottom: 24px;">
          Click the button below to verify your Spellbook account. This link expires in 24 hours.
        </p>
        <a href="${url}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Verify email
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${BASE_URL}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your Spellbook password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Reset your password</h1>
        <p style="color: #555; margin-bottom: 24px;">
          Click the button below to reset your Spellbook password. This link expires in 1 hour.
        </p>
        <a href="${url}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Reset password
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
