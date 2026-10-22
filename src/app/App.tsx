import { useEffect } from 'preact/hooks';
import { t } from '../i18n';
import { Dialogue } from '../ui/Dialogue';
import { audio } from './audio';
import { Battle } from './screens/Battle';
import { Camp, Prep } from './screens/Camp';
import { EndScreen, NewGame, Options, Result, Title, WorldMap } from './screens/Menus';
import { battle, campaign, data, restartBattle, screen, setFlag, settings } from './store';
import { lang } from '../i18n';

function Defeat() {
  const b = battle.value;
  return (
    <div class="screen title-screen" style={{ justifyContent: 'center' }}>
      <div class="logo" style={{ fontSize: 'clamp(30px, 9vw, 52px)', color: '#f59a8a' }}>
        {t('ui.defeat.title')}
      </div>
      <div class="tagline">{t('ui.defeat.text')}</div>
      <div class="title-menu">
        {b && b.start.settings.deathMode !== 'classic' && (
          <button class="btn primary" onClick={() => restartBattle(true)}>
            ↺ {t('ui.battle.restartRound')}
          </button>
        )}
        <button class="btn" onClick={() => restartBattle(false)}>
          ⟲ {t('ui.battle.restartMission')}
        </button>
        <button class="btn ghost" onClick={() => (screen.value = { name: 'title' })}>
          ⌂ {t('ui.battle.toTitle')}
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

export function App() {
  void lang.value; // re-render on language change
  useWakeLock();
  const sc = screen.value;
  useEffect(() => {
    if (sc.name === 'title' || sc.name === 'newGame') audio.music('title');
    else if (sc.name === 'worldmap') audio.music('worldmap');
  }, [sc.name]);
  switch (sc.name) {
    case 'title':
      return <Title />;
    case 'newGame':
      return <NewGame />;
    case 'worldmap':
      return <WorldMap />;
    case 'dialogue':
      return (
        <Dialogue
          key={sc.id}
          data={data}
          id={sc.id}
          flags={campaign.value?.flags ?? []}
          avatarPortrait={campaign.value?.avatar.portrait ?? 'avatar_a'}
          onFlag={setFlag}
          onDone={sc.next}
        />
      );
    case 'prep':
      return <Prep node={sc.node} />;
    case 'battle':
      return battle.value ? <Battle /> : <WorldMap />;
    case 'result':
      return <Result result={sc.result} />;
    case 'defeat':
      return <Defeat />;
    case 'camp':
      return <Camp tab={sc.tab} />;
    case 'options':
      return <Options back={sc.back} />;
    case 'end':
      return <EndScreen />;
  }
}
