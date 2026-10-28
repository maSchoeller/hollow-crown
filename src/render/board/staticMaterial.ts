/**
 * Which board materials stay frozen while the board stands (story 8.11): the props (shared and glTF), the opaque terrain layers; not
 * water, veil, rings, figures.
 *
 * Not the see-through twins of props (`<prop material>:fade`, story 8.10): they draw with a depth pre-pass, and a frozen material skips
 * its readiness check, so the shader it compiled during the pre-pass (`DEPTHPREPASS`, which writes plain black) would stay in use for
 * the colour pass too: the faded prop shows as a solid black silhouette.
 */
const STATIC_MATERIAL = /^(props$|prop:(?!.*:fade$)|terrain-(caps|earth|rock|wall|decks|rails)$)/;

export const isStaticMaterial = (name: string): boolean => STATIC_MATERIAL.test(name);
