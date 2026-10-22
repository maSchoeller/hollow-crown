/**
 * Audio: Web Audio buses for music and SFX (concept/17 §7). Audio is presentation only – the core
 * knows nothing about it. Missing files are silently skipped, so the game runs without audio assets.
 *
 * Mixing rules, so sounds never pile up:
 * - ui: one voice; a new click replaces the old one, and combat sounds cut it off.
 * - combat: hits, misses, crits and spells; at most two voices (strike + counter overlap a little).
 * - event: downed, death, heal, loot, gold; one voice, others wait in a short queue.
 * - jingle: phase, level up, recruit, victory, defeat; one voice, ducks the music, drops minor events.
 *   Victory and defeat fade the battle music out and hold the next track until they have finished.
 */
import { effect } from '@preact/signals';
import { settings } from './store';

const BASE = `${import.meta.env.BASE_URL}assets/audio/`;

type Bus = 'ui' | 'combat' | 'event' | 'jingle';
interface Voice {
  id: string;
  bus: Bus;
  src: AudioBufferSourceNode;
  gain: GainNode;
  ends: number;
}

const JINGLES = new Set(['phase', 'levelup', 'recruit', 'victory', 'defeat']);
const FINALE = new Set(['victory', 'defeat']);
const UI = new Set(['tap', 'confirm', 'cancel', 'error']);
const EVENTS = new Set(['downed', 'death', 'heal', 'loot', 'gold']);
/** events that may be skipped while a jingle plays (the jingle already marks the moment) */
const MINOR = new Set(['heal', 'loot', 'gold']);

