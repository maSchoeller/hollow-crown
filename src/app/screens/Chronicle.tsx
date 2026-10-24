/** Chronicle (story 4.7, EXPERIENCE.md "Chronik"): per act the decisions with the answer given and their consequences, and the pages found. */
import { useState } from 'preact/hooks';
import { chronicleView, pageTextKey, pageTitleKey, type ChronicleAct, type ChronicleDecision } from '../../core';
import { t } from '../../i18n';
import { consequenceView } from '../../ui/ConsequenceCard';
import { Icon } from '../../ui/icons';
import { Backdrop, Piece, ScreenHead, Tabs } from '../../ui/pieces';
import { Sheet } from '../../ui/Sheet';
import { campaign, data } from '../state/session';
import { screen, type From } from '../state/screen';
import { UnitHead } from './unitArt';
import './Chronicle.css';

type Tab = 'decisions' | 'pages';

const head = (unit: string) => (
  <UnitHead
    portrait={unit === 'avatar' ? campaign.value?.avatar.portrait : (data.chars[unit]?.portrait ?? unit)}
    name={t(unit === 'avatar' ? 'unit.avatar.name' : `unit.${unit}.name`)}
    size={28}
  />
);

export function Chronicle({ from = 'worldmap' }: { from?: From }) {
  const c = campaign.value!;
  const view = chronicleView(data, c);
  const [tab, setTab] = useState<Tab>('decisions');
  const [page, setPage] = useState<string | null>(null);
  const decisions = view.acts.reduce((n, a) => n + a.decisions.length, 0);
  return (
    <>
      <div class="hc-view">
        <Backdrop />
        <div class="col" style={{ gap: 8 }}>
          <ScreenHead
            title={t('ui.chronicle.title')}
            aside={t('ui.chronicle.found', { n: view.found, total: view.total })}
            onBack={() => (screen.value = { name: from })}
          />
          <Tabs
            value={tab}
            label={t('ui.chronicle.title')}
            onChange={setTab}
            options={[
              { id: 'decisions', label: t('ui.chronicle.tab.decisions', { n: decisions }) },
              { id: 'pages', label: t('ui.chronicle.tab.pages', { n: view.found, total: view.total }) },
            ]}
          />
        </div>
        <Piece class="hc-view__scroll chr">
          {view.acts.map((a) => (
            <section key={a.act} class="chr-act">
              <div class="hc-title-row">
                {t('ui.chronicle.act', { act: a.act, name: t(`act.${a.act}.name`) })}
                <span>
                  {tab === 'decisions'
                    ? t('ui.chronicle.count.decisions', { n: a.decisions.length })
                    : t('ui.chronicle.count.pages', { n: a.pages.length })}
                </span>
              </div>
              {tab === 'decisions' ? <Decisions act={a} /> : <Pages act={a} onOpen={setPage} />}
            </section>
          ))}
        </Piece>
      </div>
      {page && (
        <Sheet title={t(pageTitleKey(page))} onClose={() => setPage(null)}>
          <p class="chr-page">{t(pageTextKey(page))}</p>
        </Sheet>
      )}
    </>
  );
}

function Decisions({ act }: { act: ChronicleAct }) {
  if (!act.decisions.length) return <p class="chr-empty">{t('ui.chronicle.noDecisions')}</p>;
  return (
    <div class="chr-items">
      {act.decisions.map((d) => (
        <Decision key={`${d.scene}#${d.line}`} d={d} />
      ))}
    </div>
  );
}

/** One decision: its name, the answer given (highlighted like in the log), the outcome and its consequences. */
function Decision({ d }: { d: ChronicleDecision }) {
  return (
    <article class="chr-dec">
      <b class="chr-dec__title">{t(d.titleKey)}</b>
      <div class="chr-dec__answer">
        <span>{t('ui.dialogue.yourChoice')}</span>
        {t(d.answerKey)}
      </div>
      <div class="chr-dec__summary">
        <span class="hc-kick chr-dec__kick">
          <i />
          {t('ui.consequence.mark')}
        </span>
        <b>{t(d.summaryKey)}</b>
      </div>
      {d.consequences.length > 0 && (
        <ul class="chr-dec__effects">
          {d.consequences.map((l, i) => {
            const v = consequenceView(data, l, head);
            return (
              <li key={i}>
                <span class="chr-dec__icon">{v.icon}</span>
                <span>
                  {v.title} {v.amount}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

function Pages({ act, onOpen }: { act: ChronicleAct; onOpen: (id: string) => void }) {
  if (!act.pages.length) return <p class="chr-empty">{t('ui.chronicle.noPages')}</p>;
  return (
    <div class="chr-items">
      {act.pages.map((id) => (
        <button key={id} type="button" class="hc-line-item chr-pageline" onClick={() => onOpen(id)}>
          <span class="chr-pageline__icon">
            <Icon name="log" size={22} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span class="hc-line-item__name">{t(pageTitleKey(id))}</span>
            <span class="hc-line-item__sub">{t('ui.chronicle.read')}</span>
          </span>
          <span class="hc-line-item__side">
            <Icon name="forward" size={18} />
          </span>
        </button>
      ))}
    </div>
  );
}
