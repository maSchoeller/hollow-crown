/**
 * Death in ash (story 8.6, art-direction §8): a unit that falls dissolves into ash flakes with a few glowing embers that rise
 * while it fades. One pair of particle systems is made when the board loads and reused for every death (no system is built
 * during play, so the first death compiles nothing); a burst puts the emitter on the unit and emits the flakes at once.
 */
import type { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Particles/particleSystemComponent';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';
import type { LookDef } from '../../core/defs';

type DeathFx = LookDef['fx']['death'];

const colour = (hex: string, a: number) => {
  const c = Color3.FromHexString(hex);
  return new Color4(c.r, c.g, c.b, a);
};

export class AshBurst {
  private flakes: ParticleSystem;
  private embers: ParticleSystem;
  private texture: DynamicTexture;
  private nFlakes: number;
  private nEmbers: number;
  private stopTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(scene: Scene, private fx: DeathFx, quality: 'high' | 'mid' | 'low') {
    this.nFlakes = fx.flakes[quality];
    this.nEmbers = quality === 'low' ? 0 : fx.embers;
    this.texture = new DynamicTexture('ash:dot', { width: 32, height: 32 }, scene, false);
    const g = this.texture.getContext() as CanvasRenderingContext2D;
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.6, 'rgba(255,255,255,0.75)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    this.texture.update(true);
    this.texture.hasAlpha = true;
    const life = fx.ashMs / 1000;
    const make = (name: string, count: number, hex: string, size: [number, number], additive: boolean) => {
      const ps = new ParticleSystem(name, Math.max(1, count * 2), scene);
      ps.particleTexture = this.texture;
      ps.emitter = new Vector3(0, 0, 0);
      ps.minEmitBox = new Vector3(-0.2, 0.1, -0.2);
      ps.maxEmitBox = new Vector3(0.2, 0.9, 0.2);
      ps.direction1 = new Vector3(-0.5, 1, -0.5);
      ps.direction2 = new Vector3(0.5, 1.6, 0.5);
      ps.minEmitPower = 0.5;
      ps.maxEmitPower = 1.1;
      ps.minLifeTime = life * 0.6;
      ps.maxLifeTime = life;
      ps.gravity = new Vector3(0, 0.4, 0);
      ps.minSize = size[0];
      ps.maxSize = size[1];
      ps.blendMode = additive ? ParticleSystem.BLENDMODE_ADD : ParticleSystem.BLENDMODE_STANDARD;
      ps.emitRate = 0;
      ps.addColorGradient(0, colour(hex, 0));
      ps.addColorGradient(0.1, colour(hex, 1));
      ps.addColorGradient(0.7, colour(hex, 0.8));
      ps.addColorGradient(1, colour(hex, 0));
      ps.renderingGroupId = 1;
      ps.disposeOnStop = false;
      return ps;
    };
    this.flakes = make('ash:flakes', this.nFlakes, fx.colour, [0.08, 0.16], false);
    this.embers = make('ash:embers', this.nEmbers, fx.emberColour, [0.05, 0.1], true);
  }

  /** Are the shaders of both systems compiled? */
  ready(): boolean {
    return this.flakes.isReady() && this.embers.isReady();
  }

  /** The burst at a point (world coordinates, the unit's feet). */
  burst(x: number, y: number, z: number): void {
    for (const [ps, n] of [[this.flakes, this.nFlakes], [this.embers, this.nEmbers]] as const) {
      if (n <= 0) continue;
      (ps.emitter as Vector3).set(x, y, z);
      ps.manualEmitCount += n;
      if (!ps.isStarted()) ps.start();
    }
    clearTimeout(this.stopTimer);
    // stops the systems after the particles are gone, so nothing is animated between deaths
    this.stopTimer = setTimeout(() => {
      this.flakes.stop();
      this.embers.stop();
    }, this.fx.ashMs + 200);
  }

  dispose(): void {
    clearTimeout(this.stopTimer);
    this.flakes.dispose(false);
    this.embers.dispose(false);
    this.texture.dispose();
  }
}
