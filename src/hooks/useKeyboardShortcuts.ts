'use client';

import { useEffect } from 'react';
import type { TableState, TableAction, CardState } from '~/types/card';

interface Params {
  state: TableState;
  dispatch: React.Dispatch<TableAction>;
  onPingCards?: (cards: CardState[]) => void;
}

export function useKeyboardShortcuts({ state, dispatch, onPingCards }: Params) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire shortcuts when typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        if (state.cards.length > 0) {
          e.preventDefault();
          dispatch({
            type: 'SELECT_CARDS_IN_RECT',
            payload: { x: -Infinity, y: -Infinity, width: Infinity, height: Infinity },
          });
        }
        return;
      }

      switch (e.key) {
        case 'd':
        case 'D':
          if (state.selectedDeckId) {
            e.preventDefault();
            dispatch({ type: 'DRAW_FROM_DECK', payload: { id: state.selectedDeckId } });
          }
          break;

        case 'r':
        case 'R':
          if (state.selectedCardIds.length > 0) {
            e.preventDefault();
            state.selectedCardIds.forEach((id) => {
              dispatch({ type: 'ROTATE_CARD', payload: { id, degrees: 90 } });
            });
          }
          break;

        case 'f':
        case 'F':
          if (state.selectedCardIds.length > 0) {
            e.preventDefault();
            state.selectedCardIds.forEach((id) => {
              dispatch({ type: 'FLIP_CARD', payload: { id } });
            });
          } else if (state.selectedHandCard) {
            e.preventDefault();
            dispatch({ type: 'FLIP_HAND_CARD', payload: { cardId: state.selectedHandCard.id, owner: state.selectedHandCard.owner } });
          }
          break;

        case 'g':
        case 'G':
          if (state.selectedCardIds.length >= 1) {
            e.preventDefault();
            const firstCard = state.cards.find((c) => c.id === state.selectedCardIds[0]);
            if (firstCard) {
              dispatch({ type: 'CREATE_DECK', payload: { cardIds: state.selectedCardIds, x: firstCard.x, y: firstCard.y } });
            }
          }
          break;

        case 'e':
        case 'E':
          if (state.selectedCardIds.length > 0 && onPingCards) {
            e.preventDefault();
            const cards = state.cards.filter((c) => state.selectedCardIds.includes(c.id));
            onPingCards(cards);
          }
          break;

        case 'x':
        case 'X':
          if (state.selectedCardIds.length >= 2) {
            e.preventDefault();
            dispatch({ type: 'EXPAND_CARDS', payload: { ids: state.selectedCardIds } });
          }
          break;

        case 'c':
        case 'C':
          if (state.selectedCardIds.length >= 2) {
            e.preventDefault();
            dispatch({ type: 'COLLAPSE_CARDS', payload: { ids: state.selectedCardIds } });
          }
          break;

        case 'Escape':
          dispatch({ type: 'DESELECT_ALL' });
          break;

        case 'Delete':
        case 'Backspace':
          if (state.selectedCardIds.length > 0) {
            e.preventDefault();
            state.selectedCardIds.forEach((id) => {
              dispatch({ type: 'REMOVE_CARD', payload: { id } });
            });
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.cards, state.selectedCardIds, state.selectedDeckId, state.selectedHandCard, dispatch, onPingCards]);
}
