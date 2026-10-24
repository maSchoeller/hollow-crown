/**
 * Act pack displays on the world map (story 7.2, mockup 07 "Akt-Paket lädt"): the progress ring stone at the top, only
 * while an act pack loads, and the button state "Wird noch geladen …" of a mission whose pack is not there yet.
 */
import { lang, t } from '../../i18n';
import { Piece } from '../../ui/pieces';
import { formatBytes } from '../loading/plan';
import { byteRatio } from '../../packs/plan';
import { loadingActPack, packStates } from '../state/packs';
import './PackStatus.css';

const size = (bytes: number): string => {
  const f = formatBytes(bytes, lang.value === 'de' ? 'de-DE' : 'en-US');
  return t(f.unitKey, { n: f.n });
};

/** The ring stone: percent and megabytes, or the waiting sentence when offline or after a failed round. */
export function PackRing() {
  const p = loadingActPack();
  if (!p) return null;
  const { state } = p;
  const pct = Math.round(byteRatio(state.doneBytes, state.totalBytes) * 100);
  const waiting = state.phase === 'offline' || state.phase === 'retry';
  const known = state.totalBytes > 0;
  return (
    <Piece class="pk-ring" role="status" aria-live="polite">
      <span class="pk-ring__ring" style={{ '--pk-pct': `${known ? pct : 0}%` }} aria-hidden="true">
        <i />
      </span>
      <span class="pk-ring__text">
        <b>{known ? t('ui.packs.loading', { act: p.act, pct }) : t('ui.packs.loadingNoSize', { act: p.act })}</b>
        <span>
          {waiting
            ? t(state.phase === 'offline' ? 'ui.packs.offline' : 'ui.packs.retry')
            : known
              ? t('ui.packs.size', { done: size(state.doneBytes), total: size(state.totalBytes) })
              : t('ui.loading.prepareSubNoSize')}
        </span>
      </span>
    </Piece>
  );
}

/** In place of "Aufstellung" and "Aufbrechen" while the mission's pack loads. */
export function PackWait({ pack }: { pack: string }) {
  const phase = packStates.value[pack]?.phase;
  return (
    <div class="pk-wait" role="status">
      {t(phase === 'offline' ? 'ui.packs.offline' : 'ui.packs.wait')}
    </div>
  );
}
