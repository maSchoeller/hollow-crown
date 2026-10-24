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

/** Longest wait for the new version to take over before the app reloads anyway. */
const INSTALL_TIMEOUT_MS = 8000;

/**
 * Activates the waiting version and reloads the app; `installing` shows the loading screen until the reload happens.
 * The reload does not rely on the plugin's own `controlling` handler (it stays silent for a version found by a manual
 * check): the new worker taking control, or the timeout, reloads the page.
 */
export function installUpdate(): void {
  if (!applyUpdate || updateStatus.value === 'installing') return;
  updateStatus.value = 'installing';
  let reloaded = false;
  const reload = () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
  window.setTimeout(reload, INSTALL_TIMEOUT_MS);
  applyUpdate(true)
    .then(() => registration?.waiting?.postMessage({ type: 'SKIP_WAITING' }))
    .catch(() => {
      reloaded = true;
      updateStatus.value = 'available';
    });
}
