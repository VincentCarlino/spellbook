import Link from "next/link";

import { getUserDecks } from "~/server/actions/decks";
import { CreateDeckButton } from "./_components/CreateDeckButton";
import { DeckListCard } from "./_components/DeckListCard";

export default async function DecksPage() {
  const decks = await getUserDecks();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-150 text-sm"
            >
              ← Dashboard
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              My Decks
            </h1>
          </div>
          <CreateDeckButton />
        </div>

        {/* Deck list */}
        {decks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 px-8 py-16 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-3">
              No decks yet.
            </p>
            <p className="text-zinc-400 dark:text-zinc-500 text-xs">
              Click <span className="font-medium">+ New Deck</span> to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {decks.map((deck) => (
              <DeckListCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
