import { and, eq, gt } from "drizzle-orm";

import { db } from "~/server/db";
import { verificationTokens } from "~/server/db/schema";

export async function createToken(
  identifier: string,
  expiresInHours: number,
): Promise<string> {
  // Delete any existing token for this identifier
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  await db.insert(verificationTokens).values({ identifier, token, expires });

  return token;
}

export async function consumeToken(
  identifier: string,
  token: string,
): Promise<boolean> {
  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, identifier),
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, new Date()),
    ),
  });

  if (!row) {
    // Clean up expired token if it exists but is past expiry
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token),
        ),
      );
    return false;
  }

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, token),
      ),
    );

  return true;
}
