import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openMenu(page: Page, query: string): Promise<void> {
  await page.goto(`./?test=1&story=1${query}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

test.describe('英文版', () => {
  test('網址加 ?lang=en:主選單、開場故事、世界開頭句都是英文', async ({ page }) => {
    await openMenu(page, '&lang=en');
    expect((await gk(page)).lang).toBe('en');
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'story', undefined, { timeout: 5000 });
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GK__!.story?.done === true, undefined, { timeout: 2000 });
    expect((await gk(page)).story!.text[0]).toBe('Far, far away, there was a Goodnight Kingdom.');
    await page.goto('./?test=1&story=1&lang=en&mode=single&level=w5-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect((await gk(page)).intro).toContain('black snow');
  });

  test('裝置是英文就自動用英文;中文裝置用中文', async ({ browser }) => {
    for (const [locale, want] of [['en-US', 'en'], ['zh-TW', 'zh']] as const) {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await openMenu(page, '');
      expect((await gk(page)).lang).toBe(want);
      await ctx.close();
    }
  });

  test('設定畫面換語言:立刻換,重新整理後還記得', async ({ page }) => {
    await openMenu(page, '');
    expect((await gk(page)).lang).toBe('zh');
    await page.keyboard.press('Digit5');
    await page.waitForFunction(() => window.__GK__?.screen === 'settings', undefined, { timeout: 5000 });
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => window.__GK__!.settingsRow === 'lang', undefined, { timeout: 2000 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GK__?.screen === 'settings' && window.__GK__.lang === 'en', undefined, { timeout: 3000 });
    expect((await gk(page)).settingsRow).toBe('lang');
    await page.reload();
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    expect((await gk(page)).lang).toBe('en');
  });
});
