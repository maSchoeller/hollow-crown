/**
 * "Etwas ist schiefgelaufen" (stone over a veil, style B) and the save-protection notices: the
 * save-failed banner and the one-time home-screen hint. Concept/24-architecture §5.15, §6.1.
 */
import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import { Piece, PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { fault } from '../state/fault';
import { dismissHomeHint, homeHint, saveFailed } from '../state/protection';
import { exportBugReport, exportCurrentSave, reloadLastAutoSave } from '../state/rescue';
import { screen } from '../state/screen';
import './fault.css';

export function FaultScreen() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [reloadFailed, setReloadFailed] = useState(false);

  const reload = async () => {
    setBusy(true);
    setNote(null);
    const ok = await reloadLastAutoSave();
    setBusy(false);
    setReloadFailed(!ok);
    if (!ok) setNote(t('ui.fault.reloadFailed'));
  };
  const exportReport = async () => {
    try {
      await exportBugReport();
      setNote(t('ui.fault.exported'));
    } catch {
      setNote(t('ui.fault.exportFailed'));
    }
  };
  const toTitle = () => {
    fault.value = null;
    screen.value = { name: 'title' };
  };

  return (
    <div class="hc-veil hc-fault" role="alertdialog" aria-modal="true" aria-labelledby="hc-fault-title">
      <Piece class="hc-fault__stone">
        <h1 id="hc-fault-title">{t('ui.fault.title')}</h1>
        <p>{t('ui.fault.text')}</p>
        {note && <p class="hc-fault__note">{note}</p>}
        <div class="hc-fault__actions">
          <PrimaryButton disabled={busy} onClick={reload}>
            {t('ui.fault.reload')}
          </PrimaryButton>
          <SecondaryButton onClick={exportReport}>{t('ui.fault.export')}</SecondaryButton>
          {reloadFailed && <SecondaryButton onClick={toTitle}>{t('ui.battle.toTitle')}</SecondaryButton>}
        </div>
      </Piece>
    </div>
  );
}

/** Banner for a failed save and the home-screen hint; sits on top of every screen. */
export function SaveNotices() {
  const sc = screen.value.name;
  // the hint waits until the player is not in the middle of a fight or a scene
  const hint = homeHint.value && sc !== 'battle' && sc !== 'dialogue' && sc !== 'prep';
  const [exported, setExported] = useState(false);
  if (!saveFailed.value && !hint) return null;
  return (
    <div class="hc-notices">
      {saveFailed.value && (
        <Piece class="hc-notice hc-notice--error" role="alert">
          <div>
            <b>{t('ui.save.bannerTitle')}</b>
            <span>{t('ui.save.bannerText')}</span>
          </div>
          <SecondaryButton
            onClick={() => {
              exportCurrentSave();
              setExported(true);
            }}
          >
            {exported ? t('ui.save.done') : t('ui.save.bannerExport')}
          </SecondaryButton>
        </Piece>
      )}
      {hint && (
        <Piece class="hc-notice" role="status">
          <div>
            <span>{t('ui.storage.homeHint')}</span>
          </div>
          <SecondaryButton onClick={dismissHomeHint}>{t('ui.storage.homeHintOk')}</SecondaryButton>
        </Piece>
      )}
    </div>
  );
}
