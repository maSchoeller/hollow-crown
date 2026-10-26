/**
 * Material plug-in of the board's figures (story 8.6, concept/23-art-direction §2.1, §2.5):
 *  - team cloth is not lit: where the vertex alpha carries a team key (< 0.9) the colour is the team's ramp colour as it is
 *    (modulated only by the unit's desaturation and flash), whatever the sun, the night or the mist do;
 *  - the rest of the figure never gets darker than `floor` times its base colour (the floor of the time of day, for figures only);
 *  - a weak rim light on the figure's edges (night).
 * One plug-in variant serves all figures: the materials are shared per scene (story 7.7), the values come from one `FigureLook`
 * per scene and are uniforms, so a change of look needs no new shader.
 */
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase';
import type { MaterialDefines } from '@babylonjs/core/Materials/materialDefines';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import type { LookDef, Team } from '../../core/defs';

/** What the figures of a scene share: team ramps (hex) and the values of the plug-in's uniforms. */
export interface FigureLook {
  teams: Record<Team, string[]>;
  /** grey of the neutral texture under the cloth of image-to-3D figures (divided out of the unlit cloth colour) */
  clothGrey: number;
  /** minimum brightness as a multiple of the base colour; 0 = off */
  floor: number;
  /** rim light colour (0–1 per channel) and strength; 0 = off */
  rim: [number, number, number, number];
}

export function newFigureLook(look: LookDef): FigureLook {
  const cloth = (ramp: readonly string[]) => look.clothSteps.map((i) => ramp[i]!);
  return {
    teams: { player: cloth(look.teams.player.ramp), enemy: cloth(look.teams.enemy.ramp), other: cloth(look.teams.other.ramp) },
    clothGrey: look.clothGrey,
    floor: 0,
    rim: [1, 1, 1, 0],
  };
}

export class FigurePlugin extends MaterialPluginBase {
  constructor(
    material: StandardMaterial,
    private look: FigureLook,
  ) {
    super(material, 'HcFigure', 220, { HC_FIGURE: false });
    this._enable(true);
  }

  override getClassName(): string {
    return 'HcFigurePlugin';
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines['HC_FIGURE'] = true;
  }

  override getUniforms() {
    return {
      ubo: [
        { name: 'hcRim', size: 4, type: 'vec4' },
        { name: 'hcLevels', size: 4, type: 'vec4' },
      ],
      fragment: `#ifdef HC_FIGURE
uniform vec4 hcRim;
uniform vec4 hcLevels;
#endif`,
    };
  }

  override bindForSubMesh(ubo: UniformBuffer): void {
    const l = this.look;
    ubo.updateFloat4('hcRim', l.rim[0], l.rim[1], l.rim[2], l.rim[3]);
    ubo.updateFloat4('hcLevels', l.floor, l.clothGrey, 0, 0);
  }

  override getCustomCode(shaderType: string): { [pointName: string]: string } | null {
    if (shaderType === 'vertex') {
      return {
        CUSTOM_VERTEX_DEFINITIONS: `#ifdef HC_FIGURE
varying float vHcCloth;
#endif`,
        // the team key sits in the alpha of the vertex colour; the standard shader drops it without VERTEXALPHA
        CUSTOM_VERTEX_MAIN_END: `#ifdef HC_FIGURE
#ifdef VERTEXCOLOR
vHcCloth = color.a;
#else
vHcCloth = 1.0;
#endif
#endif`,
      };
    }
    return {
      CUSTOM_FRAGMENT_DEFINITIONS: `#ifdef HC_FIGURE
varying float vHcCloth;
#endif`,
      // before the fog: floor and rim go through the mist like the rest of the figure
      CUSTOM_FRAGMENT_BEFORE_FOG: `#ifdef HC_FIGURE
color.rgb = max(color.rgb, baseColor.rgb * hcLevels.x);
float hcEdge = 1.0 - clamp(dot(normalW, viewDirectionW), 0.0, 1.0);
color.rgb += hcRim.rgb * (hcEdge * hcEdge * hcRim.a);
#endif`,
      // team cloth last: unlit and without mist (legibility rule of §2.5), still dimmed by desaturation and lit by the hit flash
      CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `#ifdef HC_FIGURE
#ifdef VERTEXCOLOR
if (vHcCloth < 0.9) {
vec3 hcCloth = vColor.rgb;
#ifdef DIFFUSE
hcCloth = baseColor.rgb / hcLevels.y;
#endif
color.rgb = hcCloth * vDiffuseColor.rgb + vEmissiveColor;
}
#endif
#endif`,
    };
  }
}
