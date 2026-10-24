/** Browser-side content: each pack's YAML arrives as one JSON module from the packs plugin (tools/build/packs-plugin.ts). */
import core from 'virtual:hc-pack/core';
import act1 from 'virtual:hc-pack/act1';
import { buildContent, type LoadedContent } from './load';

let cached: LoadedContent | null = null;
export function loadContent(): LoadedContent {
  if (!cached) {
    cached = buildContent({ ...core, ...act1 });
    if (cached.issues.length) console.warn('[content]', cached.issues);
  }
  return cached;
}
