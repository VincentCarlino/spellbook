'use client';

import { useState, type FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTable } from '~/context/TableContext';
import styles from './AddNewTab.module.css';

const DEFAULT_BACK = '/card-back.svg';
const DROP_X = 300;
const DROP_Y = 200;

export function AddNewTab() {
  const { dispatch } = useTable();
  const [faceUrl, setFaceUrl] = useState('');
  const [backUrl, setBackUrl] = useState('');
  const [label, setLabel] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!faceUrl.trim()) return;

    dispatch({
      type: 'ADD_CARD',
      payload: {
        id: uuidv4(),
        faceImageUrl: faceUrl.trim(),
        backImageUrl: backUrl.trim() || DEFAULT_BACK,
        x: DROP_X + Math.random() * 80 - 40,
        y: DROP_Y + Math.random() * 80 - 40,
        rotation: 0,
        isFlipped: false,
        label: label.trim() || undefined,
      },
    });

    setFaceUrl('');
    setBackUrl('');
    setLabel('');
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        className={styles.input}
        type="url"
        placeholder="Face image URL (required)"
        value={faceUrl}
        onChange={(e) => setFaceUrl(e.target.value)}
      />
      <input
        className={styles.input}
        type="url"
        placeholder="Back image URL (optional)"
        value={backUrl}
        onChange={(e) => setBackUrl(e.target.value)}
      />
      <input
        className={styles.input}
        type="text"
        placeholder="Label (optional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <button className={styles.button} type="submit" disabled={!faceUrl.trim()}>
        Add to Table
      </button>
      <p className={styles.hint}>
        Right-click card to rotate, flip, or remove. Shift+click or drag on the table to multi-select.
      </p>
    </form>
  );
}
