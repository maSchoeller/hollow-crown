/**
 * Story 16.18: what the armoury screen and the castle's banners work out apart from drawing (no DOM, no Babylon): the stand specs
 * the 3D vault gets, the colour of a stand's ring and the banner colours of the keep. Which pieces stand where comes from `armoryOf`
 * (core); the model and the runes of a piece are the weapon view's (`weaponViewModel.ts`), never a second copy.
 */
import { armoryOf, itemDef, locateItem, relicCtx, relicStageOf, stagedItemDef, type ArmoryStand, type CampaignState, type GameData, type GearRunes, type ItemDef, type ItemInstance, type RelicCtx } from '../../core';
import type { ArmoryStandSpec } from '../../render/items/armory';
import { modelFor } from '../../render/shared/gearModel';
import { stageRunes, weaponStageModel } from './weaponViewModel';

/** The ring/banner colour of a piece: the colour of the rune in its main setting, gold without a rune (A5). */
export function runeColourOf(data: GameData, runes: GearRunes): string {
  const g = data.render.gear.rune;
  return runes.main ? g.colors[runes.main.element] : data.render.armory.banners.gold;
}

/** The runes a stand's piece shows (inserted rune, else the fixed rune of its relic stage). */
export function standRunes(data: GameData, inst: ItemInstance, rc: RelicCtx): GearRunes {
  return stageRunes(data, inst, relicStageOf(rc, inst.def));
}

/** The specs for the 3D vault, one per stand of `armoryOf`, in its order. `imageOf` gives a piece's picture URL (kept out of here: UI code). */
export function armorySpecs(data: GameData, c: CampaignState, imageOf: (d: ItemDef) => string): ArmoryStandSpec[] {
  const rc = relicCtx(data, c);
  const empty = data.render.armory.colors.ringEmpty;
  return armoryOf(data, c).pieces.map((p: ArmoryStand): ArmoryStandSpec => {
    const none = stageRunes(data, { uid: '', def: p.def, upgrade: 0, affixes: [], runes: [] });
    if (p.kind !== 'owned') return { key: `${p.kind}:${p.def}`, empty: true, model: null, image: null, runes: none, ring: empty, worn: false };
    const inst = locateItem(c, p.uid)!.inst;
    const runes = standRunes(data, inst, rc);
    const piece = modelFor(itemDef(data, inst), data.render.gear);
    const stage = stagedItemDef(data, inst, rc);
    return {
      key: p.uid,
      empty: false,
      model: weaponStageModel(data, inst),
      image: imageOf(stage),
      poseKey: piece?.fallback ?? piece?.model,
      runes,
      ring: runeColourOf(data, runes),
      worn: !!p.wearer,
    };
  });
}

/** One banner colour per piece the company owns, in the armoury's order (A5). */
export function bannerColours(data: GameData, c: CampaignState): string[] {
  const rc = relicCtx(data, c);
  const out: string[] = [];
  for (const p of armoryOf(data, c).pieces) {
    if (p.kind !== 'owned') continue;
    const inst = locateItem(c, p.uid)?.inst;
    if (inst) out.push(runeColourOf(data, standRunes(data, inst, rc)));
  }
  return out;
}
