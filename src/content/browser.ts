/** Browser-side content: YAML is compiled to JSON modules at build time (vite.config.ts). */
import { buildContent, type LoadedContent } from './load';

const files = import.meta.glob('/content/**/*.yaml', { eager: true, import: 'default' }) as Record<string, unknown>;

let cached: LoadedContent | null = null;
export function loadContent(): LoadedContent {
  if (!cached) {
    cached = buildContent(files);
    if (cached.issues.length) console.warn('[content]', cached.issues);
  }
  return cached;
}
