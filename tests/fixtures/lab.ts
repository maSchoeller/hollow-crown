/**
 * Testlabor M1 in Vitest: `labState(data, 'boss-gegenschlag')` builds the battle of `tests/fixtures/lab/<name>.yaml` (or of a path)
 * with the same loader as `pnpm lab` and `__hc.lab`. Registers a fixture map in `data` when the scenario names one.
 */
import type { GameData } from '../../src/core';
import { labFromFile } from '../../src/lab/node';
import type { LabResult } from '../../src/lab/scenario';

export function labState(data: GameData, name: string): LabResult {
  return labFromFile(data, name);
}

export { labAttack, labEnemyPhase, labPath, labPlay, labUnit } from '../../src/lab/queries';
