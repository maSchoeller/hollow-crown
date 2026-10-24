/** Player settings: persisted in localStorage, applied to the UI language on load and on change. */
import { signal } from '@preact/signals';
import { lang, type Lang } from '../../i18n';

export interface Settings {
  lang: Lang;
  speed: 1 | 2 | 3; // 3 = skip
  enemySpeed: 1 | 2 | 3;
  dangerDefault: boolean;
  confirmForecast: boolean;
  quality: 'low' | 'mid' | 'high';
  /** figures on the board: 3D models or pixel sprites (concept/01-decisions.md D4) */
  figures: '3d' | '2d';
  music: number;
  sfx: number;
  keepAwake: boolean;
  shake: boolean;
  /** scenes advance on their own (the Auto pill of a scene) */
  dialogueAuto: boolean;
}

const SETTINGS_KEY = 'hc.settings';
function loadSettings(): Settings {
  const def: Settings = {
    lang: navigator.language?.startsWith('de') ? 'de' : 'en',
    speed: 1,
    enemySpeed: 2,
    dangerDefault: false,
    confirmForecast: true,
    quality: 'mid',
    figures: '3d',
    music: 0.6,
    sfx: 0.8,
    keepAwake: true,
    shake: true,
    dialogueAuto: false,
  };
  try {
    return { ...def, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>) };
  } catch {
    return def;
  }
}
export const settings = signal<Settings>(loadSettings());
lang.value = settings.value.lang;
export function updateSettings(p: Partial<Settings>): void {
  settings.value = { ...settings.value, ...p };
  if (p.lang) lang.value = p.lang;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value));
  } catch {
    /* private mode */
  }
}
