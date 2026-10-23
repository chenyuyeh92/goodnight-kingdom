import { test, expect } from '@playwright/test';

// 解除 60fps 限制,模擬 120Hz/144Hz 螢幕:畫面格數多於物理步數。
test.use({
  launchOptions: {
    args: ['--disable-frame-rate-limit', '--disable-gpu-vsync'],
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  },
});

test('高更新率螢幕:按住 S 時一直維持蹲下,不會閃爍', async ({ page }) => {
  await page.goto('./?level=range&mode=single');
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

test('高更新率螢幕:站在移動平台上穩穩被載著走,平台照原本的路線來回', async ({ page }) => {
  await page.goto('./?level=lab&mode=single&test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  const m = await page.evaluate(() => window.__GK__!.gadgets!.movers[0]);
  await page.evaluate(([x, y]) => window.__GK__!.warp!(x, y), [m.x + 30, m.y - 2] as const);
  await page.waitForTimeout(300);
  const samples = await page.evaluate(
    () =>
      new Promise<{ d: number; mx: number }[]>((resolve) => {
        const out: { d: number; mx: number }[] = [];
        const tick = (): void => {
          const g = window.__GK__!;
          out.push({ d: g.players![0].y - g.gadgets!.movers[0].y, mx: g.gadgets!.movers[0].x });
          if (out.length < 240) requestAnimationFrame(tick);
          else resolve(out);
        };
        requestAnimationFrame(tick);
      }),
  );
  for (const s of samples) {
    expect(Math.abs(s.d)).toBeLessThanOrEqual(3);
    expect(s.mx).toBeGreaterThanOrEqual(398);
    expect(s.mx).toBeLessThanOrEqual(702);
  }
});
