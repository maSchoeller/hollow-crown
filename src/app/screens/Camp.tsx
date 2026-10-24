/**
 * The camp of act 1 (concept/25-ux/mockups/04-heimat.html "Lager in Akt 1", story 6.3): the diorama on top, the
 * stations as room stones below, a room opens as a panel over the blurred view. The rooms come from
 * `content/core/rooms.yaml` (`c.home`), their opening from `requires` per room.
 */
import { useEffect, useState } from 'preact/hooks';
import { availableSupportTalks, homeRooms, type CampaignCommand, type Condition, type RoomDef } from '../../core';
import { t } from '../../i18n';
import { asset } from '../../ui/asset';
import { Toast, UnitCard } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Piece, PrimaryButton, Wallet } from '../../ui/pieces';
import { listSaves, type SaveRecord } from '../../persistence/save';
import { audio } from '../audio';
import { nodeShort } from '../campaignInfo';
import { nodeDef, playNode } from '../state/flow';
import { pendingEvents, startBattle } from '../state/battle';
import { screen } from '../state/screen';
import { campaign, campaignCommand, campaignId, data, saveSlot } from '../state/session';
import { downloadSave, SlotPicker } from './Menus';
import { FigureFlow } from './Troop';
import { Room, RoomPanel, type Apply } from './Rooms';
import { SecondaryButton } from '../../ui/pieces';
import '../../ui/camp.css';

/** Why a station is locked: the first condition that fails, in the player's words. */
function lockReason(unmet?: Condition): string {
  if (unmet && 'completed' in unmet) return t('ui.room.after', { node: nodeShort(unmet.completed) });
  if (unmet && 'act' in unmet) return t('ui.room.fromAct', { n: unmet.act });
  return t('ui.room.locked');
}

