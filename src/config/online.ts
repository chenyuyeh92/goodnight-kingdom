/**
 * 線上雙人用的 Supabase 專案(只用 Realtime 讓兩台裝置互相找到對方)。
 * 這是公開用的 anon 金鑰,本來就會放在網頁裡;專案沒有資料表,也不存任何資料。
 */
export const SUPABASE_URL = 'https://hpttclbfqqqajqxhgavg.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdHRjbGJmcXFxYWpxeGhnYXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTc0NzAsImV4cCI6MjEwODQzMzQ3MH0.wzegorhwAEvnbUJU3vDQBjdSUpZ90oXNaX77TQR6F1M';

/** 讓兩台裝置找到彼此在網路上的位置(公開的 STUN 服務,不經過它傳遊戲畫面)。 */
export const ICE_SERVERS: RTCIceServer[] = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
