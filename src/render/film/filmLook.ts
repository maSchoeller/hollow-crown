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
import type { FilmLookDef } from '../../core';
import type { Quality } from '../host';

export interface FilmLook {
  /** focus on a point `distance` world units in front of the camera */
  focus(distance: number): void;
  dispose(): void;
}

/** Sky dome with a vertical gradient: warm haze at the horizon, deeper blue above. */
function skyDome(scene: Scene, horizon: Color3, zenith: Color3, centre: [number, number]): Mesh {
  const tex = new DynamicTexture('filmSky', { width: 4, height: 256 }, scene, false);
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, zenith.toHexString());
  g.addColorStop(0.42, Color3.Lerp(zenith, horizon, 0.55).toHexString());
  g.addColorStop(0.5, horizon.toHexString());
  g.addColorStop(1, horizon.scale(0.9).toHexString());
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
  const sky = skyDome(scene, haze, Color3.FromHexString(def.sun.hemiColor).scale(0.95), centre);
  if (quality === 'low') {
    return { focus: () => undefined, dispose: () => sky.dispose(false, true) };
  }
  const [{ DefaultRenderingPipeline }, { ImageProcessingConfiguration }, { DepthOfFieldEffectBlurLevel }] = await Promise.all([
    import('@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline'),
    import('@babylonjs/core/Materials/imageProcessingConfiguration'),
    import('@babylonjs/core/PostProcesses/depthOfFieldEffect'),
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
    dispose: () => {
      ssao?.dispose();
      p.dispose();
      sky.dispose(false, true);
    },
  };
}
