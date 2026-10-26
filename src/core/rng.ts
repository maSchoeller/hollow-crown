/**
 * Seeded RNG (sfc32). The whole state is four uint32 numbers so it serialises as plain JSON.
 * Every random decision in the core draws from a state's RNG in a fixed order (concept/10 §4).
 */
export type RngState = [number, number, number, number];

export function seedRng(seed: number): RngState {
  // splitmix32 to spread a small integer seed over the four words
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
  const st: RngState = [next(), next(), next(), next()];
  for (let i = 0; i < 12; i++) nextFloat(st);
  return st;
}

/** Deterministic 32-bit hash of two integers (e.g. campaign seed and day number) to seed a separate stream with `seedRng`. */
export function hash32(a: number, b: number): number {
  let h = Math.imul((a ^ 0x9e3779b9) | 0, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13) ^ (b | 0), 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  return (h ^ (h >>> 13)) >>> 0;
}

/** Advances the state in place and returns a float in [0, 1). */
export function nextFloat(st: RngState): number {
  let [a, b, c, d] = st;
  a >>>= 0;
  b >>>= 0;
  c >>>= 0;
  d >>>= 0;
  const t = (((a + b) >>> 0) + d) >>> 0;
  d = (d + 1) >>> 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) >>> 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) >>> 0;
  st[0] = a >>> 0;
  st[1] = b;
  st[2] = c;
  st[3] = d;
  return t / 4294967296;
}

/** Integer in [0, n). */
export function nextInt(st: RngState, n: number): number {
  return Math.floor(nextFloat(st) * n);
}

/** Percent roll with one random number: true if roll < chance. */
export function roll1(st: RngState, chancePercent: number): boolean {
  return nextFloat(st) * 100 < chancePercent;
}

/** Smoothed two-number roll (2RN): average of two draws (concept/03 §3). */
export function roll2(st: RngState, chancePercent: number): boolean {
  return ((nextFloat(st) + nextFloat(st)) / 2) * 100 < chancePercent;
}

export function pick<T>(st: RngState, list: readonly T[]): T {
  if (list.length === 0) throw new Error('pick from empty list');
  return list[nextInt(st, list.length)]!;
}
