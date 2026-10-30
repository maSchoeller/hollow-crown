/**
 * Handbook (epic 14, EXPERIENCE.md "Handbuch", DESIGN.md Handbuch-Kategorie/-Eintrag, mockup 10): categories as stones in a
 * two-column grid with a search field; an entry shows its picture, the values resolved from the content (symbol + number), one
 * sentence "where in the game" and cross references as chips. Full screen from title and world map, a sheet over any other screen
 * (battle menu, context "?"); closing changes nothing in the game: no command, no save.
 */
import { useEffect, useId, useState } from 'preact/hooks';
import {
  categoryEntries,
  cycleOrder,
  formatHandbookValue,
  handbookCategoryKey,
  handbookEntryKey,
  handbookLabelKey,
  handbookParams,
  handbookValues,
  lineKey,
  searchHandbook,
  STAT_KEYS,
  type ClassDef,
  type Element,
  type GameData,
  type HandbookDef,
  type HandbookEntryDef,
} from '../../core';
import { has, lang, t } from '../../i18n';
import { Icon, ElementIcon } from '../../ui/icons';
import { Backdrop, Piece, ScreenHead } from '../../ui/pieces';
import { data } from '../state/session';
import { closeHandbook, handbookSheet } from '../state/handbook';
import { screen, type Screen } from '../state/screen';
import { roleIcon } from './BattleHud';
import './Handbook.css';

type View = { k: 'home' } | { k: 'cat'; id: string } | { k: 'entry'; id: string };

const locale = () => (lang.value === 'de' ? 'de-DE' : 'en-US');
const entryTitle = (id: string) => t(handbookEntryKey(id, 'title'));
const categoryOf = (hb: HandbookDef, id: string) => hb.categories.find((c) => c.id === id);
const entryIcon = (hb: HandbookDef, e: HandbookEntryDef) =>
  e.icon ?? (e.class ? roleIcon(data.classes[e.class]?.role ?? '') : (categoryOf(hb, e.category)?.icon ?? 'info'));

/** Full-screen handbook (title, world map menu). */
export function HandbookScreen({ back }: { back: Screen }) {
  return (
    <div class="hc-view hb-view">
      <Backdrop />
      <Handbook onClose={() => (screen.value = back)} />
    </div>
  );
}

/** The handbook as a sheet over the current screen; the battle below keeps its state. */
export function HandbookSheet() {
  const open = handbookSheet.value;
  void lang.value; // re-render on language change
  if (!open) return null;
  return (
    <div class="hb-veil" role="dialog" aria-modal="true" aria-label={t('handbook.ui.title')}>
      <Handbook key={open.entry ?? ''} start={open.entry} onClose={closeHandbook} />
    </div>
  );
}

function Handbook({ start, onClose }: { start?: string; onClose: () => void }) {
  const hb = data.handbook;
  const [stack, setStack] = useState<View[]>(start ? [{ k: 'entry', id: start }] : [{ k: 'home' }]);
  const [query, setQuery] = useState('');
  const view = stack[stack.length - 1]!;
  const back = () => (stack.length > 1 ? setStack(stack.slice(0, -1)) : onClose());
  const open = (v: View) => setStack([...stack, v]);
  useEffect(() => {
    // capture: Esc steps back here first and never reaches a sheet or the battle below
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      back();
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  });
  if (!hb) return null;
  const entry = view.k === 'entry' ? hb.entries.find((e) => e.id === view.id) : undefined;
  const title =
    view.k === 'home'
      ? t('handbook.ui.title')
      : view.k === 'cat'
        ? t(handbookCategoryKey(view.id, 'name'))
        : entry
          ? entryTitle(entry.id)
          : t('handbook.ui.title');
  const aside = entry
    ? entry.fromAct
      ? t('handbook.ui.fromAct', { act: entry.fromAct })
      : t(handbookCategoryKey(entry.category, 'name'))
    : undefined;
  return (
    <div class="hb">
      <ScreenHead title={title} aside={aside} onBack={back} />
      <Piece class="hc-view__scroll hb-body" key={stack.length}>
        {view.k === 'home' && <Home hb={hb} query={query} onQuery={setQuery} onOpen={open} />}
        {view.k === 'cat' && <Category hb={hb} id={view.id} onOpen={open} />}
        {entry && <Entry hb={hb} e={entry} onOpen={open} />}
      </Piece>
    </div>
  );
}

