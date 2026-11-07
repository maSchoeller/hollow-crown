import { describe, expect, it, vi } from 'vitest';
import { lang, setLocales, setMissingHandler, t } from '../../src/i18n';
import { unitName } from '../../src/ui/components';

describe('missing texts (story 15.6 bug: the Troop screen showed unit.kael.name)', () => {
  it('never shows the raw key of a unit name, reports a missing key once and keeps real texts', () => {
    setLocales({ de: { 'ui.unit.unknown': 'Unbekannt', 'unit.lucan.name': 'Lucan' }, en: { 'ui.unit.unknown': 'Unknown' } });
    lang.value = 'de';
    const seen = vi.fn();
    setMissingHandler(seen);
    expect(unitName({ nameKey: 'unit.kael.name' })).toBe('Unbekannt');
    expect(t('unit.kael.name')).toBe('Unbekannt');
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen).toHaveBeenCalledWith('unit.kael.name');
    expect(unitName({ nameKey: 'unit.lucan.name' })).toBe('Lucan');
    expect(unitName({ name: 'Rhen', nameKey: 'unit.avatar.name' })).toBe('Rhen');
    // other keys stay visible as keys (a hint for the developer), and are reported too
    expect(t('ui.nope')).toBe('ui.nope');
    expect(seen).toHaveBeenLastCalledWith('ui.nope');
    setMissingHandler(() => undefined);
  });
});
