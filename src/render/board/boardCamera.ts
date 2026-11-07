/**
 * Camera of the battle board: tilted orthographic view, zoom steps, framing, clamping, shake and freeze.
 * Part of the class chain BoardBase → BoardSetup → BoardProps → BoardUnits → BoardCamera → BoardFrame → BoardView.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Pos } from '../../core';
import { centreOn, clampAxis, framePlan, inFreeArea, NO_INSETS, type Insets } from '../shared/camera';
import { figureAt, marchToTile, type RaisedFigure } from './picking';
import { CAM_DIST, OFFSCREEN_TILES, sleep } from './boardBase';
import { BoardUnits } from './boardUnits';

/** From this height on (tiles) a figure no longer stands on the tile a tap at its body falls on. */
const RAISED = 0.3;

export abstract class BoardCamera extends BoardUnits {
  // ------------------------------------------------------------------ camera


  protected cssSize(): { w: number; h: number } {
    if (this.size) return this.size;
    const r = this.canvas.getBoundingClientRect();
    const size = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    // without an observer (no ResizeObserver) the size is measured anew on each call, as before
    if (this.sizeObserver) this.size = size;
    return size;
  }

  protected cosTilt(): number {
    return this.basis().cos;
  }

  /** Pixels per tile of zoom step `step`; one step past the last of render.yaml is "whole map" (story 13.9). */
  protected pptFor(step: number): number {
    const { w, h } = this.cssSize();
    const steps = this.data.render.camera.zoomSteps;
    const far = Math.min(w, h) / steps[Math.max(0, Math.min(steps.length - 1, step))]!;
    if (step < steps.length || !this.state) return far;
    const css = this.hooks.insets?.() ?? NO_INSETS;
    const m = this.data.render.legibility.view.wholeMapMargin;
    const fit = Math.min((w - css.left - css.right) / (this.state.width + 2 * m), (h - css.top - css.bottom) / ((this.state.height + 2 * m) * this.cosTilt()));
    return Math.max(1, Math.min(far, fit));
  }

  /** The zoom step "whole map" (story 13.9, PC: M): shows the map in the free area; again (or zooming in) returns to the farthest step. */
  wholeMap(on = this.step < this.data.render.camera.zoomSteps.length): void {
    const steps = this.data.render.camera.zoomSteps.length;
    const next = on ? steps : steps - 1;
    if (next === this.step) return;
    this.zoomTo(next);
  }

  /** Is the camera on the zoom step "whole map" (story 15.11)? */
  isWholeMap(): boolean {
    return this.step >= this.data.render.camera.zoomSteps.length;
  }

  /** Tells the UI when the camera went to the whole map or left it. */
  private wholeShown: boolean | null = null;
  protected noteWholeMap(): void {
    const on = this.isWholeMap();
    if (on === this.wholeShown) return;
    this.wholeShown = on;
    this.hooks.onWholeMap?.(on);
  }

  /**
   * From the whole map back to the farthest normal step, centred on `p` (story 15.11: a tap in the overview jumps there).
   * Does nothing when the camera is not on the whole map.
   */
  zoomInAt(p: Pos): Promise<void> {
    if (!this.isWholeMap()) return Promise.resolve();
    const next = this.data.render.camera.zoomSteps.length - 1;
    this.step = next;
    this.noteWholeMap();
    const ppt = this.pptFor(next);
    this.zoomTween = { from: this.ppt, to: ppt, start: performance.now() };
    const css = this.hooks.insets?.() ?? NO_INSETS;
    const kv = 1 / ppt / this.cosTilt();
    const tx = centreOn(p[0] + 0.5, css.left / ppt, css.right / ppt);
    const ty = centreOn(p[1] + 0.5, css.top * kv, css.bottom * kv);
    if (this.skip) {
      this.ppt = ppt;
      this.zoomTween = null;
      this.camX = tx;
      this.camY = ty;
      this.clampCamera();
      return Promise.resolve();
    }
    const fx = this.camX;
    const fy = this.camY;
    this.wake();
    return this.tween(Math.max(1, this.data.render.camera.zoomMs), (t) => {
      this.camX = fx + (tx - fx) * t;
      this.camY = fy + (ty - fy) * t;
      this.clampCamera();
    });
  }

