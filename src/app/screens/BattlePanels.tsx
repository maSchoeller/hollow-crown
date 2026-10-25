/** Battle overlays in style B (DESIGN.md: stone over a veil): unit info, objectives, menu, class actions, items, trade, convoy, level-up. */
import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  active,
  applyCommand,
  computeStats,
  dist,
  groupAllowed,
  itemDef,
  nearConvoy,
  ruleOn,
  STAT_KEYS,
  type ActionOption,
  type BattleState,
  type BattleUnit,
  type ClassPreview,
  type Command,
  type ItemInstance,
  type Stats,
} from '../../core';
import { activeSkillIds } from '../../core/rules/skills';
import { mapOf, sideObjectiveDone } from '../../core/battle/objectives';
import { t } from '../../i18n';
import { ItemDetails, itemName, unitName } from '../../ui/components';
import { ElementIcon, Icon } from '../../ui/icons';
import { goalLine, goalStand } from '../../ui/goalText';
import { Sheet } from '../../ui/Sheet';
import { Amount, ItemImage, Piece, PrimaryButton, SecondaryButton } from '../../ui/pieces';
import { data } from '../state/session';
import { Medallion, roleIcon } from './BattleHud';
import '../../ui/battle-panels.css';

const AI_TEXT: Record<string, string> = {
  aggressive: 'ui.ai.aggressive', hold: 'ui.ai.hold', guard: 'ui.ai.guard', trigger: 'ui.ai.trigger', hunt: 'ui.ai.hunt', raider: 'ui.ai.raider', flee: 'ui.ai.flee', support: 'ui.ai.support',
};

const SLOTS = ['mainHand', 'offHand', 'head', 'body', 'accessory1', 'accessory2'] as const;

const carried = (u: BattleUnit): ItemInstance[] => [...Object.values(u.equip).filter((i): i is ItemInstance => !!i), ...u.bag];

/** Item line (DESIGN.md Item-Zeile): framed image, name, values, right slot; chosen with an ember border. */
export function ItemLine({
  inst,
  label,
  sub,
  right,
  selected,
  compact,
  onClick,
}: {
  inst: ItemInstance;
  /** small caps line above the name, e.g. the slot */
  label?: ComponentChildren;
  sub?: ComponentChildren;
  right?: ComponentChildren;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <ItemImage data={data} item={inst} size={compact ? 36 : 44} />
      <span class="bp-line__text">
        {label && <small class="bp-line__label">{label}</small>}
        <b>{itemName(data, inst)}</b>
        {sub}
      </span>
      {right && <span class="bp-line__right">{right}</span>}
    </>
  );
  return onClick ? (
    <button type="button" class={`bp-line is-click ${selected ? 'is-sel' : ''} ${compact ? 'is-compact' : ''}`} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div class={`bp-line ${selected ? 'is-sel' : ''} ${compact ? 'is-compact' : ''}`}>{body}</div>
  );
}

// ------------------------------------------------------------------ unit info