const busOf = (id: string): Bus => (JINGLES.has(id) ? 'jingle' : UI.has(id) ? 'ui' : EVENTS.has(id) ? 'event' : 'combat');
const MAX_VOICES: Record<Bus, number> = { ui: 1, combat: 2, event: 1, jingle: 1 };
/** music level while a jingle plays (≈ −9 dB) */
const DUCK = 0.35;
/** the same sound is not retriggered within this window (seconds) */
const RETRIGGER = 0.06;
/** queued events older than this are dropped (seconds) */
const QUEUE_TTL = 1.2;

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private available: Set<string> | null = null;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private current: { id: string; src: AudioBufferSourceNode; gain: GainNode; startedAt: number } | null = null;
  /** cue being loaded; prevents starting the same track twice while its buffer decodes */
  private loading: string | null = null;
  private wanted: string | null = null;
  private voices: Voice[] = [];
  private lastPlayed = new Map<string, number>();
  private queue: { id: string; at: number }[] = [];
  private holdUntil = 0;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const unlock = () => {
      if (!this.ensure()) return;
      if (this.ctx!.state === 'suspended') void this.ctx!.resume();
      if (this.wanted && this.current?.id !== this.wanted && this.loading !== this.wanted) this.music(this.wanted);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') void this.ctx.suspend();
      else void this.ctx.resume();
    });
    effect(() => {
      const s = settings.value;
      if (this.musicGain) this.musicGain.gain.value = s.music * 0.7;
      if (this.sfxGain) this.sfxGain.gain.value = s.sfx;
    });
  }

  private ensure(): boolean {
    if (this.ctx) return true;
    try {
      this.ctx = new AudioContext();
    } catch {
      return false;
    }
    this.musicGain = this.ctx.createGain();
    this.duckGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = settings.value.music * 0.7;
    this.sfxGain.gain.value = settings.value.sfx;
    this.musicGain.connect(this.duckGain).connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    void fetch(`${import.meta.env.BASE_URL}assets/manifest.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((m: { audio?: string[] }) => (this.available = new Set(m.audio ?? [])))
      .catch(() => (this.available = new Set()));
    return true;
  }

  private load(id: string): Promise<AudioBuffer | null> {
    let p = this.buffers.get(id);
    if (!p) {
      p = (async () => {
        if (!this.ctx || !this.available?.has(id)) return null;
        try {
          const r = await fetch(`${BASE}${id}.mp3`);
          if (!r.ok) return null;
          return await this.ctx.decodeAudioData(await r.arrayBuffer());
        } catch {
          return null;
        }
      })();
      this.buffers.set(id, p);
    }
    return p;
  }

  private fadeOut(v: Voice, seconds = 0.08): void {
    const now = this.ctx!.currentTime;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setTargetAtTime(0, now, seconds / 3);
    v.src.stop(now + seconds);
    v.ends = now;
  }

  private alive(bus?: Bus): Voice[] {
    const now = this.ctx!.currentTime;
    this.voices = this.voices.filter((v) => v.ends > now);
    return bus ? this.voices.filter((v) => v.bus === bus) : this.voices;
  }

  private duck(seconds: number): void {
    if (!this.ctx || !this.duckGain) return;
    const g = this.duckGain.gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(DUCK, now, 0.05);
    g.setTargetAtTime(1, now + Math.max(0.2, seconds - 0.25), 0.3);
  }

  /** Plays a sound effect; variants `<id>_2`, `<id>_3` are picked at random (presentation randomness). */
  sfx(id: string): void {
    if (!this.ctx || !this.available || settings.value.sfx <= 0) return;
    const variants = [id, `${id}_2`, `${id}_3`].filter((v) => this.available!.has(v));
    if (!variants.length) return;
    const now = this.ctx.currentTime;
    if (now - (this.lastPlayed.get(id) ?? -1) < RETRIGGER) return;
    this.lastPlayed.set(id, now);
    const bus = busOf(id);
    if (bus === 'event' && this.alive('jingle').length && MINOR.has(id)) return;
    if (bus === 'event' && this.alive('event').length) {
      this.queue = [...this.queue.filter((q) => now - q.at < QUEUE_TTL), { id, at: now }].slice(-2);
      return;
    }
    const pick = variants[Math.floor(Math.random() * variants.length)]!;
    void this.load(pick).then((buf) => this.start(id, bus, buf));
  }

  private start(id: string, bus: Bus, buf: AudioBuffer | null): void {
    if (!buf || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const same = this.alive(bus);
    if (same.length >= MAX_VOICES[bus]) same.slice(0, same.length - MAX_VOICES[bus] + 1).forEach((v) => this.fadeOut(v));
    if (bus === 'combat') this.alive('ui').forEach((v) => this.fadeOut(v));
    if (bus === 'jingle') {
      this.alive('event').forEach((v) => this.fadeOut(v, 0.15));
      this.queue = this.queue.filter((q) => !MINOR.has(q.id));
      this.duck(buf.duration);
    }
    if (FINALE.has(id)) {
      this.alive().forEach((v) => v.bus !== 'jingle' && this.fadeOut(v, 0.2));
      this.queue = [];
      this.holdMusic(buf.duration);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = bus === 'jingle' ? 1 : 0.97 + Math.random() * 0.06;
    const gain = this.ctx.createGain();
    src.connect(gain).connect(this.sfxGain);
    src.start();
    const v: Voice = { id, bus, src, gain, ends: now + buf.duration / src.playbackRate.value };
    this.voices.push(v);
    if (bus === 'event') src.onended = () => this.next();
  }

  /** Starts the next queued event sound once the event voice is free. */
  private next(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.queue = this.queue.filter((q) => now - q.at < QUEUE_TTL);
    const q = this.queue.shift();
    if (!q) return;
    const variants = [q.id, `${q.id}_2`, `${q.id}_3`].filter((v) => this.available?.has(v));
    const pick = variants[Math.floor(Math.random() * variants.length)];
    if (pick) void this.load(pick).then((buf) => this.start(q.id, 'event', buf));
  }

  /** Fades the current music out and keeps new tracks waiting until a victory/defeat jingle ends. */
  private holdMusic(seconds: number): void {
    if (!this.ctx) return;
    this.holdUntil = this.ctx.currentTime + seconds;
    const old = this.current;
    if (old) {
      old.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
      old.src.stop(this.ctx.currentTime + 0.6);
      this.current = null;
    }
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = setTimeout(() => {
      this.holdTimer = null;
      if (this.wanted && this.current?.id !== this.wanted) this.music(this.wanted);
    }, seconds * 1000);
  }

  /** Crossfades to a music cue; the player/enemy phase pair keeps its position (concept/17 §6). */
  music(id: string | null): void {
    this.wanted = id;
    if (!this.ctx || !this.musicGain) return;
    if (this.current?.id === id || (id && this.loading === id)) return;
    // unknown cue (e.g. a dialogue mood without its own track): keep the current music
    if (id && this.available && !this.available.has(id)) return;
    // a victory/defeat jingle is playing: the cue starts when it ends (see holdMusic)
    if (this.ctx.currentTime < this.holdUntil) return;
    const old = this.current;
    const offset = old ? this.ctx.currentTime - old.startedAt : 0;
    if (old) {
      old.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      old.src.stop(this.ctx.currentTime + 0.8);
      this.current = null;
    }
    if (!id) return;
    this.loading = id;
    void (async () => {
      if (!this.available) await new Promise((r) => setTimeout(r, 300));
      const buf = await this.load(id);
      if (this.loading === id) this.loading = null;
      if (!buf || !this.ctx || !this.musicGain || this.wanted !== id || this.current?.id === id) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2);
      src.connect(gain).connect(this.musicGain);
      const paired = old && old.id.startsWith('battle_') && id.startsWith('battle_');
      const start = paired ? offset % buf.duration : 0;
      src.start(0, start);
      this.current = { id, src, gain, startedAt: this.ctx.currentTime - start };
    })();
  }
}

export const audio = new AudioManager();
