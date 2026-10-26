/**
 * Mission flow: the glue between campaign, battle and screens. Starting and restoring games, camp →
 * dialogue → battle → result, story conditions and effects. Also wires the auto-save to the live app state.
 */
import {
  CoreInvariantError,
  applyCommand,
  armyCount,
  armyOverLimit,
  beginBattle,
  conditionContext,
  firstNode,
  nodeScenes,
  createBattle,
  withoutLeavers,
  newCampaign,
  queuedFlags,
  validateEffects,
  flattenQueued,
  type ArmyOver,
  type AvatarSettings,
  type BattleSettings,
  type BattleState,
  type BattleUnit,
  type ConditionContext,
  type GameEvent,
  filterEvents,
  visibleState,
  type CampaignEvent,
  type Effect,
  type MapUnitDef,
  type ResolvedOption,
  type SceneDef,
  type FlagDef,
  type MapDef,
  type ChroniclePageDef,
  chronicleTexts,
  sceneTexts,
} from '../../core';
import type { SaveRecord, SlotId } from '../../persistence/save';
import {
  adoptRecord,
  autosave,
  bindLive,
  campaign,
  campaignCommand,
  createNewCampaign,
  data,
  deleteCampaignData,
  readSlot,
  storeImportedRecord,
} from './session';
import { battle, canRestart, command, pendingEvents, restartBattle, startBattle } from './battle';
import { fault, reportFault } from './fault';
import { devResetHint, devSaveFailure } from './protection';
import { screen, type From, type Screen } from './screen';
import { log } from '../log';
import { addTexts } from '../../i18n';
import { clone } from '../../core/util';
import { DEV_MAP_ID, devLieutenantMap, devLieutenantNode, fleeSetup, type DevLieutenant } from './devLieutenant';
import { loadManifest } from '../../render/shared/assets';
import { laterMusicAssets, missionAssets, placePath, type MissionUnit } from '../loading/plan';
import { ensureMissionAssets, ensureMissionPack, prefetchQuietly } from './loading';
import { packNeededFor } from './packs';
import { settings } from './settings';
import { wantedUid } from './wanted';
import { dayNumber } from '../day';

bindLive(() => ({
  where: battle.value ? 'battle' : screen.value.name === 'camp' ? 'camp' : 'worldmap',
  battle: battle.value ? { start: battle.value.start, commands: battle.value.log, effects: battle.value.effects } : null,
}));

export function nodeDef(id: string) {
  return data.campaign.nodes.find((n) => n.id === id)!;
}

/** Default deployment: forced units first, then the company in roster order up to the map's limit. */
export function defaultDeploy(nodeId: string): string[] {
  const c = campaign.value!;
  const map = data.maps[nodeDef(nodeId).map]!;
  const list = map.deploy.forced.filter((id) => c.roster.some((r) => r.id === id));
  for (const r of c.roster) if (list.length < map.deploy.max && !list.includes(r.id)) list.push(r.id);
  return list;
}

/**
 * World map → pre dialogue → battle (U20). The preparation screen only appears when asked for or when
 * there is a real choice (more company members than deployment slots); `from` is where its back stone leads.
 */
/** The company is over its limits (story 3.7): no mission starts until mercenaries have been dismissed. The screens show the same check. */
export const armyBlocksMission = (): ArmyOver | null => (campaign.value ? armyOverLimit(data, campaign.value) : null);

export function playNode(nodeId: string, opts: { prep?: boolean; from?: From } = {}): void {
  if (armyBlocksMission()) return;
  const node = nodeDef(nodeId);
  // map and dialogues of later missions come with their act pack (story 7.2): wait for it on the loading screen
  const pack = packNeededFor(node);
  if (pack) {
    const back: Screen = opts.from === 'camp' ? { name: 'camp' } : { name: 'worldmap' };
    void ensureMissionPack({ node: nodeId, place: placePath(node.place ?? data.campaign.defaultPlace), pack, back }).then((ok) => {
      if (ok) playNode(nodeId, opts);
    });
    return;
  }
  const map = data.maps[node.map]!;
  const choice = campaign.value!.roster.length > map.deploy.max;
  const go = () => {
    if (opts.prep || choice) screen.value = { name: 'prep', node: nodeId, from: opts.from };
    else void beginMission(nodeId, defaultDeploy(nodeId), opts.from === 'camp' ? { name: 'camp' } : { name: 'worldmap' });
  };
  const { pre } = nodeScenes(data, campaign.value, nodeId);
  if (pre) screen.value = { name: 'dialogue', id: pre, next: go };
  else go();
}

