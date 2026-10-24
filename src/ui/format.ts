/** Pure formatting helpers of the campaign view (play time, age of a save); the words live in the locales. */

/** Play time split into whole hours and remaining minutes. */
export function playtimeParts(ms: number): { h: number; m: number } {
  const total = Math.floor(Math.max(0, ms) / 60_000);
  return { h: Math.floor(total / 60), m: total % 60 };
}

export type AgeUnit = 'now' | 'min' | 'hour' | 'day';

/** How long ago something happened, as the largest fitting unit ("now" below a minute). */
export function ageParts(ms: number): { unit: AgeUnit; n: number } {
  const min = Math.floor(Math.max(0, ms) / 60_000);
  if (min < 1) return { unit: 'now', n: 0 };
  if (min < 60) return { unit: 'min', n: min };
  const hours = Math.floor(min / 60);
  if (hours < 48) return { unit: 'hour', n: hours };
  return { unit: 'day', n: Math.floor(hours / 24) };
}
