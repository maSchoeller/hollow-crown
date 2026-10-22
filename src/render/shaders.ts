import { Effect } from '@babylonjs/core/Materials/effect';
import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';

/** Max point lights per frame (concept/16 §7: up to 16 on "high"). */
export const MAX_LIGHTS = 16;

const LIGHTING = /* glsl */ `
uniform vec3 ambient;
uniform vec4 lightPos[${MAX_LIGHTS}];   // xy world (art px), z height, w radius
uniform vec4 lightColor[${MAX_LIGHTS}]; // rgb, a = intensity
uniform int lightCount;

vec3 lighting(vec3 worldPos, vec3 n) {
  vec3 l = ambient;
  for (int i = 0; i < ${MAX_LIGHTS}; i++) {
    if (i >= lightCount) break;
    vec4 lp = lightPos[i];
    vec3 d = vec3(lp.xy - worldPos.xy, lp.z);
    float dist = length(d.xy);
    float att = clamp(1.0 - dist / lp.w, 0.0, 1.0);
    att *= att;
    float lam = clamp(dot(n, normalize(d)), 0.0, 1.0) * 0.7 + 0.3;
    l += lightColor[i].rgb * lightColor[i].a * att * lam;
  }
  return l;
}
`;

Effect.ShadersStore['hcSpriteVertexShader'] = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec4 uvRect;
attribute vec4 params;
attribute vec4 params2;
#include<instancesDeclaration>
uniform mat4 viewProjection;
varying vec2 vUV;
varying vec4 vParams;
varying vec4 vParams2;
varying vec3 vWorld;
void main() {
  #include<instancesVertex>
  vec4 wp = finalWorld * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec2 u = uv;
  if (params2.x > 0.5) u.x = 1.0 - u.x;
  vUV = uvRect.xy + u * uvRect.zw;
  vParams = params;
  vParams2 = params2;
  gl_Position = viewProjection * wp;
}
`;

Effect.ShadersStore['hcSpriteFragmentShader'] = /* glsl */ `
precision highp float;
uniform sampler2D colorMap;
uniform sampler2D normalMap;
uniform float useNormals;
uniform vec3 teamRamp[12];
varying vec2 vUV;
varying vec4 vParams;  // team, desaturate, flash, alpha
varying vec4 vParams2; // flipX, outline, unlit, 0
varying vec3 vWorld;
${LIGHTING}
void main() {
  vec4 c = texture2D(colorMap, vUV);
  if (c.a < 0.5) discard;
  // team cloth: magenta key ramp (#400040 … #FF00FF) → team colour ramp
  if (c.g < 0.02 && abs(c.r - c.b) < 0.02 && c.r > 0.2) {
    int lvl = int(clamp(floor(c.r * 4.0 + 0.5) - 1.0, 0.0, 3.0));
    int team = int(vParams.x + 0.5);
    int idx = team * 4 + lvl;
    for (int i = 0; i < 12; i++) if (i == idx) c.rgb = teamRamp[i];
  }
  vec3 n = vec3(0.0, 0.0, 1.0);
  if (useNormals > 0.5) {
    vec3 nm = texture2D(normalMap, vUV).rgb * 2.0 - 1.0;
    if (vParams2.x > 0.5) nm.x = -nm.x;
    n = normalize(vec3(nm.x, nm.y, max(nm.z, 0.2)));
  }
  vec3 lit = vParams2.z > 0.5 ? vec3(1.0) : lighting(vWorld, n);
  vec3 col = c.rgb * lit;
  float g = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(g) * vec3(0.92, 0.95, 1.05), vParams.y);
  col = mix(col, vec3(1.0), vParams.z);
  gl_FragColor = vec4(col, vParams.w);
}
`;

Effect.ShadersStore['hcGroundVertexShader'] = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 world;
uniform mat4 viewProjection;
varying vec2 vUV;
varying vec3 vWorld;
void main() {
  vec4 wp = world * vec4(position, 1.0);
  vWorld = wp.xyz;
  vUV = uv;
  gl_Position = viewProjection * wp;
}
`;

Effect.ShadersStore['hcGroundFragmentShader'] = /* glsl */ `
precision highp float;
uniform sampler2D colorMap;
uniform float alpha;
varying vec2 vUV;
varying vec3 vWorld;
${LIGHTING}
void main() {
  vec4 c = texture2D(colorMap, vUV);
  if (c.a < 0.01) discard;
  vec3 col = c.rgb * lighting(vWorld, vec3(0.0, 0.0, 1.0));
  gl_FragColor = vec4(col, c.a * alpha);
}
`;

/** Overlay quads (move/attack/danger/path): flat colour with alpha, unlit. */
Effect.ShadersStore['hcOverlayVertexShader'] = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec4 tint;
attribute vec4 uvRect;
#include<instancesDeclaration>
uniform mat4 viewProjection;
varying vec4 vColor;
varying vec2 vUV;
void main() {
  #include<instancesVertex>
  vColor = tint;
  vUV = uvRect.xy + uv * uvRect.zw;
  gl_Position = viewProjection * finalWorld * vec4(position, 1.0);
}
`;

Effect.ShadersStore['hcOverlayFragmentShader'] = /* glsl */ `
precision highp float;
uniform sampler2D maskMap;
varying vec4 vColor;
varying vec2 vUV;
void main() {
  vec4 m = texture2D(maskMap, vUV);
  if (m.a * vColor.a < 0.01) discard;
  gl_FragColor = vec4(vColor.rgb * m.rgb, vColor.a * m.a);
}
`;
