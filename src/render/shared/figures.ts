/**
 * Unit figures on the 3D board: animated 3D model (default) or upright pixel sprite (option, D4).
 * The board places `node`; figures only animate and tint themselves.
 */
import type { Scene } from '@babylonjs/core/scene';
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import type { Skeleton } from '@babylonjs/core/Bones/skeleton';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import type { Team } from '../../core';
import { TILE, type Sheet } from './assets';
import { giveTint, NO_GLOW, sharedFigureMaterial, takeTint, tintMaterial, type Glow, type UnitModel } from './models';
import { clipRow, type VatClip } from './vat';

export type FigureAnim = 'idle' | 'walk' | 'attack' | 'hit' | 'downed';
/** Screen-relative direction for sprites; 3D models turn instead. */
export type Facing = 's' | 'n' | 'e' | 'w';

export interface Figure {
  node: TransformNode;
  play(anim: FigureAnim, facing: Facing, speed: number): void;
  /** desaturation (acted/downed) 0–1, white flash 0–1, opacity 0–1, colour glow (story 13.6); writes only when a value changed */
  tint(desat: number, flash: number, alpha: number, glow?: Glow): void;
  /**
   * `now`: the animation clock in ms (it stops while the board freezes a critical hit); `onScreen`: false while the figure is
   * outside the view and switched off, so nothing about its skeleton or its baked row is worked out
   */
  tick(now: number, speed: number, onScreen?: boolean): void;
  dispose(): void;
}

const YAW: Record<Facing, number> = { s: Math.PI, n: 0, e: Math.PI / 2, w: -Math.PI / 2 };

/**
 * Story 7.7: a figure that stands or lies still has its skeleton updated only `idleHz` times a second (offset per figure,
 * so the updates spread over the frames), one that walks, strikes or is hit at every frame. Babylon would otherwise step
 * the idle loop, move the bone nodes and rebuild the bone texture of every figure each frame. The idle group stays on its
 * start but paused; at each update the board jumps it to the frame the loop has reached.
 *
 * Story 7.8: a figure with a baked animation (`UnitModel.vat`) has no skeleton to update: it picks the row of its clip from the
 * animation clock and tells the shader (which row of the model's texture its mesh draws) and its weapon sockets; idle runs at the
 * full frame rate then. Figures without a baked file (the Blender figures) keep the throttled skeleton path above.
 */
const DOWNED_HOLD_FRAMES = 3;

export class ModelFigure implements Figure {
  readonly node: TransformNode;
  private current: FigureAnim | null = null;
  /** the tint last applied; three numbers are compared instead of building a key string for each figure and frame (story 7.8) */
  private tDesat = -1;
  private tFlash = -1;
  private tAlpha = -1;
  private tGlow: Glow = NO_GLOW;
  /** materials from the scene's pool while the figure flashes or fades (one per mesh group, opaque or blended); at rest it wears the scene's shared ones */
  private own: { mats: StandardMaterial[]; blend: boolean } | null = null;
  /** the idle group while the skeleton is throttled; null: at full rate or holding a still pose */
  private idle: AnimationGroup | null = null;
  private idleSpeed = 1;
  private slow = false;
  private idleT0 = 0;
  private nextDue = 0;
  private hold = 0;
  private period: number;
  /** while throttled: the skeletons that have a new pose and still wait to be prepared (the figure may be off screen) */
  private needs = new Set<Skeleton>();
  /** baked animation: the clip playing, its start on the animation clock, its rate, the row shown now (-1: none yet) and the clock's last reading */
  private clip: VatClip | null = null;
  private clipStart = 0;
  private clipSpeed = 1;
  private row = -1;
  private clock = 0;

