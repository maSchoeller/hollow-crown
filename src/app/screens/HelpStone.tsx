/** Context "?" (DESIGN.md `help-stone`, story 14.7): opens the handbook entry of its anchor as a sheet; nothing when no entry has it. */
import { t } from '../../i18n';
import { helpEntry, openHandbook } from '../state/handbook';
import './HelpStone.css';

export function HelpStone({ anchor, class: cls = '' }: { anchor: string; class?: string }) {
  const id = helpEntry(anchor);
  if (!id) return null;
  return (
    <button
      type="button"
      class={`hc-help ${cls}`}
      aria-label={t('handbook.ui.help')}
      title={t('handbook.ui.help')}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        openHandbook(id);
      }}
    >
      ?
    </button>
  );
}
