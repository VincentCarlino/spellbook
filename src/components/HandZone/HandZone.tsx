'use client';

import { type MouseEvent } from 'react';
import type { HandOwner } from '~/types/card';
import { useTable } from '~/context/TableContext';
import { HandCard } from './HandCard';
import styles from './HandZone.module.css';

const CARD_W = 80;
const CARD_H = 112;

interface Props {
  owner: HandOwner;
  zoneRef: React.RefObject<HTMLDivElement | null>;
  onCardContextMenu: (e: MouseEvent, cardId: string, owner: HandOwner) => void;
}

export function HandZone({ owner, zoneRef, onCardContextMenu }: Props) {
  const { state, dispatch, clientToCanvas, role } = useTable();
  const hand = state.hands.find((h) => h.owner === owner);
  const cards = hand?.cards ?? [];

  // Show faces for the current player's own hand; solo mode defaults to p1 as self
  const isMyHand = owner === (role ?? 'p1');
  const showFace = isMyHand;

  // Highlight the strip when a field card or deck card is being dragged
  const isDragActive = state.activeDrag !== null;

  function handleDragToField(cardId: string, cardOwner: HandOwner, clientX: number, clientY: number) {
    const { x, y } = clientToCanvas(clientX, clientY);
    const ownerHand = state.hands.find((h) => h.owner === cardOwner);
    const handCard = ownerHand?.cards.find((c) => c.id === cardId);
    dispatch({
      type: 'REMOVE_CARD_FROM_HAND',
      payload: { cardId, owner: cardOwner, x: x - CARD_W / 2, y: y - CARD_H / 2, faceImageUrl: handCard?.faceImageUrl ?? '' },
    });
  }

  return (
    <div
      ref={zoneRef}
      className={`${styles.strip} ${owner === 'p1' ? styles.p1Strip : styles.p2Strip} ${isDragActive ? styles.dropHighlight : ''}`}
    >
      <div className={styles.label}>{isMyHand ? 'Your Hand' : "Opponent's Hand"}</div>
      <div className={styles.cardRow}>
        {cards.length === 0 && (
          <div className={styles.emptyHint}>Drag cards here</div>
        )}
        {cards.map((card, index) => (
          <HandCard
            key={card.id}
            card={card}
            owner={owner}
            index={index}
            totalCards={cards.length}
            showFace={showFace}
            onContextMenu={onCardContextMenu}
            onDragToField={handleDragToField}
          />
        ))}
      </div>
    </div>
  );
}
