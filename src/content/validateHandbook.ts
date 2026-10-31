import {
  entryAnchors,
  handbookCategoryKey,
  handbookEntryKey,
  handbookLabelKey,
  resolveHandbookRef,
} from '../core/handbook';
import type { GameData } from '../core/defs';
import type { Locales } from './load';

const LANGS = ['de', 'en'];
/** Parts every entry has in both languages; class profiles add at least two lines "stark" and "schwach". */
const ENTRY_PARTS = ['title', 'text', 'where', 'keywords'];
const CLASS_PARTS = ['strong.1', 'strong.2', 'weak.1', 'weak.2'];

/**
 * The handbook (story 14.1): every text in DE and EN, every value path resolves to a number, cross references and
 * context anchors are sound, every terrain and every playable class has its entry, every status and the forecast have a "?",
 * and no handbook text carries digits (numbers come from the values as `{id}`).
 */
export function validateHandbook(data: GameData, locales: Locales, err: (file: string, message: string) => void): void {
  const f = 'handbook.yaml';
  const hb = data.handbook;
  if (!hb) return; // a missing or broken file is already reported by the loader
  const key = (k: string, ctx: string) => {
    for (const lang of LANGS) if (!locales[lang]?.[k]) err(`locales/${lang}`, `${ctx}: missing key ${k}`);
  };
  const cats = new Set<string>();
  for (const c of hb.categories) {
    if (cats.has(c.id)) err(f, `category ${c.id} is listed twice`);
    cats.add(c.id);
    key(handbookCategoryKey(c.id, 'name'), `category ${c.id}`);
    key(handbookCategoryKey(c.id, 'sub'), `category ${c.id}`);
    if (!hb.entries.some((e) => e.category === c.id)) err(f, `category ${c.id} has no entries`);
  }
  const ids = new Set<string>();
  for (const e of hb.entries) {
    if (ids.has(e.id)) err(f, `entry ${e.id} is listed twice`);
    ids.add(e.id);
  }
  const anchors = new Map<string, string>();
  const terrainOf = new Map<string, string>();
  for (const e of hb.entries) {
    const ctx = `entry ${e.id}`;
    if (!cats.has(e.category)) err(f, `${ctx}: unknown category ${e.category}`);
    for (const part of ENTRY_PARTS) key(handbookEntryKey(e.id, part), ctx);
    const valueIds = new Set<string>();
    for (const v of e.values) {
      if (valueIds.has(v.id)) err(f, `${ctx}: value ${v.id} is listed twice`);
      valueIds.add(v.id);
      if (resolveHandbookRef(data, v.ref) === undefined)
        err(f, `${ctx}: value ${v.id}: ${v.ref} does not resolve to a number`);
      key(handbookLabelKey(v), `${ctx} value ${v.id}`);
    }
    for (const s of e.see) {
      if (s === e.id) err(f, `${ctx}: refers to itself`);
      else if (!ids.has(s)) err(f, `${ctx}: unknown cross reference ${s}`);
    }
    for (const a of entryAnchors(e)) {
      const other = anchors.get(a);
      if (other) err(f, `${ctx}: context anchor ${a} is also used by ${other}`);
      else anchors.set(a, e.id);
    }
    for (const id of e.terrain ?? []) {
      if (!data.terrain[id]) err(f, `${ctx}: unknown terrain ${id}`);
      terrainOf.set(id, e.id);
    }
    if (e.class) {
      const cls = data.classes[e.class];
      if (!cls) err(f, `${ctx}: unknown class ${e.class}`);
      else if (!cls.playable) err(f, `${ctx}: class ${e.class} is not playable`);
      for (const part of CLASS_PARTS) key(handbookEntryKey(e.id, part), ctx);
    }
    if (e.lesson && !data.scenes[e.lesson]) err(f, `${ctx}: unknown lesson scene ${e.lesson}`);
    if (e.graphic === 'terrain' && !e.terrain) err(f, `${ctx}: graphic terrain needs a terrain list`);
    if (e.graphic === 'class' && !e.class) err(f, `${ctx}: graphic class needs a class`);
    if (e.graphic === 'lesson' && !e.lesson) err(f, `${ctx}: graphic lesson needs a lesson`);
    // texts: placeholders name a value of the entry (values come from the content)
    for (const lang of LANGS)
      for (const [k, text] of Object.entries(locales[lang] ?? {})) {
        if (!k.startsWith(`handbook.entry.${e.id}.`)) continue;
        for (const m of text.matchAll(/\{([\w.]+)\}/g))
          if (!valueIds.has(m[1]!) && m[1] !== 'avatar' && !m[1]!.startsWith('pronoun.'))
            err(`locales/${lang}`, `${k}: placeholder {${m[1]}} is no value of ${e.id}`);
      }
  }
  // no digit in any handbook text (entries, category subtitles, labels, ui) outside a {placeholder}
  for (const lang of LANGS)
    for (const [k, text] of Object.entries(locales[lang] ?? {}))
      if (k.startsWith('handbook.') && /\d/.test(text.replace(/\{[\w.]+\}/g, '')))
        err(`locales/${lang}`, `${k}: numbers come from values ({id}), not from the text`);
  // every terrain is explained once, every playable class has a profile
  for (const id of Object.keys(data.terrain)) if (!terrainOf.has(id)) err(f, `terrain ${id} has no handbook entry`);
  for (const cls of Object.values(data.classes))
    if (cls.playable && !hb.entries.some((e) => e.class === cls.id))
      err(f, `playable class ${cls.id} has no profile (class entry)`);
  // the "?" of the battle: forecast and every status
  const needed = ['forecast', ...new Set(Object.values(data.balance.element.statusOf).map((s) => `status.${s}`))];
  for (const a of needed) if (!anchors.has(a)) err(f, `no entry has the context anchor ${a}`);
}
