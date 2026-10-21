import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openForest(page: Page, path = './?mode=single&test=1'): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
  await page.waitForTimeout(300);
}

async function enterBoss(page: Page): Promise<void> {
  await page.evaluate(() => window.__GK__!.warp!(5100));
  await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
}

async function hurtUntilDown(page: Page, i = 0): Promise<void> {
  const deadline = Date.now() + 20000;
  while (!(await gk(page)).players![i].down) {
    if (Date.now() > deadline) throw new Error('hurtUntilDown 逾時');
    await page.evaluate((n) => window.__GK__!.hurt!(n), i);
    await page.waitForTimeout(100);
  }
}

test.describe('關主戰', () => {
  test('走到關主區會鎖鏡頭並出現貓頭鷹', async ({ page }) => {
    await openForest(page);
    expect((await gk(page)).level).toBe('forest');
    await enterBoss(page);
    const s = await gk(page);
    expect(s.boss!.maxHp).toBe(60);
    expect(s.cameraX).toBe(4640);
  });

  test('雙人時貓頭鷹血量 90', async ({ page }) => {
    await openForest(page, './?mode=duo&test=1');
    await enterBoss(page);
    expect((await gk(page)).boss!.maxHp).toBe(90);
  });

  test('貓頭鷹會放羽毛,羽毛打到會扣愛心', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 4000 });
    await page.waitForFunction(() => window.__GK__!.players![0].hearts < 3, undefined, { timeout: 15000 });
  });

  test('打到 66% 以下進入第二階段並暫時無敵', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(21));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2);
    const s = await gk(page);
    expect(s.boss!.mode).toBe('angry');
    const hp = s.boss!.hp;
    await page.evaluate(() => window.__GK__!.hurtBoss!(5));
    await page.waitForTimeout(100);
    expect((await gk(page)).boss!.hp).toBe(hp);
  });

  test('階段轉換時打到 0 血直接倒下', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(59));
    await page.waitForFunction(() => window.__GK__!.boss!.mode === 'angry');
    await page.waitForFunction(() => window.__GK__!.boss!.mode !== 'angry', undefined, { timeout: 3000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(1));
    await page.waitForFunction(() => window.__GK__!.bossDefeated === true, undefined, { timeout: 2000 });
  });

  test('關主戰睡著重來,貓頭鷹血量回滿、羽毛與小怪清空', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(30));
    await hurtUntilDown(page);
    await page.waitForFunction(() => window.__GK__!.restarts === 1, undefined, { timeout: 3000 });
    let s = await gk(page);
    expect(s.checkpointX).toBe(4500);
    expect(s.enemyShots).toBe(0);
    expect(s.boss).toBeNull();
    await enterBoss(page);
    s = await gk(page);
    expect(s.boss!.hp).toBe(60);
  });
});
