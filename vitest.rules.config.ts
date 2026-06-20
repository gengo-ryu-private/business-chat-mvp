import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: true,
    include: ['src/**/*.rules.test.ts'],
  },
});
