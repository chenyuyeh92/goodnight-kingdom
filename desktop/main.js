// 晚安王國 — Windows 電腦版外殼（2026-10-26 負責人定案：電腦上賣下載版，照莫札特電腦版的做法）
// 遊戲本身就是網頁版（pack.mjs 用 VITE_FULL=1 VITE_APP=1 打包到 game/：完整版、沒有網頁版的購買按鈕）。
// Vite 打包的程式是「模組」，不能從 file:// 開，所以用自訂網址 app://game/goodnight-kingdom/… 從 game/ 資料夾讀檔。
// 這裡只負責：開視窗（預設全螢幕，F11 切換）、聲音不用先點一下就能播、說明頁交給系統瀏覽器。
const { app, BrowserWindow, shell, Menu, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const SITE = 'https://chenyuyeh92.github.io/goodnight-kingdom/';
const BASE = '/goodnight-kingdom/';   // 跟 vite.config.ts 的 base 一樣
const GAME_DIR = path.join(__dirname, 'game');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// 存檔位置：正式版 %APPDATA%\goodnight-kingdom-desktop；沒打包的開發版另外放，測試時不弄亂正式版的進度
if (!app.isPackaged && !process.argv.some(a => a.startsWith('--user-data-dir'))) app.setPath('userData', path.join(app.getPath('appData'), 'goodnight-kingdom-desktop-dev'));
else if (app.isPackaged) app.setPath('userData', path.join(app.getPath('appData'), 'goodnight-kingdom-desktop'));

// 要在 app ready 之前登記：standard＋secure 才有 localStorage（存檔）和 fetch
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

function serveGame() {
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    if (u.host !== 'game' || !u.pathname.startsWith(BASE)) return new Response('not found', { status: 404 });
    let rel = decodeURIComponent(u.pathname.slice(BASE.length)) || 'index.html';
    const file = path.normalize(path.join(GAME_DIR, rel));
    if (!file.startsWith(GAME_DIR + path.sep)) return new Response('not found', { status: 404 });   /* 不讓 ../ 跑出遊戲資料夾 */
    return net.fetch(pathToFileURL(file).toString());
  });
}

function createWindow() {
  const zh = app.getLocale().startsWith('zh');
  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 640, minHeight: 360,
    fullscreen: true,   /* 預設全螢幕；F11 切換成視窗 */
    title: zh ? '晚安王國' : 'Goodnight Kingdom',
    backgroundColor: '#2a2550',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { backgroundThrottling: false, spellcheck: false },
  });
  win.on('page-title-updated', e => e.preventDefault());
  Menu.setApplicationMenu(null);
  win.loadURL('app://game' + BASE + 'index.html');
  // 遊戲裡的說明頁（支援、隱私權、授權）用系統的瀏覽器開網站上的同一頁；其他網址一律不開
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('app://game' + BASE)) shell.openExternal(SITE + url.slice(('app://game' + BASE).length));
    else if (url.startsWith(SITE)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://game' + BASE)) e.preventDefault(); });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11' && !input.isAutoRepeat) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}

app.whenReady().then(() => { serveGame(); createWindow(); });
app.on('window-all-closed', () => app.quit());
