/** Scenes wired to the app: story context, effects, seen record, auto mode and the built half figures. */
import { useEffect } from 'preact/hooks';
import { Dialogue } from '../../ui/Dialogue';
import { SpeechBubbles } from '../../ui/SpeechBubbles';
import { halfFigures, loadHalfFigures } from '../state/halves';
import { data, campaign } from '../state/session';
import { answeredIn, chooseAnswer, isSceneSeen, markSceneSeen, storyContext } from '../state/flow';
import { settings, updateSettings } from '../state/settings';
import { t } from '../../i18n';
import { UnitHead } from './unitArt';

const avatarOf = (): string => campaign.value?.avatar.portrait ?? 'avatar_a';
/** Round head of a company member (consequence card). */
const head = (unit: string) => (
  <UnitHead portrait={unit === 'avatar' ? avatarOf() : (data.chars[unit]?.portrait ?? unit)} name={t(unit === 'avatar' ? 'unit.avatar.name' : `unit.${unit}.name`)} size={40} />
);
const autoProps = () => ({ auto: settings.value.dialogueAuto, onAuto: () => updateSettings({ dialogueAuto: !settings.value.dialogueAuto }) });

/** Visual-novel scene; `overlay` lets the battle show through (scene with several speakers or answers during a battle). */
export function Scene({ id, overlay, onDone }: { id: string; overlay?: boolean; onDone: () => void }) {
  useEffect(loadHalfFigures, []);
  return (
    <Dialogue
      data={data}
      id={id}
      ctx={storyContext()}
      avatarPortrait={avatarOf()}
      overlay={overlay}
      seen={isSceneSeen(id)}
      halves={halfFigures.value}
      {...autoProps()}
      onSeen={markSceneSeen}
      onChoose={(line, option) => chooseAnswer(id, line, option)}
      answered={answeredIn(id)}
      head={head}
      onDone={onDone}
    />
  );
}

/** Battle scene as speech bubbles; `anchorOf` gives the point above a speaker's head; `only` plays just those lines (a bark, never marked seen). */
export function SceneBubbles({ id, only, params, speed, anchorOf, onDone }: { id: string; only?: string[]; params?: Record<string, string>; speed?: number; anchorOf: (speaker: string) => Promise<{ x: number; y: number } | null>; onDone: () => void }) {
  return <SpeechBubbles data={data} id={id} only={only} params={params} speed={speed} ctx={storyContext()} seen={isSceneSeen(id)} {...autoProps()} onSeen={markSceneSeen} anchorOf={anchorOf} onDone={onDone} />;
}
