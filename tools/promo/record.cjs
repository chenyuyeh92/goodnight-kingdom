/**
 * 宣傳影片的遊戲畫面錄影(葉宸佑 2026-10-25 要求)。
 *
 * 用法:先 `npm run build:e2e`、`npx vite preview --port 4173`,再
 *   node tools/promo/record.cjs <輸出資料夾> [語言 zh|en] [只錄某幾段,用逗號分開]
 * 每一段存成一個資料夾:畫面(JPEG,1920×1080)與每張的時間(times.json),之後交給 assemble.py 剪接。
 * 錄的是測試用的打包(?test=1 才能直接跳關、全部世界都能玩),畫面和正式版一樣。
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'http://localhost:4173/goodnight-kingdom/';
const OUT = path.resolve(process.argv[2] ?? 'promo-raw');
const LANG = process.argv[3] ?? 'zh';
const ONLY = process.argv[4] ? new Set(process.argv[4].split(',')) : null;
const EXEC = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;

/** 已經看過開場、各世界開頭句的存檔(錄關卡時不會跳出故事)。 */
const SEEN = { version: 1, weapons: {}, story: { opening: true, ending: true, intros: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] } };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(browser, save) {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2, locale: LANG === 'zh' ? 'zh-TW' : 'en-US' });
  if (save) await context.addInitScript((s) => localStorage.setItem('gk.save.v1', s), JSON.stringify(save));
  const page = await context.newPage();
  return page;
}

