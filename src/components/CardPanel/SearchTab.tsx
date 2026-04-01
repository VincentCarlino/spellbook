'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTable } from '~/context/TableContext';
import { filterCards, getUniqueTypes } from '~/utils/cardSearch';
import type { YgoCard } from '~/types/ygoCard';
import styles from './SearchTab.module.css';

const ATTRIBUTES = ['DARK', 'LIGHT', 'WATER', 'FIRE', 'WIND', 'EARTH', 'DIVINE'];

interface Props {
  cards: YgoCard[];
  loading: boolean;
  error: string | null;
}

export function SearchTab({ cards, loading, error }: Props) {
  const { dispatch, getViewportCenter } = useTable();
  const [nameInput, setNameInput] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(nameInput), 300);
    return () => clearTimeout(timer);
  }, [nameInput]);

  const uniqueTypes = useMemo(() => getUniqueTypes(cards), [cards]);
  const results = useMemo(
    () => filterCards(cards, { name: debouncedName, type: typeFilter, attribute: attributeFilter }),
    [cards, debouncedName, typeFilter, attributeFilter],
  );

  function handleClick(e: React.MouseEvent, card: YgoCard) {
    e.stopPropagation();
    dispatch({
      type: 'SET_PREVIEW_CARD',
      payload: { imageUrl: `https://images.ygoprodeck.com/images/cards_cropped/${card.imageId}.jpg`, label: card.name, desc: card.desc, cardType: card.type, race: card.race, attribute: card.attribute, level: card.level, atk: card.atk, def: card.def, linkval: card.linkval, linkmarkers: card.linkmarkers },
    });
  }

  function addCardToField(card: YgoCard) {
    const { x, y } = getViewportCenter();
    dispatch({
      type: 'ADD_CARD',
      payload: {
        id: uuidv4(),
        faceImageUrl: `https://images.ygoprodeck.com/images/cards/${card.imageId}.jpg`,
        backImageUrl: '/card-back.svg',
        x: x + Math.random() * 80 - 40,
        y: y + Math.random() * 80 - 40,
        rotation: 0,
        isFlipped: false,
        label: card.name,
        desc: card.desc,
        cardType: card.type,
        race: card.race,
        attribute: card.attribute,
        level: card.level,
        atk: card.atk,
        def: card.def,
        linkval: card.linkval,
        linkmarkers: card.linkmarkers,
      },
    });
  }

  function handleDoubleClick(card: YgoCard) {
    addCardToField(card);
  }

  function handleContextMenu(e: React.MouseEvent, card: YgoCard) {
    e.preventDefault();
    e.stopPropagation();
    addCardToField(card);
  }

  return (
    <div className={styles.searchTab}>
      <input
        className={styles.input}
        type="text"
        placeholder="Search by name..."
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
      />
      <div className={styles.filters}>
        <select
          className={styles.select}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {uniqueTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className={styles.select}
          value={attributeFilter}
          onChange={(e) => setAttributeFilter(e.target.value)}
        >
          <option value="">All Attrs</option>
          {ATTRIBUTES.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading && <p className={styles.status}>Loading cards...</p>}
      {error && <p className={styles.statusError}>{error}</p>}

      {!loading && !error && (
        <>
          <p className={styles.resultCount}>
            {results.length === 100 ? '100+ results' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
          </p>
          <div className={styles.grid}>
            {results.map(card => (
              <div
                key={card.id}
                className={styles.cardItem}
                onClick={(e) => handleClick(e, card)}
                onDoubleClick={() => handleDoubleClick(card)}
                onContextMenu={(e) => handleContextMenu(e, card)}
                title={card.name}
              >
                <img
                  src={`https://images.ygoprodeck.com/images/cards_small/${card.imageId}.jpg`}
                  alt={card.name}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
