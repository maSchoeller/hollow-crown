import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = () => void;

/** A worker double whose state changes can be triggered by the test. */
function worker(state: string) {
  const listeners = new Set<Listener>();
  return {
    state,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
    become(next: string) {
      this.state = next;
      [...listeners].forEach((l) => l());
    },
  };
}

let reg: { waiting?: unknown; installing?: ReturnType<typeof worker>; update: () => Promise<void> };

async function load() {
  vi.resetModules();
  vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => reg } });
  vi.doMock('virtual:pwa-register', () => ({ registerSW: () => async () => {} }));
  vi.doMock('../../src/app/state/prepare', () => ({ abandonPrepare: () => {}, watchFirstInstall: () => {} }));
  return import('../../src/app/update');
}

describe('checkForUpdate', () => {
  beforeEach(() => {
    reg = { update: async () => {} };
  });

  it('reports the newest version when nothing is waiting', async () => {
    const { checkForUpdate, updateStatus } = await load();
    await checkForUpdate();
    expect(updateStatus.value).toBe('current');
  });

  it('offers an update that is already waiting without asking the server again', async () => {
    reg.waiting = {};
    reg.update = vi.fn(async () => {});
    const { checkForUpdate, updateStatus } = await load();
    await checkForUpdate();
    expect(updateStatus.value).toBe('available');
    expect(reg.update).not.toHaveBeenCalled();
  });

  it('keeps searching while the new version is still downloading, and only then offers it', async () => {
    const installing = worker('installing');
    reg.update = async () => {
      reg.installing = installing;
    };
    const { checkForUpdate, updateStatus } = await load();
    const check = checkForUpdate();
    await Promise.resolve();
    await Promise.resolve();
    expect(updateStatus.value).toBe('checking');
    reg.waiting = {};
    installing.become('installed');
    await check;
    expect(updateStatus.value).toBe('available');
  });

  it('settles into current when the downloading version fails', async () => {
    const installing = worker('installing');
    reg.update = async () => {
      reg.installing = installing;
    };
    const { checkForUpdate, updateStatus } = await load();
    const check = checkForUpdate();
    await Promise.resolve();
    await Promise.resolve();
    installing.become('redundant');
    await check;
    expect(updateStatus.value).toBe('current');
  });

  it('reports an error when the check fails', async () => {
    reg.update = async () => {
      throw new Error('offline');
    };
    const { checkForUpdate, updateStatus } = await load();
    await checkForUpdate();
    expect(updateStatus.value).toBe('error');
  });
});

describe('installUpdate', () => {
  let controllerListeners: Set<Listener>;
  let reload: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;
  let applyUpdate: () => Promise<void>;

  async function loadInstalling() {
    vi.resetModules();
    controllerListeners = new Set();
    reload = vi.fn();
    post = vi.fn();
    reg = { update: async () => {}, waiting: { postMessage: post } };
    vi.useFakeTimers();
    vi.stubGlobal('document', { addEventListener: () => {} });
    vi.stubGlobal('window', { location: { reload }, setTimeout, clearTimeout });
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: async () => reg,
        addEventListener: (_: string, l: Listener) => controllerListeners.add(l),
        removeEventListener: (_: string, l: Listener) => controllerListeners.delete(l),
      },
    });
    vi.doMock('virtual:pwa-register', () => ({
      registerSW: (opts: { onRegisteredSW: (url: string, r: unknown) => void }) => {
        opts.onRegisteredSW('', reg);
        return () => applyUpdate();
      },
    }));
    vi.doMock('../../src/app/state/prepare', () => ({ abandonPrepare: () => {}, watchFirstInstall: () => {} }));
    const mod = await import('../../src/app/update');
    mod.initUpdates();
    return mod;
  }

  const takeover = () => [...controllerListeners].forEach((l) => l());

  beforeEach(() => {
    applyUpdate = async () => {};
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reloads when the new worker takes over in time', async () => {
    const { installUpdate, updateStatus } = await loadInstalling();
    installUpdate();
    expect(updateStatus.value).toBe('installing');
    await vi.advanceTimersByTimeAsync(100);
    expect(post).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    takeover();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('offers the button again after the timeout but still reloads when the worker activates late', async () => {
    const { installUpdate, updateStatus } = await loadInstalling();
    installUpdate();
    await vi.advanceTimersByTimeAsync(8000);
    expect(updateStatus.value).toBe('available');
    expect(reload).not.toHaveBeenCalled();
    takeover();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(controllerListeners.size).toBe(0);
  });

  it('does not stack a second listener on a click after the timeout', async () => {
    const { installUpdate, updateStatus } = await loadInstalling();
    installUpdate();
    await vi.advanceTimersByTimeAsync(8000);
    installUpdate();
    expect(updateStatus.value).toBe('installing');
    expect(controllerListeners.size).toBe(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(post).toHaveBeenCalledTimes(2);
    takeover();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('restarts the timeout on the second click', async () => {
    const { installUpdate, updateStatus } = await loadInstalling();
    installUpdate();
    await vi.advanceTimersByTimeAsync(8000);
    installUpdate();
    await vi.advanceTimersByTimeAsync(7000);
    expect(updateStatus.value).toBe('installing');
    await vi.advanceTimersByTimeAsync(1000);
    expect(updateStatus.value).toBe('available');
  });

  it('gives up the listener when applying the update is rejected', async () => {
    applyUpdate = async () => {
      throw new Error('no');
    };
    const { installUpdate, updateStatus } = await loadInstalling();
    installUpdate();
    await vi.advanceTimersByTimeAsync(0);
    expect(updateStatus.value).toBe('available');
    expect(controllerListeners.size).toBe(0);
    await vi.advanceTimersByTimeAsync(8000);
    expect(reload).not.toHaveBeenCalled();
  });
});
