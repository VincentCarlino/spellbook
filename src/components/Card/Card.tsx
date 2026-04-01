'use client';

import Draggable, { type DraggableEventHandler } from 'react-draggable';
import { useRef, type MouseEvent } from 'react';
import type { CardState, HandOwner } from '~/types/card';
import { useTable } from '~/context/TableContext';
import { ZONES, ZONE_DIMS } from '~/components/FieldLayout/FieldLayout';
import styles from './Card.module.css';

const CARD_W = 100;
const CARD_H = 140;

interface Props {
  card: CardState;
  onContextMenu: (e: MouseEvent, cardId: string) => void;
}


export function Card({ card, onContextMenu }: Props) {
  const { state, dispatch, role, getHandZoneRect } = useTable();
  const nodeRef = useRef<HTMLDivElement>(null);
  // Track raw client coords from mousedown — independent of react-draggable's
  // internal coordinate system, which can drift in controlled (position prop) mode.
  const dragStartClient = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
  const isSelected = state.selectedCardIds.includes(card.id);

  // rAF throttling: at most one broadcast per animation frame during drag
  const rafRef = useRef<number | null>(null);
  // Accumulated canvas position for single-card drag (initialized at dragStart)
  const pendingPosRef = useRef({ x: 0, y: 0 });
  // Accumulated canvas delta for multi-card drag
  const pendingDeltaRef = useRef({ dx: 0, dy: 0 });
  // IDs being dragged — captured at dragStart so rAF callbacks have stable refs
  const dragIdsRef = useRef<string[]>([]);

  // For P2's 180°-rotated view, screen drag direction is opposite to canvas direction.
  // sign = -1 inverts deltas so canvas positions move correctly for P2.
  const sign = role === 'p2' ? -1 : 1;

  const handleMouseDown = (e: MouseEvent) => {
    hasDragged.current = false;
    dragStartClient.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  };

  const handleDragStart: DraggableEventHandler = (e) => {
    e.stopPropagation();
    dispatch({ type: 'BRING_TO_FRONT', payload: { id: card.id } });
    const draggedIds = isSelected && state.selectedCardIds.length > 1
      ? state.selectedCardIds
      : [card.id];
    dragIdsRef.current = draggedIds;
    // Initialize accumulated canvas position from the card's current state position.
    // Using delta accumulation (not data.x/data.y) avoids feedback loops in controlled
    // mode: when we update the position prop mid-drag, react-draggable resets its
    // internal base, corrupting data.x — but data.deltaX is always the raw mouse delta.
    pendingPosRef.current = { x: card.x, y: card.y };
    dispatch({ type: 'SET_ACTIVE_DRAG', payload: { cardIds: draggedIds } });
  };

  const handleDrag: DraggableEventHandler = (e, data) => {
    if (!hasDragged.current) {
      const { clientX, clientY } = e as globalThis.MouseEvent;
      const dx = clientX - (dragStartClient.current?.x ?? clientX);
      const dy = clientY - (dragStartClient.current?.y ?? clientY);
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true;
    }

    if (dragIdsRef.current.length > 1) {
      // Multi-card: accumulate canvas deltas and apply (local + broadcast) at most once per frame.
      pendingDeltaRef.current.dx += data.deltaX * sign;
      pendingDeltaRef.current.dy += data.deltaY * sign;
      rafRef.current ??= requestAnimationFrame(() => {
        const { dx, dy } = pendingDeltaRef.current;
        pendingDeltaRef.current = { dx: 0, dy: 0 };
        rafRef.current = null;
        dispatch({ type: 'MOVE_CARDS', payload: { ids: dragIdsRef.current, dx, dy } });
      });
    } else {
      // Single card: accumulate canvas position via deltas and apply at most once per frame.
      // Using deltaX/deltaY (not data.x/data.y) prevents the position-prop-reset feedback
      // loop that occurs when we update state mid-drag in controlled mode.
      pendingPosRef.current = {
        x: pendingPosRef.current.x + data.deltaX * sign,
        y: pendingPosRef.current.y + data.deltaY * sign,
      };
      rafRef.current ??= requestAnimationFrame(() => {
        const { x, y } = pendingPosRef.current;
        rafRef.current = null;
        dispatch({ type: 'MOVE_CARD', payload: { id: card.id, x, y } });
      });
    }
  };

  const handleDragStop: DraggableEventHandler = (e, data) => {
    // Cancel any pending rAF and flush accumulated state so the final position
    // is always authoritative and no stale update fires after dragStop.
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      const { dx, dy } = pendingDeltaRef.current;
      if ((dx !== 0 || dy !== 0) && dragIdsRef.current.length > 1) {
        dispatch({ type: 'MOVE_CARDS', payload: { ids: dragIdsRef.current, dx, dy } });
      }
      pendingDeltaRef.current = { dx: 0, dy: 0 };
    }

    // For single-card drag, apply any remaining delta to pendingPosRef so it reflects
    // the final mouse position (the last handleDrag may not have included it if the
    // rAF was pending when the mouse button was released).
    if (dragIdsRef.current.length === 1) {
      pendingPosRef.current = {
        x: pendingPosRef.current.x + data.deltaX * sign,
        y: pendingPosRef.current.y + data.deltaY * sign,
      };
    }

    // Use the accumulated canvas position for zone detection and the final dispatch.
    const canvasX = pendingPosRef.current.x;
    const canvasY = pendingPosRef.current.y;
    const cardCenterX = canvasX + CARD_W / 2;
    const cardCenterY = canvasY + CARD_H / 2;

    // Check if dropped onto a hand zone.
    // getHandZoneRect returns getBoundingClientRect() — screen-space coordinates —
    // so compare directly with raw clientX/Y (no adjustClient needed or correct here).
    if (state.activeDrag) {
      const { clientX, clientY } = e as globalThis.MouseEvent;
      for (const owner of ['p1', 'p2'] as HandOwner[]) {
        const rect = getHandZoneRect(owner);
        if (rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
          state.activeDrag.cardIds.forEach((id) =>
            dispatch({ type: 'ADD_CARD_TO_HAND', payload: { cardId: id, owner } })
          );
          dispatch({ type: 'CLEAR_ACTIVE_DRAG' });
          return;
        }
      }
    }

    // Check if the card was dropped onto a deck (center-point-in-bounds detection)
    if (state.activeDrag) {
      for (const deck of state.decks) {
        if (
          cardCenterX >= deck.x && cardCenterX <= deck.x + 100 &&
          cardCenterY >= deck.y && cardCenterY <= deck.y + 140
        ) {
          const relY = cardCenterY - deck.y;
          const position = relY < 47 ? 'top' : relY < 93 ? 'shuffle' : 'bottom';
          dispatch({
            type: 'ADD_CARDS_TO_DECK',
            payload: { deckId: deck.id, cardIds: state.activeDrag.cardIds, position },
          });
          dispatch({ type: 'CLEAR_ACTIVE_DRAG' });
          return;
        }
      }
    }

    // Zone snap + final position update only applies to the anchor card in single-card drags.
    // For multi-card drags, MOVE_CARDS (flushed above) already moved all cards correctly;
    // dispatching MOVE_CARD here would snap the anchor back to its drag-start position
    // because pendingPosRef is only updated during single-card drags.
    if (dragIdsRef.current.length === 1) {
      const snappedZone = ZONES.find(
        (zone) =>
          cardCenterX >= zone.x &&
          cardCenterX <= zone.x + ZONE_DIMS.w &&
          cardCenterY >= zone.y &&
          cardCenterY <= zone.y + ZONE_DIMS.h,
      );
      const finalX = snappedZone
        ? snappedZone.x + (ZONE_DIMS.w - CARD_W) / 2
        : canvasX;
      const finalY = snappedZone
        ? snappedZone.y + (ZONE_DIMS.h - CARD_H) / 2
        : canvasY;

      dispatch({ type: 'BRING_TO_FRONT', payload: { id: card.id } });
      dispatch({ type: 'MOVE_CARD', payload: { id: card.id, x: finalX, y: finalY } });
    }
    dispatch({ type: 'CLEAR_ACTIVE_DRAG' });
  };

  const handleClick = (e: MouseEvent) => {
    if (hasDragged.current) return;
    e.stopPropagation();
    dispatch({ type: 'BRING_TO_FRONT', payload: { id: card.id } });
    dispatch({ type: 'SELECT_CARD', payload: { id: card.id, additive: e.shiftKey } });
    // Face-down cards are hidden information: only show the preview to the player who
    // placed the card from their hand. In solo mode (role === null) always show.
    const canPreview = !card.isFlipped
      || role === null
      || card.placedBy === undefined
      || role === card.placedBy;
    if (canPreview) {
      dispatch({ type: 'SET_PREVIEW_CARD', payload: { imageUrl: card.faceImageUrl.replace('/images/cards/', '/images/cards_cropped/'), label: card.label, desc: card.desc, cardType: card.cardType, race: card.race, attribute: card.attribute, level: card.level, atk: card.atk, def: card.def, linkval: card.linkval, linkmarkers: card.linkmarkers } });
    }
  };

  const handleContextMenuInternal = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, card.id);
  };

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      position={{ x: card.x, y: card.y }}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
    >
      <div
        ref={nodeRef}
        style={{ position: 'absolute', zIndex: card.zIndex }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleContextMenuInternal}
        aria-label={card.label ?? 'Card'}
      >
        <div
          className={`${styles.wrapper} ${isSelected ? styles.selected : ''}`}
          style={{ transform: `rotate(${card.rotation}deg)` }}
        >
        <div className={`${styles.inner} ${card.isFlipped ? styles.flipped : ''}`}>
          <div className={styles.face}>
            <img src={card.faceImageUrl} alt={card.label ?? 'Card face'} draggable={false} />
          </div>
          <div className={styles.back}>
            <img src={card.backImageUrl} alt="Card back" draggable={false} />
          </div>
        </div>
        </div>
      </div>
    </Draggable>
  );
}