const defSource = (d: MapUnitDef): MissionUnit => ({
  portrait: d.portrait ?? d.char,
  sprite: d.sprite ?? d.char,
  classId: d.class,
  gearItems: d.items.map((i) => i.def),
});

/** A unit on the board as the loading plan sees it: its figure and the weapons it has in hand. */
const battleSource = (u: BattleUnit): MissionUnit => ({
  portrait: u.portrait,
  sprite: u.sprite,
  charId: u.charId,
  classId: u.classId,
  gearItems: [u.equip.mainHand?.def, u.equip.offHand?.def].filter((x): x is string => !!x),
});

/**
 * Makes sure the on-demand files of a battle are there (place image, figures and their weapon models), with the
 * loading screen when something is missing. Resolves `false` when the player left it with the back stone.
 */
async function ensureBattleAssets(nodeId: string, units: readonly BattleUnit[], back: Screen): Promise<boolean> {
  const node = nodeDef(nodeId);
  const map = data.maps[node.map]!;
  const later = [...map.reinforcements.flatMap((r) => r.units), ...map.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : [])))];
  const manifest = await loadManifest().catch(() => ({}) as Awaited<ReturnType<typeof loadManifest>>);
  const place = placePath(node.place ?? data.campaign.defaultPlace);
  const paths = missionAssets({
    units: [...units.map(battleSource), ...later.map(defSource)],
    models: manifest.models?.units,
    unitPacks: manifest.models?.unitPacks,
    figures: settings.value.figures,
    sprites: manifest.units,
    music: manifest.audio,
    weaponModels: manifest.models?.weapons,
    items: data.items,
    gear: data.render.gear,
    classes: data.classes,
    place: node.place,
    defaultPlace: data.campaign.defaultPlace,
  });
  const ok = await ensureMissionAssets({ node: nodeId, place, paths, back });
  // camp and world map music come after the battle: fetch it in the background while the player is busy
  if (ok) prefetchQuietly(laterMusicAssets(manifest.audio));
  return ok;
}

/**
 * Starts the battle of a node with the chosen units. Places and unit models load on demand (decision 2026-10-24); when
 * some are not cached yet, the loading screen shows until they are there (story 7.6), then the battle starts by itself.
 * `back` is where the loading screen's back stone leads.
 */
export async function beginMission(nodeId: string, deploy: string[], back: Screen): Promise<void> {
  if (armyBlocksMission()) return;
  const start = createBattle(data, campaign.value!, nodeId, deploy);
  if (!(await ensureBattleAssets(nodeId, start.units, back))) return;
  pendingEvents.value = startBattle(nodeId, deploy);
}

/** Starts a new campaign and plays its first node. Resolves `false` when the campaign limit is reached. */
export async function startNewGame(settingsIn: BattleSettings, avatar: AvatarSettings): Promise<boolean> {
  if (!(await createNewCampaign(settingsIn, avatar))) return false;
  battle.value = null;
  playNode(firstNode(data).id);
  return true;
}

/**
 * Before a save with a running battle is restored: the battle's act pack must be registered, or the map to replay on is
 * missing (story 7.2). Shows the loading screen while it loads; resolves `false` when the player left it.
 */
export async function ensureRecordContent(rec: SaveRecord): Promise<boolean> {
  const nodeId = rec.payload.battle?.start.nodeId;
  const node = nodeId ? data.campaign.nodes.find((n) => n.id === nodeId) : undefined;
  const pack = node ? packNeededFor(node) : null;
  if (!node || !pack) return true;
  return ensureMissionPack({ node: node.id, place: placePath(node.place ?? data.campaign.defaultPlace), pack, back: { name: 'title' } });
}

