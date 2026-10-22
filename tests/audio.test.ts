import { test, expect } from 'vitest';
import { noteFreq } from '../src/audio/notes';
import { SFX, sfxLength, type SfxName } from '../src/audio/recipes';
import { TUNES, tuneBeats } from '../src/audio/tunes';
import { DEFAULT_SETTINGS, sanitizeSettings, volumeGain, loadSettings, saveSettings } from '../src/audio/settings';
import { makeThrottle } from '../src/audio/throttle';

test('音名轉頻率', () => {
  expect(noteFreq('A4')).toBeCloseTo(440);
  expect(noteFreq('C5')).toBeCloseTo(523.25, 1);
  expect(noteFreq('Eb3')).toBeCloseTo(155.56, 1);
  expect(() => noteFreq('H2')).toThrow();
});

test('每個音效都短、音量溫和、音高在聽得舒服的範圍', () => {
  for (const [name, tones] of Object.entries(SFX) as [SfxName, typeof SFX[SfxName]][]) {
    expect(tones.length, name).toBeGreaterThan(0);
    expect(sfxLength(tones), name).toBeLessThanOrEqual(2);
    for (const t of tones) {
      expect(t.gain, name).toBeLessThanOrEqual(0.5);
      expect(t.freq, name).toBeGreaterThan(40);
      expect(t.freq, name).toBeLessThan(5000);
    }
  }
});

test('每首曲子的音名都認得,長度剛好是整數小節,低音每小節一個', () => {
  for (const [id, t] of Object.entries(TUNES)) {
    for (const [note] of t.melody) if (note) expect(() => noteFreq(note), id).not.toThrow();
    for (const b of t.bass) expect(() => noteFreq(b), id).not.toThrow();
    const bars = tuneBeats(t) / t.beatsPerBar;
    expect(Number.isInteger(bars), `${id} ${tuneBeats(t)} 拍`).toBe(true);
    expect(t.bass.length, id).toBe(bars);
  }
});

test('音量設定:壞資料用預設、超出範圍夾回 0–10', () => {
  expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  expect(sanitizeSettings({ music: 99, sfx: -3, muted: 'yes' })).toEqual({ music: 10, sfx: 0, muted: false });
  expect(volumeGain(10, false)).toBe(1);
  expect(volumeGain(5, false)).toBe(0.25);
  expect(volumeGain(10, true)).toBe(0);
});

test('音量設定存得回來,存不進去也不會出錯', () => {
  const data = new Map<string, string>();
  const m = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  saveSettings(m, { music: 3, sfx: 4, muted: true });
  expect(loadSettings(m)).toEqual({ music: 3, sfx: 4, muted: true });
  const broken = { getItem: () => '{bad', setItem: () => { throw new Error('x'); } };
  expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS);
  expect(() => saveSettings(broken, DEFAULT_SETTINGS)).not.toThrow();
});

test('連射聲音限制頻率', () => {
  const ok = makeThrottle({ shoot: 90 });
  expect(ok('shoot', 0)).toBe(true);
  expect(ok('shoot', 60)).toBe(false);
  expect(ok('shoot', 100)).toBe(true);
  expect(ok('hit', 100)).toBe(true);
  expect(ok('hit', 101)).toBe(true);
});
