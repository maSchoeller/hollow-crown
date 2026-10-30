import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { asset, Modal } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { checkForUpdate, installUpdate, updateStatus } from '../update';
import { Piece, PrimaryButton, ScreenHead, SecondaryButton, Segment } from '../../ui/pieces';
import { exportSave, type LegacyRecord, type SaveRecord, type SlotId } from '../../persistence/save';
import { resumeText, slotSummary } from '../campaignInfo';
import { latestAutoSave, saveDbBlocked } from '../state/session';
import { loadSlot } from '../state/flow';
import { screen, type Screen } from '../state/screen';
import { settings, updateSettings, type Settings } from '../state/settings';
import { Logo } from '../../ui/Logo';
import '../../ui/title.css';
import '../../ui/options.css';
import { LicensesLink } from './Licenses';
import { ReportSheet } from './ReportSheet';

/** Title (concept/25-ux/mockups/07): one primary "Continue", "Campaigns", "Options", version line. */
export function Title() {
  const [auto, setAuto] = useState<SaveRecord | undefined>();
  useEffect(() => {
    void latestAutoSave()
      .then(setAuto)
      .catch(() => setAuto(undefined));
  }, []);
  const Campaigns = auto ? SecondaryButton : PrimaryButton;
  return (
    <div class="screen title-screen">
      <div class="screen-bg title-bg" />
      <Logo />
      <div class="title-art" style={`--title-img:url(${asset('title/title_act1.webp')})`} aria-hidden="true" />
      <div class="title-menu">
        {auto && (
          <PrimaryButton sub={resumeText(auto)} onClick={() => void loadSlot('auto', auto.campaignId)}>
            {t('ui.title.continue')}
          </PrimaryButton>
        )}
        <Campaigns onClick={() => (screen.value = { name: 'campaigns' })}>{t('ui.title.campaigns')}</Campaigns>
        <SecondaryButton onClick={() => (screen.value = { name: 'options', back: { name: 'title' } })}>{t('ui.options')}</SecondaryButton>
        <SecondaryButton onClick={() => (screen.value = { name: 'handbook', back: { name: 'title' } })}>{t('handbook.ui.title')}</SecondaryButton>
        {saveDbBlocked.value && (
          <Piece class="title-note" role="alert">
            {t('ui.title.closeOtherTabs')}
          </Piece>
        )}
        <div class="title-foot">
          <span class="title-foot__version">
            {t('ui.title.version')} {(import.meta.env.VITE_APP_VERSION ?? '0.1.0').slice(0, 7)}
          </span>
          <UpdateLink />
        </div>
      </div>
    </div>
  );
}

function UpdateLink() {
  const status = updateStatus.value;
  useEffect(() => {
    void checkForUpdate();
  }, []);
  if (status === 'available') {
    return (
      <button type="button" class="title-foot__btn is-update" onClick={installUpdate}>
        <Icon name="download" size={16} /> {t('ui.update.install')}
      </button>
    );
  }
  return (
    <button type="button" class="title-foot__btn" disabled={status === 'checking'} onClick={() => void checkForUpdate()}>
      {t(`ui.update.${status === 'idle' ? 'check' : status}`)}
    </button>
  );
}