/** The camp: HUD with the purse, the diorama, stations, "set out", and the bar to troop, deployment, map and save. */
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
  const rooms = homeRooms(data, c);
  const last = c.completed[c.completed.length - 1];
  const talks = availableSupportTalks(data, c).length;
  const next = c.available[0] ? nodeDef(c.available[0]) : null;
  const room: RoomDef | undefined = open ? (data.rooms[open] ?? undefined) : undefined;
  const close = () => setOpen(null);
  return (
    <div class={`hm ${open ? 'has-room' : ''}`}>
      <img class="hm__scene" src={asset('locations/lager_unterwegs.webp')} alt="" draggable={false} />
      <div class="hm__hud">
        <div class="hm__top">
          <Piece class="hm-act">
            <span class="hm-act__badge">
              <Icon name="camp" size={20} />
            </span>
            <span>
              <small>{t('ui.campaign.act', { act: data.campaign.act })}</small>
              <b>{t('home.camp.name')}</b>
            </span>
          </Piece>
          <button type="button" class="hc-head__back" onClick={() => (screen.value = { name: 'options', back: { name: 'camp' } })} aria-label={t('ui.options')}>
            <Icon name="gear" size={22} />
          </button>
        </div>
        <Wallet data={data} gold={c.gold} materials={c.materials} />
      </div>
      <div class="hm__spacer" />
      {open === 'save' ? (
        <SavePanel onClose={close} onToast={setToast} />
      ) : room ? (
        <Room key={room.id} room={room} apply={apply} onClose={close} />
      ) : (
        <div class="hm__stack">
          <Piece class="hm-rooms">
            <div class="hm-rooms__title">
              {t('home.camp.title')}
              <span>{t('home.camp.later')}</span>
            </div>
            {rooms.map(({ room: r, open: isOpen, unmet }) => {
              const fresh = isOpen && !!last && r.requires.some((x) => 'completed' in x && x.completed === last);
              const count = r.function === 'campfire' ? talks : r.function === 'tavern' ? c.tavern.length : 0;
              return (
                <button
                  key={r.id}
                  type="button"
                  class={`hm-room ${isOpen ? '' : 'is-locked'}`}
                  aria-disabled={!isOpen}
                  onClick={() => (isOpen ? setOpen(r.id) : setToast(lockReason(unmet)))}
                >
                  <span class="hm-room__stone">
                    <Icon name={isOpen ? r.icon : 'lock'} size={26} />
                    {isOpen && (count > 0 || fresh) && <span class="hm-dot">{count > 0 ? count : '!'}</span>}
                  </span>
                  {t(`room.${r.id}.name`)}
                  {!isOpen && <small>{lockReason(unmet)}</small>}
                </button>
              );
            })}
          </Piece>
          {next ? (
            <PrimaryButton sub={nodeShort(next.id)} onClick={() => playNode(next.id)}>
              {t('ui.hub.setOut')}
            </PrimaryButton>
          ) : (
            <Piece style={{ textAlign: 'center' }}>
              <b>{t('ui.world.endTitle')}</b>
              <div style={{ color: 'var(--hc-soft)' }}>{t('ui.world.endText')}</div>
            </Piece>
          )}
          <nav class="hm-nav">
            <button type="button" onClick={() => (screen.value = { name: 'troop' })}>
              <Icon name="company" size={26} />
              {t('ui.troop.title')}
            </button>
            <button type="button" disabled={!next} onClick={() => next && playNode(next.id, { prep: true })}>
              <Icon name="swap" size={26} />
              {t('ui.hub.prep')}
            </button>
            <button type="button" onClick={() => (screen.value = { name: 'worldmap' })}>
              <Icon name="map" size={26} />
              {t('ui.world.title')}
            </button>
            <button type="button" onClick={() => setOpen('save')}>
              <Icon name="save" size={26} />
              {t('ui.camp.save')}
            </button>
          </nav>
        </div>
      )}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function SavePanel({ onClose, onToast }: { onClose: () => void; onToast: (s: string) => void }) {
  const [saves, setSaves] = useState<SaveRecord[]>([]);
  const [picker, setPicker] = useState(false);
  const classic = campaign.value?.settings.deathMode === 'classic';
  const refresh = () => void (campaignId.value ? listSaves(campaignId.value).then(setSaves) : setSaves([]));
  useEffect(refresh, []);
  const auto = saves.find((s) => s.slot === 'auto');
  return (
    <RoomPanel title={t('ui.save.title')} desc={t('ui.battle.autosaved')} onClose={onClose}>
      {classic ? (
        <p class="muted">{t('ui.save.classic')}</p>
      ) : (
        <SecondaryButton onClick={() => setPicker(true)}>
          <Icon name="save" size={18} /> {t('ui.save.title')}
        </SecondaryButton>
      )}
      {saves
        .filter((s) => s.slot !== 'auto')
        .map((s) => (
          <SecondaryButton key={s.slot} onClick={() => downloadSave(s)}>
            <Icon name="download" size={18} /> {t('ui.save.export')} {t('ui.save.slot')} {s.slot}
          </SecondaryButton>
        ))}
      {auto && (
        <SecondaryButton onClick={() => downloadSave(auto)}>
          <Icon name="download" size={18} /> {t('ui.save.export')} ({t('ui.save.auto')})
        </SecondaryButton>
      )}
      {picker && (
        <SlotPicker
          save
          saves={saves}
          onClose={() => setPicker(false)}
          onPick={(slot) => {
            void saveSlot(slot).then(
              () => {
                setPicker(false);
                refresh();
                onToast(t('ui.save.done'));
              },
              () => {
                setPicker(false);
                onToast(t('ui.save.failed'));
              },
            );
          }}
        />
      )}
    </RoomPanel>
  );
}

/** Preparation before a mission: choose units (forced ones fixed), check equipment, start. */
export function Prep({ node }: { node: string }) {
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
  const invUnit = inv ? c.roster.find((r) => r.id === inv) : null;
  if (invUnit) return <FigureFlow unit={invUnit} units={c.roster.map((r) => r.id)} onSelect={setInv} onBack={() => setInv(null)} />;
  return (
    <div class="screen" style={{ gap: 10 }}>
      <div class="screen-narrow col" style={{ gap: 10 }}>
        <div class="row">
          <button class="btn small ghost icon-only" onClick={() => (screen.value = { name: 'camp' })} aria-label={t('ui.back')}>
            <Icon name="back" />
          </button>
          <h2 class="grow">{t('ui.prep.title')}</h2>
        </div>
        <div class="panel sheet">
          <h3>{t(nd.titleKey)}</h3>
          <div class="muted">{t(`ui.world.goal.${map.objectives.victory.type}`, { turns: 'turns' in map.objectives.victory ? map.objectives.victory.turns : 0 })}</div>
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
        <button
          class="btn primary"
          onClick={() => {
            pendingEvents.value = startBattle(node, chosen);
          }}
        >
          {t('ui.prep.start')}
        </button>
      </div>
    </div>
  );
}
