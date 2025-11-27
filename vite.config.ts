/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  // We can add more config options here later if needed
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
    },
    // exclude: ['node_modules/**'], // default is usually enough
  },
});
