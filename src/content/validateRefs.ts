/** Reference checks shared by the topic validators: items, scenes, flags, chronicle pages, companions, conditions and effects. */
import { type FlagValue, type ItemRef } from '../core/defs';
import type { GameData } from '../core/gameData';
import type { Reward } from '../core/mapDefs';
import type { Condition, Effect } from '../core/storyDefs';
import { flagEntry, UNSUPPORTED_EFFECTS } from '../core/campaign/effects';
import { soleKey, UNSUPPORTED_CONDITIONS } from '../core/campaign/conditions';
import { pairKey } from '../core/util';
import { findNode } from '../core/campaign/acts';

export type Err = (file: string, message: string) => void;
export type ContentRefs = ReturnType<typeof contentRefs>;

/** The checkers bound to `data`; `battleScenes` and `openedQuests` fill up while the validators run. */
export function contentRefs(data: GameData, err: Err) {
  const item = (file: string, ref: ItemRef | undefined, ctx: string) => {
    if (ref && !data.items[ref.def]) err(file, `${ctx}: unknown item ${ref.def}`);
    for (const a of ref?.affixes ?? []) if (!data.affixes[a]) err(file, `${ctx}: unknown affix ${a}`);
    for (const r of ref?.runes ?? []) if (!data.runes[r]) err(file, `${ctx}: unknown rune ${r}`);
  };
  /** scenes that play during a battle (triggers, quotes, talks, rewards): they must not ask for answers */
  const battleScenes = new Set<string>();
  const dialogue = (file: string, id: string | undefined, ctx: string) => {
    if (id && !data.scenes[id]) err(file, `${ctx}: unknown scene ${id}`);
  };
  const battleDialogue = (file: string, id: string | undefined, ctx: string) => {
    if (id) battleScenes.add(id);
    dialogue(file, id, ctx);
  };
  const reward = (file: string, r: Reward | undefined, ctx: string) => {
    if (!r) return;
    item(file, r.item, ctx);
    if (r.chronicle) page(file, r.chronicle, ctx);
    battleDialogue(file, r.dialogue, ctx);
    if (r.recruit && !data.chars[r.recruit]) err(file, `${ctx}: unknown recruit ${r.recruit}`);
    for (const m of Object.keys(r.material ?? {})) if (!data.items[m]) err(file, `${ctx}: unknown material ${m}`);
  };
  // conditions and effects (architecture §5.3): every reference must exist, unfinished keys are refused
  const nodeKnown = (id: string) => !!findNode(data, id) || /^ch\d+$/.test(id);
  const flag = (file: string, ref: string | Record<string, FlagValue>, ctx: string) => {
    const [name, value] = flagEntry(ref);
    const def = data.flags[name];
    if (!def) return void err(file, `${ctx}: undeclared flag ${name} (acts/*/flags.yaml)`);
    if (def.values ? !def.values.includes(value as string | number) : value !== true)
      err(file, `${ctx}: flag ${name} cannot have the value ${String(value)}`);
  };
  const page = (file: string, id: string, ctx: string) => {
    if (!data.chronicle[id]) err(file, `${ctx}: unknown chronicle page ${id} (acts/*/chronicle.yaml)`);
  };
  const companion = (file: string, id: string, ctx: string) => {
    if (!data.chars[id]) err(file, `${ctx}: unknown companion ${id}`);
  };
  const condition = (file: string, cond: Condition, ctx: string): void => {
    const key = soleKey(cond);
    const v = (cond as unknown as Record<string, unknown>)[key];
    if (UNSUPPORTED_CONDITIONS.includes(key)) return void err(file, `${ctx}: condition ${key} is not yet supported`);
    switch (key) {
      case 'flag':
        return flag(file, v as string | Record<string, FlagValue>, ctx);
      case 'alive':
      case 'dead':
      case 'left':
      case 'recruited':
        return companion(file, v as string, ctx);
      case 'completed':
        if (!nodeKnown(v as string)) err(file, `${ctx}: unknown node ${v as string}`);
        return;
      case 'support': {
        const [a, b] = (v as { pair: [string, string] }).pair;
        companion(file, a, ctx);
        companion(file, b, ctx);
        if (!data.supports[pairKey(a, b)]) err(file, `${ctx}: unknown support pair ${a}|${b}`);
        return;
      }
      case 'roomLevel':
        if (!data.rooms[(v as { id: string }).id]) err(file, `${ctx}: unknown room ${(v as { id: string }).id} (core/rooms.yaml)`);
        return;
      case 'met':
        if (!data.lieutenants[v as string]) err(file, `${ctx}: unknown lieutenant ${v as string}`);
        return;
      case 'chronicle':
        if (Array.isArray(v)) for (const id of v as string[]) page(file, id, ctx);
        return;
      case 'any':
        for (const x of v as Condition[]) condition(file, x, ctx);
        return;
      case 'not':
        return condition(file, v as Condition, ctx);
    }
  };
  const conditions = (file: string, conds: Condition | Condition[] | undefined, ctx: string) => {
    if (conds) for (const x of Array.isArray(conds) ? conds : [conds]) condition(file, x, ctx);
  };
  /** an effect that only colours the story: stance points and flags of kind `story` */
  const mereFlavour = (e: Effect) => {
    const key = soleKey(e);
    if (key === 'stance') return true;
    if (key !== 'setFlag') return false;
    return data.flags[flagEntry((e as { setFlag: string | Record<string, FlagValue> }).setFlag)[0]]?.kind === 'story';
  };
  /** side quests some effect opens (`openQuest`) */
  const openedQuests: string[] = [];
  const effects = (file: string, list: Effect[] | undefined, ctx: string) => {
    for (const e of list ?? []) {
      const key = soleKey(e);
      const v = (e as unknown as Record<string, unknown>)[key];
      if (UNSUPPORTED_EFFECTS.includes(key)) err(file, `${ctx}: effect ${key} is not yet supported`);
      else if (key === 'setFlag') flag(file, v as string | Record<string, FlagValue>, ctx);
      else if (key === 'recruit' && typeof v !== 'string') {
        // a lieutenant who changes sides (story 3.7): he must be able to (`joins`) and have a companion definition of his id
        const lt = (v as { lt: string }).lt;
        const def = data.lieutenants[lt];
        if (!def) err(file, `${ctx}: unknown lieutenant ${lt}`);
        else if (!def.joins) err(file, `${ctx}: lieutenant ${lt} does not join (lieutenants.yaml joins is not set)`);
        else if (!data.chars[lt]) err(file, `${ctx}: lieutenant ${lt} has no companion definition in units.yaml`);
      } else if (key === 'recruit' || key === 'leave') {
        companion(file, v as string, ctx);
        if (key === 'recruit' && data.lieutenants[v as string]) err(file, `${ctx}: ${v as string} is a lieutenant, recruit him with recruit: { lt: ${v as string} }`);
      }
      else if (key === 'grudge' || key === 'meet') {
        if (!data.lieutenants[(v as { lt: string }).lt]) err(file, `${ctx}: unknown lieutenant ${(v as { lt: string }).lt}`);
      } else if (key === 'item') item(file, v as ItemRef, ctx);
      else if (key === 'chronicle') page(file, v as string, ctx);
      else if (key === 'openQuest') {
        openedQuests.push(v as string);
        if (findNode(data, v as string)?.kind !== 'side') err(file, `${ctx}: openQuest ${v as string} is not a side quest`);
      }
      else if (key === 'material') for (const m of Object.keys(v as Record<string, number>)) if (!data.items[m]) err(file, `${ctx}: unknown material ${m}`);
    }
  };
  return { item, battleScenes, dialogue, battleDialogue, reward, flag, page, companion, condition, conditions, mereFlavour, openedQuests, effects };
}
