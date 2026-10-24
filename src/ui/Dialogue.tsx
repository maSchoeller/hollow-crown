import { useEffect, useMemo, useState } from 'preact/hooks';
import { resolveScene, type ConditionContext, type Effect, type FlagValue, type GameData, type ResolvedLine } from '../core';
import { t } from '../i18n';
import { asset, Modal } from './components';
import { Icon } from './icons';

const ENEMIES = new Set(['grosk', 'hask', 'morra']);
const OTHERS = new Set(['liora']);

export interface DialogueProps {
  data: GameData;
  id: string;
  ctx: ConditionContext;
  avatarPortrait: string;
  overlay?: boolean;
  onEffects: (effects: Effect[]) => void;
  onDone: () => void;
  onLine?: (speaker?: string, mood?: string) => void;
}

type Line = Extract<ResolvedLine, { kind: 'line' }>;
type Choice = Extract<ResolvedLine, { kind: 'choice' }>;

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

/** Visual-novel dialogue: background, two portraits, name tag, tap to continue, choices, log, skip (concept/08 §7). */
export function Dialogue({ data, id, ctx, avatarPortrait, overlay, onEffects, onDone, onLine }: DialogueProps) {
  const def = data.scenes[id];
  const [idx, setIdx] = useState(0);
  const [local, setLocal] = useState<Record<string, FlagValue>>({});
  const [shown, setShown] = useState(0);
  const [log, setLog] = useState(false);
  // answers given in this scene count at once, before the campaign state has caught up
  const now = useMemo(() => ({ ...ctx, flags: { ...ctx.flags, ...local } }), [ctx, local]);
  const lines = useMemo(() => (def ? resolveScene(data, now, id) : []), [data, now, id]);
  const line = lines[idx];

  useEffect(() => {
    if (!def || idx >= lines.length) onDone();
  }, [idx, def]);

  const text = line?.kind === 'line' ? t(line.key) : '';
  useEffect(() => {
    setShown(0);
    if (line?.kind === 'line') onLine?.(line.speaker, line.mood);
  }, [idx]);
  useEffect(() => {
    if (shown >= text.length) return;
    const id2 = setTimeout(() => setShown((s) => Math.min(text.length, s + 2)), 16);
    return () => clearTimeout(id2);
  }, [shown, text]);

  // sides follow the order of first appearance: kael and the avatar left, the others right (then left)
  const sides = useMemo(() => {
    const m: Record<string, 'left' | 'right'> = {};
    for (const l of lines) {
      if (l.kind !== 'line' || !l.speaker || m[l.speaker]) continue;
      const taken = new Set(Object.values(m));
      m[l.speaker] = l.speaker === 'kael' || l.speaker === 'avatar' ? 'left' : !taken.has('right') ? 'right' : !taken.has('left') ? 'left' : 'right';
    }
    return m;
  }, [lines]);
  // speakers on stage: last speaker per side
  const stage = useMemo(() => {
    const st: { left?: Line; right?: Line } = {};
    for (let i = 0; i <= idx && i < lines.length; i++) {
      const l = lines[i]!;
      if (l.kind === 'line' && l.speaker) st[sides[l.speaker] ?? 'right'] = l;
    }
    return st;
  }, [idx, lines, sides]);

  if (!def || !line) return null;
  const advance = () => {
    if (line.kind === 'choice') return;
    if (shown < text.length) return setShown(text.length);
    setIdx(idx + 1);
  };
  const portraitOf = (sp: string) => (sp === 'avatar' ? avatarPortrait : (data.chars[sp]?.portrait ?? sp));
  const nameOf = (sp: string) => (sp === 'avatar' ? t('unit.avatar.name', {}) : t(`unit.${sp}.name`));
  const speaking = line.kind === 'line' ? line.speaker : undefined;
  const choice = line.kind === 'choice' ? (line as Choice) : undefined;
  const history = lines.slice(0, idx).filter((l): l is Line => l.kind === 'line');

  return (
    <div class={`vn ${overlay ? 'overlay' : ''}`} onClick={advance}>
      {def.background && !overlay && <div class="vn-bg" style={{ backgroundImage: `url(${asset(`backgrounds/${def.background}.webp`)})` }} />}
      <div class="vn-stage">
        {(['left', 'right'] as const).map((side) => {
          const l = stage[side];
          if (!l?.speaker) return null;
          return (
            <div key={side + l.speaker} class={`vn-char ${side} ${speaking && l.speaker !== speaking ? 'dim' : ''}`}>
              <img src={asset(`portraits/${portraitOf(l.speaker)}/neutral.webp`)} alt="" draggable={false} onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
            </div>
          );
        })}
      </div>
      <div class="vn-tools" onClick={(e) => e.stopPropagation()}>
        <button class="btn small ghost" onClick={() => setLog(true)}>
          {t('ui.dialogue.log')}
        </button>
        <button class="btn small ghost" onClick={onDone}>
          {t('ui.dialogue.skip')}
          <Icon name="skip" size={16} />
        </button>
      </div>
      <div class="vn-box" onClick={(e) => choice && e.stopPropagation()}>
        {speaking && (
          <div class={`vn-name ${ENEMIES.has(speaking) ? 'enemy' : OTHERS.has(speaking) ? 'other' : ''}`}>{speaking === 'avatar' ? t('unit.avatar.name') : nameOf(speaking)}</div>
        )}
        {choice ? (
          <div class="vn-choices">
            <div class="muted">{t('ui.dialogue.choose')}</div>
            {choice.options.map((c) => (
              <button
                key={c.id}
                class="btn"
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
          <div class={speaking ? '' : 'vn-narration'}>{text.slice(0, shown)}</div>
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
            <div class="col">
              {history.map((l) => (
                <div key={l.uid}>
                  {l.speaker && <b class="gold">{nameOf(l.speaker)}: </b>}
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
