import { CORE_ROLES } from '../core/defs';
import type { GameData } from '../core/gameData';
import { groupAllowed } from '../core/rules/items';
import { findNode } from '../core/campaign/acts';
import { ballistaItemIssues } from './validateBallista';
import type { ContentRefs, Err } from './validateRefs';

/** Classes, roles, fog, items, the tavern, companions and sets. */
export function validateUnits(data: GameData, err: Err, { item, conditions, battleDialogue }: ContentRefs, itemImages?: Set<string>): void {
  for (const c of Object.values(data.classes)) {
    if (c.skill && !data.skills[c.skill]) err('classes.yaml', `${c.id}: unknown skill ${c.skill}`);
    // pro skills (story 10.3): only on pro classes, `pro_` skills of source class
    for (const id of c.proSkills ?? []) {
      if (c.tier !== 'pro') err('classes.yaml', `${c.id}: proSkills only on pro classes`);
      const sk = data.skills[id];
      if (!sk) err('classes.yaml', `${c.id}: unknown pro skill ${id}`);
      else if (!id.startsWith('pro_') || sk.source !== 'class') err('classes.yaml', `${c.id}: pro skill ${id} needs the prefix pro_ and source: class`);
    }
    if (c.tier === 'pro') {
      const base = data.classes[c.role];
      // the role a pro path comes from: a base role, or the unique role of Avatar and Lucan (story 10.3)
      if (!base || base.tier === 'pro' || !base.proPaths.includes(c.id)) err('classes.yaml', `${c.id}: pro class must be a proPath of its base role ${c.role}`);
    }
    if (c.tier !== 'pro') {
      for (const p of c.proPaths) {
        const target = data.classes[p];
        if (target && (target.tier !== 'pro' || target.role !== c.role)) err('classes.yaml', `${c.id}: proPath ${p} is not a pro class of this role`);
      }
    }
    if (c.playable && !c.classAction) err('classes.yaml', `${c.id}: a playable class needs a classAction`);
  }
  for (const r of CORE_ROLES) {
    const c = data.classes[r];
    if (!c || c.role !== r || c.tier === 'pro') err('classes.yaml', `missing role ${r}`);
  }
  // Nebel (story 2.6): bonuses name roles that exist, blockers name terrain that exists
  for (const r of Object.keys(data.balance.fog.roleBonus)) if (!(CORE_ROLES as readonly string[]).includes(r)) err('balance.yaml', `fog.roleBonus: unknown role ${r}`);
  for (const t of data.balance.fog.blockers) if (!data.terrain[t]) err('balance.yaml', `fog.blockers: unknown terrain ${t}`);
  for (const m of ballistaItemIssues(data)) err('balance.yaml', m);
  for (const it of Object.values(data.items)) {
    // weapons, tomes, staves and shields carry a weapon group (items.md section 4)
    if (['weapon', 'tome', 'staff', 'shield'].includes(it.kind) && !it.group) err('items.yaml', `${it.id}: no weapon group`);
  }
  for (const k of data.balance.economy.tavern.classes) {
    if (!data.classes[k.class]) err('balance.yaml', `tavern: unknown class ${k.class}`);
    for (const id of k.items) item('balance.yaml', { def: id }, `tavern ${k.class}`);
    conditions('balance.yaml', k.requires, `tavern ${k.class}.requires`);
  }
  for (const ch of Object.values(data.chars)) {
    if (!data.classes[ch.class]) err('units.yaml', `${ch.id}: unknown class ${ch.class}`);
    // chapters that are not built yet (ch03 ff.) may name scenes that are still to be written
    if (ch.recruit && findNode(data, ch.recruit.chapter)) battleDialogue('units.yaml', ch.recruit.dialogue, `${ch.id} recruit.dialogue`);
    if (ch.personalSkill && !data.skills[ch.personalSkill]) err('units.yaml', `${ch.id}: unknown skill ${ch.personalSkill}`);
    ch.items.forEach((r) => {
      item('units.yaml', r, ch.id);
      const d = data.items[r.def];
      const cls = data.classes[ch.class];
      if (d && cls && !groupAllowed(cls, d)) err('units.yaml', `${ch.id}: ${cls.id} cannot carry ${d.id} (group ${d.group})`);
    });
  }
  for (const it of Object.values(data.items)) {
    if (it.grantsSkill && !data.skills[it.grantsSkill.skill]) err('items.yaml', `${it.id}: unknown skill ${it.grantsSkill.skill}`);
    if (it.setId && !data.sets[it.setId]) err('items.yaml', `${it.id}: unknown set ${it.setId}`);
    // every item (runes included) is shown as its painted image (concept/25-ux/DESIGN.md item-image, story 8.5)
    const image = it.image ?? it.id;
    if (itemImages && !itemImages.has(image)) err(it.kind === 'rune' ? 'runes.yaml' : 'items.yaml', `${it.id}: no image art/items/${image}.png`);
  }
  for (const s of Object.values(data.sets)) {
    for (const p of s.pieces) if (!data.items[p]) err('sets.yaml', `${s.id}: unknown piece ${p}`);
  }
}
