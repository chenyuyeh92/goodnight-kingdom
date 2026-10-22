import type { EnemyPhase, EnemyType } from '../game/enemies';

/** 程式產生的動作:在圖片上加位移、伸縮、旋轉,讓單張圖看起來在走、在飛。 */
export interface Pose {
  /** 往上為負的位移(px)。 */
  dy: number;
  scaleX: number;
  scaleY: number;
  /** 角度(度);素材朝左,翻轉後由呼叫端處理方向。 */
  angle: number;
  /** 繞中心旋轉(滾動),不是繞腳底。 */
  spin: boolean;
}

export const IDLE: Pose = { dy: 0, scaleX: 1, scaleY: 1, angle: 0, spin: false };

const WALK_PERIOD_MS = 360;
const WALK_HOP = 3;
const WALK_TILT = 5;
const BREATH_PERIOD_MS = 1600;
const BREATH = 0.03;
const FLAP_PERIOD_MS = 180;
const FLAP = 0.12;
const FLOAT_PERIOD_MS = 900;
const FLOAT = 3;
const ROLL_DEG_PER_MS = 0.9;
const STRETCH = 0.14;

function walk(tMs: number): Pose {
  const p = (tMs / WALK_PERIOD_MS) * Math.PI * 2;
  return { dy: -Math.abs(Math.sin(p)) * WALK_HOP, scaleX: 1, scaleY: 1 + 0.04 * Math.abs(Math.cos(p)), angle: Math.sin(p) * WALK_TILT, spin: false };
}

function breathe(tMs: number): Pose {
  const s = Math.sin((tMs / BREATH_PERIOD_MS) * Math.PI * 2);
  return { ...IDLE, scaleY: 1 + BREATH * s, scaleX: 1 - (BREATH / 2) * s };
}

function flap(tMs: number, period = FLAP_PERIOD_MS, amount = FLAP): Pose {
  const f = Math.sin((tMs / period) * Math.PI * 2);
  const bob = Math.sin((tMs / FLOAT_PERIOD_MS) * Math.PI * 2) * FLOAT;
  return { dy: bob, scaleX: 1 + amount * 0.3 * f, scaleY: 1 - amount + amount * (f + 1) * 0.5 * 1.4, angle: 0, spin: false };
}

/** 跳起來拉長、往下掉稍微拉長,落地恢復。 */
function airborne(vy: number): Pose {
  const k = Math.min(1, Math.abs(vy) / 400) * (vy < 0 ? 1 : 0.4);
  return { ...IDLE, scaleY: 1 + STRETCH * k, scaleX: 1 - STRETCH * 0.6 * k };
}

export function enemyPose(type: EnemyType, phase: EnemyPhase | 'boss', tMs: number, vx: number, vy: number, grounded: boolean, facing: 1 | -1 = -1): Pose {
  if (type === 'nightBat') return flap(tMs);
  // 禿鷹翅膀大,拍得比蝙蝠慢。
  if (type === 'vulture' || type === 'puffin' || type === 'volcanoBird' || type === 'parrot' || type === 'hornbill') return flap(tMs, 300, 0.1);
  // 企鵝肚子貼地滑:整隻躺平(往滑的方向)。
  if (type === 'penguin' && phase === 'dash') return { ...IDLE, angle: facing < 0 ? -80 : 80, spin: true };
  // 河豚膨脹:整隻變大。
  if (type === 'puffer' && phase === 'puff') return { ...IDLE, scaleX: 1.35, scaleY: 1.35 };
  // 在水裡游的:輕輕上下擺動(像在划水)。
  if (type === 'jellyfish' || type === 'clownfish' || type === 'octopus' || type === 'puffer' || type === 'eel' || type === 'nessie') return flap(tMs, 700, 0.05);
  if (type === 'nightOwl') {
    // 貓頭鷹:慢慢拍翅,俯衝時身體往前傾。
    const p = flap(tMs, 420, 0.06);
    const tilt = Math.max(-18, Math.min(18, vx / 25));
    return { ...p, angle: vy > 150 ? tilt : 0 };
  }
  if ((type === 'hedgehog' || type === 'armadillo' || type === 'pangolin') && phase === 'roll') {
    return { ...IDLE, angle: (tMs * ROLL_DEG_PER_MS * Math.sign(vx || -1)) % 360, spin: true };
  }
  if (!grounded) return airborne(vy);
  if (Math.abs(vx) > 5) return walk(tMs);
  return breathe(tMs);
}

export function playerPose(tMs: number, vx: number, grounded: boolean, vy: number, crouching: boolean): Pose {
  if (!grounded) return airborne(vy);
  if (Math.abs(vx) > 5) return crouching ? { ...walk(tMs), angle: 0, dy: 0 } : walk(tMs);
  return { ...breathe(tMs), dy: 0 };
}
