/**
 * One-time hints of the battle screen (story 16.11: "Gefahr gedrückt halten: Gelände"): once shown, never again. Remembered on the device in
 * localStorage, not in the battle state and not in the settings. Every access is guarded: private windows and blocked storage must not break the battle.
 */
const PREFIX = 'hc.coach.';

/** Whether the hint `id` was shown before (false when storage is not available: then it shows again, harmlessly). */
export function coachSeen(id: string): boolean {
  try {
    return localStorage.getItem(PREFIX + id) === '1';
  } catch {
    return false;
  }
}

/** Remembers that the hint `id` was shown. */
export function markCoachSeen(id: string): void {
  try {
    localStorage.setItem(PREFIX + id, '1');
  } catch {
    // storage blocked: the hint may come back, nothing else
  }
}
