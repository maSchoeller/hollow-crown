/**
 * Farewell after the result (concept/25-ux/mockups/08-ergebnis-abschied.html, story 6.7): one quiet card per fallen figure,
 * everything desaturated but the ember line; the button stays locked for the first seconds and a bell tolls.
 * What to show comes from the core (`farewellView`); this file only lays it out.
 */
import { useEffect, useState } from 'preact/hooks';
import { farewellView, type BattleResult, type FarewellCard } from '../../core';
import { t } from '../../i18n';
import { unitName } from '../../ui/components';
import { Backdrop, Piece, QuietButton } from '../../ui/pieces';
import { audio } from '../audio';
import { nodeDef } from '../state/flow';
import { data } from '../state/session';
import { screen } from '../state/screen';
import { UnitBust, UnitHead } from './unitArt';
import './Farewell.css';

const partnerOf = (id: string) => {
  const r = data.chars[id];
  return { id, nameKey: `unit.${id}.name`, portrait: r?.portrait ?? id, classId: r?.class };
};

function Card({ card }: { card: FarewellCard }) {
  const name = unitName(card);
  const place = t(nodeDef(card.nodeId).titleKey);
  return (
    <Piece class="fw-card">
      <span class="fw-bust">
        <UnitBust portrait={card.portrait} classId={card.classId} name={name} />
      </span>
      <h2 class="fw-name">{name}</h2>
      <span class="fw-sub">{t('ui.farewell.fellIn', { role: card.classId ? t(`class.${card.classId}.name`) : '', place })}</span>
      <span class="fw-ember" aria-hidden="true" />
      <p class="fw-last">{card.lastKey ? t('ui.farewell.quote', { text: t(card.lastKey) }) : t(card.mercenary ? 'ui.farewell.mercenary' : 'ui.farewell.silent')}</p>
      {card.grief.map((g) => {
        const p = partnerOf(g.id);
        const pName = unitName(p);
        return (
          <div key={g.id} class="fw-grief">
            <UnitHead portrait={p.portrait} classId={p.classId} name={pName} size={34} />
            <div>
              <div>
                <b>{pName}</b> {t('ui.farewell.grieves', { count: g.missions, hit: g.hitPenalty })}
              </div>
              {g.lineKey && <q class="fw-grief__line">{t(g.lineKey)}</q>}
            </div>
          </div>
        );
      })}
    </Piece>
  );
}

/** One fallen figure after another; after the last one the campaign goes on to the world map. */
export function Farewell({ result, index }: { result: BattleResult; index: number }) {
  const cards = farewellView(data, result);
  const card = cards[index];
  const [locked, setLocked] = useState(true);
  useEffect(() => {
    setLocked(true);
    audio.sfx('bell');
    const id = setTimeout(() => setLocked(false), data.balance.farewell.lockMs);
    return () => clearTimeout(id);
  }, [index]);
  if (!card) {
    screen.value = { name: 'worldmap' };
    return null;
  }
  const next = () => (screen.value = index + 1 < cards.length ? { name: 'farewell', result, index: index + 1 } : { name: 'worldmap' });
  return (
    <div class="hc-view fw-view" key={card.id}>
      <Backdrop />
      <div class="hc-view__fill fw-stage">
        <Card card={card} />
      </div>
      <QuietButton disabled={locked} aria-disabled={locked} onClick={next}>
        {t('ui.farewell.take')}
      </QuietButton>
    </div>
  );
}
