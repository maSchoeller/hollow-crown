/** Render, legibility, handbook, look and world-map definitions (content/core/render.yaml and friends) as the core sees them. */
import type { GearPiece, Team, TimeOfDay, WeaponGroup, WeaponType, Weather } from './defs';

export interface PropVariant {
  model: string;
  weight: number;
}

/** Look of the board's legibility aids (render.yaml `legibility`, epic 13); lengths in tiles unless named px. */
export interface LegibilityDef {
  /** story 13.1: cream crosses at the tile corners (subtle) or thin lines round every tile (strong) */
  grid: { color: string; subtle: { alpha: number; arm: number; width: number }; strong: { alpha: number; width: number } };
  /** story 13.2: single range tiles with a gap and round corners, and the shared outer edge (cream below the line) */
  range: { gap: number; corner: number; move: { color: string; alpha: number }; attack: { color: string; alpha: number }; heal: { color: string; alpha: number }; cream: string; edge: { cream: number; line: number } };
  /** story 13.2: the path arrow */
  path: { color: string; cream: string; width: number; outline: number; head: number; headLength: number };
  /** story 13.5: danger tiers 1 / 2 / 3+, edge, dashed edge of sleeping foes, edge of one watched foe */
  threat: {
    color: string;
    alpha: [number, number, number];
    edge: { cream: number; line: number };
    sleeping: { color: string; width: number; dash: number; gap: number };
    watch: { color: string; cream: number; line: number };
  };
  /** story 13.6: the foes that reach the chosen field glow in this colour at this strength (0–1) */
  reach: { color: string; strength: number };
  /** story 13.3: HP bar over the head */
  hpBar: { tick: number; tickWide: number; wideFrom: number; critical: number; widthTiles: number; minPx: number; maxPx: number; heightPx: number; lift: number };
  /** story 13.9: the whole-map zoom step */
  view: { wholeMapMargin: number };
  doubleTapMs: number;
}

/** Pictures a handbook entry can show above its values (story 14.1); the UI draws each one from the data. */
export const HANDBOOK_GRAPHICS = ['icon', 'triangle', 'elements', 'terrain', 'class', 'lesson', 'rarity'] as const;
export type HandbookGraphic = (typeof HANDBOOK_GRAPHICS)[number];
/** How the UI writes a resolved value: 15, +15, 15 %, +15 %, ×1.2, a factor as percent change (1.2 → +20 %), a share as percent (0.1 → 10 %). */
export const HANDBOOK_FORMATS = ['plain', 'signed', 'percent', 'signedPercent', 'factor', 'factorPercent', 'share'] as const;
export type HandbookFormat = (typeof HANDBOOK_FORMATS)[number];

/** One number of an entry: a path into the content (`balance.triangle.hit`, `terrain.forest.avoid`), never a typed value. */
export interface HandbookValueDef {
  /** placeholder `{id}` in the entry text; label key `handbook.label.<label ?? id>` */
  id: string;
  ref: string;
  label?: string;
  format: HandbookFormat;
  /** icon in front of the number (symbol + number) */
  icon?: string;
}

/** One handbook entry (`content/core/handbook.yaml`); texts under `handbook.entry.<id>.*` in the locales. */
export interface HandbookEntryDef {
  id: string;
  category: string;
  graphic: HandbookGraphic;
  /** symbol of the `icon` graphic and of the entry in lists */
  icon?: string;
  values: HandbookValueDef[];
  /** cross references (entry ids) */
  see: string[];
  /** context anchor of a "?" in the game (`forecast`, `status.wet`); terrain, class and lesson entries get theirs implicitly */
  anchor?: string;
  /** terrain ids the entry explains (graphic `terrain`); anchors `terrain.<id>` */
  terrain?: string[];
  /** playable class of a profile (graphic `class`); anchor `class.<id>` */
  class?: string;
  /** scene of a lesson whose lines the entry shows (graphic `lesson`); anchor `lesson.<scene>` */
  lesson?: string;
  /** the rule comes with this act (e.g. 2 for the castle rooms of epic 10): the entry says "ab Akt n" */
  fromAct?: number;
}

export interface HandbookCategoryDef {
  id: string;
  icon: string;
}

/** The handbook (epic 14): categories in display order and their entries. */
export interface HandbookDef {
  categories: HandbookCategoryDef[];
  entries: HandbookEntryDef[];
}

