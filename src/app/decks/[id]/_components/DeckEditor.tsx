"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { saveDeckCards, updateDeckName } from "~/server/actions/decks";
import { type SavedDeck, type SavedDeckCard, type DeckZone } from "~/types/deck";
import { type YgoCard } from "~/types/ygoCard";
import { useCardDatabase } from "~/hooks/useCardDatabase";
import { encodeYdke } from "~/utils/ydke";
import { CardSearch } from "./CardSearch";
import { DeckZone as DeckZoneComponent } from "./DeckZone";
import { CardPreview } from "./CardPreview";
import { ImportModal } from "./ImportModal";

// Extra deck card types
const EXTRA_DECK_TYPES = ["Fusion", "Synchro", "XYZ", "Link"];

function isExtraDeckType(type: string): boolean {
  return EXTRA_DECK_TYPES.some((t) => type.includes(t));
}

export function DeckEditor({ deck }: { deck: SavedDeck }) {
  const { cards: allCards, loading: dbLoading } = useCardDatabase();
  const cardMap = new Map(allCards.map((c) => [c.id, c]));

  const [name, setName] = useState(deck.name);
  const [cards, setCards] = useState<SavedDeckCard[]>(deck.cards);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewCard, setPreviewCard] = useState<YgoCard | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [dragInfo, setDragInfo] = useState<{ cardId: number; fromZone: DeckZone } | null>(null);

  const cardsInZone = (zone: DeckZone) =>
    cards.filter((c) => c.zone === zone).sort((a, b) => a.position - b.position);

  const handleAddCard = useCallback((card: YgoCard) => {
    const zone: DeckZone = isExtraDeckType(card.type) ? "extra" : "main";
    const existing = cards.filter((c) => c.zone === zone && c.cardId === card.id);
    if (existing.length >= 3) return; // max 3 copies

    const zoneCards = cards.filter((c) => c.zone === zone);
    const newCard: SavedDeckCard = { cardId: card.id, zone, position: zoneCards.length };
    setCards((prev) => [...prev, newCard]);
    setIsDirty(true);
  }, [cards]);

  const handleRemoveCard = useCallback((cardId: number, zone: DeckZone) => {
    setCards((prev) => {
      const idx = [...prev]
        .reverse()
        .findIndex((c) => c.cardId === cardId && c.zone === zone);
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      const next = prev.filter((_, i) => i !== realIdx);
      // Reindex positions within the zone
      let pos = 0;
      return next.map((c) =>
        c.zone === zone ? { ...c, position: pos++ } : c,
      );
    });
    setIsDirty(true);
  }, []);

  const handleMoveCard = useCallback((cardId: number, fromZone: DeckZone, toZone: DeckZone) => {
    if (fromZone === toZone) return;
    setCards((prev) => {
      // Find one copy of this card in fromZone
      const idx = prev.findIndex((c) => c.cardId === cardId && c.zone === fromZone);
      if (idx === -1) return prev;

      // Check copy limit in target zone
      const inTarget = prev.filter((c) => c.cardId === cardId && c.zone === toZone).length;
      if (inTarget >= 3) return prev;

      const updated = prev.filter((_, i) => i !== idx);
      const toZoneCards = updated.filter((c) => c.zone === toZone);
      updated.push({ cardId, zone: toZone, position: toZoneCards.length });

      // Reindex fromZone positions
      let pos = 0;
      return updated.map((c) =>
        c.zone === fromZone ? { ...c, position: pos++ } : c,
      );
    });
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDeckName(deck.id, name);
      await saveDeckCards(deck.id, cards);
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const main = cardsInZone("main").map((c) => c.cardId);
    const extra = cardsInZone("extra").map((c) => c.cardId);
    const side = cardsInZone("side").map((c) => c.cardId);
    const str = encodeYdke(main, extra, side);
    void navigator.clipboard.writeText(str);
  };

  const handleImport = (imported: SavedDeckCard[]) => {
    setCards(imported);
    setIsDirty(true);
    setShowImport(false);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <Link
          href="/decks"
          className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-150 text-sm shrink-0"
        >
          ← Decks
        </Link>

        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
          maxLength={100}
          className="flex-1 min-w-0 bg-transparent text-base font-semibold text-zinc-900 dark:text-white focus:outline-none border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 py-0.5 transition-colors duration-150"
        />

        {isDirty && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">Unsaved</span>
        )}

        <button
          onClick={() => setShowImport(true)}
          className="shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150"
        >
          Import
        </button>
        <button
          onClick={handleExport}
          className="shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150"
        >
          Export
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="shrink-0 rounded-lg bg-zinc-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors duration-150"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      {/* Body — split panel */}
      <div className="flex flex-1 min-h-0">
        {/* Left: card search */}
        <div className="w-80 shrink-0 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-white dark:bg-zinc-900">
          {dbLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-zinc-400">
              Loading card database…
            </div>
          ) : (
            <CardSearch
              allCards={allCards}
              onAddCard={handleAddCard}
              onPreviewCard={setPreviewCard}
            />
          )}
        </div>

        {/* Right: deck zones */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          <DeckZoneComponent
            zone="main"
            label="Main Deck"
            min={40}
            max={60}
            cards={cardsInZone("main")}
            cardMap={cardMap}
            onRemove={handleRemoveCard}
            onPreview={setPreviewCard}
            onDragStart={(cardId) => setDragInfo({ cardId, fromZone: "main" })}
            onDrop={(toZone) => {
              if (dragInfo && dragInfo.fromZone !== toZone) {
                handleMoveCard(dragInfo.cardId, dragInfo.fromZone, toZone);
              }
              setDragInfo(null);
            }}
            canDrop={dragInfo?.fromZone === "side"}
          />
          <DeckZoneComponent
            zone="extra"
            label="Extra Deck"
            min={0}
            max={15}
            cards={cardsInZone("extra")}
            cardMap={cardMap}
            onRemove={handleRemoveCard}
            onPreview={setPreviewCard}
            onDragStart={(cardId) => setDragInfo({ cardId, fromZone: "extra" })}
            onDrop={() => setDragInfo(null)}
            canDrop={false}
          />
          <DeckZoneComponent
            zone="side"
            label="Side Deck"
            min={0}
            max={15}
            cards={cardsInZone("side")}
            cardMap={cardMap}
            onRemove={handleRemoveCard}
            onPreview={setPreviewCard}
            onDragStart={(cardId) => setDragInfo({ cardId, fromZone: "side" })}
            onDrop={(toZone) => {
              if (dragInfo && dragInfo.fromZone !== toZone) {
                handleMoveCard(dragInfo.cardId, dragInfo.fromZone, toZone);
              }
              setDragInfo(null);
            }}
            canDrop={dragInfo?.fromZone === "main"}
          />
        </div>
      </div>

      {/* Modals */}
      {previewCard && (
        <CardPreview card={previewCard} onClose={() => setPreviewCard(null)} />
      )}
      {showImport && (
        <ImportModal
          cardMap={cardMap}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
