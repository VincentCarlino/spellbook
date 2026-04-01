"use client";

import { useMemo, useState } from "react";
import { type YgoCard } from "~/types/ygoCard";
import { useTopCards } from "~/hooks/useTopCards";

const ATTRIBUTES = ["DARK", "LIGHT", "WATER", "FIRE", "EARTH", "WIND", "DIVINE"];
const TYPES = ["Monster", "Spell", "Trap"];
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MAX_RESULTS = 100;

type Tab = "all" | "top";

interface CardSearchProps {
  allCards: YgoCard[];
  onAddCard: (card: YgoCard) => void;
  onPreviewCard: (card: YgoCard) => void;
}

function CardGrid({
  cards,
  onAddCard,
  onPreviewCard,
  showRank = false,
}: {
  cards: YgoCard[];
  onAddCard: (card: YgoCard) => void;
  onPreviewCard: (card: YgoCard) => void;
  showRank?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cards.map((card, i) => {
        const imgUrl = `https://images.ygoprodeck.com/images/cards/${card.imageId}.jpg`;
        return (
          <div
            key={card.id}
            className="relative rounded cursor-pointer group"
            onClick={() => onPreviewCard(card)}
            onContextMenu={(e) => {
              e.preventDefault();
              onAddCard(card);
            }}
            title={`${card.name}\nLeft-click: preview  Right-click: add`}
          >
            <img
              src={imgUrl}
              alt={card.name}
              className="w-full rounded"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.ygoprodeck.com/images/cards/back_card.jpg";
              }}
            />
            {showRank && (
              <span className="absolute top-0.5 left-0.5 rounded bg-black/70 px-1 py-px text-[9px] font-bold text-white leading-tight">
                #{i + 1}
              </span>
            )}
            <div className="absolute inset-0 rounded bg-cat-blue/0 group-hover:bg-cat-blue/20 transition-colors duration-100 pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
}

export function CardSearch({ allCards, onAddCard, onPreviewCard }: CardSearchProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [attrFilter, setAttrFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<number | "">("");

  const { cards: topCards, loading: topLoading } = useTopCards();

  const results = useMemo(() => {
    const q = query.toLowerCase();
    let filtered = allCards;

    if (q) {
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (typeFilter) {
      filtered = filtered.filter((c) => c.type.includes(typeFilter));
    }
    if (attrFilter) {
      filtered = filtered.filter((c) => c.attribute === attrFilter);
    }
    if (levelFilter !== "") {
      filtered = filtered.filter(
        (c) => c.level === levelFilter || c.linkval === levelFilter,
      );
    }

    return filtered.slice(0, MAX_RESULTS);
  }, [allCards, query, typeFilter, attrFilter, levelFilter]);

  const tabClass = (t: Tab) =>
    `flex-1 py-1.5 text-xs font-medium transition-colors duration-150 ${
      tab === t
        ? "text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white"
        : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <button className={tabClass("all")} onClick={() => setTab("all")}>
          All Cards
        </button>
        <button className={tabClass("top")} onClick={() => setTab("top")}>
          Top 100
        </button>
      </div>

      {tab === "all" && (
        <>
          {/* Search input */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 p-2 border-b border-zinc-100 dark:border-zinc-800 flex-wrap shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 min-w-0 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="">All types</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={attrFilter}
              onChange={(e) => setAttrFilter(e.target.value)}
              className="flex-1 min-w-0 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="">All attrs</option>
              {ATTRIBUTES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value === "" ? "" : Number(e.target.value))}
              className="flex-1 min-w-0 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="">Any level</option>
              {LEVELS.map((l) => <option key={l} value={l}>Lv {l}</option>)}
            </select>
          </div>

          {/* Results count */}
          <div className="px-3 py-1.5 text-xs text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            {results.length === MAX_RESULTS
              ? `Showing first ${MAX_RESULTS} results`
              : `${results.length} card${results.length !== 1 ? "s" : ""}`}
          </div>

          {/* Card grid */}
          <div className="flex-1 overflow-y-auto p-2">
            <CardGrid cards={results} onAddCard={onAddCard} onPreviewCard={onPreviewCard} />
            {results.length === 0 && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center mt-8">
                No cards found
              </p>
            )}
          </div>
        </>
      )}

      {tab === "top" && (
        <>
          <div className="px-3 py-1.5 text-xs text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            Tournament TCG · Current Format
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {topLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center mt-8">
                Loading…
              </p>
            ) : (
              <CardGrid
                cards={topCards}
                onAddCard={onAddCard}
                onPreviewCard={onPreviewCard}
                showRank
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
