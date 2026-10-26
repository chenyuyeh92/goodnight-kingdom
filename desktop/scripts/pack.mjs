// 打包 Windows 電腦版：在 desktop 資料夾跑 node scripts/pack.mjs（要在 PowerShell 跑：Git Bash 的 tar 做 zip 會失敗）
// 1) 打包遊戲：VITE_FULL=1（完整版）、VITE_APP=1（沒有網頁版的購買按鈕），只留遊戲真的會用到的檔案 → game/
// 2) 圖示 png → ico  3) @electron/packager 做出資料夾  4) 安裝程式 Setup.exe（dist/，商店賣這個）
// 只想做 game/ 給 `npx electron .` 試玩：node scripts/pack.mjs --game-only
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.join(root, '..');
const tmp = path.join(root, 'dist', '_game-build');
const game = path.join(root, 'game');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// 1) 遊戲。用 vite 打到暫存資料夾（不動網頁版的 dist/），再照 App 版的規則只留會用到的檔案（美術原檔不放）
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
execFileSync(process.execPath, [path.join(repo, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', tmp, '--emptyOutDir'], {
  cwd: repo, stdio: 'inherit', env: { ...process.env, VITE_FULL: '1', VITE_APP: '1' },
});
const KEEP = ['index.html', 'web', 'assets/music', 'assets/characters/pajama-outline.png', 'assets/story/town-houses-windows.json'];
fs.rmSync(game, { recursive: true, force: true });
fs.mkdirSync(path.join(game, 'assets'), { recursive: true });
for (const name of fs.readdirSync(tmp)) if (name !== 'assets' && KEEP.includes(name)) fs.cpSync(path.join(tmp, name), path.join(game, name), { recursive: true });
for (const name of fs.readdirSync(path.join(tmp, 'assets'))) {
  const from = path.join(tmp, 'assets', name);
  if (fs.statSync(from).isFile()) fs.cpSync(from, path.join(game, 'assets', name));   /* Vite 打包出來的程式 index-xxxx.js */
}
for (const keep of KEEP.filter(k => k.startsWith('assets/'))) fs.cpSync(path.join(tmp, keep), path.join(game, keep), { recursive: true });
// 防呆：電腦版是完整版，裡面不能有網頁版的購買程式（解鎖碼、商店網址）
const FORBIDDEN = /goodnight-shop|workers\.dev|api\/redeem|解鎖碼|買 Windows 電腦版|Get the Windows version/;
for (const name of fs.readdirSync(path.join(game, 'assets'))) {
  if (/\.js$/.test(name) && FORBIDDEN.test(fs.readFileSync(path.join(game, 'assets', name), 'utf8'))) throw new Error('電腦版的 ' + name + ' 裡有網頁版購買的程式：確認打包時有設 VITE_APP=1');
}
fs.rmSync(tmp, { recursive: true, force: true });
const size = p => (fs.statSync(p).isDirectory() ? fs.readdirSync(p).reduce((s, n) => s + size(path.join(p, n)), 0) : fs.statSync(p).size);
console.log('遊戲檔案：' + (size(game) / 1e6).toFixed(1) + ' MB → ' + game);
if (process.argv.includes('--game-only')) process.exit(0);

// 2) 圖示：用 App 的圖示（1024×1024），ico 要 256×256 以下
const { default: pngToIco } = await import('png-to-ico');
fs.copyFileSync(path.join(repo, 'app', 'assets', 'icon.png'), path.join(root, 'icon.png'));
fs.writeFileSync(path.join(root, 'icon.ico'), await pngToIco(path.join(root, 'icon.png')));

// 3) 資料夾版
const { default: packager } = await import('@electron/packager');
const out = path.join(root, 'dist');
const [dir] = await packager({
  dir: root, out, overwrite: true, platform: 'win32', arch: 'x64',
  name: 'Goodnight-Kingdom', icon: path.join(root, 'icon.ico'),
  appCopyright: '2026 葉宸佑 (Chen-Yu Yeh)', appVersion: pkg.version,
  win32metadata: { CompanyName: 'Chen-Yu Yeh', FileDescription: 'Goodnight Kingdom', ProductName: 'Goodnight Kingdom' },
  ignore: [/^\/dist/, /^\/scripts/, /^\/icon\.ico$/, /^\/package-lock\.json$/, /^\/node_modules/],
  prune: true,
});
fs.writeFileSync(path.join(dir, 'README.txt'), [
  '晚安王國 Goodnight Kingdom（Windows 電腦版）',
  '',
  '雙擊 Goodnight-Kingdom.exe 開始。F11 切換全螢幕，Alt+F4 離開遊戲。單人遊戲完全離線；線上雙人要網路。',
  'Run Goodnight-Kingdom.exe. F11 = full screen, Alt+F4 = quit. Single player works offline; online co-op needs internet.',
  '若出現「Windows 已保護您的電腦」：點「其他資訊」→「仍要執行」。',
  'If Windows shows "Windows protected your PC": click "More info" > "Run anyway".',
  '換電腦時：在遊戲的「設定」按「匯出存檔」，到新電腦按「匯入存檔」。',
  '',
  'Electron (MIT): LICENSE; Chromium and other components: LICENSES.chromium.html',
  '(c) 2026 葉宸佑 (Chen-Yu Yeh)    Support: https://chenyuyeh92.github.io/goodnight-kingdom/support.html',
  '',
].join('\r\n'));
console.log('資料夾版：', dir);

// 4) 安裝程式（NSIS）：雙擊 → 下一步 → 安裝；桌面和開始選單自動有「晚安王國」圖示；可從「設定 → 應用程式」移除。
//    裝在使用者自己的資料夾（不用系統管理員權限）。存檔在 %APPDATA%\goodnight-kingdom-desktop，重新安裝不會不見。
const { build, Platform } = await import('electron-builder');
const SETUP = 'Goodnight-Kingdom-Setup.exe';
await build({
  projectDir: root,
  prepackaged: dir,
  targets: Platform.WINDOWS.createTarget('nsis', 'x64'),
  config: {
    appId: 'com.chenyuyeh.goodnightkingdom.desktop',
    productName: '晚安王國',
    copyright: '2026 葉宸佑 (Chen-Yu Yeh)',
    directories: { output: out },
    // 捷徑要指向資料夾裡真正的 exe（不設的話 NSIS 會用 productName 當 exe 名字，捷徑指到不存在的檔案；莫札特踩過）
    win: { icon: path.join(root, 'icon.ico'), executableName: 'Goodnight-Kingdom' },
    nsis: {
      oneClick: false,
      perMachine: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: 'always',
      createStartMenuShortcut: true,
      shortcutName: '晚安王國',
      uninstallDisplayName: '晚安王國 Goodnight Kingdom',
      artifactName: SETUP,
      installerLanguages: ['zh_TW', 'en_US'],
      multiLanguageInstaller: true,
      runAfterFinish: true,
      installerIcon: path.join(root, 'icon.ico'),
      uninstallerIcon: path.join(root, 'icon.ico'),
    },
  },
});
const setup = path.join(out, SETUP);
console.log('安裝程式：', setup, (fs.statSync(setup).size / 1048576).toFixed(0) + ' MB');
