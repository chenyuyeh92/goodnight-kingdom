import { test, expect, type Page } from '@playwright/test';

async function openGame(page: Page, path = './'): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(path);
  await page.waitForFunction(() => window.__GK__?.ready === true);
  return errors;
}

test('遊戲啟動且沒有錯誤', async ({ page }) => {
  const errors = await openGame(page);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

async function player(page: Page) {
  return page.evaluate(() => window.__GK__!.player!);
}

async function hold(page: Page, code: string, ms: number): Promise<void> {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
}

test.describe('測試靶場操作', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    await page.waitForFunction(() => window.__GK__?.player !== undefined, undefined, { timeout: 5000 });
    await page.locator('canvas').click();
    await page.waitForTimeout(300);
  });

  test('按 D 角色往右走', async ({ page }) => {
    const x0 = (await player(page)).x;
    await hold(page, 'KeyD', 500);
    expect((await player(page)).x - x0).toBeGreaterThan(50);
  });

  test('按 G 會跳起來', async ({ page }) => {
    const y0 = (await player(page)).y;
    await page.keyboard.down('KeyG');
    await page.waitForFunction((y) => window.__GK__!.player!.y < y - 20, y0, { timeout: 1000 });
    await page.keyboard.up('KeyG');
  });

  test('按 S 會蹲下', async ({ page }) => {
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(100);
    expect((await player(page)).crouching).toBe(true);
    await page.keyboard.up('KeyS');
  });

  test('按 F 會射出子彈', async ({ page }) => {
    await page.keyboard.down('KeyF');
    await page.waitForFunction(() => (window.__GK__!.bullets ?? 0) > 0, undefined, { timeout: 1000 });
    await page.keyboard.up('KeyF');
  });

  test('按住 W 時瞄準往上', async ({ page }) => {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(100);
    expect((await player(page)).aim).toBe('up');
    await page.keyboard.up('KeyW');
  });

  test('打中練習靶', async ({ page }) => {
    await page.keyboard.down('KeyF');
    await page.waitForFunction(() => (window.__GK__!.targetsHit ?? 0) > 0, undefined, { timeout: 3000 });
    await page.keyboard.up('KeyF');
  });

  test('方向鍵也能操控', async ({ page }) => {
    const x0 = (await player(page)).x;
    await hold(page, 'ArrowRight', 500);
    expect((await player(page)).x - x0).toBeGreaterThan(50);
  });
});

test.describe('手感調整面板', () => {
  test('沒有 ?tune=1 時沒有面板', async ({ page }) => {
    await openGame(page);
    await expect(page.locator('#tuning-panel')).toHaveCount(0);
  });

  test('?tune=1 時有面板,改走路速度會生效', async ({ page }) => {
    await openGame(page, './?tune=1');
    await expect(page.locator('#tuning-panel')).toHaveCount(1);
    await page.locator('#tuning-panel input[type=number][data-key=walkSpeed]').fill('400');
    await page.locator('#tuning-panel input[type=number][data-key=walkSpeed]').dispatchEvent('change');
    await page.locator('canvas').click();
    await page.waitForTimeout(300);
    const x0 = (await player(page)).x;
    await hold(page, 'KeyD', 500);
    expect((await player(page)).x - x0).toBeGreaterThan(120);
  });

  test('按「重設」回到預設值', async ({ page }) => {
    await openGame(page, './?tune=1');
    const field = page.locator('#tuning-panel input[type=number][data-key=walkSpeed]');
    await field.fill('300');
    await field.dispatchEvent('change');
    await page.locator('#tuning-panel button', { hasText: '重設' }).click();
    await expect(field).toHaveValue('180');
  });

  test('在面板輸入時角色不會移動', async ({ page }) => {
    await openGame(page, './?tune=1');
    await page.waitForFunction(() => window.__GK__?.player !== undefined);
    const field = page.locator('#tuning-panel input[type=number][data-key=walkSpeed]');
    await field.focus();
    const x0 = (await player(page)).x;
    await hold(page, 'ArrowRight', 400);
    expect((await player(page)).x).toBe(x0);
  });
});
