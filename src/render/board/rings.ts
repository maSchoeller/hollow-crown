/**
 * The team rings under the units (story 7.7): one flat disc per team drawn as thin instances, so forty rings are three draw
 * calls and three materials instead of forty of each. A ring is a slot (position, opacity); a hidden ring (downed, gone,
 * fading) is scaled to nothing. The buffers are uploaded only when a ring changed.
 */
import type { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Team } from '../../core';

const RADIUS = 0.36;
const TEAMS: Team[] = ['player', 'enemy', 'other'];

interface Slot {
  uid: string;
  x: number;
  y: number;
  z: number;
  alpha: number;
}

/** The rings of one team: the disc mesh with its thin-instance buffers and the slots filling them. */
class TeamRings {
  readonly mesh: Mesh;
  private material: StandardMaterial;
  private slots: Slot[] = [];
  private byUid = new Map<string, Slot>();
  private matrices = new Float32Array(16 * 16);
  private colours = new Float32Array(16 * 4);
  private dirty = true;

  constructor(scene: Scene, team: Team, colour: string) {
    this.mesh = CreateDisc(`rings:${team}`, { radius: RADIUS, tessellation: 32 }, scene);
    // flat on the ground: the disc faces +z, turned up once instead of in every instance
    this.mesh.bakeTransformIntoVertices(Matrix.RotationX(Math.PI / 2));
    this.mesh.isPickable = false;
    this.mesh.alwaysSelectAsActiveMesh = true;
    this.mesh.doNotSyncBoundingInfo = true;
    // blends with the opacity of each instance (its colour buffer); drawn before the other blended meshes, as the units are
    this.mesh.hasVertexAlpha = true;
    this.mesh.alphaIndex = -1;
    const m = new StandardMaterial(`rings:${team}`, scene);
    m.disableLighting = true;
    m.fogEnabled = false; // legibility rule (art-direction 2.5): rings are never tinted by scene light or mist
    m.emissiveColor = Color3.FromHexString(colour);
    m.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
    m.zOffset = -1;
    this.mesh.material = m;
    this.material = m;
    this.upload(true);
  }

  add(uid: string): void {
    if (this.byUid.has(uid)) return;
    const slot = { uid, x: 0, y: 0, z: 0, alpha: 0 };
    this.slots.push(slot);
    this.byUid.set(uid, slot);
    this.dirty = true;
  }

  remove(uid: string): void {
    const slot = this.byUid.get(uid);
    if (!slot) return;
    this.slots.splice(this.slots.indexOf(slot), 1);
    this.byUid.delete(uid);
    this.dirty = true;
  }

  /** Puts the ring of `uid` at a ground point with an opacity (0 hides it). */
  set(uid: string, x: number, y: number, z: number, alpha: number): void {
    const s = this.byUid.get(uid);
    if (!s || (s.x === x && s.y === y && s.z === z && s.alpha === alpha)) return;
    s.x = x;
    s.y = y;
    s.z = z;
    s.alpha = alpha;
    this.dirty = true;
  }

  flush(): void {
    if (this.dirty) this.upload(false);
  }

  private upload(first: boolean): void {
    const n = this.slots.length;
    const grown = n * 16 > this.matrices.length;
    if (grown) {
      const cap = Math.max(n, this.matrices.length / 16) * 2;
      this.matrices = new Float32Array(cap * 16);
      this.colours = new Float32Array(cap * 4);
    }
    this.slots.forEach((s, i) => {
      const hidden = s.alpha <= 0;
      // translation matrix, or a zero scale that draws nothing
      const k = hidden ? 0 : 1;
      // written by index: no array literal per slot and frame (story 7.8); the unset cells stay 0 from the buffer's start
      const m = this.matrices;
      const o = i * 16;
      m[o] = k;
      m[o + 5] = k;
      m[o + 10] = k;
      m[o + 12] = s.x;
      m[o + 13] = s.y;
      m[o + 14] = s.z;
      m[o + 15] = 1;
      const c = this.colours;
      const q = i * 4;
      c[q] = 1;
      c[q + 1] = 1;
      c[q + 2] = 1;
      c[q + 3] = s.alpha;
    });
    this.mesh.thinInstanceCount = n;
    this.mesh.isVisible = n > 0;
    if (first || grown) {
      this.mesh.thinInstanceSetBuffer('matrix', this.matrices, 16, false);
      this.mesh.thinInstanceSetBuffer('color', this.colours, 4, false);
    } else {
      this.mesh.thinInstanceBufferUpdated('matrix');
      this.mesh.thinInstanceBufferUpdated('color');
    }
    this.dirty = false;
  }

  dispose(): void {
    this.mesh.dispose();
    this.material.dispose();
  }
}

export class RingLayer {
  private teams: Record<Team, TeamRings>;
  private teamOf = new Map<string, Team>();

  constructor(scene: Scene, colours: Record<Team, string>) {
    this.teams = Object.fromEntries(TEAMS.map((t) => [t, new TeamRings(scene, t, colours[t])])) as Record<Team, TeamRings>;
  }

  add(uid: string, team: Team): void {
    this.teamOf.set(uid, team);
    this.teams[team].add(uid);
  }

  remove(uid: string): void {
    const team = this.teamOf.get(uid);
    if (team) this.teams[team].remove(uid);
    this.teamOf.delete(uid);
  }

  /** Ring of `uid` at the ground point (x, y, z), opacity `alpha` (0: hidden). */
  place(uid: string, x: number, y: number, z: number, alpha: number): void {
    const team = this.teamOf.get(uid);
    if (team) this.teams[team].set(uid, x, y, z, alpha);
  }

  /** Writes the changed buffers to the GPU; once per frame after all rings were placed. */
  flush(): void {
    for (const t of TEAMS) this.teams[t].flush();
  }

  dispose(): void {
    for (const t of TEAMS) this.teams[t].dispose();
    this.teamOf.clear();
  }
}
