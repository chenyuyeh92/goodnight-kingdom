import { noteFreq } from './notes';
import { DEFAULT_TUNING } from '../config/tuning';
import { shootGapMs } from '../game/feel';
import { WEAPONS, type WeaponId } from '../game/weapons';

export type Wave = 'sine' | 'triangle' | 'square' | 'sawtooth';

/** 一個合成的音:從 at 秒開始,長 dur 秒,音高可以從 freq 滑到 toFreq。 */
export interface Tone {
  freq: number;
  toFreq?: number;
  at: number;
  dur: number;
  wave: Wave;
  gain: number;
}

export type SfxName =
  | 'shootBubble'
  | 'shootSheep'
  | 'shootPillow'
  | 'shootMilk'
  | 'shootHarp'
  | 'shootBoomerang'
  | 'shootLamp'
  | 'shootYarn'
  | 'shootMarshmallow'
  | 'shootWatch'
  | 'shootStar'
  | 'watchCharge'
  | 'boom'
  | 'hit'
  | 'blocked'
  | 'melee'
  | 'sleep'
  | 'hurt'
  | 'jump'
  | 'chest'
  | 'item'
  | 'splash'
  | 'bossAppear'
  | 'bossPhase'
  | 'bossDown'
  | 'complete'
  | 'select'
  | 'spring';

const n = noteFreq;

/** 全部是程式合成的柔和音效:泡泡「啵」、睡著的叮咚、寶箱的琶音…… */
export const SFX: Record<SfxName, readonly Tone[]> = {
  // 每把武器自己的射擊聲:泡泡「啵」、機槍「噠」、枕頭砲「砰」、牛奶「噗嘶」、豎琴「叮」、迴力鏢「咻」、月亮燈「嗡」。
  shootBubble: [{ freq: 520, toFreq: 880, at: 0, dur: 0.07, wave: 'sine', gain: 0.18 }],
  shootSheep: [{ freq: 220, toFreq: 140, at: 0, dur: 0.04, wave: 'square', gain: 0.12 }],
  shootPillow: [
    { freq: 140, toFreq: 60, at: 0, dur: 0.18, wave: 'triangle', gain: 0.4 },
    { freq: 90, at: 0, dur: 0.2, wave: 'sine', gain: 0.3 },
  ],
  shootMilk: [
    { freq: 900, toFreq: 300, at: 0, dur: 0.12, wave: 'sawtooth', gain: 0.06 },
    { freq: 260, toFreq: 180, at: 0, dur: 0.06, wave: 'triangle', gain: 0.2 },
  ],
  shootHarp: [
    { freq: n('C6'), at: 0, dur: 0.25, wave: 'sine', gain: 0.16 },
    { freq: n('G6'), at: 0.02, dur: 0.18, wave: 'sine', gain: 0.06 },
  ],
  shootBoomerang: [{ freq: 300, toFreq: 900, at: 0, dur: 0.18, wave: 'sine', gain: 0.18 }],
  shootLamp: [{ freq: 330, toFreq: 360, at: 0, dur: 0.08, wave: 'triangle', gain: 0.12 }],
  // 毛線球「啵嚶」(彈弓)、棉花糖「噗」、懷錶放開「嗡~」、流星「叮鈴」。
  shootYarn: [{ freq: 300, toFreq: 520, at: 0, dur: 0.09, wave: 'triangle', gain: 0.2 }],
  shootMarshmallow: [
    { freq: 180, toFreq: 110, at: 0, dur: 0.12, wave: 'sine', gain: 0.3 },
    { freq: 600, toFreq: 300, at: 0, dur: 0.06, wave: 'triangle', gain: 0.08 },
  ],
  shootWatch: [
    { freq: 520, toFreq: 260, at: 0, dur: 0.35, wave: 'sine', gain: 0.22 },
    { freq: 780, toFreq: 390, at: 0.03, dur: 0.3, wave: 'triangle', gain: 0.08 },
  ],
  shootStar: [
    { freq: n('E6'), at: 0, dur: 0.12, wave: 'sine', gain: 0.12 },
    { freq: n('B6'), at: 0.04, dur: 0.12, wave: 'sine', gain: 0.08 },
  ],
  // 懷錶集氣中「滴答」。
  watchCharge: [{ freq: 1200, at: 0, dur: 0.03, wave: 'square', gain: 0.05 }],
  // 棉花糖、流星落地爆開「碰」(軟軟的)。
  boom: [
    { freq: 160, toFreq: 50, at: 0, dur: 0.25, wave: 'sine', gain: 0.4 },
    { freq: 400, toFreq: 120, at: 0, dur: 0.12, wave: 'triangle', gain: 0.12 },
  ],
  hit: [{ freq: 420, toFreq: 200, at: 0, dur: 0.06, wave: 'triangle', gain: 0.3 }],
  blocked: [
    { freq: 1600, toFreq: 1300, at: 0, dur: 0.05, wave: 'square', gain: 0.08 },
    { freq: 2400, at: 0, dur: 0.04, wave: 'triangle', gain: 0.1 },
  ],
  melee: [{ freq: 200, toFreq: 90, at: 0, dur: 0.14, wave: 'triangle', gain: 0.4 }],
  sleep: [
    { freq: 160, toFreq: 90, at: 0, dur: 0.12, wave: 'sine', gain: 0.35 },
    { freq: n('E6'), at: 0.03, dur: 0.25, wave: 'sine', gain: 0.18 },
    { freq: n('C6'), at: 0.15, dur: 0.35, wave: 'sine', gain: 0.15 },
  ],
  hurt: [{ freq: 440, toFreq: 160, at: 0, dur: 0.3, wave: 'triangle', gain: 0.4 }],
  jump: [{ freq: 330, toFreq: 620, at: 0, dur: 0.12, wave: 'sine', gain: 0.15 }],
  chest: ['C5', 'E5', 'G5', 'C6', 'E6'].map((x, i) => ({ freq: n(x), at: i * 0.07, dur: 0.4, wave: 'triangle' as const, gain: 0.22 })),
  item: [
    { freq: n('G5'), at: 0, dur: 0.12, wave: 'sine', gain: 0.22 },
    { freq: n('D6'), at: 0.08, dur: 0.2, wave: 'sine', gain: 0.22 },
  ],
  splash: [{ freq: 900, toFreq: 200, at: 0, dur: 0.35, wave: 'sawtooth', gain: 0.08 }],
  bossAppear: ['C3', 'Eb3', 'G3'].map((x, i) => ({ freq: n(x), at: i * 0.18, dur: 0.6, wave: 'triangle' as const, gain: 0.35 })),
  bossPhase: [{ freq: 180, toFreq: 120, at: 0, dur: 0.5, wave: 'sawtooth', gain: 0.18 }],
  bossDown: ['G5', 'E5', 'C5', 'G4', 'C5'].map((x, i) => ({ freq: n(x), at: i * 0.16, dur: 0.6, wave: 'sine' as const, gain: 0.25 })),
  complete: ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].map((x, i) => ({ freq: n(x), at: i * 0.13, dur: i === 5 ? 0.9 : 0.3, wave: 'triangle' as const, gain: 0.25 })),
  select: [{ freq: n('A5'), at: 0, dur: 0.08, wave: 'sine', gain: 0.18 }],
  // 彈跳墊「啵嚶」。
  spring: [
    { freq: 220, toFreq: 880, at: 0, dur: 0.16, wave: 'sine', gain: 0.25 },
    { freq: 440, toFreq: 1320, at: 0.04, dur: 0.12, wave: 'triangle', gain: 0.1 },
  ],
};

