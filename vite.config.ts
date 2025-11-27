/// <reference types="vitest" />
import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  // We can add more config options here later if needed
  server: {
    port: 3000,
  },
  plugins: [
    istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'test/'],
      extension: ['.js', '.ts'],
      requireEnv: false,
    }),
  ],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/vitest',
      include: ['src/**/*.ts'],
    },
    exclude: ['tests/**', 'node_modules/**'],
  },
});
