/**
 * Dev and browser-test hooks of the mission flow (`__hc` in dev builds, `__hcTest` under Playwright): throwaway haunts and
 * story nodes, auto-win and the fault and save-failure switches. Imported once by App.tsx.
 */
import { CoreInvariantError, beginBattle, type MapDef, armyCount, firstNode, makeHaunt, seedRng, storyNodeOf, newCampaign, addToRoster, levelUp, type BattleSettings, type BattleState, type BattleUnit, type GameEvent, filterEvents, visibleState, type Effect, type SceneDef, type FlagDef, type ChroniclePageDef, chronicleTexts, sceneTexts } from '../../core';
import { autosave, campaign, data } from './session';
import { abandonBattle, battle, canAbandon, canRestart, command, pendingEvents, restartBattle } from './battle';
import { reportFault } from './fault';
import { devResetHint, devSaveFailure } from './protection';
import { screen } from './screen';
import { addTexts } from '../../i18n';
import { clone } from '../../core/util';
import { DEV_MAP_ID, devLieutenantMap, devLieutenantNode, fleeSetup, type DevLieutenant } from './devLieutenant';
import { wantedUid } from './wanted';
import { playNode, beginMission, concludeBattle, storyContext, runEffects } from './flow';

/**
 * Puts a haunt on the world map for testing (story 5.6): `devHaunt('m1_1_steckbriefe', 'escort', 'hask')`. Opens an unsaved campaign when none is
 * open, marks the story nodes up to the map's as done, lets the lieutenant have been met and shows the world map with the haunt.
 */
function devHaunt(mapId = 'prologue_paktnacht', variant = 'rout', ltId = 'hask'): string | null {
  campaign.value ??= newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const c = clone(campaign.value);
  const map = data.maps[mapId];
  const anchor = map?.haunts?.find((a) => a.variant === variant);
  const lt = data.lieutenants[ltId];
  const node = storyNodeOf(data, mapId);
  if (!map || !anchor || !lt || !node) return null;
  const upto = data.campaign.nodes.findIndex((n) => n.id === node.id);
  for (const n of data.campaign.nodes.slice(0, upto + 1)) if (n.kind === 'story' && !c.completed.includes(n.id)) c.completed.push(n.id);
  c.lieutenants = { ...c.lieutenants, [ltId]: { met: true, encounters: 1, grudge: 0, routs: 0, signatureDropped: false, ...c.lieutenants?.[ltId] } };
  const id = `dev${c.haunts.length}_${mapId}`;
  const h = makeHaunt(data, c, map, anchor, lt, id, c.day.last ?? 0, seedRng(c.seed + c.haunts.length));
  if (!h) return null;
  c.haunts = [...c.haunts.filter((x) => x.map !== mapId), h];
  campaign.value = c;
  battle.value = null;
  screen.value = { name: 'worldmap' };
  return id;
}

/** Plays the running battle to its end with the simulator's player side and concludes it (manual and browser testing). */
function winBattle(autoCommand: (d: typeof data, s: BattleState) => Parameters<typeof command>[0]): void {
  for (let i = 0; i < 3000 && battle.value && !battle.value.state.outcome; i++) command(autoCommand(data, battle.value.state));
  concludeBattle();
}

/**
 * plays any story node on a throwaway campaign, never the player's slot (saving is switched off, QA note B22): the nodes before it in
 * campaign.yaml count as completed and everyone who has joined by then is in the company, raised to the node's `expectedLevel`. `await __hc.devNode('m1_6')` opens the
 * pre scene, then the battle; win it with `__hc.autoWin()`. Second argument: difficulty (default `normal`).
 */
async function devNode(nodeId: string, difficulty: BattleSettings['difficulty'] = 'normal'): Promise<void> {
  const nodes = data.campaign.nodes;
  const idx = nodes.findIndex((n) => n.id === nodeId);
  if (idx < 0) throw new Error(`no node "${nodeId}"; there are: ${nodes.map((n) => n.id).join(', ')}`);
  devSaveFailure.on = true;
  const c = newCampaign(data, 1, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const order = nodes.map((n) => n.id);
  for (const ch of Object.values(data.chars)) {
    const j = order.indexOf(ch.joins);
    if (j >= 0 && j < idx) addToRoster(data, c, ch.id);
  }
  // everyone is as strong as an army that played its way here would be: raised to the node's expectedLevel with the game's own level-up
  for (const u of c.roster) while (u.level < nodes[idx]!.expectedLevel) levelUp(data, u, c.rng);
  c.completed = order.slice(0, idx);
  campaign.value = c;
  battle.value = null;
  screen.value = { name: 'worldmap' };
  playNode(nodeId);
}

/** Hooks for the browser tests: the production build has no dev helpers, but Playwright sets `navigator.webdriver` (like `__board`). */
if (typeof navigator !== 'undefined' && navigator.webdriver) {
  void import('../../core/ai/autoplay').then(({ autoCommand }) => {
    (window as unknown as { __hcTest: unknown }).__hcTest = { devHaunt, devNode, autoWin: () => winBattle(autoCommand), abandonBattle, canAbandon };
  });
}

/** Dev helper: lets the simulator play the current battle (manual testing only). */
if (import.meta.env.DEV) {
  void import('../../core/ai/autoplay').then(({ autoCommand }) => {
    (window as unknown as { __hc: unknown }).__hc = {
      autoStep: () => command(autoCommand(data, battle.value!.state)),
      autoWin: () => winBattle(autoCommand),
      devHaunt,
      campaign,
      battle,
      screen,
      /** answers a dialogue as the player would: `runEffects([{ setFlag: 'avatar_bold' }])`, queued during a battle */
      runEffects,
      storyContext,
      restartBattle,
      canRestart,
      abandonBattle,
      canAbandon,
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
      devNode,
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
       * default kind: `grudge` for grudge 1+, else `first`). Each lieutenant speaks his line in the speech band when the first player phase begins.
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
       * line (`flee_<routs % 3 + 1>`) in the speech band.
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
