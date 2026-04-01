'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTable } from '~/context/TableContext';
import styles from './CardContextMenu.module.css';

interface Props {
  cardId: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function CardContextMenu({ cardId, x, y, onClose }: Props) {
  const { state, dispatch } = useTable();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Adjust position to stay within viewport
  const menuStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 240),
    left: Math.min(x, window.innerWidth - 180),
  };

  function act(fn: () => void) {
    fn();
    onClose();
  }

  return createPortal(
    <>
      {/* Invisible overlay to catch outside clicks */}
      <div className={styles.overlay} onMouseDown={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div ref={menuRef} className={styles.menu} style={menuStyle}>
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'ROTATE_CARD', payload: { id: cardId, degrees: 90 } }))}
        >
          ↻ Rotate CW 90°
        </button>
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'ROTATE_CARD', payload: { id: cardId, degrees: -90 } }))}
        >
          ↺ Rotate CCW 90°
        </button>
        <div className={styles.separator} />
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'FLIP_CARD', payload: { id: cardId } }))}
        >
          ⇄ Flip Card
        </button>
        <div className={styles.separator} />
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'BRING_TO_FRONT', payload: { id: cardId } }))}
        >
          ⬆ Bring to Front
        </button>
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'SEND_TO_BACK', payload: { id: cardId } }))}
        >
          ⬇ Send to Back
        </button>
        <div className={styles.separator} />
        <button
          className={styles.item}
          onClick={() => act(() => {
            const card = state.cards.find((c) => c.id === cardId)!;
            const ids = state.selectedCardIds.includes(cardId) && state.selectedCardIds.length > 1
              ? state.selectedCardIds
              : [cardId];
            dispatch({ type: 'CREATE_DECK', payload: { cardIds: ids, x: card.x, y: card.y } });
          })}
        >
          ⊞ Create Deck{state.selectedCardIds.includes(cardId) && state.selectedCardIds.length > 1
            ? ` (${state.selectedCardIds.length})` : ''}
        </button>
        <div className={styles.separator} />
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'REMOVE_CARD', payload: { id: cardId } }))}
          style={{ color: '#f38ba8' }}
        >
          ✕ Remove Card
        </button>
      </div>
    </>,
    document.body
  );
}
