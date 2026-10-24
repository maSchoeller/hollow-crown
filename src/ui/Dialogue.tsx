import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  consequenceLines,
  resolveScene,
  skipTarget,
  speakerTeam,
  type ConditionContext,
  type ConsequenceLine,
  type Effect,
  type FlagValue,
  type GameData,
  type ResolvedLine,
  type ResolvedOption,
} from '../core';
import { t } from '../i18n';
import { asset, Modal } from './components';
import { ConsequenceCard } from './ConsequenceCard';
import { figureId, halfUrl, pickHalf } from './halfFigure';
import { Icon } from './icons';
import { SceneTools } from './SceneTools';
import './Dialogue.css';

export interface DialogueProps {
  data: GameData;
  id: string;
  ctx: ConditionContext;
  avatarPortrait: string;
  overlay?: boolean;
  /** the player has seen this scene before: Skip is marked and leaves it whole */
  seen?: boolean;
  /** the player confirmed answer `option` of choice line `line` (the campaign command `choose`) */
  onChoose: (line: string, option: ResolvedOption) => void;
  /** answers given before in this scene (line id → option id): such a choice is not asked again */
  answered?: Readonly<Record<string, string>>;
  /** round head of a company member for the consequence card */
  head?: (unit: string) => ComponentChildren;
  /** the scene ended (read to the end or skipped) */
  onDone: () => void;
  /** records that the scene was seen (called just before `onDone`) */
  onSeen?: (id: string) => void;
  auto: boolean;
  onAuto: () => void;
  /** stems of the built half figures (manifest), `null` while unknown */
  halves?: ReadonlySet<string> | null;
  onLine?: (speaker?: string, mood?: string) => void;
}

type Line = Extract<ResolvedLine, { kind: 'line' }>;
type Choice = Extract<ResolvedLine, { kind: 'choice' }>;
type Side = 'left' | 'right';

const NONE: Readonly<Record<string, string>> = {};
const noHead = (): ComponentChildren => null;

/** Flags an answer sets (`setFlag: name` = true), so later lines of the scene see them before the campaign state has caught up. */
function setFlags(effects: readonly Effect[]): Record<string, FlagValue> {
  const out: Record<string, FlagValue> = {};
  for (const e of effects)
    if ('setFlag' in e) {
      if (typeof e.setFlag === 'string') out[e.setFlag] = true;
      else Object.assign(out, e.setFlag);
    }
  return out;
}

/** Half figure of a speaker (mood variant, else neutral; none without a picture, never an older style). Speaker bright, listeners dimmed. */
function Figure({ speaker, mood, avatarPortrait, side, active, halves }: { halves?: ReadonlySet<string> | null; speaker: string; mood: string; avatarPortrait: string; side: Side; active: boolean }) {
  const stem = pickHalf(figureId(speaker, avatarPortrait), mood, halves);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [stem]);
  if (!stem || failed) return null;
  return (
    <div class={`vn-fig vn-fig--${side} ${active ? 'is-speaker' : 'is-listener'}`}>
      <img src={halfUrl(stem)} alt="" draggable={false} onError={() => setFailed(true)} />
    </div>
  );
}

