/**
 * Audio: Web Audio buses for music and SFX (concept/17 §7). Audio is presentation only – the core
 * knows nothing about it. Missing files are silently skipped, so the game runs without audio assets.
 */
import { effect } from '@preact/signals';
import { settings } from './store';

const BASE = `${import.meta.env.BASE_URL}assets/audio/`;

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private available: Set<string> | null = null;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private current: { id: string; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private wanted: string | null = null;

  constructor() {
    const unlock = () => {
      this.ensure();
      void this.ctx?.resume();
      if (this.wanted) this.music(this.wanted);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
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
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = settings.value.music * 0.7;
    this.sfxGain.gain.value = settings.value.sfx;
    this.musicGain.connect(this.ctx.destination);
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

  /** Plays a sound effect; variants `<id>_2`, `<id>_3` are picked at random (presentation randomness). */
  sfx(id: string): void {
    if (!this.ctx || !this.available || settings.value.sfx <= 0) return;
    const variants = [id, `${id}_2`, `${id}_3`].filter((v) => this.available!.has(v));
    if (!variants.length) return;
    const pick = variants[Math.floor(Math.random() * variants.length)]!;
    void this.load(pick).then((buf) => {
      if (!buf || !this.ctx || !this.sfxGain) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 0.97 + Math.random() * 0.06;
      src.connect(this.sfxGain);
      src.start();
    });
  }

  /** Crossfades to a music cue; the player/enemy phase pair keeps its position (concept/17 §6). */
  music(id: string | null): void {
    this.wanted = id;
    if (!this.ctx || !this.musicGain) return;
    if (this.current?.id === id) return;
    const old = this.current;
    const offset = old && this.ctx ? (this.ctx.currentTime - (old.src as unknown as { startedAt: number }).startedAt) : 0;
    if (old) {
      old.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      old.src.stop(this.ctx.currentTime + 0.8);
      this.current = null;
    }
    if (!id) return;
    void (async () => {
      if (!this.available) await new Promise((r) => setTimeout(r, 300));
      const buf = await this.load(id);
      if (!buf || !this.ctx || !this.musicGain || this.wanted !== id) return;
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
      (src as unknown as { startedAt: number }).startedAt = this.ctx.currentTime - start;
      this.current = { id, src, gain };
    })();
  }
}

export const audio = new AudioManager();
