import { useEffect, useRef, useState } from 'preact/hooks';
import { itemDef, type DeathMode, type Difficulty, type Element, type Reward } from '../../core';

/** Placeholder until the player picks an affinity when the elements are introduced (U20). */
const DEFAULT_AFFINITY: Element = 'wind';
import { t } from '../../i18n';
import { asset, Crest, itemName, Modal, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { checkForUpdate, installUpdate, updateStatus } from '../update';
import { Amount, PrimaryButton, SecondaryButton } from '../../ui/pieces';
import {
  deleteCampaign,
  exportSave,
  importSave,
  listCampaigns,
  listSaves,
  metaFromCampaign,
  readSave,
  type CampaignMeta,
  type SaveRecord,
  type SlotId,
} from '../../persistence/save';
import {
  campaign,
  campaignId,
  data,
  importRecord,
  latestAutoSave,
  loadSlot,
  nodeDef,
  saveDbBlocked,
  playNode,
  screen,
  settings,
  startNewGame,
  updateSettings,
  type Screen,
} from '../store';

/** Where a save resumes, for the "Continue" button: in a battle, before the next mission, or done. */
function resumeText(rec: SaveRecord): string {
  const c = rec.payload.campaign;
  const short = (id: string) => t(nodeDef(id).titleKey).split('–')[0]!.trim();
  const where = rec.payload.battle
    ? t('ui.title.where.battle', { node: short(rec.payload.battle.start.nodeId) })
    : c.available[0]
      ? t('ui.title.where.before', { node: short(c.available[0]) })
      : t('ui.title.where.end');
  return t('ui.title.resume', { name: c.avatar.name, act: metaFromCampaign(c).act, where });
}

/** Title (concept/25-ux/mockups/07): one primary "Continue", "Campaigns", "Options", version line. */
export function Title() {
  const [saves, setSaves] = useState<SaveRecord[]>([]);
  const [auto, setAuto] = useState<SaveRecord | undefined>();
  const [menu, setMenu] = useState(false);
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void latestAutoSave()
      .then(async (rec) => {
        setAuto(rec);
        setSaves(rec ? await listSaves(rec.campaignId) : []);
      })
      .catch(() => setSaves([]));
  }, []);
  const onImport = async (f: File | undefined) => {
    if (!f) return;
    setMenu(false);
    try {
      if (!(await importRecord(importSave(await f.text())))) setErr(t('ui.campaign.limit.text'));
    } catch (e) {
      setErr(t(e instanceof Error && e.message === 'legacy' ? 'ui.title.importLegacy' : 'ui.title.importFailed'));
    }
  };
  const Campaigns = auto ? SecondaryButton : PrimaryButton;
  return (
    <div class="screen title-screen">
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('backgrounds/bg_camp_night.webp')})` }} />
      <h1 class="title-logo">
        H<span class="crown">♛</span>llow
        <br />
        Crown
        <small>{t('ui.title.season')}</small>
      </h1>
      <div class="title-menu">
        {auto && (
          <PrimaryButton sub={resumeText(auto)} onClick={() => void loadSlot('auto', auto.campaignId)}>
            {t('ui.title.continue')}
          </PrimaryButton>
        )}
        <Campaigns onClick={() => setMenu(true)}>{t('ui.title.campaigns')}</Campaigns>
        <SecondaryButton onClick={() => (screen.value = { name: 'options', back: { name: 'title' } })}>{t('ui.options')}</SecondaryButton>
        {err && <div class="dis">{err}</div>}
        {saveDbBlocked.value && <div class="dis">{t('ui.title.closeOtherTabs')}</div>}
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => void onImport((e.target as HTMLInputElement).files?.[0])} />
        <div class="title-foot">
          {t('ui.title.version')} {(import.meta.env.VITE_APP_VERSION ?? '0.1.0').slice(0, 7)}
          <UpdateLink />
        </div>
      </div>
      {/* interim campaign menu until the campaign view (story 1.3) */}
      {menu && (
        <Modal title={t('ui.title.campaigns')} onClose={() => setMenu(false)}>
          <div class="campaigns-menu">
            <PrimaryButton onClick={() => (screen.value = { name: 'newGame' })}>{t('ui.title.new')}</PrimaryButton>
            <SecondaryButton disabled={saves.filter((s) => s.slot !== 'auto').length === 0} onClick={() => setLoad(true)}>
              {t('ui.title.load')}
            </SecondaryButton>
            <SecondaryButton onClick={() => fileRef.current?.click()}>{t('ui.title.import')}</SecondaryButton>
          </div>
        </Modal>
      )}
      {load && auto && <SlotPicker saves={saves} onPick={(s) => void loadSlot(s, auto.campaignId)} onClose={() => setLoad(false)} />}
    </div>
  );
}

function UpdateLink() {
  const status = updateStatus.value;
  useEffect(() => {
    void checkForUpdate();
  }, []);
  if (status === 'available') {
    return (
      <button class="btn small update-btn" onClick={installUpdate}>
        <Icon name="download" /> {t('ui.update.install')}
      </button>
    );
  }
  return (
    <button class="link-btn" disabled={status === 'checking'} onClick={() => void checkForUpdate()}>
      {t(`ui.update.${status === 'idle' ? 'check' : status}`)}
    </button>
  );
}

export function SlotPicker({ saves, onPick, onClose, save }: { saves: SaveRecord[]; onPick: (slot: SlotId) => void; onClose: () => void; save?: boolean }) {
  const slots: SlotId[] = ['1', '2', '3'];
  return (
    <Modal title={save ? t('ui.save.title') : t('ui.title.load')} onClose={onClose}>
      <div class="col">
        {slots.map((s) => {
          const rec = saves.find((r) => r.slot === s);
          return (
            <button key={s} class="btn" disabled={!save && !rec} onClick={() => onPick(s)} style={{ justifyContent: 'space-between' }}>
              <span>
                {t('ui.save.slot')} {s}
              </span>
              <span class="muted">{rec ? `${slotSummary(rec)} · ${new Date(rec.createdAt).toLocaleString()}` : t('ui.save.empty')}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function slotSummary(rec: SaveRecord): string {
  const c = rec.payload.campaign;
  const last = c.completed[c.completed.length - 1];
  return last ? t(nodeDef(last).titleKey).split('–')[0]!.trim() : t('ui.save.start');
}

export function downloadSave(rec: SaveRecord): void {
  const blob = new Blob([exportSave(rec)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hollow-crown-${rec.slot}-${rec.createdAt.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function exportCurrent(): Promise<void> {
  const id = campaignId.value;
  const rec = id ? await readSave(id, 'auto') : undefined;
  if (rec) downloadSave(rec);
}

const PORTRAITS = ['avatar_a', 'avatar_b'];

/** New game (U20): only name, portrait and difficulty up front; pronouns and death mode under "more". Affinity comes with the elements. */
export function NewGame() {
  const [name, setName] = useState('Rhen');
  const [pronoun, setPronoun] = useState<'she' | 'he' | 'they'>('they');
  const [portrait, setPortrait] = useState(PORTRAITS[0]!);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [deathMode, setDeathMode] = useState<DeathMode>('standard');
  const [more, setMore] = useState(false);
  const [limit, setLimit] = useState(false);
  const [failed, setFailed] = useState(false);
  const opt = <T extends string>(val: T, cur: T, set: (v: T) => void, label: string, sub?: string) => (
    <button key={val} class={`choice ${val === cur ? 'on' : ''}`} onClick={() => set(val)} aria-pressed={val === cur}>
      {label}
      {sub && <small>{sub}</small>}
    </button>
  );
  return (
    <div class="screen">
      <div class="screen-narrow col" style={{ gap: 20 }}>
        <div class="page-head">
          <button class="btn small ghost icon-only" onClick={() => (screen.value = { name: 'title' })} aria-label={t('ui.back')}>
            <Icon name="back" />
          </button>
          <div class="titles">
            <h2>{t('ui.new.title')}</h2>
          </div>
        </div>
        <div class="field">
          <label for="hc-name">{t('ui.new.name')}</label>
          <input id="hc-name" type="text" value={name} maxLength={14} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <span class="lbl">{t('ui.new.portrait')}</span>
          <div class="choice-row">
            {PORTRAITS.map((p) => (
              <button key={p} class={`choice ${p === portrait ? 'on' : ''}`} onClick={() => setPortrait(p)} aria-pressed={p === portrait} style={{ display: 'grid', placeItems: 'center', padding: 10 }}>
                <Crest id={p} name={name} w={84} h={98} />
              </button>
            ))}
          </div>
        </div>
        <div class="field">
          <span class="lbl">{t('ui.new.difficulty')}</span>
          <div class="choice-row">
            {(['easy', 'normal', 'hard'] as const).map((d) => opt(d, difficulty, setDifficulty, t(`ui.difficulty.${d}`), t(`ui.difficulty.${d}.desc`)))}
          </div>
        </div>
        <button class="linkish" style={{ alignSelf: 'flex-start' }} aria-expanded={more} onClick={() => setMore(!more)}>
          {more ? t('ui.new.less') : t('ui.new.more')}
        </button>
        {more && (
          <>
            <div class="field">
              <span class="lbl">{t('ui.new.pronoun')}</span>
              <div class="choice-row">
                {opt('she', pronoun, setPronoun, t('ui.pronoun.she.label'))}
                {opt('he', pronoun, setPronoun, t('ui.pronoun.he.label'))}
                {opt('they', pronoun, setPronoun, t('ui.pronoun.they.label'))}
              </div>
            </div>
            <div class="field">
              <span class="lbl">{t('ui.new.deathMode')}</span>
              <div class="choice-row">
                {(['classic', 'standard', 'casual'] as const).map((d) => opt(d, deathMode, setDeathMode, t(`ui.death.${d}`), t(`ui.death.${d}.desc`)))}
              </div>
            </div>
          </>
        )}
        <button
          class="btn primary big"
          disabled={!name.trim()}
          onClick={() => {
            setFailed(false);
            void startNewGame({ difficulty, deathMode }, { name: name.trim(), pronoun, portrait, affinity: DEFAULT_AFFINITY })
              .then((ok) => setLimit(!ok))
              .catch(() => setFailed(true));
          }}
        >
          {t('ui.new.start')}
        </button>
        {failed && <div class="dis">{t('ui.save.failed')}</div>}
      </div>
      {limit && <CampaignLimit onClose={() => setLimit(false)} />}
    </div>
  );
}

/**
 * At most three campaigns (concept/24-architecture §5.15): asks to delete one, with confirmation.
 * Interim dialog until the campaign view (story 1.3) takes over.
 */
function CampaignLimit({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<CampaignMeta[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const refresh = () => void listCampaigns().then(setList);
  useEffect(refresh, []);
  const remove = async (id: string) => {
    await deleteCampaign(id);
    setConfirm(null);
    onClose();
  };
  return (
    <Modal title={t('ui.campaign.limit.title')} onClose={onClose}>
      <div class="col">
        <div class="muted">{t('ui.campaign.limit.text')}</div>
        {list.map((m) => (
          <div key={m.id} class="row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <span>
              {m.name} · {t(`ui.death.${m.deathMode}`)} · {new Date(m.updatedAt).toLocaleString()}
            </span>
            <button class={`btn small ${confirm === m.id ? 'danger' : 'ghost'}`} onClick={() => (confirm === m.id ? void remove(m.id) : setConfirm(m.id))}>
              {confirm === m.id ? t('ui.campaign.deleteConfirm') : t('ui.campaign.delete')}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function WorldMap() {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(c.available[0] ?? null);
  const nodes = data.campaign.nodes;
  const node = sel ? nodeDef(sel) : null;
  return (
    <div class="screen" style={{ gap: 10 }}>
      <div class="page-head">
        <button class="btn small ghost icon-only" onClick={() => (screen.value = { name: 'camp' })} aria-label={t('ui.camp.title')}>
          <Icon name="back" />
        </button>
        <div class="titles">
          <span class="lbl">{t('ui.camp.title')}</span>
          <h2>{t('ui.world.title')}</h2>
        </div>
        <span class="hub-gold" style={{ padding: 0 }}>
          <Amount resource="gold" value={c.gold} />
        </span>
      </div>
      <div class="worldmap">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M8,30 C25,10 45,18 60,8 S92,20 94,40 S80,80 60,90 S20,92 10,70 Z" fill="rgba(110,140,90,0.18)" stroke="rgba(90,60,30,0.35)" stroke-width="0.4" />
          <path d="M70,5 L82,12 L76,22 L88,30" fill="none" stroke="rgba(80,60,40,0.4)" stroke-width="0.6" stroke-dasharray="1 1" />
          {nodes.map((n) =>
            n.next.map((nx) => {
              const m = nodes.find((x) => x.id === nx);
              return m ? <line key={n.id + nx} x1={n.pos[0]} y1={n.pos[1]} x2={m.pos[0]} y2={m.pos[1]} stroke="#3b2420" stroke-width="0.7" stroke-dasharray="1.5 1.2" /> : null;
            }),
          )}
        </svg>
        {nodes.map((n, i) => {
          const done = c.completed.includes(n.id);
          const avail = c.available.includes(n.id);
          return (
            <div key={n.id}>
              <div
                class={`node ${done ? 'done' : ''} ${avail ? 'next' : ''} ${!done && !avail ? 'locked' : ''}`}
                style={{ left: `${n.pos[0]}%`, top: `${n.pos[1]}%` }}
                onClick={() => setSel(n.id)}
              >
                <span>{i === 0 ? 'P' : i}</span>
              </div>
              <div class="node-label" style={{ left: `${n.pos[0]}%`, top: `${n.pos[1]}%` }}>
                {t(`map.${n.map}.name`)}
              </div>
            </div>
          );
        })}
      </div>
      {node && (
        <div class="panel solid sheet col">
          <h3>{t(node.titleKey)}</h3>
          <div class="muted">{t(`ui.world.goal.${data.maps[node.map]!.objectives.victory.type}`)}</div>
          {c.available.includes(node.id) ? (
            <button class="btn primary" onClick={() => playNode(node.id)}>
              {t('ui.world.go')}
            </button>
          ) : c.completed.includes(node.id) ? (
            <div class="muted">{t('ui.world.done')}</div>
          ) : (
            <div class="muted">{t('ui.world.locked')}</div>
          )}
        </div>
      )}
      {c.available.length === 0 && (
        <div class="panel solid sheet">
          <h3>{t('ui.world.endTitle')}</h3>
          <div class="muted">{t('ui.world.endText')}</div>
        </div>
      )}
    </div>
  );
}

export function Options({ back }: { back: Screen }) {
  const s = settings.value;
  const seg = <K extends keyof typeof s>(k: K, vals: Array<[(typeof s)[K], string]>) => (
    <div class="choice-row">
      {vals.map(([v, label]) => (
        <button key={String(v)} class={`choice ${s[k] === v ? 'on' : ''}`} aria-pressed={s[k] === v} onClick={() => updateSettings({ [k]: v } as Partial<typeof s>)}>
          {label}
        </button>
      ))}
    </div>
  );
  return (
    <div class="screen">
      <div class="screen-narrow col" style={{ gap: 14 }}>
        <div class="page-head">
          <button class="btn small ghost icon-only" onClick={() => (screen.value = back)} aria-label={t('ui.back')}>
            <Icon name="back" />
          </button>
          <div class="titles">
            <h2>{t('ui.options')}</h2>
          </div>
        </div>
        <div class="field">
          <label>{t('ui.opt.lang')}</label>
          {seg('lang', [['de', 'Deutsch'], ['en', 'English']])}
        </div>
        <div class="field">
          <label>{t('ui.opt.speed')}</label>
          {seg('speed', [[1, '1x'], [2, '2x'], [3, t('ui.opt.skip')]])}
        </div>
        <div class="field">
          <label>{t('ui.opt.enemySpeed')}</label>
          {seg('enemySpeed', [[1, '1x'], [2, '2x'], [3, t('ui.opt.skip')]])}
        </div>
        <div class="field">
          <label>{t('ui.opt.danger')}</label>
          {seg('dangerDefault', [[true, t('ui.on')], [false, t('ui.off')]])}
        </div>
        <div class="field">
          <label>{t('ui.opt.quality')}</label>
          {seg('quality', [['low', t('ui.opt.q.low')], ['mid', t('ui.opt.q.mid')], ['high', t('ui.opt.q.high')]])}
        </div>
        <div class="field">
          <label>{t('ui.opt.figures')}</label>
          {seg('figures', [['3d', t('ui.opt.fig.3d')], ['2d', t('ui.opt.fig.2d')]])}
        </div>
        <div class="field">
          <label>{t('ui.opt.shake')}</label>
          {seg('shake', [[true, t('ui.on')], [false, t('ui.off')]])}
        </div>
        <div class="field">
          <label>{t('ui.opt.music')}</label>
          <input type="range" min={0} max={1} step={0.05} value={s.music} onInput={(e) => updateSettings({ music: Number((e.target as HTMLInputElement).value) })} />
        </div>
        <div class="field">
          <label>{t('ui.opt.sfx')}</label>
          <input type="range" min={0} max={1} step={0.05} value={s.sfx} onInput={(e) => updateSettings({ sfx: Number((e.target as HTMLInputElement).value) })} />
        </div>
        <div class="field">
          <label>{t('ui.opt.keepAwake')}</label>
          {seg('keepAwake', [[true, t('ui.on')], [false, t('ui.off')]])}
        </div>
      </div>
    </div>
  );
}

export function Result({ result }: { result: import('../../core').BattleResult }) {
  const c = campaign.value!;
  const line = (icon: string, cls: string, text: string, key: string) => (
    <div key={key} class={`row ${cls}`} style={{ minHeight: 36 }}>
      <Icon name={icon} size={18} />
      <span>{text}</span>
    </div>
  );
  return (
    <div class="screen">
      <div class="screen-narrow col" style={{ gap: 18 }}>
        <div class="col" style={{ gap: 4 }}>
          <span class="lbl gold">{t(nodeDef(result.nodeId).titleKey)}</span>
          <h1>{t('ui.result.victory')}</h1>
          <span class="muted">{t('ui.result.turns', { count: result.turns })}</span>
        </div>
        <section class="col edge" style={{ paddingTop: 16, gap: 4 }}>
          <h3>{t('ui.result.objectives')}</h3>
          {result.side.map((s) => (
            <div key={s.id} class="row hair" style={{ minHeight: 44 }}>
              <span class={s.done ? 'adv' : 'muted'}>
                <Icon name={s.done ? 'check' : 'cross'} size={18} />
              </span>
              <span class="grow">{t(`ui.side.${s.type}`, { turns: s.turns ?? 0 })}</span>
              <RewardAmounts reward={s.reward} />
            </div>
          ))}
        </section>
        <section class="col" style={{ gap: 4 }}>
          <h3>{t('ui.result.loot')}</h3>
          <div class="row hair" style={{ minHeight: 44, flexWrap: 'wrap' }}>
            <Amount resource="gold" value={result.gold} signed />
            {Object.entries(result.materials).map(([m, n]) => (
              <Amount key={m} material={itemDef(data, m)} value={n} signed />
            ))}
          </div>
          {result.items.map((i) => (
            <div key={i.uid} class="row hair" style={{ minHeight: 40 }}>
              {itemName(data, i)}
            </div>
          ))}
        </section>
        <section class="col" style={{ gap: 4 }}>
          <h3>{t('ui.result.company')}</h3>
          {result.units.map((u) => (
            <div key={u.id} class="row hair" style={{ minHeight: 44 }}>
              <span class="grow" style={{ fontWeight: 600 }}>{unitName(u)}</span>
              <span class="num">
                {t('ui.lv')} {u.levelBefore}
                {u.levelAfter > u.levelBefore ? ` → ${u.levelAfter}` : ''}
              </span>
              <Amount resource="exp" value={u.exp} signed />
            </div>
          ))}
          {result.recruited.map((id) => line('star', 'adv', t('ui.result.recruited', { name: t(`unit.${id}.name`) }), `r${id}`))}
          {(result.granted ?? []).map((g) =>
            line('tome', 'adv', t('ui.result.granted', { name: g.id === 'avatar' ? (c.avatar.name ?? '') : t(`unit.${g.id}.name`), item: itemName(data, g.item) }), `g${g.item.uid}`),
          )}
          {result.scars.map((s) => line('scar', 'dis', `${t(`unit.${s.id}.name`)}: ${t(`scar.${s.scar}`)}`, `s${s.id}`))}
          {result.fallen.map((f) => line('fallen', 'dis', t('ui.result.fallen', { name: unitName(f) }), `f${f.id}`))}
          {result.supportsReady.length > 0 && line('campfire', 'gold', t('ui.result.supports'), 'sup')}
        </section>
        <button class="btn primary big" onClick={() => (screen.value = c.available.length ? { name: 'camp' } : { name: 'end' })}>
          {t('ui.result.continue')}
        </button>
      </div>
    </div>
  );
}

/** Reward of a side objective: amounts as symbol + number, items by name. */
export function RewardAmounts({ reward: r }: { reward: Reward }) {
  return (
    <span class="row muted" style={{ gap: 8, flexWrap: 'wrap' }}>
      {r.gold ? <Amount resource="gold" value={r.gold} /> : null}
      {Object.entries(r.material ?? {}).map(([m, n]) => (
        <Amount key={m} material={itemDef(data, m)} value={n} />
      ))}
      {r.item && <span>{t(`item.${r.item.def}.name`)}</span>}
    </span>
  );
}

export function EndScreen() {
  return (
    <div class="screen title-screen" style={{ justifyContent: 'center' }}>
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('backgrounds/bg_silverbrook_shrine.webp')})` }} />
      <div class="logo" style={{ fontSize: 'clamp(28px, 8vw, 48px)' }}>
        {t('ui.end.title')}
      </div>
      <div class="tagline">{t('ui.end.text')}</div>
      <div class="title-menu">
        <button class="btn primary big" onClick={() => (screen.value = { name: 'camp' })}>
          {t('ui.camp.title')}
        </button>
        <button class="btn" onClick={() => (screen.value = { name: 'title' })}>
          {t('ui.end.toTitle')}
        </button>
      </div>
    </div>
  );
}