export function UnitInfo({ u, s, onClose, onEquip, canEdit }: { u: BattleUnit; s: BattleState; onClose: () => void; onEquip: (item: string, slot: 'mainHand' | 'bag') => void; canEdit: boolean }) {
  const st = computeStats(data, u, { state: s });
  const skills = activeSkillIds(data, u);
  const hp = u.hp;
  const affinity = st.affinity && ruleOn(s, 'elements') ? st.affinity : undefined;
  const items = [
    ...SLOTS.flatMap((sl) => (u.equip[sl] ? [{ inst: u.equip[sl]!, slot: sl as string }] : [])),
    ...u.bag.map((i) => ({ inst: i, slot: 'bag' })),
  ];
  const cells: Array<[string, ComponentChildren]> = [
    ...STAT_KEYS.map((k): [string, ComponentChildren] => [k, k === 'hp' ? st.maxHp : st.stats[k]]),
    ['mov', st.mov],
    ['as', st.as],
    ['load', `${st.load}/${st.carry}`],
  ];
  if (u.team === 'player') cells.push(['exp', <Amount resource="exp" value={u.exp} />]);
  return (
    <Sheet title={unitName(u)} aside={u.team === 'player' ? undefined : t(`ui.phaseShort.${u.team}`)} onClose={onClose}>
      <div class="bp-info">
        <div class="bp-info__top">
          <Medallion u={u} hp={hp} max={st.maxHp} size={92} />
          <div class="bp-info__id">
            <span class="bp-role">
              <Icon name={roleIcon(data.classes[u.classId]!.role)} size={15} />
              {t(`class.${u.classId}.name`)}
              <i>
                {t('ui.lv')} {u.level}
              </i>
            </span>
            <span class="bp-info__hp">{t('ui.hud.hp', { hp, max: st.maxHp })}</span>
            {(affinity || u.status.length > 0) && (
              <span class="bp-chips">
                {affinity && (
                  <span class="bp-chip">
                    <ElementIcon el={affinity} size={15} />
                  </span>
                )}
                {u.status.map((x) => (
                  <span class="bp-chip" key={x.id}>
                    {t(`ui.status.${x.id}`)} {x.turns}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        <div class="bp-stats">
          {cells.map(([k, v]) => (
            <div class="bp-stat" key={k}>
              <small>{t(`ui.stat.${k}`)}</small>
              <span>{v}</span>
            </div>
          ))}
        </div>

        {u.ai && u.team !== 'player' && (
          <div class="bp-note">
            <Icon name="ai" size={20} />
            <span>{t(AI_TEXT[u.ai.profile] ?? 'ui.ai.aggressive')}</span>
          </div>
        )}

        <section class="bp-sec">
          <h3>{t('ui.inventory')}</h3>
          {items.length === 0 && <div class="bp-empty">{t('ui.unarmed')}</div>}
          {items.map(({ inst, slot }) => {
            const d = itemDef(data, inst);
            const canSwap = canEdit && slot === 'bag' && d.slot === 'mainHand' && !!d.weaponType && groupAllowed(data.classes[u.classId]!, d);
            return (
              <ItemLine
                key={inst.uid}
                inst={inst}
                label={t(`ui.slot.${slot}`)}
                sub={<ItemDetails data={data} inst={inst} />}
                right={canSwap ? <SecondaryButton class="bp-small" onClick={() => onEquip(inst.uid, 'mainHand')}>{t('ui.equip')}</SecondaryButton> : null}
              />
            );
          })}
        </section>

        {(skills.length > 0 || u.scars.length > 0) && (
          <section class="bp-sec">
            <h3>{t('ui.skills')}</h3>
            {skills.map((id) => (
              <div class="bp-skill" key={id}>
                <b>{t(`skill.${id}.name`)}</b>
                <span>{t(`skill.${id}.desc`)}</span>
              </div>
            ))}
            {u.scars.map((sc) => (
              <div class="bp-skill is-scar" key={sc}>
                <Icon name="scar" size={16} />
                <span>{t(`scar.${sc}`)}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ objectives

export function ObjectivesPanel({ s, onClose }: { s: BattleState; onClose: () => void }) {
  const map = mapOf(data, s);
  const v = map.objectives.victory;
  return (
    <Sheet title={t(map.nameKey)} aside={t('ui.obj.title')} onClose={onClose}>
      <div class="bp-goal is-win">
        <small>{t('ui.obj.victory')}</small>
        <b>{goalLine(v)}</b>
        {(v.type === 'defend' || v.type === 'survive') && <span>{t('ui.obj.turnOf', { turn: s.turn, turns: v.turns })}</span>}
        {v.type === 'treasure' && <span>{goalStand(v, s)}</span>}
      </div>
      <div class="bp-goal is-lose">
        <small>{t('ui.obj.defeat')}</small>
        <b>
          {[
            ...map.objectives.defeat.map((d) => (d.type === 'unit_dies' ? t('ui.obj.dies', { name: t(`unit.${d.unit}.name`) }) : t('ui.obj.turnLimit', { turns: d.turns }))),
            // the goal itself names the other defeats (story 4.8): the escorted NPC falls, the round limit of a treasure hunt passes
            ...(v.type === 'escort' ? [t('ui.obj.dies', { name: t(`unit.${v.unit}.name`) })] : []),
            ...(v.type === 'treasure' ? [t('ui.obj.turnLimit', { turns: v.turns })] : []),
          ].join(' · ')}
        </b>
      </div>
      {map.objectives.side.length > 0 && (
        <section class="bp-sec">
          <h3>{t('ui.obj.side')}</h3>
          {map.objectives.side.map((o) => {
            const done = sideObjectiveDone(data, s, o);
            return (
              <div class={`bp-side ${done ? 'is-done' : ''}`} key={o.id}>
                <span class="bp-side__mark">
                  <Icon name={done ? 'check' : 'target'} size={16} />
                </span>
                <span>{t(`ui.side.${o.type}`, { turns: o.turns ?? 0 })}</span>
              </div>
            );
          })}
        </section>
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------------ menu, class actions, items

export function BattleMenu({
  onClose,
  onOptions,
  onRestartRound,
  onRestartMission,
  onTitle,
}: {
  onClose: () => void;
  onOptions: () => void;
  /** absent when the death mode does not allow it (story 1.5, `canRestart`) */
  onRestartRound?: () => void;
  onRestartMission?: () => void;
  onTitle: () => void;
}) {
  return (
    <Sheet title={t('ui.menu')} onClose={onClose}>
      <div class="bp-choices">
        <Choice icon="gear" onClick={onOptions}>
          {t('ui.options')}
        </Choice>
        {onRestartRound && (
          <Choice icon="rewind" onClick={onRestartRound}>
            {t('ui.battle.restartRound')}
          </Choice>
        )}
        {onRestartMission && (
          <Choice icon="restart" onClick={onRestartMission}>
            {t('ui.battle.restartMission')}
          </Choice>
        )}
        <Choice icon="home" quiet onClick={onTitle}>
          {t('ui.battle.toTitle')}
        </Choice>
        <p class="bp-hint">{t('ui.battle.autosaved')}</p>
      </div>
    </Sheet>
  );
}

function Choice({ icon, quiet, onClick, children }: { icon: string; quiet?: boolean; onClick: () => void; children: ComponentChildren }) {
  return (
    <button type="button" class={`bp-choice ${quiet ? 'is-quiet' : ''}`} onClick={onClick}>
      <span class="bp-choice__ico">
        <Icon name={icon} size={20} />
      </span>
      <b>{children}</b>
    </button>
  );
}

export function ClassPick({ options, onPick, onClose }: { options: ActionOption[]; onPick: (o: ActionOption) => void; onClose: () => void }) {
  return (
    <Sheet title={t('ui.hud.classSlot')} onClose={onClose}>
      <div class="bp-choices">
        {options.map((o) => (
          <Choice key={o.kind} icon={o.kind} onClick={() => onPick(o)}>
            {t(`ui.action.${o.kind}`)}
          </Choice>
        ))}
      </div>
    </Sheet>
  );
}

export function ItemPick({ u, list, onPick, onClose }: { u: BattleUnit; list: string[]; onPick: (uid: string) => void; onClose: () => void }) {
  return (
    <Sheet title={t('ui.action.item')} aside={unitName(u)} onClose={onClose}>
      <div class="bp-lines">
        {list.map((uid) => {
          const inst = u.bag.find((i) => i.uid === uid)!;
          return <ItemLine key={uid} inst={inst} sub={<ItemDetails data={data} inst={inst} />} onClick={() => onPick(uid)} />;
        })}
      </div>
    </Sheet>
  );
}

/** Stehlen (story 2.6): the bag of the foe next to the scout, one tap on an item takes it (an item for the convoy is marked). */
export function StealPick({
  p,
  victim,
  onPick,
  onClose,
}: {
  p: Extract<ClassPreview, { kind: 'steal' }>;
  victim: BattleUnit;
  onPick: (uid: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={t('ui.action.steal')} aside={unitName(victim)} onClose={onClose}>
      <p class="bp-hint">{t(p.bagFull ? 'ui.steal.bagFull' : 'ui.steal.hint')}</p>
      <div class="bp-lines">
        {p.items.map(({ item, toConvoy }) => (
          <ItemLine
            key={item.uid}
            inst={item}
            sub={<ItemDetails data={data} inst={item} />}
            right={toConvoy ? <Icon name="convoy" size={18} /> : undefined}
            onClick={() => onPick(item.uid)}
          />
        ))}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ level-up

export function LevelUpPopup({ u, gains, level, onDone }: { u: BattleUnit; gains: Partial<Stats>; level: number; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, []);
  return (
    <div class="hc-veil bp-levelup-veil" onClick={onDone}>
      <Piece class="bp-levelup" role="dialog">
        <span class="bp-levelup__title">{t('ui.levelUp')}</span>
        <Medallion u={u} hp={1} max={1} size={84} level={false} />
        <span class="bp-levelup__who">
          {unitName(u)} <i>{t('ui.lv')} {level}</i>
        </span>
        <div class="bp-stats">
          {(['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'] as const).map((k) => (
            <div class={`bp-stat ${gains[k] ? 'is-up' : ''}`} key={k}>
              <small>{t(`ui.stat.${k}`)}</small>
              <span>{u.stats[k]}</span>
              {gains[k] ? <em>+{gains[k]}</em> : null}
            </div>
          ))}
        </div>
      </Piece>
    </div>
  );
}

// ------------------------------------------------------------------ trade, convoy

export function TradeSheet({ s, a, b, onClose, onCommit }: { s: BattleState; a: string; b: string; onClose: () => void; onCommit: (cmd: Command) => void }) {
  const ua = s.units.find((u) => u.uid === a)!;
  const partners = s.units.filter((u) => u.team === 'player' && active(u) && u.uid !== a && u.pos && ua.pos && dist(u.pos, ua.pos) === 1);
  const [with_, setWith] = useState(b);
  const [ops, setOps] = useState<Array<{ item: string; to: string; slot: 'bag' }>>([]);
  const preview = useMemo(() => {
    try {
      return applyCommand(data, s, { type: 'trade', unit: a, with: with_, ops }).state;
    } catch {
      return s;
    }
  }, [ops, with_]);
  const pa = preview.units.find((u) => u.uid === a)!;
  const pb = preview.units.find((u) => u.uid === with_)!;
  const col = (u: BattleUnit, other: BattleUnit) => (
    <div class="bp-col">
      <div class="bp-col__head">
        <b>{unitName(u)}</b>
        <small>
          {t('ui.bag')} {u.bag.length}/{data.balance.bag.size}
        </small>
      </div>
      {carried(u).map((inst) => (
        <ItemLine key={inst.uid} inst={inst} compact onClick={() => setOps((o) => [...o, { item: inst.uid, to: other.uid, slot: 'bag' }])} right={<Icon name="swap" size={18} />} />
      ))}
    </div>
  );
  return (
    <Sheet
      title={t('ui.action.trade')}
      aside={`${unitName(pa)} · ${unitName(pb)}`}
      onClose={onClose}
      wide
      footer={
        <>
          <SecondaryButton onClick={() => setOps([])}>{t('ui.reset')}</SecondaryButton>
          <PrimaryButton disabled={!ops.length} onClick={() => onCommit({ type: 'trade', unit: a, with: with_, ops })}>
            {t('ui.done')}
          </PrimaryButton>
        </>
      }
    >
      {partners.length > 1 && (
        <div class="bp-tabs">
          {partners.map((p) => (
            <button
              type="button"
              key={p.uid}
              class={`bp-tab ${p.uid === with_ ? 'is-on' : ''}`}
              onClick={() => {
                setWith(p.uid);
                setOps([]);
              }}
            >
              {unitName(p)}
            </button>
          ))}
        </div>
      )}
      <div class="bp-cols">
        {col(pa, pb)}
        {col(pb, pa)}
      </div>
    </Sheet>
  );
}

export function ConvoySheet({ s, uid, onClose, onCommit }: { s: BattleState; uid: string; onClose: () => void; onCommit: (cmd: Command) => void }) {
  const u = s.units.find((x) => x.uid === uid)!;
  const [take, setTake] = useState<string | undefined>();
  const [put, setPut] = useState<string | undefined>();
  if (!u.pos || !nearConvoy(s, u, u.pos)) return null;
  return (
    <Sheet
      title={t('ui.action.convoy')}
      aside={unitName(u)}
      onClose={onClose}
      wide
      footer={
        <PrimaryButton disabled={!take && !put} onClick={() => onCommit({ type: 'convoy', unit: uid, take, put })}>
          {t('ui.done')}
        </PrimaryButton>
      }
    >
      <p class="bp-hint">{t('ui.convoy.hint')}</p>
      <div class="bp-cols">
        <div class="bp-col">
          <div class="bp-col__head">
            <b>{unitName(u)}</b>
          </div>
          {carried(u).map((inst) => (
            <ItemLine key={inst.uid} inst={inst} compact selected={put === inst.uid} onClick={() => setPut(put === inst.uid ? undefined : inst.uid)} />
          ))}
        </div>
        <div class="bp-col">
          <div class="bp-col__head">
            <b>{t('ui.convoy')}</b>
          </div>
          {s.convoy
            .filter((i) => !itemDef(data, i).tags?.includes('convoyOnly'))
            .map((inst) => (
              <ItemLine key={inst.uid} inst={inst} compact selected={take === inst.uid} onClick={() => setTake(take === inst.uid ? undefined : inst.uid)} />
            ))}
        </div>
      </div>
    </Sheet>
  );
}
