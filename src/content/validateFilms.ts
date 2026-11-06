import type { GameData } from '../core/gameData';
import type { FilmPoint } from '../core/filmDefs';

/** How far (tiles) a film point may lie outside its map: actors walk in from beyond the edge, the camera looks in from outside. */
const OUTSIDE = 6;

/**
 * Film scenes (epic 16): the scene and map exist, every shot starts at a speech line of the scene (each line once), every
 * actor is a company member or names a model, moves and gestures name actors of the film, and points stay near the map.
 */
export function validateFilms(data: GameData, err: (file: string, message: string) => void): void {
  const scenesWithFilm = new Map<string, string>();
  for (const film of Object.values(data.films ?? {})) {
    const f = `films/${film.id}`;
    const scene = data.scenes[film.scene];
    if (!scene) err(f, `unknown scene ${film.scene}`);
    const other = scenesWithFilm.get(film.scene);
    if (other) err(f, `scene ${film.scene} already has the film ${other}`);
    scenesWithFilm.set(film.scene, film.id);
    const map = data.maps[film.map];
    if (!map) err(f, `unknown map ${film.map}`);
    const near = (p: readonly number[], ctx: string) => {
      if (!map) return;
      const [w, h] = map.size;
      if (p[0]! < -OUTSIDE || p[0]! > w + OUTSIDE || p[1]! < -OUTSIDE || p[1]! > h + OUTSIDE) err(f, `${ctx}: point [${p.join(', ')}] lies far outside the map`);
    };
    const actors = new Set<string>();
    for (const a of film.actors) {
      if (actors.has(a.id)) err(f, `actor ${a.id} is listed twice`);
      actors.add(a.id);
      if (!a.model && a.id !== 'avatar' && !data.chars[a.id]) err(f, `actor ${a.id}: not a company member, so it needs a model`);
      near(a.at, `actor ${a.id}`);
    }
    const speech = new Set((scene?.lines ?? []).filter((l) => 'text' in l).map((l) => l.id));
    const used = new Set<string>();
    for (const s of film.shots) {
      const ctx = `shot ${s.line}`;
      if (scene && !speech.has(s.line)) err(f, `${ctx}: no speech line ${s.line} in ${film.scene}`);
      if (used.has(s.line)) err(f, `${ctx}: the line has two shots`);
      used.add(s.line);
      const c = s.camera;
      const eyes = [c.from, c.to, c.end?.from, c.end?.to].filter((e): e is readonly [number, number, number] => !!e);
      for (const e of eyes) near([e[0], e[2]], `${ctx} camera`);
      if (eyes.length >= 2 && c.from.every((v, i) => v === c.to[i])) err(f, `${ctx}: camera looks at its own position`);
      for (const m of s.moves ?? []) {
        if (!actors.has(m.actor)) err(f, `${ctx}: move of unknown actor ${m.actor}`);
        m.path.forEach((p: FilmPoint) => near(p, `${ctx} move ${m.actor}`));
      }
      for (const g of s.gestures ?? []) {
        if (!actors.has(g.actor)) err(f, `${ctx}: gesture of unknown actor ${g.actor}`);
        if (!g.anim && !g.face) err(f, `${ctx}: gesture of ${g.actor} does nothing`);
      }
    }
  }
}
