/**
 * Story 16.6: the glow of the rune weapons on a figure (Art Direction §4.7). The weapon file `weapons-v2/<model>.glb` brings the
 * metal (vertex colours), the channel `rune_channel` (UV1 `fill`, 0 at the socket, 1 at the far end), empty nodes `socket_rune_a*`
 * (main setting, one per blade face) and `socket_rune_b` (small setting) and the mesh `rune_socket2` (the small setting itself);
 * the stone `runes-v2/<runeId>.glb` (parts rune_stone, rune_symbol, rune_gold, rune_core) hangs on the nodes.
 *
 * The materials are shared per (element, tier, part, state) by all figures of a scene; a figure only swaps the materials of its
 * glow meshes when its state changes (dim on the board, full for the chosen figure and the forecast's attacker and target).
 * Tier III pulses: one value per material and frame, driven by a single observer of the scene.
 */
import type { Scene } from '@babylonjs/core/scene';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { GearRunes, RuneLook } from '../../core';
import type { RuneGlowDef } from '../../core/renderDefs';
import { fillThreshold, glowPartOf, glowStrength, hexRgb, lighten, pulseFactor, runeColour, tintMetal, type GlowPart, type GlowState, type Rgb } from './runeLook';

/** Width of the channel's ramp texture (texels along `fill`). */
const RAMP_WIDTH = 64;

interface Cache {
  mats: Map<string, StandardMaterial>;
  /** the tier III materials' pulse: key → sets the factor 0-1 of the strength */
  pulses: Map<string, (factor: number) => void>;
  observer: Observer<Scene> | null;
}

// per asset store (its `materials` map is the key): the scene's rune materials go with the store
const caches = new WeakMap<object, Cache>();

function cacheOf(owner: object): Cache {
  let c = caches.get(owner);
  if (!c) caches.set(owner, (c = { mats: new Map(), pulses: new Map(), observer: null }));
  return c;
}

function startPulse(c: Cache, scene: Scene, def: RuneGlowDef): void {
  if (c.observer) return;
  c.observer = scene.onBeforeRenderObservable.add(() => {
    const f = pulseFactor(def, performance.now());
    for (const set of c.pulses.values()) set(f);
  });
}

function register(c: Cache, scene: Scene, def: RuneGlowDef, key: string, m: StandardMaterial, pulse?: (factor: number) => void): StandardMaterial {
  c.mats.set(key, m);
  if (pulse) {
    c.pulses.set(key, pulse);
    startPulse(c, scene, def);
  }
  m.onDisposeObservable.addOnce(() => {
    c.mats.delete(key);
    c.pulses.delete(key);
    if (!c.pulses.size && c.observer) {
      scene.onBeforeRenderObservable.remove(c.observer);
      c.observer = null;
    }
  });
  return m;
}

function baseMaterial(name: string, scene: Scene): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.Black();
  m.specularColor = Color3.Black();
  m.emissiveColor = Color3.Black();
  m.backFaceCulling = false;
  return m;
}

/** The ramp along `fill`: the element colour up to the tier's threshold, the dark rest (`floor`) beyond it. */
export function rampData(def: RuneGlowDef, colour: Rgb, strength: number, tier: number): Uint8Array {
  const thr = fillThreshold(def, tier);
  const data = new Uint8Array(RAMP_WIDTH * 4);
  for (let i = 0; i < RAMP_WIDTH; i++) {
    const u = (i + 0.5) / RAMP_WIDTH;
    const lit = thr >= 1 ? 1 : Math.min(1, Math.max(0, (thr - u) / def.edge));
    const v = (def.floor + (1 - def.floor) * lit) * strength;
    data.set([colour[0] * v * 255, colour[1] * v * 255, colour[2] * v * 255, 255], i * 4);
  }
  return data;
}

/** The channel's material: the lit part of the element colour on UV1 `fill`, a dark floor without a rune. */
function channelMaterial(owner: object, scene: Scene, def: RuneGlowDef, rune: RuneLook | null, state: GlowState): StandardMaterial {
  const c = cacheOf(owner);
  const lit = rune && rune.element !== 'utility' ? rune : null;
  const key = lit ? `rune:channel:${lit.element}:${lit.tier}:${state}` : 'rune:channel:empty';
  const have = c.mats.get(key);
  if (have) return have;
  const m = baseMaterial(key, scene);
  if (!lit) {
    m.emissiveColor = Color3.FromArray(hexRgb(def.empty));
    return register(c, scene, def, key, m);
  }
  const strength = glowStrength(def, state);
  const tex = RawTexture.CreateRGBATexture(rampData(def, runeColour(def, lit), strength, lit.tier), RAMP_WIDTH, 1, scene, false, false, Texture.BILINEAR_SAMPLINGMODE);
  tex.wrapU = Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = Texture.CLAMP_ADDRESSMODE;
  tex.coordinatesIndex = 1;
  m.emissiveTexture = tex;
  m.onDisposeObservable.addOnce(() => tex.dispose());
  return register(c, scene, def, key, m, lit.tier === 3 ? (f) => (tex.level = f) : undefined);
}

