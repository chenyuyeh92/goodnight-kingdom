import { MAX_DT_MS } from '../config/tuning';
import { owlPhase } from './owl';

export type NessieMode = 'idle' | 'windup' | 'charge' | 'return' | 'angry';
export type NessieAttack = 'charge' | 'bubbles' | 'summon';

/** 招式輪流:衝撞 → 泡泡扇 → 叫小丑魚(第一階段改成再吐一次泡泡)。 */
export const NESSIE_ATTACKS: readonly NessieAttack[] = ['charge', 'bubbles', 'summon'];

export interface NessieBrain {
  mode: NessieMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  attacks: number;
  /** 衝撞的高度。 */
  laneY: number;
  /** 這一輪已經衝了幾次(第三階段衝兩次)。 */
  charges: number;
}

export interface NessieSense {
  x: number;
  y: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  /** 平常待的位置(神殿右邊)。 */
  homeX: number;
  homeY: number;
  /** 衝到這裡就回頭。 */
  leftX: number;
  mouthX: number;
  mouthY: number;
  minionsAlive: number;
  timeMs: number;
  dtMs: number;
}

export interface NessieStep {
  vx: number;
  vy: number;
  brain: NessieBrain;
  bubbles: { vx: number; vy: number }[];
  summon: boolean;
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
}

const IDLE_MS = { 1: 2000, 2: 1600, 3: 1200 } as const;
export const NESSIE_WINDUP_MS = 800;
const CHARGE_SPEED = { 1: 480, 2: 540, 3: 600 } as const;
const RETURN_SPEED = 300;
const BUBBLES = { 1: 5, 2: 6, 3: 7 } as const;
const BUBBLE_SPEED = 200;
const BUBBLE_SPREAD_DEG = 60;
/** 衝撞高度的範圍(身體不鑽進海床)。 */
export const LANE_MIN_Y = 130;
export const LANE_MAX_Y = 405;
/** 回程走另一邊:衝撞在上半就從下面回去,反之從上面回去。 */
const RETURN_HIGH = 120;
const RETURN_LOW = 400;
const SPRING = 3;
const BOB = 30;
const BOB_PERIOD_MS = 2000;
const ANGRY_MS = 1000;
const ANGRY_SHAKE = 50;
const MAX_MINIONS = 4;

export function initialNessieBrain(): NessieBrain {
  return { mode: 'idle', timerMs: 0, phase: 1, attacks: 0, laneY: LANE_MIN_Y, charges: 0 };
}

const clampLane = (y: number): number => Math.min(Math.max(y, LANE_MIN_Y), LANE_MAX_Y);
const returnLane = (laneY: number): number => (laneY < (LANE_MIN_Y + LANE_MAX_Y) / 2 ? RETURN_LOW : RETURN_HIGH);

function bubbleFan(phase: 1 | 2 | 3, s: NessieSense): { vx: number; vy: number }[] {
  const n = BUBBLES[phase];
  const aim = Math.atan2((s.targetY ?? s.mouthY) - s.mouthY, (s.targetX ?? s.mouthX - 100) - s.mouthX);
  const spread = (BUBBLE_SPREAD_DEG * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const a = aim - spread / 2 + (spread * i) / (n - 1);
    return { vx: Math.cos(a) * BUBBLE_SPEED, vy: Math.sin(a) * BUBBLE_SPEED };
  });
}

/** 尼斯湖水怪:在神殿右邊上下漂,輪流衝撞、泡泡扇、叫小丑魚;血量越少越暴躁。 */
export function stepNessie(b: NessieBrain, s: NessieSense): NessieStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const none = { bubbles: [], summon: false, enteredPhase: null, invulnerable: false };

  const wanted = owlPhase(s.hpRatio);
  if (s.hpRatio > 0 && wanted > b.phase && (b.mode === 'idle' || b.mode === 'angry')) {
    const phase = wanted as 2 | 3;
    return { ...none, vx: ANGRY_SHAKE, vy: 0, brain: { ...b, mode: 'angry', timerMs: 0, phase }, enteredPhase: phase, invulnerable: true };
  }

  const timerMs = b.timerMs + dt;
  const home = (): { vx: number; vy: number } => ({
    vx: (s.homeX - s.x) * SPRING,
    vy: (s.homeY + BOB * Math.sin((s.timeMs / BOB_PERIOD_MS) * Math.PI * 2) - s.y) * SPRING,
  });

  switch (b.mode) {
    case 'angry': {
      if (timerMs >= ANGRY_MS) return { ...none, ...home(), brain: { ...b, mode: 'idle', timerMs: 0 } };
      const vx = Math.floor(timerMs / 100) % 2 === 0 ? ANGRY_SHAKE : -ANGRY_SHAKE;
      return { ...none, vx, vy: 0, invulnerable: true, brain: { ...b, timerMs } };
    }
    case 'idle': {
      if (timerMs < IDLE_MS[b.phase] || s.targetX === null) return { ...none, ...home(), brain: { ...b, timerMs: Math.min(timerMs, IDLE_MS[b.phase]) } };
      const attack = NESSIE_ATTACKS[b.attacks % NESSIE_ATTACKS.length];
      const attacks = b.attacks + 1;
      if (attack === 'charge') {
        return { ...none, vx: 0, vy: 0, brain: { ...b, mode: 'windup', timerMs: 0, attacks, charges: 0, laneY: clampLane(s.targetY ?? s.homeY) } };
      }
      const summon = attack === 'summon' && b.phase >= 2 && s.minionsAlive < MAX_MINIONS;
      const bubbles = summon ? [] : bubbleFan(b.phase, s);
      return { ...none, ...home(), bubbles, summon, brain: { ...b, timerMs: 0, attacks } };
    }
    case 'windup': {
      if (timerMs >= NESSIE_WINDUP_MS) return { ...none, vx: -CHARGE_SPEED[b.phase], vy: 0, brain: { ...b, mode: 'charge', timerMs: 0 } };
      // 發抖預告,同時移到衝撞的高度。
      const vx = Math.floor(timerMs / 80) % 2 === 0 ? ANGRY_SHAKE : -ANGRY_SHAKE;
      return { ...none, vx, vy: (b.laneY - s.y) * SPRING, brain: { ...b, timerMs } };
    }
    case 'charge': {
      if (s.x <= s.leftX) return { ...none, vx: RETURN_SPEED, vy: 0, brain: { ...b, mode: 'return', timerMs: 0, charges: b.charges + 1 } };
      return { ...none, vx: -CHARGE_SPEED[b.phase], vy: (b.laneY - s.y) * SPRING, brain: { ...b, timerMs } };
    }
    case 'return': {
      if (s.x >= s.homeX - 10) {
        if (b.phase === 3 && b.charges < 2 && s.targetY !== null) {
          return { ...none, vx: 0, vy: 0, brain: { ...b, mode: 'windup', timerMs: 0, laneY: clampLane(s.targetY) } };
        }
        return { ...none, ...home(), brain: { ...b, mode: 'idle', timerMs: 0 } };
      }
      return { ...none, vx: RETURN_SPEED, vy: (returnLane(b.laneY) - s.y) * SPRING, brain: { ...b, timerMs } };
    }
  }
}
