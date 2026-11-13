/**
 * Memorial hall (story 6.9, UX-DR11, mockup 04): the fixed stones of the acts first, then the fallen in the order they fell,
 * mercenaries too; the quote under the stones belongs to the chosen one. From act 2 (unlock `lessons`) a stone passes on its
 * lesson once per act (story 10.7): choose a stone (1), the lesson (from hall level 2) and the receiver (2), then the quiet button
 * (3). What is offered and why not comes from `heritageChoices`/`heritageError`, the functions the command `inheritHeritage`
 * checks with. Mourning style: desaturated but for ember orange, no motion.
 */
import { useState } from 'preact/hooks';
import {
  heritageChoices,
  heritageError,
  heritageLeft,
  heritageReceivers,
  heritageStone,
  heritageThisAct,
  memorialStones,
  roomUnlocks,
  stoneGave,
  stoneRole,
  type MemorialStone,
  type RoomDef,
} from '../../core';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { unitName } from '../../ui/components';
import { QuietButton } from '../../ui/pieces';
import { nodeShort } from '../campaignInfo';
import { campaign, data } from '../state/session';
import { lockReason, RoomPanel, type Apply } from './Rooms';
import { StoneImage } from './unitArt';
import './Memorial.css';

const stoneName = (s: MemorialStone): string => unitName({ name: s.name, nameKey: s.nameKey });

/** One memorial stone: round at the top, flat at the bottom, grey; name, place and role under it; a stone that passed on its lesson carries a small ember mark. */
function Grave({ stone, selected, gave, onSelect }: { stone: MemorialStone; selected: boolean; gave: boolean; onSelect: () => void }) {
  const name = stoneName(stone);
  const place = stone.placeKey ? t(stone.placeKey) : t('ui.memorial.fell', { place: stone.node ? nodeShort(stone.node) : '' });
  const role = stone.roleKey ? t(stone.roleKey) : stone.classId ? t(`class.${stone.classId}.name`) : '';
  return (
    <button type="button" class={`hm-grave ${stone.mercenary ? 'is-mercenary' : ''}`} aria-pressed={selected} onClick={onSelect}>
      <span class="hm-grave__m">
        <StoneImage portrait={stone.mercenary ? undefined : stone.portrait} classId={stone.mercenary ? undefined : stone.classId} name={name} />
        {gave && <span class="mh-gave" role="img" aria-label={t('ui.memorial.heritage.gave')} />}
      </span>
      <b>{name}</b>
      <span class="hm-grave__s">
        {place}
        <br />
        {stone.mercenary ? t('ui.memorial.mercenary', { role }) : role}
      </span>
      <span class="hm-grave__ember" aria-hidden="true" />
    </button>
  );
}

/** Lesson and receiver choice under the chosen stone, or why this stone has nothing to pass on. */
function HeritageChoice({ stone, apply }: { stone: MemorialStone; apply: Apply }) {
  const c = campaign.value!;
  const choices = heritageChoices(data, c, stone);
  const receivers = heritageReceivers(c);
  const [skill, setSkill] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const lesson = skill && choices.includes(skill) ? skill : choices[0];
  const receiver = receivers.find((u) => u.id === to);
  if (stoneGave(c, stone.key)) return <p class="mh-note">{t('ui.memorial.heritage.stoneGave', { name: stoneName(stone) })}</p>;
  if (!stoneRole(data, stone) || !lesson) return <p class="mh-note">{t('ui.memorial.heritage.noRole', { name: stoneName(stone) })}</p>;
  if (receivers.length === 0) return <p class="mh-note">{t('ui.memorial.heritage.noReceiver')}</p>;
  const ok = !!receiver && heritageError(data, c, stone.key, receiver.id, lesson) === null;
  return (
    <div class="mh-pass">
      <p class="mh-line">
        {t('ui.memorial.heritage.line', { skill: t(`skill.${lesson}.name`), from: stoneName(stone), to: receiver ? unitName(receiver) : '…' })}
      </p>
      <p class="mh-desc">{t(`skill.${lesson}.desc`)}</p>
      {choices.length > 1 && (
        <div class="mh-chips" role="group" aria-label={t('ui.memorial.heritage.lessons')}>
          {choices.map((id) => (
            <button key={id} type="button" class="mh-chip" aria-pressed={id === lesson} onClick={() => setSkill(id)}>
              {t(`skill.${id}.name`)}
            </button>
          ))}
        </div>
      )}
      <div class="mh-chips" role="group" aria-label={t('ui.memorial.heritage.receivers')}>
        {receivers.map((u) => (
          <button key={u.id} type="button" class="mh-chip" aria-pressed={u.id === to} onClick={() => setTo(u.id === to ? null : u.id)}>
            {unitName(u)}
          </button>
        ))}
      </div>
      <QuietButton disabled={!ok} onClick={() => receiver && apply({ type: 'inheritHeritage', from: stone.key, to: receiver.id, skill: lesson }, t('ui.memorial.heritage.done'))}>
        {t('ui.memorial.heritage.button')}
      </QuietButton>
    </div>
  );
}

export function MemorialRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const stones = memorialStones(data, c);
  const [sel, setSel] = useState<string | null>(null);
  const cur = stones.find((s) => s.key === sel) ?? stones[0];
  const lessons = roomUnlocks(data, c, room).find((u) => u.id === 'lessons');
  const open = !!lessons?.open;
  const given = heritageThisAct(c);
  const left = data.balance.memorial.heritagePerAct - given.length;
  return (
    <RoomPanel room={room} tone="mourn" onClose={onClose} actions={<QuietButton onClick={onClose}>{t('ui.back')}</QuietButton>}>
      {open && left > 0 && <p class="mh-left">{t('ui.memorial.heritage.left', { n: left, act: c.act })}</p>}
      {stones.length === 0 && <div class="hm-none">{t('ui.memorial.none')}</div>}
      <div class="hm-graves" role="group" aria-label={t('ui.memorial.stones')}>
        {stones.map((s) => (
          <Grave key={s.key} stone={s} selected={s.key === cur?.key} gave={stoneGave(c, s.key)} onSelect={() => setSel(s.key)} />
        ))}
      </div>
      {cur?.quoteKey && <p class="hm-quote">{t('ui.memorial.quote', { text: t(cur.quoteKey), name: stoneName(cur) })}</p>}
      {lessons && !open && (
        <div class="hm-lesson is-locked">
          <Icon name="lock" size={18} />
          <b>{t(`room.${room.id}.unlock.${lessons.id}`)}</b>
          <span>{lockReason(lessons.unmet)}</span>
        </div>
      )}
      {given.map((h) => {
        const from = heritageStone(data, c, h.from);
        const to = c.roster.find((u) => u.id === h.to);
        return (
          <p key={h.from} class="mh-given">
            {t('ui.memorial.heritage.given', { act: h.act, from: from ? stoneName(from) : '', to: to ? unitName(to) : t('ui.memorial.heritage.gone') })}
          </p>
        );
      })}
      {open && cur && heritageLeft(data, c) && <HeritageChoice key={cur.key} stone={cur} apply={apply} />}
    </RoomPanel>
  );
}