/** Restores a slot of a campaign (default: the active one): replays a running battle's command log (concept/13 acceptance 8). */
export async function loadSlot(slot: SlotId, id?: string | null): Promise<boolean> {
  const rec = await readSlot(slot, id);
  if (!rec) return false;
  if (!(await ensureRecordContent(rec))) return true;
  restore(rec);
  return true;
}

/** Imports an exported save and makes it the active campaign. Resolves `false` when that would exceed three campaigns. */
export async function importRecord(rec: SaveRecord): Promise<boolean> {
  if (!(await storeImportedRecord(rec))) return false;
  if (!(await ensureRecordContent(rec))) return true;
  restore(rec, 'import');
  return true;
}

/** Deletes a campaign with all its saves; when it is the active one, its battle goes too. */
export async function removeCampaign(id: string): Promise<void> {
  if (await deleteCampaignData(id)) battle.value = null;
}

export function restore(rec: SaveRecord, reason: 'load' | 'import' = 'load'): void {
  const p = adoptRecord(rec, reason);
  if (p.battle) {
    let s = p.battle.start;
    try {
      for (const cmd of p.battle.commands) s = applyCommand(data, s, cmd).state;
    } catch (e) {
      // the saved battle no longer replays; surface it, let the caller decide (recovery shows the fault screen again)
      reportFault(e);
      throw e;
    }
    battle.value = { start: p.battle.start, state: s, log: [...p.battle.commands], effects: p.battle.effects ?? [] };
    void showRestoredBattle(s);
  } else {
    battle.value = null;
    screen.value = { name: 'worldmap' }; // the world map is the hub (story 5.3), also on "Continue"
  }
}

/**
 * A restored running battle goes through the same loading as a new one (story 7.6): the board only shows once its place
 * image, figures and weapon models are there. Leaving the loading screen drops the restored battle (the save stays).
 */
async function showRestoredBattle(s: BattleState): Promise<void> {
  const mine = battle.value;
  let ok = true;
  try {
    ok = await ensureBattleAssets(s.nodeId, s.units, { name: 'title' });
  } catch (e) {
    log.warn('core', 'loading the assets of a restored battle failed', e);
  }
  if (battle.value !== mine) return; // something else took over while loading
  if (ok) screen.value = { name: 'battle' };
  else battle.value = null;
}

/** Battle ended: apply results, show outro and result screen. */
export function concludeBattle(): void {
  const b = battle.value!;
  if (b.state.outcome !== 'victory') {
    screen.value = { name: 'defeat' };
    return;
  }
  const before = campaign.value;
  const r = campaignCommand({ type: 'finishMission', start: b.start, commands: b.log, effects: b.effects });
  if (!r.ok) {
    // the battle stays as it is; the fault screen takes over (an invariant violation has reported itself already)
    if (fault.value === null) reportFault(new CoreInvariantError('finish_mission_rejected', { node: b.state.nodeId, reason: r.error }));
    return;
  }
  battle.value = null;
  autosave('worldmap'); // campaignCommand saved while the battle was still running; the finished one must not be resumable
  const result = r.events.find((e) => e.t === 'missionFinished')!.result;
  // the memorial variant is decided before the battle's deaths count (the trigger fell before the quest, not in it)
  const { post } = nodeScenes(data, before, b.state.nodeId);
  // whoever left in the scene after the mission (an answer with `leave`) is no longer in the company: not a new member, no level-up line
  const toResult = () => (screen.value = { name: 'result', result: withoutLeavers(result, campaign.value) });
  if (post) screen.value = { name: 'dialogue', id: post, next: toResult };
  else toResult();
}

/** What conditions in dialogues and the camp read: the running campaign (or an empty story). */
export function storyContext(): ConditionContext {
  // flags set by answers earlier in this battle count although they are only queued (see `runEffects`)
  const b = inBattle();
  return conditionContext(data, campaign.value, b ? queuedFlags(b.effects) : {});
}

