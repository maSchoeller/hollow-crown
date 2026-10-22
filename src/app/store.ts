/** App state: screens, campaign, running battle, settings. Connects core, persistence and UI. */
import { signal } from '@preact/signals';
import {
  applyCommand,
  beginBattle,
  finishBattle,
  newCampaign,
  type AvatarSettings,
  type BattleResult,
  type BattleSettings,
  type BattleState,
  type CampaignState,
  type Command,
  type GameData,
  type GameEvent,
} from '../core';
import { loadContent } from '../content/browser';
import { lang, setAvatar, setLocales, type Lang } from '../i18n';
import { readSave, writeSave, type SavePayload, type SlotId } from '../persistence/save';

const loaded = loadContent();
export const data: GameData = loaded.data;
setLocales(loaded.locales);

export type Screen =
  | { name: 'title' }
  | { name: 'newGame' }
  | { name: 'worldmap' }
  | { name: 'dialogue'; id: string; next: () => void }
  | { name: 'prep'; node: string }
  | { name: 'battle' }
  | { name: 'result'; result: BattleResult }
  | { name: 'defeat' }
  | { name: 'camp'; tab?: string }
  | { name: 'options'; back: Screen }
  | { name: 'end' };

export const screen = signal<Screen>({ name: 'title' });
export const campaign = signal<CampaignState | null>(null);

export interface BattleSession {
  start: BattleState;
  state: BattleState;
  log: Command[];
}
export const battle = signal<BattleSession | null>(null);

export interface Settings {
  lang: Lang;
  speed: 1 | 2 | 3; // 3 = skip
  enemySpeed: 1 | 2 | 3;
  dangerDefault: boolean;
  confirmForecast: boolean;
  quality: 'low' | 'mid' | 'high';
  music: number;
  sfx: number;
  keepAwake: boolean;
  shake: boolean;
}

const SETTINGS_KEY = 'hc.settings';
function loadSettings(): Settings {
  const def: Settings = {
    lang: navigator.language?.startsWith('de') ? 'de' : 'en',
    speed: 1,
    enemySpeed: 2,
    dangerDefault: false,
    confirmForecast: true,
    quality: 'mid',
    music: 0.6,
    sfx: 0.8,
    keepAwake: true,
    shake: true,
  };
  try {
    return { ...def, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>) };
  } catch {
    return def;
  }
}
export const settings = signal<Settings>(loadSettings());
lang.value = settings.value.lang;
export function updateSettings(p: Partial<Settings>): void {
  settings.value = { ...settings.value, ...p };
  if (p.lang) lang.value = p.lang;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value));
  } catch {
    /* private mode */
  }
}

const nowIso = (): string => new Date().toISOString();

export async function autosave(where: SavePayload['screen']): Promise<void> {
  const c = campaign.value;
  if (!c) return;
  const b = battle.value;
  const payload: SavePayload = { campaign: c, screen: where, battle: b && where === 'battle' ? { start: b.start, commands: b.log } : undefined };
  await writeSave('auto', payload, nowIso()).catch((e) => console.warn('autosave failed', e));
}

export async function saveSlot(slot: SlotId): Promise<void> {
  const c = campaign.value;
  if (!c) return;
  await writeSave(slot, { campaign: c, screen: 'camp' }, nowIso());
}

function applyCampaign(c: CampaignState): void {
  campaign.value = c;
  setAvatar(c.avatar.name, c.avatar.pronoun);
}

export function startNewGame(settingsIn: BattleSettings, avatar: AvatarSettings): void {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const c = newCampaign(data, seed, settingsIn, avatar);
  applyCampaign(c);
  battle.value = null;
  void autosave('worldmap');
  playNode(data.campaign.start);
}

/** Restores a save: replays a running battle's command log (concept/13 acceptance 8). */
export async function loadSlot(slot: SlotId): Promise<boolean> {
  const rec = await readSave(slot);
  if (!rec) return false;
  restore(rec.payload);
  return true;
}

export function restore(p: SavePayload): void {
  applyCampaign(p.campaign);
  if (p.battle) {
    let s = p.battle.start;
    for (const cmd of p.battle.commands) s = applyCommand(data, s, cmd).state;
    battle.value = { start: p.battle.start, state: s, log: [...p.battle.commands] };
    screen.value = { name: 'battle' };
  } else {
    battle.value = null;
    screen.value = p.screen === 'camp' ? { name: 'camp' } : { name: 'worldmap' };
  }
}

export function nodeDef(id: string) {
  return data.campaign.nodes.find((n) => n.id === id)!;
}

/** World map → pre dialogue → preparation. */
export function playNode(nodeId: string): void {
  const node = nodeDef(nodeId);
  const toPrep = () => (screen.value = { name: 'prep', node: nodeId });
  if (node.pre) screen.value = { name: 'dialogue', id: node.pre, next: toPrep };
  else toPrep();
}

export function startBattle(nodeId: string, deploy: string[]): GameEvent[] {
  const c = campaign.value!;
  const r = beginBattle(data, c, nodeId, deploy);
  battle.value = { start: r.state, state: r.state, log: [] };
  screen.value = { name: 'battle' };
  void autosave('battle');
  return r.events;
}

/** Executes a player command. Returns events for the board to play. */
export function command(cmd: Command): GameEvent[] {
  const b = battle.value!;
  const r = applyCommand(data, b.state, cmd);
  battle.value = { ...b, state: r.state, log: [...b.log, cmd] };
  void autosave('battle');
  return r.events;
}

/** Restart the current round (Standard/Casual) or the whole mission. */
export function restartBattle(fromRound: boolean): void {
  const b = battle.value;
  if (!b) return;
  let log = b.log;
  if (fromRound) {
    const last = log.map((c) => c.type).lastIndexOf('endPhase');
    log = last >= 0 ? log.slice(0, last + 1) : [];
  } else log = [];
  let s = b.start;
  for (const cmd of log) s = applyCommand(data, s, cmd).state;
  battle.value = { start: b.start, state: s, log };
  screen.value = { name: 'battle' };
  void autosave('battle');
}

/** Battle ended: apply results, show outro and result screen. */
export function concludeBattle(): void {
  const b = battle.value!;
  const c = campaign.value!;
  if (b.state.outcome !== 'victory') {
    screen.value = { name: 'defeat' };
    return;
  }
  const { campaign: next, result } = finishBattle(data, c, b.state);
  applyCampaign(next);
  battle.value = null;
  void autosave('camp');
  const node = nodeDef(b.state.nodeId);
  const toResult = () => (screen.value = { name: 'result', result });
  if (node.post) screen.value = { name: 'dialogue', id: node.post, next: toResult };
  else toResult();
}

export function setCampaign(c: CampaignState): void {
  applyCampaign(c);
  void autosave('camp');
}

export function setFlag(flag: string): void {
  const c = campaign.value;
  // battle state stays untouched so replays remain pure; choices only happen outside battles
  if (c && !c.flags.includes(flag)) campaign.value = { ...c, flags: [...c.flags, flag] };
}

/** Dev helper: lets the simulator play the current battle (manual testing only). */
if (import.meta.env.DEV) {
  void import('../core/ai/autoplay').then(({ autoCommand }) => {
    (window as unknown as { __hc: unknown }).__hc = {
      autoStep: () => command(autoCommand(data, battle.value!.state)),
      autoWin: () => {
        for (let i = 0; i < 3000 && battle.value && !battle.value.state.outcome; i++) command(autoCommand(data, battle.value.state));
        concludeBattle();
      },
      campaign,
      battle,
      screen,
    };
  });
}
