/** Overlay sheet in style B (DESIGN.md: stones and cards over a veil of line at 45 %): header like ScreenHead, Esc or a tap outside closes. */
import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';
import { t } from '../i18n';
import { Icon } from './icons';
import './sheet.css';

export function Sheet({
  title,
  aside,
  onClose,
  children,
  footer,
  wide,
  class: cls = '',
}: {
  title: ComponentChildren;
  /** small caps note at the right edge of the title pill */
  aside?: ComponentChildren;
  onClose: () => void;
  children: ComponentChildren;
  /** button row below the scrolling body */
  footer?: ComponentChildren;
  wide?: boolean;
  class?: string;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div class="hc-veil" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class={`hc-sheet ${wide ? 'is-wide' : ''} ${cls}`} role="dialog" aria-modal="true">
        <header class="hc-head hc-sheet__head">
          <button type="button" class="hc-head__back" onClick={onClose} aria-label={t('ui.close')}>
            <Icon name="close" size={22} />
          </button>
          <h2 class="hc-head__title">
            <b>{title}</b>
            {aside !== undefined && <span>{aside}</span>}
          </h2>
        </header>
        <div class="hc-sheet__body">{children}</div>
        {footer && <div class="hc-sheet__foot">{footer}</div>}
      </div>
    </div>
  );
}
