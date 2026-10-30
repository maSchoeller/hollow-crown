/**
 * Line icon set for actions, roles and navigation (U21: no emoji). Items are painted images (ItemImage in pieces.tsx). 24×24, stroke = currentColor, so icons take the text colour.
 * Shapes are deliberately simple; the pixel board keeps its own sprites.
 */
import type { Element } from '../core';

const P: Record<string, string> = {
  // navigation & system
  menu: 'M4 7h16M4 12h16M4 17h10',
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 7.5h.01',
  check: 'M5 12l5 5 9-10',
  cross: 'M7 7l10 10M17 7L7 17',
  plus: 'M12 5v14M5 12h14',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',
  home: 'M4 11l8-7 8 7M6 10v10h12V10',
  restart: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  rewind: 'M11 7l-6 5 6 5zM19 7l-6 5 6 5z',
  skip: 'M5 6l7 6-7 6zM13 6l7 6-7 6z',
  log: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h4',
  box: 'M4 7h16v13H4zM4 7l2-3h12l2 3M10 11h4',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  map: 'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2zM9 4v14M15 6v14',
  // battle actions
  attack: 'M4 20l6-6M7 13l4 4M10 14L20 4v-.5h-.5L9.5 13.5',
  item: 'M9 3h6M10 3v5l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3',
  trade: 'M4 8h13l-3-3M20 16H7l3 3',
  wait: 'M6 3h12M6 21h12M7 3c0 5 10 6 10 9s-10 4-10 9M17 3c0 5-10 6-10 9s10 4 10 9',
  talk: 'M4 5h16v10H10l-4 4v-4H4z',
  visit: 'M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5',
  chest: 'M4 9h16v10H4zM4 9l2-4h12l2 4M11 12h2v3h-2z',
  door: 'M6 21V4h12v17M4 21h16M14 12h.01',
  staff: 'M7 21L17 7M15 3l4 4M16 4l-2 4 3 1',
  rescue: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  seize: 'M6 21V4M6 5h11l-2 4 2 4H6',
  escape: 'M14 4h5v16h-5M4 12h11M11 8l4 4-4 4',
  // a lieutenant at 0 HP flees (story 3.2): the forecast shows this instead of 0
  flee: 'M14 4h5v16h-5M4 12h11M11 8l4 4-4 4',
  rally: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z',
  command: 'M5 12l4-4M5 12l4 4M5 12h9a5 5 0 0 1 5 5v1',
  // class actions (story 2.3): reuse target / rescue / rally until dedicated glyphs exist
  aim: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v4M12 18v4M2 12h4M18 12h4',
  // Wirken: the role symbol of the elementalist (same glyph as `fire`)
  cast: 'M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 3 1.5 4 3 4 0-3-1.5-6 0-9z',
  // Stehlen: the role symbol of the scout (a purse)
  steal: 'M9 4h6l-1.5 3h-3zM9.5 7C6 10 4.5 13 4.5 16a3.5 3.5 0 0 0 3.5 3.5h8a3.5 3.5 0 0 0 3.5-3.5c0-3-1.5-6-5-9M12 11v5M10.5 12.5h2.5a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2H14',
  farRescue: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  cheer: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z',
  convoy: 'M3 8h12v9H3zM15 11h4l2 3v3h-6M7 20a2 2 0 1 0 0-.1M17 20a2 2 0 1 0 0-.1',
  wanted: 'M5 3h14v18H5zM12 7.5a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4zM8 17h8',
  swap: 'M7 4L4 7l3 3M4 7h13M17 14l3 3-3 3M20 17H7',
  // roles (class-action slot of the battle dock)
  avoid: 'M4 18c5 0 6-11 11-11h5M17 4l3 3-3 3',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  blade: 'M12 2.5l2.5 3.5v8h-5V6zM6.5 14h11M12 14v5.5M10 21h4',
  bow: 'M6 3c8 3 8 15 0 18M6 3v18M4 12h16M17 9l3 3-3 3',
  danger: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v4M12 18v4M2 12h4M18 12h4',
  next: 'M5 12h12M13 6l6 6-6 6',
  end: 'M6 5l7 7-7 7M13 5l7 7-7 7',
  ai: 'M9 4h6v3h3v6h-3v3H9v-3H6V7h3zM10 10h.01M14 10h.01',
  // camp
  camp: 'M3 20L12 4l9 16zM12 4v16M9 20l3-5 3 5',
  company: 'M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM17 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 19c1-4 4-6 6-6s5 2 6 6M15 14c3 0 5 2 6 5',
  merchant: 'M4 9h16l-1.5 11h-13zM8 9V6a4 4 0 0 1 8 0v3',
  smith: 'M3 10h12l3-3h3v4l-3 1v2H8l-2 3H3z',
  enchanter: 'M12 3l3 6-3 12-3-12zM6 9h12',
  healer: 'M12 4v16M4 12h16',
  tavern: 'M5 6h11v13H5zM16 9h2.5a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H16M8 9v7M12 9v7',
  campfire: 'M12 4c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-2-1-4 0-7zM5 20l14-3M5 17l14 3',
  bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  gold: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z',
  star: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z',
  scar: 'M5 19L19 5M8 9l2 2M12 13l2 2M10 7l2 2M14 11l2 2',
  fallen: 'M12 3v18M7 8h10',
  // the castle of the home (act pill, world map) and the memorial stone (memorial hall), after mockup 04
  castle: 'M4 21V8h3V5h3v3h4V5h3v3h3v13zM10 21v-5h4v5',
  stone: 'M6 21V10a6 6 0 0 1 12 0v11zM4 21h16M12 9v6M9.5 11.5h5',
  // elements
  fire: 'M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 3 1.5 4 3 4 0-3-1.5-6 0-9z',
  wind: 'M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7',
  earth: 'M3 19l6-10 4 6 3-4 5 8z',
  water: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z',
  light: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  dark: 'M15 3a9 9 0 1 0 6 13A7 7 0 0 1 15 3z',
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 20, class: cls = '', label }: { name: IconName | string; size?: number; class?: string; label?: string }) {
  const d = P[name] ?? P.star!;
  return (
    <svg
      class={`icon ${cls}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <path d={d} />
    </svg>
  );
}

/** Weapon-triangle marker: filled triangle up (advantage) or down (disadvantage). */
export function TriMark({ v, label }: { v: number; label?: string }) {
  if (!v) return null;
  return (
    <svg class={`tri ${v > 0 ? 'adv' : 'dis'}`} width="11" height="11" viewBox="0 0 12 12" role="img" aria-label={label}>
      <path d={v > 0 ? 'M6 1l5 9H1z' : 'M6 11L1 2h10z'} fill="currentColor" />
    </svg>
  );
}

export function ElementIcon({ el, size = 16 }: { el: Element; size?: number }) {
  return <Icon name={el} size={size} class={`el-${el}`} />;
}
