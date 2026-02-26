import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests-e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 10 * 60 * 1000,
  expect: {
    timeout: 20 * 1000,
  },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
})
