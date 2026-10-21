import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openRange(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
  await page.waitForTimeout(300);
}

/** 對元素派發觸控用的 PointerEvent。 */
async function pointer(page: Page, selector: string, type: string, id: number, x: number, y: number): Promise<void> {
  await page.evaluate(
    ([sel, t, pid, px, py]) => {
      const el = document.querySelector(sel as string)!;
      el.dispatchEvent(
        new PointerEvent(t as string, {
          pointerId: pid as number,
          pointerType: 'touch',
          clientX: px as number,
          clientY: py as number,
          bubbles: true,
          cancelable: true,
          isPrimary: pid === 1,
        }),
      );
    },
    [selector, type, id, x, y] as const,
  );
}

test('桌機沒有 ?touch=1 時沒有觸控元素', async ({ page }) => {
  await openRange(page, './?mode=single');
  await expect(page.locator('#touch-controls')).toHaveCount(0);
  expect((await gk(page)).touch).toBe(false);
});

test.describe('觸控操作', () => {
  test.beforeEach(async ({ page }) => {
    await openRange(page, './?mode=single&touch=1');
  });

  test('拖曳搖桿往右,角色往右走', async ({ page }) => {
    const x0 = (await gk(page)).players![0].x;
    await pointer(page, '#touch-stick-zone', 'pointerdown', 1, 120, 400);
    await pointer(page, '#touch-stick-zone', 'pointermove', 1, 180, 400);
    await page.waitForTimeout(500);
    const x1 = (await gk(page)).players![0].x;
    expect(x1 - x0).toBeGreaterThan(50);
    await pointer(page, '#touch-stick-zone', 'pointerup', 1, 180, 400);
    await page.waitForTimeout(100);
    const x2 = (await gk(page)).players![0].x;
    await page.waitForTimeout(300);
    expect((await gk(page)).players![0].x).toBe(x2);
  });

  test('按住射擊按鈕會連射', async ({ page }) => {
    await pointer(page, '#touch-shoot', 'pointerdown', 2, 700, 400);
    await page.waitForFunction(() => (window.__GK__!.bullets ?? 0) > 0, undefined, { timeout: 1000 });
    await pointer(page, '#touch-shoot', 'pointerup', 2, 700, 400);
  });

  test('按跳躍按鈕會跳', async ({ page }) => {
    const y0 = (await gk(page)).players![0].y;
    await pointer(page, '#touch-jump', 'pointerdown', 3, 800, 400);
    await page.waitForFunction((y) => window.__GK__!.players![0].y < y - 20, y0, { timeout: 1000 });
    await pointer(page, '#touch-jump', 'pointerup', 3, 800, 400);
  });

  test('搖桿往上加射擊會往上打', async ({ page }) => {
    await pointer(page, '#touch-stick-zone', 'pointerdown', 1, 120, 400);
    await pointer(page, '#touch-stick-zone', 'pointermove', 1, 120, 340);
    await pointer(page, '#touch-shoot', 'pointerdown', 2, 700, 400);
    await page.waitForFunction(() => window.__GK__!.players![0].aim === 'up', undefined, { timeout: 1000 });
    await pointer(page, '#touch-shoot', 'pointerup', 2, 700, 400);
    await pointer(page, '#touch-stick-zone', 'pointerup', 1, 120, 340);
  });

  test('手指被取消(pointercancel)不會卡住', async ({ page }) => {
    await pointer(page, '#touch-stick-zone', 'pointerdown', 1, 120, 400);
    await pointer(page, '#touch-stick-zone', 'pointermove', 1, 180, 400);
    await page.waitForTimeout(300);
    await pointer(page, '#touch-stick-zone', 'pointercancel', 1, 180, 400);
    await page.waitForTimeout(100);
    const x = (await gk(page)).players![0].x;
    await page.waitForTimeout(300);
    expect((await gk(page)).players![0].x).toBe(x);
  });
});

test('開場選單在手機上點得到', async ({ page }) => {
  await page.goto('./?touch=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await expect(page.locator('#touch-controls')).toHaveCount(0);
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + (240 / 960) * box.width, box.y + (330 / 540) * box.height);
  await page.waitForFunction(() => window.__GK__?.screen === 'range');
});
