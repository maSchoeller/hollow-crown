/**
 * Reference profile and targets of the performance run (story 7.5, NFR1, NFR2). Desktop Chromium imitates the reference
 * phones by throttling: the CPU slowdown follows the usual mobile setting of Lighthouse, the network a good 4G line.
 * Real devices are measured by hand per act release (architecture §10); these numbers make regressions visible.
 */
export const PROFILE = {
  /** CPU slowdown factor (Emulation.setCPUThrottlingRate) */
  cpuSlowdown: 4,
  network: { latencyMs: 60, downloadKbps: 9000, uploadKbps: 1500 },
} as const;

export const TARGETS = {
  /** NFR1: 60 FPS over a complete enemy phase of the large battle */
  fps: 60,
  /** a frame slower than this counts as dropped (1.5 frames at 60 FPS) */
  droppedFrameMs: 25,
  /** NFR2: cold start of the installed app until the title answers */
  coldStartMs: 5000,
} as const;
