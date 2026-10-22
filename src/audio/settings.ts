import type { StorageLike } from '../config/tuning';

export const SETTINGS_KEY = 'gk.settings.v1';
export const VOLUME_STEPS = 10;

export interface AudioSettings {
  music: number;
  sfx: number;
  muted: boolean;
}

export const DEFAULT_SETTINGS: AudioSettings = { music: 6, sfx: 8, muted: false };

const clampVolume = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(VOLUME_STEPS, Math.max(0, Math.round(v))) : fallback;

export function sanitizeSettings(raw: unknown): AudioSettings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTINGS };
  const r = raw as Record<string, unknown>;
  return {
    music: clampVolume(r.music, DEFAULT_SETTINGS.music),
    sfx: clampVolume(r.sfx, DEFAULT_SETTINGS.sfx),
    muted: r.muted === true,
  };
}

/** 音量 0–10 轉成實際的增益(人耳對音量是對數的,用平方比較自然)。 */
export function volumeGain(step: number, muted: boolean): number {
  return muted ? 0 : (step / VOLUME_STEPS) ** 2;
}

export function loadSettings(storage: StorageLike | null): AudioSettings {
  try {
    const text = storage?.getItem(SETTINGS_KEY);
    return text ? sanitizeSettings(JSON.parse(text)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage: StorageLike | null, s: AudioSettings): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // 存不進去就只在這次有效。
  }
}