/** Whether the running campaign has seen scene `id` (a scene read before is shown as skippable whole). */
export const isSceneSeen = (id: string): boolean => campaign.value?.scenesSeen.includes(id) ?? false;

/** Records that scene `id` was seen to the end or skipped (idempotent; a record only, no story state). */
export function markSceneSeen(id: string): void {
  if (!isSceneSeen(id)) campaignCommand({ type: 'markSceneSeen', scene: id });
}

function inBattle() {
  return screen.value.name === 'battle' ? battle.value : null;
}

/**
 * Effects of a dialogue answer. Outside a battle they run at once through the campaign journal. During a battle they
 * wait in the battle session (with the number of commands played so far) and run with `finishMission`: a restart
 * drops the ones that fired in the discarded part, a defeat drops all (architecture §5.3). Battle state stays untouched.
 */
export function runEffects(effects: Effect[]): void {
  const b = inBattle();
  if (!b) {
    campaignCommand({ type: 'effects', effects });
    return;
  }
  const c = campaign.value;
  // like an immediate run, an answer the rules refuse is dropped now, so it cannot stop the mission from finishing later
  const error = c ? validateEffects(data, c, [...flattenQueued(b.effects), ...effects]) : 'not_available';
  if (error) {
    log.warn('core', `dialogue effects refused: ${error}`, effects);
    return;
  }
  battle.value = { ...b, effects: [...b.effects, { at: b.log.length, effects }] };
  autosave('battle');
}

/**
 * The player's answer to a choice (story 4.6). Outside a battle it is the campaign command `choose` (effects, stance,
 * the decision in the chronicle). Battle scenes have no answers (content:check); should one ever come up, only its
 * effects wait for the end of the battle as before.
 */
export function chooseAnswer(scene: string, line: string, option: ResolvedOption): void {
  if (inBattle()) return runEffects(option.effects);
  const r = campaignCommand({ type: 'choose', scene, line, option: option.id });
  if (!r.ok) log.warn('core', `answer refused: ${r.error}`, { scene, line, option: option.id });
}

/** Answers given before in scene `id`: line id → option id (a choice is never asked twice). */
export function answeredIn(id: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(campaign.value?.choices ?? {})) if (k.startsWith(`${id}#`)) out[k.slice(id.length + 1)] = v;
  return out;
}

/**
 * Sends `advanceDay` when a new day began since the last one the campaign knows (story 5.4): on opening the world map and
 * when the app comes back to it. Returns the `dayAdvanced` event, or null when the day is not new (nothing is journaled).
 */
export function advanceToToday(now = Date.now()): Extract<CampaignEvent, { t: 'dayAdvanced' }> | null {
  const c = campaign.value;
  if (!c) return null;
  const day = dayNumber(now, data.balance.day.resetHour);
  if (c.day.last !== null && day <= c.day.last) return null;
  const r = campaignCommand({ type: 'advanceDay', day });
  if (!r.ok) return null;
  return (r.events.find((e) => e.t === 'dayAdvanced') as Extract<CampaignEvent, { t: 'dayAdvanced' }> | undefined) ?? null;
}

