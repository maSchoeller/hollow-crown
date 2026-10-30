/**
 * "Fehler melden" (concept/24-architecture §6.2a): from the options, at any time. The player describes what went wrong and
 * exports the bug report with save, action trail, versions and device; it stays on the device until they share it.
 */
import { useEffect, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { t } from '../../i18n';
import { PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { Sheet } from '../../ui/Sheet';
import { clearTrail, exportBugReport, trailSize } from '../state/rescue';
import './ReportSheet.css';

const NOTE_MAX = 2000;

export function ReportSheet({ onClose }: { onClose: () => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    void trailSize().then(setCount, () => setCount(null));
  }, []);

  const send = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const how = await exportBugReport('manual', note);
      if (how !== 'cancelled') setStatus(t(how === 'shared' ? 'ui.report.shared' : 'ui.report.exported'));
    } catch {
      setStatus(t('ui.report.failed'));
    }
    setBusy(false);
  };
  const clear = async () => {
    setBusy(true);
    try {
      await clearTrail();
      setStatus(t('ui.report.cleared'));
      setCount(await trailSize());
    } catch {
      setStatus(t('ui.report.failed'));
    }
    setBusy(false);
  };

  // on #app like the item sheet: the options screen scrolls, the veil has to cover the view, not the scrolled content
  return createPortal(
    <Sheet
      title={t('ui.report.title')}
      onClose={onClose}
      footer={
        <>
          <SecondaryButton disabled={busy} onClick={clear}>
            {t('ui.report.clear')}
          </SecondaryButton>
          <PrimaryButton disabled={busy} onClick={send}>
            {t('ui.report.export')}
          </PrimaryButton>
        </>
      }
    >
      <div class="report-sheet">
        <p>{t('ui.report.text')}</p>
        <label class="report-sheet__label" for="hc-report-note">
          {t('ui.report.note')}
        </label>
        <textarea
          id="hc-report-note"
          class="report-sheet__note"
          rows={4}
          maxLength={NOTE_MAX}
          placeholder={t('ui.report.notePlaceholder')}
          value={note}
          onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
        />
        {count !== null && <p class="report-sheet__count">{t('ui.report.count', { n: count })}</p>}
        {status && (
          <p class="report-sheet__status" role="status">
            {status}
          </p>
        )}
      </div>
    </Sheet>,
    document.getElementById('app') ?? document.body,
  );
}
