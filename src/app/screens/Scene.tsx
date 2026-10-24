/** Scenes wired to the app: story context, effects, seen record, auto mode and the built half figures. */
import { useEffect } from 'preact/hooks';
import { Dialogue } from '../../ui/Dialogue';
import { SpeechBubbles } from '../../ui/SpeechBubbles';
import { halfFigures, loadHalfFigures } from '../state/halves';
import { data, campaign } from '../state/session';
import { isSceneSeen, markSceneSeen, runEffects, storyContext } from '../state/flow';
import { settings, updateSettings } from '../state/settings';

const avatarOf = (): string => campaign.value?.avatar.portrait ?? 'avatar_a';
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
      onEffects={runEffects}
      onDone={onDone}
    />
  );
}

/** Battle scene as speech bubbles; `anchorOf` gives the point above a speaker's head. */
export function SceneBubbles({ id, anchorOf, onDone }: { id: string; anchorOf: (speaker: string) => Promise<{ x: number; y: number } | null>; onDone: () => void }) {
  return <SpeechBubbles data={data} id={id} ctx={storyContext()} seen={isSceneSeen(id)} {...autoProps()} onSeen={markSceneSeen} anchorOf={anchorOf} onDone={onDone} />;
}
