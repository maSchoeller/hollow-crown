import type { ChroniclePageDef, GameData } from '../defs';
import type { CampaignState } from '../state';
import { consequenceLines, type ConsequenceLine } from './consequences';
import { decisionTitleKey, findChoice, optionKey, summaryKey } from './scene';

/** Text keys of a chronicle page. */
export const pageTitleKey = (id: string): string => `chronicle.${id}.title`;
export const pageTextKey = (id: string): string => `chronicle.${id}.text`;

/** The German texts of a page (the page file holds them, like a scene). */
export function chronicleTexts(page: ChroniclePageDef): Record<string, string> {
  return { [pageTitleKey(page.id)]: page.title, [pageTextKey(page.id)]: page.text };
}

/** A decision as the chronicle shows it: its name, the answer given, what followed. */
export interface ChronicleDecision {
  scene: string;
  line: string;
  titleKey: string;
  answerKey: string;
  summaryKey: string;
  consequences: ConsequenceLine[];
}

export interface ChronicleAct {
  act: number;
  decisions: ChronicleDecision[];
  /** ids of the pages found in this act, in the order they were found */
  pages: string[];
}

export interface ChronicleView {
  /** every act reached so far (at least the current one), oldest first */
  acts: ChronicleAct[];
  /** pages found / pages of the season */
  found: number;
  total: number;
}

/**
 * What the chronicle shows (story 4.7): per act the decisions with the answer given and their consequences, and the
 * pages found. A decision or page whose content is gone (renamed content) is left out. Pure.
 */
export function chronicleView(data: GameData, c: CampaignState): ChronicleView {
  const byAct = new Map<number, ChronicleAct>();
  const actOf = (n: number) => {
    let a = byAct.get(n);
    if (!a) byAct.set(n, (a = { act: n, decisions: [], pages: [] }));
    return a;
  };
  actOf(data.campaign.act);
  for (const d of c.decisions) {
    const found = findChoice(data, d.scene, d.line, d.option);
    if (!found) continue;
    actOf(d.act).decisions.push({
      scene: d.scene,
      line: d.line,
      titleKey: decisionTitleKey(d.scene, d.line),
      answerKey: optionKey(d.scene, d.line, d.option),
      summaryKey: summaryKey(d.scene, d.line, d.option),
      consequences: consequenceLines(found.option.effects ?? []).filter((l) => l.kind !== 'noted'),
    });
  }
  let found = 0;
  for (const id of c.chronicle) {
    const page = data.chronicle[id];
    if (!page) continue;
    actOf(page.act).pages.push(id);
    found += 1;
  }
  return { acts: [...byAct.values()].sort((a, b) => a.act - b.act), found, total: data.balance.chronicle.seasonPages };
}
