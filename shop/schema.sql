-- 晚安王國網頁版完整版的訂單（一筆購買一列）。訂單密碼、解鎖碼都不存原文：只存雜湊；解鎖碼由伺服器的密鑰算出來（HMAC），換新碼時 code_gen 加一，舊碼就失效。
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,      -- 綠界的 MerchantTradeNo（GK 開頭，20 個英數字）
  k_hash        TEXT NOT NULL,         -- 訂單密碼的 SHA-256（付款完成頁、狀態查詢要帶訂單密碼）
  email         TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',   -- pending／atm（已取號，等繳費）／paid／failed
  env           TEXT NOT NULL,         -- 建單時的綠界環境：stage（測試）／prod（正式）。測試環境的解鎖碼，遊戲不會存起來
  consent_at    TEXT NOT NULL,         -- 勾選「不適用七日解除權」的時間（ISO）
  created_at    TEXT NOT NULL,
  paid_at       TEXT,
  trade_no      TEXT,                  -- 綠界交易編號
  pay_type      TEXT,
  simulate      INTEGER DEFAULT 0,     -- 1＝綠界後台的模擬付款（只有測試環境接受）
  atm_bank      TEXT, atm_account TEXT, atm_expire TEXT,
  code_gen      INTEGER NOT NULL DEFAULT 1,
  code_hash     TEXT,                  -- 解鎖碼的雜湊（付款成功時才有）
  activations   INTEGER NOT NULL DEFAULT 0,        -- 用這個解鎖碼解鎖過幾次（幾台裝置）
  mail_status   TEXT,                  -- sent／failed／（空）
  return_at     TEXT,                  -- 綠界伺服器通知（ReturnURL）最後一次到達的時間：確認綠界連得到本站
  note          TEXT                   -- 出問題時的紀錄（例如收到付款通知但金額不對、沒出貨），管理頁會顯示
);
CREATE INDEX IF NOT EXISTS orders_email ON orders(email);
CREATE UNIQUE INDEX IF NOT EXISTS orders_code ON orders(code_hash);
-- 還沒設定寄信網址時，信先存在這裡（負責人可以用 wrangler d1 execute 查）
CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, to_email TEXT, subject TEXT, html TEXT);
