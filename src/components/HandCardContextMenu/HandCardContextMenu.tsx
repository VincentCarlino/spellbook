'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { HandOwner } from '~/types/card';
import { useTable } from '~/context/TableContext';
import styles from '../CardContextMenu/CardContextMenu.module.css';

const CARD_W = 80;
const CARD_H = 112;

interface Props {
  cardId: string;
  owner: HandOwner;
  x: number;
  y: number;
  onClose: () => void;
}

export function HandCardContextMenu({ cardId, owner, x, y, onClose }: Props) {
  const { state, dispatch, getViewportCenter } = useTable();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 220),
    left: Math.min(x, window.innerWidth - 180),
  };

  function act(fn: () => void) {
    fn();
    onClose();
  }

  function sendToField() {
    const center = getViewportCenter();
    const ownerHand = state.hands.find((h) => h.owner === owner);
    const handCard = ownerHand?.cards.find((c) => c.id === cardId);
    dispatch({
      type: 'REMOVE_CARD_FROM_HAND',
      payload: { cardId, owner, x: center.x - CARD_W / 2, y: center.y - CARD_H / 2, faceImageUrl: handCard?.faceImageUrl ?? '' },
    });
  }

  return createPortal(
    <>
      <div className={styles.overlay} onMouseDown={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div ref={menuRef} className={styles.menu} style={menuStyle}>
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'ROTATE_HAND_CARD', payload: { cardId, owner, degrees: 90 } }))}
        >
          ↻ Rotate CW 90°
        </button>
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'ROTATE_HAND_CARD', payload: { cardId, owner, degrees: -90 } }))}
        >
          ↺ Rotate CCW 90°
        </button>
        <div className={styles.separator} />
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'FLIP_HAND_CARD', payload: { cardId, owner } }))}
        >
          ⇄ Flip Card
        </button>
        <div className={styles.separator} />
        <button
          className={styles.item}
          onClick={() => act(sendToField)}
        >
          ⬆ Send to Field
        </button>
        <div className={styles.separator} />
        <button
          className={styles.item}
          onClick={() => act(() => {
            dispatch({ type: 'REMOVE_CARD_FROM_HAND', payload: { cardId, owner, x: 0, y: 0, faceImageUrl: '' } });
            dispatch({ type: 'REMOVE_CARD', payload: { id: cardId } });
          })}
          style={{ color: '#f38ba8' }}
        >
          ✕ Remove Card
        </button>
      </div>
    </>,
    document.body
  );
}
