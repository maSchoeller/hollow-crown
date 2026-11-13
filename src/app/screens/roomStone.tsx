/** Marks of a castle room stone (DESIGN `room-stone`, stories 6.9 and 10.1): its level as dots and the green build-up arrow. */
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';

/** Level of a castle room as dots (filled up to the level; three at most). Shared by the room list and the stones of the 3D castle. */
export function Pips({ level, max }: { level: number; max: number }) {
  return (
    <span class="hm-pips" role="img" aria-label={t('ui.room.level', { n: level, max })}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} class={i < level ? '' : 'off'} />
      ))}
    </span>
  );
}

/** The green arrow of a room stone that can be built up now (DESIGN room-stone, story 10.1). */
export function UpArrow() {
  return (
    <span class="hm-up" role="img" aria-label={t('ui.room.buildable')}>
      <Icon name="up" size={12} />
    </span>
  );
}
