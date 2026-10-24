/** Modules of the packs plugin (tools/build/packs-plugin.ts, story 7.1). */
declare module 'virtual:hc-pack/*' {
  /** parsed YAML of the pack, keyed `content/<path>` */
  const files: Record<string, unknown>;
  export default files;
}

declare module 'virtual:hc-packs' {
  import type { PackLoad } from './packs';
  /** released packs in the order of content/packs.yaml (core first) */
  export const packs: { id: string; load: PackLoad; act: number; lang?: 'de' | 'en'; budgetMb: number }[];
  /** which pack holds a map or scene, by id */
  export const contentIndex: { maps: Record<string, string>; scenes: Record<string, string> };
  /** content import per pack other than core */
  export const loaders: Record<string, () => Promise<Record<string, unknown>>>;
}
