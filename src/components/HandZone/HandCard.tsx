'use client';

import { useState, useRef, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import type { HandCardState, HandOwner } from '~/types/card';
import { useTable } from '~/context/TableContext';
import styles from './HandCard.module.css';

const CARD_W = 80;
const CARD_H = 112;

interface Props {
  card: HandCardState;
  owner: HandOwner;
  index: number;
  totalCards: number;
  showFace: boolean;
  onContextMenu: (e: MouseEvent, cardId: string, owner: HandOwner) => void;
  onDragToField: (cardId: string, owner: HandOwner, clientX: number, clientY: number) => void;
}

export function HandCard({ card, owner, index, totalCards, showFace, onContextMenu, onDragToField }: Props) {
  const { state, dispatch, getHandZoneRect, role } = useTable();
  const isMyHand = owner === (role ?? 'p1');
  const nodeRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const isSelected = state.selectedHandCard?.id === card.id && state.selectedHandCard?.owner === owner;

  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    if (!isMyHand) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    setGhostPos({ x: e.clientX, y: e.clientY });

    function onMouseMove(me: globalThis.MouseEvent) {
      if (!hasMoved && (Math.abs(me.clientX - startX) > 4 || Math.abs(me.clientY - startY) > 4)) {
        hasMoved = true;
        setDragging(true);
      }
      if (hasMoved) {
        setGhostPos({ x: me.clientX, y: me.clientY });
      }
    }

    function onMouseUp(me: globalThis.MouseEvent) {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setDragging(false);

      if (!hasMoved) {
        // Toggle selection on click
        dispatch({
          type: 'SELECT_HAND_CARD',
          payload: isSelected ? null : { id: card.id, owner },
        });
        // Show card preview only for the player's own hand
        if (showFace) {
          dispatch({ type: 'SET_PREVIEW_CARD', payload: { imageUrl: card.faceImageUrl.replace('/images/cards/', '/images/cards_cropped/'), label: card.label, desc: card.desc, cardType: card.cardType, race: card.race, attribute: card.attribute, level: card.level, atk: card.atk, def: card.def, linkval: card.linkval, linkmarkers: card.linkmarkers } });
        }
        return;
      }

      const rect = getHandZoneRect(owner);
      if (!rect || me.clientX < rect.left || me.clientX > rect.right || me.clientY < rect.top || me.clientY > rect.bottom) {
        onDragToField(card.id, owner, me.clientX, me.clientY);
        return;
      }

      // Dropped within hand — reorder by x position
      const relativeX = me.clientX - rect.left;
      const cardSlotWidth = rect.width / Math.max(totalCards, 1);
      const newIndex = Math.max(0, Math.min(totalCards - 1, Math.floor(relativeX / cardSlotWidth)));
      if (newIndex !== index) {
        dispatch({ type: 'REORDER_HAND_CARD', payload: { cardId: card.id, owner, toIndex: newIndex } });
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    if (!isMyHand) return;
    e.stopPropagation();
    onContextMenu(e, card.id, owner);
  }

  const isFlippedForDisplay = !showFace || card.isFlipped;

  const cardFace = (
    <div
      className={styles.cardWrapper}
      style={{ transform: `rotate(${card.rotation}deg)` }}
    >
      <div className={`${styles.cardInner} ${isFlippedForDisplay ? styles.flipped : ''}`}>
        <div className={styles.face}>
          <img src={card.faceImageUrl} alt={card.label ?? 'Card face'} draggable={false} />
        </div>
        <div className={styles.back}>
          <img src={card.backImageUrl} alt="Card back" draggable={false} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={nodeRef}
        className={styles.cardSlot}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        style={{
          zIndex: 100 + index,
          opacity: dragging ? 0.35 : 1,
          outline: isSelected ? '2px solid rgba(99, 179, 237, 0.9)' : undefined,
          outlineOffset: isSelected ? '2px' : undefined,
          borderRadius: isSelected ? '5px' : undefined,
        }}
        aria-label={card.label ?? 'Card'}
      >
        {cardFace}
      </div>
      {dragging && createPortal(
        <div
          style={{
            position: 'fixed',
            left: ghostPos.x - CARD_W / 2,
            top: ghostPos.y - CARD_H / 2,
            width: CARD_W,
            height: CARD_H,
            pointerEvents: 'none',
            zIndex: 9999,
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))',
          }}
        >
          {cardFace}
        </div>,
        document.body
      )}
    </>
  );
}
