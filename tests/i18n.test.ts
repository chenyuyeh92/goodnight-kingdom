import { test, expect } from 'vitest';
import { detectLang, initLang, lang, pick, setLang, tr } from '../src/i18n/lang';

const mem = (): { getItem(k: string): string | null; setItem(k: string, v: string): void; data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

test('裝置語言是中文(台灣、香港、中國都算)用中文,其他用英文', () => {
  expect(detectLang(['zh-TW'])).toBe('zh');
  expect(detectLang(['zh-Hant-HK', 'en'])).toBe('zh');
  expect(detectLang(['zh-CN'])).toBe('zh');
  expect(detectLang(['en-US', 'zh-TW'])).toBe('en');
  expect(detectLang(['ja-JP'])).toBe('en');
  expect(detectLang([])).toBe('en');
});

test('設定裡選的語言記在這台裝置,優先於自動偵測;網址 ?lang= 最優先', () => {
  const s = mem();
  initLang(s, ['zh-TW'], null);
  expect(lang()).toBe('zh');
  setLang('en', s);
  expect(lang()).toBe('en');
  initLang(s, ['zh-TW'], null);
  expect(lang()).toBe('en');
  initLang(s, ['en-US'], 'zh');
  expect(lang()).toBe('zh');
  setLang('auto', s);
  initLang(s, ['ja'], null);
  expect(lang()).toBe('en');
});

test('tr、pick 依目前語言回傳', () => {
  initLang(mem(), ['zh-TW'], null);
  expect(tr('開始遊戲', 'Start')).toBe('開始遊戲');
  expect(pick({ zh: '晚安', en: 'Good night' })).toBe('晚安');
  initLang(mem(), ['en'], null);
  expect(tr('開始遊戲', 'Start')).toBe('Start');
});
