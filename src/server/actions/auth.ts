"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "~/server/auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { sendPasswordResetEmail, sendVerificationEmail } from "~/server/email";
import { consumeToken, createToken } from "~/server/tokens";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export async function signupAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawConfirm = formData.get("confirmPassword");
  const rawName = formData.get("name");

  const emailResult = emailSchema.safeParse(rawEmail);
  if (!emailResult.success) return { error: emailResult.error.issues[0]?.message };

  const passwordResult = passwordSchema.safeParse(rawPassword);
  if (!passwordResult.success) return { error: passwordResult.error.issues[0]?.message };

  if (rawPassword !== rawConfirm) return { error: "Passwords do not match" };

  const email = emailResult.data;
  const password = passwordResult.data;
  const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : null;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) return { error: "An account with this email already exists" };

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    name,
    password: hashedPassword,
    emailVerified: null,
  });

  const token = await createToken(`verify:${email}`, 24);
  await sendVerificationEmail(email, token);

  return { success: true };
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw err;
  }

  return {};
}

export async function discordLoginAction(): Promise<void> {
  await signIn("discord", { redirectTo: "/dashboard" });
}

export async function resendVerificationAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const rawEmail = formData.get("email");
  const emailResult = emailSchema.safeParse(rawEmail);
  if (!emailResult.success) return { error: emailResult.error.issues[0]?.message };

  const email = emailResult.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || user.emailVerified) return { success: true };

  const token = await createToken(`verify:${email}`, 24);
  await sendVerificationEmail(email, token);

  return { success: true };
}

export async function forgotPasswordAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const rawEmail = formData.get("email");
  const emailResult = emailSchema.safeParse(rawEmail);
  if (!emailResult.success) return { error: emailResult.error.issues[0]?.message };

  const email = emailResult.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Always return success to avoid leaking whether an email is registered
  if (!user?.password) return { success: true };

  const token = await createToken(`reset:${email}`, 1);
  await sendPasswordResetEmail(email, token);

  return { success: true };
}

export async function resetPasswordAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const rawEmail = formData.get("email");
  const rawToken = formData.get("token");
  const rawPassword = formData.get("password");
  const rawConfirm = formData.get("confirmPassword");

  const emailResult = emailSchema.safeParse(rawEmail);
  if (!emailResult.success) return { error: "Invalid reset link" };

  const passwordResult = passwordSchema.safeParse(rawPassword);
  if (!passwordResult.success) return { error: passwordResult.error.issues[0]?.message };

  if (rawPassword !== rawConfirm) return { error: "Passwords do not match" };

  const email = emailResult.data;
  const token = typeof rawToken === "string" ? rawToken : "";

  const valid = await consumeToken(`reset:${email}`, token);
  if (!valid) return { error: "Invalid or expired reset link" };

  const hashedPassword = await bcrypt.hash(passwordResult.data, 12);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));

  return { success: true };
}
