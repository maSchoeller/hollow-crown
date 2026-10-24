/**
 * Core invariant violations (concept/24-architecture §6.1): the controller catches them, remembers the first
 * one and the app shows "Etwas ist schiefgelaufen". A leaf module (only the log), so state modules can use it.
 */
import { signal } from '@preact/signals';
import { CoreInvariantError } from '../../core';
import { log } from '../log';

/** The error that stopped the game; `null` while all is well. The first one stays (later ones are follow-ups). */
export const fault = signal<unknown>(null);

export function reportFault(e: unknown): void {
  log.error('core', e instanceof Error ? e.message : String(e), e);
  if (fault.value === null) fault.value = e;
}

export function clearFault(): void {
  fault.value = null;
}

/**
 * Runs `fn`; a `CoreInvariantError` becomes the fault and `fallback` is returned, so the caller leaves the
 * state as it was. Other errors pass through.
 */
export function guarded<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof CoreInvariantError) {
      reportFault(e);
      return fallback;
    }
    throw e;
  }
}

/** Invariant violations that escape the controller (timers, board code, promises) end up here too. */
export function installFaultListeners(): void {
  window.addEventListener('error', (ev) => {
    if (ev.error instanceof CoreInvariantError) reportFault(ev.error);
    else log.error('ui', ev.message || 'uncaught error', ev.error);
  });
  window.addEventListener('unhandledrejection', (ev) => {
    if (ev.reason instanceof CoreInvariantError) reportFault(ev.reason);
    else log.error('ui', 'unhandled rejection', ev.reason);
  });
}
