"use client";

import { useEffect, useState } from "react";
import { type SavedDeckCard, type DeckZone } from "~/types/deck";
import { type YgoCard } from "~/types/ygoCard";
import { decodeYdke } from "~/utils/ydke";

const EXTRA_DECK_TYPES = ["Fusion", "Synchro", "XYZ", "Link"];

function isExtraDeckType(type: string): boolean {
  return EXTRA_DECK_TYPES.some((t) => type.includes(t));
}

interface ImportModalProps {
  cardMap: Map<number, YgoCard>;
  onImport: (cards: SavedDeckCard[]) => void;
  onClose: () => void;
}

export function ImportModal({ cardMap, onImport, onClose }: ImportModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleImport() {
    setError(null);
    try {
      const decoded = decodeYdke(value.trim());
      const result: SavedDeckCard[] = [];
      let unknown = 0;

      const addZone = (ids: number[], zone: DeckZone) => {
        let pos = 0;
        for (const id of ids) {
          const card = cardMap.get(id);
          if (!card) { unknown++; continue; }
          const effectiveZone: DeckZone = zone === "extra"
            ? "extra"
            : isExtraDeckType(card.type)
              ? "extra"
              : zone;
          result.push({ cardId: id, zone: effectiveZone, position: pos++ });
        }
      };

      addZone(decoded.main, "main");
      addZone(decoded.extra, "extra");
      addZone(decoded.side, "side");

      if (unknown > 0) {
        setError(`Imported ${result.length} cards. ${unknown} unknown card(s) were skipped.`);
      }

      onImport(result);
    } catch (err) {
      setError((err as Error).message ?? "Invalid ydke string");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
          Import Deck
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Paste a <code className="font-mono">ydke://</code> string to load a deck.
          This will replace the current deck contents.
        </p>

        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ydke://..."
          rows={4}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 resize-none"
        />

        {error && (
          <p className="mt-2 text-xs text-cat-pink">{error}</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!value.trim()}
            className="rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors duration-150"
          >
            Import
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors duration-100"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
