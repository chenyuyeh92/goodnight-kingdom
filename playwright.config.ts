import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const BASE_URL = 'http://localhost:4173/goodnight-kingdom/';
const fallbackChromium = '/opt/pw-browsers/chromium';
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync(fallbackChromium) ? fallbackChromium : undefined);

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  // 這些測試依賴真實時間與畫面格數,並行會互搶 CPU 造成誤判。
  workers: 1,
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: false,
  },
  // 測試預設用繁體中文(英文版的測試用 ?lang=en 或自己設 locale)。
  use: { baseURL: BASE_URL, locale: 'zh-TW' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], locale: 'zh-TW', launchOptions: { executablePath } },
    },
  ],
});