  protected zoomTo(next: number): void {
    const whole = next === this.data.render.camera.zoomSteps.length;
    this.step = next;
    this.noteWholeMap();
    this.zoomTween = { from: this.ppt, to: this.pptFor(next), start: performance.now() };
    if (whole && this.state) {
      // the whole map sits in the middle of the free area
      const css = this.hooks.insets?.() ?? NO_INSETS;
      const ppt = this.zoomTween.to;
      const kv = 1 / ppt / this.cosTilt();
      const tx = centreOn(this.state.width / 2, css.left / ppt, css.right / ppt);
      const ty = centreOn(this.state.height / 2, css.top * kv, css.bottom * kv);
      const fx = this.camX;
      const fy = this.camY;
      void this.tween(Math.max(1, this.data.render.camera.zoomMs), (t) => {
        this.camX = fx + (tx - fx) * t;
        this.camY = fy + (ty - fy) * t;
      });
    }
    this.wake();
  }

  /** HUD insets in ground tiles (vertical ones stretched by the tilt). */
  protected hudInsets(): Insets {
    const css = this.hooks.insets?.() ?? NO_INSETS;
    const k = 1 / this.ppt;
    const kv = k / this.cosTilt();
    return { top: css.top * kv, right: css.right * k, bottom: css.bottom * kv, left: css.left * k };
  }

  protected fitCamera(): void {
    const s = this.state;
    this.step = Math.min(1, this.data.render.camera.zoomSteps.length - 1);
    this.noteWholeMap();
    this.ppt = this.pptFor(this.step);
    const player = s.units.filter((u) => u.team === 'player' && u.pos);
    let cx = s.width / 2;
    let cy = s.height / 2;
    if (player.length) {
      cx = player.reduce((t, u) => t + u.pos![0], 0) / player.length + 0.5;
      cy = player.reduce((t, u) => t + u.pos![1], 0) / player.length + 0.5;
    }
    const hud = this.hudInsets();
    this.camX = centreOn(cx, hud.left, hud.right);
    this.camY = centreOn(cy, hud.top, hud.bottom);
    // the opening view stays on the map; the margin is for dragging
    this.clampCamera(0);
  }

  /** Keeps the map reachable around the HUD: each edge may be pushed into the free area by the configured margin (D10). */
  protected clampCamera(margin = this.data.render.camera.margin): void {
    if (!this.state) return;
    const { w, h } = this.cssSize();
    const hud = this.hudInsets();
    this.camX = clampAxis(this.camX, w / this.ppt, hud.left, hud.right, this.state.width, margin);
    this.camY = clampAxis(this.camY, h / this.ppt / this.cosTilt(), hud.top, hud.bottom, this.state.height, margin);
  }

  /** Call when the HUD changed size. */
  relayout(): void {
    this.clampCamera();
    this.wake();
  }

  /** Steps through the zoom levels of render.yaml (D9): +1 = closer. */
  zoom(delta: number): void {
    const steps = this.data.render.camera.zoomSteps.length;
    // zooming out past the farthest step shows the whole map (story 13.9)
    const next = Math.max(0, Math.min(steps, this.step - Math.sign(delta)));
    if (next === this.step) return;
    this.zoomTo(next);
  }

  centerOn(p: Pos, smooth = true): Promise<void> {
    const hud = this.hudInsets();
    const tx = centreOn(p[0] + 0.5, hud.left, hud.right);
    const ty = centreOn(p[1] + 0.5, hud.top, hud.bottom);
    if (!smooth || this.skip) {
      this.camX = tx;
      this.camY = ty;
      this.clampCamera();
      return Promise.resolve();
    }
    const fx = this.camX;
    const fy = this.camY;
    return this.tween(this.data.render.aiPace.play.glide, (t) => {
      this.camX = fx + (tx - fx) * t;
      this.camY = fy + (ty - fy) * t;
      this.clampCamera();
    });
  }