/** Presentation values of the battle board (content/render.yaml); never read by the rules. */
export interface RenderDef {
  camera: {
    /** tilt away from straight down, degrees (D2) */
    tiltDeg: number;
    /** share of the free view the map may be pushed past its edge (D10) */
    margin: number;
    /** visible columns on the shorter screen side, near → overview (D9) */
    zoomSteps: number[];
    zoomMs: number;
    /** goal marking: tiles of margin round the marked fields when the camera brings them into view */
    markFrameMargin: number;
  };
  /** pace of the enemy and third-party phases at speed 1x, milliseconds (the speed settings divide it) */
  aiPace: {
    /** one tile of a foe's walk (the player's own units take 140) */
    stepMs: number;
    /** the acting foe pulses this long before it moves or strikes */
    focusMs: number;
    /** pause on the new tile after a foe's walk */
    afterMoveMs: number;
    /** pause after a foe's strike before the next action */
    afterStrikeMs: number;
  };
  board: {
    /** scenery tiles around the map (D10) and how much it is darkened */
    skirt: number;
    skirtDim: number;
    waterLevel: number;
    /** depth of the diorama's bottom below ground level, tiles */
    baseDepth: number;
    /** water animation: ms per texture frame */
    waterFrameMs: number;
    lightsMax: Record<'high' | 'mid' | 'low', number>;
    /** on the low quality level, scenery props only this many tiles around the map */
    sceneryPropsLow: number;
    /** the scenery around the map uses only the first n models of each variant class (every model costs draw calls as a template of its own) */
    sceneryVariants: number;
    /** low decoration on free grass/plain tiles: chance per tile on the map and in the scenery around it, model `<prop>_<state>`, size range */
    decor: Record<'bushes' | 'stones', { model: string; map: number; scenery: number; scale: [number, number] }>;
    /**
     * prop variants (weighted `<prop>_<state>`, chosen by a field hash, see render/shared/scenery.ts): house (building), lodge (visitable
     * house, state appended), rock; tree per act (an act without an entry uses act 1)
     */
    variants: { house: PropVariant[]; lodge: PropVariant[]; rock: PropVariant[]; tree: Record<string, PropVariant[]> };
    /** stand-in model while a model is not built yet (the manifest does not know it) */
    propFallback: Record<string, string>;
    /** goal marking: how long the markings of a side objective stay (ms) */
    markMs: number;
    /** frame rate caps while something moves and at rest */
    fpsActive: number;
    fpsIdle: number;
    /** story 7.7: figures doing nothing update their skeleton this often (Hz); acting ones at the frame rate */
    idleHz: number;
    /** story 7.8: figures with a baked animation file (`.vat`, image-to-3D) play it as vertex animation instead of a skeleton; false: skeleton path for all */
    vat: boolean;
    /** story 7.8: how much the board warms up at load: 0 = precompile only, 1 = + flash/fade variants and prop twins, 2 = + a warm-up draw */
    warm: 0 | 1 | 2;
    /** Story 7.8: tint (flash/fade) materials kept per texture and case for reuse */
    tintPool: number;
    /** story 7.7: the board waits at most this long (ms) for the shaders to compile at load */
    precompileMs: number;
    /** size of 3D figures relative to their Blender scale */
    figureScale: number;
    /** story 8.10: props hiding at least `cover` tiles of a figure turn see-through at `alpha`; `figureWidth` = half width of a figure in tiles */
    fade: { alpha: number; cover: number; figureWidth: number };
  };
  /** story 8.6: team colours, light by time of day, weather, season per act and the timing of the strike effects */
  look: LookDef;
  /** GA9: weapon model per equipped weapon group / off-hand item weapon group, hung on a figure's hand socket */
  gear: { weapons: Partial<Record<WeaponType, GearPiece>>; offHand: Partial<Record<WeaponGroup, GearPiece>> };
  /** epic 13: grid, range tiles, path arrow, danger tiers, target-tile lines, HP bars, whole-map view, double tap */
  legibility: LegibilityDef;
  quality: Record<'high' | 'mid' | 'low', { maxDpr: number; shadowMap: number }>;
  /** shared asset cache of the render host (story 5.1): unused models and textures kept for the next scene */
  assets: { keepUnused: number };
  /** the flat world map (story 5.2): zoom of the picture and the camera glide */
  worldMap: {
    /** width of the picture as a multiple of the screen width: overview, near */
    zoomSteps: number[];
    zoomMs: number;
    /** how much closer the map goes on a chosen place */
    focusZoom: number;
  };
}

