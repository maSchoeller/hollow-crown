/** Performance run (story 7.5): `pnpm perf` builds with `--mode perf` and runs tests/perf against dist-perf. */
import { defineConfig, devices } from '@playwright/test';

// other checkouts run the perf suite too: PERF_PORT picks another port
const port = Number(process.env.PERF_PORT ?? 4175);
export default defineConfig({
  testDir: 'tests/perf',
  testMatch: /\.spec\.ts$/,
  timeout: 300_000,
  workers: 1,
  globalTeardown: './tests/perf/report-summary.ts',
  use: {
    baseURL: `http://localhost:${port}/`,
    trace: 'off',
    // PERF_GPU=1: draw with the machine's GPU instead of SwiftShader (headless Chromium's default), for local runs
    ...(process.env.PERF_GPU === '1' ? { launchOptions: { args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default'] } } : {}),
  },
  webServer: { command: `pnpm exec vite preview --outDir dist-perf --port ${port} --strictPort`, port, reuseExistingServer: !process.env.CI },
  projects: [
    // Pixel 6a: 1080×2400 at 2.625 → 412×915 CSS px
    {
      name: 'pixel6a',
      use: {
        browserName: 'chromium',
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        userAgent: devices['Pixel 7'].userAgent,
      },
    },
    { name: 'iphone12', use: { ...devices['iPhone 12'], browserName: 'chromium' } },
  ],
});
