/** Schemas of the render settings (look, legibility, quality) and the handbook. */
import { z } from 'zod';
import { SEASONS } from '../core/defs';
import { HANDBOOK_FORMATS, HANDBOOK_GRAPHICS } from '../core/renderDefs';
import { slugId, weaponGroup, weaponType } from './schemaBase';

const qualityLevel = z.object({ maxDpr: z.number().positive(), shadowMap: z.number().int().min(0) });
const gearPiece = z.object({ model: z.string().regex(/^[a-z0-9_]+$/), hand: z.enum(['left', 'right']), motion: z.string().regex(/^[a-z]+$/).optional(), hold: z.number().min(-180).max(180).optional() });
const decorSchema = z.object({ model: z.string(), map: z.number().min(0).max(1), scenery: z.number().min(0).max(1), scale: z.tuple([z.number().positive(), z.number().positive()]) });

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const unit = z.number().min(0).max(1);
const teamLook = z.object({ ui: hex, ramp: z.tuple([hex, hex, hex, hex]) });
const timeOfDayDef = z.object({
  ambient: z.object({ color: hex, intensity: z.number().min(0) }),
  sun: z.object({ color: hex, intensity: z.number().min(0), azimuthDeg: z.number(), elevationDeg: z.number().min(1).max(90) }),
  sky: hex,
  figureFloor: unit,
  rim: z.object({ color: hex, strength: unit }),
  pointBoost: z.number().min(0),
});
const count = z.number().int().min(0);
const weatherDef = z.object({
  acts: z.array(z.number().int().min(1)),
  grade: z.object({ ambientScale: z.number().min(0), sky: hex, skyMix: unit }).optional(),
  particles: z
    .object({ high: count, mid: count, low: count, fallSpeed: z.number().positive(), size: z.number().positive(), length: z.number().positive().optional(), color: hex, alpha: unit, emberShare: unit.optional() })
    .optional(),
  wet: z.object({ specular: z.number().min(0), power: z.number().positive() }).optional(),
  puddles: z.object({ count, alpha: unit, color: hex }).optional(),
  mist: z.object({ color: hex, near: z.number(), far: z.number().positive() }).optional(),
  ground: z.object({ layers: count, height: z.number().min(0), alpha: unit, driftSpeed: z.number().min(0), color: hex }).optional(),
});
const ms = z.number().min(0);
// weight 0: the model is only placed by hand (a map's `propVariants`), never by the field hash; at least one entry must be rollable
const propVariantList = z
  .array(z.object({ model: z.string().min(1), weight: z.number().min(0) }))
  .min(1)
  .refine((list) => list.some((e) => e.weight > 0), { message: 'at least one variant needs a weight above 0' });
const lookSchema = z.object({
  teams: z.object({ player: teamLook, enemy: teamLook, other: teamLook }),
  marker: z.object({ color: hex, outline: hex, alpha: unit, pulse: unit, radius: z.number().positive(), width: z.number().positive(), outlineWidth: z.number().min(0), chevronHeight: z.number().min(0), chevronSize: z.number().positive(), bobTiles: z.number().min(0) }),
  figureReference: z.number().positive(),
  clothGrey: z.number().positive().max(1),
  clothSteps: z.tuple([z.number().int().min(0).max(3), z.number().int().min(0).max(3), z.number().int().min(0).max(3), z.number().int().min(0).max(3)]),
  timeOfDay: z.object({ morning: timeOfDayDef, noon: timeOfDayDef, evening: timeOfDayDef, night: timeOfDayDef, indoor: timeOfDayDef }),
  weather: z.object({ clear: weatherDef, rain: weatherDef, fog: weatherDef, ash: weatherDef, snow: weatherDef }),
  season: z.partialRecord(z.enum(SEASONS), z.object({ tint: hex, strength: unit, sunElevationOffsetDeg: z.number() })),
  fx: z.object({
    crit: z.object({ cutInInMs: ms, cutInHoldMs: ms, cutInOutMs: ms, freezeMs: ms, shakeMs: ms, shake: z.number().min(0), recoilMs: ms, returnMs: ms, settleMs: ms, numberScale: z.number().positive() }),
    death: z.object({ ashMs: ms, fadeMs: ms, rise: z.number().min(0), shakeMs: ms, shake: z.number().min(0), flakes: z.object({ high: count, mid: count, low: count }), embers: count, colour: hex, emberColour: hex }),
    status: z.object({ fadeMs: ms, sizePx: z.number().positive(), feet: z.record(z.string(), z.string()) }),
  }),
});

