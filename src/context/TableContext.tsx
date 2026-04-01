'use client';

import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';
import type { TableState, TableAction, HandOwner } from '~/types/card';
import { useTableReducer } from '~/hooks/useTableReducer';
import { isLocalOnlyAction } from '~/hooks/useRoom';

// Width of the fixed card panel (left: 16px + width: 300px)
const CARD_PANEL_WIDTH = 316;

interface TableContextValue {
  state: TableState;
  /** Dispatch an action locally AND broadcast it to the opponent (if multiplayer) */
  dispatch: React.Dispatch<TableAction>;
  /** Dispatch an action locally only — used for incoming remote actions to avoid re-broadcasting */
  rawDispatch: React.Dispatch<TableAction>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  getViewportCenter: () => { x: number; y: number };
  handZoneRefs: { p1: React.RefObject<HTMLDivElement | null>; p2: React.RefObject<HTMLDivElement | null> };
  getHandZoneRect: (owner: HandOwner) => DOMRect | null;
  clientToCanvas: (clientX: number, clientY: number) => { x: number; y: number };
  /** Invert client coordinates for P2's rotated perspective before any canvas math */
  adjustClient: (clientX: number, clientY: number) => { x: number; y: number };
  role: HandOwner | null;
  /** Called by App once the room WebSocket is established */
  setSendAction: (fn: ((action: TableAction) => void) | null) => void;
}

const TableContext = createContext<TableContextValue | null>(null);

interface TableProviderProps {
  children: ReactNode;
  role: HandOwner | null;
}

export function TableProvider({ children, role }: TableProviderProps) {
  const { state, dispatch: rawDispatch } = useTableReducer();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const handZoneRefs = {
    p1: useRef<HTMLDivElement | null>(null),
    p2: useRef<HTMLDivElement | null>(null),
  };

  const sendActionRef = useRef<((action: TableAction) => void) | null>(null);

  const setSendAction = useCallback((fn: ((action: TableAction) => void) | null) => {
    sendActionRef.current = fn;
  }, []);

  const dispatch = useCallback((action: TableAction) => {
    rawDispatch(action);
    if (!isLocalOnlyAction(action)) {
      sendActionRef.current?.(action);
    }
  }, [rawDispatch]);

  function adjustClient(clientX: number, clientY: number): { x: number; y: number } {
    if (role !== 'p2') return { x: clientX, y: clientY };
    return {
      x: window.innerWidth - clientX,
      y: window.innerHeight - clientY,
    };
  }

  function getViewportCenter() {
    const vp = viewportRef.current;
    if (!vp) return { x: 1500, y: 1000 };
    const x = vp.scrollLeft + CARD_PANEL_WIDTH + (vp.clientWidth - CARD_PANEL_WIDTH) / 2;
    const y = vp.scrollTop + vp.clientHeight / 2;
    return { x, y };
  }

  function getHandZoneRect(owner: HandOwner): DOMRect | null {
    const ref = handZoneRefs[owner].current;
    return ref ? ref.getBoundingClientRect() : null;
  }

  function clientToCanvas(clientX: number, clientY: number) {
    const adjusted = adjustClient(clientX, clientY);
    const vp = viewportRef.current;
    if (!vp) return adjusted;
    return { x: adjusted.x + vp.scrollLeft, y: adjusted.y + vp.scrollTop };
  }

  return (
    <TableContext.Provider value={{
      state,
      dispatch,
      rawDispatch,
      viewportRef,
      getViewportCenter,
      handZoneRefs,
      getHandZoneRect,
      clientToCanvas,
      adjustClient,
      role,
      setSendAction,
    }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable(): TableContextValue {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTable must be used within a TableProvider');
  return ctx;
}
