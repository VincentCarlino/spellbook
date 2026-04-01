'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './RoomModal.module.css';

type ModalState =
  | { phase: 'choose' }
  | { phase: 'creating'; code: string; waiting: boolean }
  | { phase: 'joining' };

interface Props {
  onSolo: () => void;
  onConnect: (roomCode: string) => void;
  opponentConnected: boolean;
  roomFull: boolean;
  connectionError: string | null;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function RoomModal({ onSolo, onConnect, opponentConnected, roomFull, connectionError }: Props) {
  const [modalState, setModalState] = useState<ModalState>({ phase: 'choose' });
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const joinInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus join input when entering join phase
  useEffect(() => {
    if (modalState.phase === 'joining') {
      joinInputRef.current?.focus();
    }
  }, [modalState.phase]);

  // When opponent connects while in creating phase, the parent will close the modal
  // (opponentConnected becomes true). Nothing to do here.

  function handleCreateRoom() {
    const code = generateRoomCode();
    setModalState({ phase: 'creating', code, waiting: true });
    onConnect(code);
  }

  function handleJoinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError('Room code must be 6 characters.');
      return;
    }
    setJoinError(null);
    onConnect(code);
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Spellbook</h2>
        <p className={styles.subtitle}>Yu-Gi-Oh! Tabletop Simulator</p>

        <hr className={styles.divider} />

        {modalState.phase === 'choose' && (
          <>
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Multiplayer</span>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCreateRoom}>
                Create Room
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setModalState({ phase: 'joining' })}
              >
                Join Room
              </button>
            </div>

            <hr className={styles.divider} />

            <div className={styles.section}>
              <button className={`${styles.btn} ${styles.btnSolo}`} onClick={onSolo}>
                Play Solo
              </button>
            </div>
          </>
        )}

        {modalState.phase === 'creating' && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Your Room Code</span>
            <div className={styles.codeDisplay}>
              <span className={styles.code}>{modalState.code}</span>
              <button className={styles.copyBtn} onClick={() => handleCopyCode(modalState.code)}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {!opponentConnected && !roomFull && (
              <p className={styles.waitingMsg}>Waiting for opponent to join…</p>
            )}
            {opponentConnected && (
              <p className={`${styles.statusMsg} ${styles.statusMsgOk}`}>Opponent connected!</p>
            )}
            {roomFull && (
              <p className={styles.statusMsg}>Room is full. Try a different code.</p>
            )}
            {connectionError && (
              <p className={styles.statusMsg}>{connectionError}</p>
            )}

            <button
              className={`${styles.btn} ${styles.btnSolo}`}
              onClick={() => setModalState({ phase: 'choose' })}
            >
              ← Back
            </button>
          </div>
        )}

        {modalState.phase === 'joining' && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Enter Room Code</span>
            <div className={styles.inputRow}>
              <input
                ref={joinInputRef}
                className={styles.input}
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  setJoinError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoinRoom();
                }}
                placeholder="XXXXXX"
                maxLength={6}
                spellCheck={false}
              />
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleJoinRoom}
                disabled={joinCode.length !== 6}
              >
                Join
              </button>
            </div>

            {joinError && <p className={styles.errorMsg}>{joinError}</p>}
            {connectionError && <p className={styles.errorMsg}>{connectionError}</p>}
            {roomFull && <p className={styles.errorMsg}>Room is full. Try a different code.</p>}

            <button
              className={`${styles.btn} ${styles.btnSolo}`}
              onClick={() => { setModalState({ phase: 'choose' }); setJoinCode(''); setJoinError(null); }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
