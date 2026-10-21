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

async function defeatBoss(page: Page): Promise<void> {
  await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
  await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 5000 });
}

test.describe('通關結算', () => {
  test('打倒貓頭鷹後出現結算,按 2 回到選單', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await defeatBoss(page);
    const text = (await gk(page)).summary!.join('\n');
    expect(text).toContain('通關時間');
    expect(text).toContain('找到寶箱 0 / 3');
    expect(text).toContain('這次拿到:沒有');
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__!.screen === 'mode-select');
  });

  test('再玩一次會從頭開始,模式不變', async ({ page }) => {
    await openForest(page, './?mode=duo&test=1');
    await enterBoss(page);
    await defeatBoss(page);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    const s = await gk(page);
    expect(s.mode).toBe('duo');
    expect(s.checkpointX).toBe(150);
    expect(s.restarts).toBe(0);
    expect(s.boss).toBeNull();
  });

  test('統計跨睡著重來累積', async ({ page }) => {
    await openForest(page);
    await page.evaluate(() => {
      window.__GK__!.spawn!('alarmBug', 600);
      window.__GK__!.defeatAll!();
    });
    await hurtUntilDown(page);
    await page.waitForFunction(() => window.__GK__!.restarts === 1, undefined, { timeout: 3000 });
    await enterBoss(page);
    await defeatBoss(page);
    const text = (await gk(page)).summary!.join('\n');
    expect(text).toContain('睡著重來 1 次');
    expect(text).toContain('哄睡魔物 2 隻');
  });

  test('最後一擊時全員睡著,還是進結算而不是重來', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await hurtUntilDown(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
    await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 5000 });
    expect((await gk(page)).summary!.join('\n')).toContain('睡著重來 0 次');
  });

  test('一擊打到 0 血直接倒下,不進入暴躁', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(60));
    await page.waitForFunction(() => window.__GK__!.bossDefeated === true);
    const s = await gk(page);
    expect(s.bossDefeated).toBe(true);
    expect(s.boss).toBeNull();
  });

  test('打倒貓頭鷹時場上魔物與羽毛全部消失', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 4000 });
    await page.evaluate(() => {
      window.__GK__!.spawn!('alarmBug', 4800);
      window.__GK__!.spawn!('nightBat', 5000);
      window.__GK__!.hurtBoss!(9999);
    });
    await page.waitForFunction(() => window.__GK__!.bossDefeated === true);
    const s = await gk(page);
    expect(s.enemies).toHaveLength(0);
    expect(s.enemyShots).toBe(0);
  });

  test('打倒貓頭鷹後不會再受傷', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) window.__GK__!.hurt!(0);
    });
    expect((await gk(page)).players![0].hearts).toBe(3);
    await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 5000 });
  });
});

async function openMenu(page: Page, save: string | null): Promise<void> {
  await page.addInitScript((s) => {
    if (s === null) localStorage.removeItem('gk.save.v1');
    else localStorage.setItem('gk.save.v1', s);
  }, save);
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

const SHEEP_SAVE = JSON.stringify({ version: 1, weapons: { sheepGun: 2 } });

test.describe('出發前選武器', () => {
  test('背包沒有武器時直接進森林', async ({ page }) => {
    await openMenu(page, null);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).level).toBe('forest');
  });

  test('存檔壞掉時也直接進森林', async ({ page }) => {
    await openMenu(page, '{bad');
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
  });

  test('單人選武器後帶著上場', async ({ page }) => {
    await openMenu(page, SHEEP_SAVE);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'loadout');
    const s = await gk(page);
    expect(s.loadoutFor).toBe('A');
    expect(s.loadoutOptions![0]).toContain('哈欠泡泡');
    expect(s.loadoutOptions![1]).toContain('數羊機槍');
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    const p = (await gk(page)).players![0];
    expect(p.weapon).toBe('sheepGun');
    expect(p.ammo).toBe(150);
  });

  test('雙人兩人可以選同一把', async ({ page }) => {
    await openMenu(page, SHEEP_SAVE);
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__!.screen === 'loadout');
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__!.loadoutFor === 'B');
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    const ps = (await gk(page)).players!;
    expect(ps.map((p) => [p.weapon, p.ammo])).toEqual([
      ['sheepGun', 150],
      ['sheepGun', 150],
    ]);
  });

  test('選只帶哈欠泡泡', async ({ page }) => {
    await openMenu(page, SHEEP_SAVE);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'loadout');
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).players![0].weapon).toBe('yawnBubble');
  });

  test('用上下鍵移動再確認', async ({ page }) => {
    await openMenu(page, SHEEP_SAVE);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'loadout');
    await page.keyboard.press('KeyS');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).players![0].weapon).toBe('sheepGun');
  });

  test('通關後再玩一次會先選武器', async ({ page }) => {
    await page.addInitScript((s) => localStorage.setItem('gk.save.v1', s), SHEEP_SAVE);
    await openForest(page);
    await enterBoss(page);
    await defeatBoss(page);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'loadout');
  });
});
