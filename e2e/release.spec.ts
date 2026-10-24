import { test, expect, type Page } from '@playwright/test';

async function heartsShown(page: Page): Promise<{ full: number; empty: number }> {
  return page.evaluate(() => {
    const g = (window as unknown as { __PHASER_GAME__: { scene: { getScene(k: string): { children: { list: { texture?: { key: string }; visible: boolean }[] } } } } }).__PHASER_GAME__;
    const list = g.scene.getScene('TestRange').children.list.filter((o) => o.visible);
    return {
      full: list.filter((o) => o.texture?.key === 'gk-heart').length,
      empty: list.filter((o) => o.texture?.key === 'gk-heart-empty').length,
    };
  });
}

test.describe('上線準備', () => {
  for (const page of ['privacy.html', 'support.html', 'licenses.html']) {
    test(`說明頁 ${page} 存在、有聯絡方式、互相連結`, async ({ page: p, request }) => {
      const res = await request.get(`./${page}`);
      expect(res.status()).toBe(200);
      await p.goto(`./${page}`);
      for (const other of ['support.html', 'privacy.html', 'licenses.html']) await expect(p.locator(`header a[href="${other}"]`)).toHaveCount(1);
      if (page !== 'licenses.html') await expect(p.locator('body')).toContainText('chenyouye493@gmail.com');
    });
  }

  test('字型授權全文放在網站上', async ({ request }) => {
    const res = await request.get('./web/fonts/LICENSE-OFL.txt');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('SIL OPEN FONT LICENSE');
  });

  test('分享預覽:標題、說明、封面圖', async ({ page, request }) => {
    await page.goto('./?test=1');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /晚安王國/);
    const img = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(img).toContain('assets/ui/cover.png');
    expect((await request.get('./assets/ui/cover.png')).status()).toBe(200);
  });

  test('設定畫面的「隱私權政策」開新分頁', async ({ page, context }) => {
    await page.goto('./?test=1');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit5');
    await page.waitForFunction(() => window.__GK__!.screen === 'settings');
    const box = (await page.locator('canvas').boundingBox())!;
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.mouse.click(box.x + (480 / 960) * box.width, box.y + (515 / 540) * box.height),
    ]);
    await popup.waitForLoadState();
    expect(popup.url()).toContain('privacy.html');
  });

  test('HUD 愛心是畫出來的圖:10 顆,受傷後少一顆', async ({ page }) => {
    await page.goto('./?mode=single&test=1&level=range');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect(await heartsShown(page)).toEqual({ full: 10, empty: 0 });
    await page.evaluate(() => window.__GK__!.hurt!(0));
    await page.waitForTimeout(100);
    expect(await heartsShown(page)).toEqual({ full: 9, empty: 1 });
  });
});

test('設定畫面點「返回」回到主頁,不會被同位置的「設定」按鈕又帶回來', async ({ page }) => {
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  const box = (await page.locator('canvas').boundingBox())!;
  const at = (x: number, y: number) => ({ x: box.x + (x / 960) * box.width, y: box.y + (y / 540) * box.height });
  const settings = at(480, 474);
  await page.mouse.click(settings.x, settings.y);
  await page.waitForFunction(() => window.__GK__!.screen === 'settings');
  const back = at(480, 445);
  await page.mouse.move(back.x, back.y);
  await page.mouse.down();
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect((await page.evaluate(() => window.__GK__!.screen))).toBe('mode-select');
});

test('說明頁在手機寬度不會左右捲動', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  for (const p of ['privacy.html', 'support.html', 'licenses.html']) {
    await page.goto(`./${p}`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, p).toBeLessThanOrEqual(0);
  }
});
