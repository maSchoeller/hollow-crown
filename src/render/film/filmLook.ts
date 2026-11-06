/**
 * Cinema look of the film scenes (epic 16, story 16.3): ACES tone mapping and grade, depth of field on the shot's target,
 * bloom, vignette, grain, a touch of chromatic aberration, ambient occlusion on `high`, aerial haze and a gradient sky.
 * The post-processing modules load on demand so the battle bundle does not grow. Values from `render.yaml film`.
 */
import type { Camera } from '@babylonjs/core/Cameras/camera';
import type { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import type { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import type { FilmLookDef } from '../../core';
import type { Quality } from '../host';

export interface FilmLook {
  /** focus on a point `distance` world units in front of the camera */
  focus(distance: number): void;
  /** the dust drifts around this world point (the shot's target) */
  follow(x: number, y: number, z: number): void;
  dispose(): void;
}

/** Sky dome with a vertical gradient: warm haze at the horizon, deeper blue above. */
function skyDome(scene: Scene, horizon: Color3, mid: Color3, zenith: Color3, centre: [number, number]): Mesh {
  const tex = new DynamicTexture('filmSky', { width: 4, height: 256 }, scene, false);
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, zenith.toHexString());
  g.addColorStop(0.32, mid.toHexString());
  g.addColorStop(0.49, horizon.toHexString());
  g.addColorStop(1, horizon.scale(0.85).toHexString());
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  tex.update(false);
  const mat = new StandardMaterial('filmSkyMat', scene);
  mat.emissiveTexture = tex;
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  mat.fogEnabled = false;
  const dome = MeshBuilder.CreateSphere('filmSky', { diameter: 160, segments: 16, sideOrientation: 1 }, scene);
  dome.material = mat;
  dome.position.set(centre[0], 0, centre[1]);
  dome.isPickable = false;
  dome.infiniteDistance = true;
  return dome;
}

/** Motes of dust floating slowly in the light around the shot's target; none on `low`. */
function makeDust(scene: Scene, def: FilmLookDef, quality: Quality): ParticleSystem | null {
  const n = def.dust[quality];
  if (n <= 0) return null;
  const tex = new DynamicTexture('filmDustTex', { width: 32, height: 32 }, scene, false);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  tex.hasAlpha = true;
  tex.update(false);
  const ps = new ParticleSystem('filmDust', n, scene);
  ps.particleTexture = tex;
  ps.emitter = new Vector3(0, 0, 0);
  ps.minEmitBox = new Vector3(-3, 0.05, -3);
  ps.maxEmitBox = new Vector3(3, 2.2, 3);
  const c = Color3.FromHexString(def.dust.color);
  ps.color1 = new Color4(c.r, c.g, c.b, 0.55);
  ps.color2 = new Color4(c.r, c.g, c.b, 0.3);
  ps.colorDead = new Color4(c.r, c.g, c.b, 0);
  ps.minSize = def.dust.size * 0.5;
  ps.maxSize = def.dust.size * 1.4;
  ps.minLifeTime = 4;
  ps.maxLifeTime = 9;
  ps.emitRate = n / 6;
  ps.direction1 = new Vector3(-0.05, 0.02, -0.03);
  ps.direction2 = new Vector3(0.06, 0.06, 0.04);
  ps.minEmitPower = 0.5;
  ps.maxEmitPower = 1;
  ps.updateSpeed = 0.01;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.preWarmCycles = 300;
  ps.start();
  return ps;
}

export async function applyFilmLook(
  scene: Scene,
  camera: Camera,
  def: FilmLookDef,
  quality: Quality,
  lights: { sun: DirectionalLight; hemi: HemisphericLight },
  centre: [number, number],
): Promise<FilmLook> {
  // light: a warmer key and a cooler sky fill than the board's neutral noon
  lights.sun.intensity *= def.sun.intensity;
  lights.sun.diffuse = Color3.FromHexString(def.sun.color);
  lights.hemi.intensity *= def.sun.hemi;
  lights.hemi.groundColor = Color3.FromHexString(def.haze.color).scale(0.45);
  lights.hemi.diffuse = Color3.FromHexString(def.sun.hemiColor);
  // aerial perspective: distant town and hills fade into the warm haze
  const haze = Color3.FromHexString(def.haze.color);
  if (scene.fogMode === Scene.FOGMODE_NONE) {
    scene.fogMode = Scene.FOGMODE_LINEAR;
    scene.fogColor = haze;
    scene.fogStart = def.haze.near;
    scene.fogEnd = def.haze.far;
  }
  scene.clearColor = new Color4(haze.r, haze.g, haze.b, 1);
  const sky = skyDome(scene, Color3.FromHexString(def.sky.horizon), Color3.FromHexString(def.sky.mid), Color3.FromHexString(def.sky.top), centre);
  const dust = makeDust(scene, def, quality);
  if (quality === 'low') {
    return { focus: () => undefined, follow: () => undefined, dispose: () => sky.dispose(false, true) };
  }
  const [{ DefaultRenderingPipeline }, { ImageProcessingConfiguration }, { DepthOfFieldEffectBlurLevel }, { ColorCurves }] = await Promise.all([
    import('@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline'),
    import('@babylonjs/core/Materials/imageProcessingConfiguration'),
    import('@babylonjs/core/PostProcesses/depthOfFieldEffect'),
    import('@babylonjs/core/Materials/colorCurves'),
  ]);
  const p = new DefaultRenderingPipeline('film', true, scene, [camera]);
  p.samples = quality === 'high' ? 4 : 1;
  p.fxaaEnabled = true;
  const ip = p.imageProcessing;
  p.imageProcessingEnabled = true;
  ip.toneMappingEnabled = true;
  ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  ip.exposure = def.exposure;
  ip.contrast = def.contrast;
  ip.vignetteEnabled = true;
  ip.vignetteWeight = def.vignette * 4;
  ip.vignetteStretch = 0.4;
  const vc = Color3.FromHexString(def.vignetteColor);
  ip.vignetteColor = new Color4(vc.r, vc.g, vc.b, 0);
  ip.vignetteBlendMode = ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
  // grade: cool shadows, warm highlights, a little more colour
  const curves = new ColorCurves();
  const gr = def.grade;
  curves.shadowsHue = gr.shadowsHue;
  curves.shadowsDensity = gr.shadowsDensity;
  curves.shadowsSaturation = gr.shadowsSaturation;
  curves.highlightsHue = gr.highlightsHue;
  curves.highlightsDensity = gr.highlightsDensity;
  curves.highlightsSaturation = gr.highlightsSaturation;
  curves.globalSaturation = gr.saturation;
  ip.colorCurvesEnabled = true;
  ip.colorCurves = curves;
  p.bloomEnabled = true;
  p.bloomThreshold = def.bloom.threshold;
  p.bloomWeight = def.bloom.weight;
  p.bloomKernel = def.bloom.kernel;
  p.bloomScale = def.bloom.scale;
  p.grainEnabled = def.grain > 0;
  p.grain.intensity = def.grain;
  p.grain.animated = true;
  p.chromaticAberrationEnabled = def.chromatic > 0;
  p.chromaticAberration.aberrationAmount = def.chromatic;
  p.chromaticAberration.radialIntensity = 1.2;
  p.sharpenEnabled = def.sharpen > 0;
  p.sharpen.edgeAmount = def.sharpen;
  const blur = def.dof.blur[quality];
  p.depthOfFieldEnabled = true;
  p.depthOfFieldBlurLevel = blur >= 2 ? DepthOfFieldEffectBlurLevel.High : blur === 1 ? DepthOfFieldEffectBlurLevel.Medium : DepthOfFieldEffectBlurLevel.Low;
  p.depthOfField.fStop = def.dof.fStop;
  p.depthOfField.focalLength = def.dof.focalLength;
  let ssao: { dispose(): void } | null = null;
  if (def.ssao[quality]) {
    const { SSAO2RenderingPipeline } = await import('@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline');
    if (SSAO2RenderingPipeline.IsSupported) {
      const s = new SSAO2RenderingPipeline('filmSsao', scene, { ssaoRatio: 0.5, blurRatio: 0.5 }, [camera]);
      s.radius = def.ssao.radius;
      s.totalStrength = def.ssao.strength;
      s.samples = 16;
      ssao = s;
    }
  }
  return {
    // world units → millimetres for the lens model
    focus: (distance) => {
      p.depthOfField.focusDistance = Math.max(100, distance * 1000);
    },
    follow: (x, y, z) => dust?.emitter && (dust.emitter as Vector3).set(x, y, z),
    dispose: () => {
      dust?.dispose();
      ssao?.dispose();
      p.dispose();
      sky.dispose(false, true);
    },
  };
}