/** A part of a stone: the body lit (so its facets show) and a little self-lit, symbol and core glowing, the gold fixed. */
function stoneMaterial(owner: object, scene: Scene, def: RuneGlowDef, rune: RuneLook, part: GlowPart, state: GlowState): StandardMaterial {
  const c = cacheOf(owner);
  const key = `rune:${part}:${rune.element}:${rune.tier}:${state}`;
  const have = c.mats.get(key);
  if (have) return have;
  const m = baseMaterial(key, scene);
  const strength = glowStrength(def, state);
  const colour = runeColour(def, rune);
  const { body, symbolLift, coreLift, selfLit } = def.stone;
  let emissive: Rgb;
  let pulses = rune.tier === 3;
  if (part === 'symbol' || part === 'core') {
    emissive = lighten(colour, part === 'symbol' ? symbolLift : coreLift).map((v) => v * strength) as unknown as Rgb;
  } else if (part === 'gold') {
    const g = hexRgb(def.gold);
    m.diffuseColor = Color3.FromArray(g);
    m.specularColor = new Color3(0.3, 0.3, 0.3);
    emissive = g.map((v) => v * def.state.dim * selfLit) as unknown as Rgb;
    pulses = false;
  } else {
    m.diffuseColor = Color3.FromArray(colour.map((v) => v * body));
    m.specularColor = new Color3(0.12, 0.12, 0.12);
    emissive = colour.map((v) => v * body * selfLit * strength) as unknown as Rgb;
    pulses = false;
  }
  m.emissiveColor = Color3.FromArray(emissive);
  const e = emissive;
  return register(c, scene, def, key, m, pulses ? (f) => m.emissiveColor.set(e[0] * f, e[1] * f, e[2] * f) : undefined);
}

/** A glow mesh of a figure: which part it is and which rune it shows (the channel: the main rune of the weapon). */
interface GlowMesh {
  mesh: Mesh;
  part: GlowPart;
  rune: RuneLook | null;
}

/** What the figure's weapon pieces handed over: the glow meshes of all its rune weapons. Swaps their materials by state. */
export class RuneKit {
  private meshes: GlowMesh[] = [];
  private state: GlowState = 'dim';
  private alpha = 1;

  constructor(
    private owner: object,
    private scene: Scene,
    private def: RuneGlowDef,
  ) {}

  add(g: GlowMesh): void {
    this.meshes.push(g);
    this.apply(g);
  }

  get size(): number {
    return this.meshes.length;
  }

  private apply(g: GlowMesh): void {
    g.mesh.material = g.part === 'channel' ? channelMaterial(this.owner, this.scene, this.def, g.rune, this.state) : g.rune ? stoneMaterial(this.owner, this.scene, this.def, g.rune, g.part, this.state) : null;
    g.mesh.visibility = this.alpha;
  }

  setState(state: GlowState): void {
    if (state === this.state) return;
    this.state = state;
    for (const g of this.meshes) this.apply(g);
  }

  /** The figure fades (death, ghost): its rune parts fade with it. */
  setAlpha(alpha: number): void {
    if (alpha === this.alpha) return;
    this.alpha = alpha;
    for (const g of this.meshes) g.mesh.visibility = alpha;
  }
}

/** Loads a stone's file and hangs its parts on `socket`; resolves the meshes (undefined: no such stone file). */
export type StoneLoader = (runeId: string, socket: TransformNode, tag: string) => Promise<Mesh[] | undefined>;

/** Rewrites the grey (metal) vertex colours of a weapon mesh by the metal; the mesh owns its geometry (`makeGeometryUnique`). */
export function tintMetalMesh(mesh: Mesh, runes: GearRunes, def: RuneGlowDef): void {
  const src = mesh.getVerticesData(VertexBuffer.ColorKind);
  if (!src) return;
  const out = new Float32Array(src);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3]! < 0.99) continue;
    const c = tintMetal([out[i]!, out[i + 1]!, out[i + 2]!], runes.metal, def);
    out[i] = c[0];
    out[i + 1] = c[1];
    out[i + 2] = c[2];
  }
  mesh.setVerticesData(VertexBuffer.ColorKind, out, false, 4);
}

/**
 * Dresses a rune weapon that `attachGear` instantiated below `grip`: hides the placeholder stone and an unused small setting,
 * gives the channel its material, tints the metal and hangs the stones on the setting nodes. Returns the meshes that stay normal
 * weapon meshes (they wear the figure's shared material and take the cloth tint).
 */
export async function dressRuneWeapon(kit: RuneKit, def: RuneGlowDef, runes: GearRunes, grip: TransformNode, meshes: Mesh[], load: StoneLoader): Promise<Mesh[]> {
  const metal: Mesh[] = [];
  for (const m of meshes) {
    const part = glowPartOf(m.name);
    if (part === 'channel') kit.add({ mesh: m, part, rune: runes.main });
    else if (part) m.dispose(); // the placeholder dome of the old weapon files: the stone comes from runes-v2
    else if (/(^|:)rune_socket2\b/.test(m.name) && !runes.smallSlot) m.dispose();
    else metal.push(m);
  }
  for (const m of metal) if (m.isVerticesDataPresent(VertexBuffer.ColorKind)) tintMetalMesh(m, runes, def);
  const nodes = grip.getDescendants(false).filter((n) => /:socket_rune_[ab]/.test(n.name)) as TransformNode[];
  for (const node of nodes) {
    const small = /:socket_rune_b/.test(node.name);
    const rune = small ? (runes.smallSlot ? runes.small : null) : runes.main;
    if (!rune) continue;
    const stone = await load(rune.id, node, node.name.slice(node.name.lastIndexOf(':') + 1));
    for (const s of stone ?? []) {
      const part = glowPartOf(s.name);
      if (part && part !== 'channel') kit.add({ mesh: s, part, rune });
    }
  }
  return metal;
}
