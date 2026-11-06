/**
 * Snow caps of way B (story 15.15, `concept/23-art-direction/map-assets/jahreszeiten-plan.md`): a material plug-in mixes white into
 * whatever face of a prop looks up, ragged by a little world-space noise, so rocks, roofs and small props carry snow without a
 * model of their own. Values from render.yaml `board.snow.winter`; the models that bring their own snow are skipped by the caller
 * (`takesSnow`). Figures never get it: they have their own materials (`figurePlugin.ts`).
 *
 * The snow sits after the diffuse texture and the vertex/instance colour, before the lights: it is lit like the prop and darkened
 * like the rest of a scenery prop around the map (the grey instance colour).
 */
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase';
import type { MaterialDefines } from '@babylonjs/core/Materials/materialDefines';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { SnowDef } from '../../core/renderDefs';

export class SnowPlugin extends MaterialPluginBase {
  private readonly color: Color3;

  constructor(
    material: StandardMaterial,
    private readonly def: SnowDef,
  ) {
    super(material, 'HcSnow', 210, { HC_SNOW: false });
    // the standard material works in gamma space like the painted textures: the colour as written
    this.color = Color3.FromHexString(def.color);
    this._enable(true);
  }

  override getClassName(): string {
    return 'HcSnowPlugin';
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines['HC_SNOW'] = true;
  }

  override getUniforms() {
    return {
      ubo: [
        { name: 'hcSnowColor', size: 3, type: 'vec3' },
        { name: 'hcSnow', size: 4, type: 'vec4' },
        { name: 'hcSnowCover', size: 1, type: 'float' },
      ],
      fragment: `#ifdef HC_SNOW
uniform vec3 hcSnowColor;
uniform vec4 hcSnow;
uniform float hcSnowCover;
#endif`,
    };
  }

  override bindForSubMesh(ubo: UniformBuffer): void {
    const d = this.def;
    ubo.updateColor3('hcSnowColor', this.color);
    ubo.updateFloat4('hcSnow', d.from, d.to, d.ragged, d.scale);
    ubo.updateFloat('hcSnowCover', d.cover);
  }

  override getCustomCode(shaderType: string): { [pointName: string]: string } | null {
    if (shaderType !== 'fragment') return null;
    return {
      CUSTOM_FRAGMENT_DEFINITIONS: `#ifdef HC_SNOW
float hcSnowHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hcSnowNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hcSnowHash(i), hcSnowHash(i + vec2(1.0, 0.0)), f.x), mix(hcSnowHash(i + vec2(0.0, 1.0)), hcSnowHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
#endif`,
      CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `#ifdef HC_SNOW
{
  vec2 hcP = vPositionW.xz * hcSnow.w;
  float hcN = hcSnowNoise(hcP) * 0.65 + hcSnowNoise(hcP * 2.7 + 17.0) * 0.35;
  float hcUp = normalW.y + (hcN - 0.5) * hcSnow.z;
  float hcS = smoothstep(hcSnow.x, hcSnow.y, hcUp) * hcSnowCover;
  vec3 hcWhite = hcSnowColor;
#if defined(VERTEXCOLOR) || (defined(INSTANCESCOLOR) && defined(INSTANCES))
  hcWhite *= max(vColor.r, max(vColor.g, vColor.b));
#endif
  baseColor.rgb = mix(baseColor.rgb, hcWhite, hcS);
}
#endif`,
    };
  }
}

/** Puts snow on `material` once (a template's own material, or the shared prop material's winter twin). */
export function addSnow(material: StandardMaterial, def: SnowDef): void {
  if (!material.pluginManager?.getPlugin('HcSnow')) new SnowPlugin(material, def);
}
