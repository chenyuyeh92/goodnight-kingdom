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
