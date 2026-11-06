import { beforeAll, describe, expect, it } from 'vitest';
import { actorSpot, alongPath, cameraAt, facingTowards, filmCuts, filmOfScene, tileOf, type FilmDef } from '../../src/core';
import type { GameData } from '../../src/core/gameData';
import { loadContentFromDisk } from '../../src/content/node';
import { validateFilms } from '../../src/content/validateFilms';

const film: FilmDef = {
  id: 'film.t',
  scene: 'scn.t',
  map: 'm',
  actors: [
    { id: 'a', at: [1, 9] },
    { id: 'b', model: 'soldier', at: [2, 2] },
  ],
  shots: [
    { line: 'l02', camera: { from: [0, 2, 10], to: [1, 0, 8], fov: 40, ms: 1000 }, moves: [{ actor: 'a', path: [[1, 9], [1, 7]], ms: 500 }] },
    { line: 'l04', camera: { from: [0, 1, 6], to: [1, 0.5, 7], end: { from: [2, 1, 6] }, fov: 30, ms: 2000 }, moves: [{ actor: 'a', path: [[1, 7], [3, 7]], ms: 500 }] },
  ],
};

describe('film timeline (epic 16)', () => {
  it('keeps a shot over the lines that follow and opens with the first', () => {
    const cuts = filmCuts(film, ['l01', 'l02', 'l03', 'l04', 'l05']);
    expect(cuts.map((c) => c.shot.line)).toEqual(['l02', 'l02', 'l02', 'l04', 'l04']);
    expect(cuts.map((c) => c.fresh)).toEqual([true, false, false, true, false]);
    // a filtered line (requires) leaves its shot to the next one that plays
    expect(filmCuts(film, ['l03', 'l05']).map((c) => c.shot.line)).toEqual(['l02', 'l02']);
    expect(filmCuts({ ...film, shots: [] }, ['l01'])).toEqual([]);
  });

  it('knows where actors stand after the moves of earlier shots', () => {
    expect(actorSpot(film, 'a', -1)).toEqual([1, 9]);
    expect(actorSpot(film, 'a', 0)).toEqual([1, 7]);
    expect(actorSpot(film, 'a', 1)).toEqual([3, 7]);
    expect(actorSpot(film, 'b', 1)).toEqual([2, 2]);
    expect(actorSpot(film, 'x', 1)).toBeNull();
  });

  it('walks paths at even speed and eases the camera', () => {
    const path = [[0, 0], [2, 0], [2, 2]] as const;
    expect(alongPath(path, 0)).toEqual([0, 0]);
    expect(alongPath(path, 0.25)).toEqual([1, 0]);
    expect(alongPath(path, 0.75)).toEqual([2, 1]);
    expect(alongPath(path, 1)).toEqual([2, 2]);
    expect(alongPath([], 0.5)).toEqual([0, 0]);
    expect(alongPath([[1, 1], [1, 1]], 0.5)).toEqual([1, 1]);
    const c = film.shots[1]!.camera;
    expect(cameraAt(c, 0).from).toEqual([0, 1, 6]);
    expect(cameraAt(c, 0.5).from).toEqual([1, 1, 6]);
    expect(cameraAt(c, 2).from).toEqual([2, 1, 6]);
    expect(cameraAt(c, 1).to).toEqual([1, 0.5, 7]);
  });

  it('turns and rounds', () => {
    expect(facingTowards([0, 0], [3, 1])).toBe('e');
    expect(facingTowards([0, 0], [-3, 1])).toBe('w');
    expect(facingTowards([0, 0], [0, -1])).toBe('n');
    expect(facingTowards([0, 0], [1, 2])).toBe('s');
    expect(tileOf([7.4, 19.6])).toEqual([7, 20]);
  });
});

describe('film content (epic 16)', () => {
  let data: GameData;
  beforeAll(() => {
    data = loadContentFromDisk().data;
  });

  it('loads the reference film of 1-1 and finds it by its scene', () => {
    const f = filmOfScene(data.films, 'scn.m1_1.intro');
    expect(f?.id).toBe('film.m1_1.intro');
    expect(filmOfScene(data.films, 'scn.none')).toBeNull();
    expect(filmOfScene(undefined, 'scn.m1_1.intro')).toBeNull();
  });

  it('reports broken films', () => {
    const errs: string[] = [];
    const bad: FilmDef = {
      id: 'film.bad',
      scene: 'scn.m1_1.intro',
      map: 'nowhere',
      actors: [{ id: 'stranger', at: [0, 0] }, { id: 'stranger', model: 'soldier', at: [0, 0] }],
      shots: [
        { line: 'l99', camera: { from: [1, 1, 1], to: [1, 1, 1], fov: 30, ms: 0 } },
        { line: 'l99', camera: { from: [1, 1, 1], to: [2, 1, 1], fov: 30, ms: 0 }, moves: [{ actor: 'ghost', path: [[0, 0], [1, 1]], ms: 200 }], gestures: [{ actor: 'ghost' }] },
      ],
    };
    validateFilms({ ...data, films: { ...data.films, bad } }, (_f, m) => errs.push(m));
    const text = errs.join('\n');
    for (const want of ['already has the film', 'unknown map nowhere', 'actor stranger is listed twice', 'needs a model', 'no speech line l99', 'two shots', 'looks at its own position', 'move of unknown actor ghost', 'gesture of unknown actor ghost', 'does nothing'])
      expect(text).toContain(want);
    const far: string[] = [];
    validateFilms({ ...data, films: { far: { ...film, id: 'film.far', scene: 'scn.m1_1.outro', map: 'm1_1_steckbriefe', actors: [{ id: 'kael', at: [99, 0] }], shots: [] } } }, (_f, m) => far.push(m));
    expect(far.join('\n')).toContain('far outside the map');
  });
});

describe('film stage (epic 16)', () => {
  it('puts only the actors on the map, where the film places them', async () => {
    const { newCampaign, filmStage } = await import('../../src/core');
    const { data } = loadContentFromDisk();
    const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const f = data.films!['film.m1_1.intro']!;
    const s = filmStage(data, c, f)!;
    const kael = s.units.find((u) => u.uid === 'kael');
    expect(kael?.pos).toEqual([7, 20]);
    const h1 = s.units.find((u) => u.uid === 'h1');
    expect(h1?.team).toBe('enemy');
    expect(s.units.every((u) => f.actors.some((a) => a.id === u.uid))).toBe(true);
    // an extra the map does not have is dressed from its first unit
    const extra = filmStage(data, c, { ...f, actors: [{ id: 'crowd1', model: 'villager_elder', team: 'other', at: [3, 3] }] })!;
    expect(extra.units[0]).toMatchObject({ uid: 'crowd1', sprite: 'villager_elder', team: 'other', pos: [3, 3] });
    expect(filmStage(data, c, { ...f, map: 'nowhere' })).toBeNull();
  });
});
