import { defineConfig, devices } from '@playwright/test';

// PUBLIC_INTERFACE
export default defineConfig({
  // Use E2E_BASE_URL if provided; otherwise default to localhost:3000
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  timeout: 30 * 1000,
  expect: { timeout: 5000 },

  // Directory for test files
  testDir: './tests',

  // Reporter configuration
  reporter: [['list'], ['html', { open: 'never' }]],

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Folder for test artifacts
  outputDir: './test-results',
});
