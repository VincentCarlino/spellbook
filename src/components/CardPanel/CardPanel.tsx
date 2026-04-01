'use client';

import { useState } from 'react';
import { useCardDatabase } from '~/hooks/useCardDatabase';
import { SearchTab } from './SearchTab';
import { AddNewTab } from './AddNewTab';
import styles from './CardPanel.module.css';

type Tab = 'search' | 'addNew';

export function CardPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [collapsed, setCollapsed] = useState(true);
  const { cards, loading, error } = useCardDatabase();

  return (
    <div className={styles.panel}>
      <button
        className={styles.header}
        onClick={() => setCollapsed(c => !c)}
        type="button"
        aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        <span className={styles.title}>Spellbook</span>
        <span className={styles.chevron}>{collapsed ? '▾' : '▴'}</span>
      </button>
      <div className={`${styles.body} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'search' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('search')}
            type="button"
          >
            Search
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'addNew' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('addNew')}
            type="button"
          >
            Add new
          </button>
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'search'
            ? <SearchTab cards={cards} loading={loading} error={error} />
            : <AddNewTab />
          }
        </div>
      </div>
    </div>
  );
}
