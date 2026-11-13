/**
 * The training ground (story 10.8): names the share of the average EP the reserve gets at the current level and the reserve of
 * the last won mission with its EP and level-ups. The share comes from `reservePct`, the function the result uses as well;
 * the build-up band in the head names the next level's share.
 */
import { reservePct, type RoomDef } from '../../core';
import { t } from '../../i18n';
import { unitName } from '../../ui/components';
import { Amount } from '../../ui/pieces';
import { campaign, data } from '../state/session';
import { RoomPanel } from './Rooms';
import { UnitHead } from './unitArt';
import './Training.css';

export function TrainingRoom({ room, onClose }: { room: RoomDef; onClose: () => void }) {
  const c = campaign.value!;
  const pct = reservePct(data, c);
  const last = c.reserveLast.flatMap((r) => {
    const u = c.roster.find((x) => x.id === r.unit);
    return u ? [{ r, u }] : [];
  });
  return (
    <RoomPanel room={room} onClose={onClose}>
      {pct > 0 && <p class="hm-hint">{t('ui.room.training.share', { pct })}</p>}
      <div class="hm-subhead">{t('ui.room.training.last')}</div>
      {last.length === 0 && <div class="hm-none">{t('ui.room.training.none')}</div>}
      {last.map(({ r, u }) => (
        <div key={r.unit} class="tr-line">
          <UnitHead portrait={u.portrait} classId={u.classId} name={unitName(u)} size={34} />
          <span class="tr-line__name">{unitName(u)}</span>
          {/* an empty cell keeps the EP of every line in one column */}
          {r.levelAfter > r.levelBefore ? (
            <span class="tr-line__lv">
              {t('ui.lv')} {r.levelAfter}
            </span>
          ) : (
            <span />
          )}
          <Amount resource="exp" value={r.exp} signed />
        </div>
      ))}
    </RoomPanel>
  );
}
