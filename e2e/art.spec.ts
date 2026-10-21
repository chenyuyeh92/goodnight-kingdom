import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function playToComplete(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
  await page.evaluate(() => window.__GK__!.warp!(10500));
  await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
  await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
  await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 5000 });
}

test('美術素材全部載入', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?mode=single&test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
  const art = (await gk(page)).art!;
  expect(art.missing).toEqual([]);
  expect(art.loaded).toBeGreaterThanOrEqual(31);
  expect(errors).toEqual([]);
});

test('?noart=1 不載入圖片,用色塊照樣玩到通關', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?mode=single&test=1&noart=1');
  await playToComplete(page);
  expect(errors).toEqual([]);
});

test('有圖片載入失敗時照樣能玩,記下缺的圖', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/assets/enemies/night-owl-boss*.png', (r) => r.abort());
  await page.route('**/assets/characters/*.png', (r) => r.abort());
  await page.goto('./?mode=single&test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
  expect((await gk(page)).art!.missing).toContain('owl');
  await playToComplete(page);
  expect(errors).toEqual([]);
});
