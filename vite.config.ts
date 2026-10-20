import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/goodnight-kingdom/',
  build: { chunkSizeWarningLimit: 2000 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
