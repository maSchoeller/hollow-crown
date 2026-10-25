/** Campaign view and new-campaign form (concept/25-ux/EXPERIENCE.md "Kampagnen", mockup 07). */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { DeathMode, Difficulty, Element } from '../../core';
import { t } from '../../i18n';
import { asset } from '../../ui/asset';
import { Icon } from '../../ui/icons';
import { PrimaryButton, Piece, ScreenHead, SecondaryButton, Segment } from '../../ui/pieces';
import {
  importSave,
  listCampaigns,
  listLegacy,
  listSaves,
  MAX_CAMPAIGNS,
  type CampaignMeta,
  type LegacyRecord,
  type SaveRecord,
  type SlotId,
} from '../../persistence/save';
import { AVATAR_LOOKS, avatarHead, formatAge, formatPlaytime, resumeWhere, slotSummary } from '../campaignInfo';
import { importRecord, loadSlot, removeCampaign, startNewGame } from '../state/flow';
import { screen } from '../state/screen';
import { downloadSave } from './Menus';
import '../../ui/campaigns.css';

/** Placeholder until the player picks an affinity when the elements are introduced (U20). */
const DEFAULT_AFFINITY: Element = 'wind';
/** Long press on a row opens its menu (EXPERIENCE.md: ≥ 400 ms). */
const LONG_PRESS_MS = 450;
const SLOTS: SlotId[] = ['1', '2', '3'];

interface Row {
  meta: CampaignMeta;
  saves: SaveRecord[];
}

/** Sheet-like dialog in style B; Escape or a tap beside it closes. */
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ComponentChildren }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div class="camp-dialog-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Piece class="camp-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </Piece>
    </div>
  );
}

function Medallion({ portrait }: { portrait: string }) {
  return (
    <span class="camp__medallion">
      <img src={asset(`avatars/${avatarHead(portrait)}.webp`)} alt="" draggable={false} />
    </span>
  );
}

