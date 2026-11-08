/**
 * The home (concept/25-ux/mockups/04-heimat.html "Lager in Akt 1" and Variante B, stories 6.3 and 6.9): the picture on top,
 * the rooms as stones below, a room opens as a panel over the blurred view. The rooms come from `content/core/rooms.yaml`
 * (`c.home`), their opening from `requires` per room; picture and anchors per kind of home from `content/home/home.yaml`.
 * In the castle the top is the 3D scene (`Castle3d`) with the room stones over their buildings; the list shows their level as dots.
 */
import { useEffect, useState } from 'preact/hooks';
import { actOf, availableSupportTalks, castleTier, homeRooms, roomLevel, type CampaignCommand, type RoomDef, type RoomStatus } from '../../core';
import { t } from '../../i18n';
import { asset } from '../../ui/asset';
import { Toast } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Piece, Wallet } from '../../ui/pieces';
import { audio } from '../audio';
import { screen } from '../state/screen';
import { campaign, campaignCommand, data } from '../state/session';
import { lockReason, Room, type Apply } from './Rooms';
import { Castle3d, castle3dFlag, CastleDevBar } from './Castle3d';
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
export function Camp({ tab, unit }: { tab?: string; unit?: string }) {
  const c = campaign.value!;
  const [open, setOpen] = useState<string | null>(tab ?? null);
  const [toast, setToast] = useState<string | null>(null);
  // dev only (`?castle3d=1`): a bar sets one stage for all of the castle
  const [devBar] = useState(castle3dFlag);
  const [devTier, setDevTier] = useState<number | null>(null);
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
      {castle ? (
        <Castle3d
          rooms={rooms}
          levelOf={(id) => (devTier !== null ? Math.max(1, devTier) : rooms.some((x) => x.room.id === id) ? roomLevel(c, id) : 0)}
          tier={devTier ?? castleTier(data, c)}
          onRoom={(_id, st) => (st ? tap(st) : setToast(t('ui.dev.castle3d.noRoom')))}
          fallback={asset(`locations/${view.image}.webp`)}
          stats={devBar}
        />
      ) : (
        <img class="hm__scene" src={asset(`locations/${view.image}.webp`)} alt="" draggable={false} />
      )}
      {castle && devBar && !room && <CastleDevBar tier={devTier} setTier={setDevTier} />}
      <div class="hm__hud">
        <div class="hm__top">
          <Piece class="hm-act">
            <span class="hm-act__badge">
              <Icon name={mourn ? 'stone' : castle ? 'castle' : 'camp'} size={20} />
            </span>
            <span>
              <small>{castle ? t('ui.map.act', { act: actOf(c), season: t(`act.${actOf(c)}.season`) }) : t('ui.campaign.act', { act: actOf(c) })}</small>
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
        <Room key={room.id} room={room} apply={apply} onClose={close} unit={room.id === tab ? unit : undefined} />
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
