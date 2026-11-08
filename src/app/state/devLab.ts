/**
 * Testlabor M1 in the browser (dev build only, imported on demand from devHooks): `await __hc.lab('boss-gegenschlag')` or the URL
 * parameter `?lab=boss-gegenschlag` opens the battle of `tests/fixtures/lab/<name>.yaml`, built by the same loader as `pnpm lab`
 * (src/lab/scenario.ts), on a throwaway campaign without scenes. Saving is switched off, as with `__hc.devMap`.
 */
import { buildLab, LabError } from '../../lab/scenario';
import { battle, pendingEvents } from './battle';
import { devSaveFailure } from './protection';
import { screen } from './screen';
import { campaign, data } from './session';

const scenarios = import.meta.glob('../../../tests/fixtures/lab/*.yaml');
const maps = import.meta.glob(['../../../tests/fixtures/maps/*.yaml', '../../../concept/27-ueberarbeitung/levels/*.yaml'], { eager: false });

const nameOf = (f: string) => /([^/]+)\.yaml$/.exec(f)![1]!;

/** Opens the scenario `name`; throws with the list of scenarios (or of the valid ids) when something does not fit. */
export async function openLab(name: string): Promise<void> {
  const load = scenarios[`../../../tests/fixtures/lab/${name}.yaml`];
  if (!load) throw new LabError(`no lab scenario "${name}"; there are: ${Object.keys(scenarios).map(nameOf).join(', ')}`);
  const raw = ((await load()) as { default: unknown }).default;
  // the loader asks for a fixture map synchronously: the scenario names it, so it is loaded first
  const mapId = (raw as { map?: unknown }).map;
  const fixtures: Record<string, unknown> = {};
  const file = Object.keys(maps).find((f) => nameOf(f) === mapId);
  if (file && typeof mapId === 'string' && !data.maps[mapId]) fixtures[mapId] = ((await maps[file]!()) as { default: unknown }).default;
  const r = buildLab(data, raw, (id) => fixtures[id], `${name}.yaml`);
  devSaveFailure.on = true;
  campaign.value = r.campaign;
  // the board builds itself when the battle screen opens: leave it first, so a lab opened during a battle shows the new situation
  battle.value = null;
  screen.value = { name: 'worldmap' };
  await Promise.resolve();
  battle.value = { start: r.state, state: r.state, log: [], effects: [] };
  pendingEvents.value = [];
  screen.value = { name: 'battle' };
}

/** `?lab=<name>` in the address opens that scenario once the app is up. */
export function labFromUrl(search: string): void {
  const name = new URLSearchParams(search).get('lab');
  if (name) void openLab(name).catch((e: unknown) => console.error(e));
}
