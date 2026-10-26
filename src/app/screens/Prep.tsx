/**
 * Deployment before a mission (story 6.10, concept/25-ux/mockups/09-aufstellung.html): over the blurred world map the head,
 * the mission stone, the company as a list of unit cards, and one ember button "Begin battle" at the bottom. Required units
 * come first and stay; the others switch with a tap. Nothing moves when a card switches (fixed order, fixed height).
 */
import { useState } from 'preact/hooks';
import { armyOverLimit, computeStats, type UnitRecord } from '../../core';
import { t } from '../../i18n';
import { itemName, Toast, unitName } from '../../ui/components';
import { goalLine } from '../../ui/goalText';
import { Icon } from '../../ui/icons';
import { Backdrop, ItemChip, Piece, PrimaryButton, ScreenHead } from '../../ui/pieces';
import { nodeShort } from '../campaignInfo';
import { deployOrder, toggleDeploy } from '../prepDeploy';
import { audio } from '../audio';
import { beginMission, defaultDeploy } from '../state/flow';
import { screen, type From } from '../state/screen';
import { campaign, data } from '../state/session';
import { FigureFlow } from './Troop';
import { UnitHead } from './unitArt';
import './Prep.css';

/** One unit card: round head with a full HP ring, name, class and level, HP number, weapon chip, switch and bag. */
function UnitRow({ unit, on, locked, full, onToggle, onBag }: { unit: UnitRecord; on: boolean; locked: boolean; full: boolean; onToggle: () => void; onBag: () => void }) {
  const name = unitName(unit);
  const weapon = unit.equip.mainHand;
  const blocked = !on && full;
  return (
    <Piece class={`prp-unit ${on ? '' : 'is-off'}`}>
      <span class="prp-medal">
        <UnitHead portrait={unit.portrait} classId={unit.classId} name={name} size={32} />
      </span>
      <div class="prp-unit__txt">
        <div class="prp-unit__l1">
          <b>{name}</b>
          <span class="prp-unit__hp">{t('ui.prep.hp', { n: computeStats(data, unit).maxHp })}</span>
        </div>
        <div class="prp-unit__l2">
          {t(`class.${unit.classId}.name`)} · {t('ui.lv')} {unit.level}
        </div>
        <div class="prp-unit__l3">{weapon ? <ItemChip data={data} item={weapon} name={itemName(data, weapon)} /> : <span class="prp-unarmed">{t('ui.unarmed')}</span>}</div>
      </div>
      <div class="prp-unit__acts">
        {locked ? (
          <span class="prp-tog is-lock" role="img" aria-label={t('ui.prep.forced')}>
            <Icon name="lock" size={20} />
          </span>
        ) : (
          <button
            type="button"
            class={`prp-tog ${on ? 'is-on' : blocked ? 'is-full' : 'is-add'}`}
            aria-pressed={on}
            aria-disabled={blocked ? 'true' : undefined}
            aria-label={t(on ? 'ui.prep.leave' : 'ui.prep.take', { name })}
            onClick={onToggle}
          >
            <Icon name={on ? 'check' : 'plus'} size={20} />
          </button>
        )}
        <button type="button" class="prp-bag" aria-label={t('ui.prep.bag', { name })} onClick={onBag}>
          <Icon name="bag" size={20} />
        </button>
      </div>
      {locked && (
        <div class="prp-unit__why">
          <Icon name="lock" size={13} />
          {t('ui.prep.forced')}
        </div>
      )}
    </Piece>
  );
}

/** Preparation before a mission: choose units (required ones fixed), check equipment, start. */
export function Prep({ node, from }: { node: string; from: From }) {
  const c = campaign.value!;
  const nd = data.campaign.nodes.find((n) => n.id === node)!;
  const map = data.maps[nd.map]!;
  const forced = map.deploy.forced;
  const max = map.deploy.max;
  const [chosen, setChosen] = useState<string[]>(() => defaultDeploy(node));
  const [inv, setInv] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const over = armyOverLimit(data, c);
  const invUnit = inv ? c.roster.find((r) => r.id === inv) : null;
  if (invUnit) return <FigureFlow unit={invUnit} units={c.roster.map((r) => r.id)} onSelect={setInv} onBack={() => setInv(null)} />;
  const full = chosen.length >= max;
  const tap = (id: string) => {
    const r = toggleDeploy(chosen, id, forced, max);
    if (r.blocked === 'full') {
      audio.sfx('error');
      setToast(t('ui.prep.full'));
    } else if (!r.blocked) setChosen(r.chosen);
  };
  return (
    <div class="hc-view prp">
      <Backdrop image={`world/${data.world.image}`} />
      <div class="prp__head">
        <ScreenHead title={t('ui.prep.title')} onBack={() => (screen.value = { name: from })} />
      </div>
      <Piece class="prp-info">
        <div class="prp-info__kicker">{t('ui.map.kicker', { node: nodeShort(node) })}</div>
        <h2 class="prp-info__title">{t(`map.${nd.map}.name`)}</h2>
        <p class="prp-info__goal">{goalLine(map.objectives.victory)}</p>
        <div class="prp-info__tags">
          <span class={`prp-tag ${full ? 'is-full' : ''}`}>
            <Icon name="company" size={15} />
            {t('ui.prep.places', { n: chosen.length, max })}
          </span>
          <span class="prp-tag">{t('ui.map.level', { n: nd.expectedLevel })}</span>
        </div>
      </Piece>
      <div class="prp-list">
        <h3 class="prp-list__head">
          {t('ui.troop.title')}
          <span>{t('ui.prep.roster', { n: c.roster.length })}</span>
        </h3>
        {deployOrder(c.roster, forced).map((r) => (
          <UnitRow key={r.id} unit={r} on={chosen.includes(r.id)} locked={forced.includes(r.id)} full={full} onToggle={() => tap(r.id)} onBag={() => setInv(r.id)} />
        ))}
      </div>
      <div class="prp-bottom">
        <PrimaryButton
          disabled={!!over}
          onClick={() => {
            void beginMission(node, chosen, screen.value);
          }}
        >
          {t('ui.prep.start')}
        </PrimaryButton>
        {over && (
          <p class="prp-over" role="alert">
            {t('ui.army.over', { n: over.dismiss })}
          </p>
        )}
      </div>
      {toast && (
        <Toast
          text={toast}
          lead={
            <span class="prp-toast__dot">
              <Icon name="plus" size={16} />
            </span>
          }
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
