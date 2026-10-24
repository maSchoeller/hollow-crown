import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { itemDef, type Reward } from '../../core';
import { t } from '../../i18n';
import { asset, itemName, Modal, rarityOf, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { checkForUpdate, installUpdate, updateStatus } from '../update';
import { Amount, ItemImage, Piece, PrimaryButton, ScreenHead, SecondaryButton, Segment } from '../../ui/pieces';
import { exportSave, type LegacyRecord, type SaveRecord, type SlotId } from '../../persistence/save';
import { resumeText, slotSummary } from '../campaignInfo';
import { campaign, data, latestAutoSave, saveDbBlocked } from '../state/session';
import { loadSlot, nodeDef } from '../state/flow';
import { screen, type Screen } from '../state/screen';
import { settings, updateSettings, type Settings } from '../state/settings';
import '../../ui/title.css';
import '../../ui/options.css';

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
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('locations/lager_unterwegs.webp')})` }} />
      <h1 class="title-logo">
        H<span class="crown">♛</span>llow
        <br />
        Crown
        <small>{t('ui.title.season')}</small>
      </h1>
      <div class="title-menu">
        {auto && (
          <PrimaryButton sub={resumeText(auto)} onClick={() => void loadSlot('auto', auto.campaignId)}>
            {t('ui.title.continue')}
          </PrimaryButton>
        )}
        <Campaigns onClick={() => (screen.value = { name: 'campaigns' })}>{t('ui.title.campaigns')}</Campaigns>
        <SecondaryButton onClick={() => (screen.value = { name: 'options', back: { name: 'title' } })}>{t('ui.options')}</SecondaryButton>
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

/** Options in style B: stones with segment switches and sliders over the blurred camp scene; every change applies and persists at once. */
export function Options({ back }: { back: Screen }) {
  const s = settings.value;
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
      </div>
    </div>
  );
}

export function Result({ result }: { result: import('../../core').BattleResult }) {
  const c = campaign.value!;
  const line = (icon: string | ComponentChildren, cls: string, text: string, key: string) => (
    <div key={key} class={`row ${cls}`} style={{ minHeight: 36 }}>
      {typeof icon === 'string' ? <Icon name={icon} size={18} /> : icon}
      <span>{text}</span>
    </div>
  );
  return (
    <div class="screen">
      <div class="screen-narrow col" style={{ gap: 18 }}>
        <div class="col" style={{ gap: 4 }}>
          <span class="lbl gold">{t(nodeDef(result.nodeId).titleKey)}</span>
          <h1>{t('ui.result.victory')}</h1>
          <span class="muted">{t('ui.result.turns', { count: result.turns })}</span>
        </div>
        <section class="col edge" style={{ paddingTop: 16, gap: 4 }}>
          <h3>{t('ui.result.objectives')}</h3>
          {result.side.map((s) => (
            <div key={s.id} class="row hair" style={{ minHeight: 44 }}>
              <span class={s.done ? 'adv' : 'muted'}>
                <Icon name={s.done ? 'check' : 'cross'} size={18} />
              </span>
              <span class="grow">{t(`ui.side.${s.type}`, { turns: s.turns ?? 0 })}</span>
              <RewardAmounts reward={s.reward} />
            </div>
          ))}
        </section>
        <section class="col" style={{ gap: 4 }}>
          <h3>{t('ui.result.loot')}</h3>
          <div class="row hair" style={{ minHeight: 44, flexWrap: 'wrap' }}>
            <Amount resource="gold" value={result.gold} signed />
            {Object.entries(result.materials).map(([m, n]) => (
              <Amount key={m} material={itemDef(data, m)} value={n} signed />
            ))}
          </div>
          {result.items.map((i) => (
            <div key={i.uid} class="row hair" style={{ minHeight: 56 }}>
              <ItemImage data={data} item={i} />
              <span class={`r-${rarityOf(data, i)}`} style={{ fontWeight: 600 }}>
                {itemName(data, i)}
              </span>
            </div>
          ))}
        </section>
        <section class="col" style={{ gap: 4 }}>
          <h3>{t('ui.result.company')}</h3>
          {result.units.map((u) => (
            <div key={u.id} class="row hair" style={{ minHeight: 44 }}>
              <span class="grow" style={{ fontWeight: 600 }}>{unitName(u)}</span>
              <span class="num">
                {t('ui.lv')} {u.levelBefore}
                {u.levelAfter > u.levelBefore ? ` → ${u.levelAfter}` : ''}
              </span>
              <Amount resource="exp" value={u.exp} signed />
            </div>
          ))}
          {result.recruited.map((id) => line('star', 'adv', t('ui.result.recruited', { name: t(`unit.${id}.name`) }), `r${id}`))}
          {(result.granted ?? []).map((g) =>
            line(<ItemImage data={data} item={g.item} size={28} />, 'adv', t('ui.result.granted', { name: g.id === 'avatar' ? (c.avatar.name ?? '') : t(`unit.${g.id}.name`), item: itemName(data, g.item) }), `g${g.item.uid}`),
          )}
          {result.scars.map((s) => line('scar', 'dis', `${t(`unit.${s.id}.name`)}: ${t(`scar.${s.scar}`)}`, `s${s.id}`))}
          {result.fallen.map((f) => line('fallen', 'dis', t('ui.result.fallen', { name: unitName(f) }), `f${f.id}`))}
          {result.supportsReady.length > 0 && line('campfire', 'gold', t('ui.result.supports'), 'sup')}
        </section>
        <button class="btn primary big" onClick={() => (screen.value = { name: 'worldmap' })}>
          {t('ui.result.continue')}
        </button>
      </div>
    </div>
  );
}

/** Reward of a side objective: amounts as symbol + number, items by name. */
export function RewardAmounts({ reward: r }: { reward: Reward }) {
  return (
    <span class="row muted" style={{ gap: 8, flexWrap: 'wrap' }}>
      {r.gold ? <Amount resource="gold" value={r.gold} /> : null}
      {Object.entries(r.material ?? {}).map(([m, n]) => (
        <Amount key={m} material={itemDef(data, m)} value={n} />
      ))}
      {r.item && (
        <span class="row" style={{ gap: 6 }}>
          <ItemImage data={data} item={r.item.def} size={28} />
          {t(`item.${r.item.def}.name`)}
        </span>
      )}
    </span>
  );
}
