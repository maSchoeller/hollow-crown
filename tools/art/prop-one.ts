/**
 * Dev page: one prop model on grass from the game camera (35 degrees from straight down, noon, board material), a figure beside it as the scale.
 * /tools/art/prop-one.html?id=<model>. tools/art/gallery-shots.mjs walks all models of the gallery through it.
 */
import { ArcRotateCamera, Camera, Color3, Color4, DirectionalLight, Engine, HemisphericLight, Mesh, MeshBuilder, PBRMaterial, Scene, ShadowGenerator, StandardMaterial, Texture, Vector3 } from '@babylonjs/core';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import { teamColours } from '../../src/render/shared/models';
import { applyLight } from '../../src/render/shared/season';

const id = new URLSearchParams(location.search).get('id') ?? 'tower_idle';
const canvas = document.getElementById('c') as HTMLCanvasElement;
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true });
const scene = new Scene(engine);
scene.clearColor = new Color4(0.66, 0.69, 0.64, 1);
const hemi = new HemisphericLight('a', new Vector3(0.2, 1, -0.3), scene);
const sun = new DirectionalLight('s', new Vector3(0.5, -1, 0.4), scene);
applyLight(hemi, sun, { color: '#fff6e6', intensity: 0.75 }, { color: '#fff4e0', intensity: 0.8, azimuthDeg: 180, elevationDeg: 68 });
const shadow = new ShadowGenerator(2048, sun);
shadow.useBlurExponentialShadowMap = true;
shadow.blurKernel = 16;
const propMat = new StandardMaterial('props', scene);
propMat.specularColor = new Color3(0.05, 0.05, 0.05);
propMat.backFaceCulling = false;

async function place(folder: string, file: string, x: number, scale: number, skinned: boolean): Promise<Mesh[]> {
  // as the board loads them (src/render/shared/models.ts): it shades in gamma space, so the texture must not be decoded as sRGB
  const r = await LoadAssetContainerAsync(`${folder}${file}.glb`, scene, { pluginOptions: { gltf: { useSRGBBuffers: false } } });
  r.addAllToScene();
  r.animationGroups.forEach((a) => a.stop());
  const out: Mesh[] = [];
  for (const m of r.meshes) {
    if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
    const tex = (m.material as PBRMaterial | null)?.albedoTexture;
    if (tex) {
      const own = propMat.clone(`${file}:mat`);
      own.diffuseTexture = tex;
      m.material = own;
    } else m.material = propMat;
    teamColours(m, ['#1E3F86', '#2F64C8', '#5C8EE6', '#A9C6F4']);
    if (!skinned) {
      m.makeGeometryUnique();
      m.computeWorldMatrix(true);
      m.setParent(null);
      m.bakeCurrentTransformIntoVertices();
      m.scaling.setAll(scale);
      // setParent left a quaternion behind, which would override the Euler angle
      m.rotationQuaternion = null;
      m.rotation.y = Math.PI;
      m.position.set(x, 0, 0);
    }
    shadow.addShadowCaster(m);
    out.push(m);
  }
  if (skinned) {
    const root = r.meshes[0]!;
    root.position.set(x, 0, 0);
    root.scaling.scaleInPlace(scale);
    root.rotate(Vector3.Up(), Math.PI);
  }
  return out;
}

const parts = await place('/art/models/props/', id, 0, 1, false);
let hx = 0.5;
let hz = 0.5;
let top = 1;
for (const m of parts) {
  m.computeWorldMatrix(true);
  const b = m.getBoundingInfo().boundingBox;
  hx = Math.max(hx, Math.abs(b.minimumWorld.x), Math.abs(b.maximumWorld.x));
  hz = Math.max(hz, Math.abs(b.minimumWorld.z), Math.abs(b.maximumWorld.z));
  top = Math.max(top, b.maximumWorld.y);
}
const figureX = -hx - 0.45;
await place('/assets/act1/models/units/', 'fenn', figureX, 1.3, true).catch(() => undefined);

const span = Math.max(2 * hx + 1.2, 2.6);
const ground = MeshBuilder.CreateBox('g', { width: span + 8, depth: span + 8, height: 0.05 }, scene);
ground.position.y = -0.025;
const gm = new StandardMaterial('gm', scene);
const gt = new Texture('/assets/ground/grass.png', scene);
gt.uScale = (span + 8) / 2;
gt.vScale = (span + 8) / 2;
gm.diffuseTexture = gt;
gm.specularColor = Color3.Black();
ground.material = gm;
ground.receiveShadows = true;
// one-field grid corners, as on the board
const tile = MeshBuilder.CreatePlane('t', { size: 1 }, scene);
tile.rotation.x = Math.PI / 2;
tile.position.y = 0.002;
const tm = new StandardMaterial('tm', scene);
tm.alpha = 0.16;
tm.emissiveColor = Color3.White();
tile.material = tm;

const tilt = (35 * Math.PI) / 180;
const midX = (figureX - 0.3 + hx) / 2;
const cam = new ArcRotateCamera('c', -Math.PI / 2, tilt, 60, new Vector3(midX, top * 0.35, 0), scene);
cam.mode = Camera.ORTHOGRAPHIC_CAMERA;
const aspect = engine.getRenderWidth() / engine.getRenderHeight();
const half = Math.max((hx - figureX + 0.5) / 2 / aspect, (hz * Math.cos(tilt) + top * Math.sin(tilt)) * 0.75 + 0.15) * 1.05;
cam.orthoTop = half;
cam.orthoBottom = -half;
cam.orthoLeft = -half * aspect;
cam.orthoRight = half * aspect;
await scene.whenReadyAsync();
engine.runRenderLoop(() => scene.render());
(window as unknown as { catalogReady: boolean }).catalogReady = true;
