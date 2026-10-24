import { useEffect, useMemo, useState } from 'preact/hooks';
import { evalConditions, type ConditionContext, type DialogueLine, type Effect, type FlagValue, type GameData } from '../core';
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

type Line = Extract<DialogueLine, { key: string }>;
type Choice = Extract<DialogueLine, { choice: unknown }>;

/** Visual-novel dialogue: background, two portraits, name tag, tap to continue, choices, log, skip (concept/08 §7). */
export function Dialogue({ data, id, ctx, avatarPortrait, overlay, onEffects, onDone, onLine }: DialogueProps) {
  const def = data.dialogues[id];
  const [idx, setIdx] = useState(0);
  const [local, setLocal] = useState<Record<string, FlagValue>>({});
  const [shown, setShown] = useState(0);
  const [log, setLog] = useState(false);
  // answers given in this scene count at once, before the campaign state has caught up
  const now = useMemo(() => ({ ...ctx, flags: { ...ctx.flags, ...local } }), [ctx, local]);
  const lines = def?.lines ?? [];

  // skip lines whose condition does not hold
  const visible = (l: DialogueLine) => {
    return 'choice' in l || evalConditions(now, l.if);
  };
  let cur = idx;
  while (cur < lines.length && !visible(lines[cur]!)) cur++;
  const line = lines[cur];

  useEffect(() => {
    if (!def || cur >= lines.length) onDone();
  }, [cur, def]);

  const text = line && 'key' in line ? t(line.key) : '';
  useEffect(() => {
    setShown(0);
    if (line && 'key' in line) onLine?.(line.speaker, line.mood);
  }, [cur]);
  useEffect(() => {
    if (shown >= text.length) return;
    const id2 = setTimeout(() => setShown((s) => Math.min(text.length, s + 2)), 16);
    return () => clearTimeout(id2);
  }, [shown, text]);

  // speakers on stage: last speaker per side
  const stage = useMemo(() => {
    const st: { left?: Line; right?: Line } = {};
    for (let i = 0; i <= cur && i < lines.length; i++) {
      const l = lines[i]!;
      if ('key' in l && l.speaker && visible(l)) st[l.side === 'left' ? 'left' : 'right'] = l;
    }
    return st;
  }, [cur, now]);

  if (!def || !line) return null;
  const advance = () => {
    if ('choice' in line) return;
    if (shown < text.length) return setShown(text.length);
    setIdx(cur + 1);
  };
  const portraitOf = (sp: string) => (sp === 'avatar' ? avatarPortrait : (data.chars[sp]?.portrait ?? sp));
  const nameOf = (sp: string) => (sp === 'avatar' ? t('unit.avatar.name', {}) : t(`unit.${sp}.name`));
  const speaking = 'key' in line ? line.speaker : undefined;
  const choice = 'choice' in line ? (line as Choice) : undefined;
  const history = lines.slice(0, cur).filter((l): l is Line => 'key' in l && visible(l));

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
            {choice.choice.map((c) => (
              <button
                key={c.key}
                class="btn"
                onClick={() => {
                  if (c.effects?.length) {
                    onEffects(c.effects);
                    const set = c.effects.flatMap((e) => ('setFlag' in e ? [e.setFlag] : []));
                    setLocal((l) => Object.assign({ ...l }, ...set.map((f) => (typeof f === 'string' ? { [f]: true } : f))));
                  }
                  setIdx(cur + 1);
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
                <div key={l.key}>
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
