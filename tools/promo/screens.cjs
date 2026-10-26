/**
 * App Store 的截圖(2026-10-26 上架準備)。
 *
 * 用法:先 `npm run build:e2e`、`npx vite preview --port 4173`,再
 *   node tools/promo/screens.cjs <輸出資料夾>
 * 產生 iPhone 6.9 吋(2868×1320)與 iPad 13 吋(2752×2064)橫式截圖,中文、英文各 5 張,
 * 另外一張內購審核用的購買畫面(iap-review.jpg)。用手機的觸控畫面(touch=1),跟 App 裡看到的一樣。
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { sleep, tapGame, hold, runAndGun, drawBunny } = require('./record.cjs');

const BASE = 'http://localhost:4173/goodnight-kingdom/';
const OUT = path.resolve(process.argv[2] ?? 'store-screens');
const EXEC = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const DEVICES = {
  iphone: { width: 1434, height: 660 },
  ipad: { width: 1376, height: 1032 },
};
const SEEN = { version: 1, weapons: {}, story: { opening: true, ending: true, intros: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] } };
const CLEARED_1_TO_3 = Object.fromEntries(['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3'].map((id) => [id, 100000]));

async function newPage(browser, device, lang, init) {
  const context = await browser.newContext({ viewport: DEVICES[device], deviceScaleFactor: 2, locale: lang === 'zh' ? 'zh-TW' : 'en-US', hasTouch: true });
  await context.addInitScript(init.fn, init.arg);
  return context.newPage();
}

const withSave = (save) => ({ fn: (s) => localStorage.setItem('gk.save.v1', s), arg: JSON.stringify(save) });

async function openMenu(page, lang, extra = '') {
  await page.goto(`${BASE}?test=1&touch=1&lang=${lang}${extra}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 20000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 }, force: true });
}

async function openLevel(page, lang, level) {
  await page.goto(`${BASE}?mode=single&test=1&touch=1&level=${level}&lang=${lang}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 }, force: true });
  await page.evaluate(() => window.__GK__.setAmbient?.(true));
  await sleep(600);
}

/** 每張截圖:畫面準備好就拍(fn 結束時的畫面)。 */
const SHOTS = [
  ['menu', async (page, lang) => {
    await openMenu(page, lang);
    await sleep(1500);
  }],
  ['play', async (page, lang) => {
    await openLevel(page, lang, 'w1-2');
    await page.evaluate(() => window.__GK__.warp(1400));
    await sleep(500);
    await runAndGun(page, 4200, { walk: 1400, stand: 1200, jumpEvery: 0 });
  }],
  ['draw', async (page, lang) => {
    await openMenu(page, lang);
    await page.keyboard.press('Digit3');
    await page.waitForFunction(() => window.__GK__?.screen === 'guard-room');
    await sleep(500);
    await tapGame(page, 295, 495);
    await page.waitForSelector('#draw-canvas');
    await sleep(400);
    await drawBunny(page);
    await page.fill('#draw-name', lang === 'zh' ? '小兔' : 'Bunny');
    await sleep(300);
  }],
  ['weapons', async (page, lang) => {
    await openLevel(page, lang, 'w3-1');
    await page.evaluate(() => window.__GK__.warp(2700));
    await sleep(800);
    await hold(page, ['KeyD'], 1500);
    await page.evaluate(() => window.__GK__.giveWeapon(0, 'wishingStar', 3));
    await page.keyboard.down('KeyC');
    await sleep(1300);
  }],
  ['boss', async (page, lang) => {
    await openLevel(page, lang, 'w10-3');
    await page.evaluate(() => window.__GK__.giveWeapon(0, 'wishingStar', 3));
    await page.keyboard.down('KeyD');
    await page.evaluate(() => window.__GK__.warp(9700));
    await page.waitForFunction(() => !!window.__GK__?.bossSay, undefined, { timeout: 15000 }).catch(() => undefined);
    await page.keyboard.up('KeyD');
    await sleep(1500);
    await page.keyboard.down('KeyC');
    await sleep(2200);
  }],
];

async function shoot(page, file) {
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 92 });
  console.log(file);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXEC });
  for (const device of Object.keys(DEVICES)) {
    for (const lang of ['zh', 'en']) {
      for (const [i, [name, setUp]] of SHOTS.entries()) {
        const page = await newPage(browser, device, lang, withSave(SEEN));
        try {
          await setUp(page, lang);
          await shoot(page, `${device}-${lang}-${i + 1}-${name}.jpg`);
        } catch (e) {
          console.error(`${device}-${lang}-${name} 失敗:`, e.message);
        }
        await page.context().close();
      }
    }
  }
  // 內購審核用:App 裡世界 4 的購買畫面(假的 App,價格 NT$100)。
  const page = await newPage(browser, 'iphone', 'zh', {
    fn: (s) => {
      window.ReactNativeWebView = { postMessage() {} };
      localStorage.setItem('gk.save.v1', s);
    },
    arg: JSON.stringify({ ...SEEN, cleared: CLEARED_1_TO_3 }),
  });
  await openMenu(page, 'zh', '&free=1');
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
  await page.evaluate(() => window.__gkNative({ type: 'store', full: false, price: 'NT$100' }));
  await sleep(500);
  await shoot(page, 'iap-review.jpg');
  await browser.close();
})();
