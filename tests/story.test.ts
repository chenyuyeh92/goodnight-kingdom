import { test, expect } from 'vitest';
import { ENDING, OPENING, TAPIR_LINES, WORLD_INTRO, introWorldOf } from '../src/story/script';
import { initialTypewriter, stepTypewriter, tapTypewriter, typedText, TYPE_MS } from '../src/story/typewriter';
import { createSaveStore, sanitizeSave } from '../src/game/save';

test('開場 6 幕、結局 13 幕,每幕一到兩句', () => {
  expect(OPENING).toHaveLength(6);
  expect(ENDING).toHaveLength(13);
  for (const s of [...OPENING, ...ENDING]) {
    expect(s.zh.length).toBeGreaterThanOrEqual(1);
    expect(s.zh.length).toBeLessThanOrEqual(2);
    // 英文一句對一句。
    expect(s.en.length, s.id).toBe(s.zh.length);
  }
  expect(OPENING[0].zh[0]).toBe('在很遠很遠的地方,有一個晚安王國。');
  expect(ENDING[11].zh).toEqual(['晚安。']);
  expect(ENDING[11].en).toEqual(['Good night.']);
});

test('十個世界各有一句開頭;只在每個世界第一關出現', () => {
  for (let w = 1; w <= 10; w++) {
    expect(WORLD_INTRO[w].zh, `world ${w}`).toBeTruthy();
    expect(WORLD_INTRO[w].en, `world ${w}`).toBeTruthy();
  }
  expect(WORLD_INTRO[1].zh).toContain('考數學');
  expect(WORLD_INTRO[1].en).toContain('math test');
  expect(introWorldOf('w1-1')).toBe(1);
  expect(introWorldOf('w2-1')).toBe(2);
  expect(introWorldOf('w10-1')).toBe(10);
  expect(introWorldOf('w1-2')).toBeNull();
  expect(introWorldOf('forest')).toBeNull();
  expect(introWorldOf('range')).toBeNull();
});

test('夢貘的台詞:出場、第二階段、第三階段', () => {
  expect(TAPIR_LINES.enter.zh).toBe('不要過來……你們不懂……');
  expect(TAPIR_LINES[2].zh).toBe('我……快裝不下了……!');
  expect(TAPIR_LINES[3].zh).toBe('如果我睡著了……這些惡夢,要去哪裡?');
  expect(TAPIR_LINES[3].en).toBe('If I fall asleep… where will all these nightmares go?');
});

test('打字:每字 50 ms;點一下先把整幕顯示完,再點才到下一幕', () => {
  const lines = ['一二三', '四五'];
  let t = initialTypewriter(lines);
  t = stepTypewriter(t, TYPE_MS * 2);
  expect(typedText(t)).toEqual(['一二', '']);
  t = stepTypewriter(t, TYPE_MS * 2);
  expect(typedText(t)).toEqual(['一二三', '四']);
  const tap1 = tapTypewriter(t);
  expect(tap1.advance).toBe(false);
  expect(typedText(tap1.state)).toEqual(['一二三', '四五']);
  expect(tap1.state.done).toBe(true);
  expect(tapTypewriter(tap1.state).advance).toBe(true);
  // 時間到也會打完。
  expect(stepTypewriter(initialTypewriter(lines), TYPE_MS * 10).done).toBe(true);
});

test('存檔記住看過開場、看過哪幾個世界的開頭句;舊存檔沒有這些欄位', () => {
  const mem = new Map<string, string>();
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  const s = createSaveStore(storage);
  expect(s.get().story.opening).toBe(false);
  expect(s.get().story.intros).toEqual([]);
  s.markStory('opening');
  s.markIntro(3);
  s.markIntro(3);
  const again = createSaveStore(storage);
  expect(again.get().story.opening).toBe(true);
  expect(again.get().story.intros).toEqual([3]);
  expect(sanitizeSave({ version: 1, weapons: {} }).story).toEqual({ opening: false, ending: false, intros: [] });
  expect(sanitizeSave({ version: 1, weapons: {}, story: { opening: true, intros: [1, 99, 'x', 2] } }).story).toEqual({ opening: true, ending: false, intros: [1, 2] });
});
