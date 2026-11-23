/**
 * Story 16.15: the figure sheet as a dress-up doll (EXPERIENCE "Figurenblatt (Ankleidepuppe)", DESIGN `dress-doll`, `doll-sheet`,
 * `performance-grid`; mockup art/mockups/ausruestung-2026-11/truppe.html variant A): the figure's board model in 3D over the whole
 * screen, the head pill on top, the six places hanging over the picture, and a light sheet below that is a quarter high (performance
 * grid, bag, load), raised just over half (base stats, skills, elements, and what the old sheet had) or, with a place chosen, almost
 * two thirds (the item's details as when buying). The logic lives in `dollViewModel.ts`; the picture in `UnitStageFrame.tsx`.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  canPromote,
  changeList,
  clone,
  computeStats,
  equipBestOpen,
  expProgress,
  gearTemplatesOpen,
  heritageStone,
  itemDef,
  loadoutSlots,
  runEquipBest,
  runGearTemplate,
  STAT_KEYS,
  type CampaignCommand,
  type EquipSlot,
  type GearRun,
  type GameData,
  type ItemInstance,
  type UnitRecord,
} from '../../core';
import { activeSkillIds } from '../../core/rules/skills';
import { t } from '../../i18n';
import { ChangeList, STAT_ICON } from '../../ui/ChangeList';
import { ItemLine, Toast, TraitChips, unitName } from '../../ui/components';
import { ElementDot, Icon } from '../../ui/icons';
import { asInstance, itemInfo, itemName, rarityOf } from '../../ui/itemInfo';
import { shownRelics } from '../../ui/relicView';
import { Amount, ItemImage, PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { audio } from '../audio';
import { campaign, campaignCommand, campaignRelics, data } from '../state/session';
import { screen } from '../state/screen';
import { settings } from '../state/settings';
import { openWeapon } from '../state/weaponView';
import {
  bagCandidates,
  bagEquipCommand,
  bagPlaces,
  bagReturnCommand,
  convoyIsFull,
  dollSlots,
  elementChips,
  keyRing,
  LEFT_SLOTS,
  performanceCells,
  pickedItem,
  RIGHT_SLOTS,
  ROLE_ICON,
  samePick,
  STAT_NAME,
  strongestStats,
  type DollPick,
  type DollSlot,
} from './dollViewModel';
import { UnitStageFrame } from './UnitStageFrame';
import './Doll.css';

const SWIPE_PX = 56;
const ROMAN = ['', 'I', 'II', 'III'];

export interface DollProps {
  unit: UnitRecord;
  units: string[];
  onSelect: (id: string) => void;
  onBack: () => void;
  /** shows the same without changing anything */
  readOnly?: boolean;
  /** the 3D stage: only where the doll is a screen of its own (one scene at a time; the preparation shows the bust) */
  stage3d?: boolean;
  pick: DollPick | null;
  onPick: (pick: DollPick | null) => void;
  /** "Change" / "Equip": open the equip list of the place */
  onSwap: (slot: EquipSlot | 'bag', index: number) => void;
}

