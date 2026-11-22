/**
 * Story 16.16: the enchanter as a workbench (EXPERIENCE "Verzauberer (Werkbank)"). The room is for one person: the person bar on top
 * (the convoy last), her pieces with their rune settings, the piece on the item stage with its settings, the change list, the stones of
 * the convoy as a vault with tier and count and the main button. The first tap on a stone lays it into the chosen setting as a probe
 * (the stone grows in the model, the channel fills, the list shows what changes); the main button sets it ("Swap" when the setting is
 * taken: the old rune goes to the convoy). Without a stone it takes the rune out for free. Rune I for sale stands dashed with its
 * price. "Merge" shows every stone's state; three stones fly together on the stage and the next tier lies in the convoy. All of it is
 * campaign commands; the checks are the ones `applyCampaign` makes (`enchanterModel.ts`, `core/campaign/enchant.ts`).
 */
import { useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { changeList, mergeStatus, runeOffers, runeSlots, runeStones, type ItemInstance, type RoomDef, type RuneDef } from '../../core';
import { has, t } from '../../i18n';
import type { ItemStage } from '../../render/items/itemStage';
import { runeLookOf } from '../../render/shared/runeLook';
import { ChangeList, ChangeStats } from '../../ui/ChangeList';
import { itemName, unitName } from '../../ui/components';
import { ElementDot, Icon } from '../../ui/icons';
import { Amount, ItemImage, PrimaryButton, Tabs } from '../../ui/pieces';
import { campaign, data } from '../state/session';
import { settings } from '../state/settings';
import { BAR_CONVOY, PersonBar } from './PersonBar';
import { RoomPanel, type Apply } from './Rooms';
import { ItemStageFrame, type GemSetting } from './ItemStageFrame';
import { enchantables, gemIndex, mainAction, personOf, probeOf, stoneWhy, type StoneChoice } from './enchanterModel';
import { placeOf, referenceUnit, stageRunes, valuesOf, weaponStageModel } from './weaponViewModel';
import './Enchanter.css';

const ROMAN = ['', 'I', 'II', 'III'];

/** A stone of the vault as a round gem with its tier and count. */
function Gem({ rune, count }: { rune: RuneDef; count?: number }) {
  const look = runeLookOf(data.runes, rune.id)!;
  return (
    <span class={`is-gem en-gem is-el-${look.element} is-t${look.tier}`} aria-hidden="true">
      {look.element === 'utility' ? <Icon name="star" size={18} /> : <ElementDot el={look.element} size={30} />}
      <span class="is-gem__tier">{ROMAN[look.tier]}</span>
      {count !== undefined && <span class="en-gem__count">{count}</span>}
    </span>
  );
}

/** The dots of a piece's settings: the colour of the element in each, dashed when empty. */
function SettingDots({ inst }: { inst: ItemInstance }) {
  return (
    <span class="en-dots" aria-hidden="true">
      {runeSlots(data, inst).map((r, i) => {
        const look = runeLookOf(data.runes, r);
        return <span key={i} class={`en-dot ${look ? `is-el-${look.element}` : 'is-empty'}`} />;
      })}
    </span>
  );
}

const whyText = (key: string): string => (has(`ui.enchanter.why.${key}`) ? t(`ui.enchanter.why.${key}`) : t('ui.enchanter.why.generic'));

/** The piece without the rune in setting `index` (the removal's preview). */
function withoutRuneAt(inst: ItemInstance, index: number): ItemInstance {
  const runes = runeSlots(data, inst);
  runes[index] = null;
  return { ...inst, runes };
}

export function EnchanterRoom({ room, apply, onClose, item, stone }: { room: RoomDef; apply: Apply; onClose: () => void; item?: string; stone?: string }) {
  const c = campaign.value!;
  const [person, setPerson] = useState<string>(() => (item ? personOf(c, item) : null) ?? c.roster[0]!.id);
  const [uid, setUid] = useState<string | null>(() => item ?? enchantables(data, c, person)[0]?.uid ?? null);
  const [gem, setGem] = useState<'main' | 'small'>('main');
  const [mode, setMode] = useState<'set' | 'merge'>('set');
  const [choice, setChoice] = useState<StoneChoice | null>(stone ? { kind: c.convoy.some((i) => i.def === stone) ? 'stone' : 'offer', id: stone } : null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const stage = useRef<ItemStage | null>(null);

  const pieces = enchantables(data, c, person);
  const inst = pieces.find((i) => i.uid === uid) ?? pieces[0];
  const unit = inst ? referenceUnit(c, inst, person === BAR_CONVOY ? undefined : person) : undefined;
  const slots = inst ? runeSlots(data, inst).length : 0;
  const gemKey: 'main' | 'small' = slots > 1 ? gem : 'main';
  const index = inst ? (gemIndex(data, inst, gemKey) ?? 0) : 0;
  const stones = runeStones(data, c);
  const offers = runeOffers(data, c);

  const pickPerson = (id: string) => {
    setPerson(id);
    setUid(enchantables(data, c, id)[0]?.uid ?? null);
    setGem('main');
    setChoice(null);
  };
  const pickPiece = (id: string) => {
    setUid(id);
    setGem('main');
    setChoice(null);
  };
  const same = (a: StoneChoice | null, b: StoneChoice) => !!a && a.kind === b.kind && a.id === b.id;
  const toggle = (next: StoneChoice) => setChoice(same(choice, next) ? null : next);

  const act = inst ? mainAction(data, c, inst, index, mode === 'set' ? choice : null) : { kind: 'none' as const };
  // the probe: the stone lies in the setting only while it fits
  const probe = inst && choice && mode === 'set' && !stoneWhy(data, inst, choice.id, index) ? probeOf(data, inst, choice.id, index) : null;
  const shown = probe ?? inst;
  const removing = inst && mode === 'set' && !choice && act.kind === 'remove' ? withoutRuneAt(inst, index) : null;
  const slot = inst ? placeOf(data, c, inst) : 'mainHand';
  const diff = inst && unit && (probe || removing) ? changeList(data, unit, (probe ?? removing)!, { slot, base: inst }) : null;
  const values = inst && unit && !diff ? valuesOf(data, unit, inst, slot) : null;

  const model = inst ? weaponStageModel(data, inst) : null;
  const gems: GemSetting[] = [];
  if (inst && shown && slots > 0) {
    const looks = stageRunes(data, shown);
    for (const key of slots > 1 ? (['main', 'small'] as const) : (['main'] as const)) {
      const look = key === 'main' ? looks.main : looks.small;
      gems.push({ key, look, label: t(`ui.weaponView.setting.${key}`), runeName: look && has(`item.${look.id}.name`) ? t(`item.${look.id}.name`) : undefined });
    }
  }

  const run = async () => {
    if (!inst || busy) return;
    if (mode === 'merge') {
      if (!choice) return;
      const st = mergeStatus(data, c, choice.id);
      if (st.error) return;
      const colour = data.render.gear.rune.colors[st.next?.element ?? 'fire'] ?? '#ffffff';
      setBusy(true);
      if (stage.current) await stage.current.fuse(colour);
      else {
        setFlash(colour);
        await new Promise((r) => setTimeout(r, 700));
        setFlash(null);
      }
      apply({ type: 'mergeRunes', rune: choice.id }, t('ui.camp.merged'));
      setBusy(false);
      setChoice(null);
      return;
    }
    if (!act.cmd || act.why) return;
    const text = act.kind === 'remove' ? t('ui.enchanter.removed') : act.kind === 'buy' ? t('ui.camp.bought') : t('ui.camp.enchanted');
    if (apply(act.cmd, text)) setChoice(null);
  };

  // the main button
  let label = t('ui.enchanter.pick');
  let side: ComponentChildren = null;
  let dim = true;
  let sub: string | undefined;
  if (mode === 'merge') {
    const st = choice ? mergeStatus(data, c, choice.id) : null;
    label = t('ui.room.enchanter.merge');
    if (st) {
      side = <Amount resource="gold" value={st.gold} short={c.gold < st.gold} />;
      dim = !!st.error || busy;
      sub = st.error ? whyText(`merge_${st.error}`) : undefined;
    } else sub = t('ui.enchanter.mergePick');
  } else if (act.kind === 'remove') {
    label = t('ui.enchanter.remove');
    side = <span class="en-free">{t('ui.enchanter.free')}</span>;
    dim = busy;
  } else if (act.kind === 'insert' || act.kind === 'swap' || act.kind === 'buy') {
    label = act.kind === 'swap' ? t('ui.enchanter.swap') : act.kind === 'buy' ? t('ui.enchanter.buy') : t('ui.enchanter.insert');
    if (act.kind === 'buy' && act.price !== undefined) side = <Amount resource="gold" value={act.price} short={c.gold < act.price} />;
    dim = !!act.why || busy;
    sub = act.why ? whyText(act.why) : undefined;
  } else if (act.why) sub = whyText(act.why);
  const old = mode === 'set' && inst ? runeSlots(data, inst)[index] : null;
  const swapNote = old && (act.kind === 'swap' || act.kind === 'buy') ? old : null;

  const actions = (
    <PrimaryButton disabled={dim} sub={sub} onClick={() => void run()}>
      {label}
      {side && <> · {side}</>}
    </PrimaryButton>
  );

  return (
    <RoomPanel room={room} onClose={onClose} actions={actions}>
      <div class="en">
        <PersonBar units={c.roster} value={person} onChange={pickPerson} convoy={{ count: c.convoy.length, max: data.balance.economy.convoySize }} />
        {pieces.length === 0 || !inst || !shown ? (
          <p class="en-empty">{person === BAR_CONVOY ? t('ui.enchanter.noPiecesConvoy') : t('ui.enchanter.noPieces', { name: unit ? unitName(unit) : '' })}</p>
        ) : (
          <>
            <div class="en-pieces" role="group" aria-label={t('ui.enchanter.pieces')}>
              {pieces.map((p) => (
                <button key={p.uid} type="button" class="en-piece" aria-pressed={p.uid === inst.uid} aria-label={itemName(data, p)} onClick={() => pickPiece(p.uid)}>
                  <ItemImage data={data} item={p} size={44} />
                  <SettingDots inst={p} />
                </button>
              ))}
            </div>
            <div class="en-stage">
              <ItemStageFrame
                data={data}
                quality={settings.value.quality}
                item={inst}
                model={model}
                runes={stageRunes(data, shown)}
                label={t('ui.weaponView.stage', { name: itemName(data, inst) })}
                settings={gems}
                selected={gemKey}
                onSelect={(k) => {
                  setGem(k);
                  setChoice(null);
                }}
                stageRef={stage}
              >
                {probe && <span class="en-probe">{t('ui.enchanter.probe')}</span>}
                {!model && gems[0]?.look && (
                  <span class={`is-gem en-chest is-el-${gems[0].look.element} is-t${gems[0].look.tier}`} role="img" aria-label={t('ui.enchanter.chest')}>
                    {gems[0].look.element === 'utility' ? <Icon name="star" size={18} /> : <ElementDot el={gems[0].look.element} size={30} />}
                  </span>
                )}
                {flash && <span class="en-flash" style={{ background: flash }} aria-hidden="true" />}
              </ItemStageFrame>
            </div>
            <section class="en-change" aria-label={t('ui.enchanter.change')}>
              <h3 class="en-h">
                {diff ? t('ui.enchanter.change') : t('ui.enchanter.now')}
                {unit && <small>{t('ui.weaponView.forUnit', { name: unitName(unit) })}</small>}
              </h3>
              {diff ? <ChangeList result={diff} /> : values && values.lines.some((l) => l.kind === 'stat') ? <ChangeStats result={values} /> : <div class="chg-empty">{t('ui.weaponView.noValues')}</div>}
              {swapNote && <p class="en-note">{t('ui.enchanter.goesToConvoy', { rune: t(`item.${swapNote}.name`) })}</p>}
            </section>
            <Tabs
              value={mode}
              options={[
                { id: 'set', label: t('ui.enchanter.modeSet') },
                { id: 'merge', label: t('ui.enchanter.modeMerge') },
              ]}
              onChange={(m) => {
                setMode(m);
                setChoice(null);
              }}
              label={t('ui.enchanter.mode')}
            />
            <div class="en-tray" role="group" aria-label={t('ui.enchanter.vault')}>
              {stones.length === 0 && <p class="en-empty">{t('ui.enchanter.vaultEmpty')}</p>}
              {stones.map((s) => {
                const pick: StoneChoice = { kind: 'stone', id: s.id };
                const why = mode === 'set' ? stoneWhy(data, inst, s.id, index) : null;
                const m = mode === 'merge' ? mergeStatus(data, c, s.id) : null;
                const stateText = m
                  ? m.error === 'max_level'
                    ? t('ui.enchanter.mergeMax')
                    : m.error === 'room_locked'
                      ? t('ui.room.enchanter.mergeFrom', { n: m.fromLevel ?? 0 })
                      : t('ui.enchanter.mergeState', { have: m.have, need: m.need })
                  : null;
                const off = !!why || (m ? !!m.error && m.error !== 'not_enough_gold' : false);
                return (
                  <button key={s.id} type="button" class={`en-stone ${off ? 'is-dim' : ''}`} aria-pressed={same(choice, pick)} aria-disabled={off} onClick={() => !off && toggle(pick)}>
                    <Gem rune={s.def} count={s.count} />
                    <span class="en-stone__name">{t(`item.${s.id}.name`)}</span>
                    <small class={m && !m.error ? 'en-ready' : ''}>{why ? whyText(why) : stateText}</small>
                  </button>
                );
              })}
              {mode === 'set' &&
                offers.map((o) => {
                  const pick: StoneChoice = { kind: 'offer', id: o.id };
                  const why = stoneWhy(data, inst, o.id, index);
                  return (
                    <button key={`offer:${o.id}`} type="button" class={`en-stone is-offer ${why ? 'is-dim' : ''}`} aria-pressed={same(choice, pick)} aria-disabled={!!why} onClick={() => !why && toggle(pick)}>
                      <Gem rune={o.def} />
                      <span class="en-stone__name">{t(`item.${o.id}.name`)}</span>
                      <small>{why ? whyText(why) : <Amount resource="gold" value={o.price} short={c.gold < o.price} />}</small>
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </RoomPanel>
  );
}