function CampaignRow({
  row,
  onOpen,
  onMenu,
  onSlot,
}: {
  row: Row;
  onOpen: () => void;
  onMenu: () => void;
  onSlot: (slot: SlotId) => void;
}) {
  const { meta, saves } = row;
  const auto = saves.find((s) => s.slot === 'auto');
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const cancel = () => window.clearTimeout(timer.current);
  const stand = [
    t('ui.campaign.act', { act: meta.act }),
    auto ? resumeWhere(auto) : '',
    formatPlaytime(meta.playtimeMs),
    t('ui.campaign.autosave', { age: formatAge(auto?.createdAt ?? meta.updatedAt) }),
  ].filter(Boolean);
  const classic = meta.deathMode === 'classic';
  return (
    <Piece class="camp">
      <button
        type="button"
        class="camp__main"
        onPointerDown={() => {
          fired.current = false;
          cancel();
          timer.current = window.setTimeout(() => {
            fired.current = true;
            onMenu();
          }, LONG_PRESS_MS);
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => {
          e.preventDefault();
          cancel();
          fired.current = true;
          onMenu();
        }}
        onClick={() => {
          if (fired.current) fired.current = false;
          else onOpen();
        }}
      >
        <Medallion portrait={meta.avatar} />
        <span>
          <span class="camp__name">{meta.name}</span>
          <span class={`camp__mode ${classic ? 'is-classic' : ''}`}>
            {t(`ui.death.${meta.deathMode}`)} · {t(`ui.difficulty.${meta.difficulty}`)}
          </span>
          <span class="camp__stand">{stand.join(' · ')}</span>
        </span>
      </button>
      <button type="button" class="camp__more" onClick={onMenu} aria-label={t('ui.campaign.more', { name: meta.name })}>
        <Icon name="more" size={22} />
      </button>
      <div class="camp__snaps">
        {classic ? (
          <div class="camp__snap is-empty">{t('ui.campaign.autoOnly')}</div>
        ) : (
          SLOTS.map((s) => {
            const rec = saves.find((r) => r.slot === s);
            const label = <b>{t('ui.campaign.slot', { n: s })}</b>;
            return rec ? (
              <button key={s} type="button" class="camp__snap" onClick={() => onSlot(s)}>
                {label}
                {slotSummary(rec)}
              </button>
            ) : (
              <div key={s} class="camp__snap is-empty">
                {label}
                {t('ui.campaign.slot.free')}
              </div>
            );
          })
        )}
      </div>
    </Piece>
  );
}

function LegacyRow({ rec }: { rec: LegacyRecord }) {
  return (
    <Piece class="camp-legacy">
      <Icon name="box" size={22} />
      <div class="camp-legacy__text">
        <b>{t('ui.campaign.legacy.title')}</b>
        {t('ui.campaign.legacy.text')}
      </div>
      <button type="button" class="hc-chip-btn" onClick={() => downloadSave(rec)}>
        {t('ui.save.export')}
      </button>
    </Piece>
  );
}

/** The saved campaigns of this device: up to three, each with its auto-save and (Standard, Casual) three manual places. */
export function Campaigns() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [legacy, setLegacy] = useState<LegacyRecord[]>([]);
  const [menu, setMenu] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<CampaignMeta | null>(null);
  /** all places taken: delete one first; `pending` is an import waiting for the free place */
  const [full, setFull] = useState<{ pending?: SaveRecord } | null>(null);
  const [note, setNote] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const metas = await listCampaigns();
      setRows(await Promise.all(metas.map(async (meta) => ({ meta, saves: await listSaves(meta.id) }))));
      setLegacy(await listLegacy());
    } catch {
      setRows([]);
    }
  };
  useEffect(() => void refresh(), []);

  const count = rows?.length ?? 0;
  const guarded = async (fn: () => Promise<unknown>) => {
    setNote('');
    try {
      await fn();
    } catch {
      setNote(t('ui.campaign.loadFailed'));
    }
  };
  const open = (id: string, slot: SlotId) =>
    void guarded(async () => {
      if (!(await loadSlot(slot, id))) throw new Error('missing');
    });
  const exportRow = (row: Row) => {
    const rec = row.saves.find((s) => s.slot === 'auto') ?? row.saves[0];
    if (rec) downloadSave(rec);
  };
  const tryImport = async (rec: SaveRecord) => {
    try {
      if (!(await importRecord(rec))) setFull({ pending: rec });
    } catch {
      setNote(t('ui.campaign.importFailed'));
    }
  };
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setNote('');
    let rec: SaveRecord;
    try {
      rec = importSave(await file.text());
    } catch (e) {
      const why = e instanceof Error ? e.message : '';
      setNote(t(why === 'legacy' ? 'ui.campaign.importLegacy' : why === 'size' ? 'ui.campaign.importTooBig' : why === 'checksum' ? 'ui.campaign.importChecksum' : 'ui.campaign.importFailed'));
      return;
    }
    await tryImport(rec);
  };
  const newCampaign = () => {
    if (count >= MAX_CAMPAIGNS) setFull({});
    else screen.value = { name: 'newGame' };
  };
  const doDelete = async (meta: CampaignMeta) => {
    setConfirm(null);
    try {
      await removeCampaign(meta.id);
    } catch {
      setNote(t('ui.campaign.deleteFailed'));
    }
    await refresh();
    // the freed place is what the player was waiting for
    const wait = full;
    if (wait && (await listCampaigns()).length < MAX_CAMPAIGNS) {
      setFull(null);
      if (wait.pending) await tryImport(wait.pending);
      else screen.value = { name: 'newGame' };
    }
  };

  return (
    <div class="screen camps-screen">
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('locations/lager_unterwegs.webp')})` }} />
      <div class="camps">
        <ScreenHead title={t('ui.title.campaigns')} aside={t('ui.campaign.count', { n: count, max: MAX_CAMPAIGNS })} onBack={() => (screen.value = { name: 'title' })} />
        <div class="camps__list">
          {(rows ?? []).map((row) => (
            <CampaignRow key={row.meta.id} row={row} onOpen={() => open(row.meta.id, 'auto')} onMenu={() => setMenu(row)} onSlot={(s) => open(row.meta.id, s)} />
          ))}
          {rows && (
            <button type="button" class="camp-new" onClick={newCampaign}>
              <Icon name="plus" size={22} />
              {t('ui.campaign.new')}
            </button>
          )}
          {legacy.map((rec) => (
            <LegacyRow key={rec.slot} rec={rec} />
          ))}
        </div>
        {note && (
          <div class="camps__note" role="alert">
            {note}
          </div>
        )}
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => {
          const input = e.target as HTMLInputElement;
          void onFile(input.files?.[0]).then(() => (input.value = ''));
        }} />
        <SecondaryButton class="camps__import" onClick={() => fileRef.current?.click()}>
          {t('ui.campaign.import')}
        </SecondaryButton>
      </div>

      {menu && (
        <Dialog title={menu.meta.name} onClose={() => setMenu(null)}>
          <SecondaryButton
            onClick={() => {
              exportRow(menu);
              setMenu(null);
            }}
          >
            {t('ui.save.export')}
          </SecondaryButton>
          <SecondaryButton
            onClick={() => {
              setConfirm(menu.meta);
              setMenu(null);
            }}
          >
            {t('ui.campaign.delete')}
          </SecondaryButton>
          <SecondaryButton onClick={() => setMenu(null)}>{t('ui.cancel')}</SecondaryButton>
        </Dialog>
      )}
      {full && (
        <Dialog title={t('ui.campaign.limit.title')} onClose={() => setFull(null)}>
          <p>{t(full.pending ? 'ui.campaign.limit.import' : 'ui.campaign.limit.text')}</p>
          {(rows ?? []).map((row) => (
            <SecondaryButton key={row.meta.id} onClick={() => setConfirm(row.meta)} sub={`${t(`ui.death.${row.meta.deathMode}`)} · ${formatAge(row.meta.updatedAt)}`}>
              {t('ui.campaign.deleteNamed', { name: row.meta.name })}
            </SecondaryButton>
          ))}
          <SecondaryButton onClick={() => setFull(null)}>{t('ui.cancel')}</SecondaryButton>
        </Dialog>
      )}
      {confirm && (
        <Dialog title={t('ui.campaign.confirm.title', { name: confirm.name })} onClose={() => setConfirm(null)}>
          <p>{t('ui.campaign.confirm.text')}</p>
          <SecondaryButton class="hc-btn--danger" onClick={() => void doDelete(confirm)}>
            {t('ui.campaign.delete')}
          </SecondaryButton>
          <SecondaryButton onClick={() => setConfirm(null)}>{t('ui.cancel')}</SecondaryButton>
        </Dialog>
      )}
    </div>
  );
}

/** New campaign on one page: name, look with pronoun, difficulty, death mode (Standard preselected). */
export function NewCampaign() {
  const [name, setName] = useState(() => t('ui.new.defaultName'));
  const [look, setLook] = useState<(typeof AVATAR_LOOKS)[number]['portrait']>(AVATAR_LOOKS[0].portrait);
  const [pronoun, setPronoun] = useState<'she' | 'he' | 'they'>('he');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [deathMode, setDeathMode] = useState<DeathMode>('standard');
  const [place, setPlace] = useState(1);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void listCampaigns().then((m) => setPlace(Math.min(m.length + 1, MAX_CAMPAIGNS)));
  }, []);
  const toCampaigns = () => (screen.value = { name: 'campaigns' });
  const start = () => {
    if (!name.trim() || busy) return;
    setFailed(false);
    setBusy(true);
    startNewGame({ difficulty, deathMode }, { name: name.trim(), pronoun, portrait: look, affinity: DEFAULT_AFFINITY })
      .then((ok) => {
        // three campaigns appeared meanwhile (another tab): back to the view, which asks to delete one
        if (!ok) toCampaigns();
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };
  return (
    <div class="screen camps-screen">
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('locations/lager_unterwegs.webp')})` }} />
      <form
        class="camps"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <ScreenHead title={t('ui.new.title')} aside={t('ui.campaign.slot', { n: place })} onBack={toCampaigns} />
        <Piece class="camp-form">
          <div class="camp-form__field">
            <label class="camp-form__label" for="hc-name">
              {t('ui.new.name')}
            </label>
            <input id="hc-name" class="hc-input" type="text" value={name} maxLength={14} autoComplete="off" onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          </div>
          <fieldset class="camp-form__field">
            <legend class="camp-form__label">{t('ui.new.portrait')}</legend>
            <div class="camp-form__faces">
              {AVATAR_LOOKS.map((l, i) => (
                <button key={l.portrait} type="button" class="camp-form__face" aria-pressed={l.portrait === look} aria-label={t('ui.new.look', { n: i + 1 })} onClick={() => setLook(l.portrait)}>
                  <img src={asset(`avatars/${l.head}.webp`)} alt="" draggable={false} />
                </button>
              ))}
            </div>
            <Segment
              value={pronoun}
              onChange={setPronoun}
              options={[
                ['she', t('ui.pronoun.she.label')],
                ['he', t('ui.pronoun.he.label')],
              ]}
            />
          </fieldset>
          <fieldset class="camp-form__field">
            <legend class="camp-form__label">{t('ui.new.difficulty')}</legend>
            <Segment value={difficulty} onChange={setDifficulty} options={(['easy', 'normal', 'hard'] as const).map((d) => [d, t(`ui.difficulty.${d}`)])} />
            <span class="camp-form__hint">{t(`ui.difficulty.${difficulty}.desc`)}</span>
          </fieldset>
          <fieldset class="camp-form__field">
            <legend class="camp-form__label">{t('ui.new.deathMode')}</legend>
            <div class="camp-form__modes">
              {(['classic', 'standard', 'casual'] as const).map((d) => (
                <button key={d} type="button" class="camp-form__mode" aria-pressed={d === deathMode} onClick={() => setDeathMode(d)}>
                  <b>
                    {t(`ui.death.${d}`)} <span>{t(`ui.death.${d}.tag`)}</span>
                  </b>
                  {t(`ui.death.${d}.desc`)}
                </button>
              ))}
            </div>
          </fieldset>
        </Piece>
        {failed && (
          <div class="camps__note" role="alert">
            {t('ui.save.failed')}
          </div>
        )}
        <PrimaryButton type="submit" class="camp-form__go" disabled={!name.trim() || busy}>
          {t('ui.new.start')}
        </PrimaryButton>
      </form>
    </div>
  );
}
