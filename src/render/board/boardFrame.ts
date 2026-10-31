/**
 * Input, the frame loop, effect sprites, floating text and the tween helpers of the battle board.
 * Part of the class chain BoardBase → BoardSetup → BoardProps → BoardUnits → BoardCamera → BoardFrame → BoardView.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { Pos } from '../../core';
import { UNIT_ROWS } from '../shared/assets';
import { NO_GLOW } from '../shared/models';
import type { Facing } from '../shared/figures';
import { type UnitView, type FxSprite, sleep, schedule } from './boardBase';
import { BoardCamera } from './boardCamera';

export abstract class BoardFrame extends BoardCamera {
  // ------------------------------------------------------------------ input

  protected bindInput(): void {
    const c = this.canvas;
    const signal = this.input.signal;
    c.style.touchAction = 'none';
    c.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.hooks.onCancel?.();
    }, { signal });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom(e.deltaY < 0 ? 1 : -1);
    }, { passive: false, signal });
    c.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      c.setPointerCapture(e.pointerId);
      this.pointer.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      this.wake();
      if (this.pointer.size === 1) {
        this.panMoved = false;
        this.longFired = false;
        clearTimeout(this.longTimer);
        this.longTimer = window.setTimeout(() => {
          if (this.panMoved || this.pointer.size !== 1) return;
          this.longFired = true;
          const t = this.tileAt(e.clientX, e.clientY);
          if (t) this.hooks.onLongPress?.(t);
        }, 400);
      } else if (this.pointer.size === 2) {
        clearTimeout(this.longTimer);
        const [a, b] = [...this.pointer.values()];
        this.pinchStart = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        this.panMoved = true;
      }
    }, { signal });
    c.addEventListener('pointermove', (e) => {
      const p = this.pointer.get(e.pointerId);
      if (!p) {
        if (e.pointerType === 'mouse' && this.hooks.onHover) {
          const t = this.tileAt(e.clientX, e.clientY);
          const k = t ? `${t[0]},${t[1]}` : '';
          if (k !== this.hoverKey) {
            this.hoverKey = k;
            this.hooks.onHover(t);
          }
        }
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (this.pointer.size === 2) {
        const [a, b] = [...this.pointer.values()];
        const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        // pinch switches zoom steps (D9); two-finger drag pans
        if (d / Math.max(1, this.pinchStart) > 1.3) {
          this.zoom(1);
          this.pinchStart = d;
        } else if (d / Math.max(1, this.pinchStart) < 0.77) {
          this.zoom(-1);
          this.pinchStart = d;
        }
        this.pan(dx / 2, dy / 2);
        return;
      }
      if (!this.panMoved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 10) {
        this.panMoved = true;
        clearTimeout(this.longTimer);
      }
      if (this.panMoved) this.pan(dx, dy);
    }, { signal });
    const up = (e: PointerEvent) => {
      const p = this.pointer.get(e.pointerId);
      this.pointer.delete(e.pointerId);
      clearTimeout(this.longTimer);
      if (!p || this.pointer.size > 0) return;
      if (!this.panMoved && !this.longFired) {
        const t = this.tileAt(e.clientX, e.clientY);
        if (t) this.tapped(t);
      }
    };
    c.addEventListener('pointerleave', () => {
      if (this.hoverKey && this.hooks.onHover) {
        this.hoverKey = '';
        this.hooks.onHover(null);
      }
    }, { signal });
    c.addEventListener('pointerup', up, { signal });
    c.addEventListener('pointercancel', (e) => {
      this.pointer.delete(e.pointerId);
      clearTimeout(this.longTimer);
    }, { signal });
  }

  /**
   * A tap on field `t`. With a double-tap hook a tap on a figure waits `legibility.doubleTapMs` for a second one: two taps glide the
   * camera to the figure without selecting it or acting (story 13.9); a tap on an empty field goes through at once.
   */
  protected tapped(t: Pos): void {
    const fire = (p: Pos) => {
      this.pickGrudgeLine(p);
      this.hooks.onTap?.(p);
    };
    const pending = this.pendingTap;
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingTap = null;
      if (pending.tile[0] === t[0] && pending.tile[1] === t[1]) {
        this.hooks.onDoubleTap?.(t);
        return;
      }
      fire(pending.tile);
    }
    const figure = this.state?.units.some((u) => u.pos && !u.gone && u.pos[0] === t[0] && u.pos[1] === t[1] && this.units.has(u.uid));
    if (!this.hooks.onDoubleTap || !figure) return fire(t);
    this.pendingTap = {
      tile: t,
      timer: window.setTimeout(() => {
        this.pendingTap = null;
        if (!this.disposed) fire(t);
      }, this.data.render.legibility.doubleTapMs),
    };
  }

  protected pan(dxCss: number, dyCss: number): void {
    this.camX -= dxCss / this.ppt;
    this.camY -= dyCss / this.ppt / this.cosTilt();
    this.clampCamera();
    this.wake();
  }

  /** Keeps the full frame rate for a moment (input, animation, camera moves). */
  protected wake(ms = 600): void {
    this.activeUntil = Math.max(this.activeUntil, performance.now() + ms);
  }

  // ------------------------------------------------------------------ frame

  busy(now: number): boolean {
    return now < this.activeUntil || this.zoomTween !== null || this.fxSprites.length > 0 || this.floaters.length > 0 || this.shake > 0;
  }

  frame(now: number): void {
    if (this.disposed) return;
    this.updateCamera(now);
    this.terrain?.tick(now);
    this.weather.tick(now);
    // a critical hit's freeze: the figures and effects keep the time they stopped at
    const clock = this.frozenAt ?? now;
    this.animClock += this.animWall < 0 ? 0 : Math.max(0, now - this.animWall) * this.scene.animationTimeScale;
    this.animWall = now;
    // markings breathe; under reduced motion they stand still (their middle opacity)
    const pulse = this.calmMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now / 250);
    for (const o of this.overlayMeshes) {
      o.mat.alpha = o.alpha + o.pulse * pulse;
      if (o.bob) o.mesh.position.y = this.calmMotion ? 0 : Math.sin(now / 320) * o.bob;
    }
    for (const v of this.units.values()) this.placeUnit(v, this.animClock);
    this.rings.flush();
    this.updateFade();
    if (this.freezeIn > 0 && --this.freezeIn === 0) this.freezeStatic();
    this.updateGrudgeLine();
    if (this.ghost) this.ghost.figure.tick(this.animClock, this.speed);
    const boost = this.look.pointBoost;
    this.pointLights.forEach((l, k) => (l.intensity = (0.9 + Math.sin(now / 90 + k * 2) * 0.12 + Math.sin(now / 37 + k) * 0.08) * boost));
    this.updateFx(clock);
    this.scene.render();
    this.updateFloaters(clock);
    this.placeBleedLabels();
    this.placeBadges();
    this.placePennants();
    this.placeStatusIcons();
    this.placePins();
  }

  protected placeUnit(v: UnitView, now: number): void {
    const x = v.x + v.offX;
    const y = v.y + v.offY;
    const tx = Math.min(Math.max(Math.round(x), 0), this.state.width - 1);
    const ty = Math.min(Math.max(Math.round(y), 0), this.state.height - 1);
    const h = (this.terrain?.standOn(tx, ty) ?? 0) + v.lift;
    v.figure.node.position.set(x + 0.5, h, -y - 0.5);
    // a figure outside the view is switched off: the scene then skips its meshes, bones and nodes altogether (story 7.7)
    const onScreen = this.onScreen(x + 0.5, h, -y - 0.5);
    const fx = Math.round(x);
    const fy = Math.round(y);
    if (fx !== v.fadeX || fy !== v.fadeY || v.visible !== v.fadeSeen) {
      v.fadeX = fx;
      v.fadeY = fy;
      v.fadeSeen = v.visible;
      this.fadeDirty = true;
    }
    v.figure.node.setEnabled(v.visible && onScreen);
    v.figure.tint(v.desat, v.flash, v.alpha, this.reach.has(v.uid) ? this.reachGlow : NO_GLOW);
    v.figure.tick(now, this.speed, onScreen);
    this.rings.place(v.uid, x + 0.5, h + 0.025, -y - 0.5, v.visible && !v.downed && v.alpha > 0.5 ? (v.desat > 0.3 ? 0.25 : 0.5) : 0);
    if (v.gold) {
      v.gold.position.set(x + 0.5, h + 0.03, -y - 0.5);
      v.gold.setEnabled(v.visible && onScreen && !v.downed && v.alpha > 0.5);
    }
  }

  // ------------------------------------------------------------------ fx

  spawnFx(anim: string, tx: number, ty: number, loop = false): void {
    if (this.skip) return;
    const f = this.makeFx(anim, tx, ty, loop);
    if (f) this.fxSprites.push(f);
  }

  protected makeFx(anim: string, tx: number, ty: number, loop: boolean): FxSprite | null {
    if (!this.fx?.anims[anim] || !this.fxTexture) return null;
    const [cw, ch] = this.fx.cell;
    const mesh = CreatePlane(`fx:${anim}`, { width: cw / 48, height: ch / 48 }, this.scene);
    mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
    mesh.isPickable = false;
    mesh.position.set(tx + 0.5, this.tileTop([tx, ty]) + 0.5, -ty - 0.5);
    const mat = new StandardMaterial(`fx:${anim}`, this.scene);
    const tex = this.fxTexture.clone();
    tex.uScale = cw / this.fx.image.width;
    tex.vScale = ch / this.fx.image.height;
    mat.diffuseTexture = tex;
    mat.emissiveTexture = tex;
    mat.disableLighting = true;
    mat.fogEnabled = false;
    mat.useAlphaFromDiffuseTexture = true;
    mat.backFaceCulling = false;
    mat.disableDepthWrite = true;
    mat.zOffset = -4;
    mesh.material = mat;
    mesh.renderingGroupId = 1;
    return { mesh, mat, anim, start: performance.now(), loop };
  }

  protected disposeFx(f: FxSprite): void {
    f.mat.diffuseTexture?.dispose();
    f.mat.dispose();
    f.mesh.dispose();
  }

  protected updateFx(now: number): void {
    const fx = this.fx;
    if (!fx) return;
    // in place: no new array for the sprites of every frame (story 7.8)
    const list = this.fxSprites;
    let kept = 0;
    for (const f of list) {
      const a = fx.anims[f.anim]!;
      const n = Math.floor(((now - f.start) / 1000) * a.fps * (this.speed > 1 ? 1.6 : 1));
      if (!f.loop && n >= a.frames) {
        this.disposeFx(f);
        continue;
      }
      const col = f.loop ? n % a.frames : n;
      const tex = f.mat.diffuseTexture as Texture;
      tex.uOffset = (col * fx.cell[0]) / fx.image.width;
      tex.vOffset = 1 - ((a.row + 1) * fx.cell[1]) / fx.image.height;
      list[kept++] = f;
    }
    list.length = kept;
  }

  // ------------------------------------------------------------------ floating text

  floatText(tileX: number, tileY: number, text: string, cls: string, dur = 900, scale?: number): void {
    if (this.skip) return;
    const el = document.createElement('div');
    el.className = `hc-float ${cls}`;
    el.textContent = text;
    if (scale) el.style.setProperty('--hc-num-scale', String(scale));
    this.floatLayer.appendChild(el);
    this.floaters.push({ el, x: tileX + 0.5, y: tileY + 0.5, h: this.tileTop([tileX, tileY]) + 1.05, start: performance.now(), dur: dur / this.speed });
  }

  protected updateFloaters(now: number): void {
    this.floaters = this.floaters.filter((f) => {
      const t = (now - f.start) / f.dur;
      if (t >= 1) {
        f.el.remove();
        return false;
      }
      const p = this.screenOfXYZ(f.x, f.h + t * 0.4, -f.y);
      f.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      f.el.style.opacity = String(t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25);
      return true;
    });
  }

  // ------------------------------------------------------------------ animation helpers

  protected tween(ms: number, fn: (t: number) => void): Promise<void> {
    if (this.skip) {
      fn(1);
      return Promise.resolve();
    }
    const dur = ms / this.speed;
    const start = performance.now();
    return new Promise((resolve) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / dur);
        fn(t);
        this.wake(200);
        if (t < 1 && !this.disposed) schedule(step);
        else resolve();
      };
      schedule(step);
    });
  }

  protected wait(ms: number): Promise<void> {
    return this.skip ? Promise.resolve() : sleep(ms / this.speed);
  }

  /** `tween` for a duration that is already in real milliseconds at the current speed (the critical hit's time line). */
  protected tweenReal(ms: number, fn: (t: number) => void): Promise<void> {
    return this.tween(ms * this.speed, fn);
  }

  protected waitReal(ms: number): Promise<void> {
    return this.skip ? Promise.resolve() : sleep(ms);
  }

  protected facingOf(from: Pos, to: Pos): Facing {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) return dx > 0 ? 'e' : 'w';
    return dy < 0 ? 'n' : 's';
  }

  protected unitPos(uid: string): Pos | null {
    const v = this.units.get(uid);
    return v ? [Math.round(v.x), Math.round(v.y)] : null;
  }

  /** Seconds until the hit frame of an attack (sprite row timing, shared by the 3D animation). */
  protected hitDelay(): number {
    const row = UNIT_ROWS.find((r) => r.name === 'attack_s')!;
    return ((row.hitFrame ?? 3) / (row.fps ?? 12) / (this.speed > 1 ? 1.6 : 1)) * 1000;
  }
}
