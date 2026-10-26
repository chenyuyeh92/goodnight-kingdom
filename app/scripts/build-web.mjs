// 把網頁版遊戲打包好,放進 App(modules/game-server/ios/GoodnightGame/)。
// EAS 雲端打包時自動執行(package.json 的 eas-build-pre-install);自己在 Mac 上打包前也要先跑:npm run web
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, statSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = join(app, '..');
const dist = join(game, 'dist');
const out = join(app, 'modules', 'game-server', 'ios', 'GoodnightGame');

const run = (cmd) => execSync(cmd, { cwd: game, stdio: 'inherit' });
if (!existsSync(join(game, 'node_modules'))) run('npm ci');
run('npm run build');

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

const size = (p) => (statSync(p).isDirectory() ? readdirSync(p).reduce((s, n) => s + size(join(p, n)), 0) : statSync(p).size);
console.log(`遊戲檔案放進 App:${(size(out) / 1e6).toFixed(1)} MB → ${out}`);
