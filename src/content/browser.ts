/**
 * Browser-side content: each pack's YAML arrives as one JSON module from the packs plugin (tools/build/packs-plugin.ts).
 * Core is part of the app bundle; the other packs register later (story 7.2) and are merged into the same objects.
 */
import core from 'virtual:hc-pack/core';
import { contentIndex, packs } from 'virtual:hc-packs';
import { packActs } from '../packs/plan';
import { CORE_PACK } from './packs';
import { buildContent, mergePackContent, type LoadedContent } from './load';

let cached: LoadedContent | null = null;
const registered = new Set<string>([CORE_PACK]);

export function loadContent(): LoadedContent {
  if (!cached) {
    cached = buildContent(core);
    // only released packs are in the build (story 11.1: the next act opens where its pack is)
    cached.data.releasedActs = packActs(packs);
    if (cached.issues.length) console.warn('[content]', cached.issues);
  }
  return cached;
}

/** Adds a pack's content (maps, scenes, texts) to the loaded content; a second call for the same pack does nothing. */
export function registerPackContent(id: string, files: Record<string, unknown>): void {
  if (registered.has(id)) return;
  const issues = mergePackContent(loadContent(), files);
  if (issues.length) console.warn(`[content] pack ${id}`, issues);
  registered.add(id);
}

export const isPackRegistered = (id: string): boolean => registered.has(id);

/** The pack that holds a map or scene, or null when no released pack does. */
export const packOfMap = (id: string): string | null => contentIndex.maps[id] ?? null;
export const packOfScene = (id: string): string | null => contentIndex.scenes[id] ?? null;
