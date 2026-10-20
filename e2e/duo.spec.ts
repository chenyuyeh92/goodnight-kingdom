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

