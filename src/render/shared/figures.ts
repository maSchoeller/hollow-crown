/**
 * Unit figures on the 3D board: animated 3D model (default) or upright pixel sprite (option, D4).
 * The board places `node`; figures only animate and tint themselves.
 */
import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import type { Team } from '../../core';
import { TILE, type Sheet } from './assets';
import { TEAM_RAMP, type UnitModel } from './models';

export type FigureAnim = 'idle' | 'walk' | 'attack' | 'hit' | 'downed';
/** Screen-relative direction for sprites; 3D models turn instead. */
export type Facing = 's' | 'n' | 'e' | 'w';

export interface Figure {
  node: TransformNode;
  /** meshes that cast shadows */
  casters: Mesh[];
  play(anim: FigureAnim, facing: Facing, speed: number): void;
  /** desaturation (acted/downed) 0–1, white flash 0–1, opacity 0–1 */
  tint(desat: number, flash: number, alpha: number): void;
  tick(now: number, speed: number): void;
  dispose(): void;
}

const YAW: Record<Facing, number> = { s: Math.PI, n: 0, e: Math.PI / 2, w: -Math.PI / 2 };

function tintMaterial(m: StandardMaterial, desat: number, flash: number, alpha: number): void {
  const k = 1 - desat * 0.45;
  m.diffuseColor.set(k, k, k * 1.04);
  m.emissiveColor.set(flash * 0.8, flash * 0.8, flash * 0.8);
  m.alpha = alpha;
}

export class ModelFigure implements Figure {
  readonly node: TransformNode;
  readonly casters: Mesh[];
  private current: FigureAnim | null = null;

  /** `motion`: the weapon group's own animations (`attack_<motion>` …) win over the defaults, if the figure has them */
  constructor(
    private model: UnitModel,
    private motion?: string,
  ) {
    this.node = new TransformNode(`${model.root.name}:place`, model.root.getScene());
    model.root.parent = this.node;
    this.casters = model.meshes;
  }

  play(anim: FigureAnim, facing: Facing, speed: number): void {
    this.model.root.rotation.y = YAW[facing];
    for (const g of this.model.grips) g.node.rotation.x = anim === 'attack' ? 0 : g.hold;
    const g = (this.motion && this.model.anims[`${anim}_${this.motion}`]) || this.model.anims[anim] || this.model.anims.idle;
    if (!g) return;
    if (this.current === anim && anim !== 'attack' && anim !== 'hit') return;
    for (const o of Object.values(this.model.anims)) if (o !== g) o.stop();
    this.current = anim;
    if (anim === 'downed') {
      g.start(false, 1, g.to, g.to);
      return;
    }
    g.start(anim === 'idle' || anim === 'walk', speed, g.from, g.to);
  }

  tint(desat: number, flash: number, alpha: number): void {
    for (const m of this.model.materials) {
      tintMaterial(m, desat, flash, alpha);
      m.transparencyMode = alpha < 0.99 ? StandardMaterial.MATERIAL_ALPHABLEND : StandardMaterial.MATERIAL_OPAQUE;
    }
  }

  tick(): void {}

  dispose(): void {
    this.model.dispose();
    this.node.dispose();
  }
}

/** Sheet with team cloth recoloured on a canvas (no custom shader needed). */
function teamSheet(scene: Scene, sheet: Sheet, team: Team): DynamicTexture {
  const w = sheet.image.width;
  const h = sheet.image.height;
  const t = new DynamicTexture(`sheet:${sheet.id}:${team}`, { width: w, height: h }, scene, false, Texture.NEAREST_SAMPLINGMODE);
  const g = t.getContext() as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, w, h);
  g.drawImage(sheet.image, 0, 0);
  const img = g.getImageData(0, 0, w, h);
  const key = [0x40, 0x80, 0xc0, 0xff];
  const ramp = TEAM_RAMP[team].map((c) => [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]);
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
  readonly casters: Mesh[];
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
    this.texture = teamSheet(scene, sheet, team);
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
    this.casters = [this.plane];
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

  tint(desat: number, flash: number, alpha: number): void {
    tintMaterial(this.material, desat, flash, alpha);
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
