// 把十個世界的試聽頁離線錄成 MP3：本機小伺服器＋無頭 Chrome 跑 harness.html
// 用法：node server.js <輸出資料夾>
const http = require("http"), fs = require("fs"), path = require("path"), { spawn } = require("child_process");
const OUT = process.argv[2], MUSIC = path.join(__dirname, "../../music-sources"), HERE = __dirname, PORT = 8777;  // 試聽頁原始檔在 docs/art/music-sources/；lamejs 要先 npm install lamejs@1.2.1
fs.mkdirSync(OUT, { recursive: true });
const log = fs.createWriteStream(path.join(HERE, "render-log.txt"), { flags: "w" });
let chrome;
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (req.method === "GET") {
    let f = u.pathname === "/" ? path.join(HERE, "harness.html") : u.pathname === "/lame.min.js" ? path.join(HERE, "node_modules/lamejs/lame.min.js") : path.join(MUSIC, path.basename(u.pathname));
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": f.endsWith(".js") ? "text/javascript" : "text/html; charset=utf-8" }); return fs.createReadStream(f).pipe(res);
  }
  const chunks = []; req.on("data", c => chunks.push(c)); req.on("end", () => {
    const body = Buffer.concat(chunks);
    if (u.pathname === "/save") { const name = path.basename(u.searchParams.get("name") || "unnamed.bin"); fs.writeFileSync(path.join(OUT, name), body); log.write("saved " + name + " " + body.length + "\n"); }
    else if (u.pathname === "/log") { log.write(body.toString() + "\n"); process.stdout.write(body.toString() + "\n"); }
    else if (u.pathname === "/done") { log.write("DONE\n"); console.log("DONE"); res.end("ok"); setTimeout(() => { try { chrome.kill(); } catch (e) {} srv.close(); process.exit(0); }, 500); return; }
    res.end("ok");
  });
});
srv.listen(PORT, "127.0.0.1", () => {
  chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--autoplay-policy=no-user-gesture-required",
    "--user-data-dir=" + path.join(HERE, "chrome-profile"), "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "http://127.0.0.1:" + PORT + "/" + (process.argv[3] || "")], { stdio: "ignore" });
  console.log("started");
});
setTimeout(() => { console.log("TIMEOUT"); try { chrome.kill(); } catch (e) {} process.exit(1); }, 40 * 60 * 1000);
