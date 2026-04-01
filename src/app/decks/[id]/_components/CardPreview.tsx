"use client";

import { useEffect } from "react";
import { type YgoCard } from "~/types/ygoCard";

export function CardPreview({ card, onClose }: { card: YgoCard; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const imgUrl = `https://images.ygoprodeck.com/images/cards/${card.imageId}.jpg`;

  const isMonster = card.type.includes("Monster");
  const statLine = isMonster
    ? card.linkval !== undefined
      ? `Link-${card.linkval}`
      : card.level !== undefined
        ? `★${card.level}  ATK ${card.atk ?? "?"}  DEF ${card.def ?? "?"}`
        : null
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative flex gap-5 max-w-xl w-full mx-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card image */}
        <img
          src={imgUrl}
          alt={card.name}
          className="w-36 shrink-0 rounded-lg object-contain self-start"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.ygoprodeck.com/images/cards/back_card.jpg";
          }}
        />

        {/* Card details */}
        <div className="flex flex-col gap-2 min-w-0">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
            {card.name}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {card.type}
            {card.attribute ? ` · ${card.attribute}` : ""}
            {card.race ? ` · ${card.race}` : ""}
          </p>
          {statLine && (
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
              {statLine}
            </p>
          )}
          {card.linkmarkers && card.linkmarkers.length > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Arrows: {card.linkmarkers.join(", ")}
            </p>
          )}
          {card.desc && (
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed overflow-y-auto max-h-48 mt-1">
              {card.desc}
            </p>
          )}
        </div>

        {/* Close button */}
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
