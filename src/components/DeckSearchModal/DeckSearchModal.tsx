'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { CardState } from '~/types/card';
import { useTable } from '~/context/TableContext';
import styles from './DeckSearchModal.module.css';

interface Props {
  deckId: string;
  onClose: () => void;
}

export function DeckSearchModal({ deckId, onClose }: Props) {
  const { state, dispatch } = useTable();
  const deck = state.decks.find((d) => d.id === deckId);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close if deck no longer exists (e.g., disbanded)
  useEffect(() => {
    if (!deck) onClose();
  }, [deck, onClose]);

  if (!deck) return null;

  function handleCardClick(card: CardState) {
    // Single click: preview the card
    // Use a short timer so double-click can cancel it
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_PREVIEW_CARD', payload: { imageUrl: card.faceImageUrl.replace('/images/cards/', '/images/cards_cropped/'), label: card.label, desc: card.desc, cardType: card.cardType, race: card.race, attribute: card.attribute, level: card.level, atk: card.atk, def: card.def, linkval: card.linkval, linkmarkers: card.linkmarkers } });
    }, 200);
  }

  function handleCardDoubleClick(card: CardState) {
    // Cancel the pending single-click preview
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    // Remove from deck and place on field
    dispatch({ type: 'REMOVE_CARD_FROM_DECK', payload: { deckId, cardId: card.id } });
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className={styles.backdrop} onMouseDown={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {deck.label ?? 'Deck'} ({deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''})
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          {deck.cards.length === 0 ? (
            <p className={styles.empty}>This deck is empty.</p>
          ) : (
            <div className={styles.grid}>
              {deck.cards.map((card) => (
                <div
                  key={card.id}
                  className={styles.cardItem}
                  onClick={() => handleCardClick(card)}
                  onDoubleClick={() => handleCardDoubleClick(card)}
                  title={card.label ?? 'Card'}
                >
                  <img
                    src={card.faceImageUrl}
                    alt={card.label ?? 'Card'}
                    loading="lazy"
                  />
                  {card.label && (
                    <span className={styles.cardLabel}>{card.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className={styles.hint}>Click to preview · Double-click to remove from deck</p>
      </div>
    </div>,
    document.body
  );
}
