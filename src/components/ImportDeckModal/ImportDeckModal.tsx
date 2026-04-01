'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { useTable } from '~/context/TableContext';
import { useCardDatabase } from '~/hooks/useCardDatabase';
import { decodeYdke } from '~/utils/ydke';
import styles from './ImportDeckModal.module.css';

interface Props {
  onClose: () => void;
}

export function ImportDeckModal({ onClose }: Props) {
  const { dispatch, getViewportCenter } = useTable();
  const { cards, loading } = useCardDatabase();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text.trim());
      setError(null);
    } catch {
      setError('Could not read clipboard. Please paste manually.');
    }
  }

  function handleImport() {
    setError(null);
    let decoded;
    try {
      decoded = decodeYdke(input.trim());
    } catch (e) {
      setError((e as Error).message);
      return;
    }

    const sections: { passcodes: number[]; label: string }[] = [
      { passcodes: decoded.main, label: 'Main Deck' },
      { passcodes: decoded.extra, label: 'Extra Deck' },
      { passcodes: decoded.side, label: 'Side Deck' },
    ].filter((s) => s.passcodes.length > 0);

    if (sections.length === 0) {
      setError('No cards found in ydke string.');
      return;
    }

    const cardMap = new Map(cards.map((c) => [c.id, c]));
    const { x, y } = getViewportCenter();
    let skipped = 0;
    let totalImported = 0;

    // Offset each deck slightly so they don't perfectly overlap
    sections.forEach(({ passcodes, label }, i) => {
      const deckCards = passcodes.flatMap((passcode) => {
        const ygoCard = cardMap.get(passcode);
        if (!ygoCard) {
          skipped++;
          return [];
        }
        return [{
          id: uuidv4(),
          faceImageUrl: `https://images.ygoprodeck.com/images/cards/${ygoCard.imageId}.jpg`,
          backImageUrl: '/card-back.svg',
          x,
          y,
          rotation: 0,
          isFlipped: true,
          label: ygoCard.name,
          desc: ygoCard.desc,
          cardType: ygoCard.type,
          race: ygoCard.race,
          attribute: ygoCard.attribute,
          level: ygoCard.level,
          atk: ygoCard.atk,
          def: ygoCard.def,
          linkval: ygoCard.linkval,
          linkmarkers: ygoCard.linkmarkers,
        }];
      });

      if (deckCards.length === 0) return;
      totalImported += deckCards.length;
      dispatch({ type: 'IMPORT_DECK', payload: { cards: deckCards, x: x + i * 120, y, label } });
    });

    if (totalImported === 0) {
      setError('None of the cards in this ydke string were found in the database.');
      return;
    }

    if (skipped > 0) {
      setError(`Imported ${totalImported} card${totalImported !== 1 ? 's' : ''}. ${skipped} unrecognized passcode${skipped !== 1 ? 's' : ''} skipped.`);
      setTimeout(onClose, 2000);
    } else {
      onClose();
    }
  }

  return createPortal(
    <div className={styles.backdrop} onMouseDown={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Import Deck</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          <p className={styles.label}>Paste a <code>ydke://</code> string below</p>
          <div className={styles.pasteRow}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              placeholder="ydke://..."
              rows={3}
              spellCheck={false}
            />
            <button className={styles.pasteBtn} onClick={handlePaste} type="button">
              Paste
            </button>
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.importBtn}
            onClick={handleImport}
            disabled={!input.trim() || loading}
            type="button"
          >
            {loading ? 'Loading cards…' : 'Import Deck'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
