/**
 * Save protection (concept/24-architecture §5.15 "Speicherschutz"): ask the browser not to evict our
 * storage, point once to the home screen, and tell the player when saving fails. Leaf module (log only).
 */
import { signal } from '@preact/signals';
import { log } from '../log';

/** A save failed and no later one has succeeded yet: the banner offers an export. */
export const saveFailed = signal(false);
/** The home-screen hint is waiting to be shown (once per device). */
export const homeHint = signal(false);

const HINT_KEY = 'hc.homeHintSeen';

function hintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Running as an installed app (home screen, standalone window). */
export function isStandalone(): boolean {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

export function noteSaveResult(error?: unknown): void {
  if (error === undefined) {
    saveFailed.value = false;
    return;
  }
  log.error('save', 'auto-save failed', error);
  saveFailed.value = true;
}

let firstSaveDone = false;

/**
 * After the first successful save of the session: `navigator.storage.persist()`, and, when the app is not
 * installed, the home-screen hint (once, remembered in localStorage).
 */
export function afterFirstSave(): void {
  if (firstSaveDone) return;
  firstSaveDone = true;
  if (isStandalone()) return;
  void (async () => {
    try {
      const granted = (await navigator.storage?.persist?.()) ?? false;
      log.info('save', 'storage.persist', { granted });
    } catch (e) {
      log.warn('save', 'storage.persist failed', e);
    }
  })();
  if (!hintSeen()) homeHint.value = true;
}

export function dismissHomeHint(): void {
  homeHint.value = false;
  try {
    localStorage.setItem(HINT_KEY, '1');
  } catch {
    /* private mode: the hint may come again */
  }
}

/** Dev helpers (`window.__hc`): make saves fail, bring the hint back. */
export const devSaveFailure = { on: false };
export function devResetHint(): void {
  firstSaveDone = false;
  try {
    localStorage.removeItem(HINT_KEY);
  } catch {
    /* ignore */
  }
  afterFirstSave();
}
