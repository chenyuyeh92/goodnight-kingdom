import { MAX_DT_MS } from '../config/tuning';

export type OwlMode = 'hover' | 'swoop' | 'recover' | 'angry';

export interface OwlBrain {
  mode: OwlMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  /** 已經進入幾次 hover(用來決定第幾次召喚)。 */
  hovers: number;
  swoopTargetX: number;
}

export interface OwlSense {
  x: number;
  y: number;
  hpRatio: number;
  targetX: number | null;
  arenaLeft: number;
  arenaRight: number;
  timeMs: number;
  dtMs: number;
  minionsAlive: number;
}

export interface OwlStep {
  vx: number;
  vy: number;
  brain: OwlBrain;
  feathers: { vx: number; vy: number }[];
  summon: ('left' | 'right')[];
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
}

export const OWL_HOVER_Y = 150;
export const OWL_SWOOP_Y = 420;

const FEATHER_SPEED = 260;
const FEATHERS = { 1: 3, 2: 5, 3: 7 } as const;
const FEATHER_SPREAD_DEG = { 1: 40, 2: 70, 3: 100 } as const;
const HOVER_MS = { 1: 2600, 2: 2000, 3: 1400 } as const;
const SWOOP_SPEED = { 1: 420, 2: 480, 3: 560 } as const;
const HOVER_SWING = 250;
const HOVER_SWING_PERIOD = 900;
const HOVER_SPRING = 3;
const HOVER_MAX_SPEED = 300;
const SWOOP_MAX_MS = 900;
const SWOOP_ARRIVE = 20;
const RECOVER_MS = 700;
const RECOVER_VY = -260;
const ANGRY_MS = 1000;
const ANGRY_SHAKE = 60;
const MAX_MINIONS = 4;

/** 血量比例決定階段:2/3 以上第一階段,1/3 以上第二階段,其餘第三階段。 */
export function owlPhase(hpRatio: number): 1 | 2 | 3 {
  if (hpRatio > 0.66) return 1;
  if (hpRatio > 0.33) return 2;
  return 3;
}

export function initialOwlBrain(): OwlBrain {
  return { mode: 'hover', timerMs: 0, phase: 1, hovers: 0, swoopTargetX: 0 };
}

function featherVolley(phase: 1 | 2 | 3): { vx: number; vy: number }[] {
  const n = FEATHERS[phase];
  const spread = (FEATHER_SPREAD_DEG[phase] * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const angle = Math.PI / 2 - spread / 2 + (spread * i) / (n - 1);
    return { vx: Math.cos(angle) * FEATHER_SPEED, vy: Math.sin(angle) * FEATHER_SPEED };
  });
}

const clamp = (v: number, m: number): number => Math.max(-m, Math.min(m, v));

/** 熬夜貓頭鷹:盤旋撒羽毛 → 俯衝 → 回升;血量越少越暴躁。 */
export function stepOwl(b: OwlBrain, s: OwlSense): OwlStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const none: Pick<OwlStep, 'feathers' | 'summon' | 'enteredPhase' | 'invulnerable'> = {
    feathers: [],
    summon: [],
    enteredPhase: null,
    invulnerable: false,
  };

  const wanted = owlPhase(s.hpRatio);
  if (s.hpRatio > 0 && wanted > b.phase) {
    const phase = wanted as 2 | 3;
    return { ...none, vx: ANGRY_SHAKE, vy: 0, brain: { ...b, mode: 'angry', timerMs: 0, phase }, enteredPhase: phase, invulnerable: true };
  }

  if (b.mode === 'angry') {
    const timerMs = b.timerMs + dt;
    if (timerMs >= ANGRY_MS) return { ...none, vx: 0, vy: 0, brain: { ...b, mode: 'hover', timerMs: 0 } };
    const vx = Math.floor(timerMs / 100) % 2 === 0 ? ANGRY_SHAKE : -ANGRY_SHAKE;
    return { ...none, vx, vy: 0, brain: { ...b, timerMs }, invulnerable: true };
  }

  if (b.mode === 'hover') {
    let feathers: { vx: number; vy: number }[] = [];
    let summon: ('left' | 'right')[] = [];
    let hovers = b.hovers;
    if (b.timerMs === 0) {
      feathers = featherVolley(b.phase);
      hovers += 1;
      if (b.phase >= 2 && hovers % 2 === 0 && s.minionsAlive < MAX_MINIONS) summon = ['left', 'right'];
    }
    const timerMs = b.timerMs + dt;
    const center = (s.arenaLeft + s.arenaRight) / 2;
    const tx = center + HOVER_SWING * Math.sin(s.timeMs / HOVER_SWING_PERIOD);
    const vx = clamp((tx - s.x) * HOVER_SPRING, HOVER_MAX_SPEED);
    const vy = clamp((OWL_HOVER_Y - s.y) * HOVER_SPRING, HOVER_MAX_SPEED);
    if (timerMs >= HOVER_MS[b.phase] && s.targetX !== null) {
      return { ...none, vx, vy, feathers, summon, brain: { ...b, mode: 'swoop', timerMs: 0, hovers, swoopTargetX: s.targetX } };
    }
    return { ...none, vx, vy, feathers, summon, brain: { ...b, timerMs, hovers } };
  }

  if (b.mode === 'swoop') {
    const timerMs = b.timerMs + dt;
    const dx = b.swoopTargetX - s.x;
    const dy = OWL_SWOOP_Y - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist < SWOOP_ARRIVE || timerMs >= SWOOP_MAX_MS) {
      return { ...none, vx: 0, vy: RECOVER_VY, brain: { ...b, mode: 'recover', timerMs: 0 } };
    }
    const speed = SWOOP_SPEED[b.phase];
    return { ...none, vx: (dx / dist) * speed, vy: (dy / dist) * speed, brain: { ...b, timerMs } };
  }

  const timerMs = b.timerMs + dt;
  if (timerMs >= RECOVER_MS) return { ...none, vx: 0, vy: 0, brain: { ...b, mode: 'hover', timerMs: 0 } };
  return { ...none, vx: 0, vy: RECOVER_VY, brain: { ...b, timerMs } };
}
