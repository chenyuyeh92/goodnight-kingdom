import { MAX_DT_MS } from '../config/tuning';
import { owlPhase } from './owl';
import { yetiIcicles } from './yeti';

export type ThunderMode = 'hover' | 'windup' | 'gust' | 'angry';
export type ThunderAttack = 'lightning' | 'gust' | 'feathers';

/** 招式輪流:落雷 → 颳強風 → 射羽毛(第一階段改成再一次落雷)。 */
export const THUNDER_ATTACKS: readonly ThunderAttack[] = ['lightning', 'gust', 'feathers'];

export interface ThunderBrain {
  mode: ThunderMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  attacks: number;
  pending: ThunderAttack;
}

export interface ThunderSense {
  x: number;
  y: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  halfW: number;
  arenaLeft: number;
  arenaRight: number;
  minionsAlive: number;
  dtMs: number;
}

export interface ThunderStep {
  vx: number;
  vy: number;
  brain: ThunderBrain;
  /** 落雷的位置(地上先出現影子)。 */
  bolts: number[];
  feathers: { vx: number; vy: number }[];
  /** 颳強風中(把玩家往左推)。 */
  gusting: boolean;
  summon: boolean;
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
}

/** 飛在畫面上方:身體底部大約 y 300,往前射打不到,要往上射或跳起來射。 */
export const THUNDER_HOVER_Y = 210;
const HOVER_MS = { 1: 2200, 2: 1800, 3: 1400 } as const;
export const THUNDER_WINDUP_MS = 600;
export const THUNDER_GUST_MS = 2000;
const BOLTS = { 1: 3, 2: 4, 3: 5 } as const;
const FEATHERS = { 1: 3, 2: 3, 3: 5 } as const;
const FEATHER_SPEED = 260;
const FEATHER_SPREAD_DEG = 50;
/** 飛在玩家右上方這麼遠的地方。 */
const AHEAD = 220;
const FLY_SPEED = 140;
const Y_SPRING = 3;
const ANGRY_MS = 1000;
const SHAKE = 50;
const MAX_MINIONS = 3;

export function initialThunderBrain(): ThunderBrain {
  return { mode: 'hover', timerMs: 0, phase: 1, attacks: 0, pending: 'lightning' };
}

/** 熬夜雷鳥:飛在上面,輪流召喚落雷(先有影子)、拍翅膀颳強風把玩家往後推、射羽毛(第二階段起);第二階段起叫老鷹。 */
export function stepThunder(b: ThunderBrain, s: ThunderSense): ThunderStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const vy = (THUNDER_HOVER_Y - s.y) * Y_SPRING;
  const none = { bolts: [], feathers: [], gusting: false, summon: false, enteredPhase: null, invulnerable: false };

  const wanted = owlPhase(s.hpRatio);
  if (s.hpRatio > 0 && wanted > b.phase && (b.mode === 'hover' || b.mode === 'angry')) {
    const phase = wanted as 2 | 3;
    return { ...none, vx: SHAKE, vy, brain: { ...b, mode: 'angry', timerMs: 0, phase }, enteredPhase: phase, invulnerable: true };
  }

  const timerMs = b.timerMs + dt;
  switch (b.mode) {
    case 'angry': {
      if (timerMs >= ANGRY_MS) return { ...none, vx: 0, vy, brain: { ...b, mode: 'hover', timerMs: 0 } };
      const vx = Math.floor(timerMs / 100) % 2 === 0 ? SHAKE : -SHAKE;
      return { ...none, vx, vy, invulnerable: true, brain: { ...b, timerMs } };
    }
    case 'hover': {
      const want = Math.min(Math.max((s.targetX ?? s.x) + AHEAD, s.arenaLeft + s.halfW), s.arenaRight - s.halfW);
      const vx = Math.abs(want - s.x) > 8 ? Math.sign(want - s.x) * FLY_SPEED : 0;
      if (timerMs < HOVER_MS[b.phase] || s.targetX === null) return { ...none, vx, vy, brain: { ...b, timerMs: Math.min(timerMs, HOVER_MS[b.phase]) } };
      let pending = THUNDER_ATTACKS[b.attacks % THUNDER_ATTACKS.length];
      if (pending === 'feathers' && b.phase === 1) pending = 'lightning';
      const attacks = b.attacks + 1;
      const summon = b.phase >= 2 && attacks % 2 === 0 && s.minionsAlive < MAX_MINIONS;
      return { ...none, vx: 0, vy, summon, brain: { ...b, mode: 'windup', timerMs: 0, attacks, pending } };
    }
    case 'windup': {
      if (timerMs < THUNDER_WINDUP_MS) {
        const vx = Math.floor(timerMs / 80) % 2 === 0 ? SHAKE : -SHAKE;
        return { ...none, vx, vy, brain: { ...b, timerMs } };
      }
      const tx = s.targetX ?? s.x - 300;
      const done = { ...b, mode: 'hover' as const, timerMs: 0 };
      if (b.pending === 'lightning') return { ...none, vx: 0, vy, bolts: yetiIcicles(BOLTS[b.phase], tx, s.arenaLeft + 30, s.arenaRight - 30), brain: done };
      if (b.pending === 'gust') return { ...none, vx: 0, vy, gusting: true, brain: { ...b, mode: 'gust', timerMs: 0 } };
      const n = FEATHERS[b.phase];
      const aim = Math.atan2((s.targetY ?? 440) - s.y, tx - s.x);
      const feathers = Array.from({ length: n }, (_, i) => {
        const a = aim + (((i - (n - 1) / 2) / Math.max(n - 1, 1)) * FEATHER_SPREAD_DEG * Math.PI) / 180;
        return { vx: Math.cos(a) * FEATHER_SPEED, vy: Math.sin(a) * FEATHER_SPEED };
      });
      return { ...none, vx: 0, vy, feathers, brain: done };
    }
    case 'gust': {
      if (timerMs >= THUNDER_GUST_MS) return { ...none, vx: 0, vy, brain: { ...b, mode: 'hover', timerMs: 0 } };
      return { ...none, vx: 0, vy, gusting: true, brain: { ...b, timerMs } };
    }
  }
}
