/**
 * Figures of the battle board and what hangs on them: badges, pins, pennants, status icons, bleed labels; plus the overlays and the move ghost.
 * Part of the class chain BoardBase → BoardSetup → BoardProps → BoardUnits → BoardCamera → BoardFrame → BoardView.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { BattleState, BattleUnit, GearPiece, Pos, StatusId } from '../../core';
import { bleedsOut, itemDef, maxHpOf, modelId, unitFigureId, unitVatPath } from '../../core';
import { loadManifest, loadUnitSheet } from '../shared/assets';
import { loadUnitModel } from '../shared/models';
import { ModelFigure, SpriteFigure, type Figure, type FigureAnim } from '../shared/figures';
import { buildGridMesh, buildOverlayMeshes, type Overlays } from './overlays';
import type { HpBarMode, KillKind } from './badges';
import { iconsOf } from './statusIcons';
import { disposeGoldRing, GrudgeLine, makeGoldRing, makePennant, pennantNotches, setPennantNotches } from './lieutenant';
import type { GridLevel, PinOffset } from './boardTypes';
import { type UnitView } from './boardBase';
import { BoardProps } from './boardProps';

export abstract class BoardUnits extends BoardProps {
  // ------------------------------------------------------------------ units

  protected unitSpriteId(u: BattleUnit): string {
    return unitFigureId(u, this.data.classes);
  }

  /** Weapon model of the equipped weapon group (GA9); its motion picks the figure's attack animation. */
  protected weaponOf(u: BattleUnit): GearPiece | undefined {
    const main = u.equip.mainHand && itemDef(this.data, u.equip.mainHand).weaponType;
    return main ? this.data.render.gear.weapons[main] : undefined;
  }

  /** Weapon models for the equipped weapon group and off-hand item (GA9); one piece per hand, the weapon first. */
  protected gearOf(u: BattleUnit): GearPiece[] {
    const { offHand } = this.data.render.gear;
    const out: GearPiece[] = [];
    const w = this.weaponOf(u);
    if (w) out.push(w);
    const group = u.equip.offHand && itemDef(this.data, u.equip.offHand).group;
    const off = group && offHand[group];
    if (off && !out.some((p) => p.hand === off.hand)) out.push(off);
    return out;
  }

  protected gearKey(u: BattleUnit): string {
    return this.gearOf(u)
      .map((p) => `${p.model}@${p.hand}`)
      .join();
  }

  protected async makeFigure(u: BattleUnit, name: string): Promise<Figure> {
    const id = this.unitSpriteId(u);
    if (this.figures === '3d') {
      // a figure per chosen portrait where one exists (the avatar: avatar_a / avatar_b), else the unit's own
      const manifestModels = (await loadManifest()).models;
      const mid = modelId(u, manifestModels?.units ?? [], this.data.classes);
      // a figure with a baked animation file (the manifest lists them) plays it as vertex animation (story 7.8, `board.vat`)
      const vatPath = this.data.render.board.vat && manifestModels?.vat?.includes(mid) ? unitVatPath(mid, manifestModels.unitPacks) : undefined;
      const model = await loadUnitModel(this.store, mid, u.team, name, this.gearOf(u), manifestModels?.unitPacks, vatPath);
      if (model) {
        model.root.scaling.setAll(this.data.render.board.figureScale);
        return new ModelFigure(model, this.weaponOf(u)?.motion, this.data.render.board.idleHz, this.data.render.board.tintPool);
      }
    }
    const weapon = u.equip.mainHand ? itemDef(this.data, u.equip.mainHand).weaponType : undefined;
    const sheet = await loadUnitSheet(id, { classId: u.classId, weapon });
    return new SpriteFigure(this.scene, sheet, u.team, this.data.render.look.teams[u.team].ramp, name);
  }

  async syncUnits(state: BattleState, _instant = false): Promise<void> {
    this.state = state;
    const seen = new Set<string>();
    // new figures load in parallel (model files are shared per sprite id)
    const fresh = new Map<string, Promise<Figure>>();
    for (const u of state.units) {
      if (!u.pos || u.gone) continue;
      const v = this.units.get(u.uid);
      if (!v || v.team !== u.team || v.sprite !== this.unitSpriteId(u) || v.gear !== this.gearKey(u)) fresh.set(u.uid, this.makeFigure(u, `unit:${u.uid}:${u.team}`));
    }
    for (const u of state.units) {
      if (!u.pos || u.gone) continue;
      seen.add(u.uid);
      let v = this.units.get(u.uid);
      if (v && (v.team !== u.team || v.sprite !== this.unitSpriteId(u) || v.gear !== this.gearKey(u))) {
        this.removeUnit(v);
        v = undefined;
      }
      if (!v) {
        const figure = await (fresh.get(u.uid) ?? this.makeFigure(u, `unit:${u.uid}:${u.team}`));
        if (this.disposed) {
          for (const f of fresh.values()) void f.then((g) => g.dispose());
          return;
        }
        v = {
          uid: u.uid,
          team: u.team,
          sprite: this.unitSpriteId(u),
          gear: this.gearKey(u),
          figure,
          gold: u.lieutenant ? makeGoldRing(this.scene, u.uid) : undefined,
          x: u.pos[0],
          y: u.pos[1],
          offX: 0,
          offY: 0,
          lift: 0,
          facing: 's',
          anim: 'idle',
          desat: 0,
          flash: 0,
          alpha: 1,
          visible: true,
          downed: false,
          fadeX: NaN,
          fadeY: NaN,
          fadeSeen: false,
        };
        this.units.set(u.uid, v);
        this.rings.add(u.uid, u.team);
      }
      v.x = u.pos[0];
      v.y = u.pos[1];
      v.offX = v.offY = v.lift = 0;
      v.downed = u.downed;
      v.desat = u.downed ? 1 : u.acted && u.team === state.phase ? 0.65 : 0;
      v.alpha = 1;
      v.visible = true;
      v.facing = 's';
      this.setAnim(v, u.downed ? 'downed' : 'idle');
    }
    for (const [uid, v] of [...this.units]) if (!seen.has(uid)) this.removeUnit(v);
    for (const u of state.units) this.setBleedLabel(u.uid, u.downed && !u.gone && bleedsOut(this.data, state, u) ? u.bleed ?? 0 : null);
    for (const u of state.units) this.setPennant(u);
    for (const u of state.units) this.setStatuses(u);
    for (const u of state.units) this.setBadge(u);
    this.done = new Set(state.units.filter((u) => u.acted && u.team === state.phase && !u.downed && !u.gone && this.units.has(u.uid)).map((u) => u.uid));
    this.badges.setDone(this.done);
    if (this.grudgeFor && !this.grudgeTargetView()) this.grudgeFor = null;
  }

  /** The badge of a unit from its state: units on the board that stand (not downed, fled, gone) have one (story 13.3). */
  protected setBadge(u: BattleUnit): void {
    if (!u.pos || u.gone || u.downed || !this.units.has(u.uid)) return this.badges.set(u.uid, null);
    this.badges.set(u.uid, { team: u.team, hp: u.hp, maxHp: maxHpOf(this.data, this.state, u), lieutenant: !!u.lieutenant });
  }

  /** Option "Lebensleisten" (story 13.3). */
  set hpBars(mode: HpBarMode) {
    this.badges.setMode(mode);
    this.wake();
  }

  /** Kill markers over foes, warning skulls over own units (stories 13.4, 13.6); empty map clears them. */
  setMarks(marks: ReadonlyMap<string, KillKind>): void {
    this.badges.setMarks(marks);
    this.wake();
  }

  /** The foes that reach the chosen field (story 13.6): they glow reddish until the next call; empty ends it. */
  setReach(uids: readonly string[]): void {
    if (uids.length === this.reach.size && uids.every((u) => this.reach.has(u))) return;
    this.reach = new Set(uids);
    this.wake();
  }

  /** The part of the target's HP bar a previewed attack takes (story 13.4); `null` ends it. */
  setHpPreview(p: { uid: string; after: number } | null): void {
    this.badges.setPreview(p);
    this.wake();
  }

  /** Option "Raster" (story 13.1): grid marks at the tile corners, thin lines or nothing. */
  set grid(level: GridLevel) {
    if (level === this.gridLevel) return;
    this.gridLevel = level;
    this.buildGrid();
    this.wake();
  }

  protected buildGrid(): void {
    this.gridMesh?.mesh.dispose();
    this.gridMesh?.mat.dispose();
    this.gridMesh = this.state && this.terrain ? buildGridMesh(this.scene, this.state.width, this.state.height, (p) => this.tileTop(p), this.gridLevel, this.data.render.legibility.grid) : null;
  }

  /**
   * Pins a DOM element (positioned absolutely over the canvas) to the centre of field `tile`, moved by `at` (tiles east, south and
   * up); the board moves it with the camera every frame. `null` unpins it.
   */
  pin(key: string, el: HTMLElement | null, tile: Pos | null, at: PinOffset = {}): void {
    if (!el || !tile) {
      this.pins.delete(key);
      return;
    }
    const old = this.pins.get(key);
    if (old && old.el === el && old.tile[0] === tile[0] && old.tile[1] === tile[1] && old.at.east === at.east && old.at.south === at.south && old.at.lift === at.lift) return;
    this.pins.set(key, { el, tile, at, x: NaN, y: NaN });
    this.wake();
  }

  protected placePins(): void {
    for (const p of this.pins.values()) {
      const s = this.screenOfXYZ(p.tile[0] + 0.5 + (p.at.east ?? 0), this.tileTop(p.tile) + (p.at.lift ?? 0), -(p.tile[1] + 0.5 + (p.at.south ?? 0)));
      const x = Math.round(s.x);
      const y = Math.round(s.y);
      if (x === p.x && y === p.y) continue;
      p.x = x;
      p.y = y;
      p.el.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  protected placeBadges(): void {
    this.badges.setScale(this.ppt);
    const lift = this.data.render.legibility.hpBar.lift;
    for (const uid of this.badges.uids()) {
      const v = this.units.get(uid);
      if (!v) continue;
      const x = v.x + v.offX + 0.5;
      const z = -(v.y + v.offY + 0.5);
      const h = this.tileTop2(Math.round(v.x), Math.round(v.y)) + v.lift;
      const p = this.screenOfXYZ(x, h + lift, z);
      this.badges.place(uid, p.x, p.y, v.visible && !v.downed && v.alpha > 0.5 && this.onScreen(x, h, z));
    }
  }

  /** Grudge pennant over a lieutenant on the board (0-3 notches from `BattleUnit.grudge`); everyone else has none. */
  protected setPennant(u: BattleUnit): void {
    let el = this.pennants.get(u.uid);
    if (!u.lieutenant || u.gone || !this.units.has(u.uid)) {
      el?.remove();
      this.pennants.delete(u.uid);
      return;
    }
    if (!el) {
      el = makePennant();
      this.floatLayer.appendChild(el);
      this.pennants.set(u.uid, el);
    }
    setPennantNotches(el, pennantNotches(u.grudge, this.data.balance.lieutenant.grudge.max));
  }

  protected placePennants(): void {
    for (const [uid, el] of this.pennants) {
      const v = this.units.get(uid);
      if (!v) continue;
      const p = this.screenOfXYZ(v.x + v.offX + 0.5, this.tileTop2(Math.round(v.x), Math.round(v.y)) + 1.2, -(v.y + v.offY + 0.5));
      el.style.transform = `translate(${p.x}px, ${p.y - this.badges.heightOf(uid)}px) translate(-50%, -100%)`;
      el.style.display = v.visible && v.alpha > 0.5 ? '' : 'none';
    }
  }

  /** The target of the grudge of the lieutenant `grudgeFor`, when both stand on the board. */
  protected grudgeTargetView(): { from: UnitView; to: UnitView } | null {
    if (!this.grudgeFor) return null;
    const lt = this.state.units.find((u) => u.uid === this.grudgeFor);
    if (!lt || lt.gone || !lt.grudgeTarget || (lt.grudge ?? 0) < 1) return null;
    const target = this.state.units.find((u) => (u.uid === lt.grudgeTarget || u.id === lt.grudgeTarget) && !u.gone && u.pos);
    const from = this.units.get(lt.uid);
    const to = target ? this.units.get(target.uid) : undefined;
    return from && to ? { from, to } : null;
  }

  /** A tap on a lieutenant with grudge 1 or more shows the thin line to his target; a tap anywhere else hides it. */
  protected pickGrudgeLine(tile: Pos): void {
    const at = this.state?.units.find((u) => u.pos && !u.gone && u.pos[0] === tile[0] && u.pos[1] === tile[1]);
    this.grudgeFor = at?.lieutenant && (at.grudge ?? 0) >= 1 && at.grudgeTarget ? at.uid : null;
    this.wake();
  }

  protected groundOf(v: UnitView): Vector3 {
    const x = v.x + v.offX;
    const y = v.y + v.offY;
    const h = (this.terrain?.standOn(Math.min(Math.max(Math.round(x), 0), this.state.width - 1), Math.min(Math.max(Math.round(y), 0), this.state.height - 1)) ?? 0) + v.lift;
    return new Vector3(x + 0.5, h + 0.12, -y - 0.5);
  }

  protected updateGrudgeLine(): void {
    const pair = this.grudgeTargetView();
    if (!pair) return void this.grudgeLine?.clear();
    this.grudgeLine ??= new GrudgeLine(this.scene);
    this.grudgeLine.set(this.groundOf(pair.from), this.groundOf(pair.to));
  }

  /** Status icons of a unit from its state (story 8.6); a unit that left the board shows none. */
  protected setStatuses(u: BattleUnit): void {
    if (!u.pos || u.gone || !this.units.has(u.uid)) {
      this.statuses.delete(u.uid);
      this.statusIcons.drop(u.uid);
      return;
    }
    this.statuses.set(u.uid, new Set(u.status.map((s) => s.id)));
    this.statusIcons.set(u.uid, iconsOf(u.status));
  }

  /** A `status` event switches one icon on or off while the events play. */
  protected flipStatus(uid: string, id: StatusId, on: boolean): void {
    const set = this.statuses.get(uid) ?? new Set<StatusId>();
    if (on) set.add(id);
    else set.delete(id);
    this.statuses.set(uid, set);
    if (this.units.has(uid)) this.statusIcons.set(uid, iconsOf([...set].map((s) => ({ id: s }))));
  }

  protected placeStatusIcons(): void {
    for (const uid of this.statusIcons.uids()) {
      const v = this.units.get(uid);
      if (!v) continue;
      const p = this.screenOfXYZ(v.x + v.offX + 0.5, this.tileTop2(Math.round(v.x), Math.round(v.y)) + 0.95, -(v.y + v.offY + 0.5));
      // a lieutenant's pennant hangs over his head: the icons sit beside it
      const lt = this.pennants.has(uid);
      this.statusIcons.place(uid, lt ? p.x + this.ppt * 0.28 : p.x, p.y - this.badges.heightOf(uid), v.visible && !v.downed && v.alpha > 0.5, !lt);
    }
  }

  /** Counter of phases a downed unit has left (pulse symbol + number, DESIGN.md `downed`); `null` removes it. */
  protected setBleedLabel(uid: string, bled: number | null): void {
    const left = bled === null ? null : Math.max(0, this.data.balance.death.bleedOutTurns - bled);
    let el = this.bleedLabels.get(uid);
    if (left === null || !this.units.has(uid)) {
      el?.remove();
      this.bleedLabels.delete(uid);
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.className = 'hc-bleed';
      this.floatLayer.appendChild(el);
      this.bleedLabels.set(uid, el);
    }
    el.innerHTML = `<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M1 7h5l2-5 3 9 3-7 2 3h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><b>${left}</b>`;
  }

  /** Point above the head of unit `uid` in CSS px relative to the canvas (speech bubbles); `null` when it is not on the board. */
  headScreen(uid: string): { x: number; y: number } | null {
    const v = this.units.get(uid);
    if (!v) return null;
    return this.screenOfXYZ(v.x + v.offX + 0.5, this.tileTop2(Math.round(v.x), Math.round(v.y)) + 1.05, -(v.y + v.offY + 0.5));
  }

  protected placeBleedLabels(): void {
    for (const [uid, el] of this.bleedLabels) {
      const v = this.units.get(uid);
      if (!v) continue;
      const p = this.screenOfXYZ(v.x + v.offX + 0.5, this.tileTop2(Math.round(v.x), Math.round(v.y)) + 1.05, -(v.y + v.offY + 0.5));
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
    }
  }

  protected removeUnit(v: UnitView): void {
    this.setBleedLabel(v.uid, null); // the counter goes with the figure (a unit that drops out of the fog while downed)
    this.badges.set(v.uid, null);
    this.statuses.delete(v.uid);
    this.statusIcons.drop(v.uid);
    v.figure.dispose();
    if (v.gold) disposeGoldRing(v.gold);
    this.rings.remove(v.uid);
    this.units.delete(v.uid);
    this.fadeDirty = true;
  }

  protected setAnim(v: UnitView, anim: FigureAnim): void {
    v.anim = anim;
    v.figure.play(anim, v.facing, this.speed > 1 ? 1.6 : 1);
  }

  /** Full refresh after a command: terrain, props, units. */
  async setState(state: BattleState): Promise<void> {
    const terrainChanged = !this.state || this.state.terrain.join() !== state.terrain.join() || JSON.stringify(this.state.timers) !== JSON.stringify(state.timers);
    const objChanged = !this.state || JSON.stringify(this.state.objects) !== JSON.stringify(state.objects);
    this.state = state;
    if (terrainChanged) await this.buildTerrain();
    else if (objChanged) await this.buildProps();
    await this.syncUnits(state);
  }

  setOverlays(o: Overlays): void {
    this.overlays = o;
    this.wake();
    this.buildOverlays();
    void this.updateGhost();
  }

  // ------------------------------------------------------------------ overlays

  protected tileTop(p: Pos): number {
    return this.terrain?.standOn(p[0], p[1]) ?? 0;
  }

  /** `tileTop` for two numbers (the labels of every frame make no position array) */
  protected tileTop2(x: number, y: number): number {
    return this.terrain?.standOn(x, y) ?? 0;
  }

  protected buildOverlays(): void {
    for (const o of this.overlayMeshes) {
      o.mesh.dispose();
      o.mat.dispose();
    }
    this.overlayMeshes = buildOverlayMeshes(this.scene, this.overlays, (p) => this.tileTop(p), this.data.render.look.marker, this.data.render.camera.tiltDeg, this.data.render.legibility);
  }

  protected async updateGhost(): Promise<void> {
    const g = this.overlays.ghost;
    if (!g) {
      this.ghost?.figure.dispose();
      this.ghost = null;
      return;
    }
    if (this.ghost?.uid !== g.uid) {
      this.ghost?.figure.dispose();
      this.ghost = null;
      const u = this.state.units.find((x) => x.uid === g.uid);
      if (!u) return;
      const figure = await this.makeFigure(u, `ghost:${u.uid}`);
      if (this.overlays.ghost?.uid !== g.uid) {
        figure.dispose();
        return;
      }
      this.ghost = { uid: g.uid, figure };
      figure.tint(0, 0.15, 0.6);
    }
    const pos = this.overlays.ghost!.pos;
    this.ghost.figure.node.position.set(pos[0] + 0.5, this.tileTop(pos), -pos[1] - 0.5);
    this.ghost.figure.play('idle', 's', 1);
  }
}
