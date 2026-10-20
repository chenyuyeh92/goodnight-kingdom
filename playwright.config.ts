import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const BASE_URL = 'http://localhost:4173/goodnight-kingdom/';
const fallbackChromium = '/opt/pw-browsers/chromium';
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync(fallbackChromium) ? fallbackChromium : undefined);

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: false,
  },
  use: { baseURL: BASE_URL },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
  ],
});
