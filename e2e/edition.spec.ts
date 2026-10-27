import { test, expect } from '@playwright/test';

// 網頁版是免費版:世界 1–3 可以玩,世界 4–10 要完整版(?test=1 會全部開放,這裡加 free=1 測免費版)。

const CLEARED_1_TO_3 = Object.fromEntries(['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3'].map((id) => [id, 100000]));

test.describe('免費版', () => {
  test('打完世界 1–3 後,世界 4 的關卡鎖著,寫著完整版', async ({ page }) => {
    await page.addInitScript((c) => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: c, story: { opening: true } })), CLEARED_1_TO_3);
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
    // 選關畫面開在玩到的世界;世界 4 整個鎖住。
    const s = await page.evaluate(() => window.__GK__!);
    expect(s.world).toBe(4);
    expect(s.levels!.every((l) => !l.unlocked)).toBe(true);
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__GK__!.screen)).toBe('level-select');
    // 世界 3 照常可以玩。
    await page.keyboard.press('KeyQ');
    await page.waitForFunction(() => window.__GK__?.world === 3);
    expect((await page.evaluate(() => window.__GK__!.levels!)).every((l) => l.unlocked)).toBe(true);
  });

  test('網址不能直接跳到世界 4 以後的關卡', async ({ page }) => {
    await page.goto('./?mode=single&test=1&free=1&level=w5-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect(await page.evaluate(() => window.__GK__!.level)).not.toBe('w5-1');
  });

  test('3-3 打完:結算畫面沒有「下一關」,按 3「買電腦版」到世界 4 選關', async ({ page }) => {
    await page.goto('./?mode=single&test=1&free=1&level=w3-3');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(99999));
    await page.waitForFunction(() => window.__GK__?.screen === 'complete', undefined, { timeout: 20000 });
    expect(await page.evaluate(() => window.__GK__!.fullTeaser)).toBe(true);
    // 網頁版開賣後(2026-10-27):按 3 是「買電腦版」,到世界 4 的選關(那裡有購買按鈕),不是下一關
    await page.keyboard.press('Digit3');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
    expect(await page.evaluate(() => window.__GK__!.world)).toBe(4);
  });
});

// App 版(iPhone、iPad):遊戲在 App 的 WebView 裡,App 放好 ReactNativeWebView;這裡用假的 App 代替。
const FAKE_APP = (): void => {
  const w = window as unknown as { __sent: unknown[]; ReactNativeWebView: { postMessage(d: string): void } };
  w.__sent = [];
  w.ReactNativeWebView = { postMessage: (d) => w.__sent.push(JSON.parse(d)) };
};
const sent = (page: import('@playwright/test').Page): Promise<{ type: string }[]> => page.evaluate(() => (window as unknown as { __sent: { type: string }[] }).__sent);
const fromApp = (page: import('@playwright/test').Page, m: unknown): Promise<void> => page.evaluate((x) => (window as unknown as { __gkNative(m: unknown): void }).__gkNative(x), m);

