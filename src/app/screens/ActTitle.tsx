/**
 * The title card of a new act (story 11.3, EXPERIENCE.md State Patterns "neuer Akt erreicht"): once, when the company has just
 * reached the act, over the world map that still shows the fog of the act before. "Weiter" (or a tap anywhere) closes it; the
 * world map then notes it with `markActTitleSeen` and lets the fog lift.
 */
import { t } from '../../i18n';
import { PrimaryButton } from '../../ui/pieces';
import './ActTitle.css';

export function ActTitle({ act, onDone }: { act: number; onDone: () => void }) {
  return (
    <div class="act-title" role="dialog" aria-modal="true" aria-labelledby="act-title-name" onClick={onDone}>
      <div class="act-title__banner">
        <span class="act-title__badge" aria-hidden="true">
          {act}
        </span>
        <h1 id="act-title-name" class="act-title__name">
          {t(`act.${act}.title`)}
        </h1>
        <p class="act-title__season">{t(`act.${act}.season`)}</p>
      </div>
      <PrimaryButton onClick={onDone}>{t('ui.actTitle.continue')}</PrimaryButton>
    </div>
  );
}
