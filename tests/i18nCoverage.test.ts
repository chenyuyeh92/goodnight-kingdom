import { test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** 只給開發者看的工具(調參數面板、按鍵測試頁)不用翻譯。 */
const DEV_ONLY = new Set(['src/ui/tuningPanel.ts', 'src/config/tuning.ts', 'src/ui/keyTest.ts', 'src/input/keyCombos.ts', 'src/audio/notes.ts']);
const CJK_STRING = /(['"`])(?:(?!\1).)*[一-鿿](?:(?!\1).)*\1/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

/** 畫面上會出現的中文都要有英文:寫成 tr('中文', 'English') 或 { zh: '中文', en: 'English' }。 */
test('原始碼裡畫面上的中文都有英文翻譯', () => {
  const missing: string[] = [];
  for (const f of files('src')) {
    if (DEV_ONLY.has(f)) continue;
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const code = line.trim();
        if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return;
        const noComment = code.replace(/\s\/\/ .*$/, '');
        if (!CJK_STRING.test(noComment)) return;
        if (/\btr\(/.test(noComment) || /\b(zh|en):\s*\[?\s*['"`]/.test(noComment)) return;
        // 字型載入用的測試字串,不會顯示。
        if (/testString:/.test(noComment)) return;
        missing.push(`${f}:${i + 1} ${code.slice(0, 90)}`);
      });
  }
  expect(missing).toEqual([]);
});
