import type { YgoCard } from '~/types/ygoCard';

const MAX_RESULTS = 100;

export function filterCards(
  cards: YgoCard[],
  filters: { name: string; type: string; attribute: string },
): YgoCard[] {
  const nameLower = filters.name.toLowerCase();
  return cards
    .filter(card => {
      if (nameLower && !card.name.toLowerCase().includes(nameLower)) return false;
      if (filters.type && card.type !== filters.type) return false;
      if (filters.attribute && card.attribute !== filters.attribute) return false;
      return true;
    })
    .slice(0, MAX_RESULTS);
}

export function getUniqueTypes(cards: YgoCard[]): string[] {
  return [...new Set(cards.map(c => c.type))].sort();
}