  /**
   * Goal marking: brings the marked fields into view. Fields already comfortably on screen: nothing moves. Otherwise the camera
   * glides to the middle of their bounding box and goes out zoom steps as far as needed (`framePlan`), never closer; it stays there
   * when the marking ends. Margin: render.yaml camera.markFrameMargin.
   */
  frameTiles(tiles: Pos[]): Promise<void> {
    if (!tiles.length || tiles.every((p) => this.isVisible(p))) return Promise.resolve();
    const { w, h } = this.cssSize();
    const css = this.hooks.insets?.() ?? NO_INSETS;
    const cam = this.data.render.camera;
    const plan = framePlan({ tiles, step: Math.min(this.step, cam.zoomSteps.length - 1), steps: cam.zoomSteps, viewW: w, viewH: h, hud: css, cosTilt: this.cosTilt(), margin: cam.markFrameMargin });
    const ppt = this.pptFor(plan.step);
    if (plan.step !== this.step) {
      this.step = plan.step;
      this.noteWholeMap();
      this.zoomTween = { from: this.ppt, to: ppt, start: performance.now() };
    }
    const kv = 1 / ppt / this.cosTilt();
    const tx = centreOn(plan.cx, css.left / ppt, css.right / ppt);
    const ty = centreOn(plan.cy, css.top * kv, css.bottom * kv);
    if (this.skip) {
      this.camX = tx;
      this.camY = ty;
      this.clampCamera();
      return Promise.resolve();
    }
    const fx = this.camX;
    const fy = this.camY;
    return this.tween(Math.max(220, cam.zoomMs), (t) => {
      this.camX = fx + (tx - fx) * t;
      this.camY = fy + (ty - fy) * t;
      this.clampCamera();
    });
  }

  /** Is the tile comfortably on screen, clear of the HUD? */
  isVisible(p: Pos): boolean {
    const { w, h } = this.cssSize();
    const hud = this.hudInsets();
    return inFreeArea(p[0] + 0.5, this.camX, w / this.ppt, hud.left, hud.right, 1) && inFreeArea(p[1] + 0.5, this.camY, h / this.ppt / this.cosTilt(), hud.top, hud.bottom, 1);
  }


  protected basis() {
    const tiltDeg = this.data.render.camera.tiltDeg;
    if (this.basisCache?.tiltDeg !== tiltDeg) {
      const t = (tiltDeg * Math.PI) / 180;
      const sin = Math.sin(t);
      const cos = Math.cos(t);
      this.basisCache = { tiltDeg, forward: new Vector3(0, -cos, sin), up: new Vector3(0, sin, cos), sin, cos };
    }
    return this.basisCache!;
  }


  protected updateCamera(now: number): void {
    if (this.zoomTween) {
      const k = Math.min(1, (now - this.zoomTween.start) / Math.max(1, this.data.render.camera.zoomMs));
      const e = 1 - Math.pow(1 - k, 3);
      this.ppt = this.zoomTween.from + (this.zoomTween.to - this.zoomTween.from) * e;
      this.clampCamera();
      if (k >= 1) this.zoomTween = null;
    }
    const { w, h } = this.cssSize();
    this.viewW = w;
    this.viewH = h;
    const { forward } = this.basis();
    if (this.shake && now > this.shakeEnd) this.shake = 0;
    const jitter = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const c = this.camSet;
    if (c.x === this.camX && c.y === this.camY && c.ppt === this.ppt && c.w === w && c.h === h && c.jitter === jitter) return;
    c.x = this.camX;
    c.y = this.camY;
    c.ppt = this.ppt;
    c.w = w;
    c.h = h;
    c.jitter = jitter;
    const target = new Vector3(this.camX + jitter, 0, -this.camY);
    this.camera.position.copyFrom(target.subtract(forward.scale(CAM_DIST)));
    this.camera.setTarget(target);
    this.camera.orthoLeft = -w / 2 / this.ppt;
    this.camera.orthoRight = w / 2 / this.ppt;
    this.camera.orthoTop = h / 2 / this.ppt;
    this.camera.orthoBottom = -h / 2 / this.ppt;
    // the weather's particles fall over what the camera sees, in the same density at every zoom
    const tilt = (this.data.render.camera.tiltDeg * Math.PI) / 180;
    const steps = this.data.render.camera.zoomSteps;
    const refPpt = Math.min(w, h) / steps[Math.min(1, steps.length - 1)]!;
    this.weather.follow(this.camX, -this.camY, w / 2 / this.ppt, h / 2 / this.ppt / Math.cos(tilt), tilt, (w * h) / (refPpt * refPpt * Math.cos(tilt)));
  }

