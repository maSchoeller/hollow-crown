/**
 * Light of a scene (concept/23-art-direction §2.4, §2.5): ambient sky light and the sun from a compass bearing and an
 * elevation. What the values are – map, time of day, season, weather – is worked out by `resolveLook` (look.ts).
 */
import type { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import type { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { DEFAULT_AMBIENT, DEFAULT_SUN, type AmbientDef, type SunDef } from './look';

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