function Home({
  hb,
  query,
  onQuery,
  onOpen,
}: {
  hb: HandbookDef;
  query: string;
  onQuery: (q: string) => void;
  onOpen: (v: View) => void;
}) {
  const hits = query.trim() ? searchHandbook(hb, query, t) : null;
  return (
    <div class="hb-home">
      <label class="hb-search">
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          placeholder={t('handbook.ui.search')}
          aria-label={t('handbook.ui.search')}
          onInput={(e) => onQuery((e.target as HTMLInputElement).value)}
        />
      </label>
      {hits ? (
        hits.length ? (
          <EntryList hb={hb} list={hits} onOpen={onOpen} withCategory />
        ) : (
          <p class="hb-empty">{t('handbook.ui.noResults')}</p>
        )
      ) : (
        <div class="hb-cats">
          {hb.categories.map((c) => (
            <button key={c.id} type="button" class="hb-cat" onClick={() => onOpen({ k: 'cat', id: c.id })}>
              <span class="hb-cat__ico">
                <Icon name={c.icon} size={20} />
              </span>
              <b>{t(handbookCategoryKey(c.id, 'name'))}</b>
              <small>{t(handbookCategoryKey(c.id, 'sub'))}</small>
              <i>{t('handbook.ui.entries', { count: categoryEntries(hb, c.id).length })}</i>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Category({ hb, id, onOpen }: { hb: HandbookDef; id: string; onOpen: (v: View) => void }) {
  return <EntryList hb={hb} list={categoryEntries(hb, id)} onOpen={onOpen} />;
}

function EntryList({
  hb,
  list,
  onOpen,
  withCategory,
}: {
  hb: HandbookDef;
  list: HandbookEntryDef[];
  onOpen: (v: View) => void;
  withCategory?: boolean;
}) {
  return (
    <ul class="hb-list">
      {list.map((e) => (
        <li key={e.id}>
          <button type="button" class="hb-row" onClick={() => onOpen({ k: 'entry', id: e.id })}>
            <span class="hb-row__ico">
              <Icon name={entryIcon(hb, e)} size={18} />
            </span>
            <span class="hb-row__text">
              <b>{entryTitle(e.id)}</b>
              {(withCategory || e.fromAct) && (
                <small>
                  {withCategory && t(handbookCategoryKey(e.category, 'name'))}
                  {withCategory && e.fromAct ? ' · ' : ''}
                  {e.fromAct ? t('handbook.ui.fromAct', { act: e.fromAct }) : ''}
                </small>
              )}
            </span>
            <Icon name="forward" size={18} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Entry({ hb, e, onOpen }: { hb: HandbookDef; e: HandbookEntryDef; onOpen: (v: View) => void }) {
  const loc = locale();
  const params = handbookParams(data, e, loc);
  const values = handbookValues(data, e);
  return (
    <article class="hb-entry">
      <Graphic hb={hb} e={e} />
      <p class="hb-text">{t(handbookEntryKey(e.id, 'text'), params)}</p>
      {values.length > 0 && (
        <section class="hb-values" aria-label={t('handbook.ui.values')}>
          <dl>
            {values.map(({ def, value }) => (
              <div key={def.id}>
                <dt>{t(handbookLabelKey(def))}</dt>
                <dd>
                  {def.icon && <Icon name={def.icon} size={14} />}
                  {formatHandbookValue(value, def.format, loc)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {e.class && <ClassLines e={e} />}
      <p class="hb-where">
        <b>{t('handbook.ui.where')}</b>
        {t(handbookEntryKey(e.id, 'where'), params)}
      </p>
      {e.see.length > 0 && (
        <nav class="hb-see" aria-label={t('handbook.ui.see')}>
          <b>{t('handbook.ui.see')}</b>
          <span>
            {e.see.map((id) => (
              <button key={id} type="button" class="hb-chip" onClick={() => onOpen({ k: 'entry', id })}>
                {entryTitle(id)}
                <Icon name="forward" size={14} />
              </button>
            ))}
          </span>
        </nav>
      )}
    </article>
  );
}

// ------------------------------------------------------------------ pictures (all drawn from the content)

function Graphic({ hb, e }: { hb: HandbookDef; e: HandbookEntryDef }) {
  switch (e.graphic) {
    case 'triangle':
      return <TriangleGraphic d={data} />;
    case 'elements':
      return <ElementsGraphic d={data} />;
    case 'terrain':
      return <TerrainTables d={data} ids={e.terrain ?? []} />;
    case 'class':
      return e.class && data.classes[e.class] ? <ClassProfile c={data.classes[e.class]!} /> : null;
    case 'lesson':
      return <LessonLines scene={e.lesson ?? ''} />;
    case 'rarity':
      return <RarityTable d={data} />;
    case 'icon':
      return (
        <div class="hb-icon" aria-hidden="true">
          <Icon name={entryIcon(hb, e)} size={40} />
        </div>
      );
  }
}

/** Nodes on a circle with arrows from each to the next (it beats it); HTML nodes over an SVG of arrows. */
function Cycle({ nodes, label }: { nodes: Array<{ id: string; body: preact.ComponentChildren }>; label?: string }) {
  const marker = useId();
  const n = nodes.length;
  const pos = nodes.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [50 + 36 * Math.cos(a), 50 + 36 * Math.sin(a)] as const;
  });
  const r = 14;
  const outward = (mx: number, my: number): [number, number] => {
    const len = Math.hypot(mx - 50, my - 50) || 1;
    return [((mx - 50) / len) * 7, ((my - 50) / len) * 7];
  };
  return (
    <div class="hb-cycle">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="var(--hc-positive)" />
          </marker>
        </defs>
        {pos.map(([x, y], i) => {
          const [x2, y2] = pos[(i + 1) % n]!;
          const len = Math.hypot(x2 - x, y2 - y);
          const ux = (x2 - x) / len;
          const uy = (y2 - y) / len;
          return (
            <g key={i}>
              <line
                x1={x + ux * r}
                y1={y + uy * r}
                x2={x2 - ux * (r + 2)}
                y2={y2 - uy * (r + 2)}
                stroke="var(--hc-positive)"
                stroke-width="1.6"
                marker-end={`url(#${marker})`}
              />
              {label && (
                // beside the arrow, on the side away from the centre
                <text
                  x={(x + x2) / 2 + outward((x + x2) / 2, (y + y2) / 2)[0]}
                  y={(y + y2) / 2 + outward((x + x2) / 2, (y + y2) / 2)[1]}
                  text-anchor="middle"
                  dominant-baseline="middle"
                  class="hb-cycle__beats"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {nodes.map((node, i) => (
        <span key={node.id} class="hb-cycle__node" style={{ left: `${pos[i]![0]}%`, top: `${pos[i]![1]}%` }}>
          {node.body}
        </span>
      ))}
    </div>
  );
}

function TriangleGraphic({ d }: { d: GameData }) {
  const order = cycleOrder(d.balance.triangle.beats);
  return (
    <figure
      class="hb-figure"
      role="img"
      aria-label={order
        .map(
          (w, i) =>
            `${t(`ui.weapon.${w}`)} ${t('handbook.ui.beats')} ${t(`ui.weapon.${order[(i + 1) % order.length]}`)}`,
        )
        .join(', ')}
    >
      <Cycle label={t('handbook.ui.beats')} nodes={order.map((w) => ({ id: w, body: <b>{t(`ui.weapon.${w}`)}</b> }))} />
    </figure>
  );
}

function ElementsGraphic({ d }: { d: GameData }) {
  const order = cycleOrder(d.balance.element.cycle) as Element[];
  const name = (el: string) => t(`ui.element.${el}`);
  const node = (el: Element) => (
    <span class={`hb-el hb-el--${el}`}>
      <ElementIcon el={el} size={18} />
      <small>{name(el)}</small>
    </span>
  );
  return (
    <figure
      class="hb-figure"
      role="img"
      aria-label={order
        .map((el, i) => `${name(el)} ${t('handbook.ui.beats')} ${name(order[(i + 1) % order.length]!)}`)
        .join(', ')}
    >
      <Cycle nodes={order.map((el) => ({ id: el, body: node(el) }))} />
      {d.balance.element.opposed.map(([a, b]) => (
        <div key={`${a}-${b}`} class="hb-opposed">
          {node(a as Element)}
          <span aria-hidden="true">⇄</span>
          {node(b as Element)}
        </div>
      ))}
    </figure>
  );
}

const MOVE_TYPES = ['foot', 'armored', 'mounted', 'flier', 'monster'] as const;

function TerrainTables({ d, ids }: { d: GameData; ids: string[] }) {
  const list = ids.map((id) => d.terrain[id]).filter((x) => !!x);
  const num = (v: number | null) => (v === null ? t('handbook.ui.impassable') : String(v));
  return (
    <div class="hb-tables">
      <table class="hb-table">
        <thead>
          <tr>
            <th scope="col">{t('handbook.ui.terrain')}</th>
            <th scope="col" title={t('ui.stat.def')}>
              <Icon name="shield" size={14} label={t('ui.stat.def')} />
            </th>
            <th scope="col" title={t('ui.avoid')}>
              <Icon name="avoid" size={14} label={t('ui.avoid')} />
            </th>
            <th scope="col" title={t('ui.heal')}>
              <Icon name="healer" size={14} label={t('ui.heal')} />
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((x) => (
            <tr key={x.id}>
              <th scope="row">{t(`terrain.${x.id}`)}</th>
              <td>{x.def}</td>
              <td>{x.avoid}</td>
              <td>{x.heal ? `${x.heal}%` : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table class="hb-table">
        <caption>{t('handbook.ui.cost')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('handbook.ui.terrain')}</th>
            {MOVE_TYPES.map((m) => (
              <th key={m} scope="col" title={t(`handbook.move.${m}`)}>
                {t(`handbook.moveShort.${m}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((x) => (
            <tr key={x.id}>
              <th scope="row">{t(`terrain.${x.id}`)}</th>
              {MOVE_TYPES.map((m) => (
                <td key={m}>{num(x.cost[m])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RarityTable({ d }: { d: GameData }) {
  const { rarityAffixes, rarityRuneSlots } = d.balance.economy as {
    rarityAffixes: Record<string, number>;
    rarityRuneSlots: Record<string, number>;
  };
  return (
    <table class="hb-table">
      <thead>
        <tr>
          <th scope="col" />
          <th scope="col">{t('handbook.ui.affixes')}</th>
          <th scope="col">{t('handbook.ui.runeSlots')}</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(rarityAffixes).map((r, i) => (
          <tr key={r}>
            <th scope="row" class={`hb-rarity is-${r}`}>
              <span class="hb-gems" aria-hidden="true">
                {Array.from({ length: i }, (_, k) => (
                  <i key={k} />
                ))}
              </span>
              {t(`ui.itemInfo.rarity.${r}`)}
            </th>
            <td>{rarityAffixes[r]}</td>
            <td>{rarityRuneSlots[r] ?? '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Growth as a value web (story 14.5): one spoke per stat, 0–100 %. */
function Radar({ growth }: { growth: ClassDef['growth'] }) {
  const n = STAT_KEYS.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (Math.max(0, Math.min(100, v)) / 100) * 38;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
  };
  const ring = (v: number) => STAT_KEYS.map((_, i) => pt(i, v).join(',')).join(' ');
  return (
    <svg
      class="hb-radar"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${t('handbook.ui.growth')}: ${STAT_KEYS.map((k) => `${t(`ui.stat.${k}`)} ${growth[k]}%`).join(', ')}`}
    >
      {[25, 50, 75, 100].map((v) => (
        <polygon key={v} points={ring(v)} class="hb-radar__ring" />
      ))}
      {STAT_KEYS.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1="50" y1="50" x2={x} y2={y} class="hb-radar__ring" />;
      })}
      <polygon points={STAT_KEYS.map((k, i) => pt(i, growth[k]).join(',')).join(' ')} class="hb-radar__shape" />
      {STAT_KEYS.map((k, i) => {
        const [x, y] = pt(i, 122);
        return (
          <text key={k} x={x} y={y} text-anchor="middle" dominant-baseline="middle" class="hb-radar__label">
            {t(`ui.stat.${k}`)}
          </text>
        );
      })}
    </svg>
  );
}

const proName = (id: string) => (has(`class.${id}.name`) ? t(`class.${id}.name`) : t(`handbook.pro.${id}`));

function ClassProfile({ c }: { c: ClassDef }) {
  const action = c.classAction;
  const skill = c.skill && has(`skill.${c.skill}.name`) ? t(`skill.${c.skill}.name`) : undefined;
  return (
    <div class="hb-class">
      <div class="hb-class__head">
        <span class="hb-class__role">
          <Icon name={roleIcon(c.role)} size={26} />
        </span>
        <Radar growth={c.growth} />
      </div>
      <dl class="hb-values hb-facts">
        <div>
          <dt>{t('handbook.ui.mov')}</dt>
          <dd>
            <Icon name="next" size={14} />
            {c.mov}
          </dd>
        </div>
        <div>
          <dt>{t('handbook.ui.moveType')}</dt>
          <dd>{t(`handbook.move.${c.moveType}`)}</dd>
        </div>
        <div>
          <dt>{t('handbook.ui.weapons')}</dt>
          <dd>{c.weaponGroups.map((g) => t(`ui.weapon.${g}`)).join(', ')}</dd>
        </div>
        {action && (
          <div>
            <dt>{t('handbook.ui.classAction')}</dt>
            <dd>
              {t(`handbook.action.${action.id}`)}
              <small>
                {action.kind === 'passive'
                  ? t('handbook.ui.passive')
                  : action.perMap
                    ? t('handbook.ui.perMap', { n: action.perMap })
                    : ''}
              </small>
            </dd>
          </div>
        )}
        {skill && (
          <div>
            <dt>{t('handbook.ui.classSkill')}</dt>
            <dd>{skill}</dd>
          </div>
        )}
        {c.proPaths.length > 0 && (
          <div>
            <dt>{t('handbook.ui.proPaths')}</dt>
            <dd>{c.proPaths.map(proName).join(' · ')}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/** "stark" and "schwach", two or three lines each (locales `strong.1`…`weak.3`). */
function ClassLines({ e }: { e: HandbookEntryDef }) {
  const lines = (part: 'strong' | 'weak') =>
    [1, 2, 3].map((i) => handbookEntryKey(e.id, `${part}.${i}`)).filter((k) => has(k));
  return (
    <div class="hb-sw">
      {(['strong', 'weak'] as const).map((part) => (
        <section key={part} class={`hb-sw__col is-${part}`}>
          <b>{t(`handbook.ui.${part}`)}</b>
          <ul>
            {lines(part).map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** The lines of a lesson scene from the scene's own keys (no copy); speakers by name. */
function LessonLines({ scene }: { scene: string }) {
  const def = data.scenes[scene];
  if (!def) return <p class="hb-empty">{t('handbook.ui.lessonMissing')}</p>;
  return (
    <ol class="hb-lesson">
      {def.lines.map((l) =>
        'choice' in l ? null : (
          <li key={l.id}>
            {l.speaker?.[0] && <b>{t(l.speaker[0] === 'avatar' ? 'unit.avatar.name' : `unit.${l.speaker[0]}.name`)}</b>}
            <span>{t(lineKey(scene, l.id))}</span>
          </li>
        ),
      )}
    </ol>
  );
}
