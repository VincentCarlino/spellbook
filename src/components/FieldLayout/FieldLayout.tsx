'use client';

import styles from './FieldLayout.module.css';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const ZONE_W = 110;
const ZONE_H = 154;
const GAP = 8;
const STEP = ZONE_W + GAP; // 118

// Table center
const CX = 1500;
const CY = 1000;

// 7-column row starts here (centered on CX)
// Total width = 7*110 + 6*8 = 818 → left edge = 1500 - 409 = 1091
const ROW_LEFT = CX - (7 * ZONE_W + 6 * GAP) / 2; // 1091

// Vertical layout (from center outward):
//   EMZ band:        CY - ZONE_H/2  →  CY + ZONE_H/2  (923 – 1077)
//   Gap = 20px between EMZ and player rows
const EMZ_Y = CY - ZONE_H / 2; // 923

const P1_MONSTER_Y = CY + ZONE_H / 2 + 20; // 1097
const P1_ST_Y = P1_MONSTER_Y + ZONE_H + GAP; // 1259

const P2_MONSTER_Y = CY - ZONE_H / 2 - 20 - ZONE_H; // 749
const P2_ST_Y = P2_MONSTER_Y - GAP - ZONE_H; // 587

// ---------------------------------------------------------------------------
// Zone type
// ---------------------------------------------------------------------------
type ZoneType = 'monster' | 'spelltrap' | 'field' | 'graveyard' | 'deck' | 'extradeck' | 'extramonster';

export interface ZoneDef {
  key: string;
  x: number;
  y: number;
  type: ZoneType;
  rotate?: boolean; // true = Player 2 (rendered upside-down)
}

// ---------------------------------------------------------------------------
// Column x helper
// ---------------------------------------------------------------------------
function col(n: number): number {
  return ROW_LEFT + n * STEP;
}

// ---------------------------------------------------------------------------
// Zone definitions
// ---------------------------------------------------------------------------
export const ZONE_DIMS = { w: ZONE_W, h: ZONE_H };

export const ZONES: ZoneDef[] = [
  // ── Player 1 Monster row ────────────────────────────────────────────────
  { key: 'p1-fs',  x: col(0), y: P1_MONSTER_Y, type: 'field' },
  { key: 'p1-m1',  x: col(1), y: P1_MONSTER_Y, type: 'monster' },
  { key: 'p1-m2',  x: col(2), y: P1_MONSTER_Y, type: 'monster' },
  { key: 'p1-m3',  x: col(3), y: P1_MONSTER_Y, type: 'monster' },
  { key: 'p1-m4',  x: col(4), y: P1_MONSTER_Y, type: 'monster' },
  { key: 'p1-m5',  x: col(5), y: P1_MONSTER_Y, type: 'monster' },
  { key: 'p1-gy',  x: col(6), y: P1_MONSTER_Y, type: 'graveyard' },

  // ── Player 1 Spell/Trap row ──────────────────────────────────────────────
  { key: 'p1-xd',   x: col(0), y: P1_ST_Y, type: 'extradeck' },
  { key: 'p1-st1',  x: col(1), y: P1_ST_Y, type: 'spelltrap' },
  { key: 'p1-st2',  x: col(2), y: P1_ST_Y, type: 'spelltrap' },
  { key: 'p1-st3',  x: col(3), y: P1_ST_Y, type: 'spelltrap' },
  { key: 'p1-st4',  x: col(4), y: P1_ST_Y, type: 'spelltrap' },
  { key: 'p1-st5',  x: col(5), y: P1_ST_Y, type: 'spelltrap' },
  { key: 'p1-deck', x: col(6), y: P1_ST_Y, type: 'deck' },

  // ── Extra Monster Zones (shared center) ─────────────────────────────────
  // Positioned at columns 1 and 5 (aligning with M1/M5)
  { key: 'emz-l', x: col(2), y: EMZ_Y, type: 'extramonster' },
  { key: 'emz-r', x: col(4), y: EMZ_Y, type: 'extramonster' },

  // ── Player 2 Monster row (mirrored horizontally, rotated 180°) ───────────
  // From P1's view: GY is left, FS is right (mirror of P1)
  { key: 'p2-gy',  x: col(0), y: P2_MONSTER_Y, type: 'graveyard', rotate: true },
  { key: 'p2-m5',  x: col(1), y: P2_MONSTER_Y, type: 'monster',   rotate: true },
  { key: 'p2-m4',  x: col(2), y: P2_MONSTER_Y, type: 'monster',   rotate: true },
  { key: 'p2-m3',  x: col(3), y: P2_MONSTER_Y, type: 'monster',   rotate: true },
  { key: 'p2-m2',  x: col(4), y: P2_MONSTER_Y, type: 'monster',   rotate: true },
  { key: 'p2-m1',  x: col(5), y: P2_MONSTER_Y, type: 'monster',   rotate: true },
  { key: 'p2-fs',  x: col(6), y: P2_MONSTER_Y, type: 'field',     rotate: true },

  // ── Player 2 Spell/Trap row ──────────────────────────────────────────────
  { key: 'p2-deck', x: col(0), y: P2_ST_Y, type: 'deck',      rotate: true },
  { key: 'p2-st5',  x: col(1), y: P2_ST_Y, type: 'spelltrap', rotate: true },
  { key: 'p2-st4',  x: col(2), y: P2_ST_Y, type: 'spelltrap', rotate: true },
  { key: 'p2-st3',  x: col(3), y: P2_ST_Y, type: 'spelltrap', rotate: true },
  { key: 'p2-st2',  x: col(4), y: P2_ST_Y, type: 'spelltrap', rotate: true },
  { key: 'p2-st1',  x: col(5), y: P2_ST_Y, type: 'spelltrap', rotate: true },
  { key: 'p2-xd',   x: col(6), y: P2_ST_Y, type: 'extradeck', rotate: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const TYPE_CLASS: Record<ZoneType, string> = {
  monster:      styles.monster!,
  spelltrap:    styles.spelltrap!,
  field:        styles.field!,
  graveyard:    styles.graveyard!,
  deck:         styles.deck!,
  extradeck:    styles.extradeck!,
  extramonster: styles.extramonster!,
};

export function FieldLayout() {
  return (
    <>
      {ZONES.map((zone) => (
        <div
          key={zone.key}
          className={`${styles.zone} ${TYPE_CLASS[zone.type]}`}
          style={{
            left: zone.x,
            top: zone.y,
            width: ZONE_W,
            height: ZONE_H,
            transform: zone.rotate ? 'rotate(180deg)' : undefined,
          }}
        />
      ))}
    </>
  );
}
