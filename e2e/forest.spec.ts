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
  await page.evaluate(() => window.__GK__!.warp!(10500));
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
    expect(s.boss!.maxHp).toBe(180);
    expect(s.cameraX).toBe(10000);
  });

  test('貓頭鷹的圖跟著判定一起移動', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.waitForTimeout(2500);
    const owl = (await gk(page)).enemies!.find((e) => e.type === 'nightOwl')!;
    expect(owl.artX).not.toBeNull();
    expect(Math.abs(owl.artX! - owl.x)).toBeLessThanOrEqual(2);
    // 拍翅時圖會上下飄 3px,判定不動。
    expect(Math.abs(owl.artBottom! - (owl.y + 50))).toBeLessThanOrEqual(4);
  });

  test('進入關主戰時路上跟來的魔物都睡著', async ({ page }) => {
    await openForest(page);
    await page.evaluate(() => {
      window.__GK__!.warp!(9900);
      window.__GK__!.spawn!('nightBat', 10100);
      window.__GK__!.spawn!('alarmBug', 10200);
    });
    await page.evaluate(() => window.__GK__!.warp!(10500));
    await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
    await page.waitForTimeout(100);
    expect((await gk(page)).enemies!.map((e) => e.type)).toEqual(['nightOwl']);
  });

  test('一開始有 6 顆愛心', async ({ page }) => {
    await openForest(page);
    expect((await gk(page)).players![0].hearts).toBe(6);
  });

  test('雙人時貓頭鷹血量 270', async ({ page }) => {
    await openForest(page, './?mode=duo&test=1');
    await enterBoss(page);
    expect((await gk(page)).boss!.maxHp).toBe(270);
  });

  test('貓頭鷹會放羽毛,羽毛打到會扣愛心', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 4000 });
    await page.waitForFunction(() => window.__GK__!.players![0].hearts < 6, undefined, { timeout: 15000 });
  });

  test('打到 66% 以下進入第二階段並暫時無敵', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(63));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2);
    const s = await gk(page);
    expect(s.boss!.mode).toBe('angry');
    const hp = s.boss!.hp;
    await page.evaluate(() => window.__GK__!.hurtBoss!(15));
    await page.waitForTimeout(100);
    expect((await gk(page)).boss!.hp).toBe(hp);
  });

  test('階段轉換時打到 0 血直接倒下', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(177));
    await page.waitForFunction(() => window.__GK__!.boss!.mode === 'angry');
    await page.waitForFunction(() => window.__GK__!.boss!.mode !== 'angry', undefined, { timeout: 3000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(3));
    await page.waitForFunction(() => window.__GK__!.bossDefeated === true, undefined, { timeout: 2000 });
  });

  test('關主戰睡著重來,貓頭鷹血量回滿、羽毛與小怪清空', async ({ page }) => {
    await openForest(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(90));
    await hurtUntilDown(page);
    await page.waitForFunction(() => window.__GK__!.restarts === 1, undefined, { timeout: 3000 });
    let s = await gk(page);
    expect(s.checkpointX).toBe(9900);
    expect(s.enemyShots).toBe(0);
    expect(s.boss).toBeNull();
    await enterBoss(page);
    s = await gk(page);
    expect(s.boss!.hp).toBe(180);
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
    expect(text).toContain('找到寶箱 0 / 7');
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
    await page.evaluate(() => window.__GK__!.hurtBoss!(180));
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
      window.__GK__!.spawn!('alarmBug', 10300);
      window.__GK__!.spawn!('nightBat', 10500);
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
    expect((await gk(page)).players![0].hearts).toBe(6);
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

/** 主頁選單人(1)或雙人(2),再在選關畫面選 1-1。 */
async function pickMode(page: Page, key: 'Digit1' | 'Digit2'): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  await page.keyboard.press('Digit1');
}

const SHEEP_SAVE = JSON.stringify({ version: 1, weapons: { sheepGun: 2 } });

test.describe('出發前選武器', () => {
  test('背包沒有武器時直接進 1-1', async ({ page }) => {
    await openMenu(page, null);
    await pickMode(page, 'Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).level).toBe('w1-1');
  });

  test('存檔壞掉時也直接進 1-1', async ({ page }) => {
    await openMenu(page, '{bad');
    await pickMode(page, 'Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
  });

  test('背包裡有武器也不用選:直接進關卡,只帶哈欠泡泡(武器要在關卡裡開寶箱拿)', async ({ page }) => {
    await openMenu(page, SHEEP_SAVE);
    await pickMode(page, 'Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).players![0].weapon).toBe('yawnBubble');
  });

  test('雙人也直接進關卡,兩人都只帶哈欠泡泡', async ({ page }) => {
    await openMenu(page, SHEEP_SAVE);
    await pickMode(page, 'Digit2');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).players!.map((p) => p.weapon)).toEqual(['yawnBubble', 'yawnBubble']);
  });

  test('通關後再玩一次直接進關卡', async ({ page }) => {
    await page.addInitScript((s) => localStorage.setItem('gk.save.v1', s), SHEEP_SAVE);
    await openForest(page);
    await enterBoss(page);
    await defeatBoss(page);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range' && window.__GK__!.restarts === 0);
    expect((await gk(page)).players![0].weapon).toBe('yawnBubble');
  });
});
