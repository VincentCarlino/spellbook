"use server";

import { and, eq } from "drizzle-orm";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { deckCards, decks } from "~/server/db/schema";
import { type DeckSummary, type SavedDeck, type SavedDeckCard } from "~/types/deck";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getUserDecks(): Promise<DeckSummary[]> {
  const userId = await requireUserId();

  const rows = await db.query.decks.findMany({
    where: eq(decks.userId, userId),
    with: { cards: true },
    orderBy: (d, { desc }) => [desc(d.updatedAt)],
  });

  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    mainCount: d.cards.filter((c) => c.zone === "main").length,
    extraCount: d.cards.filter((c) => c.zone === "extra").length,
    sideCount: d.cards.filter((c) => c.zone === "side").length,
  }));
}

export async function createDeck(name: string): Promise<{ id: string }> {
  const userId = await requireUserId();
  const trimmed = name.trim() || "New Deck";

  const [row] = await db
    .insert(decks)
    .values({ userId, name: trimmed })
    .returning({ id: decks.id });

  if (!row) throw new Error("Failed to create deck");
  return { id: row.id };
}

export async function getDeck(id: string): Promise<SavedDeck | null> {
  const userId = await requireUserId();

  const deck = await db.query.decks.findFirst({
    where: and(eq(decks.id, id), eq(decks.userId, userId)),
    with: { cards: true },
  });

  if (!deck) return null;

  return {
    id: deck.id,
    name: deck.name,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    cards: deck.cards
      .map((c) => ({ cardId: c.cardId, zone: c.zone, position: c.position }))
      .sort((a, b) => a.position - b.position),
  };
}

export async function updateDeckName(id: string, name: string): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(decks)
    .set({ name: name.trim() || "New Deck", updatedAt: new Date() })
    .where(and(eq(decks.id, id), eq(decks.userId, userId)));
}

export async function saveDeckCards(
  id: string,
  cards: SavedDeckCard[],
): Promise<void> {
  const userId = await requireUserId();

  // Auth check: ensure user owns the deck
  const deck = await db.query.decks.findFirst({
    where: and(eq(decks.id, id), eq(decks.userId, userId)),
    columns: { id: true },
  });
  if (!deck) throw new Error("Deck not found");

  await db.transaction(async (tx) => {
    await tx.delete(deckCards).where(eq(deckCards.deckId, id));

    if (cards.length > 0) {
      await tx.insert(deckCards).values(
        cards.map((c) => ({
          deckId: id,
          cardId: c.cardId,
          zone: c.zone,
          position: c.position,
        })),
      );
    }

    await tx
      .update(decks)
      .set({ updatedAt: new Date() })
      .where(eq(decks.id, id));
  });
}

export async function deleteDeck(id: string): Promise<void> {
  const userId = await requireUserId();
  await db
    .delete(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, userId)));
}
