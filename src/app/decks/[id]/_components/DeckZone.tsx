"use client";

import { useState } from "react";
import { type DeckZone, type SavedDeckCard } from "~/types/deck";
import { type YgoCard } from "~/types/ygoCard";

interface DeckZoneProps {
  zone: DeckZone;
  label: string;
  min: number;
  max: number;
  cards: SavedDeckCard[];
  cardMap: Map<number, YgoCard>;
  onRemove: (cardId: number, zone: DeckZone) => void;
  onPreview: (card: YgoCard) => void;
  onDragStart: (cardId: number) => void;
  onDrop: (zone: DeckZone) => void;
  canDrop: boolean;
}

export function DeckZone({
  zone,
  label,
  min,
  max,
  cards,
  cardMap,
  onRemove,
  onPreview,
  onDragStart,
  onDrop,
  canDrop,
}: DeckZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const count = cards.length;
  const isUnder = min > 0 && count < min;
  const isOver = count > max;

  const countColor = isOver
    ? "text-cat-pink"
    : isUnder
      ? "text-cat-yellow"
      : "text-zinc-500 dark:text-zinc-400";

  return (
    <div
      className={`rounded-xl border transition-all duration-150 ${
        dragOver && canDrop
          ? "border-cat-blue bg-cat-blue/5"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      }`}
      onDragOver={(e) => {
        if (canDrop) { e.preventDefault(); setDragOver(true); }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onDrop(zone);
      }}
    >
      {/* Zone header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span className={`text-xs font-mono ${countColor}`}>
          {count} / {max}
        </span>
      </div>

      {/* Card grid */}
      <div className="p-3 flex flex-wrap gap-1 min-h-16">
        {cards.map((c, i) => {
          const ygoCard = cardMap.get(c.cardId);
          if (!ygoCard) return null;
          const imgUrl = `https://images.ygoprodeck.com/images/cards/${ygoCard.imageId}.jpg`;

          return (
            <div
              key={`${c.cardId}-${c.zone}-${i}`}
              className="relative w-20 rounded cursor-pointer select-none group shrink-0"
              draggable
              onDragStart={() => onDragStart(c.cardId)}
              onClick={() => onPreview(ygoCard)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRemove(c.cardId, zone);
              }}
              title={`${ygoCard.name}\nLeft-click: preview  Right-click: remove`}
            >
              <img
                src={imgUrl}
                alt={ygoCard.name}
                className="w-full rounded"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.ygoprodeck.com/images/cards/back_card.jpg";
                }}
              />
              {/* Remove overlay on hover */}
              <div className="absolute inset-0 rounded bg-red-500/0 group-hover:bg-red-500/20 transition-colors duration-100 pointer-events-none" />
            </div>
          );
        })}

        {cards.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 self-center w-full text-center py-2">
            {canDrop ? "Drop cards here" : "Empty"}
          </p>
        )}
      </div>
    </div>
  );
}
