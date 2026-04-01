'use client';

import { useTable } from '~/context/TableContext';
import { PHASES } from '~/types/card';
import type { Phase } from '~/types/card';
import styles from './TurnIndicator.module.css';

export function TurnIndicator() {
  const { state, dispatch } = useTable();
  const { turn, phase } = state.turnIndicator;

  function handleNextPhase() {
    dispatch({ type: 'NEXT_PHASE' });
  }

  function handlePhaseClick(p: Phase) {
    if (p !== phase) {
      dispatch({ type: 'SET_TURN_PHASE', payload: { turn, phase: p } });
    }
  }

  return (
    <div className={styles.indicator}>
      <span className={styles.playerLabel}>{turn === 'p1' ? 'P1' : 'P2'}'s Turn</span>
      <div className={styles.phases}>
        {PHASES.map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.phase} ${p === phase ? styles.phaseActive : ''}`}
            onClick={() => handlePhaseClick(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <button className={`${styles.btn} ${styles.btnNext}`} type="button" onClick={handleNextPhase}>
        Next →
      </button>
    </div>
  );
}
