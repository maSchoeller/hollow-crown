import { describe, expect, it } from 'vitest';
import { firstInstallWorker } from '../../src/app/state/prepare';

describe('firstInstallWorker', () => {
  it('follows the installing worker of a first install', () => {
    expect(firstInstallWorker({ installing: 'a' })).toBe('a');
  });
  it('falls back to a waiting worker when none is active', () => {
    expect(firstInstallWorker({ waiting: 'w' })).toBe('w');
  });
  it('is no first install while a worker is active, even with an update waiting or installing', () => {
    expect(firstInstallWorker({ active: 'x', waiting: 'w' })).toBeNull();
    expect(firstInstallWorker({ active: 'x', installing: 'i' })).toBeNull();
  });
  it('returns null when nothing is installing', () => {
    expect(firstInstallWorker({})).toBeNull();
  });
});
