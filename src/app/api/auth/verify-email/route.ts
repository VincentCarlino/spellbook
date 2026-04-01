import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { consumeToken } from "~/server/tokens";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-link", request.url),
    );
  }

  const valid = await consumeToken(`verify:${email}`, token);

  if (!valid) {
    return NextResponse.redirect(
      new URL("/login?error=expired-link", request.url),
    );
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  return NextResponse.redirect(new URL("/login?verified=true", request.url));
}
