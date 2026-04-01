'use client';

import styles from './CardPing.module.css';

interface Props {
  id: string;
  x: number;
  y: number;
}

export function CardPing({ id, x, y }: Props) {
  return (
    <div
      key={id}
      className={styles.ping}
      style={{ left: x, top: y }}
    >
      <div className={styles.ring} />
      <div className={styles.ring} />
      <div className={styles.ring} />
      <span className={styles.label}>Activating!</span>
    </div>
  );
}
