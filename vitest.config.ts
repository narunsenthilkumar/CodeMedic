import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/codemedic-demo-repository/**', '**/.workspaces/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
