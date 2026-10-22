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

test('世界 2–4 的魔物用美術的動畫格(禿鷹拍翅、企鵝游動),關主依階段換一套', async ({ page }) => {
  await page.goto('./?mode=single&test=1&level=w2-2');
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  await page.evaluate(() => window.__GK__!.spawn!('vulture', 700, 300));
  const keys = new Set<string>();
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(80);
    for (const e of await page.evaluate(() => window.__GK__!.enemies!)) if (e.type === 'vulture') keys.add(e.artKey ?? '');
  }
  expect([...keys].filter((k) => k.startsWith('w2-insomnia-vulture-flap-')).length).toBeGreaterThanOrEqual(3);
});

test('網頁載入的圖都是 WebP(不下載美術原檔 PNG)', async ({ page }) => {
  const png: string[] = [];
  page.on('request', (r) => {
    if (/\.png(\?|$)/.test(r.url()) && !r.url().includes('pajama-outline')) png.push(r.url());
  });
  await page.goto('./?mode=single&test=1&level=w3-1');
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  expect(png).toEqual([]);
});
