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
    if (c.tier === 'pro' && c.playable && !(c.proSkills?.length)) err('classes.yaml', `${c.id}: a playable pro class needs 1–2 proSkills`);
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
  validateRecipes(data, err, itemImages);
  validateHeritage(data, err);
  for (const s of Object.values(data.sets)) {
    for (const p of s.pieces) if (!data.items[p]) err('sets.yaml', `${s.id}: unknown piece ${p}`);
  }
}

/** Workshop recipes (story 10.6): the item exists (items.yaml or runes.yaml), every material is `kind: material` with a painted image. */
export function validateRecipes(data: GameData, err: Err, itemImages?: Set<string>): void {
  for (const r of Object.values(data.recipes)) {
    if (!data.items[r.item]) err('recipes.yaml', `${r.id}: unknown item ${r.item}`);
    if (!Object.keys(r.materials).length) err('recipes.yaml', `${r.id}: needs at least one material`);
    for (const m of Object.keys(r.materials)) {
      const d = data.items[m];
      if (!d) err('recipes.yaml', `${r.id}: unknown material ${m}`);
      else if (d.kind !== 'material') err('recipes.yaml', `${r.id}: ${m} is not a material`);
      else if (itemImages && !itemImages.has(d.image ?? d.id)) err('recipes.yaml', `${r.id}: material ${m} has no image art/items/${d.image ?? d.id}.png`);
    }
  }
}

/** Roles with lessons (story 10.7): the seven core roles, without the single roles of avatar and Lucan. */
export const HERITAGE_ROLES: readonly string[] = CORE_ROLES.filter((r) => r !== 'tactician' && r !== 'captain');

/**
 * Lessons of the memorial hall (story 10.7): every core role has exactly two, each a passive skill (no action, no uses) with
 * `source: heritage` and every such skill is a lesson; a fixed stone's `heritage` is a lesson.
 */
export function validateHeritage(data: GameData, err: Err): void {
  const f = 'heritage.yaml';
  const lessons = new Set<string>();
  for (const role of HERITAGE_ROLES) if (!data.heritage[role]) err(f, `role ${role} has no lessons`);
  for (const h of Object.values(data.heritage)) {
    if (!HERITAGE_ROLES.includes(h.role)) err(f, `${h.role}: not a core role`);
    for (const id of h.lessons) {
      if (lessons.has(id)) err(f, `${h.role}: lesson ${id} is listed twice`);
      lessons.add(id);
      const sk = data.skills[id];
      if (!sk) err(f, `${h.role}: unknown skill ${id}`);
      else if (sk.source !== 'heritage' || !id.startsWith('heritage_')) err(f, `${h.role}: lesson ${id} needs the prefix heritage_ and source: heritage`);
      else if (sk.trigger === 'action' || sk.usesPerMap !== undefined || sk.area) err(f, `${h.role}: lesson ${id} must be passive (no action, uses or area)`);
    }
  }
  for (const sk of Object.values(data.skills)) if (sk.source === 'heritage' && !lessons.has(sk.id)) err('skills.yaml', `${sk.id}: source heritage, but no role lists it in heritage.yaml`);
  for (const m of Object.values(data.memorials)) if (m.heritage && !lessons.has(m.heritage)) err('memorials.yaml', `${m.id}: heritage ${m.heritage} is no lesson of heritage.yaml`);
}
