'use client';

import { useRef, useEffect, type MouseEvent, type ReactNode } from 'react';
import { useTable } from '~/context/TableContext';
import { normalizeRect } from '~/utils/geometry';
import { FieldLayout } from '~/components/FieldLayout/FieldLayout';
import styles from './TableSurface.module.css';

// Table center matches FieldLayout constants
const TABLE_CENTER_X = 1500;
const TABLE_CENTER_Y = 1000;

interface Props {
  children: ReactNode;
}

export function TableSurface({ children }: Props) {
  const { state, dispatch, viewportRef, adjustClient } = useTable();
  const isDraggingRubberBand = useRef(false);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.scrollLeft = TABLE_CENTER_X - vp.clientWidth / 2;
    vp.scrollTop = TABLE_CENTER_Y - vp.clientHeight / 2;
  }, []);

  function getSurfacePos(e: MouseEvent): { x: number; y: number } {
    const { x: ax, y: ay } = adjustClient(e.clientX, e.clientY);
    const rect = surfaceRef.current!.getBoundingClientRect();
    return {
      x: ax - rect.left,
      y: ay - rect.top,
    };
  }

  function handleMouseDown(e: MouseEvent) {
    // Only start rubber-band if clicking directly on the surface (not a child)
    if (e.target !== surfaceRef.current) return;
    if (e.button !== 0) return;

    const pos = getSurfacePos(e);
    isDraggingRubberBand.current = true;

    dispatch({
      type: 'UPDATE_RUBBER_BAND',
      payload: { startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y },
    });

    function onMouseMove(me: globalThis.MouseEvent) {
      if (!isDraggingRubberBand.current || !surfaceRef.current) return;
      const { x: ax, y: ay } = adjustClient(me.clientX, me.clientY);
      const r = surfaceRef.current.getBoundingClientRect();
      const cx = ax - r.left;
      const cy = ay - r.top;
      dispatch({
        type: 'UPDATE_RUBBER_BAND',
        payload: { startX: pos.x, startY: pos.y, currentX: cx, currentY: cy },
      });
    }

    function onMouseUp(me: globalThis.MouseEvent) {
      isDraggingRubberBand.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (!surfaceRef.current) {
        dispatch({ type: 'UPDATE_RUBBER_BAND', payload: null });
        return;
      }
      const { x: ax, y: ay } = adjustClient(me.clientX, me.clientY);
      const r = surfaceRef.current.getBoundingClientRect();
      const cx = ax - r.left;
      const cy = ay - r.top;

      const rect = normalizeRect(pos.x, pos.y, cx, cy);

      // Only select if the band has meaningful size (not just a click)
      if (rect.width > 4 || rect.height > 4) {
        dispatch({ type: 'SELECT_CARDS_IN_RECT', payload: rect });
      } else {
        dispatch({ type: 'DESELECT_ALL' });
      }

      dispatch({ type: 'UPDATE_RUBBER_BAND', payload: null });
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Prevent context menu on table surface itself
  function handleContextMenu(e: MouseEvent) {
    if (e.target === surfaceRef.current) e.preventDefault();
  }

  return (
    <div ref={viewportRef} className={styles.viewport}>
      <div
        ref={surfaceRef}
        className={styles.surface}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        <FieldLayout />
        {children}
        {state.rubberBand && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(state.rubberBand.startX, state.rubberBand.currentX),
              top: Math.min(state.rubberBand.startY, state.rubberBand.currentY),
              width: Math.abs(state.rubberBand.currentX - state.rubberBand.startX),
              height: Math.abs(state.rubberBand.currentY - state.rubberBand.startY),
              border: '2px dashed rgba(255,255,255,0.7)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
