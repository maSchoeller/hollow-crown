/** Round head and half figure of a company member (art/mockups/characters-s1, built by `pnpm art:build`). */
import { useEffect, useState } from 'preact/hooks';
import { asset } from '../../ui/asset';
import { avatarHead } from '../campaignInfo';
import { data } from '../state/session';
import '../../ui/troop.css';

/**
 * Id of the character image: the avatar maps to its look, everyone else to the unit id; units without their own picture
 * (generic enemies, tavern mercenaries) show the portrait of their class (class_<art of the class>, art/mockups/characters-s1).
 */
export const artId = (portrait?: string, classId?: string): string | undefined =>
  portrait ? (portrait.startsWith('avatar_') ? avatarHead(portrait) : portrait) : classId ? `class_${data.classes[classId]?.art ?? classId}` : undefined;

function Img({ dir, id, name, class: cls }: { dir: 'avatars' | 'busts'; id?: string; name: string; class: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [id]);
  if (!id || failed) return <span class={`${cls} ${cls}--initial`}>{name.slice(0, 1)}</span>;
  return <img class={cls} src={asset(`${dir}/${id}.webp`)} alt="" draggable={false} onError={() => setFailed(true)} />;
}

/** Round head; `size` is the edge length in px. */
export function UnitHead({ portrait, classId, name, size = 44 }: { portrait?: string; classId?: string; name: string; size?: number }) {
  return (
    <span class="trp-head" style={{ '--trp-head-size': `${size}px` }}>
      <Img dir="avatars" id={artId(portrait, classId)} name={name} class="trp-head__img" />
    </span>
  );
}

/** Half figure for the figure view. */
export function UnitBust({ portrait, classId, name }: { portrait?: string; classId?: string; name: string }) {
  return <Img dir="busts" id={artId(portrait, classId)} name={name} class="trp-bust" />;
}
