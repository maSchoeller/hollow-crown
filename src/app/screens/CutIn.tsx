/**
 * Cut-in band of a critical hit (story 8.6, art-direction §5.4): a diagonal band slides over the board with the attacker's
 * portrait (mood `angry`, or a letter medallion), speed lines in the element's colour and the name of the attack, holds while
 * the attack winds up and slides out at the hit. The board owns the timing (`critTimeline`); this only draws.
 */
import { useEffect, useState } from 'preact/hooks';
import type { Team } from '../../core';
import { halfUrl } from '../../ui/halfFigure';
import type { CutInPortrait } from '../battle/cutIn';
import './cutin.css';

export interface CutInShown {
  /** changes with every cut-in, so a new one restarts the animation */
  seq: number;
  team: Team;
  name: string;
  portrait: CutInPortrait;
  /** CSS colour of the speed lines */
  line: string;
  inMs: number;
  holdMs: number;
  outMs: number;
}

export function CutIn({ cut, onDone }: { cut: CutInShown; onDone(): void }) {
  const [failed, setFailed] = useState(false);
  const total = cut.inMs + cut.holdMs + cut.outMs;
  useEffect(() => {
    setFailed(false);
    const timer = setTimeout(onDone, total + 60);
    return () => clearTimeout(timer);
  }, [cut.seq]);
  const half = cut.portrait.kind === 'half' && !failed ? cut.portrait.stem : null;
  const initial = cut.portrait.kind === 'medallion' ? cut.portrait.initial : cut.name.slice(0, 1).toUpperCase();
  const style = {
    '--cut-in': `${cut.inMs}ms`,
    '--cut-out': `${cut.outMs}ms`,
    '--cut-out-at': `${cut.inMs + cut.holdMs}ms`,
    '--cut-line': cut.line,
  } as Record<string, string>;
  return (
    <div class={`cutin cutin--${cut.team === 'player' ? 'left' : 'right'}`} style={style} key={cut.seq} aria-hidden="true">
      <div class="cutin__band">
        <div class="cutin__lines" />
        {half ? (
          <img class="cutin__portrait" src={halfUrl(half)} alt="" draggable={false} onError={() => setFailed(true)} />
        ) : (
          <span class="cutin__medallion">{initial}</span>
        )}
        {cut.name && <b class="cutin__name">{cut.name}</b>}
      </div>
    </div>
  );
}
