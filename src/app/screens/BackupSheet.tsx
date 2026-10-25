/**
 * Backup reminder after an act's finale (story 7.3, architecture §5.15 "Speicherschutz", AR21): once per campaign and act, a
 * sheet on the world map offers to export the save. "Exportieren" downloads it like the save sheet does, "Später" (or
 * closing the sheet) only puts the reminder off for good; both note the act with `markBackupReminded`.
 */
import { t } from '../../i18n';
import { PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { Sheet } from '../../ui/Sheet';
import { campaignCommand, currentSaveRecord, data } from '../state/session';
import { downloadSave } from './Menus';

export function BackupSheet() {
  const note = () => void campaignCommand({ type: 'markBackupReminded', act: data.campaign.act });
  const exportSave = () => {
    note(); // first, so the exported file already carries the note and does not ask again after an import
    const rec = currentSaveRecord();
    if (rec) downloadSave(rec);
  };
  return (
    <Sheet
      title={t('ui.backup.title')}
      onClose={note}
      footer={
        <>
          <SecondaryButton onClick={note}>{t('ui.backup.later')}</SecondaryButton>
          <PrimaryButton onClick={exportSave}>{t('ui.backup.export')}</PrimaryButton>
        </>
      }
    >
      <p class="backup-sheet">{t('ui.backup.text')}</p>
    </Sheet>
  );
}
