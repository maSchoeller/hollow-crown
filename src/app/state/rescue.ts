/** What the player can do after a fault or a failed save: export a bug report or the save, reload the last auto-save. */
import { APP_VERSION, exportSave } from '../../persistence/save';
import { journalSinceCheckpoint } from '../../persistence/journal';
import { log } from '../log';
import { assembleReport, type BugReport } from '../report';
import { battle } from './battle';
import { clearFault, fault } from './fault';
import { ensureRecordContent, loadSlot, restore } from './flow';
import { campaign, campaignId, contentVersion, currentSaveRecord, latestAutoSave } from './session';
import { settings } from './settings';

/** Builds the bug report from the app's current state; the journal is read from the save database if it still answers. */
export async function collectReport(): Promise<BugReport> {
  const id = campaignId.value;
  let journal = null;
  if (id) {
    try {
      journal = await journalSinceCheckpoint(id);
    } catch (e) {
      log.warn('save', 'journal unreadable for the bug report', e);
    }
  }
  const b = battle.value;
  return assembleReport({
    now: new Date().toISOString(),
    appVersion: APP_VERSION,
    contentVersion,
    device: {
      userAgent: navigator.userAgent,
      quality: settings.value.quality,
      figures: settings.value.figures,
      viewport: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
    },
    error: fault.value,
    campaignId: id,
    campaign: campaign.value,
    journal,
    battle: b ? { start: b.start, commands: b.log } : null,
    log: log.entries(),
  });
}

function download(text: string, name: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function exportBugReport(): Promise<void> {
  const r = await collectReport();
  download(JSON.stringify(r, null, 2), `hollow-crown-bugreport-${r.createdAt.slice(0, 19).replace(/[:T]/g, '-')}.json`);
}

/** The in-memory state as a save file; for a banner that says saving failed. Resolves false when there is no campaign. */
export function exportCurrentSave(): boolean {
  const rec = currentSaveRecord();
  if (!rec) return false;
  download(exportSave(rec), `hollow-crown-auto-${rec.createdAt.slice(0, 10)}.json`);
  return true;
}

/**
 * Loads the last auto-save of the active campaign (or of the most recent one) and clears the fault.
 * Resolves false when there is none or it does not replay either; the fault screen stays then.
 */
export async function reloadLastAutoSave(): Promise<boolean> {
  try {
    let ok = campaignId.value ? await loadSlot('auto') : false;
    if (!ok) {
      const rec = await latestAutoSave();
      if (rec && (await ensureRecordContent(rec))) {
        restore(rec);
        ok = true;
      }
    }
    if (ok) clearFault();
    return ok;
  } catch (e) {
    log.error('save', 'reloading the auto-save failed', e);
    return false;
  }
}
