"use client";

import { useEffect, useState } from "react";
import type { YgoCard } from "~/types/ygoCard";

export interface TopCardsResult {
  cards: YgoCard[];
  loading: boolean;
  error: string | null;
}

export function useTopCards(): TopCardsResult {
  const [cards, setCards] = useState<YgoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/top-cards.json", { signal: controller.signal })
      .then((r) => r.json())
      .then((data: YgoCard[]) => {
        setCards(data);
        setLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message ?? "Failed to load top cards");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  return { cards, loading, error };
}
