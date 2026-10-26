// 本機測付款用：開遊戲（vite，埠 5173），小商店網址改成本機的 wrangler dev（埠 8789）。在任何資料夾都能跑：node shop/dev-game.cjs
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
spawn(process.execPath, [vite, '--port', '5173', '--strictPort'], { cwd: root, stdio: 'inherit', env: { ...process.env, VITE_SHOP_URL: 'http://localhost:8789' } }).on('exit', (c) => process.exit(c ?? 0));
