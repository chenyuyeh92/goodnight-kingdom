import { noteFreq } from './notes';

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
  | 'shoot'
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
  | 'select';

const n = noteFreq;

/** 全部是程式合成的柔和音效:泡泡「啵」、睡著的叮咚、寶箱的琶音…… */
export const SFX: Record<SfxName, readonly Tone[]> = {
  shoot: [{ freq: 520, toFreq: 880, at: 0, dur: 0.07, wave: 'sine', gain: 0.18 }],
  hit: [{ freq: 300, toFreq: 180, at: 0, dur: 0.08, wave: 'triangle', gain: 0.3 }],
  blocked: [{ freq: 1200, toFreq: 900, at: 0, dur: 0.06, wave: 'square', gain: 0.08 }],
  melee: [{ freq: 200, toFreq: 90, at: 0, dur: 0.14, wave: 'triangle', gain: 0.4 }],
  sleep: [
    { freq: n('E6'), at: 0, dur: 0.25, wave: 'sine', gain: 0.18 },
    { freq: n('C6'), at: 0.12, dur: 0.35, wave: 'sine', gain: 0.15 },
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
};

/** 一個音效的總長度(秒)。 */
export function sfxLength(tones: readonly Tone[]): number {
  return Math.max(...tones.map((t) => t.at + t.dur));
}
