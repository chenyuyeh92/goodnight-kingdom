-- 晚安王國 Windows 電腦版（下載版）的訂單（一筆購買一列）。訂單密碼、下載代碼都不存原文：訂單密碼只存雜湊；下載代碼由伺服器的密鑰算出來（HMAC），重寄時把 token_gen 加一，舊連結就失效。
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,      -- 綠界的 MerchantTradeNo（GK 開頭，20 個英數字）
  k_hash        TEXT NOT NULL,         -- 訂單密碼的 SHA-256（付款完成頁、狀態查詢要帶訂單密碼）
  email         TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',   -- pending／atm（已取號，等繳費）／paid／failed／refunded（負責人在管理頁標記已退款）
  env           TEXT NOT NULL,         -- 建單時的綠界環境：stage（測試）／prod（正式）。換正式後，測試環境的訂單不能下載正式檔案
  consent_at    TEXT NOT NULL,         -- 勾選「不適用七日解除權」的時間（ISO）
  created_at    TEXT NOT NULL,
  paid_at       TEXT,
  trade_no      TEXT,                  -- 綠界交易編號
  pay_type      TEXT,
  simulate      INTEGER DEFAULT 0,     -- 1＝綠界後台的模擬付款（只有測試環境接受）
  atm_bank      TEXT, atm_account TEXT, atm_expire TEXT,
  token_gen     INTEGER NOT NULL DEFAULT 1,
  token_expires INTEGER,               -- 下載連結到期（毫秒）
  dl_count      INTEGER NOT NULL DEFAULT 0,
  dl_bytes      INTEGER NOT NULL DEFAULT 0,
  mail_status   TEXT,                  -- sent／failed／（空）
  return_at     TEXT,                  -- 綠界伺服器通知（ReturnURL）最後一次到達的時間：確認綠界連得到本站
  note          TEXT                   -- 出問題時的紀錄（例如收到付款通知但金額不對、沒出貨），管理頁會顯示
);
CREATE INDEX IF NOT EXISTS orders_email ON orders(email);
-- 買家自己重寄下載連結的紀錄（防亂按：同一個 email 一小時 3 次、全站一小時 60 次）
CREATE TABLE IF NOT EXISTS resends (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS resends_at ON resends(at);
-- 還沒設定寄信網址（或測試環境寄給負責人以外的人）時，信先存在這裡
CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, to_email TEXT, subject TEXT, html TEXT);