/** 錄一段:開始錄 → 做 fn 裡的動作 → 停止;每張畫面存成 JPEG,時間記在 times.json。 */
async function record(page, name, fn) {
  const dir = path.join(OUT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const times = [];
  cdp.on('Page.screencastFrame', (f) => {
    const i = times.length;
    fs.writeFileSync(path.join(dir, `${String(i).padStart(5, '0')}.jpg`), Buffer.from(f.data, 'base64'));
    times.push(f.metadata.timestamp);
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  try {
    await fn();
  } finally {
    await cdp.send('Page.stopScreencast');
    fs.writeFileSync(path.join(dir, 'times.json'), JSON.stringify(times));
    const span = times.length > 1 ? times[times.length - 1] - times[0] : 0;
    console.log(`${name}: ${times.length} 張, ${span.toFixed(1)} 秒, 約 ${(times.length / Math.max(span, 0.001)).toFixed(1)} fps`);
  }
}

async function tapGame(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.click(box.x + (x / 960) * box.width, box.y + (y / 540) * box.height);
}

async function openLevel(page, level, mode = 'single') {
  await page.goto(`${BASE}?mode=${mode}&test=1&level=${level}&lang=${LANG}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  // 測試網址預設沒有四面八方來的魔物,錄影要熱鬧一點。
  await page.evaluate(() => window.__GK__.setAmbient?.(true));
  await sleep(600);
}

async function hold(page, keys, ms) {
  for (const k of keys) await page.keyboard.down(k);
  await sleep(ms);
  for (const k of keys) await page.keyboard.up(k);
}

/**
 * 一邊往右走一邊射擊,每隔一下跳一次。射擊用連續點按(換到要集氣的武器也射得出來);
 * walk/stand 可以讓角色走一下、停下來射一下,看得到魔物被哄睡。
 */
async function runAndGun(page, ms, { jumpEvery = 1300, right = 'KeyD', shoot = 'KeyC', jump = 'KeyV', walk = 0, stand = 0 } = {}) {
  const t0 = Date.now();
  let walking = false;
  let lastJump = t0;
  let shotDown = false;
  while (Date.now() - t0 < ms) {
    const t = Date.now() - t0;
    const wantWalk = walk === 0 || t % (walk + stand) < walk;
    if (wantWalk !== walking) {
      if (wantWalk) await page.keyboard.down(right);
      else await page.keyboard.up(right);
      walking = wantWalk;
    }
    if (shotDown) await page.keyboard.up(shoot);
    else await page.keyboard.down(shoot);
    shotDown = !shotDown;
    if (jumpEvery > 0 && Date.now() - lastJump > jumpEvery) {
      lastJump = Date.now();
      await hold(page, [jump], 220);
    }
    await sleep(shotDown ? 260 : 60);
  }
  if (shotDown) await page.keyboard.up(shoot);
  if (walking) await page.keyboard.up(right);
}

/** 在畫布上畫一條線(座標用畫板的 320×512)。 */
async function stroke(page, pts, steps = 3) {
  const box = await page.locator('#draw-canvas').boundingBox();
  const at = ([x, y]) => [box.x + (x / 320) * box.width, box.y + (y / 512) * box.height];
  const [x0, y0] = at(pts[0]);
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  for (const p of pts.slice(1)) {
    const [x, y] = at(p);
    await page.mouse.move(x, y, { steps });
  }
  await page.mouse.up();
}

function ellipse(cx, cy, rx, ry, n = 28) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}

async function pickColor(page, color) {
  await page.click(`#draw-colors [data-color="${color}"]`);
}

async function fill(page, x, y) {
  // 油漆桶按鈕按第二次會關掉,已經選好就不要再按。
  if (!(await page.locator('[data-tool="bucket"].on').count())) await page.click('[data-tool="bucket"]');
  const box = await page.locator('#draw-canvas').boundingBox();
  await page.mouse.click(box.x + (x / 320) * box.width, box.y + (y / 512) * box.height);
  await sleep(250);
}

/** 畫一隻白色小兔(畫布要已經打開)。 */
async function drawBunny(page) {
  await page.click('[data-size="thick"]');
  // 外框用淺紫色(畫板是深色,深色線會看不見)。
  await pickColor(page, '#b69cff');
  // 耳朵、頭、身體。
  await stroke(page, ellipse(128, 92, 20, 52));
  await stroke(page, ellipse(192, 92, 20, 52));
  await stroke(page, ellipse(160, 215, 78, 66));
  await stroke(page, ellipse(160, 375, 68, 88));
  // 塗顏色:白色的臉和身體、粉紅色的耳朵。
  await pickColor(page, '#ffffff');
  await fill(page, 160, 215);
  await fill(page, 160, 380);
  await pickColor(page, '#f7a8c4');
  await fill(page, 128, 92);
  await fill(page, 192, 92);
  // 睡眼、腮紅、肚子上的星星。
  await page.click('[data-size="mid"]');
  await pickColor(page, '#3a2a5a');
  await stroke(page, [[118, 210], [130, 218], [142, 210]], 4);
  await stroke(page, [[178, 210], [190, 218], [202, 210]], 4);
  await stroke(page, [[150, 240], [160, 248], [170, 240]], 4);
  await pickColor(page, '#f7a8c4');
  await stroke(page, ellipse(112, 236, 9, 6, 10), 3);
  await stroke(page, ellipse(208, 236, 9, 6, 10), 3);
  await pickColor(page, '#f8e08e');
  await stroke(page, [[160, 340], [168, 362], [190, 364], [172, 378], [180, 400], [160, 386], [140, 400], [148, 378], [130, 364], [152, 362], [160, 340]], 4);
  await fill(page, 160, 372);
}

const SHOTS = {
  /** 開場的動態繪本(6 幕)。 */
  async story(browser) {
    const page = await newPage(browser, null);
    await page.goto(`${BASE}?test=1&story=1&lang=${LANG}`);
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 20000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'story');
    await record(page, 'story', async () => {
      for (let beat = 0; beat < 6; beat++) {
        await page.waitForFunction((b) => window.__GK__?.story?.beat === b && window.__GK__.story.done, beat, { timeout: 15000 });
        await sleep(1800);
        await page.keyboard.press('Enter');
      }
      await sleep(800);
    });
    await page.context().close();
  },

  /** 世界 1:一邊走一邊用哈欠泡泡哄睡魔物。 */
  async w1(browser) {
    const page = await newPage(browser, SEEN);
    await openLevel(page, 'w1-1');
    await record(page, 'w1', () => runAndGun(page, 14000, { walk: 1400, stand: 1200, jumpEvery: 2600 }));
    await page.context().close();
  },

  /** 畫自己的守衛(白色小兔),取名、存起來;接著用它在世界 2 冒險。 */
  async draw(browser) {
    const page = await newPage(browser, SEEN);
    await page.goto(`${BASE}?test=1&lang=${LANG}`);
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 20000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit3');
    await page.waitForFunction(() => window.__GK__?.screen === 'guard-room');
    await record(page, 'draw', async () => {
      await sleep(600);
      await tapGame(page, 295, 495);
      await page.waitForSelector('#draw-canvas');
      await sleep(500);
      await drawBunny(page);
      await sleep(400);
      await page.fill('#draw-name', LANG === 'zh' ? '小兔' : 'Bunny');
      await sleep(500);
      await page.click('#draw-save');
      await page.waitForFunction(() => window.__GK__?.screen === 'guard-room' && (window.__GK__.guardList ?? []).length === 1);
      await sleep(1500);
    });
    // 用剛畫的守衛去世界 2(沙漠)冒險。
    await openLevel(page, 'w2-1');
    await record(page, 'drawnPlay', () => runAndGun(page, 12000));
    await page.context().close();
  },

  /** 世界 3(海底):開寶箱,換上各種武器。 */
  async weapons(browser) {
    const page = await newPage(browser, SEEN);
    await openLevel(page, 'w3-1');
    await page.evaluate(() => window.__GK__.warp(2700));
    await sleep(800);
    await record(page, 'weapons', async () => {
      await hold(page, ['KeyD'], 1800);
      await sleep(1600);
      for (const id of ['yarnBall', 'marshmallowBomb', 'wishingStar', 'lullabyHarp']) {
        await page.evaluate((w) => window.__GK__.giveWeapon(0, w, 3), id);
        await page.keyboard.down('KeyC');
        await hold(page, ['KeyD'], 700);
        await sleep(1500);
        await page.keyboard.up('KeyC');
      }
      // 催眠懷錶:按住集氣,放開射出。
      await page.evaluate(() => window.__GK__.giveWeapon(0, 'hypnoWatch', 3));
      await hold(page, ['KeyC'], 1400);
      await sleep(900);
    });
    await page.context().close();
  },

  /** 世界 4–10 各一小段(每個世界的特色機關)。 */
  async worlds(browser) {
    const plan = [
      ['w4', 'w4-1', 750, 6000, 0],
      ['w5', 'w5-1', 8120, 6000, 1400],
      ['w6', 'w6-1', 1550, 6000, 900],
      ['w7', 'w7-1', 1150, 6000, 900],
      ['w8', 'w8-1', 1100, 6000, 1500],
      // 世界 9 錄黃昏的 9-2:走進洞裡才暗(白天的 9-1 是亮的)。
      ['w9', 'w9-2', 900, 6000, 1500],
      ['w10', 'w10-1', 200, 6000, 1300],
    ];
    for (const [name, level, x, ms, jumpEvery] of plan) {
      if (ONLY && !ONLY.has(name) && !ONLY.has('worlds')) continue;
      const page = await newPage(browser, SEEN);
      await openLevel(page, level);
      if (x > 400) await page.evaluate((wx) => window.__GK__.warp(wx), x);
      await sleep(700);
      await record(page, name, () => runAndGun(page, ms, { jumpEvery }));
      await page.context().close();
    }
  },

  /** 兩個人一起玩(錄同一台的雙人,畫面和兩支手機連線一樣)。 */
  async duo(browser) {
    const page = await newPage(browser, SEEN);
    await openLevel(page, 'w1-2', 'duo');
    await record(page, 'duo', async () => {
      await page.keyboard.down('ArrowRight');
      await page.keyboard.down('Comma');
      await sleep(500);
      await runAndGun(page, 9000, { jumpEvery: 1500 });
      await page.keyboard.up('Comma');
      await page.keyboard.up('ArrowRight');
    });
    await page.context().close();
  },

  /** 最後的魔王:偷走睡意的夢貘。 */
  async boss(browser) {
    const page = await newPage(browser, SEEN);
    await openLevel(page, 'w10-3');
    await page.evaluate(() => window.__GK__.giveWeapon(0, 'wishingStar', 3));
    await page.keyboard.down('KeyD');
    await page.evaluate(() => window.__GK__.warp(9700));
    await page.waitForFunction(() => !!window.__GK__?.bossSay, undefined, { timeout: 15000 }).catch(() => undefined);
    await page.keyboard.up('KeyD');
    await record(page, 'boss', async () => {
      await sleep(1500);
      await hold(page, ['KeyC'], 6000);
    });
    await page.context().close();
  },
};

module.exports = { sleep, tapGame, hold, runAndGun, drawBunny };

if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXEC });
  for (const [name, shot] of Object.entries(SHOTS)) {
    if (ONLY && !ONLY.has(name) && !(name === 'worlds' && [...ONLY].some((n) => /^w\d+$/.test(n) && Number(n.slice(1)) >= 4))) continue;
    try {
      await shot(browser);
    } catch (e) {
      console.error(`${name} 失敗:`, e.message);
    }
  }
  await browser.close();
})();
