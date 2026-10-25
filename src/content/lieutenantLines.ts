/**
 * The fixed lines of a lieutenant (story 3.1): the scene `scn.lt.<id>` holds one line per id, like the barks of story 9.13.
 * Three grudge lines and the mocking line carry the placeholder {target} (the name of the grudge target).
 */
export const LIEUTENANT_LINES = ['first', 'grudge_1', 'grudge_2', 'grudge_3', 'flee_1', 'flee_2', 'flee_3', 'mock'] as const;
export type LieutenantLine = (typeof LIEUTENANT_LINES)[number] | 'join';

/** The line ids a lieutenant's scene must hold, in order; a lieutenant with `joins` also holds `join`. */
export const lieutenantLineIds = (lt: { joins?: boolean }): string[] => [...LIEUTENANT_LINES, ...(lt.joins ? ['join'] : [])];

/** Placeholder for the name of the grudge target in a line. */
export const TARGET_PLACEHOLDER = '{target}';

/** A line with the target's name put in (`t(key, { target })` does the same at run time). */
export const fillTarget = (text: string, name: string): string => text.split(TARGET_PLACEHOLDER).join(name);
