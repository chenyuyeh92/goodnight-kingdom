import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openRoom(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('kept')) {
      localStorage.removeItem('gk.guards.v1');
      sessionStorage.setItem('kept', '1');
    }
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit3');
  await page.waitForFunction(() => window.__GK__!.screen === 'guard-room');
}

async function tapGame(page: Page, x: number, y: number): Promise<void> {
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + (x / 960) * box.width, box.y + (y / 540) * box.height);
}

async function scribble(page: Page): Promise<void> {
  const box = (await page.locator('#draw-canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 8 });
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.8, { steps: 8 });
  await page.mouse.up();
}

test.describe('畫你的守衛', () => {
  test('空白不能存', async ({ page }) => {
    await openRoom(page);
    await tapGame(page, 295, 495);
    await expect(page.locator('#draw-studio')).toHaveCount(1);
    await page.click('#draw-save');
    await expect(page.locator('#draw-status')).toContainText('還沒畫');
    await page.click('#draw-cancel');
    await expect(page.locator('#draw-studio')).toHaveCount(0);
  });

  test('畫幾筆、取名、存起來,自動選給 A,進關卡用自己畫的守衛', async ({ page }) => {
    await openRoom(page);
    await tapGame(page, 295, 495);
    await scribble(page);
    await page.fill('#draw-name', '小勇');
    await page.click('#draw-save');
    await expect(page.locator('#draw-studio')).toHaveCount(0);
    await page.waitForFunction(() => window.__GK__!.screen === 'guard-room' && (window.__GK__!.guardList ?? []).length === 1);
    const s = await gk(page);
    expect(s.guardList![0].name).toBe('小勇');
    expect(s.guardSelected!.A).toBe(s.guardList![0].id);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GK__!.screen === 'mode-select');
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).players![0].art).toBe(`guard-${s.guardList![0].id}`);
  });

  test('重新整理後還在,遊戲直接用選好的守衛', async ({ page }) => {
    await openRoom(page);
    await tapGame(page, 110, 495);
    await scribble(page);
    await page.click('#draw-save');
    await page.waitForFunction(() => (window.__GK__!.guardList ?? []).length === 1);
    const id = (await gk(page)).guardSelected!.A;
    await page.goto('./?mode=single&test=1&level=w1-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect((await gk(page)).players![0].art).toBe(`guard-${id}`);
  });

  test('雙人:A 用自己畫的、B 用小綿羊', async ({ page }) => {
    await openRoom(page);
    await tapGame(page, 295, 495);
    await scribble(page);
    await page.click('#draw-save');
    await page.waitForFunction(() => (window.__GK__!.guardList ?? []).length === 1);
    const id = (await gk(page)).guardSelected!.A;
    await page.goto('./?mode=duo&test=1&level=w1-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    const ps = (await gk(page)).players!;
    expect(ps.map((p) => p.art)).toEqual([`guard-${id}`, 'guard']);
  });

  test('下載圖片會存成 PNG', async ({ page }) => {
    await openRoom(page);
    await tapGame(page, 295, 495);
    await scribble(page);
    await page.fill('#draw-name', '下載測試');
    await page.click('#draw-save');
    await page.waitForFunction(() => (window.__GK__!.guardList ?? []).length === 1);
    const [download] = await Promise.all([page.waitForEvent('download'), tapGame(page, 470, 495)]);
    // 檔名(中文)由 guardFileName 決定並有單元測試;測試環境的 Chromium 會把中文檔名換成 download,這裡檢查內容是 PNG。
    const { readFileSync } = await import('node:fs');
    const bytes = readFileSync((await download.path())!);
    expect([...bytes.subarray(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
  });

  test('刪除要按兩次,刪掉後 A 改回小綿羊', async ({ page }) => {
    await openRoom(page);
    await tapGame(page, 295, 495);
    await scribble(page);
    await page.click('#draw-save');
    await page.waitForFunction(() => (window.__GK__!.guardList ?? []).length === 1);
    await tapGame(page, 640, 495);
    await page.waitForTimeout(200);
    expect((await gk(page)).guardList).toHaveLength(1);
    await tapGame(page, 640, 495);
    await page.waitForFunction(() => (window.__GK__!.guardList ?? []).length === 0);
    expect((await gk(page)).guardSelected!.A).toBeNull();
  });

  test('第 9 個存不進去並提示', async ({ page }) => {
    await page.addInitScript(() => {
      const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const guards = Array.from({ length: 8 }, (_, i) => ({ id: `g${i}`, name: `g${i}`, png, createdAt: i }));
      localStorage.setItem('gk.guards.v1', JSON.stringify({ version: 1, guards, selected: { A: null, B: null } }));
    });
    await page.goto('./?test=1');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit3');
    await page.waitForFunction(() => (window.__GK__!.guardList ?? []).length === 8);
    await tapGame(page, 295, 495);
    await scribble(page);
    await page.click('#draw-save');
    await expect(page.locator('#draw-status')).toContainText('最多存 8 個');
  });
});
