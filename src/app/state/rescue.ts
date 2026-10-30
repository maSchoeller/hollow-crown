/**
 * Bug reports and recovery (concept/24-architecture §6.1, §6.2a): the action trail's store and watchers, the report the
 * player exports after a fault or from the options ("Fehler melden"), exporting the save, reloading the last auto-save.
 */
import { effect } from '@preact/signals';
import { APP_VERSION, exportSave } from '../../persistence/save';
import { journalSinceCheckpoint, readJournal } from '../../persistence/journal';
import { createTrailStore } from '../../persistence/trail';
import { log } from '../log';
import { assembleReport, type BugReport, type ReportReason } from '../report';
import { screenInfo, trail, TRAIL_CAPACITY, type TrailEntry } from '../trail';
import { battle } from './battle';
import { clearFault, fault } from './fault';
import { ensureRecordContent, loadSlot, restore } from './flow';
import { screen } from './screen';
import { campaign, campaignId, contentVersion, currentSaveRecord, latestAutoSave } from './session';
import { settings } from './settings';

function device(): BugReport['device'] {
  return {
    userAgent: navigator.userAgent,
    quality: settings.value.quality,
    figures: settings.value.figures,
    viewport: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
  };
}

/**
 * Starts the action trail of this app start: its store, a first entry with versions and device, every screen change,
 * and a write when the page goes to the background (the rest records itself where the actions happen).
 */
export function installTrail(): void {
  trail.attach(createTrailStore<TrailEntry>(TRAIL_CAPACITY));
  trail.record({ kind: 'app', appVersion: APP_VERSION, contentVersion, device: device() });
  let last = '';
  effect(() => {
    const info = screenInfo(screen.value);
    const key = JSON.stringify(info);
    if (key === last) return;
    last = key;
    trail.record({ kind: 'screen', screen: info });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void trail.flush();
  });
  window.addEventListener('pagehide', () => void trail.flush());
}

/**
 * Builds the bug report from the app's current state; journal and trail are read from their databases if they still
 * answer. `manual`: the player reports from the options, a fault (if any) still goes along.
 */
export async function collectReport(reason: ReportReason = 'fault', note = ''): Promise<BugReport> {
  const id = campaignId.value;
  let journal = null;
  let history = null;
  if (id) {
    try {
      [journal, history] = await Promise.all([journalSinceCheckpoint(id), readJournal(id)]);
    } catch (e) {
      log.warn('save', 'journal unreadable for the bug report', e);
    }
  }
  const b = battle.value;
  return assembleReport({
    now: new Date().toISOString(),
    reason,
    note,
    screen: screenInfo(screen.value),
    appVersion: APP_VERSION,
    contentVersion,
    device: device(),
    error: fault.value,
    campaignId: id,
    campaign: campaign.value,
    journal,
    history,
    battle: b ? { start: b.start, commands: b.log } : null,
    trail: await trail.entries(),
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

/**
 * On a touch device the share sheet (mail, messenger …), elsewhere a download. Resolves `cancelled` when the player
 * closed the share sheet; a share the browser refuses (no files, the tap is too long ago) falls back to the download.
 */
async function shareOrDownload(text: string, name: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([text], name, { type: 'application/json' });
  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }
  download(text, name);
  return 'downloaded';
}

export async function exportBugReport(reason: ReportReason = 'fault', note = ''): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const r = await collectReport(reason, note);
  return shareOrDownload(JSON.stringify(r, null, 2), `hollow-crown-bugreport-${r.createdAt.slice(0, 19).replace(/[:T]/g, '-')}.json`);
}

/** How many actions the trail holds now (for the report sheet). */
export async function trailSize(): Promise<number> {
  return (await trail.entries()).length;
}

/** Empties the action trail (the journal and the saves stay); a new first entry says when. */
export async function clearTrail(): Promise<void> {
  await trail.clear();
  trail.record({ kind: 'app', appVersion: APP_VERSION, contentVersion, device: device() });
  trail.record({ kind: 'screen', screen: screenInfo(screen.value) });
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
