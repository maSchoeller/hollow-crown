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

/** The service worker registration; `getRegistration` covers a check that runs before the plugin reports it. */
async function currentRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  return registration ?? (await navigator.serviceWorker?.getRegistration());
}

/** Resolves once a worker that is still downloading its files has either finished installing or failed. */
function settled(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      if (worker.state === 'installing') return;
      worker.removeEventListener('statechange', done);
      resolve();
    };
    worker.addEventListener('statechange', done);
    done();
  });
}

/**
 * Asks the server for a newer version; resolves into `available`, `current` or `error`.
 * `available` means a version is installed and waiting: a version that is still downloading counts as `checking`, as
 * the install button could not activate it yet (the app would reload into the old version and offer it again).
 */
export async function checkForUpdate(): Promise<void> {
  if (updateStatus.value === 'available' || updateStatus.value === 'installing') return;
  updateStatus.value = 'checking';
  try {
    const reg = await currentRegistration();
    if (reg) {
      if (!reg.waiting) {
        await reg.update();
        if (reg.installing) await settled(reg.installing);
      }
      // onNeedRefresh may have fired while the check ran.
      if (updateStatus.value !== 'checking') return;
      updateStatus.value = reg.waiting ? 'available' : 'current';
    } else {
      updateStatus.value = 'current';
    }
  } catch {
    if (updateStatus.value === 'checking') updateStatus.value = 'error';
  }
}

/** Longest wait for the new version to take over before the app gives up on the install. */
const INSTALL_TIMEOUT_MS = 8000;

/**
 * Activates the waiting version and reloads the app; `installing` shows the loading screen until the reload happens.
 * The reload does not rely on the plugin's own `controlling` handler (it stays silent for a version found by a manual
 * check): the new worker taking control reloads the page. If it has not taken over after the timeout, the version is
 * still waiting and the button comes back: a reload would only start the old version again.
 */
export function installUpdate(): void {
  if (!applyUpdate || updateStatus.value === 'installing') return;
  updateStatus.value = 'installing';
  let finished = false;
  const reload = () => {
    if (finished) return;
    finished = true;
    window.location.reload();
  };
  const fail = () => {
    if (finished) return;
    finished = true;
    navigator.serviceWorker.removeEventListener('controllerchange', reload);
    updateStatus.value = 'available';
  };
  navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
  window.setTimeout(() => (registration?.waiting ? fail() : reload()), INSTALL_TIMEOUT_MS);
  applyUpdate(true)
    .then(() => registration?.waiting?.postMessage({ type: 'SKIP_WAITING' }))
    .catch(fail);
}
