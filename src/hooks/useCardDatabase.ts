'use client';

import { useState, useEffect } from 'react';
import type { YgoCard } from '~/types/ygoCard';

export interface CardDatabase {
  cards: YgoCard[];
  loading: boolean;
  error: string | null;
}

export function useCardDatabase(): CardDatabase {
  const [cards, setCards] = useState<YgoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/cards.json', { signal: controller.signal })
      .then(r => r.json())
      .then((data: YgoCard[]) => {
        setCards(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError((err as Error).message ?? 'Failed to load cards');
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  return { cards, loading, error };
}
