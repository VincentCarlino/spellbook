'use client';

import Draggable, { type DraggableEventHandler } from 'react-draggable';
import { useRef, type MouseEvent } from 'react';
import type { DeckState } from '~/types/card';
import { useTable } from '~/context/TableContext';
import styles from './Deck.module.css';

interface Props {
  deck: DeckState;
  onContextMenu: (e: MouseEvent, deckId: string) => void;
}

export function Deck({ deck, onContextMenu }: Props) {
  const { state, dispatch } = useTable();
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragStartClient = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
  const isSelected = state.selectedDeckId === deck.id;
  const showDropZones = state.activeDrag !== null;

  const backImageUrl = deck.cards.length > 0
    ? deck.cards[0]!.backImageUrl
    : '/card-back.svg';

  const handleMouseDown = (e: MouseEvent) => {
    hasDragged.current = false;
    dragStartClient.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  };

  const handleDragStart: DraggableEventHandler = (e) => {
    e.stopPropagation();
    dispatch({ type: 'BRING_DECK_TO_FRONT', payload: { id: deck.id } });
  };

  const handleDrag: DraggableEventHandler = (e) => {
    if (!hasDragged.current) {
      const { clientX, clientY } = e as globalThis.MouseEvent;
      const dx = clientX - (dragStartClient.current?.x ?? clientX);
      const dy = clientY - (dragStartClient.current?.y ?? clientY);
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true;
    }
  };

  const handleDragStop: DraggableEventHandler = (_e, data) => {
    dispatch({ type: 'BRING_DECK_TO_FRONT', payload: { id: deck.id } });
    dispatch({ type: 'MOVE_DECK', payload: { id: deck.id, x: data.x, y: data.y } });
  };

  const handleClick = (e: MouseEvent) => {
    if (hasDragged.current) return;
    e.stopPropagation();
    dispatch({ type: 'SELECT_DECK', payload: { id: deck.id } });
  };

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'DRAW_FROM_DECK', payload: { id: deck.id } });
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, deck.id);
  };

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      position={{ x: deck.x, y: deck.y }}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
    >
      <div
        ref={nodeRef}
        style={{ position: 'absolute', zIndex: deck.zIndex }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        aria-label={deck.label ?? `Deck (${deck.cards.length} cards)`}
      >
        <div className={`${styles.container} ${isSelected ? styles.selected : ''}`}>
          <div className={styles.stack}>
            {/* Stacked layers (back-most to front) */}
            {deck.cards.length >= 3 && (
              <div className={`${styles.layer} ${styles.layer1}`}>
                <img src={backImageUrl} alt="" draggable={false} />
              </div>
            )}
            {deck.cards.length >= 2 && (
              <div className={`${styles.layer} ${styles.layer2}`}>
                <img src={backImageUrl} alt="" draggable={false} />
              </div>
            )}
            <div className={`${styles.layer} ${styles.layer3}`}>
              <img src={backImageUrl} alt="Deck" draggable={false} />
              {deck.cards.length === 0 && (
                <span className={styles.emptyLabel}>Empty</span>
              )}
            </div>

            {/* Drop zone overlay — shown whenever any card is being dragged */}
            {showDropZones && (
              <div className={styles.dropZones}>
                <div className={`${styles.zone} ${styles.zoneTop}`}>↑ Top</div>
                <div className={`${styles.zone} ${styles.zoneShuffle}`}>⇄ Shuffle</div>
                <div className={`${styles.zone} ${styles.zoneBottom}`}>↓ Bottom</div>
              </div>
            )}
          </div>

          {/* Count badge */}
          <div className={styles.badge}>{deck.cards.length}</div>
        </div>
      </div>
    </Draggable>
  );
}
