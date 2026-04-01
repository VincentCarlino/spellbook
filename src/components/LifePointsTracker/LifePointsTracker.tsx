'use client';

import { useState } from 'react';
import { useTable } from '~/context/TableContext';
import type { HandOwner } from '~/types/card';
import styles from './LifePointsTracker.module.css';

interface Props {
  player: HandOwner;
}

export function LifePointsTracker({ player }: Props) {
  const { state, dispatch } = useTable();
  const [deltaInput, setDeltaInput] = useState('');

  const lp = state.lifePoints[player];
  const label = player === 'p1' ? 'P1' : 'P2';

  function handleApply(sign: 1 | -1) {
    const parsed = parseInt(deltaInput, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    dispatch({ type: 'ADJUST_LIFE_POINTS', payload: { player, delta: sign * parsed } });
    setDeltaInput('');
  }

  function handleReset() {
    dispatch({ type: 'SET_LIFE_POINTS', payload: { player, value: 8000 } });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleApply(-1);
  }

  return (
    <div className={styles.tracker}>
      <span className={styles.label}>{label}</span>
      <span className={lp === 0 ? styles.lpDanger : styles.lpNormal}>
        {lp.toLocaleString()}
      </span>
      <div className={styles.controls}>
        <input
          className={styles.deltaInput}
          type="number"
          min="0"
          placeholder="Amount"
          value={deltaInput}
          onChange={(e) => setDeltaInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className={`${styles.btn} ${styles.btnPlus}`} type="button" onClick={() => handleApply(1)}>+</button>
        <button className={`${styles.btn} ${styles.btnMinus}`} type="button" onClick={() => handleApply(-1)}>−</button>
      </div>
      <button className={styles.btnReset} type="button" onClick={handleReset}>Reset to 8000</button>
    </div>
  );
}
