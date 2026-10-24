import { useEffect, useMemo, useState } from 'preact/hooks';
import { resolveScene, skipTarget, speakerTeam, type ConditionContext, type Effect, type FlagValue, type GameData, type ResolvedLine } from '../core';
import { t } from '../i18n';
import { asset, Modal } from './components';
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
  onEffects: (effects: Effect[]) => void;
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
export function Dialogue({ data, id, ctx, avatarPortrait, overlay, seen = false, auto, onAuto, halves, onEffects, onDone, onSeen, onLine }: DialogueProps) {
  const def = data.scenes[id];
  const cfg = data.balance.scene;
  const [idx, setIdx] = useState(0);
  const [local, setLocal] = useState<Record<string, FlagValue>>({});
  const [shown, setShown] = useState(0);
  const [log, setLog] = useState(false);
  const [wasSeen] = useState(seen);
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

  if (!def || !line) return null;
  // Skip runs through the lines but halts at the first answer (its effects must always run); no answer ahead ends the scene
  const skip = () => {
    const to = skipTarget(lines, idx);
    if (to < 0) finish();
    else if (to !== idx) setIdx(to);
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
  const history = lines.slice(0, idx).filter((l): l is Line => l.kind === 'line');
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
      <SceneTools seen={wasSeen} auto={auto} onAuto={onAuto} onLog={() => setLog(true)} onSkip={skip} />
      <div class="vn-box" onClick={(e) => choice && e.stopPropagation()}>
        {speaking && <span class={`vn-name vn-name--${speakerSide} vn-name--${teamOf(speaking)}`}>{nameOf(speaking)}</span>}
        {choice ? (
          <div class="vn-choices">
            <div class="vn-choose">{t('ui.dialogue.choose')}</div>
            {choice.options.map((c) => (
              <button
                key={c.id}
                type="button"
                class="vn-option"
                onClick={() => {
                  if (c.effects.length) {
                    onEffects(c.effects);
                    // the scene goes on after this choice, resolved with the flags the answer just set
                    const next = { ...local, ...setFlags(c.effects) };
                    setLocal(next);
                    const after = resolveScene(data, { ...ctx, flags: { ...ctx.flags, ...next } }, id);
                    return setIdx(after.findIndex((l) => l.uid === choice.uid) + 1);
                  }
                  setIdx(idx + 1);
                }}
              >
                {t(c.key)}
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
      {log && (
        <div onClick={(e) => e.stopPropagation()}>
          <Modal title={t('ui.dialogue.log')} onClose={() => setLog(false)}>
            <div class="vn-log">
              {history.length === 0 && <span class="vn-log__empty">{t('ui.dialogue.empty')}</span>}
              {history.map((l) => (
                <div key={l.uid} class="vn-log__line">
                  {l.speaker && <b>{nameOf(l.speaker)}</b>}
                  {t(l.key)}
                </div>
              ))}
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
