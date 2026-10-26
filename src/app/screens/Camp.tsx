/**
 * The home (concept/25-ux/mockups/04-heimat.html "Lager in Akt 1" and Variante B, stories 6.3 and 6.9): the picture on top,
 * the rooms as stones below, a room opens as a panel over the blurred view. The rooms come from `content/core/rooms.yaml`
 * (`c.home`), their opening from `requires` per room; picture and anchors per kind of home from `content/home/home.yaml`.
 * In the castle the room stones also sit on the picture (the anchors) and show their level as dots.
 */
import { useEffect, useState } from 'preact/hooks';
import { armyOverLimit, availableSupportTalks, homeRooms, roomLevel, type CampaignCommand, type RoomDef, type RoomStatus } from '../../core';
import { t } from '../../i18n';
import { asset } from '../../ui/asset';
import { Toast, unitName, UnitCard } from '../../ui/components';
import { goalLine } from '../../ui/goalText';
import { Icon } from '../../ui/icons';
import { Piece, Wallet } from '../../ui/pieces';
import { audio } from '../audio';
import { beginMission } from '../state/flow';
import { screen, type From } from '../state/screen';
import { campaign, campaignCommand, data } from '../state/session';
import { FigureFlow } from './Troop';
import { UnitHead } from './unitArt';
import { lockReason, Room, type Apply } from './Rooms';
import '../../ui/camp.css';

/** Level of a castle room as dots (filled up to the level; three at most). */
function Pips({ level, max }: { level: number; max: number }) {
  return (
    <span class="hm-pips" role="img" aria-label={t('ui.room.level', { n: level, max })}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} class={i < level ? '' : 'off'} />
      ))}
    </span>
  );
}

/**
 * The camp, the "home" place of the world map (story 5.3): HUD with the purse, the diorama, the stations, and the bar to
 * troop and map. "Set out" and deployment live on the node card of the map, saving in the map's round menu (product owner
 * 2026-10-24).
 */
