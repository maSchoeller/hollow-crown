import { t } from '../i18n';
import './logo.css';

/**
 * The hollow cracked crown from the app icon (art/icon/icon.png), built by hand as vector in a 100 × 104 box: five chubby points with
 * round tips, an ember-lit hollow behind the notches, one crack down the front band. Colours come from the tokens in logo.css.
 */
export function CrownO() {
  return (
    <svg class="crown-o" viewBox="0 0 100 104" aria-hidden="true" focusable="false">
      {/* hollow inside, seen through the notches */}
      <path class="crown-o__line crown-o__hollow" d="M12 68 Q11 46 21 41 Q30 37 40 43 Q50 35 60 43 Q70 37 79 41 Q89 46 88 68 Z" />
      <ellipse class="crown-o__ember" cx="50" cy="62" rx="32" ry="15" />
      <circle class="crown-o__spark" cx="29" cy="56" r="1.5" />
      <circle class="crown-o__spark" cx="41" cy="52" r="1.2" />
      <circle class="crown-o__spark" cx="72" cy="55" r="1.6" />
      <circle class="crown-o__spark" cx="58" cy="58" r="1.1" />
      {/* the crown body: band and five points */}
      <path
        class="crown-o__line crown-o__gold"
        d="M13 92 L9 42 L17 56 Q21 76 25 56 L29 26 L34 56 Q39 76 44 54 L50 12 L56 54 Q61 76 66 56 L71 26 L75 56 Q79 76 83 56 L91 42 L87 92 Q50 103 13 92 Z"
      />
      {/* highlights: points, band rims */}
      <path class="crown-o__shine" d="M12 50 L15 60 M30 34 L31 46 M50 24 L51 42 M71 34 L72 46" />
      <path class="crown-o__shine" d="M17 77 Q50 86 83 77 M16 88 Q50 98 82 87" />
      {/* tips */}
      {(
        [
          [9, 40, 7],
          [29, 24, 7],
          [50, 11, 8],
          [71, 24, 7],
          [91, 40, 7],
        ] as const
      ).map(([x, y, r]) => (
        <g key={x}>
          <circle class="crown-o__line crown-o__gold" cx={x} cy={y} r={r} />
          <ellipse class="crown-o__gleam" cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.32} ry={r * 0.22} />
        </g>
      ))}
      {/* the crack, ember inside */}
      <path class="crown-o__crack-glow" d="M61 66 L65 73 L60 80 L66 87 L61 93 L63 99" />
      <path class="crown-o__crack-line" d="M61 66 L65 73 L60 80 L66 87 L61 93 L63 99" />
      <path class="crown-o__crack" d="M61 66 L65 73 L60 80 L66 87 L61 93 L63 99" />
      <path class="crown-o__crack-core" d="M61 66 L65 73 L60 80 L66 87 L61 93 L63 99" />
      <circle class="crown-o__spark" cx="84" cy="30" r="1.6" />
      <circle class="crown-o__spark" cx="88" cy="24" r="1.2" />
    </svg>
  );
}

/** The game's name from the locale, over two lines, with the crown in place of the first "o" of the first word, and the season. */
export function Logo() {
  const name = t('ui.title.logo');
  const [first = '', ...rest] = name.split(' ');
  const o = first.toLowerCase().indexOf('o');
  return (
    <h1 class="logo" aria-label={name}>
      <span aria-hidden="true">
        {o < 0 ? (
          first
        ) : (
          <>
            {first.slice(0, o)}
            <CrownO />
            {first.slice(o + 1)}
          </>
        )}
        <br />
        {rest.join(' ')}
      </span>
      <small>{t('ui.title.season')}</small>
    </h1>
  );
}
