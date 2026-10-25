import { beforeEach, describe, expect, it, vi } from 'vitest';

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
