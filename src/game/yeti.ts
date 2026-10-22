import { MAX_DT_MS } from '../config/tuning';
import { ENEMY_DEFS, arcShot } from './enemies';
import { owlPhase } from './owl';

export type YetiMode = 'idle' | 'windup' | 'leap' | 'return' | 'angry';
export type YetiAttack = 'snowballs' | 'stomp' | 'leap';

/** 招式輪流:丟雪球 → 跺腳掉冰柱 → 跳到玩家那邊(第一階段改成再丟一次雪球)。 */
export const YETI_ATTACKS: readonly YetiAttack[] = ['snowballs', 'stomp', 'leap'];

export interface YetiBrain {
  mode: YetiMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  attacks: number;
  /** 預備中的是哪一招。 */
  pending: YetiAttack;
}

export interface YetiSense {
  x: number;
  grounded: boolean;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  /** 平常站的位置(冰洞右邊)。 */
  homeX: number;
  handX: number;
  handY: number;
  arenaLeft: number;
  arenaRight: number;
  minionsAlive: number;
  /** 身體寬度的一半(大猩猩也用這套招式);沒有時用雪怪的。 */
  halfW?: number;
  dtMs: number;
}

export interface YetiStep {
  /** null 表示保留目前的水平速度(跳到一半)。 */
  vx: number | null;
  /** null 表示交給重力。 */
  vy: number | null;
  brain: YetiBrain;
  snowballs: { vx: number; vy: number }[];
  icicles: number[];
  /** 落地時往左右送出的雪浪。 */
  waves: (1 | -1)[];
  summon: boolean;
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
}

/** 雪球的重力。 */
export const SNOWBALL_GRAVITY = 800;
const IDLE_MS = { 1: 2000, 2: 1600, 3: 1200 } as const;
export const YETI_WINDUP_MS = 600;
const SNOWBALLS = { 1: 3, 2: 4, 3: 5 } as const;
const SNOWBALL_SPREAD = 90;
const ICICLES = { 1: 3, 2: 4, 3: 5 } as const;
const ICICLE_GAP = 150;
const LEAP_VY = -720;
/** 跳起來落地大約花的時間(決定水平速度)。 */
const LEAP_S = 0.95;
const LEAP_MIN_MS = 250;
const RETURN_SPEED = 140;
const ANGRY_MS = 1000;
const ANGRY_SHAKE = 40;
const MAX_MINIONS = 3;

export function initialYetiBrain(): YetiBrain {
  return { mode: 'idle', timerMs: 0, phase: 1, attacks: 0, pending: 'snowballs' };
}

/** 冰柱位置:一根對準玩家,其他每隔 ICICLE_GAP 往兩邊排開,夾在範圍裡。 */
export function yetiIcicles(n: number, targetX: number, left: number, right: number): number[] {
  const out: number[] = [];
  for (let i = 0; out.length < n && i < n * 2; i++) {
    const k = Math.ceil(i / 2) * (i % 2 === 0 ? 1 : -1);
    const x = targetX + k * ICICLE_GAP;
    if (x >= left && x <= right) out.push(x);
  }
  return out;
}

/**
 * 失眠雪怪:站在冰洞右邊,輪流丟雪球、跺腳掉冰柱、跳到玩家那邊落地震出雪浪;血量越少越暴躁。
 * 吵鬧大猩猩用同一套:丟芒果、捶胸讓樹上的芒果掉下來、跳過來落地送出震波。
 */
export function stepYeti(b: YetiBrain, s: YetiSense): YetiStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const none = { snowballs: [], icicles: [], waves: [], summon: false, enteredPhase: null, invulnerable: false };

  const wanted = owlPhase(s.hpRatio);
  if (s.hpRatio > 0 && wanted > b.phase && (b.mode === 'idle' || b.mode === 'angry')) {
    const phase = wanted as 2 | 3;
    return { ...none, vx: ANGRY_SHAKE, vy: null, brain: { ...b, mode: 'angry', timerMs: 0, phase }, enteredPhase: phase, invulnerable: true };
  }

  const timerMs = b.timerMs + dt;
  switch (b.mode) {
    case 'angry': {
      if (timerMs >= ANGRY_MS) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'idle', timerMs: 0 } };
      const vx = Math.floor(timerMs / 100) % 2 === 0 ? ANGRY_SHAKE : -ANGRY_SHAKE;
      return { ...none, vx, vy: null, invulnerable: true, brain: { ...b, timerMs } };
    }
    case 'idle': {
      if (timerMs < IDLE_MS[b.phase] || s.targetX === null) return { ...none, vx: 0, vy: null, brain: { ...b, timerMs: Math.min(timerMs, IDLE_MS[b.phase]) } };
      let pending = YETI_ATTACKS[b.attacks % YETI_ATTACKS.length];
      if (pending === 'leap' && b.phase === 1) pending = 'snowballs';
      const attacks = b.attacks + 1;
      const summon = b.phase >= 2 && attacks % 2 === 0 && s.minionsAlive < MAX_MINIONS;
      return { ...none, vx: 0, vy: null, summon, brain: { ...b, mode: 'windup', timerMs: 0, attacks, pending } };
    }
    case 'windup': {
      if (timerMs < YETI_WINDUP_MS) {
        const vx = Math.floor(timerMs / 80) % 2 === 0 ? ANGRY_SHAKE : -ANGRY_SHAKE;
        return { ...none, vx, vy: null, brain: { ...b, timerMs } };
      }
      const tx = s.targetX ?? s.x - 300;
      if (b.pending === 'snowballs') {
        const n = SNOWBALLS[b.phase];
        const snowballs = Array.from({ length: n }, (_, i) =>
          arcShot(s.handX, s.handY, tx + (i - (n - 1) / 2) * SNOWBALL_SPREAD, s.targetY ?? s.handY + 100, SNOWBALL_GRAVITY),
        );
        return { ...none, vx: 0, vy: null, snowballs, brain: { ...b, mode: 'idle', timerMs: 0 } };
      }
      if (b.pending === 'stomp') {
        const icicles = yetiIcicles(ICICLES[b.phase], tx, s.arenaLeft + 30, s.arenaRight - 30);
        return { ...none, vx: 0, vy: null, icicles, brain: { ...b, mode: 'idle', timerMs: 0 } };
      }
      // 落點夾在畫面裡,身體不會跑出去。
      const half = s.halfW ?? ENEMY_DEFS.yeti.w / 2;
      const land = Math.min(Math.max(tx, s.arenaLeft + half), s.arenaRight - half);
      return { ...none, vx: (land - s.x) / LEAP_S, vy: LEAP_VY, brain: { ...b, mode: 'leap', timerMs: 0 } };
    }
    case 'leap': {
      if (timerMs >= LEAP_MIN_MS && s.grounded) return { ...none, vx: 0, vy: null, waves: [-1, 1], brain: { ...b, mode: 'return', timerMs: 0 } };
      return { ...none, vx: null, vy: null, brain: { ...b, timerMs } };
    }
    case 'return': {
      if (Math.abs(s.homeX - s.x) <= 10) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'idle', timerMs: 0 } };
      return { ...none, vx: Math.sign(s.homeX - s.x) * RETURN_SPEED, vy: null, brain: { ...b, timerMs } };
    }
  }
}
