import { useEffect, useErrorBoundary } from 'preact/hooks';
import { Scene } from './screens/Scene';
import { audio } from './audio';
import { Battle } from './screens/Battle';
import { Camp } from './screens/Camp';
import { Prep } from './screens/Prep';
import { FaultScreen, SaveNotices } from './screens/Fault';
import { Campaigns, NewCampaign } from './screens/Campaigns';
import { Troop } from './screens/Troop';
import { Chronicle } from './screens/Chronicle';
import { Wanted } from './screens/Wanted';
import { Licenses } from './screens/Licenses';
import { Options, Title } from './screens/Menus';
import { HandbookScreen, HandbookSheet } from './screens/Handbook';
import { Defeat, Result } from './screens/Result';
import { Farewell } from './screens/Farewell';
import { WorldMap } from './screens/WorldMap';
import { MissionLoading, PrepareScreen, UpdateScreen } from './screens/Loading';
import { updateStatus } from './update';
import { data } from './state/session';
import { nodeDef } from './state/flow';
import './state/devHooks';
import { missionLoad } from './state/loading';
import { prepare } from './state/prepare';
import { battle, battleRun } from './state/battle';
import { dropBoard } from './state/boardKeep';
import { fault, reportFault } from './state/fault';
import { screen, type Screen } from './state/screen';
import { settings } from './state/settings';
import { lang, t } from '../i18n';

/** Keeps the screen awake during play where supported (concept/09 §5 option). */
function useWakeLock(): void {
  useEffect(() => {
    let lock: { release(): Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } };
    const req = async () => {
      if (!settings.value.keepAwake || !nav.wakeLock || document.visibilityState !== 'visible') return;
      try {
        lock = await nav.wakeLock.request('screen');
      } catch {
        lock = null;
      }
    };
    void req();
    const onVis = () => void req();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      void lock?.release();
    };
  }, []);
}

/** Root: the screens, the save notices, and the fault screen over everything (render errors end up there too). */
export function App() {
  const [renderError, resetRenderError] = useErrorBoundary(reportFault);
  const failed = fault.value !== null;
  useEffect(() => {
    if (renderError && !failed) resetRenderError();
  }, [renderError, failed]);
  return (
    <>
      {!renderError && (updateStatus.value === 'installing' ? <UpdateScreen /> : prepare.value.phase === 'off' ? <Screens /> : <PrepareScreen />)}
      {!renderError && <HandbookSheet />}
      <SaveNotices />
      {failed && <FaultScreen />}
    </>
  );
}

/** Screens after which the battle board can come back unchanged (options, licenses from there, a mission's loading). */
const KEEPS_BOARD = new Set<Screen['name']>(['battle', 'options', 'licenses', 'handbook', 'loading']);

function Screens() {
  void lang.value; // re-render on language change
  useWakeLock();
  const sc = screen.value;
  useEffect(() => {
    if (sc.name === 'title' || sc.name === 'campaigns' || sc.name === 'newGame') audio.music('title');
    else if (sc.name === 'worldmap') audio.music('worldmap');
    else if (sc.name === 'result' || sc.name === 'camp') audio.music('camp');
    else if (sc.name === 'dialogue') {
      const cue = data.scenes[sc.id]?.music;
      if (cue) audio.music(cue);
    }
  }, [sc.name, sc.name === 'dialogue' ? sc.id : '']);
  // the board waits behind the options and the loading of a mission start; any other screen has no use for it
  useEffect(() => {
    if (!KEEPS_BOARD.has(sc.name)) dropBoard();
  }, [sc.name]);
  switch (sc.name) {
    case 'title':
      return <Title />;
    case 'campaigns':
      return <Campaigns />;
    case 'newGame':
      return <NewCampaign />;
    case 'worldmap':
      return <WorldMap />;
    case 'dialogue':
      return (
        <Scene key={sc.id} id={sc.id} rewards={sc.rewards} onDone={sc.next} />
      );
    case 'prep':
      return <Prep node={sc.node} from={sc.from ?? 'worldmap'} haunt={sc.haunt} />;
    case 'loading':
      return <MissionLoading title={missionLoad.value ? t(nodeDef(missionLoad.value.node).titleKey) : ''} />;
    case 'battle':
      return battle.value ? <Battle key={battleRun.value} /> : <WorldMap />;
    case 'result':
      return <Result result={sc.result} />;
    case 'farewell':
      return <Farewell result={sc.result} index={sc.index} then={sc.then} />;
    case 'defeat':
      return <Defeat />;
    case 'camp':
      return <Camp tab={sc.tab} unit={sc.unit} />;
    case 'troop':
      return <Troop from={sc.from} />;
    case 'wanted':
      return <Wanted unit={sc.unit} from={sc.from} />;
    case 'chronicle':
      return <Chronicle from={sc.from} />;
    case 'options':
      return <Options back={sc.back} />;
    case 'licenses':
      return <Licenses back={sc.back} />;
    case 'handbook':
      return <HandbookScreen back={sc.back} />;
  }
}
