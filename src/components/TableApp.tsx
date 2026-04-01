'use client';

import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { TableProvider, useTable } from '~/context/TableContext';
import { TableSurface } from '~/components/TableSurface/TableSurface';
import { Card } from '~/components/Card/Card';
import { Deck } from '~/components/Deck/Deck';
import { CardContextMenu } from '~/components/CardContextMenu/CardContextMenu';
import { DeckContextMenu } from '~/components/DeckContextMenu/DeckContextMenu';
import { DeckSearchModal } from '~/components/DeckSearchModal/DeckSearchModal';
import { ImportDeckModal } from '~/components/ImportDeckModal/ImportDeckModal';
import { CardPanel } from '~/components/CardPanel/CardPanel';
import { CardPreviewPanel } from '~/components/CardPreviewPanel/CardPreviewPanel';
import { CardPing } from '~/components/CardPing/CardPing';
import { HandZone } from '~/components/HandZone/HandZone';
import { LifePointsTracker } from '~/components/LifePointsTracker/LifePointsTracker';
import { TurnIndicator } from '~/components/TurnIndicator/TurnIndicator';
import { HandCardContextMenu } from '~/components/HandCardContextMenu/HandCardContextMenu';
import { RoomModal } from '~/components/RoomModal/RoomModal';
import { useKeyboardShortcuts } from '~/hooks/useKeyboardShortcuts';
import { useRoom, type RoomRole } from '~/hooks/useRoom';
import type { PersistedTableState, CardState, HandOwner, TableAction } from '~/types/card';
import { playPing } from '~/utils/sounds';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'spellbook-table';

interface CardContextMenuState {
  cardId: string;
  x: number;
  y: number;
}

interface DeckContextMenuState {
  deckId: string;
  x: number;
  y: number;
}

interface HandCardContextMenuState {
  cardId: string;
  owner: HandOwner;
  x: number;
  y: number;
}

interface Ping {
  id: string;
  x: number;
  y: number;
}

const PING_DURATION = 1100;
const CARD_W = 100;
const CARD_H = 140;

// ── TableApp (inner, has access to TableContext) ─────────────────────────────

interface TableAppInnerProps {
  role: RoomRole | null;
  sendPing: (positions: { x: number; y: number }[]) => void;
}

