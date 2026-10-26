/** Rules of the deployment screen (story 6.10) as pure functions: the screen only draws what these return. */

export interface DeployToggle {
  chosen: string[];
  /** why nothing changed: a required unit, or no free place left */
  blocked: 'locked' | 'full' | null;
}

/**
 * Taps the switch of a unit: takes it along or leaves it behind. Required units never leave; a unit is not taken when
 * all places are taken. The order of the others stays as chosen.
 */
export function toggleDeploy(chosen: readonly string[], id: string, forced: readonly string[], max: number): DeployToggle {
  if (forced.includes(id)) return { chosen: [...chosen], blocked: 'locked' };
  if (chosen.includes(id)) return { chosen: chosen.filter((x) => x !== id), blocked: null };
  if (chosen.length >= max) return { chosen: [...chosen], blocked: 'full' };
  return { chosen: [...chosen, id], blocked: null };
}

/** The fixed order of the list: required units first, then the company in its own order. */
export function deployOrder<T extends { id: string }>(roster: readonly T[], forced: readonly string[]): T[] {
  return [...roster.filter((r) => forced.includes(r.id)), ...roster.filter((r) => !forced.includes(r.id))];
}
