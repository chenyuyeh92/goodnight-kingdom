// 把網頁版遊戲打包好,放進 App(modules/game-server/ios/GoodnightGame/)。
// EAS 雲端打包時自動執行(package.json 的 eas-build-pre-install);自己在 Mac 上打包前也要先跑:npm run web
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, statSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = join(app, '..');
const dist = join(game, 'dist');
const out = join(app, 'modules', 'game-server', 'ios', 'GoodnightGame');

const run = (cmd, env = {}) => execSync(cmd, { cwd: game, stdio: 'inherit', env: { ...process.env, ...env } });
if (!existsSync(join(game, 'node_modules'))) run('npm ci');
// VITE_APP=1:網頁版的綠界購買、解鎖碼整個拿掉(Apple 3.1.1:App 裡只能用 Apple 的付款,不能出現綠界或「去網站買」)。
run('npm run build', { VITE_APP: '1' });

// 遊戲實際會載入的檔案:網頁版的頁面與程式、轉好的 WebP 美術(web/)、配樂、畫守衛的外框、故事的窗戶位置。
// public/assets/ 裡其他的是美術原檔(PNG),網頁版也不會載入,不放進 App(少 100 MB 以上)。
const KEEP = ['index.html', 'web', 'assets/music', 'assets/characters/pajama-outline.png', 'assets/story/town-houses-windows.json'];
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const name of readdirSync(dist)) {
  // Vite 打包出來的程式(assets/index-xxxx.js)也在 assets/ 裡,一起帶走。
  if (name === 'assets') continue;
  if (KEEP.includes(name)) cpSync(join(dist, name), join(out, name), { recursive: true });
}
for (const name of readdirSync(join(dist, 'assets'))) {
  const from = join(dist, 'assets', name);
  if (statSync(from).isFile()) cpSync(from, join(out, 'assets', name));
}
for (const keep of KEEP.filter((k) => k.startsWith('assets/'))) cpSync(join(dist, keep), join(out, keep), { recursive: true });

// Apple 3.1.1 把關:App 裡不能有網頁版的綠界購買。打包出來的程式只要出現商店網址或這些字,就讓打包失敗。
const FORBIDDEN = /goodnight-shop|workers\.dev|api\/redeem|綠界|ecpay|解鎖碼|電腦版|Windows version|PC version/i;
for (const name of readdirSync(join(out, 'assets'))) {
  const p = join(out, 'assets', name);
  if (/\.(js|html)$/.test(name) && FORBIDDEN.test(readFileSync(p, 'utf8'))) throw new Error(`App 版的 ${name} 裡有網頁版購買的程式(Apple 3.1.1 不允許):確認打包時有設 VITE_APP=1`);
}
if (FORBIDDEN.test(readFileSync(join(out, 'index.html'), 'utf8'))) throw new Error('App 版的 index.html 裡有網頁版購買的字(Apple 3.1.1 不允許)');

const size = (p) => (statSync(p).isDirectory() ? readdirSync(p).reduce((s, n) => s + size(join(p, n)), 0) : statSync(p).size);
console.log(`遊戲檔案放進 App:${(size(out) / 1e6).toFixed(1)} MB → ${out}`);