function TableAppInner({ role, sendPing }: TableAppInnerProps) {
  const { state, dispatch, adjustClient, handZoneRefs } = useTable();
  const [cardContextMenu, setCardContextMenu] = useState<CardContextMenuState | null>(null);
  const [deckContextMenu, setDeckContextMenu] = useState<DeckContextMenuState | null>(null);
  const [handCardContextMenu, setHandCardContextMenu] = useState<HandCardContextMenuState | null>(null);
  const [deckSearchModal, setDeckSearchModal] = useState<string | null>(null);
  const [importDeckModal, setImportDeckModal] = useState(false);
  const [pings, setPings] = useState<Ping[]>([]);

  const triggerPings = useCallback((positions: { x: number; y: number }[]) => {
    const newPings = positions.map((pos) => ({ id: uuidv4(), ...pos }));
    setPings((prev) => [...prev, ...newPings]);
    setTimeout(() => {
      setPings((prev) => prev.filter((p) => !newPings.some((np) => np.id === p.id)));
    }, PING_DURATION);
  }, []);

  const handlePingCards = useCallback((cards: CardState[]) => {
    playPing();
    const positions = cards.map((card) => ({
      x: card.x + CARD_W / 2,
      y: card.y + CARD_H / 2,
    }));
    triggerPings(positions);
    sendPing(positions);
  }, [sendPing, triggerPings]);

  // Handle incoming pings from the opponent
  useEffect(() => {
    const handler = (e: CustomEvent<{ x: number; y: number }[]>) => {
      playPing();
      triggerPings(e.detail);
    };
    window.addEventListener('spellbook:remoteping', handler as EventListener);
    return () => window.removeEventListener('spellbook:remoteping', handler as EventListener);
  }, [triggerPings]);

  useKeyboardShortcuts({ state, dispatch, onPingCards: handlePingCards });

  // Persist to localStorage whenever cards, decks, or hands change
  useEffect(() => {
    const persisted: PersistedTableState = {
      version: 3,
      cards: state.cards,
      decks: state.decks,
      hands: state.hands,
      topZIndex: state.topZIndex,
      lifePoints: state.lifePoints,
      turnIndicator: state.turnIndicator,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [state.cards, state.decks, state.hands, state.topZIndex, state.lifePoints, state.turnIndicator]);

  function handleCardContextMenu(e: MouseEvent, cardId: string) {
    const { x, y } = adjustClient(e.clientX, e.clientY);
    setCardContextMenu({ cardId, x, y });
  }

  function handleDeckContextMenu(e: MouseEvent, deckId: string) {
    const { x, y } = adjustClient(e.clientX, e.clientY);
    setDeckContextMenu({ deckId, x, y });
  }

  function handleHandCardContextMenu(e: MouseEvent, cardId: string, owner: HandOwner) {
    const { x, y } = adjustClient(e.clientX, e.clientY);
    setHandCardContextMenu({ cardId, owner, x, y });
  }

  function handleClearPreview() {
    dispatch({ type: 'SET_PREVIEW_CARD', payload: null });
    if (state.selectedDeckId !== null) {
      dispatch({ type: 'SELECT_DECK', payload: { id: null } });
    }
  }

  function handleClearTable() {
    if (state.cards.length === 0 && state.decks.length === 0) return;
    if (!window.confirm('Remove all cards and decks from the table?')) return;
    dispatch({ type: 'CLEAR_TABLE' });
  }

  return (
    <div style={{ width: '100%', height: '100%' }} onClick={handleClearPreview}>
      {/* Game area — rotated 180° for P2 so they see the field from their side */}
      <div
        id="game-area"
        style={
          role === 'p2'
            ? { transform: 'rotate(180deg)', transformOrigin: 'center center', width: '100%', height: '100%' }
            : { width: '100%', height: '100%' }
        }
      >
        <HandZone owner="p2" zoneRef={handZoneRefs.p2} onCardContextMenu={handleHandCardContextMenu} />
        <TableSurface>
          {state.cards.map((card) => (
            <Card key={card.id} card={card} onContextMenu={handleCardContextMenu} />
          ))}
          {state.decks.map((deck) => (
            <Deck key={deck.id} deck={deck} onContextMenu={handleDeckContextMenu} />
          ))}
          {pings.map((ping) => (
            <CardPing key={ping.id} id={ping.id} x={ping.x} y={ping.y} />
          ))}
        </TableSurface>
        <HandZone owner="p1" zoneRef={handZoneRefs.p1} onCardContextMenu={handleHandCardContextMenu} />
      </div>

      {/* UI elements outside the rotated game area — always upright */}
      <CardPanel />
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9000, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <button
          onClick={() => setImportDeckModal(true)}
          style={{
            padding: '9px 18px',
            background: 'rgba(137, 180, 250, 0.12)',
            color: '#89b4fa',
            border: '1px solid rgba(137, 180, 250, 0.35)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Import Deck
        </button>
        <button
          onClick={handleClearTable}
          style={{
            padding: '9px 18px',
            background: 'rgba(243, 139, 168, 0.15)',
            color: '#f38ba8',
            border: '1px solid rgba(243, 139, 168, 0.4)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Clear Table
        </button>
      </div>

      {cardContextMenu && (
        <CardContextMenu
          cardId={cardContextMenu.cardId}
          x={cardContextMenu.x}
          y={cardContextMenu.y}
          onClose={() => setCardContextMenu(null)}
        />
      )}
      {deckContextMenu && (
        <DeckContextMenu
          deckId={deckContextMenu.deckId}
          x={deckContextMenu.x}
          y={deckContextMenu.y}
          onClose={() => setDeckContextMenu(null)}
          onSearch={(deckId) => setDeckSearchModal(deckId)}
        />
      )}
      {deckSearchModal && (
        <DeckSearchModal
          deckId={deckSearchModal}
          onClose={() => setDeckSearchModal(null)}
        />
      )}
      {importDeckModal && <ImportDeckModal onClose={() => setImportDeckModal(false)} />}
      {handCardContextMenu && (
        <HandCardContextMenu
          cardId={handCardContextMenu.cardId}
          owner={handCardContextMenu.owner}
          x={handCardContextMenu.x}
          y={handCardContextMenu.y}
          onClose={() => setHandCardContextMenu(null)}
        />
      )}
      <CardPreviewPanel />
      <div style={{ position: 'fixed', top: 164, right: 20, zIndex: 9000 }}>
        <LifePointsTracker player={state.localRole === 'p2' ? 'p1' : 'p2'} />
      </div>
      <div style={{ position: 'fixed', bottom: 164, right: 20, zIndex: 9000 }}>
        <LifePointsTracker player={state.localRole === 'p2' ? 'p2' : 'p1'} />
      </div>
      <div style={{ position: 'fixed', top: '50%', right: 20, transform: 'translateY(-50%)', zIndex: 9000 }}>
        <TurnIndicator />
      </div>
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────

export function TableApp() {
  const [role, setRole] = useState<RoomRole | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [roomFull, setRoomFull] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Default to solo mode — multiplayer deferred
  const [soloMode, setSoloMode] = useState<boolean | null>(true);

  const rawDispatchRef = useRef<React.Dispatch<TableAction> | null>(null);
  const setSendActionRef = useRef<((fn: ((a: TableAction) => void) | null) => void) | null>(null);

  const room = useRoom({
    onJoined: (r) => {
      setRole(r);
      setConnectionError(null);
      setRoomFull(false);
      if (r === 'p2') setOpponentConnected(true);
      rawDispatchRef.current?.({ type: 'SET_LOCAL_ROLE', payload: { role: r } });
    },
    onOpponentJoined: () => { setOpponentConnected(true); },
    onOpponentLeft: () => { setOpponentConnected(false); },
    onConnectionError: () => {
      setRole(null);
      setOpponentConnected(false);
      setConnectionError('Connection lost. Please reconnect.');
      rawDispatchRef.current?.({ type: 'SET_LOCAL_ROLE', payload: { role: null } });
    },
    onRoomFull: () => {
      setRoomFull(true);
      setConnectionError('Room is full. Try a different code.');
    },
    onAction: (action) => {
      rawDispatchRef.current?.(action);
    },
    onPing: (positions) => {
      window.dispatchEvent(new CustomEvent('spellbook:remoteping', { detail: positions }));
    },
    onStateSync: (state) => {
      rawDispatchRef.current?.({ type: 'LOAD_REMOTE_STATE', payload: state });
    },
    onStateSyncRequest: () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        room.sendStateSync(JSON.parse(raw) as PersistedTableState);
      } catch {
        // ignore parse errors
      }
    },
  });

  useEffect(() => {
    setSendActionRef.current?.(opponentConnected ? room.sendAction : null);
  }, [opponentConnected, room.sendAction]);

  function handleConnect(code: string) {
    setRoomFull(false);
    setConnectionError(null);
    room.connect(code);
  }

  function handleSolo() {
    setSoloMode(true);
    room.disconnect();
  }

  const modalClosed = soloMode === true || opponentConnected || role === 'p2';

  return (
    <TableProvider role={role}>
      <ContextBridge
        rawDispatchRef={rawDispatchRef}
        setSendActionRef={setSendActionRef}
      />
      {!modalClosed && (
        <RoomModal
          onSolo={handleSolo}
          onConnect={handleConnect}
          opponentConnected={opponentConnected}
          roomFull={roomFull}
          connectionError={connectionError}
        />
      )}
      <TableAppInner
        role={role}
        sendPing={room.sendPing}
      />
    </TableProvider>
  );
}

// Bridges context values into refs to avoid the "function as updater" pitfall.
function ContextBridge({
  rawDispatchRef,
  setSendActionRef,
}: {
  rawDispatchRef: React.MutableRefObject<React.Dispatch<TableAction> | null>;
  setSendActionRef: React.MutableRefObject<((fn: ((a: TableAction) => void) | null) => void) | null>;
}) {
  const { rawDispatch, setSendAction } = useTable();
  rawDispatchRef.current = rawDispatch;
  setSendActionRef.current = setSendAction;
  return null;
}
