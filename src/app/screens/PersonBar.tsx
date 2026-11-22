/**
 * Person bar (story 16.17, DESIGN `person-bar`): the fixed strip under the room head. Medallions of the troop, the convoy last
 * (line icon in the medallion), below name, class, level and what the figure wears as small pictures. Scrolls never with the list.
 * The enchanter (16.16) uses the same strip.
 */
import type { UnitRecord } from '../../core';
import { t } from '../../i18n';
import { unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { ItemImage } from '../../ui/pieces';
import { data } from '../state/session';
import { UnitHead } from './unitArt';
import './PersonBar.css';

export const BAR_CONVOY = 'convoy';

export function PersonBar({ units, value, onChange, convoy }: { units: UnitRecord[]; value: string; onChange: (id: string) => void; convoy?: { count: number; max: number } }) {
  const unit = units.find((u) => u.id === value);
  const worn = unit ? Object.values(unit.equip).filter((i): i is NonNullable<typeof i> => !!i) : [];
  return (
    <div class="pbar">
      <div class="pbar__meds" role="group" aria-label={t('ui.room.merchant.person')}>
        {units.map((u) => (
          <button key={u.id} type="button" class="pbar__med" aria-pressed={u.id === value} onClick={() => onChange(u.id)}>
            <UnitHead portrait={u.portrait} classId={u.classId} name={unitName(u)} size={40} />
            <span class="pbar__label">{unitName(u)}</span>
          </button>
        ))}
        {convoy && (
          <button type="button" class="pbar__med" aria-pressed={value === BAR_CONVOY} onClick={() => onChange(BAR_CONVOY)}>
            <span class="pbar__face">
              <Icon name="convoy" size={22} />
            </span>
            <span class="pbar__label">{t('ui.convoy')}</span>
          </button>
        )}
      </div>
      <div class="pbar__who">
        {unit ? (
          <>
            <b>{unitName(unit)}</b>
            <span class="pbar__sub">
              {t(`class.${unit.classId}.name`)} · {t('ui.lv')} {unit.level}
            </span>
            <span class="pbar__worn">
              {worn.map((i) => (
                <ItemImage key={i.uid} data={data} item={i} size={26} />
              ))}
            </span>
          </>
        ) : (
          <>
            <b>{t('ui.convoy')}</b>
            {convoy && <span class="pbar__sub">{t('ui.convoy.count', { n: convoy.count, max: convoy.max })}</span>}
          </>
        )}
      </div>
    </div>
  );
}
