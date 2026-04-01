export type DeckZone = "main" | "extra" | "side";

export interface SavedDeckCard {
  cardId: number;
  zone: DeckZone;
  position: number;
}

export interface SavedDeck {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  cards: SavedDeckCard[];
}

export interface DeckSummary {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  mainCount: number;
  extraCount: number;
  sideCount: number;
}
