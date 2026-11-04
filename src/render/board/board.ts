/**
 * The 3D battle board (concept/01-decisions.md D1–D16): tilted orthographic camera with zoom steps,
 * diorama terrain, 3D props and figures (or pixel sprites), lights and shadows, and the playback of
 * core events. The public surface is what the battle screen uses; all game logic stays in src/core.
 * The class is split by topic into a chain: boardBase (state, constructor) → boardSetup → boardProps →
 * boardUnits → boardCamera → boardFrame → board (event playback); public types in boardTypes.
 */
import type { BattleState, BattleUnit, GameEvent, Pos } from '../../core';
import { bleedsOut } from '../../core';
import { t } from '../../i18n';
import type { HostedView } from '../host';
import { critTimeline } from './critTimeline';
import { dropPennant, fleeArc, FLEE_FADE_MS, FLEE_JUMP_MS, fleeTarget } from './lieutenant';
import { BoardFrame } from './boardFrame';

export class BoardView extends BoardFrame implements HostedView {
  // ------------------------------------------------------------------ event playback

  /** Plays core events as board animations, then syncs to the final state. */
  async play(events: GameEvent[], finalState: BattleState, pool?: readonly BattleUnit[]): Promise<void> {
    if (this.readyPromise) await this.readyPromise;
    const pace = this.data.render.aiPace;
    for (let n = 0; n < events.length; n++) {
      const e = events[n]!;
      if (this.disposed) return;
      switch (e.t) {
        case 'moved': {
          const v = this.units.get(e.unit);
          if (!v || e.path.length < 2) break;
          // the foe's and the third party's way is walked slower than the player's own, so the eye can follow it
          const own = v.team === 'player';
          if (!this.isVisible(e.path[e.path.length - 1]!)) void this.centerOn(e.path[e.path.length - 1]!);
          for (let i = 1; i < e.path.length; i++) {
            const a = e.path[i - 1]!;
            const b = e.path[i]!;
            v.facing = this.facingOf(a, b);
            this.setAnim(v, 'walk');
            await this.tween(own ? 140 : pace.stepMs, (t) => {
              v.x = a[0] + (b[0] - a[0]) * t;
              v.y = a[1] + (b[1] - a[1]) * t;
            });
          }
          this.setAnim(v, 'idle');
          // a short pause on the new tile before the foe strikes or the next one moves
          if (!own) await this.wait(pace.afterMoveMs);
          break;
        }
        case 'aiTurn': {
          const p = this.unitPos(e.unit);
          if (p && !this.isVisible(p)) await this.centerOn(p);
          // a unit that only waits (no event of its own follows) is not announced
          const next = events[n + 1];
          if (!next || next.t === 'aiTurn' || next.t === 'phase' || next.t === 'exhausted' || next.t === 'battleEnd') break;
          // the acting unit pulses before it moves or strikes, so the player sees who is about to act
          const v = this.units.get(e.unit);
          if (v && !this.skip) {
            await this.tween(pace.focusMs, (t) => {
              v.flash = 0.45 * Math.sin(t * Math.PI);
            });
            v.flash = 0;
          }
          break;
        }
        case 'combat':
          await this.hooks.onEvent?.(e);
          break;
        case 'strike': {
          const a = this.units.get(e.attacker);
          const d = this.units.get(e.defender);
          const ap = this.unitPos(e.attacker);
          const dp = this.unitPos(e.defender);
          if (!a || !d || !ap || !dp) break;
          if (e.tandem) this.floatText(ap[0], ap[1], '⚔', 'hc-float-tandem');
          a.facing = this.facingOf(ap, dp);
          d.facing = this.facingOf(dp, ap);
          this.setAnim(a, 'attack');
          this.setAnim(d, d.anim);
          const hitAt = this.hitDelay();
          const lx = Math.sign(dp[0] - ap[0]) * 0.12;
          const ly = Math.sign(dp[1] - ap[1]) * 0.12;
          // a critical hit (story 8.6): the cut-in band runs while the attack winds up, the hit freezes, then star, shake, big number
          const crit = e.hit && e.crit ? critTimeline(this.data.render.look.fx.crit, hitAt / this.speed, this.speed, this.skip) : null;
          if (crit?.cutIn) this.hooks.onCutIn?.({ unit: e.attacker, element: e.element, skill: e.skill, ...crit.cutIn });
          void this.tween(hitAt, (t) => {
            a.offX = lx * Math.sin(t * Math.PI * 0.5);
            a.offY = ly * Math.sin(t * Math.PI * 0.5);
          });
          await this.wait(hitAt);
          if (e.hit) {
            if (e.magic && e.element) this.spawnFx(e.element === 'fire' ? 'fire_bolt' : e.element === 'wind' ? 'wind_slash' : e.element === 'water' ? 'water_burst' : e.element === 'earth' ? 'earth_spikes' : e.element === 'light' ? 'light_pillar' : 'dark_tendrils', dp[0], dp[1]);
            d.flash = 1;
            this.setAnim(d, 'hit');
            if (crit) await this.freeze(crit.freezeMs);
            this.spawnFx(e.crit ? 'hit_star_crit' : 'hit_spark', dp[0], dp[1]);
            if (crit) this.kick(crit.shake, crit.shakeMs);
            this.floatText(dp[0], dp[1], e.guarded ? '🛡 0' : String(e.dmg), e.crit ? 'hc-float-crit' : 'hc-float-dmg', 900, e.crit ? crit?.numberScale : undefined);
            this.hooks.onUnitHp?.(e.defender, e.hpAfter);
            this.badges.setHp(e.defender, e.hpAfter);
            await this.hooks.onEvent?.(e);
            if (crit) {
              // the target is thrown back along the blow and returns while its flash fades
              const kx = Math.sign(dp[0] - ap[0]) * 0.22;
              const ky = Math.sign(dp[1] - ap[1]) * 0.22;
              await this.tweenReal(crit.recoilMs, (t) => {
                d.flash = 1 - t;
                d.offX = kx * Math.sin(t * Math.PI);
                d.offY = ky * Math.sin(t * Math.PI);
              });
              d.offY = 0;
            } else
              await this.tween(140, (t) => {
                d.flash = 1 - t;
                d.offX = Math.sin(t * Math.PI * 3) * 0.04;
              });
          } else {
            this.floatText(dp[0], dp[1], 'miss', 'hc-float-miss');
            await this.hooks.onEvent?.(e);
            const side = a.facing === 'w' ? -1 : 1;
            await this.tween(140, (t) => {
              d.offX = Math.sin(t * Math.PI) * 0.1 * side;
            });
          }
          d.offX = 0;
          if (crit) await this.tweenReal(crit.returnMs, (t) => {
            a.offX = lx * (1 - t);
            a.offY = ly * (1 - t);
          });
          else await this.tween(90, (t) => {
            a.offX = lx * (1 - t);
            a.offY = ly * (1 - t);
          });
          this.setAnim(a, 'idle');
          if (!d.downed) this.setAnim(d, 'idle');
          await (crit ? this.waitReal(crit.settleMs) : this.wait(a.team === 'player' ? 60 : pace.afterStrikeMs));
          break;
        }
        case 'combatEnd':
          await this.hooks.onEvent?.(e);
          break;
        case 'damage':
        case 'heal': {
          const p = this.unitPos(e.unit);
          if (p) {
            this.floatText(p[0], p[1], (e.t === 'heal' ? '+' : '−') + e.amount, e.t === 'heal' ? 'hc-float-heal' : 'hc-float-dmg');
            if (e.t === 'heal') this.spawnFx('heal', p[0], p[1]);
          }
          this.hooks.onUnitHp?.(e.unit, e.hpAfter);
          this.badges.setHp(e.unit, e.hpAfter);
          if (e.t === 'heal') void this.hooks.onEvent?.(e);
          await this.wait(e.t === 'heal' ? 350 : 250);
          break;
        }
        case 'status': {
          const p = this.unitPos(e.unit);
          if (p && e.on) {
            // the localized short name and the effect at the feet; the icon over the head stays as long as the status does (story 8.6)
            this.floatText(p[0], p[1], t(`ui.status.${e.status}`), `hc-float-status hc-status-${e.status}`);
            const feet = this.data.render.look.fx.status.feet[e.status];
            if (feet) this.spawnFx(feet, p[0], p[1]);
          }
          this.flipStatus(e.unit, e.status, e.on);
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'knockback': {
          const v = this.units.get(e.unit);
          if (v && !e.blocked) {
            const fx = v.x;
            const fy = v.y;
            await this.tween(140, (t) => {
              v.x = fx + (e.to[0] - fx) * t;
              v.y = fy + (e.to[1] - fy) * t;
            });
          }
          break;
        }
        case 'terrain':
          this.state = { ...this.state, terrain: [...this.state.terrain], timers: { ...this.state.timers } };
          this.state.terrain[e.at[1] * this.state.width + e.at[0]] = e.terrain;
          if (e.terrain === 'burning') {
            const k = `${e.at[0]},${e.at[1]}`;
            this.state.timers[k] = finalState.timers[k] ?? { kind: 'burning', turns: 1, revertTo: 'grass' };
            this.spawnFx('smoke', e.at[0], e.at[1]);
          } else delete this.state.timers[`${e.at[0]},${e.at[1]}`];
          await this.buildTerrain();
          await this.wait(200);
          break;
        case 'downed': {
          const v = this.units.get(e.unit);
          if (v) {
            v.downed = true;
            v.desat = 1;
            this.badges.set(e.unit, null);
            this.setAnim(v, 'downed');
            const du = this.state?.units.find((x) => x.uid === e.unit);
            if (!du || bleedsOut(this.data, this.state, du)) this.setBleedLabel(e.unit, 0);
          }
          await this.hooks.onEvent?.(e);
          await this.wait(350);
          break;
        }
        case 'bleed':
          this.setBleedLabel(e.unit, e.turns);
          await this.hooks.onEvent?.(e);
          await this.wait(250);
          break;
        case 'fled': {
          // a lieutenant at 0 HP: backward jump away from the one who drove him off, smoke, the pennant falls, then he is gone;
          // the flee line (UI hook) is spoken after the jump while he still stands there (story 3.2). Skip mode only settles it.
          const v = this.units.get(e.unit);
          this.setBleedLabel(e.unit, null);
          this.badges.set(e.unit, null);
          if (v) {
            const origin: Pos = [Math.round(v.x), Math.round(v.y)];
            const by = e.by ? this.units.get(e.by) : undefined;
            const from: Pos | null = by ? [Math.round(by.x), Math.round(by.y)] : null;
            const to = fleeTarget(origin, from, this.state.width, this.state.height);
            if (from) v.facing = this.facingOf(origin, from);
            this.setAnim(v, 'idle');
            const pennant = this.pennants.get(e.unit);
            if (pennant && !this.skip) dropPennant(pennant, FLEE_JUMP_MS / this.speed);
            this.spawnFx('smoke', origin[0], origin[1]);
            await this.tween(FLEE_JUMP_MS, (t) => {
              v.x = origin[0] + (to[0] - origin[0]) * t;
              v.y = origin[1] + (to[1] - origin[1]) * t;
              v.lift = fleeArc(t);
            });
            v.lift = 0;
            pennant?.remove();
            this.pennants.delete(e.unit);
          }
          await this.hooks.onEvent?.(e);
          if (v) {
            await this.tween(FLEE_FADE_MS, (t) => {
              v.alpha = 1 - t;
              v.desat = t;
            });
            v.visible = false;
          }
          break;
        }
        case 'died':
        case 'retreated':
        case 'rescued':
        case 'escaped': {
          const v = this.units.get(e.unit);
          this.setBleedLabel(e.unit, null);
          this.badges.set(e.unit, null);
          if (v) {
            // death in ash (story 8.6): flakes with embers burst from the unit, it fades upwards, a short shake
            const death = this.data.render.look.fx.death;
            if (e.t === 'died' && !this.skip) {
              const g = this.groundOf(v);
              this.ash?.burst(g.x, g.y - 0.1, g.z);
              this.kick(death.shake, death.shakeMs / this.speed);
            }
            await this.tween(e.t === 'died' ? death.fadeMs : 300, (t) => {
              v.alpha = 1 - t;
              v.desat = t;
              v.lift = e.t === 'died' ? t * death.rise : 0;
            });
            v.visible = false;
          }
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'levelUp': {
          const p = this.unitPos(e.unit);
          if (p) this.spawnFx('levelup', p[0], p[1]);
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'spawned': {
          const final = finalState.units.find((x) => x.uid === e.unit) ?? pool?.find((x) => x.uid === e.unit);
          // `e.at`: a foe coming out of the fog appears where it first comes into sight, `pool`: the units of the whole state, for foes
          // the board is shown without but lets in for a moment (fog filter, story 2.6)
          const u = final && e.at ? { ...final, pos: e.at } : final;
          if (u) {
            await this.syncUnits({ ...this.state, units: [...this.state.units.filter((x) => x.uid !== u.uid), u] });
            const v = this.units.get(u.uid);
            if (v) {
              if (u.pos && !this.isVisible(u.pos)) await this.centerOn(u.pos);
              await this.tween(260, (t) => (v.alpha = t));
            }
          }
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'exhausted': {
          const v = this.units.get(e.unit);
          if (v) v.desat = 0.65;
          if (v && !v.downed) {
            this.done.add(e.unit);
            this.badges.setDone(this.done);
          }
          break;
        }
        case 'refreshed': {
          const v = this.units.get(e.unit);
          if (v) v.desat = 0;
          this.done.delete(e.unit);
          this.badges.setDone(this.done);
          const p = this.unitPos(e.unit);
          if (p) this.spawnFx('levelup', p[0], p[1]);
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'rally': {
          for (const uid of e.affected) {
            const p = this.unitPos(uid);
            if (p) this.spawnFx('light_pillar', p[0], p[1]);
          }
          await this.hooks.onEvent?.(e);
          await this.wait(400);
          break;
        }
        case 'recruited': {
          // the figure is rebuilt in the new team's colours by the final sync
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'phase': {
          for (const v of this.units.values()) if (v.team === e.phase && !v.downed) v.desat = 0;
          this.done.clear();
          this.badges.setDone(this.done);
          await this.hooks.onEvent?.(e);
          break;
        }
        default:
          await this.hooks.onEvent?.(e);
      }
    }
    await this.setState(finalState);
  }
}
