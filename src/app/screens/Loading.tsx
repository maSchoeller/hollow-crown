/** Loading displays (story 7.6): the first start's "preparing" stone and the loading screen before a mission. Style B stones. */
import { lang, t } from '../../i18n';
import { asset } from '../../ui/asset';
import { Piece, PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { formatBytes, ratio } from '../loading/plan';
import { cancelMissionLoad, missionLoad, retryMissionLoad } from '../state/loading';
import { prepare } from '../state/prepare';
import './Loading.css';

function Bar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div class="ld-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Shown instead of the title while the service worker installs the first download. No button: it goes on by itself. */
export function PrepareScreen() {
  const p = prepare.value;
  if (p.phase === 'pending') return <div class="screen ld ld--wait" />;
  const fmt = p.bytes ? formatBytes(p.bytes, lang.value === 'de' ? 'de-DE' : 'en-US') : null;
  const size = fmt ? t(fmt.unitKey, { n: fmt.n }) : null;
  return (
    <div class="screen ld ld--prepare">
      <Piece class="ld-stone" role="status" aria-live="polite">
        <b class="ld-stone__title">{t('ui.loading.prepare')}</b>
        <span class="ld-stone__sub">{size ? t('ui.loading.prepareSub', { size }) : t('ui.loading.prepareSubNoSize')}</span>
        <Bar value={p.progress} label={t('ui.loading.prepare')} />
        {p.phase === 'retry' && <span class="ld-stone__warn">{t('ui.loading.prepareRetry')}</span>}
      </Piece>
    </div>
  );
}

/** Before a mission whose images or models are not in the cache: mission name, place image and progress, then it starts by itself. */
export function MissionLoading({ title }: { title: string }) {
  const m = missionLoad.value;
  if (!m) return <div class="screen ld" />;
  const bad = m.status !== 'loading';
  return (
    <div class="screen ld ld--mission">
      <div class="screen-bg" style={{ backgroundImage: `url(${asset(m.place)})` }} />
      <Piece class="ld-stone" role="status" aria-live="polite">
        <small class="ld-stone__kicker">{t('ui.loading.mission')}</small>
        <b class="ld-stone__title">{title}</b>
        {!bad && <Bar value={ratio(m.done, m.total)} label={title} />}
        <span class="ld-stone__sub">{bad ? t(m.status === 'offline' ? 'ui.loading.offline' : 'ui.loading.failed') : t('ui.loading.files', { done: m.done, total: m.total })}</span>
        {bad && <PrimaryButton onClick={retryMissionLoad}>{t('ui.loading.retry')}</PrimaryButton>}
        <SecondaryButton onClick={cancelMissionLoad}>{t('ui.back')}</SecondaryButton>
      </Piece>
    </div>
  );
}
