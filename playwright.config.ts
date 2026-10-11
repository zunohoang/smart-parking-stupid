import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90000,
  expect: { timeout: 20000 },
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 390, height: 844 },
    baseURL: 'http://localhost:8082',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run web -- --port 8082',
    url: 'http://localhost:8082',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: { EXPO_OFFLINE: '1' },
  },
});