export const SHOOT_SFX: Readonly<Record<WeaponId, SfxName>> = {
  yawnBubble: 'shootBubble',
  sheepGun: 'shootSheep',
  pillowCannon: 'shootPillow',
  milkSpray: 'shootMilk',
  lullabyHarp: 'shootHarp',
  blanketBoomerang: 'shootBoomerang',
  moonLamp: 'shootLamp',
  yarnBall: 'shootYarn',
  marshmallowBomb: 'shootMarshmallow',
  hypnoWatch: 'shootWatch',
  wishingStar: 'shootStar',
};

/** 豎琴每發從這幾個音高挑一個(Do、Re、Mi、Sol)。 */
export const HARP_PITCH = [1, 1.125, 1.25, 1.5] as const;

/** 同一種音效最短的間隔(ms):一次打倒很多隻時不會吵成一片;射擊聲跟著武器射速,每一發都有聲音。 */
export const THROTTLE_MS: Partial<Record<SfxName, number>> = {
  hit: 50,
  blocked: 80,
  sleep: 70,
  splash: 200,
  select: 40,
  boom: 60,
  watchCharge: 150,
  ...Object.fromEntries(Object.values(WEAPONS).map((d) => [SHOOT_SFX[d.id], shootGapMs(d.fireIntervalMs ?? DEFAULT_TUNING.fireIntervalMs)])),
};

/** 一個音效的總長度(秒)。 */
export function sfxLength(tones: readonly Tone[]): number {
  return Math.max(...tones.map((t) => t.at + t.dur));
}
