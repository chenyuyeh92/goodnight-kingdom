import { test, expect, type Page } from '@playwright/test';

// 網頁版是免費試玩(2026-10-26 定案):世界 4 有「買 Windows 電腦版 NT$100」,開小商店的購買頁(新分頁)。
// 還沒開賣(SHOP_OPEN=false)時,要加 ?shop=1 才看得到;App 裡永遠不會出現(Apple 3.1.1)。網頁版本身不能解鎖完整版。

const SHOP = 'https://goodnight-shop.mozart-shop.workers.dev';
const CLEARED_1_TO_3 = Object.fromEntries(['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3'].map((id) => [id, 100000]));

const toWorld4 = async (page: Page, query: string): Promise<void> => {
  await page.goto(`./${query}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((c) => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: c, story: { opening: true } })), CLEARED_1_TO_3);
  await page.context().route(`${SHOP}/**`, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>shop</h1>' }));
});

test('還沒開賣:網頁版照舊寫「即將推出」,沒有購買按鈕', async ({ page }) => {
  await toWorld4(page, '');
  const s = await page.evaluate(() => window.__GK__!);
  expect(s.world).toBe(4);
  expect(s.webStore).toBeNull();
  expect(s.levels!.every((l) => !l.unlocked)).toBe(true);
});

test('?shop=1:世界 4 有「買 Windows 電腦版」,按了在新分頁開購買頁,關卡照樣鎖著', async ({ page }) => {
  await toWorld4(page, '?shop=1');
  const s = await page.evaluate(() => window.__GK__!);
  expect(s.webStore).toMatchObject({ shown: true });
  expect(s.webStore!.banner).toContain('Windows 電腦版');
  expect(s.levels!.every((l) => !l.unlocked)).toBe(true);
  const [shop] = await Promise.all([page.context().waitForEvent('page'), page.keyboard.press('KeyB')]);
  await shop.waitForLoadState();
  expect(shop.url()).toBe(`${SHOP}/buy?test=1`);
  expect(await page.evaluate(() => window.__GK__!.screen)).toBe('level-select');
});

test('舊的 #unlock= 網址不會解鎖', async ({ page }) => {
  await toWorld4(page, '?shop=1#unlock=ABCDEFGHJKLM');
  expect((await page.evaluate(() => window.__GK__!.levels!)).every((l) => !l.unlocked)).toBe(true);
});

test('App 裡:沒有買電腦版的按鈕', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { ReactNativeWebView: { postMessage(d: string): void } }).ReactNativeWebView = { postMessage: () => {} };
  });
  await toWorld4(page, '?shop=1');
  const s = await page.evaluate(() => window.__GK__!);
  expect(s.webStore).toBeNull();
  expect(s.store).toMatchObject({ shown: true });
});