/** Light of a time of day or a season: colour, strength and (sun) the direction. */
export interface TimeOfDayDef {
  ambient: { color: string; intensity: number };
  sun: { color: string; intensity: number; azimuthDeg: number; elevationDeg: number };
  /** background colour of the scene (sky beyond the landscape) */
  sky: string;
  /** a figure is never darker than this share of its noon rendering (art-direction §2.5); the landscape may be */
  figureFloor: number;
  /** rim light on figures; strength 0 = off */
  rim: { color: string; strength: number };
  /** factor on the strength of point lights (torches, fires, windows) */
  pointBoost: number;
}

/** Weather: acts it may appear in (content:check), grade of light and sky, and the parts that make it. */
export interface WeatherDef {
  acts: number[];
  /** `ambientScale` multiplies the ambient strength; the sky takes the hue of `sky` at `skyMix`, keeping the brightness of the time of day */
  grade?: { ambientScale: number; sky: string; skyMix: number };
  /** falling particles per quality level (low 0) */
  particles?: { high: number; mid: number; low: number; fallSpeed: number; size: number; length?: number; color: string; alpha: number; emberShare?: number };
  /** wet shine of the ground: specular strength and power of the terrain materials */
  wet?: { specular: number; power: number };
  puddles?: { count: number; alpha: number; color: string };
  /** scene mist (kept on `low`): linear fog from `near` to `far` tiles of depth around the camera target */
  mist?: { color: string; near: number; far: number };
  /** drifting fog layers just above the blocks (not on `low`) */
  ground?: { layers: number; height: number; alpha: number; driftSpeed: number; color: string };
}

export interface LookDef {
  /** marking of the places of a side objective: light ring with a dark outline (unlit, never ember orange nor a team colour) */
  marker: { color: string; outline: string; alpha: number; pulse: number; radius: number; width: number; outlineWidth: number; chevronHeight: number; chevronSize: number; bobTiles: number };
  /** team colours (art-direction §2.1): `ui` = ring and marking colour, `ramp` = cloth dark → light (K0..K3) */
  teams: Record<Team, { ui: string; ramp: [string, string, string, string] }>;
  /** brightness of a figure at noon that the floors of `timeOfDay[..].figureFloor` refer to (share of its albedo) */
  figureReference: number;
  /** grey of the neutral texture under the team cloth of image-to-3D figures (tools/art/prepare_tripo_unit.py) */
  clothGrey: number;
  /** ramp step the cloth key K0..K3 of a figure is drawn in (K2 of image-to-3D figures -> K1, the UI colour) */
  clothSteps: [number, number, number, number];
  timeOfDay: Record<TimeOfDay, TimeOfDayDef>;
  weather: Record<Weather, WeatherDef>;
  /** season per act (art-direction §2.4), above every time of day: tint of light and sky, offset of the sun's height */
  season: Record<string, { tint: string; strength: number; sunElevationOffsetDeg: number }>;
  fx: {
    /** critical hit (story 8.6): times in ms at 1x, counted from the start of the attack */
    crit: { cutInInMs: number; cutInHoldMs: number; cutInOutMs: number; freezeMs: number; shakeMs: number; shake: number; recoilMs: number; returnMs: number; settleMs: number; numberScale: number };
    /** death in ash */
    death: { ashMs: number; fadeMs: number; rise: number; shakeMs: number; shake: number; flakes: Record<'high' | 'mid' | 'low', number>; embers: number; colour: string; emberColour: string };
    /** status icon over a figure: fade in/out ms and the size in CSS px */
    status: { fadeMs: number; sizePx: number; feet: Record<string, string> };
  };
}

/** A place on the flat world map: a stone for a campaign node (or the home) on the painted picture. */
export interface WorldPlace {
  /** slot of the plan: `prologue`, `m1_1` … `m3_8`, `n1` … `n10`, `home` */
  id: string;
  /** short text on the stone: P, 1-1, N1 */
  label: string;
  act: number;
  kind: 'story' | 'side' | 'home';
  /** position in percent of the picture's width and height */
  at: [number, number];
  /** campaign node placed here; a slot without a node is planned for a later act */
  node?: string;
}

/** The flat world map of Valmora (content/world/valmora.yaml, story 5.2). */
export interface WorldDef {
  id: string;
  /** painted picture, `public/assets/world/<image>.webp` */
  image: string;
  /** pixel size of the picture (its aspect ratio) */
  size: [number, number];
  /** regions with the place of their name; the region of a later act than the current one lies under fog */
  regions: Array<{ id: string; act: number; at: [number, number] }>;
  /** the region of `act` ends at `y` percent of the height: the fog of an earlier act reaches down to there */
  fog: Array<{ act: number; y: number }>;
  places: WorldPlace[];
}
