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
    // 已經看過開場(這裡測選單,不測故事)。
    await page.addInitScript(() => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, story: { opening: true } })));
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__?.onlineChoice === true);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range');
    const s = await gk(page);
    expect(s.mode).toBe('duo');
    expect(s.players).toHaveLength(2);
  });

  test('點「開始遊戲」進入單人', async ({ page }) => {
    // 已經看過開場(這裡測選單,不測故事)。
    await page.addInitScript(() => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, story: { opening: true } })));
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    const box = (await page.locator('canvas').boundingBox())!;
    await page.mouse.click(box.x + (480 / 960) * box.width, box.y + (250 / 540) * box.height);
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
    await page.mouse.click(box.x + (200 / 960) * box.width, box.y + (290 / 540) * box.height);
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
    await openRange(page, './?level=range&mode=duo');
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

/** 每 100ms 打一次直到睡著(無敵中的攻擊會被規則擋掉),不依賴真實時間與遊戲時間一致。 */
async function hurtUntilDown(page: Page, indexes: number[]): Promise<void> {
  const deadline = Date.now() + 20000;
  while (!(await players(page)).every((p, i) => !indexes.includes(i) || p.down)) {
    if (Date.now() > deadline) throw new Error('hurtUntilDown 逾時');
    await page.evaluate((ids) => ids.forEach((i) => window.__GK__!.hurt!(i)), indexes);
    await page.waitForTimeout(100);
  }
}

/** 按住前進鍵並每 350ms 跳一下(跳過荊棘),直到條件成立。 */
async function hopRight(page: Page, moveKeys: string[], jumpKeys: string[], until: (s: Awaited<ReturnType<typeof gk>>) => boolean): Promise<void> {
  for (const k of moveKeys) await page.keyboard.down(k);
  const deadline = Date.now() + 20000;
  while (!until(await gk(page))) {
    if (Date.now() > deadline) throw new Error('hopRight 逾時');
    for (const k of jumpKeys) await page.keyboard.down(k);
    await page.waitForTimeout(60);
    for (const k of jumpKeys) await page.keyboard.up(k);
    await page.waitForTimeout(290);
  }
  for (const k of moveKeys) await page.keyboard.up(k);
}

test.describe('愛心、睡著與重來', () => {
  test('碰到荊棘會扣愛心', async ({ page }) => {
    await openRange(page, './?level=range&mode=single');
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.players![0].hearts === 9, undefined, { timeout: 6000 });
    await page.keyboard.up('KeyD');
  });

  test('雙人:A 睡著,3 秒後在 B 身邊復活', async ({ page }) => {
    await openRange(page, './?level=range&mode=duo&test=1');
    await hurtUntilDown(page, [0]);
    expect((await players(page))[0].down).toBe(true);
    const x0 = (await players(page))[0].x;
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyD');
    expect((await players(page))[0].x).toBe(x0);
    await page.waitForFunction(() => window.__GK__!.players![0].down === false, undefined, { timeout: 4500 });
    const p = await players(page);
    expect(p[0].hearts).toBe(10);
    expect(p[0].invuln).toBe(true);
    expect(Math.abs(p[0].x - p[1].x)).toBeLessThanOrEqual(1);
  });

  test('雙人:在低矮通道裡復活不會卡住', async ({ page }) => {
    await openRange(page, './?level=range&mode=duo&test=1');
    await hopRight(page, ['KeyD', 'ArrowRight'], ['KeyV', 'Period'], (s) => s.players![1].x > 1270);
    await page.waitForTimeout(500);
    await page.keyboard.down('ArrowDown');
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => window.__GK__!.players![1].x > 1360, undefined, { timeout: 5000 });
    await page.keyboard.up('ArrowRight');
    await hurtUntilDown(page, [0]);
    await page.waitForFunction(() => window.__GK__!.players![0].down === false, undefined, { timeout: 4500 });
    await page.waitForTimeout(1000);
    const a = (await players(page))[0];
    expect([480, 380]).toContain(Math.round(a.y));
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyD');
    expect((await players(page))[0].x).not.toBe(a.x);
    await page.keyboard.up('ArrowDown');
  });

  test('雙人:兩人都睡著就從檢查點重來', async ({ page }) => {
    await openRange(page, './?level=range&mode=duo&test=1');
    await hurtUntilDown(page, [0, 1]);
    await page.waitForFunction(() => window.__GK__!.restarts === 1, undefined, { timeout: 3000 });
    const s = await gk(page);
    expect(s.checkpointX).toBe(150);
    for (const p of s.players!) {
      expect(p.hearts).toBe(10);
      expect(p.down).toBe(false);
    }
  });

  test('單人:睡著會從到達過的檢查點重來,且只重來一次', async ({ page }) => {
    await openRange(page, './?level=range&mode=single&test=1');
    await hopRight(page, ['KeyD'], ['KeyV'], (s) => s.players![0].x > 1250);
    await page.waitForTimeout(500);
    await hurtUntilDown(page, [0]);
    await page.waitForFunction(() => window.__GK__!.restarts === 1, undefined, { timeout: 3000 });
    await page.waitForTimeout(300);
    const s = await gk(page);
    expect(s.checkpointX).toBe(1200);
    expect(Math.abs(s.players![0].x - 1200)).toBeLessThanOrEqual(5);
    expect(s.cameraX).toBe(816);
    await page.waitForTimeout(2000);
    expect((await gk(page)).restarts).toBe(1);
  });
});

test('雙人:落後的人睡著時鏡頭不會瞬間跳動', async ({ page }) => {
  await openRange(page, './?level=range&mode=duo&test=1');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ArrowRight');
  // 先打到剩一顆、無敵結束,再在記錄開始的同一格打最後一下。
  const deadline = Date.now() + 15000;
  for (;;) {
    const a = (await players(page))[0];
    if (a.hearts === 1 && !a.invuln) break;
    if (Date.now() > deadline) throw new Error('準備逾時');
    if (a.hearts > 1) await page.evaluate(() => window.__GK__!.hurt!(0));
    await page.waitForTimeout(100);
  }
  const jumps = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const out: number[] = [];
        let prev = window.__GK__!.cameraX!;
        window.__GK__!.hurt!(0);
        const tick = (): void => {
          const now = window.__GK__!.cameraX!;
          out.push(now - prev);
          prev = now;
          if (out.length < 90) requestAnimationFrame(tick);
          else resolve(out);
        };
        requestAnimationFrame(tick);
      }),
  );
  // 角色最快約 230px/s;一格(最多 50ms)不該超過 30px。
  expect(Math.max(...jumps)).toBeLessThanOrEqual(30);
});