const tint = z.object({ color: hex, alpha: unit });
const legibilitySchema = z.object({
  grid: z.object({ color: hex, seasonColor: z.partialRecord(z.enum(SEASONS), hex).optional(), subtle: z.object({ alpha: unit, arm: z.number().positive(), width: z.number().positive() }), strong: z.object({ alpha: unit, width: z.number().positive() }) }),
  range: z.object({ gap: z.number().min(0), corner: z.number().min(0), move: tint, attack: tint, heal: tint, cream: hex, edge: z.object({ cream: z.number().min(0), line: z.number().min(0) }) }),
  path: z.object({ color: hex, cream: hex, width: z.number().positive(), outline: z.number().min(0), head: z.number().positive(), headLength: z.number().positive() }),
  threat: z.object({
    color: hex,
    alpha: z.tuple([unit, unit, unit]),
    edge: z.object({ cream: z.number().min(0), line: z.number().min(0) }),
    sleeping: z.object({ color: hex, width: z.number().positive(), dash: z.number().positive(), gap: z.number().positive() }),
    watch: z.object({ color: hex, cream: z.number().min(0), line: z.number().min(0) }),
  }),
  reach: z.object({ color: hex, strength: unit }),
  terrainWarn: z.object({ color: hex, alpha: unit, pulse: unit }),
  hpBar: z.object({ tick: z.number().int().positive(), tickWide: z.number().int().positive(), wideFrom: z.number().int().positive(), critical: unit, widthTiles: z.number().positive(), minPx: z.number().positive(), maxPx: z.number().positive(), heightPx: z.number().positive(), lift: z.number().min(0) }),
  view: z.object({ wholeMapMargin: z.number().min(0) }),
  doubleTapMs: ms,
});

