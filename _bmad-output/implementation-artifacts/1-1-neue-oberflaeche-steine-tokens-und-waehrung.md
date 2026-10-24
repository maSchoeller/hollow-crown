# Story 1.1: Neue Oberfläche – Steine, Tokens und Währung

Status: review

## Story

Als Spieler
möchte ich eine Oberfläche, die aussieht wie Spielzeug aus derselben Kiste wie die Welt,
damit sich Menüs nicht wie eine Website über dem Spiel anfühlen.

## Acceptance Criteria

1. **Tokens:** Farben, Typografie, Rundungen und Abstände aus `concept/25-ux/DESIGN.md` stehen als CSS-Variablen in `src/ui/` bereit.
2. **Schriften:** Fraunces ist als Namensschrift eingebunden (einzige neue Abhängigkeit: Schriftpaket); Cinzel, Grenze Gotisch, Nunito Sans und Silkscreen entfallen; es bleiben Barlow, Barlow Condensed und Fraunces.
3. **Bausteine:** wiederverwendbare Preact-Komponenten `Piece`, `PrimaryButton`, `SecondaryButton`, `QuietButton` mit Druckzustand (Unterkante 4 → 1 px).
4. **Währung:** `Amount` rendert jeden Betrag an Gold, Material, EP oder Glutfunken als Symbol + Zahl (Münze, Stern; Materialien und Glutfunke mit gemaltem Item-Bild) mit tabellarischen Ziffern.
5. **Material-Bild Pflicht:** Ein Material ohne Bild in `art/items/` lässt `pnpm content:check` scheitern.
6. **Titel:** entspricht `concept/25-ux/mockups/07-start-kampagnen.html`: eine Haupttaste „Fortsetzen“ mit Avatar, Akt und Stand; „Kampagnen“; „Optionen“; Versionszeile mit Update-Prüfung.
7. **Budget und Bewegung:** `pnpm build` bleibt im Bundle-Budget; `prefers-reduced-motion` lässt den Druck-Effekt, schaltet aber jedes Wackeln ab.

## Tasks / Subtasks

- [x] T1 Tokens und Schriften (AC 1, 2)
  - [x] `src/ui/tokens.css` mit Präfix `--hc-` (die PoC-Variablen in `styles.css` heißen teils gleich, z. B. `--line`, mit anderer Bedeutung)
  - [x] `@fontsource/fraunces` (600, 600 kursiv, 700, 900); vier PoC-Schriftpakete entfernt; `styles.css` nutzt Fraunces statt Grenze Gotisch, Schadenszahlen in Barlow Condensed statt Silkscreen
- [x] T2 Bausteine (AC 3, 4)
  - [x] `src/ui/pieces.tsx` + `pieces.css`: `Piece`, `PrimaryButton`, `SecondaryButton`, `QuietButton` (optionale zweite Zeile `sub`), `Amount`
- [x] T3 Material-Bilder (AC 5)
  - [x] `pnpm art:build` erzeugt `public/assets/items/<id>.webp` (132 px) aus `art/items/`; `content:check` verlangt ein Bild je Material
  - [x] Staffel-1-Orte (`art/mockups/locations-s1`) als `public/assets/locations/`; Titel nutzt `lager_unterwegs`
- [x] T4 Titelbildschirm (AC 6)
  - [x] Logo, „Fortsetzen“ mit Stand, „Kampagnen“, „Optionen“, Versionszeile
  - [x] „Kampagnen“ öffnet bis Story 1.3 ein Zwischenmenü (Neues Spiel, Laden, Importieren)
- [x] T5 Beträge umstellen (AC 4)
  - [x] Lager (Gold, Materialien, Preise, Verkauf, Aufwertung, Neu würfeln, Runen, Narben), Weltkarte, Ergebnis (Gold, Material, EP), Belohnungen der Nebenziele, EP im Wertefeld
- [x] T6 Bewegung (AC 7)
  - [x] `prefers-reduced-motion`: Wipp-Hinweis im Dialog aus; Kamera-Wackeln bei Volltreffern aus (und folgt jetzt auch der Option „Wackeln“)

## Dev Notes

- Story baut nur Grundlage und Titel. Die übrigen Screens behalten ihren U21-Look, bis ihre Stories sie umbauen (1.3 Kampagnen, 2.1 Kampf-HUD, 6.x Truppe/Lager).
- Mockup-Detail „Avatar“ im Fortsetzen-Knopf: als Name des Avatars umgesetzt (Text „Rhen · Akt 1 · vor Kapitel 1“), wie im Mockup.
- Hintergrundbild des Titels kommt aus `public/assets/` (von `pnpm art:build` erzeugt, gitignored); im frischen Worktree fehlt es.

### References

- [Source: concept/25-ux/DESIGN.md]
- [Source: concept/25-ux/mockups/07-start-kampagnen.html]
- [Source: concept/25-ux/.decision-log.md (Währungsanzeige, Start und Kampagnen)]
- [Source: concept/26-epics/epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test` (57), `pnpm content:check`, `pnpm build` grün; Bundle 4,74 MB roh / 2,13 MB Transfer (Budget 15 MB).
- `content:check` scheitert ohne Symbole mit „material without symbol“ für alle vier Materialien (geprüft vor dem Eintragen).
- Browser (375 × 812): Titel wie Mockup (Fraunces 900, Krone in Gold, „Fortsetzen“ mit „Rhen · Act 1 · before Chapter 1“, Kampagnen, Optionen, Versionszeile); Zwischenmenü „Kampagnen“; Händler mit Münze + Zahl, nicht bezahlbare Preise rot; Materialzeile mit vier Symbolen; Druckzustand gemessen: Unterkante 1 px, Versatz 3 px.

### Completion Notes List

- Auf Wunsch des Produktinhabers zeigen Materialien und Glutfunke ihr gemaltes Item-Bild statt Vektorformen; Gold und EP bleiben Vektor (keine Bilder). DESIGN.md, Epic-AC und Decision-Log angepasst.
- Die Option „Wackeln“ war bisher nicht mit dem Brett verbunden; jetzt steuert sie das Kamera-Wackeln, `prefers-reduced-motion` schaltet es immer ab.
- Neue Locale-Schlüssel: `ui.resource.*`, `ui.title.campaigns`, `ui.title.season`, `ui.title.resume`, `ui.title.where.*`.

### File List

- `src/ui/tokens.css`, `src/ui/pieces.css`, `src/ui/pieces.tsx` (neu)
- `src/ui/styles.css`, `src/ui/components.tsx`
- `src/app/screens/Menus.tsx`, `src/app/screens/Camp.tsx`, `src/app/screens/Battle.tsx`
- `src/render/board.ts` (`shakeEnabled`)
- `src/core/defs.ts`, `src/content/schemas.ts`, `src/content/validate.ts`
- `content/items.yaml`, `content/locales/de.yaml`, `content/locales/en.yaml`
- `package.json`, `pnpm-lock.yaml`
- `concept/25-ux/.decision-log.md`