export function Camp({ tab }: { tab?: string }) {
  const c = campaign.value!;
  const [open, setOpen] = useState<string | null>(tab ?? null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => audio.music('camp'), []);
  const apply: Apply = (cmd: CampaignCommand, okText?: string) => {
    const r = campaignCommand(cmd);
    if (r.ok) {
      audio.sfx('confirm');
      if (okText) setToast(okText);
    } else {
      audio.sfx('error');
      setToast(t(`ui.camp.err.${r.error}`));
    }
    return r.ok;
  };
  const kind = c.home.kind;
  const view = data.home[kind];
  const castle = kind === 'castle';
  const rooms = homeRooms(data, c);
  const last = c.completed[c.completed.length - 1];
  const talks = availableSupportTalks(data, c).length;
  const room: RoomDef | undefined = open ? (data.rooms[open] ?? undefined) : undefined;
  const close = () => setOpen(null);
  const mourn = room?.function === 'memorial';
  /** a stone of the room list or of the picture: opens the room, or names why it is locked */
  const tap = ({ room: r, open: isOpen, unmet }: RoomStatus) => (isOpen ? setOpen(r.id) : setToast(lockReason(unmet)));
  return (
    <div class={`hm ${open ? 'has-room' : ''} ${mourn ? 'hm--mourn' : ''}`}>
      <img class="hm__scene" src={asset(`locations/${view.image}.webp`)} alt="" draggable={false} />
      {castle && !room && (
        <div class="hm__anchors">
          {view.anchors.flatMap((a) => {
            const st = rooms.find((x) => x.room.id === a.room);
            if (!st) return [];
            return [
              <button key={a.room} type="button" class={`hm-anchor ${st.open ? '' : 'is-locked'}`} style={{ left: `${a.at[0]}%`, top: `${a.at[1]}%` }} aria-label={t(`room.${a.room}.name`)} onClick={() => tap(st)}>
                <span class="hm-room__stone">
                  <Icon name={st.open ? st.room.icon : 'lock'} size={22} />
                </span>
              </button>,
            ];
          })}
        </div>
      )}
      <div class="hm__hud">
        <div class="hm__top">
          <Piece class="hm-act">
            <span class="hm-act__badge">
              <Icon name={mourn ? 'stone' : castle ? 'castle' : 'camp'} size={20} />
            </span>
            <span>
              <small>{castle ? t('ui.map.act', { act: data.campaign.act, season: t(`act.${data.campaign.act}.season`) }) : t('ui.campaign.act', { act: data.campaign.act })}</small>
              <b>{mourn ? t(`room.${room.id}.name`) : t(`home.${kind}.name`)}</b>
            </span>
          </Piece>
          <button type="button" class="hc-head__back" onClick={() => (screen.value = { name: 'options', back: { name: 'camp' } })} aria-label={t('ui.options')}>
            <Icon name="gear" size={22} />
          </button>
        </div>
        <Wallet data={data} gold={c.gold} materials={c.materials} />
      </div>
      <div class="hm__spacer" />
      {room ? (
        <Room key={room.id} room={room} apply={apply} onClose={close} />
      ) : (
        <div class="hm__stack">
          <Piece class="hm-rooms">
            <div class="hm-rooms__title">
              {t(`home.${kind}.title`)}
              <span>{castle ? t('ui.home.rooms', { n: rooms.length }) : t('home.camp.later')}</span>
            </div>
            {rooms.map((st) => {
              const { room: r, open: isOpen, unmet } = st;
              const fresh = isOpen && !!last && r.requires.some((x) => 'completed' in x && x.completed === last);
              const count = r.function === 'campfire' ? talks : r.function === 'tavern' ? c.tavern.length : 0;
              return (
                <button
                  key={r.id}
                  type="button"
                  class={`hm-room ${isOpen ? '' : 'is-locked'}`}
                  aria-disabled={!isOpen}
                  onClick={() => tap(st)}
                >
                  <span class="hm-room__stone">
                    <Icon name={isOpen ? r.icon : 'lock'} size={26} />
                    {isOpen && (count > 0 || fresh) && <span class="hm-dot">{count > 0 ? count : '!'}</span>}
                  </span>
                  {t(`room.${r.id}.name`)}
                  {castle && r.levels.length > 0 && <Pips level={roomLevel(c, r.id)} max={r.levels.length + 1} />}
                  {!isOpen && <small>{lockReason(unmet)}</small>}
                  {isOpen && r.function === 'campfire' && talks > 0 && <small class="hm-room__ready">{t('ui.troop.legend.talk')}</small>}
                </button>
              );
            })}
          </Piece>
          <nav class="hm-nav">
            <button type="button" onClick={() => (screen.value = { name: 'troop', from: 'camp' })}>
              <Icon name="company" size={26} />
              {t('ui.troop.title')}
            </button>
            <button type="button" onClick={() => (screen.value = { name: 'worldmap' })}>
              <Icon name="map" size={26} />
              {t('ui.map.title')}
            </button>
          </nav>
        </div>
      )}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

/** Preparation before a mission: choose units (forced ones fixed), check equipment, start. */
export function Prep({ node, from }: { node: string; from: From }) {
  const c = campaign.value!;
  const nd = data.campaign.nodes.find((n) => n.id === node)!;
  const map = data.maps[nd.map]!;
  const forced = map.deploy.forced;
  const [chosen, setChosen] = useState<string[]>(() => {
    const list = [...forced.filter((id) => c.roster.some((r) => r.id === id))];
    for (const r of c.roster) if (list.length < map.deploy.max && !list.includes(r.id)) list.push(r.id);
    return list;
  });
  const [inv, setInv] = useState<string | null>(null);
  const over = armyOverLimit(data, c);
  const invUnit = inv ? c.roster.find((r) => r.id === inv) : null;
  if (invUnit) return <FigureFlow unit={invUnit} units={c.roster.map((r) => r.id)} onSelect={setInv} onBack={() => setInv(null)} />;
  return (
    <div class="screen" style={{ gap: 10 }}>
      <div class="screen-narrow col" style={{ gap: 10 }}>
        <div class="row">
          <button class="btn small ghost icon-only" onClick={() => (screen.value = { name: from })} aria-label={t('ui.back')}>
            <Icon name="back" />
          </button>
          <h2 class="grow">{t('ui.prep.title')}</h2>
        </div>
        <div class="panel sheet">
          <h3>{t(nd.titleKey)}</h3>
          <div class="muted">{goalLine(map.objectives.victory, map)}</div>
          <div class="muted">{t('ui.prep.count', { n: chosen.length, max: map.deploy.max })}</div>
        </div>
        <div class="list">
          {c.roster.map((r) => {
            const on = chosen.includes(r.id);
            const locked = forced.includes(r.id);
            return (
              <div key={r.id} class="panel sheet" style={{ opacity: on ? 1 : 0.6 }}>
                <UnitCard
                  data={data}
                  unit={r}
                  art={<UnitHead portrait={r.portrait} classId={r.classId} name={unitName(r)} size={56} />}
                  right={
                    <div class="col" style={{ gap: 4 }}>
                      <button
                        class={`btn small ${on ? 'primary' : ''}`}
                        disabled={locked || (!on && chosen.length >= map.deploy.max)}
                        onClick={() => setChosen(on ? chosen.filter((x) => x !== r.id) : [...chosen, r.id])}
                      >
                        <Icon name={locked ? 'lock' : on ? 'check' : 'plus'} size={18} />
                      </button>
                      <button class="btn small ghost icon-only" onClick={() => setInv(r.id)} aria-label={t('ui.inventory')}>
                        <Icon name="bag" size={18} />
                      </button>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
        {over && (
          <div class="muted" role="alert" style={{ color: 'var(--hc-ember-dark)' }}>
            {t('ui.army.over', { n: over.dismiss })}
          </div>
        )}
        <button
          class="btn primary"
          disabled={!!over}
          onClick={() => {
            void beginMission(node, chosen, screen.value);
          }}
        >
          {t('ui.prep.start')}
        </button>
      </div>
    </div>
  );
}
