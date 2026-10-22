import { MAX_DT_MS } from '../config/tuning';
import { owlPhase } from './owl';

export type SphinxMode = 'idle' | 'angry';
export type SphinxAttack = 'blocks' | 'paw' | 'balls';

export const SPHINX_ATTACKS: readonly SphinxAttack[] = ['blocks', 'paw', 'balls'];

export interface SphinxBrain {
  mode: SphinxMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  /** 已經出過幾次招(決定下一招與叫小怪)。 */
  attacks: number;
}

export interface SphinxSense {
  /** 嘴巴的位置(吐沙球的起點)。 */
  mouthX: number;
  mouthY: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  /** 沙磚可以掉的範圍(鎖住的畫面左邊到人面獅身前面)。 */
  dropLeft: number;
  dropRight: number;
  minionsAlive: number;
  dtMs: number;
  rand: () => number;
}

export interface SphinxStep {
  /** 只有換階段發抖時左右晃。 */
  vx: number;
  brain: SphinxBrain;
  /** 這一格開始預告的沙磚位置。 */
  blocks: number[];
  /** 這一格要拍出的沙浪,各自延遲幾毫秒出發。 */
  waves: number[];
  balls: { vx: number; vy: number }[];
  summon: boolean;
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
}

const IDLE_MS = { 1: 2000, 2: 1600, 3: 1200 } as const;
const BLOCKS = { 1: 3, 2: 4, 3: 5 } as const;
const BALLS = { 1: 3, 2: 4, 3: 5 } as const;
const BALL_SPREAD_DEG = { 1: 30, 2: 40, 3: 50 } as const;
const BALL_SPEED = 240;
/** 第三階段拍兩次,第二道晚 700 毫秒。 */
const WAVES = { 1: [0], 2: [0], 3: [0, 700] } as const;
const ANGRY_MS = 1000;
const ANGRY_SHAKE = 40;
/** 第二階段起每兩招叫一隻小怪,場上最多 3 隻。 */
const MAX_MINIONS = 3;
/** 兩塊沙磚至少隔這麼遠,中間留得出空隙躲。 */
const BLOCK_MIN_GAP = 60;

export function initialSphinxBrain(): SphinxBrain {
  return { mode: 'idle', timerMs: 0, phase: 1, attacks: 0 };
}

/** 隨機找位置的次數上限;找不到夠遠的位置就少掉幾塊。 */
const BLOCK_TRIES = 50;

/** 沙磚位置:一塊瞄準玩家,其他隨機散在範圍裡,彼此至少隔 BLOCK_MIN_GAP。 */
export function blockDrops(n: number, targetX: number | null, left: number, right: number, rand: () => number): number[] {
  const out = targetX === null ? [] : [Math.min(Math.max(targetX, left), right)];
  for (let i = 0; out.length < n && i < BLOCK_TRIES; i++) {
    const x = left + rand() * (right - left);
    if (out.every((o) => Math.abs(o - x) >= BLOCK_MIN_GAP)) out.push(x);
  }
  return out;
}

function ballFan(phase: 1 | 2 | 3, s: SphinxSense): { vx: number; vy: number }[] {
  const n = BALLS[phase];
  const aim = Math.atan2((s.targetY ?? s.mouthY) - s.mouthY, (s.targetX ?? s.mouthX - 100) - s.mouthX);
  const spread = (BALL_SPREAD_DEG[phase] * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const a = aim - spread / 2 + (spread * i) / (n - 1);
    return { vx: Math.cos(a) * BALL_SPEED, vy: Math.sin(a) * BALL_SPEED };
  });
}

/** 睡不著的人面獅身:趴在原地,輪流沙磚雨、貓掌拍出沙浪、吐沙球;血量越少越暴躁。 */
export function stepSphinx(b: SphinxBrain, s: SphinxSense): SphinxStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const none = { blocks: [], waves: [], balls: [], summon: false, enteredPhase: null, invulnerable: false };

  const wanted = owlPhase(s.hpRatio);
  if (s.hpRatio > 0 && wanted > b.phase) {
    const phase = wanted as 2 | 3;
    return { ...none, vx: ANGRY_SHAKE, brain: { ...b, mode: 'angry', timerMs: 0, phase }, enteredPhase: phase, invulnerable: true };
  }

  const timerMs = b.timerMs + dt;
  if (b.mode === 'angry') {
    if (timerMs >= ANGRY_MS) return { ...none, vx: 0, brain: { ...b, mode: 'idle', timerMs: 0 } };
    const vx = Math.floor(timerMs / 100) % 2 === 0 ? ANGRY_SHAKE : -ANGRY_SHAKE;
    return { ...none, vx, brain: { ...b, timerMs }, invulnerable: true };
  }

  if (timerMs < IDLE_MS[b.phase] || s.targetX === null) return { ...none, vx: 0, brain: { ...b, timerMs: Math.min(timerMs, IDLE_MS[b.phase]) } };

  const attack = SPHINX_ATTACKS[b.attacks % SPHINX_ATTACKS.length];
  const attacks = b.attacks + 1;
  const brain: SphinxBrain = { ...b, timerMs: 0, attacks };
  const summon = b.phase >= 2 && attacks % 2 === 0 && s.minionsAlive < MAX_MINIONS;
  if (attack === 'blocks') return { ...none, vx: 0, brain, summon, blocks: blockDrops(BLOCKS[b.phase], s.targetX, s.dropLeft, s.dropRight, s.rand) };
  if (attack === 'paw') return { ...none, vx: 0, brain, summon, waves: [...WAVES[b.phase]] };
  return { ...none, vx: 0, brain, summon, balls: ballFan(b.phase, s) };
}
