/**
 * Reference profile and targets of the performance run (story 7.5, NFR1, NFR2; story 7.7). Desktop Chromium imitates the
 * reference phones by throttling: the CPU slowdown follows the usual mobile setting of Lighthouse, the network a good 4G
 * line. Real devices are measured by hand per act release (architecture §10); these numbers make regressions visible.
 */
export const PROFILE = {
  /** CPU slowdown of the cold start and the first visit (Emulation.setCPUThrottlingRate, NFR2) */
  cpuSlowdown: 4,
  /**
   * Enemy phase of the large battle at two throttling levels with the FPS target of each (story 7.7, NFR1). Both targets
   * are the same budget of about 8.3 ms thread CPU per frame without throttling (60 FPS at 2×, 30 FPS at 4×).
   * `PERF_STAGES=1,2,4` adds levels without a target (1× shows the CPU cost per frame the least disturbed by the host).
   */
  stages: [
    { cpuSlowdown: 2, fps: 60 },
    { cpuSlowdown: 4, fps: 30 },
  ] as ReadonlyArray<{ cpuSlowdown: number; fps: number | null }>,
  network: { latencyMs: 60, downloadKbps: 9000, uploadKbps: 1500 },
} as const;

export const TARGETS = {
  /** a frame slower than this counts as dropped (1.5 frames at 60 FPS) */
  droppedFrameMs: 25,
  /** story 7.8: no single frame of the enemy phase is slower than this, at any throttling level, in any run (GPU runs only) */
  maxFrameMs: 100,
  /** frames slower than this get a trace entry with their cause in the bench (story 7.8) */
  traceMs: 50,
  /** NFR2: cold start of the installed app until the title answers */
  coldStartMs: 5000,
  /** NFR3: the enemy phase takes at most this long per enemy unit (`pnpm bench:ai`, story 2.8) */
  aiMsPerUnit: 300,
} as const;