  /** Shakes the camera by `strength` tiles for `ms` real ms (nothing in skip mode or when the option is off). */
  protected kick(strength: number, ms: number): void {
    if (!this.shakeEnabled || this.skip || strength <= 0) return;
    this.shake = Math.max(this.shake, strength);
    this.shakeEnd = Math.max(this.shakeEnd, performance.now() + ms);
    this.wake(ms + 100);
  }

  /** Everything stands still for `ms` (a critical hit's freeze): skeletons, effects and floating numbers stop, the frame is still drawn. */
  protected async freeze(ms: number): Promise<void> {
    if (ms <= 0 || this.skip) return;
    const t0 = performance.now();
    this.frozenAt = t0;
    this.scene.animationTimeScale = 0;
    await sleep(ms);
    const dt = performance.now() - t0;
    for (const f of this.fxSprites) f.start += dt;
    for (const f of this.floaters) f.start += dt;
    this.frozenAt = null;
    this.scene.animationTimeScale = 1;
  }

  /** World point → CSS px relative to the canvas (for HTML overlays and tests). */
  screenOfWorld(p: Vector3): { x: number; y: number } {
    return this.screenOfXYZ(p.x, p.y, p.z);
  }

  /** `screenOfWorld` for the three numbers: the frame's labels call it without making a vector each */
  protected screenOfXYZ(x: number, y: number, z: number): { x: number; y: number } {
    const { w, h } = this.cssSize();
    const { sin, cos } = this.basis();
    return { x: w / 2 + (x - this.camX) * this.ppt, y: h / 2 - (y * sin + (z + this.camY) * cos) * this.ppt };
  }


  /** Is the world point (x east, y up, z north) in the view, with room for a figure around its feet? Cheaper than a projection. */
  protected onScreen(x: number, y: number, z: number): boolean {
    const { sin, cos } = this.basis();
    const rx = x - this.camX;
    const rz = z + this.camY;
    const sx = this.viewW / 2 + rx * this.ppt;
    const sy = this.viewH / 2 - (y * sin + rz * cos) * this.ppt;
    const m = this.ppt * OFFSCREEN_TILES;
    return sx > -m && sx < this.viewW + m && sy > -m * 2 && sy < this.viewH + m;
  }

  /** Ground point of tile coordinates (x east, y south, in tiles) at height `h` → CSS px. */
  screenOf(x: number, y: number, h = 0): { x: number; y: number } {
    return this.screenOfXYZ(x, h, -y);
  }

  /** Screen (CSS px) → tile: marches the view ray down through the terrain heights. */
  /** Figures a tap on the tile below them would miss: on a raised tile, or behind one that hides their tile (height levels). */
  protected raisedFigures(): RaisedFigure[] {
    const terrain = this.terrain;
    if (!terrain || !this.state) return [];
    const out: RaisedFigure[] = [];
    for (const u of this.state.units) {
      if (!u.pos || u.gone) continue;
      const [x, y] = u.pos;
      const top = terrain.standOn(x, y);
      const south = terrain.topOf(x, y + 1) ?? 0;
      if (top >= RAISED || south - top >= RAISED) out.push({ tile: [x, y], top });
    }
    return out;
  }

  tileAt(clientX: number, clientY: number): Pos | null {
    if (!this.terrain || !this.state) return null;
    const r = this.canvas.getBoundingClientRect();
    const { forward, up } = this.basis();
    const sx = (clientX - r.left - r.width / 2) / this.ppt;
    const sy = (r.height / 2 - (clientY - r.top)) / this.ppt;
    const origin = new Vector3(this.camX + sx, 0, -this.camY).add(up.scale(sy));
    const terrain = this.terrain;
    return figureAt(origin, up, this.raisedFigures()) ?? marchToTile(origin, forward, (x, y) => terrain.topOf(x, y));
  }
}