export function Doll({ unit, units, onSelect, onBack, readOnly, stage3d = false, pick, onPick, onSwap }: DollProps) {
  const c = campaign.value!;
  const [toast, setToast] = useState<string | null>(null);
  const [raised, setRaised] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const grip = useRef<number | null>(null);
  const pos = units.indexOf(unit.id);
  const step = (d: number) => {
    if (units.length < 2) return;
    onSelect(units[(pos + d + units.length) % units.length]!);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pos, units, onSelect]);
  const st = computeStats(data, unit, { relics: campaignRelics.value });
  const exp = expProgress(data, unit);
  const promotable = canPromote(data, c, unit);
  const name = unitName(unit);
  const apply = (cmd: CampaignCommand): boolean => {
    const r = campaignCommand(cmd);
    if (r.ok) audio.sfx('confirm');
    else {
      audio.sfx('error');
      setToast(t(`ui.camp.err.${r.error}`));
    }
    return r.ok;
  };
  const mode = pick ? 'detail' : raised ? 'half' : 'quarter';
  const togglePick = (p: DollPick) => onPick(samePick(pick, p) ? null : p);

  const swipeHandlers = {
    onPointerDown: (e: PointerEvent) => (swipe.current = { x: e.clientX, y: e.clientY }),
    onPointerUp: (e: PointerEvent) => {
      const s = swipe.current;
      swipe.current = null;
      if (s && Math.abs(e.clientX - s.x) > SWIPE_PX && Math.abs(e.clientY - s.y) < 40) step(e.clientX < s.x ? 1 : -1);
    },
    onPointerCancel: () => (swipe.current = null),
  };
  const gripHandlers = {
    onPointerDown: (e: PointerEvent) => {
      e.stopPropagation();
      grip.current = e.clientY;
    },
    onPointerUp: (e: PointerEvent) => {
      e.stopPropagation();
      const from = grip.current;
      grip.current = null;
      if (from === null) return;
      const dy = e.clientY - from;
      // pulled up raises, pulled down lowers (a chosen place is let go first); a tap does the other of the two
      if (dy < -24) setRaised(true);
      else if (dy > 24) {
        if (pick) onPick(null);
        else setRaised(false);
      } else if (pick) onPick(null);
      else setRaised(!raised);
    },
    onPointerCancel: () => (grip.current = null),
  };

  return (
    <div class={`doll doll--${mode}`}>
      <UnitStageFrame data={data} quality={settings.value.quality} unit={unit} enabled={stage3d}>
        <div class="doll__top">
          <button type="button" class="hc-head__back" onClick={onBack} aria-label={t('ui.back')}>
            <Icon name="back" size={22} />
          </button>
          <div class="doll__pill" {...swipeHandlers}>
            {units.length > 1 && (
              <button type="button" class="doll__nav" onClick={() => step(-1)} aria-label={t('ui.figure.prev')}>
                <Icon name="back" size={16} />
              </button>
            )}
            <div class="doll__who">
              <b class="doll__name">{name}</b>
              <span class="doll__sub">
                <Icon name={ROLE_ICON[data.classes[unit.classId]?.roleGroup ?? 'melee']} size={14} />
                {t(`class.${unit.classId}.name`)} · {t('ui.lv')} {unit.level}
                {promotable && !readOnly && (
                  <span class="doll__up" title={t('ui.doll.promoteHint')}>
                    <Icon name="up" size={13} label={t('ui.doll.promoteHint')} />
                  </span>
                )}
                {' · '}
                {exp.capped ? (
                  t('ui.figure.levelCapped', { level: exp.cap, act: exp.act })
                ) : exp.full ? (
                  t('ui.figure.maxLevel')
                ) : (
                  <span>
                    <Amount resource="exp" value={exp.exp} /> / {exp.need}
                  </span>
                )}
              </span>
            </div>
            {units.length > 1 && (
              <button type="button" class="doll__nav" onClick={() => step(1)} aria-label={t('ui.figure.next')}>
                <Icon name="forward" size={16} />
              </button>
            )}
          </div>
        </div>

        <div class="doll__col doll__col--left" role="group" aria-label={t('ui.doll.slots')}>
          {dollSlots(data, unit, LEFT_SLOTS).map((s) => (
            <SlotStone key={s.slot} s={s} selected={pick?.kind === 'slot' && pick.slot === s.slot} onTap={() => togglePick({ kind: 'slot', slot: s.slot })} />
          ))}
        </div>
        <div class="doll__col doll__col--right" role="group" aria-label={t('ui.doll.slots')}>
          {dollSlots(data, unit, RIGHT_SLOTS).map((s) => (
            <SlotStone key={s.slot} s={s} selected={pick?.kind === 'slot' && pick.slot === s.slot} onTap={() => togglePick({ kind: 'slot', slot: s.slot })} />
          ))}
        </div>

        <section class="doll__sheet" {...swipeHandlers}>
          <button type="button" class="doll__grip" aria-label={t('ui.doll.grip')} aria-expanded={mode !== 'quarter'} {...gripHandlers} />
          <div class="doll__body">
            {pick ? (
              <PickView unit={unit} pick={pick} readOnly={!!readOnly} apply={apply} onPick={onPick} onSwap={onSwap} />
            ) : (
              <>
                <div class="dl-perf" role="group" aria-label={t('ui.doll.perfTitle')}>
                  {performanceCells(data, unit, campaignRelics.value).map((p) => (
                    <div key={p.key} class={`dl-perf__cell ${p.none ? 'is-none' : ''}`}>
                      <span class="dl-perf__v">
                        <Icon name={STAT_ICON[p.key]} size={14} />
                        <b>{p.value}</b>
                      </span>
                      <small>{t(`ui.doll.perf.${p.key}`)}</small>
                    </div>
                  ))}
                </div>
                <div class="doll__bagrow">
                  <span class="doll__tag">{t('ui.doll.bag')}</span>
                  <div class="doll__bag">
                    {bagPlaces(data, unit).map((b) => (
                      <button
                        key={b.index}
                        type="button"
                        class={`dl-bagstone ${b.item ? '' : 'is-empty'}`}
                        disabled={readOnly}
                        onClick={() => togglePick({ kind: 'bag', index: b.index })}
                        aria-label={b.item ? t('ui.doll.bagFull', { n: b.index + 1, item: t(`item.${b.item.def}.name`) }) : t('ui.doll.bagFree', { n: b.index + 1 })}
                      >
                        {b.item ? <ItemImage data={data} item={b.item} size={36} /> : <Icon name="plus" size={16} />}
                      </button>
                    ))}
                    {keyRing(data, unit).map((k) => (
                      <span key={k.uid} class="dl-bagstone is-key" role="img" aria-label={t('ui.doll.keyItem', { item: t(`item.${k.def}.name`) })}>
                        <ItemImage data={data} item={k} size={36} />
                      </span>
                    ))}
                  </div>
                  <div class={`doll__load ${st.overload > 0 ? 'is-over' : ''}`} title={t('ui.doll.load')}>
                    <Icon name="load" size={14} />
                    <div class="doll__bar" role="progressbar" aria-label={t('ui.doll.load')} aria-valuemin={0} aria-valuemax={st.carry} aria-valuenow={st.load}>
                      <i style={{ width: `${Math.min(100, (st.load / Math.max(1, st.carry)) * 100)}%` }} />
                    </div>
                    <span>
                      {st.load}/{st.carry}
                    </span>
                  </div>
                </div>
                {raised && <MoreView unit={unit} readOnly={!!readOnly} apply={apply} setToast={setToast} />}
              </>
            )}
          </div>
        </section>
      </UnitStageFrame>
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

/** One of the six places over the picture: 46 px stone with the item, the rune dot at the bottom right and the label under it. */
const FACT_ICON: Record<string, string> = {
  mt: 'attack', hit: 'target', crit: 'crit', rng: 'range', wt: 'weight', str: 'strength', mag: 'magic', skl: 'skill',
  spd: 'speed', lck: 'luck', def: 'shield', res: 'resist', mov: 'move', hp: 'hp', damageType: 'attack', heal: 'hp',
};

/** The chosen item as when buying, compact: picture and name, description, values in two columns, effects and set. */
function ItemHead({ data, item }: { data: GameData; item: ItemInstance }) {
  const inst = asInstance(item);
  const info = itemInfo(data, inst, shownRelics.value);
  const rarity = t(`ui.itemInfo.rarity.${rarityOf(data, inst)}`);
  return (
    <>
      <div class="doll__ihead">
        <ItemImage data={data} item={inst} size={52} />
        <div class="doll__iname">
          <b>{itemName(data, inst)}</b>
          <span>{[info.type, rarity].join(' · ')}</span>
        </div>
        {info.buy > 0 && (
          <span class="doll__price">
            <Amount resource="gold" value={info.buy} />
          </span>
        )}
      </div>
      <p class="doll__desc">{info.desc}</p>
      {info.facts.length > 0 && (
        <dl class="doll__facts">
          {info.facts.map((f) => (
            <div key={f.key} class={/^[-+−]?\d/.test(String(f.value)) ? 'doll__fact' : 'doll__fact doll__fact--wide'}>
              <Icon name={FACT_ICON[f.key] ?? 'star'} size={16} />
              <dt>{f.label}</dt>
              <dd class={f.tone === 'up' ? 'hc-up' : f.tone === 'down' ? 'hc-down' : ''}>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {info.effects.map((e) => (
        <p key={e} class="doll__desc">{e}</p>
      ))}
      {info.set && (
        <p class="doll__desc">
          <b>{t('ui.itemInfo.setTitle', { name: info.set.name })}</b> {info.set.pieces.join(' · ')}
        </p>
      )}
    </>
  );
}

function SlotStone({ s, selected, onTap }: { s: DollSlot; selected: boolean; onTap: () => void }) {
  const label = t(`ui.slot.${s.slot}`);
  return (
    <button
      type="button"
      class={`dl-stone ${s.item ? '' : 'is-empty'} ${selected ? 'is-sel' : ''}`}
      aria-pressed={selected}
      aria-label={s.item ? t('ui.doll.slotItem', { slot: label, item: t(`item.${s.item.def}.name`) }) : t('ui.doll.slotEmpty', { slot: label })}
      onClick={onTap}
    >
      {s.item ? <ItemImage data={data} item={s.item} size={46} /> : null}
      {s.rune && (
        <span class="dl-stone__rune" aria-hidden="true">
          {s.rune.element === 'utility' ? <Icon name="star" size={9} /> : <ElementDot el={s.rune.element} size={15} />}
        </span>
      )}
      <span class="dl-stone__lb">{label}</span>
    </button>
  );
}

/** The sheet with a place chosen: details of the item as when buying, or the list of the convoy for an empty bag place. */
function PickView({
  unit,
  pick,
  readOnly,
  apply,
  onPick,
  onSwap,
}: {
  unit: UnitRecord;
  pick: DollPick;
  readOnly: boolean;
  apply: (cmd: CampaignCommand) => boolean;
  onPick: (p: DollPick | null) => void;
  onSwap: DollProps['onSwap'];
}) {
  const c = campaign.value!;
  const item = pickedItem(data, unit, pick);
  const slot = pick.kind === 'slot' ? pick.slot : null;
  if (pick.kind === 'bag' && !item) {
    const cands = bagCandidates(data, c, unit);
    return (
      <div class="doll__card">
        <h3 class="doll__h">{t('ui.doll.fill')}</h3>
        {cands.length === 0 && <p class="doll__note">{t('ui.doll.fillNone')}</p>}
        {cands.map(({ inst, error }) => (
          <ItemLine
            key={inst.uid}
            data={data}
            inst={inst}
            dim={!!error || readOnly}
            sub={error ? t(`ui.camp.err.${error}`) : undefined}
            tag={t('ui.doll.fromConvoy')}
            onClick={() => {
              if (apply(bagEquipCommand(unit, inst.uid))) onPick(null);
            }}
          />
        ))}
      </div>
    );
  }
  if (!item) {
    return (
      <div class="doll__card">
        <h3 class="doll__h">{t(`ui.slot.${slot}`)}</h3>
        <p class="doll__note">{t('ui.doll.emptySlot')}</p>
        {!readOnly && slot && (
          <div class="doll__btns">
            <PrimaryButton onClick={() => onSwap(slot, 0)}>{t('ui.doll.equip')}</PrimaryButton>
          </div>
        )}
      </div>
    );
  }
  const def = itemDef(data, item);
  const bare: ItemInstance = { ...item, runes: item.runes.map(() => null) };
  const hasRune = !!slot && (item.runes.some(Boolean) || !!def.fixedRune);
  const runeId = [item.runes.find(Boolean), ...[def.fixedRune ?? []].flat()].find(Boolean);
  const runeName = runeId ? t(`item.${runeId}.name`) : '';
  const skill = def.grantsSkill;
  const points = skill ? (unit.sp[skill.skill] ?? 0) : 0;
  const done = !!skill && unit.mastered.includes(skill.skill);
  const full = pick.kind === 'bag' && convoyIsFull(data, c);
  return (
    <div class="doll__card">
      <ItemHead data={data} item={item} />
      {hasRune && slot && (
        <section class="doll__sec">
          <h4 class="doll__cap">{t('ui.doll.runeChange', { name: runeName })}</h4>
          <ChangeList result={changeList(data, unit, item, { slot, base: bare })} />
        </section>
      )}
      {skill && (
        <div class="doll__fp">
          <b>{done ? `${t(`skill.${skill.skill}.name`)} · ${t('ui.mastered')}` : t('ui.doll.fpProgress', { skill: t(`skill.${skill.skill}.name`), points, cost: skill.masteryCost })}</b>
          <div class="doll__bar doll__bar--skill">
            <i style={{ width: `${done || !skill.masteryCost ? 100 : Math.min(100, (points / skill.masteryCost) * 100)}%` }} />
          </div>
        </div>
      )}
      <div class="doll__btns">
        {!readOnly && slot && <SecondaryButton onClick={() => onSwap(slot, 0)}>{t('ui.doll.swap')}</SecondaryButton>}
        {slot && (slot === 'mainHand' || slot === 'offHand') && (
          <PrimaryButton onClick={() => openWeapon(item.uid, { unit: unit.id })}>{t('ui.weaponView.open')}</PrimaryButton>
        )}
        {!readOnly && pick.kind === 'bag' && (
          <SecondaryButton
            disabled={full}
            onClick={() => {
              if (apply(bagReturnCommand(item.uid))) onPick(null);
            }}
          >
            {t('ui.doll.toConvoy')}
          </SecondaryButton>
        )}
      </div>
      {full && <p class="doll__note">{t('ui.camp.err.convoy_full')}</p>}
    </div>
  );
}

/** The raised sheet: base stats with full names (the three strongest marked), skills with their points, the elements, and the rest of the old sheet. */
function MoreView({ unit, readOnly, apply, setToast }: { unit: UnitRecord; readOnly: boolean; apply: (cmd: CampaignCommand) => boolean; setToast: (s: string) => void }) {
  const c = campaign.value!;
  const st = computeStats(data, unit, { relics: campaignRelics.value });
  const best = strongestStats(st.stats);
  const cells: Array<{ key: string; label: string; value: number; hi: boolean }> = [
    ...STAT_KEYS.map((k) => ({ key: k, label: t(`ui.change.stat.${STAT_NAME[k]}`), value: st.stats[k], hi: best.includes(k) })),
    { key: 'mov', label: t('ui.change.stat.move'), value: st.mov, hi: false },
    { key: 'carry', label: t('ui.doll.carry'), value: st.carry, hi: false },
  ];
  const sp = Object.entries(unit.sp);
  const second = unit.secondPath ? data.classes[unit.secondPath] : undefined;
  // the lesson of the memorial hall (story 10.7), with the stone it came from
  const heritage = unit.heritage ? { skill: unit.heritage.skill, from: heritageStone(data, c, unit.heritage.from) } : null;
  const academy = Object.values(data.rooms).find((r) => r.function === 'academy');
  const promotable = canPromote(data, c, unit);
  // convoy of levels 2 and 3 (story 10.10): gear template and "equip the best" for a figure of the company
  const gearOpen = !readOnly && c.roster.some((r) => r.id === unit.id) && gearTemplatesOpen(data, c);
  /** What the toast says after a template or "equip the best": what happened, then every item that stayed where it was. */
  const gearToast = (run: GearRun, done: string): string => {
    const lines = run.skipped.map((sk) => {
      const owner = sk.unit ? c.roster.find((r) => r.id === sk.unit) : undefined;
      const item = t(`item.${sk.def}.name`);
      return owner ? t('ui.figure.gearSkippedAt', { unit: unitName(owner), item }) : t('ui.figure.gearSkipped', { item });
    });
    return [run.equipped.length ? done : t('ui.figure.gearNothing'), ...lines].join(' · ');
  };
  const chip = (e: ReturnType<typeof elementChips>[number]) => {
    const who = e.source === 'armor' ? t('ui.doll.affinity') : t(`ui.weapon.${itemDef(data, e.item!).group}`);
    const what = e.element ? `${t(`ui.element.${e.element}`)}${e.tier && e.tier > 1 ? ` ${ROMAN[e.tier]}` : ''}` : t('ui.doll.noElement');
    return (
      <span key={e.source} class="dl-chip">
        {e.element && <ElementDot el={e.element} size={14} />}
        {who}: {what}
      </span>
    );
  };
  return (
    <div class="doll__more">
      <h3 class="doll__h">{t('ui.doll.base')}</h3>
      <div class="dl-base">
        {cells.map((x) => (
          <div key={x.key} class={`dl-base__cell ${x.hi ? 'is-hi' : ''}`}>
            <b>{x.value}</b>
            <small>{x.label}</small>
          </div>
        ))}
      </div>
      {(sp.length > 0 || unit.mastered.length > 0) && <h3 class="doll__h">{t('ui.doll.skills')}</h3>}
      {sp.map(([sk, points]) => {
        const cost = Object.values(data.items).find((d) => d.grantsSkill?.skill === sk)?.grantsSkill?.masteryCost ?? 0;
        const done = unit.mastered.includes(sk);
        return (
          <div key={sk} class="dl-skill">
            <b>{t(`skill.${sk}.name`)}</b>
            <div class="doll__bar doll__bar--skill">
              <i style={{ width: `${done || !cost ? 100 : Math.min(100, (points / cost) * 100)}%` }} />
            </div>
            <span>{done ? t('ui.mastered') : `${points} / ${cost} ${t('ui.sp')}`}</span>
          </div>
        );
      })}
      {unit.mastered.length > 0 && (
        <div class="dl-chips">
          <span>
            {t('ui.loadout')} {unit.loadout.length}/{loadoutSlots(data, unit)}
          </span>
          {unit.mastered.map((sk) => {
            const on = unit.loadout.includes(sk);
            return (
              <button
                key={sk}
                type="button"
                class={`hc-tab ${on ? 'is-on' : ''}`}
                disabled={readOnly}
                onClick={() => apply({ type: 'setLoadout', unit: unit.id, skills: on ? unit.loadout.filter((x) => x !== sk) : [...unit.loadout, sk] })}
              >
                {t(`skill.${sk}.name`)}
              </button>
            );
          })}
        </div>
      )}
      <h3 class="doll__h">{t('ui.doll.elements')}</h3>
      <div class="dl-chips">{elementChips(data, unit, campaignRelics.value).map(chip)}</div>
      {gearOpen && (
        <div class="dl-chips">
          <button type="button" class="hc-tab" onClick={() => apply({ type: 'saveGearTemplate', unit: unit.id }) && setToast(t('ui.figure.gearTemplateSaved'))}>
            {t('ui.figure.gearTemplateSave')}
          </button>
          <button
            type="button"
            class="hc-tab"
            disabled={!unit.gearTemplate}
            onClick={() => {
              const run = runGearTemplate(data, clone(c), unit.id);
              if (apply({ type: 'applyGearTemplate', unit: unit.id })) setToast(gearToast(run, t('ui.figure.gearApplied')));
            }}
          >
            {t('ui.figure.gearTemplateApply')}
          </button>
          {equipBestOpen(data, c) && (
            <button
              type="button"
              class="hc-tab"
              onClick={() => {
                const run = runEquipBest(data, clone(c), unit.id);
                if (apply({ type: 'equipBest', unit: unit.id })) setToast(gearToast(run, t('ui.figure.gearBest')));
              }}
            >
              {t('ui.figure.equipBest')}
            </button>
          )}
        </div>
      )}
      {unit.scars.length > 0 && (
        <div class="dl-chips">
          {unit.scars.map((sc) => (
            <span key={sc} class="dl-scar">
              <Icon name="scar" size={13} />
              {t(`scar.${sc}`)}
            </span>
          ))}
        </div>
      )}
      <p class="doll__note">
        {activeSkillIds(data, unit, campaignRelics.value)
          .filter((id) => id !== heritage?.skill)
          .map((id) => t(`skill.${id}.name`))
          .join(' · ')}
      </p>
      {/* story 10.12: the traits of a hired mercenary */}
      {(unit.traits ?? []).length > 0 && (
        <div class="dl-chips">
          <TraitChips data={data} traits={unit.traits} />
        </div>
      )}
      {second && <p class="doll__note">{t('ui.figure.also', { effect: t(`class.${second.id}.effect`) })}</p>}
      {heritage && (
        <p class="doll__note" title={t(`skill.${heritage.skill}.desc`)}>
          {t('ui.figure.heritage', { skill: t(`skill.${heritage.skill}.name`), from: heritage.from ? unitName({ name: heritage.from.name, nameKey: heritage.from.nameKey }) : '' })}
        </p>
      )}
      {promotable && !readOnly && c.roster.some((u) => u.id === unit.id) && (
        <div class="doll__btns">
          <PrimaryButton onClick={() => (screen.value = { name: 'camp', tab: academy?.id, unit: unit.id })}>{t('ui.figure.promote')}</PrimaryButton>
        </div>
      )}
    </div>
  );
}
