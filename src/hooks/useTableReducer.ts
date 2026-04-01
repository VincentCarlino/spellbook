'use client';

import { useReducer } from 'react';
import type { TableState, TableAction, CardState, DeckState, HandState, HandCardState, PersistedTableState } from '~/types/card';
import { PHASES } from '~/types/card';
import { normalizeRotation, aabbIntersects, normalizeRect } from '~/utils/geometry';
import { v4 as uuidv4 } from 'uuid';

const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;
const STORAGE_KEY = 'spellbook-table';

const LAYOUT_CARD_WIDTH = 110;
const LAYOUT_CARD_HEIGHT = 154;
const LAYOUT_GAP = 6;
const LAYOUT_COLS = 5;

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

const defaultHands: HandState[] = [
  { owner: 'p1', cards: [] },
  { owner: 'p2', cards: [] },
];

function loadInitialState(): TableState {
  const base: TableState = {
    cards: [],
    decks: [],
    hands: defaultHands,
    topZIndex: 0,
    selectedCardIds: [],
    selectedDeckId: null,
    selectedHandCard: null,
    activeDrag: null,
    rubberBand: null,
    previewCard: null,
    localRole: null,
    lifePoints: { p1: 8000, p2: 8000 },
    turnIndicator: { turn: 'p1' as const, phase: 'Draw' as const },
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const persisted = JSON.parse(raw);
    if (persisted.version === 1) {
      return { ...base, cards: persisted.cards, topZIndex: persisted.topZIndex };
    }
    if (persisted.version === 2) {
      return { ...base, cards: persisted.cards, decks: persisted.decks, topZIndex: persisted.topZIndex };
    }
    if (persisted.version === 3) {
      const p = persisted as PersistedTableState;
      return { ...base, cards: p.cards, decks: p.decks, hands: p.hands, topZIndex: p.topZIndex, lifePoints: p.lifePoints ?? { p1: 8000, p2: 8000 }, turnIndicator: p.turnIndicator ?? { turn: 'p1', phase: 'Draw' } };
    }
    return base;
  } catch {
    return base;
  }
}

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'ADD_CARD': {
      const newCard: CardState = {
        ...action.payload,
        zIndex: state.topZIndex + 1,
      };
      return {
        ...state,
        cards: [...state.cards, newCard],
        topZIndex: state.topZIndex + 1,
      };
    }

    case 'MOVE_CARD': {
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.payload.id
            ? { ...c, x: action.payload.x, y: action.payload.y }
            : c
        ),
      };
    }

    case 'MOVE_CARDS': {
      const { ids, dx, dy } = action.payload;
      const idSet = new Set(ids);
      return {
        ...state,
        cards: state.cards.map((c) =>
          idSet.has(c.id) ? { ...c, x: c.x + dx, y: c.y + dy } : c
        ),
      };
    }

    case 'ROTATE_CARD': {
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.payload.id
            ? { ...c, rotation: normalizeRotation(c.rotation + action.payload.degrees) }
            : c
        ),
      };
    }

    case 'FLIP_CARD': {
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.payload.id ? { ...c, isFlipped: !c.isFlipped } : c
        ),
      };
    }

    case 'BRING_TO_FRONT': {
      const next = state.topZIndex + 1;
      return {
        ...state,
        topZIndex: next,
        cards: state.cards.map((c) =>
          c.id === action.payload.id ? { ...c, zIndex: next } : c
        ),
      };
    }

    case 'SEND_TO_BACK': {
      const minZ = Math.min(...state.cards.map((c) => c.zIndex));
      const floor = minZ - 1;
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.payload.id ? { ...c, zIndex: floor } : c
        ),
      };
    }

    case 'SELECT_CARD': {
      const { id, additive } = action.payload;
      if (additive) {
        const already = state.selectedCardIds.includes(id);
        return {
          ...state,
          selectedCardIds: already
            ? state.selectedCardIds.filter((sid) => sid !== id)
            : [...state.selectedCardIds, id],
          selectedDeckId: null,
        };
      }
      return { ...state, selectedCardIds: [id], selectedDeckId: null };
    }

    case 'SELECT_CARDS_IN_RECT': {
      const selRect = action.payload;
      const selected = state.cards
        .filter((c) =>
          aabbIntersects(selRect, { x: c.x, y: c.y, width: CARD_WIDTH, height: CARD_HEIGHT })
        )
        .map((c) => c.id);
      return { ...state, selectedCardIds: selected, selectedDeckId: null };
    }

    case 'DESELECT_ALL': {
      return { ...state, selectedCardIds: [], selectedDeckId: null, selectedHandCard: null };
    }

    case 'UPDATE_RUBBER_BAND': {
      return { ...state, rubberBand: action.payload };
    }

    case 'REMOVE_CARD': {
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.payload.id),
        selectedCardIds: state.selectedCardIds.filter((id) => id !== action.payload.id),
      };
    }

    case 'CLEAR_TABLE': {
      return {
        ...state,
        cards: [],
        decks: [],
        hands: defaultHands,
        selectedCardIds: [],
        selectedDeckId: null,
        selectedHandCard: null,
        activeDrag: null,
        topZIndex: 0,
        lifePoints: { p1: 8000, p2: 8000 },
        turnIndicator: { turn: 'p1' as const, phase: 'Draw' as const },
        // preserve localRole across clear
      };
    }

    case 'SET_PREVIEW_CARD': {
      return { ...state, previewCard: action.payload };
    }

    // ── Deck actions ──────────────────────────────────────────────────────────

    case 'CREATE_DECK': {
      const { cardIds, x, y } = action.payload;
      const deckCards = state.cards.filter((c) => cardIds.includes(c.id));
      if (deckCards.length === 0) return state;
      const newDeck: DeckState = {
        id: uuidv4(),
        cards: deckCards,
        x,
        y,
        zIndex: state.topZIndex + 1,
      };
      return {
        ...state,
        cards: state.cards.filter((c) => !cardIds.includes(c.id)),
        decks: [...state.decks, newDeck],
        topZIndex: state.topZIndex + 1,
        selectedCardIds: [],
        selectedDeckId: null,
      };
    }

    case 'MOVE_DECK': {
      return {
        ...state,
        decks: state.decks.map((d) =>
          d.id === action.payload.id
            ? { ...d, x: action.payload.x, y: action.payload.y }
            : d
        ),
      };
    }

    case 'BRING_DECK_TO_FRONT': {
      const next = state.topZIndex + 1;
      return {
        ...state,
        topZIndex: next,
        decks: state.decks.map((d) =>
          d.id === action.payload.id ? { ...d, zIndex: next } : d
        ),
      };
    }

    case 'SELECT_DECK': {
      return {
        ...state,
        selectedDeckId: action.payload.id,
        selectedCardIds: action.payload.id !== null ? [] : state.selectedCardIds,
      };
    }

    case 'DRAW_FROM_DECK': {
      const deck = state.decks.find((d) => d.id === action.payload.id);
      if (!deck || deck.cards.length === 0) return state;
      const [topCard, ...rest] = deck.cards;
      const drawnCard: CardState = {
        ...topCard!,
        x: deck.x + 20,
        y: deck.y - 30,
        zIndex: state.topZIndex + 1,
      };
      return {
        ...state,
        cards: [...state.cards, drawnCard],
        decks: state.decks.map((d) =>
          d.id === deck.id ? { ...d, cards: rest } : d
        ),
        topZIndex: state.topZIndex + 1,
      };
    }

    case 'ADD_CARDS_TO_DECK': {
      const { deckId, cardIds, position } = action.payload;
      const deck = state.decks.find((d) => d.id === deckId);
      if (!deck) return state;
      const cardsToAdd = state.cards.filter((c) => cardIds.includes(c.id));
      if (cardsToAdd.length === 0) return state;
      let newDeckCards: CardState[];
      if (position === 'top') {
        newDeckCards = [...cardsToAdd, ...deck.cards];
      } else if (position === 'bottom') {
        newDeckCards = [...deck.cards, ...cardsToAdd];
      } else {
        newDeckCards = shuffleArray([...cardsToAdd, ...deck.cards]);
      }
      return {
        ...state,
        cards: state.cards.filter((c) => !cardIds.includes(c.id)),
        selectedCardIds: state.selectedCardIds.filter((id) => !cardIds.includes(id)),
        decks: state.decks.map((d) =>
          d.id === deckId ? { ...d, cards: newDeckCards } : d
        ),
        activeDrag: null,
      };
    }

    case 'REMOVE_CARD_FROM_DECK': {
      const { deckId, cardId } = action.payload;
      const deck = state.decks.find((d) => d.id === deckId);
      if (!deck) return state;
      const card = deck.cards.find((c) => c.id === cardId);
      if (!card) return state;
      const placedCard: CardState = {
        ...card,
        x: deck.x + 20,
        y: deck.y + 20,
        zIndex: state.topZIndex + 1,
      };
      return {
        ...state,
        cards: [...state.cards, placedCard],
        decks: state.decks.map((d) =>
          d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
        ),
        topZIndex: state.topZIndex + 1,
      };
    }

    case 'SHUFFLE_DECK': {
      return {
        ...state,
        decks: state.decks.map((d) => {
          if (d.id !== action.payload.id) return d;
          const idOrder = action.payload.shuffledIds;
          const shuffled = idOrder
            .map((id) => d.cards.find((c) => c.id === id))
            .filter((c): c is CardState => c !== undefined);
          return { ...d, cards: shuffled };
        }),
      };
    }

    case 'DISBAND_DECK': {
      const deck = state.decks.find((d) => d.id === action.payload.id);
      if (!deck) return state;
      const newCards = deck.cards.map((c, i) => ({
        ...c,
        x: deck.x + i * 5,
        y: deck.y + i * 5,
        zIndex: state.topZIndex + i + 1,
      }));
      return {
        ...state,
        cards: [...state.cards, ...newCards],
        decks: state.decks.filter((d) => d.id !== action.payload.id),
        topZIndex: state.topZIndex + deck.cards.length,
        selectedDeckId: state.selectedDeckId === action.payload.id ? null : state.selectedDeckId,
      };
    }

    case 'SET_ACTIVE_DRAG': {
      return { ...state, activeDrag: action.payload };
    }

    case 'CLEAR_ACTIVE_DRAG': {
      return { ...state, activeDrag: null };
    }

    case 'EXPAND_CARDS': {
      const { ids } = action.payload;
      if (ids.length < 2) return state;
      const idSet = new Set(ids);
      const selected = state.cards.filter((c) => idSet.has(c.id));
      const n = selected.length;
      const centroidX = selected.reduce((sum, c) => sum + c.x, 0) / n;
      const centroidY = selected.reduce((sum, c) => sum + c.y, 0) / n;
      const cols = Math.min(LAYOUT_COLS, n);
      const rows = Math.ceil(n / cols);
      const gridWidth = cols * LAYOUT_CARD_WIDTH + (cols - 1) * LAYOUT_GAP;
      const gridHeight = rows * LAYOUT_CARD_HEIGHT + (rows - 1) * LAYOUT_GAP;
      const originX = centroidX - gridWidth / 2;
      const originY = centroidY - gridHeight / 2;
      const positionMap = new Map(
        selected.map((c, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          return [c.id, {
            x: originX + col * (LAYOUT_CARD_WIDTH + LAYOUT_GAP),
            y: originY + row * (LAYOUT_CARD_HEIGHT + LAYOUT_GAP),
          }];
        })
      );
      return {
        ...state,
        cards: state.cards.map((c) => {
          const pos = positionMap.get(c.id);
          return pos ? { ...c, ...pos } : c;
        }),
      };
    }

    case 'IMPORT_DECK': {
      const { cards, x, y, label } = action.payload;
      if (cards.length === 0) return state;
      const deckCards: CardState[] = cards.map((c, i) => ({
        ...c,
        zIndex: state.topZIndex + i + 1,
      }));
      const newDeck: DeckState = {
        id: uuidv4(),
        cards: deckCards,
        x,
        y,
        zIndex: state.topZIndex + cards.length + 1,
        label: label ?? 'Imported Deck',
      };
      return {
        ...state,
        decks: [...state.decks, newDeck],
        topZIndex: state.topZIndex + cards.length + 1,
      };
    }

    case 'COLLAPSE_CARDS': {
      const { ids } = action.payload;
      if (ids.length < 2) return state;
      const idSet = new Set(ids);
      const selected = state.cards.filter((c) => idSet.has(c.id));
      const n = selected.length;
      const centroidX = selected.reduce((sum, c) => sum + c.x, 0) / n;
      const centroidY = selected.reduce((sum, c) => sum + c.y, 0) / n;
      const positionMap = new Map(
        selected.map((c, i) => [c.id, { x: centroidX + i, y: centroidY + i }])
      );
      return {
        ...state,
        cards: state.cards.map((c) => {
          const pos = positionMap.get(c.id);
          return pos ? { ...c, ...pos } : c;
        }),
      };
    }

    // ── Hand actions ──────────────────────────────────────────────────────────

    case 'SELECT_HAND_CARD': {
      return {
        ...state,
        selectedHandCard: action.payload,
        selectedCardIds: [],
        selectedDeckId: null,
      };
    }

    case 'ADD_CARD_TO_HAND': {
      const { cardId, owner } = action.payload;
      const card = state.cards.find((c) => c.id === cardId);
      if (!card) return state;
      const isOpponentHand = state.localRole !== null && owner !== state.localRole;
      const handCard: HandCardState = {
        id: card.id,
        faceImageUrl: isOpponentHand ? card.backImageUrl : card.faceImageUrl,
        backImageUrl: card.backImageUrl,
        isFlipped: card.isFlipped,
        rotation: card.rotation,
        label: card.label,
        desc: card.desc,
        cardType: card.cardType,
        race: card.race,
        attribute: card.attribute,
        level: card.level,
        atk: card.atk,
        def: card.def,
        linkval: card.linkval,
        linkmarkers: card.linkmarkers,
      };
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== cardId),
        selectedCardIds: state.selectedCardIds.filter((id) => id !== cardId),
        hands: state.hands.map((h) =>
          h.owner === owner ? { ...h, cards: [...h.cards, handCard] } : h
        ),
        activeDrag: null,
        selectedHandCard: null,
      };
    }

    case 'REMOVE_CARD_FROM_HAND': {
      const { cardId, owner, x, y, faceImageUrl } = action.payload;
      const hand = state.hands.find((h) => h.owner === owner);
      if (!hand) return state;
      const handCard = hand.cards.find((c) => c.id === cardId);
      if (!handCard) return state;
      const newCard: CardState = {
        ...handCard,
        faceImageUrl,
        x,
        y,
        zIndex: state.topZIndex + 1,
        placedBy: owner,
      };
      return {
        ...state,
        cards: [...state.cards, newCard],
        topZIndex: state.topZIndex + 1,
        hands: state.hands.map((h) =>
          h.owner === owner ? { ...h, cards: h.cards.filter((c) => c.id !== cardId) } : h
        ),
      };
    }

    case 'FLIP_HAND_CARD': {
      const { cardId, owner } = action.payload;
      return {
        ...state,
        hands: state.hands.map((h) =>
          h.owner === owner
            ? { ...h, cards: h.cards.map((c) => c.id === cardId ? { ...c, isFlipped: !c.isFlipped } : c) }
            : h
        ),
      };
    }

    case 'ROTATE_HAND_CARD': {
      const { cardId, owner, degrees } = action.payload;
      return {
        ...state,
        hands: state.hands.map((h) =>
          h.owner === owner
            ? { ...h, cards: h.cards.map((c) => c.id === cardId ? { ...c, rotation: normalizeRotation(c.rotation + degrees) } : c) }
            : h
        ),
      };
    }

    case 'REORDER_HAND_CARD': {
      const { cardId, owner, toIndex } = action.payload;
      const hand = state.hands.find((h) => h.owner === owner);
      if (!hand) return state;
      const fromIndex = hand.cards.findIndex((c) => c.id === cardId);
      if (fromIndex === -1) return state;
      const newCards = [...hand.cards];
      const [moved] = newCards.splice(fromIndex, 1);
      newCards.splice(toIndex, 0, moved!);
      return {
        ...state,
        hands: state.hands.map((h) =>
          h.owner === owner ? { ...h, cards: newCards } : h
        ),
      };
    }

    case 'SET_LOCAL_ROLE': {
      return { ...state, localRole: action.payload.role };
    }

    case 'NEXT_PHASE': {
      const idx = PHASES.indexOf(state.turnIndicator.phase);
      const isLast = idx === PHASES.length - 1;
      return {
        ...state,
        turnIndicator: isLast
          ? { turn: state.turnIndicator.turn === 'p1' ? 'p2' as const : 'p1' as const, phase: 'Draw' as const }
          : { ...state.turnIndicator, phase: PHASES[idx + 1]! },
      };
    }

    case 'SET_TURN_PHASE': {
      return { ...state, turnIndicator: action.payload };
    }

    case 'SET_LIFE_POINTS': {
      const { player, value } = action.payload;
      return { ...state, lifePoints: { ...state.lifePoints, [player]: Math.max(0, value) } };
    }

    case 'ADJUST_LIFE_POINTS': {
      const { player, delta } = action.payload;
      const next = state.lifePoints[player] + delta;
      return { ...state, lifePoints: { ...state.lifePoints, [player]: Math.max(0, next) } };
    }

    case 'LOAD_REMOTE_STATE': {
      const p = action.payload;
      return {
        ...state,
        cards: p.cards,
        decks: p.decks,
        hands: p.hands,
        topZIndex: p.topZIndex,
        lifePoints: p.lifePoints ?? { p1: 8000, p2: 8000 },
        turnIndicator: p.turnIndicator ?? { turn: 'p1', phase: 'Draw' },
        selectedCardIds: [],
        selectedDeckId: null,
        selectedHandCard: null,
        activeDrag: null,
        rubberBand: null,
        previewCard: null,
      };
    }

    default:
      return state;
  }
}

export function useTableReducer() {
  // Lazy initializer ensures localStorage is only accessed client-side (prevents SSR crash)
  const [state, dispatch] = useReducer(tableReducer, undefined, loadInitialState);

  return { state, dispatch };
}

export { normalizeRect };
