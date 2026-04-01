"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createDeck } from "~/server/actions/decks";

export function CreateDeckButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { id } = await createDeck(name);
      router.push(`/decks/${id}`);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150"
      >
        + New Deck
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Deck name…"
        maxLength={100}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 dark:bg-white px-3 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors duration-150"
      >
        {loading ? "Creating…" : "Create"}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setName(""); }}
        className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors duration-150"
      >
        Cancel
      </button>
    </form>
  );
}