/** Dev helper: lets the simulator play the current battle (manual testing only). */
if (import.meta.env.DEV) {
  void import('../../core/ai/autoplay').then(({ autoCommand }) => {
    (window as unknown as { __hc: unknown }).__hc = {
      autoStep: () => command(autoCommand(data, battle.value!.state)),
      autoWin: () => {
        for (let i = 0; i < 3000 && battle.value && !battle.value.state.outcome; i++) command(autoCommand(data, battle.value.state));
        concludeBattle();
      },
      campaign,
      battle,
      screen,
      /** answers a dialogue as the player would: `runEffects([{ setFlag: 'ch02_hold' }])`, queued during a battle */
      runEffects,
      storyContext,
      restartBattle,
      canRestart,
      /** fault screen: an invalid battle command hits applyCommand's invariant check (or a plain fault outside battle) */
      crash: () =>
        battle.value
          ? command({ type: 'move', unit: 'nobody', to: [0, 0] })
          : reportFault(new CoreInvariantError('dev_test', { note: 'triggered with __hc.crash()' })),
      /** save-failed banner: `failSaves(true)` makes auto-saves fail until `failSaves(false)` */
      failSaves: (on = true) => {
        devSaveFailure.on = on;
        if (campaign.value) autosave(battle.value ? 'battle' : 'camp');
      },
      /**
       * plays a fixture map of `tests/fixtures/maps/<id>.yaml` (default `dev_fog`, story 2.6) with the loaded campaign's company:
       * `await __hc.devMap()`. Saving is switched off for the battle (`failSaves`), so no real save is overwritten. The files are
       * imported on demand and exist in the dev build only; a new fixture map is picked up by its file name.
       */
      devMap: async (id = 'dev_fog') => {
        const c = campaign.value;
        if (!c) throw new Error('load a campaign first');
        const files = import.meta.glob('../../../tests/fixtures/maps/*.yaml');
        const load = files[`../../../tests/fixtures/maps/${id}.yaml`];
        if (!load) throw new Error(`no fixture map "${id}"; there are: ${Object.keys(files).map((f) => /([^/]+)\.yaml$/.exec(f)![1]).join(', ')}`);
        const { mapSchema } = await import('../../content/schemas');
        const raw = ((await load()) as { default: unknown }).default;
        data.maps[id] = { ...mapSchema.parse(raw), act: 1 } as MapDef;
        if (!data.campaign.nodes.some((n) => n.id === id)) data.campaign.nodes.push({ ...data.campaign.nodes[0]!, id, map: id, pre: undefined, post: undefined });
        devSaveFailure.on = true;
        const r = beginBattle(data, c, id, []);
        r.state.lockedRoles = []; // every role's class action works on a fixture map
        battle.value = { start: r.state, state: r.state, log: [], effects: [] };
        pendingEvents.value = r.events;
        screen.value = { name: 'battle' };
      },
      /** home-screen hint again, as after a first save */
      showHomeHint: devResetHint,
      /**
       * plays a scene registered at run time (decisions and consequence card without story content): `devScene(scene,
       * flags)` adds the scene, its flags and its German texts (also as English), then shows it over the world map
       */
      devScene: (scene: SceneDef, flags: FlagDef[] = []) => {
        data.scenes[scene.id] = scene;
        for (const f of flags) data.flags[f.id] = f;
        addTexts('de', sceneTexts(scene));
        addTexts('en', sceneTexts(scene));
        screen.value = { name: 'dialogue', id: scene.id, next: () => (screen.value = { name: 'worldmap' }) };
      },
      /**
       * the end of the act without Level-Design (story 7.3): adds a `fixed: finale` node to the running content when the act has
       * none (run time only, no file), marks the finale as done and shows the world map with the backup sheet and, without a
       * pack of the next act in the build, the "coming soon" stone
       */
      devActEnd: () => {
        const c = campaign.value;
        if (!c) return;
        let finale = data.campaign.nodes.find((n) => n.fixed === 'finale');
        if (!finale) {
          const first = firstNode(data);
          const { map, titleKey, merchantTier, expectedLevel } = first;
          finale = { id: 'dev_finale', map, titleKey, kind: 'story', fixed: 'finale', merchantTier, expectedLevel };
          data.campaign.nodes.push(finale);
        }
        const id = finale.id;
        if (!c.completed.includes(id)) campaign.value = { ...c, completed: [...c.completed, id] };
        battle.value = null;
        screen.value = { name: 'worldmap' };
      },
      /**
       * a lieutenant changes sides (story 3.7): `devJoin(view, full)` with view `card` (default: plays a test decision whose answer is
       * `recruit: { lt: grosk }` and shows the consequence card), `troop` (applies the effect, opens his figure), `wanted` (the list of
       * wanted posters with the mark "In der Truppe"), `map` or `camp` (the world map with the army-limit notice and the locked buttons /
       * the home with the tavern: open the tavern station to dismiss a mercenary). `full = true` first fills the company to its limits
       * (20 companions, 6 mercenaries), so he joins into a full army. Starts an unsaved campaign when none is open; Grosk is met with grudge 2.
       */
      devJoin: (view: 'card' | 'troop' | 'wanted' | 'map' | 'camp' = 'card', full = false) => {
        campaign.value ??= newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
        const c = clone(campaign.value);
        c.lieutenants = { ...c.lieutenants, grosk: { met: true, encounters: 2, grudge: 2, target: 'kael', routs: 2, signatureDropped: false } };
        if (full) {
          const proto = c.roster.find((r) => r.id === 'tobin') ?? c.roster[0]!;
          let n = 0;
          while (armyCount(c).companions < data.balance.economy.armyLimit) c.roster.push({ ...clone(proto), id: `stand${n}`, charId: `stand${n++}`, name: `Stand-in ${n}` });
          const names = data.balance.economy.tavern.names;
          for (let m = 0; armyCount(c).mercenaries < data.balance.economy.mercenaryLimit; m++) {
            const { charId: _c, ...rest } = clone(proto);
            c.roster.push({ ...rest, id: `merc${900 + m}`, nameKey: names[m % names.length]!, bag: [], equip: {} });
          }
        }
        // the tavern opens after the third story mission: the camp view needs the first three nodes done
        if (view === 'camp') for (const id of ['prologue', 'm1_1', 'm1_2']) if (!c.completed.includes(id)) c.completed.push(id);
        campaign.value = c;
        const join: Effect[] = [{ recruit: { lt: 'grosk' } }];
        if (view === 'card') {
          const scene: SceneDef = {
            id: 'scn.dev.e3',
            lines: [
              { id: 'l01', speaker: ['kael'], mood: 'neutral', text: 'Der Riese will mit.' },
              { id: 'c01', title: 'Grosk schliesst sich an', choice: [{ id: 'take', stance: 'warm', text: 'Komm mit uns.', summary: 'Grosk schliesst sich an', effects: join }, { id: 'no', stance: 'sober', text: 'Geh deiner Wege.', summary: 'Grosk bleibt zurueck' }] },
            ],
          };
          data.scenes[scene.id] = scene;
          addTexts('de', sceneTexts(scene));
          addTexts('en', sceneTexts(scene));
          screen.value = { name: 'dialogue', id: scene.id, next: () => (screen.value = { name: 'worldmap' }) };
          return;
        }
        runEffects(join);
        screen.value = view === 'troop' ? { name: 'troop', unit: 'grosk', from: 'worldmap' } : view === 'wanted' ? { name: 'wanted', from: 'worldmap' } : view === 'camp' ? { name: 'camp' } : { name: 'worldmap' };
      },
      /** registers a chronicle page at run time (texts as German and English) and finds it: `devPage({ id, act, title, text })` */
      devPage: (page: ChroniclePageDef) => {
        data.chronicle[page.id] = page;
        addTexts('de', chronicleTexts(page));
        addTexts('en', chronicleTexts(page));
        runEffects([{ chronicle: page.id }]);
      },
      /**
       * opens a test battle with lieutenants on the prologue's ground (stories 3.1, 3.3) and sets what the campaign knows of them:
       * `devLieutenant('hask', 2)` or `devLieutenant([['hask', 2, 'brenna'], ['morra', 0, 'kael', 'first'], ['ulvric', 1, 'fenn', 'mock']])`
       * (id, grudge 0-3, target id, default kael; kind `first` = not met yet, `grudge` = met with the grudge, `mock` = the target has fallen;
       * default kind: `grudge` for grudge 1+, else `first`). Each lieutenant speaks his line as a bubble when the first player phase begins.
       * Starts an unsaved campaign when none is open. Tap a lieutenant with grudge 1+ to see the line to his target.
       */
      devLieutenant: async (spec: string | Array<[string, number?, string?, ('first' | 'grudge' | 'mock')?]>, grudge = 0, target = 'kael', kind?: 'first' | 'grudge' | 'mock') => {
        const list: Array<DevLieutenant & { kind: 'first' | 'grudge' | 'mock' }> = (typeof spec === 'string' ? [[spec, grudge, target, kind] as [string, number?, string?, ('first' | 'grudge' | 'mock')?]] : spec).map(([id, g = 0, t = 'kael', k]) => ({
          id,
          grudge: g,
          target: t,
          kind: k ?? (g > 0 ? 'grudge' : 'first'),
        }));
        campaign.value ??= newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
        const c = clone(campaign.value);
        c.lieutenants ??= {};
        for (const l of list) {
          c.lieutenants[l.id] = { met: l.kind !== 'first', encounters: l.kind === 'first' ? 0 : 1, grudge: l.grudge, target: l.target, routs: l.grudge, signatureDropped: false };
          if (l.kind === 'mock') {
            const rec = c.roster.find((r) => r.id === l.target);
            c.roster = c.roster.filter((r) => r.id !== l.target);
            if (!c.fallen.some((f) => f.id === l.target)) c.fallen.push({ id: l.target, nameKey: rec?.nameKey ?? `unit.${l.target}.name`, ...(rec?.name ? { name: rec.name } : {}), node: 'prologue' });
          }
        }
        campaign.value = c;
        const first = data.campaign.nodes.find((n) => n.fixed === 'first')!;
        data.maps[DEV_MAP_ID] = devLieutenantMap(data.maps[first.map]!, data.lieutenants, list.map((l) => l.id), data.maps);
        if (!data.campaign.nodes.some((n) => n.id === DEV_MAP_ID)) data.campaign.nodes.push(devLieutenantNode(first));
        await beginMission(DEV_MAP_ID, c.roster.slice(0, 4).map((u) => u.id), { name: 'worldmap' });
      },
      /**
       * shows the result screen with a bounty (story 3.5): opens the test battle (see `devLieutenant`), has every lieutenant
       * flee for the first company member and wins: `devBounty('hask', 1)` (grudge 1 before the rout: bounty 400), `devBounty('hask', 3)`
       * (3 routs so far: the 4th drops the signature item for sure), `devBounty([['hask', 1], ['morra', 2]])` for two.
       */
      devBounty: async (spec: string | Array<[string, number?]>, grudge = 1) => {
        const list = (typeof spec === 'string' ? [[spec, grudge]] : spec) as Array<[string, number?]>;
        await (window as unknown as { __hc: { devLieutenant: (s: Array<[string, number?]>) => Promise<void> } }).__hc.devLieutenant(list);
        const b = battle.value;
        if (!b) return;
        const flee = (st: typeof b.state) => {
          const by = st.units.find((x) => x.team === 'player')!;
          for (const u of st.units) if (u.lieutenant) Object.assign(u, { gone: 'fled', fledBy: by.uid, pos: null });
        };
        const start = clone(b.start);
        const state = clone(b.state);
        flee(start);
        flee(state);
        battle.value = { ...b, start, state };
        // only the fixed first node is open while nothing is completed, so the test node could not be finished
        const first = data.campaign.nodes.find((n) => n.fixed === 'first')!;
        if (!campaign.value!.completed.includes(first.id)) campaign.value = { ...campaign.value!, completed: [...campaign.value!.completed, first.id] };
        (window as unknown as { __hc: { autoWin: () => void } }).__hc.autoWin();
      },
      /**
       * story 3.2: opens the test battle (see `devLieutenant`) and drives a lieutenant off: `devFlee('hask', 0, 'kael')` (id, routs so far
       * = grudge, target id). He has 1 HP, a company unit stands next to him. With `play = 'preview'` nothing more happens: select the
       * company unit that stands next to him, tap Attack and the lieutenant; the forecast shows "flees"
       * instead of 0. With `play = 'attack'` (default) the attack is played at once: backward jump, smoke, falling pennant and the flee
       * line (`flee_<routs % 3 + 1>`) as a speech bubble.
       */
      devFlee: async (id = 'hask', grudge = 0, target = 'kael', play: 'attack' | 'preview' = 'attack') => {
        await (window as unknown as { __hc: { devLieutenant: (s: string, g: number, t: string) => Promise<void> } }).__hc.devLieutenant(id, grudge, target);
        const b = battle.value;
        const setup = b && fleeSetup(data, b.state, id);
        if (!b || !setup) return;
        battle.value = { ...b, state: play === 'attack' ? setup.seeded : setup.prepared };
        if (play !== 'attack') return;
        type DevBoard = { play: (e: GameEvent[], s: BattleState, p?: readonly BattleUnit[]) => Promise<void>; units: Map<string, unknown>; disposed?: boolean; setState: (s: BattleState) => Promise<void> };
        const lt = setup.seeded.units.find((u) => u.lieutenant === id)!;
        // the board is built when the mission has loaded (slow on a weak machine): wait until it shows the lieutenant, then a moment for the opening lines
        let board: DevBoard | undefined;
        for (let i = 0; i < 300; i++) {
          board = (window as unknown as { __board?: DevBoard }).__board;
          if (board && !board.disposed && board.units.has(lt.uid)) break;
          board = undefined;
          await new Promise((r) => setTimeout(r, 200));
        }
        await board?.setState(setup.seeded); // the board shows the prepared state (the attacker next to him)
        await new Promise((r) => setTimeout(r, 1500));
        const before = battle.value!.state;
        const events = command(setup.cmd);
        const after = battle.value!.state;
        if (board) await board.play(filterEvents(data, after, events, 'player', before), visibleState(data, after, 'player'), after.units);
      },
      /** changes the grudge of a lieutenant in the running test battle: `devGrudge('hask', 3, 'brenna')` */
      devGrudge: (id: string, grudge: number, target?: string) => {
        const b = battle.value;
        if (!b) return;
        const st = clone(b.state);
        const u = st.units.find((x) => x.lieutenant === id);
        if (!u) return;
        u.grudge = grudge;
        if (target) u.grudgeTarget = target;
        battle.value = { ...b, state: st };
      },
      /**
       * opens the wanted poster over the test battle as the long press on a lieutenant would (story 3.6), with his danger zone:
       * `devWantedBattle('hask', 1, 'kael')` (id, grudge 0-3, target id; see `devLieutenant`). Close it with Back or a tap beside.
       */
      devWantedBattle: async (id = 'hask', grudge = 1, target = 'kael') => {
        await (window as unknown as { __hc: { devLieutenant: (s: string, g: number, t: string) => Promise<void> } }).__hc.devLieutenant(id, grudge, target);
        const u = battle.value?.state.units.find((x) => x.lieutenant === id);
        if (u) wantedUid.value = u.uid;
      },
      /**
       * shows the list of the wanted posters with lieutenants the company has met (story 3.6):
       * `devWantedList()` = Hask (grudge 2, target Kael) and Morra (no grudge yet); or
       * `devWantedList([['hask', 2, 'kael'], ['ulvric', 3, 'fenn', true]])` (id, grudge, target id, true = the target has fallen).
       * Starts an unsaved campaign when none is open; tap an entry for the poster.
       */
      devWantedList: (list: Array<[string, number?, string?, boolean?]> = [['hask', 2, 'kael'], ['morra', 0]]) => {
        campaign.value ??= newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
        const c = clone(campaign.value);
        c.lieutenants ??= {};
        for (const [id, grudge = 0, target = 'kael', fallen = false] of list) {
          c.lieutenants[id] = { met: true, encounters: grudge + 1, grudge, routs: grudge, signatureDropped: false, ...(grudge > 0 ? { target } : {}) };
          if (fallen && !c.fallen.some((f) => f.id === target)) {
            const rec = c.roster.find((r) => r.id === target);
            c.roster = c.roster.filter((r) => r.id !== target);
            c.fallen.push({ id: target, nameKey: rec?.nameKey ?? `unit.${target}.name`, ...(rec?.name ? { name: rec.name } : {}), node: 'prologue' });
          }
        }
        campaign.value = c;
        screen.value = { name: 'wanted', from: 'worldmap' };
      },
    };
  });
}
