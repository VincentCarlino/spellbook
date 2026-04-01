'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTable } from '~/context/TableContext';
import styles from '../CardContextMenu/CardContextMenu.module.css';

interface Props {
  deckId: string;
  x: number;
  y: number;
  onClose: () => void;
  onSearch: (deckId: string) => void;
}

function shuffleIds(ids: string[]): string[] {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function DeckContextMenu({ deckId, x, y, onClose, onSearch }: Props) {
  const { state, dispatch } = useTable();
  const menuRef = useRef<HTMLDivElement>(null);
  const [drawSubmenuOpen, setDrawSubmenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 200),
    left: Math.min(x, window.innerWidth - 180),
  };

  function act(fn: () => void) {
    fn();
    onClose();
  }

  return createPortal(
    <>
      <div
        className={styles.overlay}
        onMouseDown={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div ref={menuRef} className={styles.menu} style={menuStyle}>
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'DRAW_FROM_DECK', payload: { id: deckId } }))}
        >
          ↑ Draw Card
        </button>
        <div
          className={styles.itemWithSub}
          onMouseEnter={() => setDrawSubmenuOpen(true)}
          onMouseLeave={() => setDrawSubmenuOpen(false)}
        >
          <button className={styles.item}>
            ↑ Draw Multiple <span className={styles.subArrow}>▶</span>
          </button>
          {drawSubmenuOpen && (
            <div className={styles.submenu}>
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={styles.item}
                  onClick={() => act(() => {
                    for (let i = 0; i < n; i++) {
                      dispatch({ type: 'DRAW_FROM_DECK', payload: { id: deckId } });
                    }
                  })}
                >
                  Draw {n}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={styles.item}
          onClick={() => act(() => {
            const deck = state.decks.find((d) => d.id === deckId);
            const shuffledIds = shuffleIds(deck ? deck.cards.map((c) => c.id) : []);
            dispatch({ type: 'SHUFFLE_DECK', payload: { id: deckId, shuffledIds } });
          })}
        >
          ⇄ Shuffle Deck
        </button>
        <button
          className={styles.item}
          onClick={() => { onSearch(deckId); onClose(); }}
        >
          🔍 Search Deck
        </button>
        <div className={styles.separator} />
        <button
          className={styles.item}
          onClick={() => act(() => dispatch({ type: 'DISBAND_DECK', payload: { id: deckId } }))}
          style={{ color: '#f38ba8' }}
        >
          ↕ Disband Deck
        </button>
      </div>
    </>,
    document.body
  );
}
