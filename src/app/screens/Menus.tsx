import { useEffect, useRef, useState } from 'preact/hooks';
import type { DeathMode, Difficulty, Element } from '../../core';
import { t } from '../../i18n';
import { asset, ELEMENT_ICON, itemName, Modal, Portrait, unitName } from '../../ui/components';
import { exportSave, importSave, listSaves, readSave, type SaveRecord, type SlotId } from '../../persistence/save';
import {
  campaign,
  data,
  loadSlot,
  nodeDef,
  playNode,
  restore,
  screen,
  settings,
  startNewGame,
  updateSettings,
  type Screen,
} from '../store';

export function Title() {
  const [saves, setSaves] = useState<SaveRecord[]>([]);
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void listSaves().then(setSaves).catch(() => setSaves([]));
  }, []);
  const auto = saves.find((s) => s.slot === 'auto');
  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const rec = importSave(await f.text());
      restore(rec.payload);
    } catch {
      setErr(t('ui.title.importFailed'));
    }
  };
  return (
    <div class="screen title-screen">
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('backgrounds/bg_camp_night.webp')})` }} />
      <div class="logo">HOLLOW CROWN</div>
      <div class="tagline">{t('ui.title.tagline')}</div>
      <div class="title-menu">
        {auto && (
          <button class="btn primary" onClick={() => void loadSlot('auto')}>
            {t('ui.title.continue')}
          </button>
        )}
        <button class={`btn ${auto ? '' : 'primary'}`} onClick={() => (screen.value = { name: 'newGame' })}>
          {t('ui.title.new')}
        </button>
        <button class="btn" disabled={saves.filter((s) => s.slot !== 'auto').length === 0} onClick={() => setLoad(true)}>
          {t('ui.title.load')}
        </button>
        <div class="row">
          <button class="btn grow" onClick={() => fileRef.current?.click()}>
            {t('ui.title.import')}
          </button>
          <button class="btn grow" onClick={() => (screen.value = { name: 'options', back: { name: 'title' } })}>
            {t('ui.options')}
          </button>
        </div>
        {err && <div class="dis">{err}</div>}
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => void onImport((e.target as HTMLInputElement).files?.[0])} />
        <div class="muted" style={{ fontSize: 12 }}>
          {t('ui.title.version')} {import.meta.env.VITE_APP_VERSION ?? '0.1.0'}
        </div>
      </div>
      {load && <SlotPicker saves={saves} onPick={(s) => void loadSlot(s)} onClose={() => setLoad(false)} />}
    </div>
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
  const rec = await readSave('auto');
  if (rec) downloadSave(rec);
}

const PORTRAITS = ['avatar_a', 'avatar_b'];

export function NewGame() {
  const [name, setName] = useState('Rhen');
  const [pronoun, setPronoun] = useState<'she' | 'he' | 'they'>('they');
  const [portrait, setPortrait] = useState(PORTRAITS[0]!);
  const [affinity, setAffinity] = useState<Element>('wind');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [deathMode, setDeathMode] = useState<DeathMode>('standard');
  const opt = <T extends string>(val: T, cur: T, set: (v: T) => void, label: string, sub?: string) => (
    <div class={`choice ${val === cur ? 'on' : ''}`} onClick={() => set(val)} role="button">
      {label}
      {sub && <small>{sub}</small>}
    </div>
  );
  return (
    <div class="screen">
      <div class="screen-narrow col" style={{ gap: 14 }}>
        <div class="row">
          <button class="btn small ghost" onClick={() => (screen.value = { name: 'title' })}>
            ◀
          </button>
          <h2>{t('ui.new.title')}</h2>
        </div>
        <div class="field">
          <label>{t('ui.new.name')}</label>
          <input type="text" value={name} maxLength={14} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label>{t('ui.new.pronoun')}</label>
          <div class="choice-row">
            {opt('she', pronoun, setPronoun, t('ui.pronoun.she.label'))}
            {opt('he', pronoun, setPronoun, t('ui.pronoun.he.label'))}
            {opt('they', pronoun, setPronoun, t('ui.pronoun.they.label'))}
          </div>
        </div>
        <div class="field">
          <label>{t('ui.new.portrait')}</label>
          <div class="choice-row">
            {PORTRAITS.map((p) => (
              <div key={p} class={`choice ${p === portrait ? 'on' : ''}`} onClick={() => setPortrait(p)} role="button" style={{ display: 'grid', placeItems: 'center' }}>
                <Portrait id={p} name={name} size={86} />
              </div>
            ))}
          </div>
        </div>
        <div class="field">
          <label>{t('ui.new.affinity')}</label>
          <div class="choice-row">
            {(['fire', 'wind', 'earth', 'water'] as const).map((e) => opt(e, affinity, setAffinity, `${ELEMENT_ICON[e]} ${t(`ui.element.${e}`)}`))}
          </div>
        </div>
        <div class="field">
          <label>{t('ui.new.difficulty')}</label>
          <div class="choice-row">
            {(['easy', 'normal', 'hard'] as const).map((d) => opt(d, difficulty, setDifficulty, t(`ui.difficulty.${d}`), t(`ui.difficulty.${d}.desc`)))}
          </div>
        </div>
        <div class="field">
          <label>{t('ui.new.deathMode')}</label>
          <div class="choice-row">
            {(['classic', 'standard', 'casual'] as const).map((d) => opt(d, deathMode, setDeathMode, t(`ui.death.${d}`), t(`ui.death.${d}.desc`)))}
          </div>
        </div>
        <button
          class="btn primary"
          disabled={!name.trim()}
          onClick={() => {
            startNewGame({ difficulty, deathMode }, { name: name.trim(), pronoun, portrait, affinity });
          }}
        >
          {t('ui.new.start')}
        </button>
      </div>
    </div>
  );
}

export function WorldMap() {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(c.available[0] ?? null);
  const nodes = data.campaign.nodes;
  const node = sel ? nodeDef(sel) : null;
  return (
    <div class="screen" style={{ gap: 10 }}>
      <div class="row">
        <h2 class="grow">{t('ui.world.title')}</h2>
        <span class="chip">
          <span class="gold">◉</span> <span class="num">{c.gold}</span>
        </span>
        <button class="btn small" onClick={() => (screen.value = { name: 'camp' })}>
          ⛺ {t('ui.camp.title')}
        </button>
        <button class="btn small ghost" onClick={() => (screen.value = { name: 'options', back: { name: 'worldmap' } })}>
          ⚙
        </button>
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
                {i === 0 ? 'P' : i}
              </div>
              <div class="node-label" style={{ left: `${n.pos[0]}%`, top: `${n.pos[1]}%` }}>
                {t(`map.${n.map}.name`)}
              </div>
            </div>
          );
        })}
      </div>
      {node && (
        <div class="panel sheet col">
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
        <div class="panel sheet">
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
        <div key={String(v)} class={`choice ${s[k] === v ? 'on' : ''}`} onClick={() => updateSettings({ [k]: v } as Partial<typeof s>)}>
          {label}
        </div>
      ))}
    </div>
  );
  return (
    <div class="screen">
      <div class="screen-narrow col" style={{ gap: 14 }}>
        <div class="row">
          <button class="btn small ghost" onClick={() => (screen.value = back)}>
            ◀
          </button>
          <h2>{t('ui.options')}</h2>
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
  return (
    <div class="screen">
      <div class="screen-narrow col" style={{ gap: 12 }}>
        <h2 style={{ fontSize: 26 }}>{t('ui.result.victory')}</h2>
        <div class="muted">{t(nodeDef(result.nodeId).titleKey)} · {t('ui.result.turns', { count: result.turns })}</div>
        <div class="panel sheet col">
          <h3>{t('ui.result.objectives')}</h3>
          {result.side.map((s) => (
            <div key={s.id} class="row">
              <span class={s.done ? 'adv' : 'dis'}>{s.done ? '✔' : '✘'}</span>
              <span class="grow">{t(`ui.side.${s.type}`, { turns: s.turns ?? 0 })}</span>
              <span class="muted">{rewardText(s.reward)}</span>
            </div>
          ))}
        </div>
        <div class="panel sheet col">
          <h3>{t('ui.result.loot')}</h3>
          <div>
            <span class="gold">◉</span> <span class="num">+{result.gold}</span>
            {Object.entries(result.materials).map(([m, n]) => (
              <span key={m} style={{ marginLeft: 10 }}>
                {t(`item.${m}.name`)} ×{n}
              </span>
            ))}
          </div>
          {result.items.map((i) => (
            <div key={i.uid}>• {itemName(data, i)}</div>
          ))}
        </div>
        <div class="panel sheet col">
          <h3>{t('ui.result.company')}</h3>
          {result.units.map((u) => (
            <div key={u.id} class="row">
              <span class="grow">{unitName(u)}</span>
              <span class="num">
                {t('ui.lv')} {u.levelBefore}
                {u.levelAfter > u.levelBefore ? ` → ${u.levelAfter}` : ''}
              </span>
              <span class="muted">+{u.exp} {t('ui.stat.exp')}</span>
            </div>
          ))}
          {result.recruited.map((id) => (
            <div key={id} class="adv">
              ★ {t('ui.result.recruited', { name: t(`unit.${id}.name`) })}
            </div>
          ))}
          {result.scars.map((s) => (
            <div key={s.id} class="dis">
              ✚ {t(`unit.${s.id}.name`)}: {t(`scar.${s.scar}`)}
            </div>
          ))}
          {result.fallen.map((f) => (
            <div key={f.id} class="dis">
              ✝ {t('ui.result.fallen', { name: unitName(f) })}
            </div>
          ))}
          {result.supportsReady.length > 0 && <div class="gold">🔥 {t('ui.result.supports')}</div>}
        </div>
        <button class="btn primary" onClick={() => (screen.value = c.available.length ? { name: 'camp' } : { name: 'end' })}>
          {t('ui.result.continue')}
        </button>
      </div>
    </div>
  );
}

export function rewardText(r: import('../../core').Reward): string {
  const parts: string[] = [];
  if (r.gold) parts.push(`${r.gold} ${t('ui.gold')}`);
  if (r.item) parts.push(t(`item.${r.item.def}.name`));
  for (const [m, n] of Object.entries(r.material ?? {})) parts.push(`${t(`item.${m}.name`)} ×${n}`);
  return parts.join(', ');
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
        <button class="btn primary" onClick={() => (screen.value = { name: 'camp' })}>
          ⛺ {t('ui.camp.title')}
        </button>
        <button class="btn" onClick={() => (screen.value = { name: 'title' })}>
          {t('ui.end.toTitle')}
        </button>
      </div>
    </div>
  );
}