export const renderSchema = z.object({
  camera: z.object({
    tiltDeg: z.number().min(0).max(80),
    margin: z.number().min(0).max(1),
    zoomSteps: z.array(z.number().positive()).min(1),
    zoomMs: z.number().min(0),
    markFrameMargin: z.number().min(0),
  }),
  aiPace: z.object({ stepMs: ms, focusMs: ms, afterMoveMs: ms, afterStrikeMs: ms, marchMin: z.number().int().min(2), phaseBannerMs: ms, phaseBudgetMs: z.number().positive(), maxBoost: z.number().min(1),
    play: z.object({ glide: ms, hit: ms, recoil: ms, lungeBack: ms, playerStrikePause: ms, ownStep: ms, damage: ms, heal: ms, downed: ms, bleed: ms, knockback: ms, terrain: ms, rally: ms, spawn: ms, vanish: ms }) }),
  board: z.object({
    skirt: z.number().int().min(0),
    skirtDim: z.number().min(0).max(1),
    waterLevel: z.number(),
    levelHeight: z.number().min(0),
    baseDepth: z.number().positive(),
    waterFrameMs: z.number().positive(),
    lightsMax: z.object({ high: z.number().int().min(0), mid: z.number().int().min(0), low: z.number().int().min(0) }),
    figureScale: z.number().positive(),
    fade: z.object({ alpha: z.number().min(0).max(1), cover: z.number().min(0), figureWidth: z.number().min(0), solid: z.array(z.string()) }),
    connectors: z.record(
      z.enum(['ramp', 'stairs', 'ladder']),
      z.object({ from: z.number().min(0).max(1), to: z.number().min(0).max(1), steps: z.number().int().min(0) }).refine((c) => c.to > c.from, 'to must lie past from'),
    ),
    fpsActive: z.number().positive(),
    fpsIdle: z.number().positive(),
    idleHz: z.number().positive(),
    vat: z.boolean(),
    warm: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    tintPool: z.number().int().nonnegative(),
    precompileMs: z.number().int().min(0),
    sceneryPropsLow: z.number().int().min(0),
    sceneryVariants: z.number().int().min(1),
    variants: z.object({
      house: propVariantList,
      lodge: propVariantList,
      rock: propVariantList,
      field: propVariantList,
      relief: propVariantList,
      stall: propVariantList,
      sarcophagus: propVariantList,
      tree: z.partialRecord(z.enum(SEASONS), propVariantList),
      sceneryTree: z.partialRecord(z.enum(SEASONS), propVariantList),
    }),
    actSeason: z.record(z.string().regex(/^\d+$/), z.enum(SEASONS)),
    seasonGround: z.partialRecord(z.enum(SEASONS), z.record(z.string(), slugId)),
    seasonModels: z.partialRecord(z.enum(SEASONS), z.record(z.string(), slugId)),
    snow: z.object({
      winter: z.object({ color: hex, from: z.number().min(0).max(1), to: z.number().min(0).max(1), ragged: z.number().min(0).max(1), scale: z.number().positive(), cover: z.number().min(0).max(1) }).refine((s) => s.to > s.from, 'to must lie above from'),
      skip: z.array(z.string()),
    }),
    propFallback: z.record(z.string(), z.string()),
    markMs: z.number().int().min(0),
    decor: z.object({ bushes: decorSchema, stones: decorSchema }),
    decorOn: z.record(z.string(), z.array(decorSchema)),
  }),
  look: lookSchema,
  gear: z.object({
    weapons: z.partialRecord(weaponType, gearPiece),
    offHand: z.partialRecord(weaponGroup, gearPiece),
  }),
  legibility: legibilitySchema,
  quality: z.object({ high: qualityLevel, mid: qualityLevel, low: qualityLevel }),
  assets: z.object({ keepUnused: z.number().int().min(0) }),
  worldMap: z.object({
    zoomSteps: z.array(z.number().positive()).length(2),
    zoomMs: z.number().min(0),
    focusZoom: z.number().positive(),
    fog: z.object({ px: z.number().int().min(16).max(1024), blur: z.number().int().min(0).max(16), alpha: z.number().min(0).max(1) }),
  }),
});

/** Handbook (epic 14, story 14.1): categories in display order; entries with values as content paths, never numbers. */
const handbookId = z.string().regex(/^[a-z][a-z0-9_]*$/);
export const handbookSchema = z.strictObject({
  categories: z.array(z.strictObject({ id: handbookId, icon: z.string().min(1) })).min(1),
  entries: z.array(
    z.strictObject({
      id: handbookId,
      category: handbookId,
      graphic: z.enum(HANDBOOK_GRAPHICS).default('icon'),
      icon: z.string().min(1).optional(),
      values: z
        .array(
          z.strictObject({
            id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
            ref: z.string().regex(/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/),
            label: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/).optional(),
            format: z.enum(HANDBOOK_FORMATS).default('plain'),
            icon: z.string().min(1).optional(),
          }),
        )
        .default([]),
      see: z.array(handbookId).default([]),
      anchor: z.string().regex(/^[a-z][a-zA-Z0-9_.]*$/).optional(),
      terrain: z.array(z.string()).min(1).optional(),
      class: z.string().optional(),
      lesson: z.string().optional(),
      fromAct: z.number().int().min(2).optional(),
    }),
  ),
});