/** Visual-novel scene: blurred place, speaker as a bright half figure, listeners dimmed, glow-pill name tag, Log/Auto/Skip, tap to go on (mockup 05). */
export function Dialogue({ data, id, ctx: ctxIn, avatarPortrait, overlay, seen = false, auto, onAuto, halves, onChoose, answered = NONE, head = noHead, onDone, onSeen, onLine }: DialogueProps) {
  const def = data.scenes[id];
  // the story as the scene began: an answer that sends a companion away must not change who spoke the lines before it;
  // later lines follow the answer through the flags it sets (`local`)
  const [ctx] = useState(ctxIn);
  const cfg = data.balance.scene;
  const [idx, setIdx] = useState(0);
  const [local, setLocal] = useState<Record<string, FlagValue>>({});
  const [shown, setShown] = useState(0);
  const [log, setLog] = useState(false);
  const [wasSeen] = useState(seen);
  // answers given in this run of the scene (for the log), the answer marked by a first tap, the open consequence card
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [card, setCard] = useState<{ title: string; lines: ConsequenceLine[]; go: () => void } | null>(null);
  // answers given in this scene count at once, before the campaign state has caught up
  const now = useMemo(() => ({ ...ctx, flags: { ...ctx.flags, ...local } }), [ctx, local]);
  const lines = useMemo(() => (def ? resolveScene(data, now, id) : []), [data, now, id]);
  const line = lines[idx];

  const finish = () => {
    onSeen?.(id);
    onDone();
  };
  useEffect(() => {
    if (!def || idx >= lines.length) finish();
  }, [idx, def]);

  const text = line?.kind === 'line' ? t(line.key) : '';
  useEffect(() => {
    setShown(0);
    if (line?.kind === 'line') onLine?.(line.speaker, line.mood);
  }, [idx]);
  useEffect(() => {
    if (shown >= text.length) return;
    const timer = setTimeout(() => setShown((s) => Math.min(text.length, s + cfg.typeCharsPerTick)), cfg.typeTickMs);
    return () => clearTimeout(timer);
  }, [shown, text]);
  // auto mode: once a line is shown it waits for the time it takes to read, then goes on (never at a choice)
  const readyToGo = line?.kind === 'line' && shown >= text.length;
  useEffect(() => {
    if (!auto || !readyToGo) return;
    const timer = setTimeout(() => setIdx((i) => i + 1), cfg.autoBaseMs + cfg.autoPerCharMs * text.length);
    return () => clearTimeout(timer);
  }, [auto, readyToGo, idx]);

  // sides follow the order of first appearance: kael and the avatar left, the others right (then left)
  const sides = useMemo(() => {
    const m: Record<string, Side> = {};
    for (const l of lines) {
      if (l.kind !== 'line' || !l.speaker || m[l.speaker]) continue;
      const taken = new Set(Object.values(m));
      m[l.speaker] = l.speaker === 'kael' || l.speaker === 'avatar' ? 'left' : !taken.has('right') ? 'right' : !taken.has('left') ? 'left' : 'right';
    }
    return m;
  }, [lines]);
  // figures on stage: the last line per side up to now
  const stage = useMemo(() => {
    const st: { left?: Line; right?: Line } = {};
    for (let i = 0; i <= idx && i < lines.length; i++) {
      const l = lines[i]!;
      if (l.kind === 'line' && l.speaker) st[sides[l.speaker] ?? 'right'] = l;
    }
    return st;
  }, [idx, lines, sides]);

  /** goes on after a choice, with the flags its answer sets (the campaign state may not have caught up yet) */
  const continueAfter = (c: Choice, effects: readonly Effect[]) => {
    const next = { ...local, ...setFlags(effects) };
    setLocal(next);
    const after = resolveScene(data, { ...ctx, flags: { ...ctx.flags, ...next } }, id);
    setIdx(after.findIndex((l) => l.uid === c.uid) + 1);
  };
  // a choice answered before is never asked again (answers are not taken back): the scene goes on with that answer
  useEffect(() => {
    if (line?.kind !== 'choice' || answered[line.line] === undefined || picked[line.line] !== undefined) return;
    continueAfter(line, line.options.find((o) => o.id === answered[line.line])?.effects ?? []);
  }, [idx, lines]);

  if (!def || !line) return null;
  // Skip runs through the lines but halts at the first open answer (its effects must always run); no answer ahead ends the scene
  const skip = () => {
    const to = skipTarget(lines, idx, Object.keys(answered));
    if (to < 0) finish();
    else if (to !== idx) setIdx(to);
  };
  const confirm = (c: Choice, o: ResolvedOption) => {
    onChoose(c.line, o);
    setPicked({ ...picked, [c.line]: o.id });
    setSelected(null);
    if (c.decision) setCard({ title: t(o.summaryKey ?? o.key), lines: consequenceLines(o.effects), go: () => continueAfter(c, o.effects) });
    else continueAfter(c, o.effects);
  };
  const advance = () => {
    if (line.kind === 'choice') return;
    if (shown < text.length) return setShown(text.length);
    setIdx(idx + 1);
  };
  const nameOf = (sp: string) => (sp === 'avatar' ? t('unit.avatar.name') : t(`unit.${sp}.name`));
  const speaking = line.kind === 'line' ? line.speaker : undefined;
  const speakerSide = speaking ? (sides[speaking] ?? 'right') : 'left';
  const choice = line.kind === 'choice' ? (line as Choice) : undefined;
  // the log: spoken lines and the player's own answers, highlighted
  const history = lines.slice(0, idx).filter((l) => l.kind === 'line' || picked[l.line] !== undefined || answered[l.line] !== undefined);
  const pickOf = (c: Choice) => c.options.find((o) => o.id === (picked[c.line] ?? answered[c.line]));
  const question = choice?.decision ? [...lines.slice(0, idx)].reverse().find((l): l is Line => l.kind === 'line') : undefined;
  const teamOf = (sp: string) => speakerTeam(data, sp);

  return (
    <div class={`vn ${overlay ? 'vn--overlay' : ''}`} onClick={advance}>
      {def.background && !overlay && <div class="vn-bg" style={{ backgroundImage: `url(${asset(`backgrounds/${def.background}.webp`)})` }} />}
      <div class="vn-shade" />
      <div class="vn-stage">
        {(['left', 'right'] as const).map((side) => {
          const l = stage[side];
          if (!l?.speaker) return null;
          return (
            <Figure key={side + l.speaker} speaker={l.speaker} mood={l.mood} avatarPortrait={avatarPortrait} side={side} active={!speaking || l.speaker === speaking} halves={halves} />
          );
        })}
      </div>
      <SceneTools seen={wasSeen} auto={auto} onAuto={onAuto} onLog={() => setLog(true)} onSkip={skip} locked={!!choice?.decision} />
      <div class={`vn-box ${choice?.decision ? 'vn-box--decision' : ''}`} onClick={(e) => choice && e.stopPropagation()}>
        {speaking && <span class={`vn-name vn-name--${speakerSide} vn-name--${teamOf(speaking)}`}>{nameOf(speaking)}</span>}
        {choice ? (
          <div class="vn-choices">
            {choice.decision ? (
              <span class="hc-kick vn-kick">
                <i />
                {t('ui.decision.mark')}
              </span>
            ) : (
              <div class="vn-choose">{t('ui.dialogue.choose')}</div>
            )}
            {question && (
              <div class="vn-question">
                {question.speaker && <b>{nameOf(question.speaker)}: </b>}
                {t(question.key)}
              </div>
            )}
            {choice.options.map((c, i) => (
              <button
                key={c.id}
                type="button"
                class={`vn-option ${selected === c.id ? 'is-selected' : ''}`}
                aria-pressed={choice.decision ? selected === c.id : undefined}
                onClick={() => {
                  // a decision takes two taps: the first marks the answer, the second confirms it
                  if (choice.decision && selected !== c.id) return setSelected(c.id);
                  confirm(choice, c);
                }}
              >
                {choice.decision && <span class="vn-option__n">{i + 1}</span>}
                <span class="vn-option__text">{t(c.key)}</span>
                {choice.decision && selected === c.id && <span class="vn-option__confirm">{t('ui.decision.confirm')}</span>}
              </button>
            ))}
          </div>
        ) : (
          <p class={`vn-text ${speaking ? '' : 'vn-text--narration'}`} aria-label={t('ui.dialogue.tap')}>
            {text.slice(0, shown)}
          </p>
        )}
        {!choice && shown >= text.length && (
          <span class="vn-next">
            <Icon name="forward" size={18} />
          </span>
        )}
      </div>
      {card && (
        <ConsequenceCard
          data={data}
          title={card.title}
          lines={card.lines}
          head={head}
          onClose={() => {
            const go = card.go;
            setCard(null);
            go();
          }}
        />
      )}
      {log && (
        <div onClick={(e) => e.stopPropagation()}>
          <Modal title={t('ui.dialogue.log')} onClose={() => setLog(false)}>
            <div class="vn-log">
              {history.length === 0 && <span class="vn-log__empty">{t('ui.dialogue.empty')}</span>}
              {history.map((l) =>
                l.kind === 'line' ? (
                  <div key={l.uid} class="vn-log__line">
                    {l.speaker && <b>{nameOf(l.speaker)}</b>}
                    {t(l.key)}
                  </div>
                ) : (
                  <div key={l.uid} class="vn-log__line vn-log__line--choice">
                    <b>{t('ui.dialogue.yourChoice')}</b>
                    {t(pickOf(l)?.key ?? '')}
                  </div>
                ),
              )}
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
