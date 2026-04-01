export type HandOwner = 'p1' | 'p2';

export type Phase = 'Draw' | 'Standby' | 'Main 1' | 'Battle' | 'Main 2' | 'End';
export const PHASES: Phase[] = ['Draw', 'Standby', 'Main 1', 'Battle', 'Main 2', 'End'];

export interface HandCardState {
  id: string;
  faceImageUrl: string;
  backImageUrl: string;
  isFlipped: boolean;
  rotation: number;
  label?: string;
  desc?: string;
  cardType?: string;
  race?: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  linkval?: number;
  linkmarkers?: string[];
}

export interface HandState {
  owner: HandOwner;
  cards: HandCardState[];
}

export interface CardState {
  id: string;
  faceImageUrl: string;
  backImageUrl: string;
  x: number;
  y: number;
  rotation: number;   // degrees
  isFlipped: boolean;
  zIndex: number;
  label?: string;
  desc?: string;
  cardType?: string;
  race?: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  linkval?: number;
  linkmarkers?: string[];
  placedBy?: HandOwner;  // player who moved this card from hand to field; gates face-down preview
}

export interface DeckState {
  id: string;
  cards: CardState[];   // index 0 = top card
  x: number;
  y: number;
  zIndex: number;
  label?: string;
}

export interface RubberBand {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface TableState {
  cards: CardState[];
  decks: DeckState[];
  hands: HandState[];
  topZIndex: number;
  selectedCardIds: string[];
  selectedDeckId: string | null;
  selectedHandCard: { id: string; owner: HandOwner } | null;
  activeDrag: { cardIds: string[] } | null;
  rubberBand: RubberBand | null;
  previewCard: { imageUrl: string; label?: string; desc?: string; cardType?: string; race?: string; attribute?: string; level?: number; atk?: number; def?: number; linkval?: number; linkmarkers?: string[] } | null;
  localRole: HandOwner | null;
  lifePoints: { p1: number; p2: number };
  turnIndicator: { turn: HandOwner; phase: Phase };
}

export type TableAction =
  | { type: 'ADD_CARD'; payload: Omit<CardState, 'zIndex'> }
  | { type: 'MOVE_CARD'; payload: { id: string; x: number; y: number } }
  | { type: 'MOVE_CARDS'; payload: { ids: string[]; dx: number; dy: number } }
  | { type: 'ROTATE_CARD'; payload: { id: string; degrees: number } }
  | { type: 'FLIP_CARD'; payload: { id: string } }
  | { type: 'BRING_TO_FRONT'; payload: { id: string } }
  | { type: 'SEND_TO_BACK'; payload: { id: string } }
  | { type: 'SELECT_CARD'; payload: { id: string; additive: boolean } }
  | { type: 'SELECT_CARDS_IN_RECT'; payload: { x: number; y: number; width: number; height: number } }
  | { type: 'DESELECT_ALL' }
  | { type: 'UPDATE_RUBBER_BAND'; payload: RubberBand | null }
  | { type: 'REMOVE_CARD'; payload: { id: string } }
  | { type: 'CLEAR_TABLE' }
  | { type: 'SET_PREVIEW_CARD'; payload: { imageUrl: string; label?: string; desc?: string; cardType?: string; race?: string; attribute?: string; level?: number; atk?: number; def?: number; linkval?: number; linkmarkers?: string[] } | null }
  | { type: 'CREATE_DECK'; payload: { cardIds: string[]; x: number; y: number } }
  | { type: 'MOVE_DECK'; payload: { id: string; x: number; y: number } }
  | { type: 'BRING_DECK_TO_FRONT'; payload: { id: string } }
  | { type: 'SELECT_DECK'; payload: { id: string | null } }
  | { type: 'DRAW_FROM_DECK'; payload: { id: string } }
  | { type: 'ADD_CARDS_TO_DECK'; payload: { deckId: string; cardIds: string[]; position: 'top' | 'bottom' | 'shuffle' } }
  | { type: 'REMOVE_CARD_FROM_DECK'; payload: { deckId: string; cardId: string } }
  | { type: 'SHUFFLE_DECK'; payload: { id: string; shuffledIds: string[] } }
  | { type: 'DISBAND_DECK'; payload: { id: string } }
  | { type: 'SET_ACTIVE_DRAG'; payload: { cardIds: string[] } }
  | { type: 'CLEAR_ACTIVE_DRAG' }
  | { type: 'EXPAND_CARDS'; payload: { ids: string[] } }
  | { type: 'COLLAPSE_CARDS'; payload: { ids: string[] } }
  | { type: 'IMPORT_DECK'; payload: { cards: Omit<CardState, 'zIndex'>[]; x: number; y: number; label?: string } }
  | { type: 'ADD_CARD_TO_HAND'; payload: { cardId: string; owner: HandOwner } }
  | { type: 'REMOVE_CARD_FROM_HAND'; payload: { cardId: string; owner: HandOwner; x: number; y: number; faceImageUrl: string } }
  | { type: 'FLIP_HAND_CARD'; payload: { cardId: string; owner: HandOwner } }
  | { type: 'ROTATE_HAND_CARD'; payload: { cardId: string; owner: HandOwner; degrees: number } }
  | { type: 'REORDER_HAND_CARD'; payload: { cardId: string; owner: HandOwner; toIndex: number } }
  | { type: 'SELECT_HAND_CARD'; payload: { id: string; owner: HandOwner } | null }
  | { type: 'SET_LOCAL_ROLE'; payload: { role: HandOwner | null } }
  | { type: 'SET_LIFE_POINTS'; payload: { player: HandOwner; value: number } }
  | { type: 'ADJUST_LIFE_POINTS'; payload: { player: HandOwner; delta: number } }
  | { type: 'NEXT_PHASE' }
  | { type: 'SET_TURN_PHASE'; payload: { turn: HandOwner; phase: Phase } }
  | { type: 'LOAD_REMOTE_STATE'; payload: PersistedTableState };

export interface PersistedTableState {
  version: number;
  cards: CardState[];
  decks: DeckState[];
  hands: HandState[];
  topZIndex: number;
  lifePoints?: { p1: number; p2: number };
  turnIndicator?: { turn: HandOwner; phase: Phase };
}
