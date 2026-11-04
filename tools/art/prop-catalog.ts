/**
 * Dev page: every prop model on one board, same camera angle and noon light as the game, one tile = one field, a figure as the scale.
 * Open /tools/art/prop-catalog.html on the dev server. `?groups=` narrows it (comma list, part of a group name).
 * Colours follow the board's prop material (StandardMaterial over vertex colours), not a separate preview look.
 */
import {
  ArcRotateCamera,
  Camera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Matrix,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  SceneLoader,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { teamColours } from '../../src/render/shared/models';
import { applyLight } from '../../src/render/shared/season';

const q = new URLSearchParams(location.search);
const manifest = (await (await fetch('/assets/manifest.json')).json()) as { models: { props: Record<string, string[]> } };
const all = Object.entries(manifest.models.props)
  .flatMap(([id, states]) => states.map((s) => `${id}_${s}`))
  .sort();
const groups: Array<[string, RegExp]> = [
  ['Baeume Sommer', /^tree_/],
  ['Baeume Herbst Winter', /^(autumn|snowfir|deadtree)_/],
  ['Fels Bodendeko', /^(rock|rocks|bush)_/],
  ['Kulissenhaeuser', /^house_/],
  ['Besuchshaus', /^lodge_/],
  ['Hof Feld Zaun', /^(farm|field|fence)_/],
  ['Wehrbau Landmarken', /^(fort|ruins|shrine|bridge)_/],
  ['Dinge', /^(wagon|tent|campfire|well|chest)_/],
];
const wanted = q.get('groups')?.split(',');
const rows: Array<readonly [string, string[]]> = groups
  .filter(([n]) => !wanted || wanted.some((w) => n.includes(w)))
  .map(([n, r]) => [n, all.filter((m) => r.test(m))] as const);
const rest = all.filter((m) => !groups.some(([, r]) => r.test(m)));
if (rest.length && !wanted) rows.push(['Sonstige', rest]);

const canvas = document.getElementById('c') as HTMLCanvasElement;
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true });
const scene = new Scene(engine);
scene.clearColor = new Color4(0.66, 0.69, 0.64, 1);
// noon of content/core/render.yaml look.timeOfDay, through the board's own light setup
const hemi = new HemisphericLight('a', new Vector3(0.2, 1, -0.3), scene);
const sun = new DirectionalLight('s', new Vector3(0.5, -1, 0.4), scene);
applyLight(hemi, sun, { color: '#fff6e6', intensity: 0.75 }, { color: '#fff4e0', intensity: 0.8, azimuthDeg: 180, elevationDeg: 68 });
const shadow = new ShadowGenerator(2048, sun);
shadow.useBlurExponentialShadowMap = true;
shadow.blurKernel = 16;

const propMat = new StandardMaterial('props', scene);
propMat.specularColor = new Color3(0.05, 0.05, 0.05);
propMat.backFaceCulling = false;

const tileA = new StandardMaterial('ta', scene);
tileA.diffuseTexture = new Texture('/assets/ground/grass.png', scene);
tileA.specularColor = Color3.Black();
const tileB = tileA.clone('tb');
tileB.diffuseColor = new Color3(0.86, 0.86, 0.86);

async function place(file: string, x: number, z: number, scale = 1, folder = '/assets/models/props/'): Promise<void> {
  const r = await SceneLoader.ImportMeshAsync('', folder, `${file}.glb`, scene);
  r.animationGroups.forEach((a) => a.stop());
  for (const m of r.meshes) {
    if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
    const tex = (m.material as PBRMaterial | null)?.albedoTexture;
    if (tex) {
      const own = propMat.clone(`${file}:mat`);
      own.diffuseTexture = tex;
      m.material = own;
    } else m.material = propMat;
    teamColours(m, ['#1E3F86', '#2F64C8', '#5C8EE6', '#A9C6F4']);
    // as the board does (loadStaticMesh): bake the glTF handedness into the vertices, or the normals point inward
    if (!m.skeleton) {
      m.makeGeometryUnique();
      m.computeWorldMatrix(true);
      m.setParent(null);
      m.bakeCurrentTransformIntoVertices();
      m.scaling.setAll(scale);
      m.rotation.y = Math.PI;
      m.position.set(x + 0.5, 0, z + 0.5);
    }
    shadow.addShadowCaster(m);
  }
  if (r.meshes.some((m) => m instanceof Mesh && m.skeleton)) {
    const root = r.meshes[0]!;
    root.position.set(x + 0.5, 0, z + 0.5);
    root.scaling.scaleInPlace(scale);
    root.rotate(Vector3.Up(), Math.PI);
  }
}

const perRow = Math.max(...rows.map(([, l]) => l.length + 1));
const labels: Array<{ text: string; x: number; z: number; cls: string }> = [];
let z = 0;
const figure = q.get('figure') ?? 'fenn';
for (const [name, list] of rows) {
  labels.push({ text: name, x: 0, z: z + 1.5, cls: 'g' });
  for (let i = 0; i < perRow; i++) {
    const t = MeshBuilder.CreateBox('t', { width: 1, depth: 1, height: 0.05 }, scene);
    t.position.set(i + 0.5, -0.025, z + 0.5);
    t.material = i % 2 ? tileA : tileB;
    t.receiveShadows = true;
  }
  // scale reference: the first field of every row holds a figure
  await place(figure, 0, z, 1.3, q.get('figureDir') ?? '/assets/act1/models/units/').catch(() => undefined);
  let i = 1;
  for (const m of list) {
    await place(m, i, z);
    labels.push({ text: m, x: i + 0.5, z, cls: 'l' });
    i++;
  }
  z -= 2.6;
}

const depth = -z;
const tilt = (35 * Math.PI) / 180;
const cam = new ArcRotateCamera('c', -Math.PI / 2, tilt, 60, new Vector3(perRow / 2, 0.4, z / 2 + 1.6), scene);
cam.mode = Camera.ORTHOGRAPHIC_CAMERA;
const aspect = engine.getRenderWidth() / engine.getRenderHeight();
const h = Math.max(((depth * Math.cos(tilt) + 1.6) / 2) * 1.04, (perRow / aspect / 2) * 1.02);
cam.orthoTop = h;
cam.orthoBottom = -h;
cam.orthoLeft = -h * aspect;
cam.orthoRight = h * aspect;
scene.render();
const vp = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
const k = canvas.clientWidth / engine.getRenderWidth();
for (const l of labels) {
  const p = Vector3.Project(new Vector3(l.x, 0, l.z), Matrix.Identity(), scene.getTransformMatrix(), vp);
  const d = document.createElement('div');
  d.className = l.cls;
  d.textContent = l.text;
  d.style.left = `${p.x * k}px`;
  d.style.top = `${p.y * k + 2}px`;
  document.body.append(d);
}
engine.runRenderLoop(() => scene.render());
(window as unknown as { catalogReady: boolean }).catalogReady = true;
