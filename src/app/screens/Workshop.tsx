/**
 * The workshop (story 10.6): makes consumables and runes from material (and gold) after the recipes of `recipes.yaml`. Listed like
 * the merchant (EXPERIENCE: item image, name, info stone, cost as material image + number and gold + number, stock in the convoy);
 * recipes above the workshop level are dimmed with "from workshop level n". Choose a recipe (1), then the main button (2). Costs
 * and the error come from `craftCost`, the function the command `craft` checks with.
 */
import { useState } from 'preact/hooks';
import { craftCost, itemDef, type RoomDef } from '../../core';
import { t } from '../../i18n';
import { ItemLine } from '../../ui/components';
import { Amount, PrimaryButton } from '../../ui/pieces';
import { campaign, data } from '../state/session';
import { RoomPanel, type Apply } from './Rooms';
import './Workshop.css';

const probe = (id: string) => ({ uid: `recipe-${id}`, def: id, upgrade: 0, affixes: [], runes: [] });

/** Material and gold of one recipe as symbol + number; a missing amount is red. */
function Costs({ id }: { id: string }) {
  const c = campaign.value!;
  const cost = craftCost(data, c, id);
  return (
    <span class="ws-cost">
      {cost.materials.map((m) => (
        <Amount key={m.id} material={itemDef(data, m.id)} value={m.need} short={m.have < m.need} />
      ))}
      {cost.gold > 0 && <Amount resource="gold" value={cost.gold} short={c.gold < cost.gold} />}
    </span>
  );
}

export function WorkshopRoom({ room, apply, onClose }: { room: RoomDef; apply: Apply; onClose: () => void }) {
  const c = campaign.value!;
  const [sel, setSel] = useState<string | null>(null);
  const chosen = sel ? craftCost(data, c, sel) : null;
  return (
    <RoomPanel
      room={room}
      onClose={onClose}
      actions={
        <PrimaryButton disabled={!chosen || chosen.error !== null} onClick={() => sel && apply({ type: 'craft', recipe: sel }, t('ui.room.workshop.made'))}>
          {chosen && chosen.recipe ? (
            <span class="ws-make">
              {t('ui.room.workshop.make')} · <Costs id={sel!} />
            </span>
          ) : (
            t('ui.room.workshop.make')
          )}
        </PrimaryButton>
      }
    >
      <p class="hm-hint">{t('ui.room.workshop.hint')}</p>
      {Object.values(data.recipes).map((r) => {
        const cost = craftCost(data, c, r.id);
        const locked = cost.error === 'room_locked';
        const stock = c.convoy.filter((i) => i.def === r.item).length;
        return (
          <ItemLine
            key={r.id}
            data={data}
            inst={probe(r.item)}
            dim={locked}
            selected={sel === r.id}
            onClick={() => setSel(sel === r.id ? null : r.id)}
            sub={locked ? t('ui.room.workshop.from', { n: r.roomLevel }) : <Costs id={r.id} />}
            side={<span class="ws-stock">{t('ui.room.workshop.stock', { n: stock })}</span>}
          />
        );
      })}
    </RoomPanel>
  );
}
