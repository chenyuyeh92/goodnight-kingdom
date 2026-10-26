import { test, expect, type Page } from '@playwright/test';

// 網頁版的完整版(綠界,2026-10-26):世界 4 有「解鎖完整版 NT$100」(到小商店)和「輸入解鎖碼」。
// 還沒開賣(SHOP_OPEN=false)時,要加 ?shop=1 才看得到;App 裡永遠不會出現(Apple 3.1.1)。
// 小商店用 page.route 假裝,不會真的連到 Cloudflare。

const SHOP = 'https://goodnight-shop.mozart-shop.workers.dev';
const CLEARED_1_TO_3 = Object.fromEntries(['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3'].map((id) => [id, 100000]));

const fakeShop = async (page: Page, answer: { ok: boolean; stage?: boolean; error?: string }): Promise<string[]> => {
  const asked: string[] = [];
  await page.route(`${SHOP}/api/redeem`, async (route) => {
    asked.push(JSON.parse(route.request().postData() ?? '{}').code);
    await route.fulfill({ json: answer, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.route(`${SHOP}/buy**`, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>shop</h1>' }));
  return asked;
};

const toWorld4 = async (page: Page, query: string): Promise<void> => {
  await page.goto(`./${query}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((c) => {
    if (!localStorage.getItem('gk.save.v1')) localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: c, story: { opening: true } }));
  }, CLEARED_1_TO_3);
});

test('還沒開賣:網頁版照舊寫「即將推出」,沒有購買按鈕', async ({ page }) => {
  await toWorld4(page, '');
  const s = await page.evaluate(() => window.__GK__!);
  expect(s.world).toBe(4);
  expect(s.webStore).toBeNull();
  expect(s.levels!.every((l) => !l.unlocked)).toBe(true);
});

test('「解鎖完整版」到小商店的購買頁', async ({ page }) => {
  await fakeShop(page, { ok: true, stage: false });
  await toWorld4(page, '?shop=1');
  const s = await page.evaluate(() => window.__GK__!);
  expect(s.webStore).toMatchObject({ shown: true, full: false });
  expect(s.webStore!.banner).toContain('買一次就能全部玩');
  await page.keyboard.press('KeyB');
  await page.waitForURL(`${SHOP}/buy**`);
  expect(page.url()).toBe(`${SHOP}/buy?test=1`);
});

test('「輸入解鎖碼」:碼對了十個世界都打開,重新打開也記得', async ({ page }) => {
  const asked = await fakeShop(page, { ok: true, stage: false });
  await toWorld4(page, '?shop=1');
  page.once('dialog', (d) => void d.accept('abcd-efgh-jklm'));
  await page.keyboard.press('KeyR');
  await page.waitForFunction(() => window.__GK__?.webStore?.full === true && window.__GK__.levels![0].unlocked);
  expect(asked).toEqual(['ABCDEFGHJKLM']);
  expect(await page.evaluate(() => window.__GK__!.webStore!.banner)).toContain('謝謝你');
  // 重新打開(沒有 ?shop=1 也一樣):這台裝置記得(世界 4 的第一關打開;後面兩關照常要依序通關)
  await toWorld4(page, '');
  expect((await page.evaluate(() => window.__GK__!.levels!))[0].unlocked).toBe(true);
});

test('「輸入解鎖碼」:碼不對就說找不到,不會打開', async ({ page }) => {
  await fakeShop(page, { ok: false, error: 'notfound' });
  await toWorld4(page, '?shop=1');
  page.once('dialog', (d) => void d.accept('ABCD-EFGH-JKLM'));
  await page.keyboard.press('KeyR');
  await page.waitForFunction(() => window.__GK__?.webStore?.banner.includes('找不到'));
  expect((await page.evaluate(() => window.__GK__!.levels!)).every((l) => !l.unlocked)).toBe(true);
});

test('從付款完成頁回來(#unlock=):自動解鎖、跳出說明、網址拿掉解鎖碼', async ({ page }) => {
  const asked = await fakeShop(page, { ok: true, stage: false });
  await page.goto('./#unlock=ABCDEFGHJKLM');
  await expect(page.getByRole('status')).toContainText('完整版打開了');
  expect(page.url()).not.toContain('unlock');
  expect(asked).toEqual(['ABCDEFGHJKLM']);
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
  expect((await page.evaluate(() => window.__GK__!.levels!))[0].unlocked).toBe(true);
});

test('測試環境買的碼:這次打開有效,重新整理就恢復免費版', async ({ page }) => {
  await fakeShop(page, { ok: true, stage: true });
  await page.goto('./#unlock=ABCDEFGHJKLM');
  await expect(page.getByRole('status')).toContainText('測試解鎖');
  expect(await page.evaluate(() => localStorage.getItem('gk.webfull.v1'))).toBeNull();
  await toWorld4(page, '');
  expect((await page.evaluate(() => window.__GK__!.levels!)).every((l) => !l.unlocked)).toBe(true);
});

test('App 裡:沒有綠界的按鈕,網頁版的解鎖碼也不算', async ({ page }) => {
  const asked = await fakeShop(page, { ok: true, stage: false });
  await page.addInitScript(() => {
    const w = window as unknown as { ReactNativeWebView: { postMessage(d: string): void } };
    w.ReactNativeWebView = { postMessage: () => {} };
    localStorage.setItem('gk.webfull.v1', JSON.stringify({ code: 'ABCDEFGHJKLM' }));
  });
  await page.goto('./?shop=1#unlock=ABCDEFGHJKLM');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
  const s = await page.evaluate(() => window.__GK__!);
  expect(s.webStore).toBeNull();
  expect(s.store).toMatchObject({ shown: true });
  expect(s.levels!.every((l) => !l.unlocked)).toBe(true);
  expect(asked).toEqual([]);
  expect(await page.getByRole('status').count()).toBe(0);
});
