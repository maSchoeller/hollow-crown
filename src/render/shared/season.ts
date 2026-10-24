/**
 * Light of a scene (concept/23-art-direction §2.4, §2.5): ambient sky light and the sun from a compass bearing and an
 * elevation. Board maps set it per map, the world map per season of the act.
 */
import type { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import type { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';

export interface AmbientDef {
  color: string;
  intensity: number;
}

export interface SunDef {
  color: string;
  intensity: number;
  /** compass bearing: 0 = north (+Z), 90 = east (+X) */
  azimuthDeg: number;
  elevationDeg: number;
}

const DEFAULT_AMBIENT: AmbientDef = { color: '#ffffff', intensity: 1 };
const DEFAULT_SUN: SunDef = { color: '#fff4e0', intensity: 1, azimuthDeg: 300, elevationDeg: 50 };

export function applyLight(hemi: HemisphericLight, sun: DirectionalLight, ambient: AmbientDef = DEFAULT_AMBIENT, s: SunDef = DEFAULT_SUN): void {
  hemi.diffuse = Color3.FromHexString(ambient.color);
  hemi.groundColor = Color3.FromHexString(ambient.color).scale(0.35);
  hemi.intensity = ambient.intensity * 0.6;
  const az = (s.azimuthDeg * Math.PI) / 180;
  const el = (s.elevationDeg * Math.PI) / 180;
  // the light travels away from the sun
  sun.direction.set(-Math.sin(az) * Math.cos(el), -Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.position = sun.direction.scale(-40);
  sun.diffuse = Color3.FromHexString(s.color);
  sun.specular = new Color3(0.2, 0.2, 0.2);
  sun.intensity = s.intensity;
}
