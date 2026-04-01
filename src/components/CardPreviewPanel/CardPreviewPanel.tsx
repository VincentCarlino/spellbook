'use client';

import { useTable } from '~/context/TableContext';
import styles from './CardPreviewPanel.module.css';

// 3×3 grid positions in reading order, mapping label → [row, col] (0-indexed)
const ARROW_GRID: { label: string; symbol: string; row: number; col: number }[] = [
  { label: 'Top-Left',     symbol: '↖', row: 0, col: 0 },
  { label: 'Top',          symbol: '↑', row: 0, col: 1 },
  { label: 'Top-Right',    symbol: '↗', row: 0, col: 2 },
  { label: 'Left',         symbol: '←', row: 1, col: 0 },
  { label: 'Bottom-Left',  symbol: '↙', row: 2, col: 0 },
  { label: 'Bottom',       symbol: '↓', row: 2, col: 1 },
  { label: 'Bottom-Right', symbol: '↘', row: 2, col: 2 },
  { label: 'Right',        symbol: '→', row: 1, col: 2 },
];

function isMonster(cardType?: string) {
  return cardType?.toLowerCase().includes('monster') ?? false;
}

function isXyz(cardType?: string) {
  return cardType?.toLowerCase().includes('xyz') ?? false;
}

function isLink(cardType?: string) {
  return cardType?.toLowerCase().includes('link') ?? false;
}

function isTrap(cardType?: string) {
  return cardType?.toLowerCase().includes('trap') ?? false;
}

export function CardPreviewPanel() {
  const { state } = useTable();
  const { previewCard } = state;

  const monster = isMonster(previewCard?.cardType);
  const xyz = isXyz(previewCard?.cardType);
  const link = isLink(previewCard?.cardType);
  const trap = isTrap(previewCard?.cardType);

  return (
    <div
      className={`${styles.panel} ${previewCard ? styles.visible : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {previewCard && (
        <>
          <img src={previewCard.imageUrl} className={styles.image} alt={previewCard.label ?? 'Card preview'} />
          {previewCard.label && <p className={styles.label}>{previewCard.label}</p>}
          <div className={styles.meta}>
            {monster && link && previewCard.linkval != null && (
              <span className={styles.metaRow}>
                <span className={styles.metaDim}>Link {previewCard.linkval}</span>
              </span>
            )}
            {monster && link && previewCard.linkmarkers && (
              <div className={styles.arrowGrid}>
                {ARROW_GRID.map(({ label, symbol, row, col }) => {
                  const active = previewCard.linkmarkers!.includes(label);
                  return (
                    <span
                      key={label}
                      className={active ? styles.arrowActive : styles.arrowInactive}
                      style={{ gridRow: row + 1, gridColumn: col + 1 }}
                    >
                      {symbol}
                    </span>
                  );
                })}
                <span className={styles.arrowCenter} style={{ gridRow: 2, gridColumn: 2 }}>✦</span>
              </div>
            )}
            {monster && !link && previewCard.level != null && (
              <span className={styles.metaRow}>
                {'★'.repeat(previewCard.level)}{' '}
                <span className={styles.metaDim}>{xyz ? 'Rank' : 'Lv'} {previewCard.level}</span>
              </span>
            )}
            {monster && (previewCard.attribute || previewCard.race) && (
              <span className={styles.metaRow}>
                {[previewCard.attribute, previewCard.race].filter(Boolean).join(' / ')}
              </span>
            )}
            {monster && previewCard.atk != null && (
              <span className={styles.metaRow}>
                <span className={styles.metaAtkDef}>
                  ATK <strong>{previewCard.atk}</strong>
                  {previewCard.def != null && <>{' / '}DEF <strong>{previewCard.def}</strong></>}
                </span>
              </span>
            )}
            {!monster && previewCard.race && (
              <span className={styles.metaRow}>
                {trap ? 'Trap' : 'Spell'} — {previewCard.race}
              </span>
            )}
          </div>
          {previewCard.desc && <div className={styles.desc}>{previewCard.desc}</div>}
        </>
      )}
    </div>
  );
}
