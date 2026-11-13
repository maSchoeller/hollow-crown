/**
 * Dev page for the acceptance of the attached parts of the pro paths (story 10.13): one figure on grass from the game
 * camera (35 degrees from straight down, noon, board material) with the part of a pro path hung on its body socket.
 * /tools/art/part-one.html?part=<model>&socket=back|head[&unit=<figure>][&anim=idle|walk|attack][&yaw=<degrees>].
 * A figure imported from glTF looks north, away from the camera: a head part therefore turns to face it, a back part
 * stays turned away so the part is the thing one sees; `yaw` overrides the turn.
 * tools/art/part-shots.mjs walks every part of content/core/render.yaml through it at 375 × 812.
 */
import { ArcRotateCamera, Camera, Color3, Color4, DirectionalLight, Engine, HemisphericLight, Mesh, MeshBuilder, PBRMaterial, Scene, ShadowGenerator, StandardMaterial, Texture, TransformNode, Vector3 } from '@babylonjs/core';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import { teamColours } from '../../src/render/shared/models';
import { applyLight } from '../../src/render/shared/season';

const q = new URLSearchParams(location.search);
const part = q.get('part') ?? 'tower_shield';
const socket = `socket_${q.get('socket') ?? 'back'}`;
const unit = q.get('unit') ?? 'fenn';
const anim = q.get('anim') ?? 'idle';
// three quarters on, so the silhouette reads: a head part shows the face, a back part the back
const yaw = Number(q.get('yaw') ?? (socket === 'socket_head' ? 155 : 25));
const FIGURE_SCALE = 1.3; // content/core/render.yaml board.figureScale
const RAMP = ['#1E3F86', '#2F64C8', '#5C8EE6', '#A9C6F4'];

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
const mat = new StandardMaterial('board', scene);
mat.specularColor = new Color3(0.05, 0.05, 0.05);
mat.backFaceCulling = false;

/** Loads a .glb, puts the board material and the team colours on every mesh, and returns its root and meshes. */
async function load(url: string): Promise<{ root: TransformNode; meshes: Mesh[]; play: (name: string) => void }> {
  // as the board loads them (src/render/shared/models.ts): it shades in gamma space, so no sRGB decode
  const r = await LoadAssetContainerAsync(url, scene, { pluginOptions: { gltf: { useSRGBBuffers: false } } });
  r.addAllToScene();
  r.animationGroups.forEach((a) => a.stop());
  const meshes: Mesh[] = [];
  for (const m of r.meshes) {
    if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
    const tex = (m.material as PBRMaterial | null)?.albedoTexture;
    if (tex) {
      const own = mat.clone(`${url}:mat`);
      own.diffuseTexture = tex;
      m.material = own;
    } else m.material = mat;
    teamColours(m, RAMP);
    shadow.addShadowCaster(m);
    meshes.push(m);
  }
  const play = (name: string) => {
    const g = r.animationGroups.find((a) => a.name.endsWith(name)) ?? r.animationGroups[0];
    g?.play(true);
  };
  return { root: r.meshes[0] as TransformNode, meshes, play };
}

const figure = await load(`/assets/act1/models/units/${unit}.glb`);
const socketNode = figure.root.getDescendants(false).find((n) => n.name === socket) as TransformNode | undefined;
if (!socketNode) throw new Error(`${unit}.glb has no ${socket} — rebuild with pnpm art:tripo`);
const piece = await load(`/art/models/parts/${part}.glb`);
// the socket already sits in the figure's glTF space: keep the model's own local transform, drop the file's root
for (const n of [...piece.root.getChildren()]) (n as TransformNode).parent = socketNode;
if (piece.root instanceof Mesh && piece.root.getTotalVertices()) piece.root.parent = socketNode;

figure.root.scaling.scaleInPlace(FIGURE_SCALE);
figure.root.rotate(Vector3.Up(), (yaw * Math.PI) / 180);
figure.play(anim);

const ground = MeshBuilder.CreateBox('g', { width: 12, depth: 12, height: 0.05 }, scene);
ground.position.y = -0.025;
const gm = new StandardMaterial('gm', scene);
const gt = new Texture('/assets/ground/grass.png', scene);
gt.uScale = 6;
gt.vScale = 6;
gm.diffuseTexture = gt;
gm.specularColor = Color3.Black();
ground.material = gm;
ground.receiveShadows = true;
// one-field grid corner marks, as on the board
const tile = MeshBuilder.CreatePlane('t', { size: 1 }, scene);
tile.rotation.x = Math.PI / 2;
tile.position.y = 0.002;
const tm = new StandardMaterial('tm', scene);
tm.alpha = 0.16;
tm.emissiveColor = Color3.White();
tile.material = tm;

// the board camera: 35 degrees from straight down, 3 fields across (zoom "near" on a phone shows about 7)
const tilt = (35 * Math.PI) / 180;
const cam = new ArcRotateCamera('c', -Math.PI / 2, tilt, 60, new Vector3(0, 0.5, 0), scene);
cam.mode = Camera.ORTHOGRAPHIC_CAMERA;
const aspect = engine.getRenderWidth() / engine.getRenderHeight();
const half = 0.95;
cam.orthoTop = half;
cam.orthoBottom = -half;
cam.orthoLeft = -half * aspect;
cam.orthoRight = half * aspect;
await scene.whenReadyAsync();
engine.runRenderLoop(() => scene.render());
Object.assign(window, { catalogReady: true, scene, cam });
