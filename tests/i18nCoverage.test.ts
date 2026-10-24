import { test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/** 只給開發者看的工具(調參數面板、按鍵測試頁)不用翻譯。 */
const DEV_ONLY = new Set(['src/ui/tuningPanel.ts', 'src/config/tuning.ts', 'src/ui/keyTest.ts', 'src/input/keyCombos.ts', 'src/audio/notes.ts']);
const CJK = /[一-鿿]/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

type Slot = 'zh' | 'en' | null;

/** 這段字串放在哪裡:tr 的第一個參數或 zh: 的值算中文位置,tr 的第二個參數或 en: 的值算英文位置。 */
function slotOf(node: ts.Node): Slot | 'testString' {
  let child: ts.Node = node;
  let parent = node.parent;
  // 往外穿過陣列、括號、樣板字串、字串相加。
  while (parent && (ts.isArrayLiteralExpression(parent) || ts.isParenthesizedExpression(parent) || ts.isTemplateSpan(parent) || ts.isTemplateExpression(parent) || (ts.isConditionalExpression(parent) && parent.condition !== child) || (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.PlusToken))) {
    child = parent;
    parent = parent.parent;
  }
  if (!parent) return null;
  if (ts.isCallExpression(parent) && ts.isIdentifier(parent.expression) && parent.expression.text === 'tr') {
    const i = parent.arguments.indexOf(child as ts.Expression);
    return i === 0 ? 'zh' : i === 1 ? 'en' : null;
  }
  if (ts.isPropertyAssignment(parent) && parent.initializer === child && ts.isIdentifier(parent.name)) {
    if (parent.name.text === 'zh' || parent.name.text === 'en') return parent.name.text;
    // 字型載入用的測試字串,不會顯示。
    if (parent.name.text === 'testString') return 'testString';
  }
  return null;
}

function textOf(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) return node.text;
  return null;
}

/** 畫面上會出現的中文都要有英文:寫成 tr('中文', 'English') 或 { zh: '中文', en: 'English' };英文那邊不能有中文。 */
test('原始碼裡畫面上的中文都有英文翻譯', () => {
  const missing: string[] = [];
  for (const f of files('src')) {
    if (DEV_ONLY.has(f)) continue;
    const src = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      const text = textOf(node);
      if (text !== null && CJK.test(text)) {
        // 樣板字串的片段:往上找到整個樣板字串。
        let holder: ts.Node = node;
        while (!ts.isTemplateExpression(holder) && (ts.isTemplateHead(holder) || ts.isTemplateMiddle(holder) || ts.isTemplateTail(holder) || ts.isTemplateSpan(holder))) holder = holder.parent;
        const slot = slotOf(holder);
        if (slot !== 'zh' && slot !== 'testString') {
          const line = src.getLineAndCharacterOfPosition(node.getStart(src)).line + 1;
          missing.push(`${f}:${line} ${slot === 'en' ? '(英文位置有中文) ' : ''}${text.trim().slice(0, 60)}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(src);
  }
  expect(missing).toEqual([]);
});
