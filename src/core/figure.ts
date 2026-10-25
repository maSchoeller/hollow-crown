import type { ClassDef } from './defs';

/** The fields of a unit (battle unit, roster record or map definition) that decide which figure shows it. */
export interface FigureSource {
  portrait?: string;
  sprite?: string;
  charId?: string;
  classId?: string;
}

type ClassFigures = Readonly<Record<string, Pick<ClassDef, 'sprite' | 'art'> | undefined>>;

/**
 * Id of the figure (3D model / sprite) of a unit: its own sprite or character, else the one its class names
 * (`sprite`, then `art` in classes.yaml: the role classes still draw the old weapon-class figures), else the class id.
 * The one rule for the board and the loading plan.
 */
export function unitFigureId(u: FigureSource, classes: ClassFigures): string {
  const cls = u.classId ? classes[u.classId] : undefined;
  return u.sprite ?? u.charId ?? cls?.sprite ?? cls?.art ?? u.classId ?? '';
}

/** A figure per chosen portrait where a model exists (avatar_a / avatar_b), else the unit's own figure. */
export function modelId(u: FigureSource, models: readonly string[], classes: ClassFigures): string {
  return u.portrait && models.includes(u.portrait) ? u.portrait : unitFigureId(u, classes);
}

/**
 * Path below `assets/` of a unit model: in the folder of the pack of its first appearance (`manifest.models.unitPacks`,
 * tools/art/model_packs.py, story 8.2), else `models/units/`.
 */
export function unitModelPath(id: string, unitPacks?: Readonly<Record<string, string>>): string {
  const pack = unitPacks?.[id];
  return pack ? `${pack}/models/units/${id}.glb` : `models/units/${id}.glb`;
}
