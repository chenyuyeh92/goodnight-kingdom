import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

/** 靶場 2650:右邊 2650–3150 是空地(2500 有練習靶、2380 有荊棘、1300 有低矮天花板)。 */
async function open(page: Page, weapon: string): Promise<void> {
  await page.goto('./?level=range&mode=single&test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
  await page.locator('canvas').click();
  await page.evaluate(() => window.__GK__!.warp!(2650));
  await page.waitForTimeout(300);
  await page.evaluate((w) => window.__GK__!.giveWeapon!(0, w as never), weapon);
  await page.waitForFunction((w) => window.__GK__!.players![0].weapon === w, weapon);
}

async function spawnGround(page: Page, type: string, x: number): Promise<void> {
  const n = (await gk(page)).enemies!.length;
  await page.evaluate(([t, sx]) => window.__GK__!.spawn!(t as never, sx as number), [type, x] as const);
  await page.waitForFunction((c) => window.__GK__!.enemies!.length > c, n);
}

async function hold(page: Page, code: string, ms: number): Promise<void> {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
}

test.describe('四把新武器', () => {
  test('彈彈毛線球:拋出去落地會彈起來(最多 3 次)', async ({ page }) => {
    await open(page, 'yarnBall');
    expect((await gk(page)).players![0].held!.key).toBe('w-yarn-ball');
    await hold(page, 'KeyC', 60);
    await page.waitForFunction(() => (window.__GK__!.shots ?? []).some((s) => s.id === 'yarnBall' && s.bouncesLeft < 3), undefined, { timeout: 2000 });
  });

  test('彈彈毛線球打得到魔物', async ({ page }) => {
    await open(page, 'yarnBall');
    await spawnGround(page, 'hedgehog', 2850);
    await page.evaluate(() => window.__GK__!.warp!(3050));
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(150);
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => (window.__GK__!.enemiesDefeated ?? 0) > 0 || window.__GK__!.enemies!.some((e) => e.type === 'hedgehog' && e.hp < 6), undefined, { timeout: 4000 });
    await page.keyboard.up('KeyC');
  });

  test('晚安棉花糖炸彈:落地爆開,一次打到兩隻', async ({ page }) => {
    await open(page, 'marshmallowBomb');
    await spawnGround(page, 'alarmBug', 2850);
    await spawnGround(page, 'alarmBug', 2900);
    await page.waitForTimeout(200);
    await hold(page, 'KeyC', 60);
    await page.waitForFunction(() => (window.__GK__!.blasts?.count ?? 0) >= 1, undefined, { timeout: 3000 });
    const s = await gk(page);
    expect(s.blasts!.last!.hits).toBeGreaterThanOrEqual(2);
    expect(s.players![0].ammo).toBe(29);
  });

  test('棉花糖爆開不會被刺蝟的盾擋住', async ({ page }) => {
    await open(page, 'marshmallowBomb');
    await spawnGround(page, 'hedgehog', 2870);
    await page.waitForTimeout(200);
    await hold(page, 'KeyC', 60);
    await page.waitForFunction(() => (window.__GK__!.blasts?.count ?? 0) >= 1, undefined, { timeout: 3000 });
    await page.waitForFunction(() => (window.__GK__!.enemiesDefeated ?? 0) > 0 || window.__GK__!.enemies!.some((e) => e.type === 'hedgehog' && e.hp < 6), undefined, { timeout: 2000 });
  });

  test('催眠懷錶:按住集氣不射、手上的懷錶擺動;放開射出,集越久越痛越大', async ({ page }) => {
    await open(page, 'hypnoWatch');
    await hold(page, 'KeyC', 40);
    await page.waitForFunction(() => (window.__GK__!.shots ?? []).some((s) => s.id === 'hypnoWatch'), undefined, { timeout: 1000 });
    const tap = (await gk(page)).shots!.find((s) => s.id === 'hypnoWatch')!;
    await page.waitForFunction(() => !(window.__GK__!.shots ?? []).some((s) => s.id === 'hypnoWatch'), undefined, { timeout: 3000 });
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(700);
    let s = await gk(page);
    expect(s.players![0].chargeMs).toBeGreaterThan(400);
    expect(s.shots!.some((x) => x.id === 'hypnoWatch')).toBe(false);
    await page.waitForTimeout(700);
    await page.keyboard.up('KeyC');
    await page.waitForFunction(() => (window.__GK__!.shots ?? []).some((s) => s.id === 'hypnoWatch'), undefined, { timeout: 1000 });
    s = await gk(page);
    const full = s.shots!.find((x) => x.id === 'hypnoWatch')!;
    expect(tap.damage).toBeLessThanOrEqual(5);
    expect(full.damage).toBe(22);
    expect(full.size).toBeGreaterThan(tap.size * 1.8);
    expect(s.players![0].ammo).toBe(23);
  });

  test('許願流星杖:流星落在前方 160–360 爆開,打得到魔物', async ({ page }) => {
    await open(page, 'wishingStar');
    const x0 = (await gk(page)).players![0].x;
    await hold(page, 'KeyC', 60);
    await page.waitForFunction(() => (window.__GK__!.blasts?.count ?? 0) >= 1, undefined, { timeout: 3000 });
    const bx = (await gk(page)).blasts!.last!.x;
    expect(bx - x0).toBeGreaterThanOrEqual(140);
    expect(bx - x0).toBeLessThanOrEqual(380);
    await spawnGround(page, 'hedgehog', x0 + 260);
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => (window.__GK__!.enemiesDefeated ?? 0) > 0 || window.__GK__!.enemies!.some((e) => e.type === 'hedgehog' && e.hp < 6), undefined, { timeout: 4000 });
    await page.keyboard.up('KeyC');
  });

  test('背包列出十把武器', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: { yarnBall: 1, wishingStar: 3 } })));
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit4');
    await page.waitForFunction(() => window.__GK__?.screen === 'backpack');
    const lines = (await gk(page)).backpackText!.filter((l) => /^(R|SR|SSR) /.test(l));
    expect(lines).toHaveLength(10);
    expect(lines.join('\n')).toContain('彈彈毛線球 ★☆☆');
    expect(lines.join('\n')).toContain('許願流星杖 ★★★');
  });
});
