/** Scenes wired to the app: story context, effects, seen record, auto mode and the built half figures. */
import { useEffect } from 'preact/hooks';
import type { ConsequenceLine } from '../../core';
import { Dialogue } from '../../ui/Dialogue';
import { SpeechBand } from '../../ui/SpeechBand';
import { builtBackgrounds, loadBuiltBackgrounds } from '../state/backgrounds';
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
export function Scene({ id, overlay, rewards, onDone }: { id: string; overlay?: boolean; rewards?: ConsequenceLine[]; onDone: () => void }) {
  useEffect(loadHalfFigures, []);
  useEffect(loadBuiltBackgrounds, []);
  return (
    <Dialogue
      data={data}
      id={id}
      ctx={storyContext()}
      avatarPortrait={avatarOf()}
      overlay={overlay}
      rewards={rewards}
      seen={isSceneSeen(id)}
      halves={halfFigures.value}
      backgrounds={builtBackgrounds.value}
      {...autoProps()}
      onSeen={markSceneSeen}
      onChoose={(line, option) => chooseAnswer(id, line, option)}
      answered={answeredIn(id)}
      head={head}
      onDone={onDone}
    />
  );
}

/** Battle scene as a speech band fixed to the screen; `only` plays just those lines (a bark, never marked seen). */
export function SceneBand({ id, only, params, speed, onDone }: { id: string; only?: string[]; params?: Record<string, string>; speed?: number; onDone: () => void }) {
  return <SpeechBand data={data} id={id} only={only} params={params} speed={speed} ctx={storyContext()} head={head} seen={isSceneSeen(id)} {...autoProps()} onSeen={markSceneSeen} onDone={onDone} />;
}
