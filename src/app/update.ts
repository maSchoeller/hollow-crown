import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'current' | 'error';

export const updateStatus = signal<UpdateStatus>('idle');

let registration: ServiceWorkerRegistration | undefined;
let applyUpdate: ((reload?: boolean) => Promise<void>) | undefined;

/** Registers the service worker; a new version waits until the player applies it. */
export function initUpdates(): void {
  if (!('serviceWorker' in navigator)) return;
  applyUpdate = registerSW({
    immediate: true,
    onRegisteredSW: (_url, reg) => {
      registration = reg;
    },
    onNeedRefresh: () => {
      updateStatus.value = 'available';
    },
  });
}

/** Asks the server for a newer version; resolves into `available`, `current` or `error`. */
export async function checkForUpdate(): Promise<void> {
  if (updateStatus.value === 'available') return;
  if (!registration) {
    updateStatus.value = 'current';
    return;
  }
  updateStatus.value = 'checking';
  try {
    await registration.update();
    // onNeedRefresh may have fired while the check ran.
    if (updateStatus.value === 'checking') {
      updateStatus.value = registration.installing || registration.waiting ? 'available' : 'current';
    }
  } catch {
    updateStatus.value = 'error';
  }
}

/** Activates the waiting version and reloads the app. */
export function installUpdate(): void {
  void applyUpdate?.(true);
}
