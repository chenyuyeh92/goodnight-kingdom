import type { WeaponId } from './weapons';
import type { Aim, Facing } from './playerMotor';

/**
 * 射擊聲最短間隔:每一發都有聲音。畫面卡一下時兩發可能只隔射擊間隔的一半左右,
 * 所以取 0.4 倍;只擋同一格重複觸發(雙人同時射同一把)。
 */
export function shootGapMs(intervalMs: number): number {
  return intervalMs * 0.4;
}

/** 小魔物被打中往子彈方向退後的速度(傷害越大退越多,有上限)、退多久;壓扁多久、多扁。 */
export function knockbackSpeed(damage: number): number {
  return Math.min(120, 30 * damage);
}
export const KNOCK_MS = 120;
export const SQUASH_MS = 80;
export const SQUASH = { x: 1.15, y: 0.85 } as const;

/** 開火時角色往後頓一下的重武器。 */
export const RECOIL_WEAPONS: ReadonlySet<WeaponId> = new Set<WeaponId>(['pillowCannon', 'blanketBoomerang', 'marshmallowBomb']);
export const RECOIL_VX = 60;

/** 連續哄睡:上一隻打倒後 COMBO_WINDOW_MS 內再打倒就累加。 */
export interface Combo {
  count: number;
  sinceMs: number;
  best: number;
}
export const NO_COMBO: Readonly<Combo> = Object.freeze({ count: 0, sinceMs: 0, best: 0 });
export const COMBO_WINDOW_MS = 2000;

export function comboDefeat(c: Combo): Combo {
  const count = c.count > 0 && c.sinceMs <= COMBO_WINDOW_MS ? c.count + 1 : 1;
  return { count, sinceMs: 0, best: Math.max(c.best, count) };
}

export function comboTick(c: Combo, dtMs: number): Combo {
  const sinceMs = c.sinceMs + dtMs;
  return { ...c, sinceMs, count: sinceMs > COMBO_WINDOW_MS ? 0 : c.count };
}

/** ×3 起黃、×5 橘、×10 粉紅;字越來越大(×10 封頂)。 */
export function comboStyle(n: number): { color: string; fontSize: number } {
  const color = n >= 10 ? '#ff8ac8' : n >= 5 ? '#ffb060' : n >= 3 ? '#ffe08a' : '#f3e9d2';
  return { color, fontSize: 22 + 2 * Math.min(n, 10) };
}

/** 武器圖上槍口的位置(寬、高的比例):手上的武器把槍口對到子彈的發射點。 */
export const MUZZLE: Readonly<Record<WeaponId, { x: number; y: number }>> = {
  yawnBubble: { x: 0.95, y: 0.3 },
  sheepGun: { x: 1, y: 0.45 },
  pillowCannon: { x: 0.97, y: 0.72 },
  milkSpray: { x: 1, y: 0.4 },
  lullabyHarp: { x: 0.95, y: 0.4 },
  blanketBoomerang: { x: 1, y: 0.5 },
  moonLamp: { x: 0.5, y: 0.05 },
  yarnBall: { x: 0.85, y: 0.25 },
  marshmallowBomb: { x: 0.9, y: 0.35 },
  hypnoWatch: { x: 0.75, y: 0.6 },
  wishingStar: { x: 0.75, y: 0.15 },
};

/** 月亮燈的圖是直的(燈頭朝上),轉 90 度才是朝右。 */
export const ART_ANGLE: Partial<Record<WeaponId, number>> = { moonLamp: 90 };
export const HELD_SCALE = 0.8;
/** 手上的武器往瞄準方向伸出去一點(不擋住身體);子彈發射點不變,子彈從武器裡飛出來。 */
export const HELD_FORWARD = 18;

const AIM_ANGLE: Record<Aim, number> = { forward: 0, up: -90, down: 90 };

/** 手上武器的角度與翻轉:朝左時圖左右翻轉,角度也跟著反過來(翻轉後再轉)。 */
export function heldPose(aim: Aim, facing: Facing, artAngle = 0): { angle: number; flipX: boolean } {
  return { angle: facing * (AIM_ANGLE[aim] + artAngle), flipX: facing < 0 };
}
