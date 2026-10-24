import { useEffect, useErrorBoundary } from 'preact/hooks';
import { t } from '../i18n';
import { asset } from '../ui/components';
import { Dialogue } from '../ui/Dialogue';
import { Icon } from '../ui/icons';
import { audio } from './audio';
import { Battle } from './screens/Battle';
import { Camp, Prep } from './screens/Camp';
import { FaultScreen, SaveNotices } from './screens/Fault';
import { Campaigns, NewCampaign } from './screens/Campaigns';
import { Troop } from './screens/Troop';
import { Options, Result, Title } from './screens/Menus';
import { WorldMap } from './screens/WorldMap';
import { MissionLoading, PrepareScreen } from './screens/Loading';
import { campaign, data } from './state/session';
import { nodeDef, runEffects, storyContext } from './state/flow';
import { missionLoad } from './state/loading';
import { prepare } from './state/prepare';
import { battle, canRestart, restartBattle } from './state/battle';
import { fault, reportFault } from './state/fault';
import { screen } from './state/screen';
import { settings } from './state/settings';
import { lang } from '../i18n';

function Defeat() {
  const b = battle.value;
  return (
    <div class="screen title-screen" style={{ justifyContent: 'center' }}>
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('backgrounds/bg_varnhold_burning.webp')})` }} />
      <div class="logo" style={{ fontSize: 'clamp(40px, 11vw, 64px)' }}>
        {t('ui.defeat.title')}
      </div>
      <div class="tagline">{t('ui.defeat.text')}</div>
      <div class="title-menu">
        {b && canRestart('turn') && (
          <button class="btn primary big" onClick={() => restartBattle('turn')}>
            {t('ui.battle.restartRound')}
          </button>
        )}
        {b && canRestart('mission') && (
          <button class={`btn ${canRestart('turn') ? '' : 'primary big'}`} onClick={() => restartBattle('mission')}>
            <Icon name="restart" />
            {t('ui.battle.restartMission')}
          </button>
        )}
        <button class="btn" onClick={() => (screen.value = { name: 'title' })}>
          <Icon name="home" />
          {t('ui.battle.toTitle')}
        </button>
      </div>
    </div>
  );
}

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
      {!renderError && (prepare.value.phase === 'off' ? <Screens /> : <PrepareScreen />)}
      <SaveNotices />
      {failed && <FaultScreen />}
    </>
  );
}

function Screens() {
  void lang.value; // re-render on language change
  useWakeLock();
  const sc = screen.value;
  useEffect(() => {
    if (sc.name === 'title' || sc.name === 'campaigns' || sc.name === 'newGame') audio.music('title');
    else if (sc.name === 'worldmap') audio.music('worldmap');
    else if (sc.name === 'result' || sc.name === 'camp') audio.music('camp');
    else if (sc.name === 'dialogue') {
      const cue = data.dialogues[sc.id]?.music;
      if (cue) audio.music(cue);
    }
  }, [sc.name, sc.name === 'dialogue' ? sc.id : '']);
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
        <Dialogue
          key={sc.id}
          data={data}
          id={sc.id}
          ctx={storyContext()}
          avatarPortrait={campaign.value?.avatar.portrait ?? 'avatar_a'}
          onEffects={runEffects}
          onDone={sc.next}
        />
      );
    case 'prep':
      return <Prep node={sc.node} from={sc.from ?? 'worldmap'} />;
    case 'loading':
      return <MissionLoading title={missionLoad.value ? t(nodeDef(missionLoad.value.node).titleKey) : ''} />;
    case 'battle':
      return battle.value ? <Battle /> : <WorldMap />;
    case 'result':
      return <Result result={sc.result} />;
    case 'defeat':
      return <Defeat />;
    case 'camp':
      return <Camp tab={sc.tab} />;
    case 'troop':
      return <Troop from={sc.from} />;
    case 'options':
      return <Options back={sc.back} />;
  }
}
