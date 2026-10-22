import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13 landscape'], browserName: 'chromium', defaultBrowserType: 'chromium' });

test('手機上雙擊、連點不會把畫面放大', async ({ page }) => {
  await page.goto('./?test=1&touch=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  for (let i = 0; i < 3; i++) {
    await page.touchscreen.tap(700, 300);
    await page.waitForTimeout(80);
    await page.touchscreen.tap(700, 300);
    await page.waitForTimeout(400);
  }
  expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);
  const meta = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(meta).toContain('maximum-scale=1');
});
