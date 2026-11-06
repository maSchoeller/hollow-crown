/**
 * Film scenes (epic 16): the battle board as a stage. It loads the film's map and actors like a battle, then drops the
 * tilted orthographic view for a perspective camera that follows the shots of the film; figures walk the film's paths and
 * play its gestures. The UI (Film.tsx) shows the lines over it and calls `cut` per line; no game rule runs here.
 */
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { BattleState, FilmDef, FilmEye, FilmPoint, FilmShotDef } from '../../core';
import { actorSpot, alongPath, cameraAt, facingTowards } from '../../core';
import { BoardView } from '../board/board';
import type { UnitView } from '../board/boardBase';
import type { FigureAnim } from '../shared/figures';
import { applyFilmLook, type FilmLook } from './filmLook';

interface Walk {
  uid: string;
  path: FilmPoint[];
  start: number;
  ms: number;
}

/** Tile point and height → world point (x east, y up, z north), like the board places its figures. */
const world = (e: FilmEye): Vector3 => new Vector3(e[0] + 0.5, e[1], -e[2] - 0.5);

export class FilmView extends BoardView {
  private film: FilmDef | null = null;
  private shot: FilmShotDef | null = null;
  private shotStart = 0;
  private walks: Walk[] = [];
  private filmLook: FilmLook | null = null;

  /** Builds the stage: map, actors at their marks, no badges or rings. */
  async loadFilm(film: FilmDef, state: BattleState): Promise<void> {
    this.film = film;
    this.hpBars = 'off';
    await this.load(state);
    for (const a of film.actors) {
      const v = this.units.get(a.id);
      if (!v) continue;
      v.x = a.at[0];
      v.y = a.at[1];
      v.facing = a.facing ?? 's';
    }
    const def = this.data.render.film;
    if (def && !this.disposed) {
      const map = this.data.maps[film.map];
      const centre: [number, number] = map ? [map.size[0] / 2, -map.size[1] / 2] : [0, 0];
      this.filmLook = await applyFilmLook(this.scene, this.camera, def, this.quality, { sun: this.sun, hemi: this.hemi }, centre);
      if (this.disposed) this.filmLook.dispose();
    }
  }

  override dispose(): void {
    this.filmLook?.dispose();
    this.filmLook = null;
    super.dispose();
  }

  /** Shows the shot of a line; `fresh` starts its camera move, walks and gestures (a held shot only keeps going). */
  cut(shot: FilmShotDef, fresh: boolean, now = performance.now()): void {
    if (!this.film || (!fresh && this.shot === shot)) return;
    // walks of the shot before end where they were going, so a skipped line never leaves a figure halfway
    this.finishWalks();
    const index = this.film.shots.indexOf(shot);
    // a jump (lines filtered, or the player skipped ahead): every actor stands where the earlier shots left it
    for (const a of this.film.actors) {
      const v = this.units.get(a.id);
      const at = actorSpot(this.film, a.id, index - 1);
      if (v && at) [v.x, v.y] = at;
    }
    this.shot = shot;
    this.shotStart = now;
    for (const m of shot.moves ?? []) {
      const v = this.units.get(m.actor);
      if (!v) continue;
      this.walks.push({ uid: m.actor, path: m.path, start: now, ms: m.ms });
      this.setAnim(v, 'walk');
    }
    for (const g of shot.gestures ?? []) {
      const v = this.units.get(g.actor);
      if (!v) continue;
      if (g.face) v.facing = facingTowards([v.x, v.y], g.face);
      if (g.anim) this.setAnim(v, g.anim as FigureAnim);
    }
    this.wake(shot.camera.ms + 200);
  }

  /** The film is over or skipped: everyone at the last marks. */
  finishWalks(): void {
    for (const w of this.walks) {
      const v = this.units.get(w.uid);
      if (!v) continue;
      [v.x, v.y] = w.path[w.path.length - 1]!;
      this.setAnim(v, 'idle');
    }
    this.walks = [];
  }

  override busy(now: number): boolean {
    return !!this.shot || super.busy(now);
  }

  protected override updateCamera(now: number): void {
    const shot = this.shot;
    if (!shot) return super.updateCamera(now);
    const c = shot.camera;
    const { from, to } = cameraAt(c, c.ms > 0 ? (now - this.shotStart) / c.ms : 1);
    this.camera.mode = Camera.PERSPECTIVE_CAMERA;
    this.camera.fov = (c.fov * Math.PI) / 180;
    this.camera.minZ = 0.05;
    this.camera.position.copyFrom(world(from));
    this.camera.setTarget(world(to));
    this.filmLook?.focus(Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]));
    this.stepWalks(now);
  }

  private stepWalks(now: number): void {
    this.walks = this.walks.filter((w) => {
      const v = this.units.get(w.uid);
      if (!v) return false;
      const k = Math.min(1, (now - w.start) / Math.max(1, w.ms));
      const p = alongPath(w.path, k);
      if (k < 1) {
        const ahead = alongPath(w.path, Math.min(1, k + 0.05));
        if (ahead[0] !== p[0] || ahead[1] !== p[1]) v.facing = facingTowards(p, ahead);
      }
      [v.x, v.y] = p;
      if (k >= 1) this.setAnim(v, 'idle');
      return k < 1;
    });
  }

  /** The perspective camera sees past the board's view rectangle: no figure is switched off. */
  protected override onScreen(): boolean {
    return true;
  }

  protected override placeUnit(v: UnitView, now: number): void {
    super.placeUnit(v, now);
    // no team rings under the actors
    this.rings.place(v.uid, 0, 0, 0, 0);
  }
}
