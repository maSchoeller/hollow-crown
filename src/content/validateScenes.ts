import { MAX_PANEL_LINES, PERMANENT_COMPANIONS } from '../core/defs';
import type { GameData } from '../core/gameData';
import { decisionTitleKey, lineKey, memorialKey, optionKey, speakerTeam, summaryKey } from '../core/campaign/scene';
import { BARK_LINES } from './barkLines';
import type { Locales } from './load';
import type { ContentRefs, Err } from './validateRefs';

/** Fixed support pairs (story 4.9): known companions, S only for core pairs, as many as the season has. */
export function validateSupports(data: GameData, err: Err, { companion, dialogue }: ContentRefs): void {
  const pairs = Object.values(data.supports);
  for (const p of pairs) {
    for (const id of p.pair) companion('supports.yaml', id, `pair ${p.key}`);
    if (p.pair[0] === p.pair[1]) err('supports.yaml', `pair ${p.key}: a companion cannot be its own partner`);
    if (p.talks.S && !p.core) err('supports.yaml', `pair ${p.key}: only core pairs reach S`);
    for (const [rank, id] of Object.entries(p.talks)) dialogue('supports.yaml', id, `pair ${p.key} talk ${rank}`);
  }
  const s = data.balance.supports;
  if (pairs.length > s.seasonPairs) err('supports.yaml', `${pairs.length} support pairs, the season has ${s.seasonPairs}`);
  if (pairs.filter((p) => p.core).length > s.corePairs) err('supports.yaml', `${pairs.filter((p) => p.core).length} core pairs, the season has ${s.corePairs}`);
}

/** Scenes (architecture §5.8): speaker chains, conditions, effects, texts in both languages, box length. */
export function validateScenes(data: GameData, locales: Locales, err: Err, { conditions, effects, battleScenes, mereFlavour }: ContentRefs, placeImages?: Set<string>): void {
  const MAX_BOX = 110;
  // enemies and lieutenants cannot die for good in the story sense, so their chains need no fallback (decision 2026-10-24)
  const isEnemy = (id: string) => speakerTeam(data, id) === 'enemy' || !!data.chars[id]?.flags.includes('enemy');
  const chain = (f: string, c: readonly string[], ctx: string, mustEnd: boolean) => {
    for (const id of c) if (!data.chars[id] && !locales.de?.[`unit.${id}.name`]) err(f, `${ctx}: unknown speaker ${id}`);
    if (mustEnd && !c.every(isEnemy) && !PERMANENT_COMPANIONS.includes(c[c.length - 1]!)) err(f, `${ctx}: speaker chain must end with avatar or lucan (or the line needs fallback: skip)`);
  };
  const text = (f: string, key: string, de: string, ctx: string) => {
    if (de.length > MAX_BOX) err(f, `${ctx}: de text longer than ${MAX_BOX} characters (${de.length})`);
    const en = locales.en?.[key];
    if (!en) err(f, `${ctx}: missing en text ${key}`);
    else if (en.length > MAX_BOX) err(f, `${ctx}: en text longer than ${MAX_BOX} characters (${en.length})`);
  };
  for (const sc of Object.values(data.scenes)) {
    const f = `scenes/${sc.id}`;
    // the dialogue backdrop is a place image (story 8.7)
    if (sc.background && placeImages && !placeImages.has(sc.background)) err(f, `background: no place image art/mockups/locations-s1/${sc.background}.png`);
    const seen = new Set<string>();
    // barks (story 9.13): only the six moments, one bubble page each in both languages
    const bark = sc.id.startsWith('scn.bark.');
    // illustration panels: a panel lasts until `panel: none`, the next panel or the end of the scene, at most MAX_PANEL_LINES text lines
    {
      let open: string | null = null;
      let count = 0;
      for (const l of sc.lines) {
        if ('choice' in l) continue;
        if (l.panel !== undefined) {
          open = l.panel === 'none' ? null : l.id;
          count = 0;
        }
        if (open) {
          count++;
          if (count === MAX_PANEL_LINES + 1) err(f, `${l.id}: the panel of line ${open} lasts longer than ${MAX_PANEL_LINES} text lines (end it with panel: none)`);
        }
        if (l.panel !== undefined && l.panel !== 'none' && placeImages && !placeImages.has(l.panel)) err(f, `${l.id}: panel: no place image art/mockups/locations-s1/${l.panel}.png`);
        if (bark && l.panel !== undefined) err(f, `${l.id}: a bark scene has no panel`);
      }
    }
    for (const l of sc.lines) {
      const ctx = `${l.id}`;
      if (seen.has(l.id)) err(f, `${ctx}: duplicate line id`);
      seen.add(l.id);
      conditions(f, l.requires, ctx);
      if ('choice' in l) {
        if (battleScenes.has(sc.id)) err(f, `${ctx}: scenes shown in a battle cannot have answers`);
        if (bark) err(f, `${ctx}: a bark scene has no answers`);
        const ids = new Set<string>();
        for (const o of l.choice) {
          if (ids.has(o.id)) err(f, `${ctx}: duplicate answer id ${o.id}`);
          if (o.id === 'title') err(f, `${ctx}: answer id title is reserved for the decision title`);
          ids.add(o.id);
          effects(f, o.effects, `${ctx}.${o.id}`);
          text(f, optionKey(sc.id, l.id, o.id), o.text, `${ctx}.${o.id}`);
          // only the decisions have mechanical consequences (narrative): anything beyond stance and story flags needs a title
          if (!l.title && (o.effects ?? []).some((e) => !mereFlavour(e))) err(f, `${ctx}.${o.id}: an answer with consequences belongs to a decision (title)`);
          if (o.summary && !l.title) err(f, `${ctx}.${o.id}: summary belongs to a decision (title)`);
          if (l.title) {
            if (!o.summary) err(f, `${ctx}.${o.id}: a decision answer needs a summary (consequence card title)`);
            else text(f, summaryKey(sc.id, l.id, o.id), o.summary, `${ctx}.${o.id}.summary`);
          }
        }
        if (l.title) text(f, decisionTitleKey(sc.id, l.id), l.title, `${ctx}.title`);
        continue;
      }
      if (l.speaker) chain(f, l.speaker, ctx, l.fallback !== 'skip');
      else if (l.memorial) err(f, `${ctx}: a memorial line needs a speaker chain`);
      if (bark) {
        const who = sc.id.slice('scn.bark.'.length);
        if (!data.chars[who] && !locales.de?.[`unit.${who}.name`]) err(f, `${ctx}: bark scene for unknown character ${who}`);
        if (l.speaker?.length !== 1 || l.speaker[0] !== who) err(f, `${ctx}: bark speaker chain must be exactly [${who}]`);
        if (!(BARK_LINES as readonly string[]).includes(l.id)) err(f, `${ctx}: bark line id must be one of ${BARK_LINES.join(', ')}`);
        const max = data.balance.scene.bubbleMaxChars;
        const en = locales.en?.[lineKey(sc.id, l.id)];
        if (l.text.length > max) err(f, `${ctx}: de bark longer than ${max} characters (${l.text.length})`);
        if (en && en.length > max) err(f, `${ctx}: en bark longer than ${max} characters (${en.length})`);
      }
      text(f, lineKey(sc.id, l.id), l.text, ctx);
      if (l.memorial) {
        chain(f, l.memorial.speaker, `${ctx}.memorial`, true);
        text(f, memorialKey(sc.id, l.id), l.memorial.text, `${ctx}.memorial`);
      }
    }
  }
}
