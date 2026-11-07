/** i18n: key lookup with {placeholders}, avatar name/pronouns and plural forms (concept/10 §7). */
import { signal } from '@preact/signals';

export type Lang = 'de' | 'en';
export const lang = signal<Lang>('de');

let dicts: Record<string, Record<string, string>> = {};
let avatar = { name: 'Rhen', pronoun: 'they' as 'she' | 'he' | 'they' };
const missing = new Set<string>();
let onMissing: (key: string) => void = () => undefined;

/** Called once per missing key, in every build (the app writes it to the log that goes along with a bug report). */
export function setMissingHandler(fn: (key: string) => void): void {
  onMissing = fn;
}

/** Notes a missing key once: console in dev, the missing handler always. */
export function reportMissing(key: string): void {
  if (missing.has(key)) return;
  missing.add(key);
  if (import.meta.env.DEV) console.warn('[i18n] missing', key);
  onMissing(key);
}

export function setLocales(l: Record<string, Record<string, string>>): void {
  dicts = l;
}
/** Adds texts to one language (dev helper: scenes registered at run time). */
export function addTexts(l: string, texts: Record<string, string>): void {
  dicts[l] = { ...(dicts[l] ?? {}), ...texts };
}
export function setAvatar(name: string, pronoun: 'she' | 'he' | 'they'): void {
  avatar = { name, pronoun };
}

export function has(key: string): boolean {
  return !!dicts[lang.value]?.[key] || !!dicts.en?.[key];
}

export function t(key: string, params: Record<string, string | number> = {}): string {
  const l = lang.value;
  let s = dicts[l]?.[key];
  if (s === undefined && typeof params.count === 'number') {
    const form = new Intl.PluralRules(l).select(params.count);
    s = dicts[l]?.[`${key}.${form}`] ?? dicts[l]?.[`${key}.other`];
  }
  if (s === undefined) {
    s = dicts.en?.[key];
    if (s === undefined) {
      reportMissing(key);
      return key;
    }
  }
  return s.replace(/\{([\w.]+)\}/g, (m, name: string) => {
    if (name === 'avatar' || name === 'avatar.name') return avatar.name;
    if (name.startsWith('pronoun.')) return dicts[l]?.[`ui.pronoun.${avatar.pronoun}.${name.slice(8)}`] ?? m;
    const v = params[name];
    return v === undefined ? m : typeof v === 'number' ? new Intl.NumberFormat(l).format(v) : v;
  });
}