test.describe('App 版', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(FAKE_APP);
    await page.addInitScript((c) => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: c, story: { opening: true } })), CLEARED_1_TO_3);
  });

  const toWorld4 = async (page: import('@playwright/test').Page): Promise<void> => {
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
  };

  test('世界 4 有「解鎖完整版」:取消不會解鎖,買到後十個世界都打開,下次打開 App 也記得', async ({ page }) => {
    await toWorld4(page);
    expect((await sent(page)).map((m) => m.type)).toEqual(['ready']);
    await fromApp(page, { type: 'store', full: false, price: 'NT$100' });
    let s = await page.evaluate(() => window.__GK__!);
    expect(s.world).toBe(4);
    expect(s.store).toMatchObject({ shown: true, price: 'NT$100', full: false });

    await page.keyboard.press('KeyB');
    await page.keyboard.press('KeyB');
    expect((await sent(page)).map((m) => m.type)).toEqual(['ready', 'buy']);
    expect(await page.evaluate(() => window.__GK__!.store!.busy)).toBe(true);
    await fromApp(page, { type: 'purchase', result: 'cancelled', full: false });
    s = await page.evaluate(() => window.__GK__!);
    expect(s.store).toMatchObject({ busy: false, full: false });
    expect(s.store!.banner).toContain('沒有購買');
    expect(s.levels!.every((l) => !l.unlocked)).toBe(true);

    await page.keyboard.press('KeyB');
    await fromApp(page, { type: 'purchase', result: 'ok', full: true });
    await page.waitForFunction(() => window.__GK__?.levels?.[0].unlocked === true);
    s = await page.evaluate(() => window.__GK__!);
    expect(s.store).toMatchObject({ shown: false, full: true });
    expect(s.store!.banner).toContain('謝謝');
    expect(await page.evaluate(() => localStorage.getItem('gk.full.v1'))).toBe('1');

    // 重新打開 App(沒有網路,App Store 查不到):還是完整版。
    await page.reload();
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
    // 世界 4 的第一關打開(後面兩關照常要依序通關)。
    s = await page.evaluate(() => window.__GK__!);
    expect(s.world).toBe(4);
    expect(s.levels![0].unlocked).toBe(true);
    expect(s.store!.shown).toBe(false);
  });

  test('恢復購買:這個帳號沒買過時說明;買過的話直接打開', async ({ page }) => {
    await toWorld4(page);
    await page.keyboard.press('KeyR');
    expect((await sent(page)).map((m) => m.type)).toEqual(['ready', 'restore']);
    await fromApp(page, { type: 'purchase', result: 'nothingToRestore', full: false });
    expect(await page.evaluate(() => window.__GK__!.store!.banner)).toContain('還沒有買過');
    await page.keyboard.press('KeyR');
    await fromApp(page, { type: 'purchase', result: 'restored', full: true });
    await page.waitForFunction(() => window.__GK__?.levels?.[0].unlocked === true);
  });

  test('3-3 打完:結算畫面有「解鎖完整版」,按下去到世界 4 的購買按鈕', async ({ page }) => {
    await page.goto('./?mode=single&test=1&free=1&level=w3-3');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(99999));
    await page.waitForFunction(() => window.__GK__?.screen === 'complete', undefined, { timeout: 20000 });
    expect(await page.evaluate(() => window.__GK__!.buttons)).toContain('解鎖完整版(3)');
    await page.keyboard.press('Digit3');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
    const s = await page.evaluate(() => window.__GK__!);
    expect(s.world).toBe(4);
    expect(s.store!.shown).toBe(true);
  });

  test('設定裡的說明頁用 Safari 開公開網站;守衛圖片交給系統分享', async ({ page }) => {
    await page.addInitScript(() => {
      const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      localStorage.setItem('gk.guards.v1', JSON.stringify({ version: 1, guards: [{ id: 'g0', name: '小兔', png, createdAt: 1 }], selected: { A: 'g0', B: null } }));
    });
    const tap = async (x: number, y: number): Promise<void> => {
      const box = (await page.locator('canvas').boundingBox())!;
      await page.mouse.click(box.x + (x / 960) * box.width, box.y + (y / 540) * box.height);
    };
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit5');
    await page.waitForFunction(() => window.__GK__!.screen === 'settings');
    await tap(480, 515);
    await page.waitForFunction(() => (window as unknown as { __sent: { type: string }[] }).__sent.some((m) => m.type === 'openUrl'));
    expect((await sent(page)).find((m) => m.type === 'openUrl')).toEqual({ type: 'openUrl', url: 'https://chenyuyeh92.github.io/goodnight-kingdom/privacy.html' });

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GK__!.screen === 'mode-select');
    await page.keyboard.press('Digit3');
    await page.waitForFunction(() => window.__GK__!.screen === 'guard-room');
    await tap(470, 495);
    await page.waitForFunction(() => (window as unknown as { __sent: { type: string }[] }).__sent.some((m) => m.type === 'shareImage'));
    const share = (await sent(page)).find((m) => m.type === 'shareImage') as unknown as { dataUrl: string; name: string };
    expect(share.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(share.name).toMatch(/\.png$/);
  });
});
