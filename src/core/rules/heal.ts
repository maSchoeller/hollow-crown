import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { BattleState, BattleUnit, ItemInstance } from '../state';
import { active, dist, isAlly } from '../util';
import { itemDef } from './items';
import { computeStats } from './stats';

/** What staff healing of `u` on `target` does: shared by the preview and the resolution (story 10.4). */
export interface StaffHeal {
  /** the target first, then every further ally the heal reaches (Bischof `healRadius`), with the HP each gains */
  heals: Array<{ uid: string; amount: number }>;
  /** EXP of the healer: `experience.heal` plus `experience.healExtraTarget` for each further ally healed */
  exp: number;
  /** radius around the target the heal reaches (0 without `healRadius`) */
  radius: number;
}

/** The staff a heal uses: the chosen one, else the first staff the unit carries (equipped first). */
export function healStaff(data: GameData, u: BattleUnit, staffUid?: string): ItemInstance | undefined {
  const carried = [u.equip.mainHand, ...u.bag];
  return (staffUid ? carried.find((i) => i?.uid === staffUid) : undefined) ?? carried.find((i) => !!i && itemDef(data, i).kind === 'staff');
}

/** Tiles a staff heal of `u` on `targetUid` reaches (the preview of the heal area, from `staffHeal`). */
export function healTiles(data: GameData, s: BattleState, u: BattleUnit, targetUid: string): Pos[] {
  const target = s.units.find((o) => o.uid === targetUid);
  const staff = healStaff(data, u);
  if (!target || !staff) return [];
  return staffHeal(data, s, u, target, staff)
    .heals.map((h) => s.units.find((o) => o.uid === h.uid)?.pos)
    .filter((p): p is Pos => !!p);
}

export function staffHeal(data: GameData, s: BattleState, u: BattleUnit, target: BattleUnit, staff: ItemInstance): StaffHeal {
  const b = data.balance;
  const st = computeStats(data, u, { state: s });
  const power = (itemDef(data, staff).heal ?? 0) + st.stats.mag + st.skills.healBonus;
  const gain = (o: BattleUnit) => Math.max(0, Math.min(computeStats(data, o).maxHp - o.hp, power));
  const heals = [{ uid: target.uid, amount: gain(target) }];
  const radius = st.skills.healRadius;
  if (radius > 0 && target.pos) {
    for (const o of s.units) {
      if (o.uid === target.uid || o.uid === u.uid || !active(o) || !o.pos || !isAlly(o.team, u.team)) continue;
      if (dist(o.pos, target.pos) > radius) continue;
      const amount = gain(o);
      if (amount > 0) heals.push({ uid: o.uid, amount });
    }
  }
  return { heals, exp: b.experience.heal + b.experience.healExtraTarget * (heals.length - 1), radius };
}