  /** `motion`: the weapon group's own animations (`attack_<motion>` …) win over the defaults, if the figure has them */
  constructor(
    private model: UnitModel,
    private motion?: string,
    idleHz = 10,
    /** tint materials kept per texture and case for the next hit (render.yaml board.tintPool) */
    private poolMax = 24,
  ) {
    this.node = new TransformNode(`${model.root.name}:place`, model.root.getScene());
    model.root.parent = this.node;
    this.period = 1000 / idleHz;
    // a hash of the name staggers the figures' update times
    let h = 0;
    for (const ch of model.root.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    this.nextDue = (h % 1000) / 1000 * this.period;
    for (const sk of model.skeletons) {
      const prepare = sk.prepare.bind(sk);
      // the scene prepares every active skeleton each frame; a throttled figure skips the frames in between and keeps its bone texture
      sk.prepare = (dontCheckFrameId?: boolean) => {
        if (!this.slow || this.needs.delete(sk)) prepare(dontCheckFrameId);
      };
    }
  }

  play(anim: FigureAnim, facing: Facing, speed: number): void {
    this.model.root.rotation.y = YAW[facing];
    for (const g of this.model.grips) g.node.rotation.x = anim === 'attack' ? 0 : g.hold;
    if (this.model.vat) {
      this.playBaked(anim, speed);
      return;
    }
    const g = (this.motion && this.model.anims[`${anim}_${this.motion}`]) || this.model.anims[anim] || this.model.anims.idle;
    if (!g) return;
    if (this.current === anim && anim !== 'attack' && anim !== 'hit') return;
    for (const o of Object.values(this.model.anims)) if (o !== g) o.stop();
    this.current = anim;
    this.idle = null;
    this.slow = false;
    this.needs.clear();
    if (anim === 'downed') {
      g.start(false, 1, g.to, g.to);
      // the pose is set in a frame or two; after that nothing about the skeleton changes
      this.slow = true;
      this.hold = DOWNED_HOLD_FRAMES;
      this.expect();
      return;
    }
    if (anim === 'idle') {
      g.start(true, speed, g.from, g.to);
      g.pause();
      g.goToFrame(g.from);
      this.idle = g;
      this.slow = true;
      this.idleT0 = performance.now();
      this.idleSpeed = speed;
      this.nextDue = 0;
      this.expect();
      return;
    }
    g.start(anim === 'walk', speed, g.from, g.to);
  }

  /** the clip of the baked file for an animation: the weapon group's own (`attack_chop` …), else the default, else idle */
  private playBaked(anim: FigureAnim, speed: number): void {
    const clips = this.model.vat!.entry.data.clips;
    const clip = (this.motion && clips.get(`${anim}_${this.motion}`)) || clips.get(anim) || clips.get('idle');
    if (!clip) return;
    if (this.current === anim && anim !== 'attack' && anim !== 'hit') return;
    this.current = anim;
    this.clip = clip;
    // the clip starts at the next frame's time, as the engine's animations do (they begin with the next animation step), not at the last one's
    this.clipStart = NaN;
    this.clipSpeed = speed;
    this.show(clipRow(clip, 0, this.model.vat!.entry.data.fps));
  }

  /** shows a row of the model's texture on this figure's body and puts the hand sockets where the file has them for it */
  private show(row: number): void {
    if (row === this.row) return;
    this.row = row;
    const vat = this.model.vat!;
    const p = vat.manager.animationParameters;
    p.x = p.y = row;
    const table = vat.entry.sockets;
    const count = vat.entry.data.sockets.length;
    for (const k of vat.sockets) {
      const o = (row * count + k.index) * 7;
      k.node.position.set(table[o]!, table[o + 1]!, table[o + 2]!);
      k.node.rotationQuaternion!.set(table[o + 3]!, table[o + 4]!, table[o + 5]!, table[o + 6]!);
    }
  }

  private expect(): void {
    for (const sk of this.model.skeletons) this.needs.add(sk);
  }

  tint(desat: number, flash: number, alpha: number, glow: Glow = NO_GLOW): void {
    if (desat === this.tDesat && flash === this.tFlash && alpha === this.tAlpha && glow === this.tGlow) return;
    this.tDesat = desat;
    this.tFlash = flash;
    this.tAlpha = alpha;
    this.tGlow = glow;
    const at = this.model;
    if (flash === 0 && alpha >= 0.999 && glow === NO_GLOW) {
      // at rest: the scene's shared material of this desaturation
      at.groups.forEach((g) => {
        const m = sharedFigureMaterial(at.shared, at.root.getScene(), at.look, g.texture, desat);
        for (const mesh of g.meshes) mesh.material = m;
      });
      this.releaseOwn();
      return;
    }
    // flash, glow, fade or ghost: pooled materials for as long as it lasts (the case, opaque or blended, is a shader variant of its own)
    const blend = alpha < 0.99;
    if (this.own && this.own.blend !== blend) this.releaseOwn();
    const scene = at.root.getScene();
    const own = (this.own ??= { blend, mats: at.groups.map((g) => takeTint(at.tintPool, scene, at.look, g.texture, blend)) });
    at.groups.forEach((g, i) => {
      const m = own.mats[i]!;
      tintMaterial(m, desat, flash, alpha, glow);
      for (const mesh of g.meshes) mesh.material = m;
    });
  }

  private releaseOwn(): void {
    const own = this.own;
    if (!own) return;
    this.own = null;
    this.model.groups.forEach((g, i) => giveTint(this.model.tintPool, g.texture, own.blend, own.mats[i]!, this.poolMax));
  }

  /**
   * Compiles the two tint variants (flash: opaque, fade/ghost: blended) of each distinct mesh group of this figure, so the first
   * hit starts no shader (story 7.8). `seen` skips what another figure of the scene did already: the variant depends on the
   * base texture, the skeleton and the vertex data of the mesh.
   */
  warmTints(seen: Set<string>): Promise<unknown>[] {
    const at = this.model;
    const scene = at.root.getScene();
    const jobs: Promise<unknown>[] = [];
    for (const g of at.groups) {
      const mesh = g.meshes[0];
      if (!mesh) continue;
      const sig = `${g.texture ? g.texture.uniqueId : 0}|${mesh.skeleton ? mesh.skeleton.bones.length : 0}|${mesh.numBoneInfluencers}|${mesh.isVerticesDataPresent(VertexBuffer.ColorKind) ? 1 : 0}|${mesh.bakedVertexAnimationManager ? 1 : 0}`;
      for (const blend of [false, true]) {
        const key = `${sig}|${blend ? 1 : 0}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const m = takeTint(at.tintPool, scene, at.look, g.texture, blend);
        jobs.push(
          m
            .forceCompilationAsync(mesh)
            .catch(() => undefined)
            .then(() => giveTint(at.tintPool, g.texture, blend, m, this.poolMax)),
        );
      }
    }
    return jobs;
  }

  tick(now: number, _speed = 1, onScreen = true): void {
    this.clock = now;
    if (this.model.vat) {
      if (Number.isNaN(this.clipStart)) this.clipStart = now;
      if (onScreen && this.clip) this.show(clipRow(this.clip, (now - this.clipStart) / 1000, this.model.vat.entry.data.fps, this.clipSpeed));
      return;
    }
    if (!this.slow) return;
    if (!onScreen) {
      // out of view: no pose is worked out; the first frame back in view gets the current one at once
      this.nextDue = 0;
      return;
    }
    if (this.idle) {
      if (now < this.nextDue) return;
      this.nextDue = now + this.period;
      const g = this.idle;
      const fps = g.targetedAnimations[0]?.animation.framePerSecond ?? 60;
      const len = g.to - g.from;
      if (len > 0) g.goToFrame(g.from + (((((now - this.idleT0) / 1000) * fps * this.idleSpeed) % len) + len) % len);
      this.expect();
      return;
    }
    // a still pose (downed): the animation sets it within a frame or two, then the skeleton is left alone
    if (this.hold > 0) {
      this.hold--;
      this.expect();
    }
  }

  dispose(): void {
    this.releaseOwn();
    this.model.dispose();
    this.node.dispose();
  }
}

/** Compiles the tint variants of all 3D figures in the list (story 7.8); resolves when the shaders are linked. */
export async function warmTints(figures: Iterable<Figure>): Promise<void> {
  const seen = new Set<string>();
  const jobs: Promise<unknown>[] = [];
  for (const f of figures) if (f instanceof ModelFigure) jobs.push(...f.warmTints(seen));
  await Promise.all(jobs);
}

/** Sheet with team cloth recoloured on a canvas (no custom shader needed). */
function teamSheet(scene: Scene, sheet: Sheet, team: Team, rampHex: readonly string[]): DynamicTexture {
  const w = sheet.image.width;
  const h = sheet.image.height;
  const t = new DynamicTexture(`sheet:${sheet.id}:${team}`, { width: w, height: h }, scene, false, Texture.NEAREST_SAMPLINGMODE);
  const g = t.getContext() as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, w, h);
  g.drawImage(sheet.image, 0, 0);
  const img = g.getImageData(0, 0, w, h);
  const key = [0x40, 0x80, 0xc0, 0xff];
  const ramp = rampHex.map((c) => [parseInt(c.slice(-6, -4), 16), parseInt(c.slice(-4, -2), 16), parseInt(c.slice(-2), 16)]);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 1] !== 0 || img.data[i] !== img.data[i + 2]) continue;
    const k = key.indexOf(img.data[i]!);
    if (k < 0) continue;
    img.data.set(ramp[k]!, i);
  }
  g.putImageData(img, 0, 0);
  t.update(true);
  t.hasAlpha = true;
  t.wrapU = t.wrapV = Texture.CLAMP_ADDRESSMODE;
  return t;
}

const ROW_OF: Record<FigureAnim, string> = { idle: 'idle_s', walk: 'walk', attack: 'attack', hit: 'hit_s', downed: 'downed_s' };

export class SpriteFigure implements Figure {
  readonly node: TransformNode;
  private plane: Mesh;
  private material: StandardMaterial;
  private texture: DynamicTexture;
  private row = 'idle_s';
  private flip = false;
  private start = 0;

  constructor(
    scene: Scene,
    private sheet: Sheet,
    team: Team,
    ramp: readonly string[],
    name: string,
  ) {
    this.node = new TransformNode(`${name}:place`, scene);
    const [cw, ch] = sheet.cell;
    this.plane = CreatePlane(`${name}:sprite`, { width: cw / TILE, height: ch / TILE }, scene);
    // pivot at the feet anchor so the billboard turns around them
    this.plane.bakeTransformIntoVertices(Matrix.Translation((cw / 2 - sheet.anchor[0]) / TILE, (sheet.anchor[1] - ch / 2) / TILE, 0));
    this.plane.parent = this.node;
    this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.plane.isPickable = false;
    this.texture = teamSheet(scene, sheet, team, ramp);
    this.texture.uScale = cw / sheet.image.width;
    this.texture.vScale = ch / sheet.image.height;
    this.material = new StandardMaterial(`${name}:spriteMat`, scene);
    this.material.diffuseTexture = this.texture;
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.transparencyMode = StandardMaterial.MATERIAL_ALPHATEST;
    this.material.alphaCutOff = 0.5;
    this.material.specularColor = new Color3(0, 0, 0);
    this.material.backFaceCulling = false;
    this.material.zOffset = -2;
    this.plane.material = this.material;
  }

  play(anim: FigureAnim, facing: Facing, _speed: number): void {
    const dir = facing === 'w' ? 'e' : facing;
    let row = ROW_OF[anim];
    if (anim === 'walk' || anim === 'attack') row = `${row}_${dir}`;
    if (this.sheet.rowIndex[row] === undefined) row = 'idle_s';
    if (row !== this.row || anim === 'attack' || anim === 'hit') this.start = performance.now();
    this.row = row;
    this.flip = facing === 'w' && row.endsWith('_e');
  }

  private tDesat = -1;
  private tFlash = -1;
  private tAlpha = -1;

  private tGlow: Glow = NO_GLOW;

  tint(desat: number, flash: number, alpha: number, glow: Glow = NO_GLOW): void {
    if (desat === this.tDesat && flash === this.tFlash && alpha === this.tAlpha && glow === this.tGlow) return;
    this.tDesat = desat;
    this.tFlash = flash;
    this.tAlpha = alpha;
    this.tGlow = glow;
    tintMaterial(this.material, desat, flash, alpha, glow);
    this.material.emissiveColor.addInPlace(new Color3(0.3, 0.3, 0.3));
    this.material.transparencyMode = alpha < 0.99 ? StandardMaterial.MATERIAL_ALPHATESTANDBLEND : StandardMaterial.MATERIAL_ALPHATEST;
  }

  tick(now: number, speed: number): void {
    const ri = this.sheet.rowIndex[this.row] ?? 0;
    const row = this.sheet.rows[ri]!;
    let col = 0;
    if (row.frames > 1) {
      const n = Math.floor(((now - this.start) / 1000) * (row.fps ?? 8) * (speed > 1 ? 1.6 : 1));
      if (row.loop === 'once') col = Math.min(n, row.frames - 1);
      else if (row.loop === 'pingpong') {
        const period = row.frames * 2 - 2;
        const k = ((n % period) + period) % period;
        col = k < row.frames ? k : period - k;
      } else col = ((n % row.frames) + row.frames) % row.frames;
    }
    const [cw, ch] = this.sheet.cell;
    const W = this.sheet.image.width;
    const H = this.sheet.image.height;
    this.texture.uScale = (this.flip ? -cw : cw) / W;
    this.texture.uOffset = ((col + (this.flip ? 1 : 0)) * cw) / W;
    this.texture.vOffset = 1 - ((ri + 1) * ch) / H;
  }

  dispose(): void {
    this.texture.dispose();
    this.material.dispose();
    this.node.dispose(false, true);
  }
}
