import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';
import { abandonPrepare, watchFirstInstall } from './state/prepare';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'installing' | 'current' | 'error';

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
      watchFirstInstall(reg);
    },
    onRegisterError: () => abandonPrepare(),
    onNeedRefresh: () => {
      if (updateStatus.value !== 'installing') updateStatus.value = 'available';
    },
  });
}

/** Asks the server for a newer version; resolves into `available`, `current` or `error`. */
export async function checkForUpdate(): Promise<void> {
  if (updateStatus.value === 'available' || updateStatus.value === 'installing') return;
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

/** Activates the waiting version and reloads the app; `installing` shows the loading screen until the reload happens. */
export function installUpdate(): void {
  if (!applyUpdate || updateStatus.value === 'installing') return;
  updateStatus.value = 'installing';
  applyUpdate(true).catch(() => {
    updateStatus.value = 'available';
  });
}
