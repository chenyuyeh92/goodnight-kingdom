import { test, expect } from '@playwright/test';

// 解除 60fps 限制,模擬 120Hz/144Hz 螢幕:畫面格數多於物理步數。
test.use({
  launchOptions: {
    args: ['--disable-frame-rate-limit', '--disable-gpu-vsync'],
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  },
});

test('高更新率螢幕:按住 S 時一直維持蹲下,不會閃爍', async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(() => window.__GK__?.player !== undefined);
  await page.locator('canvas').click();
  await page.waitForTimeout(300);
  for (let round = 0; round < 6; round++) {
    await page.keyboard.down('KeyS');
    await page.waitForFunction(() => window.__GK__!.player!.crouching);
    const samples = await page.evaluate(
      () =>
        new Promise<boolean[]>((resolve) => {
          const out: boolean[] = [];
          const tick = (): void => {
            out.push(window.__GK__!.player!.crouching);
            if (out.length < 60) requestAnimationFrame(tick);
            else resolve(out);
          };
          requestAnimationFrame(tick);
        }),
    );
    await page.keyboard.up('KeyS');
    await page.waitForTimeout(150);
    expect(samples.map(Number).join('')).toBe('1'.repeat(60));
  }
});
