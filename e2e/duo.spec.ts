import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openRange(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
  await page.locator('canvas').click();
  await page.waitForTimeout(300);
}

test.describe('開場選單', () => {
  test('沒有 mode 時顯示開場選單', async ({ page }) => {
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await expect(page.locator('canvas')).toHaveCount(1);
  });

  test('按 2 進入雙人', async ({ page }) => {
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__?.screen === 'range');
    const s = await gk(page);
    expect(s.mode).toBe('duo');
    expect(s.players).toHaveLength(2);
  });

  test('點「單人」進入單人', async ({ page }) => {
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    const box = (await page.locator('canvas').boundingBox())!;
    await page.mouse.click(box.x + (340 / 960) * box.width, box.y + (330 / 540) * box.height);
    await page.waitForFunction(() => window.__GK__?.screen === 'range');
    const s = await gk(page);
    expect(s.mode).toBe('single');
    expect(s.players).toHaveLength(1);
  });
});


async function players(page: Page) {
  return page.evaluate(() => window.__GK__!.players!);
}

test.describe('雙人遊玩', () => {
  test.beforeEach(async ({ page }) => {
    await openRange(page, './?mode=duo');
  });

  test('兩人各自移動', async ({ page }) => {
    const p0 = await players(page);
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyD');
    const p1 = await players(page);
    expect(p1[0].x - p0[0].x).toBeGreaterThan(50);
    expect(p1[1].x).toBe(p0[1].x);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    expect((await players(page))[1].x - p1[1].x).toBeGreaterThan(50);
  });

  test('兩人都能射擊', async ({ page }) => {
    await page.keyboard.down('KeyC');
    await page.keyboard.down('Comma');
    // 單一角色連射間隔 150ms,所以 80ms 內有 2 發代表兩人各射了一發。
    await page.waitForTimeout(80);
    expect((await gk(page)).bullets).toBeGreaterThanOrEqual(2);
    await page.keyboard.up('KeyC');
    await page.keyboard.up('Comma');
  });

  test('一人往前衝時落後者不會被推出畫面', async ({ page }) => {
    const start = (await players(page))[0].x;
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000);
    await page.keyboard.up('ArrowRight');
    const s = await gk(page);
    expect(s.players![0].x).toBe(start);
    expect(s.players![0].x).toBeGreaterThanOrEqual(s.cameraX! + 16);
    expect(s.players![1].x).toBeLessThanOrEqual(s.cameraX! + 944);
  });
});
