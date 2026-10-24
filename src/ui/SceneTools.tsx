import { t } from '../i18n';
import { Icon } from './icons';
import './Dialogue.css';

/** Top-right pills of a scene: Log (optional), Auto and Skip; a scene seen before marks Skip with a tick. */
export function SceneTools({ seen, auto, onAuto, onLog, onSkip }: { seen: boolean; auto: boolean; onAuto: () => void; onLog?: () => void; onSkip: () => void }) {
  return (
    <div class="vn-tools" onClick={(e) => e.stopPropagation()}>
      {onLog && (
        <button type="button" class="vn-pill" onClick={onLog}>
          <Icon name="log" size={16} />
          {t('ui.dialogue.log')}
        </button>
      )}
      <button type="button" class={`vn-pill ${auto ? 'is-on' : ''}`} aria-pressed={auto} title={t('ui.dialogue.auto.hint')} onClick={onAuto}>
        {t('ui.dialogue.auto')}
      </button>
      <button type="button" class={`vn-pill ${seen ? 'is-seen' : ''}`} title={seen ? t('ui.dialogue.seen') : undefined} onClick={onSkip}>
        {t('ui.dialogue.skip')}
        <Icon name={seen ? 'check' : 'skip'} size={16} />
      </button>
    </div>
  );
}
