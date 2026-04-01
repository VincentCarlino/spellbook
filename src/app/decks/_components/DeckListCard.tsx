"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteDeck } from "~/server/actions/decks";
import { type DeckSummary } from "~/types/deck";

export function DeckListCard({ deck }: { deck: DeckSummary }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDeck(deck.id);
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  const updatedAt = new Date(deck.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 transition-colors duration-150">
      <div className="min-w-0">
        <Link
          href={`/decks/${deck.id}`}
          className="font-semibold text-zinc-900 dark:text-white hover:text-cat-blue dark:hover:text-cat-blue transition-colors duration-150 truncate block"
        >
          {deck.name}
        </Link>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Main {deck.mainCount} · Extra {deck.extraCount} · Side {deck.sideCount} · Updated {updatedAt}
        </p>
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        <Link
          href={`/decks/${deck.id}`}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150"
        >
          Edit
        </Link>

        {confirming ? (
          <>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors duration-150"
            >
              {deleting ? "Deleting…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors duration-150"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-150"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
