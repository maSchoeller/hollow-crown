import { defineConfig, devices } from '@playwright/test';

// other checkouts run the suite too and `--strictPort` would collide: E2E_PORT picks another one
const port = Number(process.env.E2E_PORT ?? 4173);
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  // the 3D board runs on software WebGL here, which is CPU-bound; parallel browsers starve each other
  workers: 1,
  use: { baseURL: `http://localhost:${port}/`, trace: 'retain-on-failure' },
  webServer: { command: `pnpm preview --port ${port} --strictPort`, port, reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'iphone13', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'pixel7', use: { ...devices['Pixel 7'] } },
    { name: 'ipad-landscape', use: { ...devices['iPad (gen 7) landscape'], browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