export function SlotPicker({ saves, onPick, onClose, save }: { saves: SaveRecord[]; onPick: (slot: SlotId) => void; onClose: () => void; save?: boolean }) {
  const slots: SlotId[] = ['1', '2', '3'];
  return (
    <Modal title={save ? t('ui.save.title') : t('ui.title.load')} onClose={onClose}>
      <div class="col">
        {slots.map((s) => {
          const rec = saves.find((r) => r.slot === s);
          return (
            <button key={s} class="btn" disabled={!save && !rec} onClick={() => onPick(s)} style={{ justifyContent: 'space-between' }}>
              <span>
                {t('ui.save.slot')} {s}
              </span>
              <span class="muted">{rec ? `${slotSummary(rec)} · ${new Date(rec.createdAt).toLocaleString()}` : t('ui.save.empty')}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export function downloadSave(rec: SaveRecord | LegacyRecord): void {
  const blob = new Blob([exportSave(rec)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hollow-crown-${rec.slot}-${rec.createdAt.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const ON_OFF = (): Array<[boolean, string]> => [
  [true, t('ui.on')],
  [false, t('ui.off')],
];
const SPEEDS = (): Array<[1 | 2 | 3, string]> => [
  [1, '1x'],
  [2, '2x'],
  [3, t('ui.opt.skip')],
];

/**
 * Options in style B: stones with segment switches and sliders over the blurred camp scene; every change applies and persists at once.
 * Below them "Fehler melden" (the bug report sheet, architecture §6.2a) and the licenses.
 */
export function Options({ back }: { back: Screen }) {
  const s = settings.value;
  const [report, setReport] = useState(false);
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => updateSettings({ [k]: v } as Partial<Settings>);
  const seg = <K extends keyof Settings>(label: string, k: K, options: Array<[Settings[K], string]>) => (
    <div class="opt-row" role="group" aria-label={label}>
      <span class="opt-row__label">{label}</span>
      <Segment value={s[k]} options={options} onChange={set(k)} />
    </div>
  );
  const slider = (label: string, k: 'music' | 'sfx') => (
    <div class="opt-row">
      <label class="opt-row__label" for={`opt-${k}`}>
        {label}
        <span>{Math.round(s[k] * 100)} %</span>
      </label>
      <input id={`opt-${k}`} class="hc-slider" type="range" min={0} max={1} step={0.05} value={s[k]} style={{ '--hc-fill': `${s[k] * 100}%` }} onInput={(e) => set(k)(Number((e.target as HTMLInputElement).value))} />
    </div>
  );
  return (
    <div class="screen options-screen">
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('locations/lager_unterwegs.webp')})` }} />
      <div class="options">
        <ScreenHead title={t('ui.options')} onBack={() => (screen.value = back)} />
        <Piece class="options__stone">
          {seg(t('ui.opt.lang'), 'lang', [['de', 'Deutsch'], ['en', 'English']])}
          {seg(t('ui.opt.speed'), 'speed', SPEEDS())}
          {seg(t('ui.opt.enemySpeed'), 'enemySpeed', SPEEDS())}
        </Piece>
        <Piece class="options__stone">
          <b class="options__head">{t('ui.opt.board')}</b>
          {seg(t('ui.opt.grid'), 'grid', [['off', t('ui.off')], ['subtle', t('ui.opt.gridSubtle')], ['strong', t('ui.opt.gridStrong')]])}
          {seg(t('ui.opt.hpBars'), 'hpBars', [['always', t('ui.opt.hpAlways')], ['hurt', t('ui.opt.hpHurt')], ['off', t('ui.off')]])}
          {seg(t('ui.opt.threatNumbers'), 'threatNumbers', ON_OFF())}
          {seg(t('ui.opt.enemyStrip'), 'enemyStrip', ON_OFF())}
          {seg(t('ui.opt.danger'), 'dangerDefault', ON_OFF())}
        </Piece>
        <Piece class="options__stone">
          {seg(t('ui.opt.quality'), 'quality', [['low', t('ui.opt.q.low')], ['mid', t('ui.opt.q.mid')], ['high', t('ui.opt.q.high')]])}
          {seg(t('ui.opt.figures'), 'figures', [['3d', t('ui.opt.fig.3d')], ['2d', t('ui.opt.fig.2d')]])}
          {seg(t('ui.opt.shake'), 'shake', ON_OFF())}
        </Piece>
        <Piece class="options__stone">
          {slider(t('ui.opt.music'), 'music')}
          {slider(t('ui.opt.sfx'), 'sfx')}
          {seg(t('ui.opt.keepAwake'), 'keepAwake', ON_OFF())}
        </Piece>
        <SecondaryButton onClick={() => setReport(true)}>{t('ui.report.open')}</SecondaryButton>
        <LicensesLink from={{ name: 'options', back }} />
      </div>
      {report && <ReportSheet onClose={() => setReport(false)} />}
    </div>
  );
}
