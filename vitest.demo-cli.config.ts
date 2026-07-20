import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: true,
    hookTimeout: 30_000,
    include: ['scripts/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
