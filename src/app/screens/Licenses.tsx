import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import { Piece, ScreenHead, SecondaryButton } from '../../ui/pieces';
import { asset } from '../../ui/components';
import { screen, type Screen } from '../state/screen';
import { FONT_LICENSES, LIBRARY_LICENSES, type LicenseEntry } from './licenseList';
import '../../ui/options.css';
import './Licenses.css';

const licenseUrl = (file: string): string => `${import.meta.env.BASE_URL}licenses/${file}`;

/** One package: name, copyright, license name, and the full text fetched on demand from the static file. */
function Entry({ e }: { e: LicenseEntry }) {
  const [text, setText] = useState<string | undefined>();
  const [state, setState] = useState<'closed' | 'loading' | 'open' | 'failed'>('closed');
  const toggle = () => {
    if (state === 'open') return setState('closed');
    if (text !== undefined) return setState('open');
    setState('loading');
    Promise.all(e.files.map((f) => fetch(licenseUrl(f)).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))))
      .then((parts) => {
        setText(parts.join('\n\n----------\n\n'));
        setState('open');
      })
      .catch(() => setState('failed'));
  };
  return (
    <div class="lic-entry">
      <b class="lic-entry__name">{e.name}</b>
      <span class="lic-entry__license">{e.license}</span>
      <span class="lic-entry__copy">{e.copyright}</span>
      <button type="button" class="lic-entry__toggle" aria-expanded={state === 'open'} onClick={toggle}>
        {state === 'open' ? t('ui.licenses.hide') : t('ui.licenses.show')}
      </button>
      {state === 'loading' && <span class="lic-entry__note">{t('ui.licenses.loading')}</span>}
      {state === 'failed' && (
        <span class="lic-entry__note" role="alert">
          {t('ui.licenses.failed')}
        </span>
      )}
      {state === 'open' && <pre class="lic-entry__text">{text}</pre>}
    </div>
  );
}

/** Licenses page in the options (licensing.md A12): fonts with OFL-1.1, libraries, AI notice. */
export function Licenses({ back }: { back: Screen }) {
  return (
    <div class="screen options-screen licenses-screen">
      <div class="screen-bg" style={{ backgroundImage: `url(${asset('locations/lager_unterwegs.webp')})` }} />
      <div class="options">
        <ScreenHead title={t('ui.licenses')} onBack={() => (screen.value = back)} />
        <p class="lic-intro">{t('ui.licenses.intro')}</p>
        <Piece class="options__stone">
          <h2 class="lic-head">{t('ui.licenses.fonts')}</h2>
          <p class="lic-text">{t('ui.licenses.fonts.text')}</p>
          {FONT_LICENSES.map((e) => (
            <Entry key={e.id} e={e} />
          ))}
        </Piece>
        <Piece class="options__stone">
          <h2 class="lic-head">{t('ui.licenses.libs')}</h2>
          {LIBRARY_LICENSES.map((e) => (
            <Entry key={e.id} e={e} />
          ))}
        </Piece>
        <Piece class="options__stone">
          <h2 class="lic-head">{t('ui.licenses.ai')}</h2>
          <p class="lic-text">{t('ui.licenses.ai.text')}</p>
        </Piece>
      </div>
    </div>
  );
}

/** Entry button in the options. */
export function LicensesLink({ from }: { from: Screen }) {
  return <SecondaryButton onClick={() => (screen.value = { name: 'licenses', back: from })}>{t('ui.licenses')}</SecondaryButton>;
}
