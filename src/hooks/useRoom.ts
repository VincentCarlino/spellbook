'use client';

import type { TableAction, HandOwner, PersistedTableState } from '~/types/card';

export type RoomRole = HandOwner;

export interface UseRoomParams {
  onAction: (action: TableAction) => void;
  onPing: (positions: { x: number; y: number }[]) => void;
  onOpponentJoined: () => void;
  onOpponentLeft: () => void;
  onRoomFull: () => void;
  onJoined: (role: RoomRole) => void;
  onStateSync: (state: PersistedTableState) => void;
  onStateSyncRequest: () => void;
  onConnectionError: () => void;
}

export interface UseRoomReturn {
  connect: (roomCode: string) => void;
  disconnect: () => void;
  sendAction: (action: TableAction) => void;
  sendPing: (positions: { x: number; y: number }[]) => void;
  sendStateSync: (state: PersistedTableState) => void;
}

// Actions that should NOT be broadcast to the other player (pure local UI state)
const LOCAL_ONLY_ACTIONS = new Set([
  'SELECT_CARD',
  'SELECT_CARDS_IN_RECT',
  'DESELECT_ALL',
  'SELECT_DECK',
  'SELECT_HAND_CARD',
  'UPDATE_RUBBER_BAND',
  'SET_PREVIEW_CARD',
  'SET_ACTIVE_DRAG',
  'CLEAR_ACTIVE_DRAG',
  'SET_LOCAL_ROLE',
  'LOAD_REMOTE_STATE',
]);

export function isLocalOnlyAction(action: TableAction): boolean {
  return LOCAL_ONLY_ACTIONS.has(action.type);
}

// Stubbed — multiplayer deferred. Table runs in solo mode only.
export function useRoom(_params: UseRoomParams): UseRoomReturn {
  return {
    connect: () => {},
    disconnect: () => {},
    sendAction: () => {},
    sendPing: () => {},
    sendStateSync: () => {},
  };
}
