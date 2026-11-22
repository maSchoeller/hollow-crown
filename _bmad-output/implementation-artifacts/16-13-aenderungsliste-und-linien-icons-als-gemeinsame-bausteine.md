# Story 16.13: Änderungsliste und Linien-Icons als gemeinsame Bausteine

Status: done

## Story

Als Spieler
möchte ich bei jeder Probe nur sehen, was sich ändert,
damit Vergleiche ohne Rechnen gehen.

## Acceptance Criteria

(Quelle: Epic 16, Story 16.13; EXPERIENCE „Änderungsliste“, DESIGN `change-list` und „Linien-Icons statt Emojis“. Die Epic-Dateien liegen noch nicht auf `main`; maßgeblich ist der Planungsstand 2026-11-21.)

1. **Kernfunktion.** Eine reine Funktion `changeList(data, unit, probe, ctx?)` in `src/core` (Vorschlag `src/core/rules/changes.ts`, über `src/core/index.ts` exportiert) liefert für „Item A (Probe) gegen Item B (Getragenes im selben Platz) für Figur X“ eine Liste `ChangeLine[]`. Ohne Probe liefert sie den aktuellen Stand des Items (`mode: 'state'`), mit Probe nur Änderungen (`mode: 'diff'`).
2. **Zeilenarten.** Jede Zeile hat einen stabilen `key`; Arten:
   - `stat` (TP, Angriff, Treffer, Krit, Ausweichen, Stärke, Magie, Geschick, Tempo, Glück, Verteidigung, Resistenz, Bewegung, Reichweite, Gewicht, Last): `value` (neu), `delta` (Differenz), `better` (bei Gewicht und Last ist weniger besser);
   - `element`: Element-Wechsel mit `from` und `to` („Wasser · statt Feuer“; ohne vorheriges Element „neu“);
   - `elementDamage`: Schaden je Gegner-Element, **nur für Elemente, deren Wert sich ändert** (`against`, `value`, `delta`);
   - `effect`: neue Wirkung (`appears: true`, Schlüssel der Erklärung) oder verlorene (`appears: false`, „fällt weg“);
   - `armorElement`: bei Rüstung „Feuer-Treffer gegen dich ×0,8“ (Faktor neu, `better` wenn Faktor kleiner wird).
3. **Keine Nullzeilen.** Unveränderte Werte erscheinen im Modus `diff` nicht; sind alle gleich, ist die Liste leer (die Oberfläche zeigt dann „trägt sie schon“ bzw. „keine Änderung“).
4. **Gleiche Formeln.** Die Funktion rechnet nur über die bestehenden Stat- und Formelfunktionen (`computeStats`, `weaponProfile`, `itemElement`, `armorAffinity`, `elementMultiplier` und der Schadenskern aus `combat.ts`), nie über eine Kopie. Sie ersetzt `equipPreview`/`EquipDelta` in `src/core/campaign/camp.ts`; die bisherigen Aufrufer (`Equip.tsx`, Schmiede in `Rooms.tsx`) werden umgestellt, nichts Doppeltes bleibt.
5. **Test: Änderung = Differenz.** Ein Unit-Test belegt je Zeilenart, dass `delta` genau dem Wert aus `computeStats`/`weaponProfile` mit Probe minus ohne Probe entspricht (auch für Zwei-Händer, der die Nebenhand räumt), und dass der Schaden je Element dieselbe Zahl ergibt wie die Kampfauflösung für denselben Fall.
6. **Komponente `ChangeList`.** Eine Preact-Komponente `ChangeList` (`src/ui/ChangeList.tsx`, `src/ui/change-list.css` daneben, nach DESIGN `change-list`): Zeile aus rundem Symbol (18 px), Bezeichnung, neuem Wert in `{typography.number}` und Differenz rechts (`positive` grün bzw. rot); gestrichelte Trennlinien; kein Pfeil, keine Vorher-Spalte. „neu“ in Glutorange mit einem Satz Erklärung, „fällt weg“ durchgestrichen. Ohne Probe zeigt dieselbe Fläche den Stand. Eine kompakte Variante `ChangeChips` (bis zu zwei Chips aus Symbol, neuem Wert, Differenz) für die Händler-Zeile (16.17) liegt in derselben Datei.
7. **Linien-Icons.** `src/ui/icons.tsx` ergänzt die fehlenden Zeichen im 24er Raster, Strich 1,9, runde Enden (Pfade im Record `P`): `hp` (TP), `move` (Bewegung), `weight` (Gewicht), `range` (Reichweite), `crit` (Krit), `resist` (Resistenz), `strength` (Stärke); dazu was die Liste sonst braucht (Treffer, Ausweichen, Verteidigung, Angriff), soweit nicht schon vorhanden (`avoid`, `target`, `shield`, `attack` wiederverwenden). Die Elemente (`fire`, `wind`, `earth`, `water`, `light`, `dark`) existieren; neu ist `ElementDot` (Kreis in Elementfarbe mit Linien-Icon, 15 und 18 px).
8. **Keine Emojis.** Weder Komponente noch Locale-Schlüssel enthalten Emojis (Test).
9. **Texte.** Alle sichtbaren Texte (Bezeichnungen **ausgeschrieben**, keine Kürzel wie „VER“; „neu“, „fällt weg“, „statt {Element}“, „Schaden gegen {Element}“, „trägt sie schon“, Wirkungs-Erklärungen) als Schlüssel `ui.change.*` in `content/core/locales/de.yaml` und `en.yaml`; kein sichtbarer Text im Code.
10. **Beleg.** Die Komponente ist in einem Dev-/Lab-Aufruf bei 375 × 812 als Bild belegt, mit dem Mockup (`art/mockups/ausruestung-2026-11/verzauberer.html` bzw. `haendler.html`) daneben; Spielsound dabei auf 0.

## Tasks / Subtasks

- [x] Task 1: Kernfunktion (AC 1–5)
  - [x] 1.1 `src/core/rules/changes.ts`: Typen `ChangeLine`, `ChangeMode`; `changeList` baut den Nachher-Zustand wie `equipPreview` (Kopie der Figur, Probe in den Platz, Zwei-Händer räumt Nebenhand, Beutelplatz ohne Zeilen) und vergleicht Vorher/Nachher über `computeStats`, `weaponProfile`, `itemElement`, `armorAffinity`
  - [x] 1.2 Schaden je Gegner-Element: den Schadenskern aus `calcSide` (`combat.ts`) als reine, exportierte Funktion herausziehen, die `calcSide` und `changeList` gemeinsam rufen
  - [x] 1.3 Wirkungen neu/fällt weg aus `statusOnHit`, `terrainOnHit`, `effectiveVs`, `damageVsTag`, Rune- und Affix-Wirkungen vergleichen
  - [x] 1.4 `equipPreview`/`EquipDelta` entfernen; `Equip.tsx` (`Deltas`) und Schmiede in `Rooms.tsx` (`GEAR_STAT_LABEL`) auf `changeList` umstellen, Verhalten dort bleibt (grün/rot, höchstens drei bzw. zwei Werte)
  - [x] 1.5 Zeilenreihenfolge im Dateikopf dokumentieren
- [x] Task 2: Icons (AC 7, 8)
  - [x] 2.1 Fehlende Pfade in `icons.tsx` (24er Raster, Strich 1,9), `ElementDot`
  - [x] 2.2 Test: jeder `ChangeLine`-Key hat ein Icon (`hasIcon`)
- [x] Task 3: Komponente (AC 6, 9, 10)
  - [x] 3.1 `ChangeList` und `ChangeChips` in `src/ui/ChangeList.tsx`, Styles in `src/ui/change-list.css` (Tokens aus `tokens.css`, keine harten Schatten); `styles.css` nicht erweitern
  - [x] 3.2 Locale-Schlüssel DE/EN
  - [x] 3.3 Bildbeleg bei 375 × 812 neben dem Mockup
- [x] Task 4: Tests und Abschluss (AC 5, 8)
  - [x] 4.1 `tests/unit/change-list.test.ts` (siehe Testanforderungen); `tests/unit/camp.test.ts` von `equipPreview` auf `changeList` umstellen
  - [x] 4.2 `pnpm check` grün (lint, test, content:check, build inkl. Bundle-Budget)

## Dev Notes

### Ist-Zustand (gelesen)

- `src/core/campaign/camp.ts` (ab etwa Z. 539): `equipPreview(data, unit, inst, slot)` liefert `EquipDelta[]` (`key`, `delta`, `better`) für 16 Schlüssel über `computeStats` und `weaponProfile`; Waffenwerte nur für Haupthand-Waffen, Zwei-Händer räumt die Nebenhand, Beutelplatz gibt `[]`. Das ist die Vorlage: **ausbauen und umbenennen, keine zweite Funktion daneben bauen.**
- Aufrufer: `src/app/screens/Equip.tsx` (`Deltas`, `DELTA_LABEL` mit Kürzeln wie `ui.stat.def` = „VER“), `src/app/screens/Rooms.tsx` (Schmiede, `GEAR_STAT_LABEL`, nur `+delta`), `tests/unit/camp.test.ts`.
- Stat-Kern: `src/core/rules/stats.ts` `computeStats`; `src/core/rules/items.ts` `weaponProfile`, `itemElement`, `armorAffinity`, `itemStatMods`, `itemWeight`.
- Element und Schaden: `src/core/rules/combat.ts` `elementMultiplier` (Z. 76) und der Schadenskern in `calcSide` (ab Z. 104: `base = atk − def`, `floor((base + Dreieck) × elementMult)`, Deckel `element.maxBonusPercent`). `forecast` braucht einen `BattleState` und taugt nicht für den Lager-Vergleich; deshalb den Kern als reine Funktion herausziehen. `combat-resolution`- und Forecast-Tests bleiben unverändert grün.
- Icons: `src/ui/icons.tsx` (142 Zeilen): Record `P`, `Icon`, `ElementIcon`, `hasIcon`. Vorhanden u. a. `shield`, `target`, `avoid`, `attack`, `gold`, `bag`, `lock`, `star`, Elemente. Es fehlen TP, Bewegung, Gewicht, Reichweite, Krit, Resistenz, Stärke.
- Bestehende Locale-Schlüssel sind Kürzel („ui.stat.def“ = VER, „ui.avoid“ = Ausw.); die Änderungsliste bekommt eigene, ausgeschriebene Schlüssel, die alten bleiben für andere Stellen.

### Entscheidungen (Annahmen)

- [ASSUMPTION] **Referenzgegner für „Schaden gegen {Element}“:** neutraler Gegner ohne Tags, Verteidigung und Resistenz 0, mit dem jeweiligen Affinitäts-Element, Dreieck 0; verglichen wird der Schaden eines Treffers der Figur mit Probe gegen Getragenes. So zeigt die Zahl nur den Einfluss von Waffe, Rune und Element. Zahlen gegen einen echten Gegner bleiben der Kampfvorschau.
- [ASSUMPTION] **Gegner-Elemente:** alle sechs aus `balance.element`; je Element eine Zeile nur bei geändertem Wert; ohne Element auf beiden Seiten keine Elementzeilen.
- [ASSUMPTION] **Rüstung:** „Feuer-Treffer gegen dich ×0,8“ entsteht, wenn sich die Rüstungs-Affinität ändert (`armorAffinity`), je betroffenem Angriffs-Element; Wert ist `elementMultiplier(angriff, affinität)`.
- [ASSUMPTION] **„Gegenüber ohne Rune“** (Waffenansicht 16.14) ist derselbe Aufruf mit Probe = dasselbe Item mit Rune und `base` = Item ohne Rune; die API nimmt deshalb `probe` und optional `base` (Standard: Getragenes im Platz) und `slot`.
- [ASSUMPTION] **Zeilenreihenfolge:** Waffenwerte (Angriff, Treffer, Krit, Reichweite, Gewicht), Grundwerte (TP, Stärke, Magie, Geschick, Tempo, Glück, Verteidigung, Resistenz), Bewegung, Ausweichen, Last, dann Element-Wechsel und Elementschaden, zuletzt Wirkungen.
- [ASSUMPTION] Icon-Namen englisch (`hp`, `move`, `weight`, `range`, `crit`, `resist`, `strength`); die Pfade entwirft der Dev im Stil der vorhandenen (einfache Formen, keine Füllung), Abnahme im Bildbeleg.
- 16.13 kommt im Epic zuerst; 16.11, 16.12, 16.14 bis 16.17 und der Verzauberer bauen darauf auf. `ChangeLine`, `changeList`, `ChangeList`, `ChangeChips` und `ElementDot` sind damit ein Vertrag und werden mit Typkommentaren vollständig beschrieben.

### Umsetzungsentscheidungen (Dev, nicht-interaktiv)

- [ASSUMPTION] **API:** `changeList(data, unit, probe | null, { slot?, base? })` liefert `{ mode, lines }`. Ohne Probe zeigt `mode: 'state'` das Getragene im Platz (oder `ctx.base`): Waffenwerte absolut, übrige Werte als Beitrag des Items, `delta` 0.
- [ASSUMPTION] **`attack`** ist die Waffen-Stärke (alter Schlüssel `mt`), nicht der Gesamtangriff; `range` ist die obere Reichweite. Bei Nicht-Waffen erscheinen Treffer/Krit aus `computeStats`.
- [ASSUMPTION] **Schaden je Element** nur dort, wo sich der Elementfaktor ändert (sonst wiederholte er nur die Angriffs-Differenz); Wert = Schlagschaden gegen den neutralen Referenzgegner über den Kern `hitDamage` (aus `calcSide` herausgezogen, einzige Änderung in `combat.ts`). Im Modus `state` alle sechs Elemente, wenn die Waffe ein Element hat.
- [ASSUMPTION] **Schmiede** behält `upgradePreview` (Item ohne Figur, Convoy), nur die Beschriftung nutzt jetzt die ausgeschriebenen Schlüssel `ui.change.stat.*`; `equipPreview`/`EquipDelta` sind entfernt, `Equip.tsx` (`Deltas`) ruft `changeList`.
- [ASSUMPTION] Wirkungen: Status beim Treffer, Geländewirkung, „wirksam gegen“ (Tag), Zusatzschaden gegen Tag; Erklärungssätze `ui.change.explain.*`. Skill- und Set-Wirkungen sind nicht Teil dieser Story.
- Keine Emojis-Prüfung per Regex `\p{Extended_Pictographic}` über `ChangeList.tsx` und die `ui.change.*`-Zeilen beider Locales.
- Tests laufen ohne DOM: Render-Tests expandieren die Komponenten zu einem kleinen HTML-String.

### Projektregeln (AGENTS.md)

- `src/core` rein: kein DOM, kein `Math.random`/`Date.now`, State bleibt Plain-JSON; keine neuen Spielwerte nötig (sonst nur in `balance.yaml`).
- Kein sichtbarer Text im Code; Beträge als Symbol + Zahl; Code und Bezeichner Englisch.
- Styles je Komponente in eigener CSS-Datei daneben.
- Vorschau und Auflösung rufen denselben Formelcode (hier: gemeinsamer Schadenskern).
- Fertig erst mit `pnpm check` grün; Coverage von `src/core` nicht senken. Kein `content:lock`. Bundle-Budget halten (Icons sind Pfadstrings).
- Nicht auf `main` committen, Pull Request. Rooms.tsx (über 25 KB) nur im Ausschnitt um `GEAR_STAT_LABEL` lesen.

### Zu ändernde Dateien (geplant)

| Datei | Art |
|---|---|
| `src/core/rules/changes.ts` | NEU: `changeList`, Typen |
| `src/core/rules/combat.ts` | UPDATE: Schadenskern herausziehen |
| `src/core/campaign/camp.ts` | UPDATE: `equipPreview`/`EquipDelta` entfernen |
| `src/core/index.ts` | UPDATE: Export |
| `src/ui/icons.tsx` | UPDATE: neue Pfade, `ElementDot` |
| `src/ui/ChangeList.tsx`, `src/ui/change-list.css` | NEU |
| `src/app/screens/Equip.tsx`, `src/app/screens/Rooms.tsx` | UPDATE: auf `changeList` umstellen |
| `content/core/locales/de.yaml`, `en.yaml` | UPDATE: `ui.change.*` |
| `tests/unit/change-list.test.ts` (NEU), `tests/unit/camp.test.ts` (UPDATE) | Tests |

### Testanforderungen

- Je Zeilenart ein Fall: Waffe gegen Waffe (Angriff, Treffer, Krit, Reichweite, Gewicht), Rüstung (Verteidigung, Resistenz, Last), Schild/Zwei-Händer, Accessoire mit Bewegung oder TP, Rune ändert Element (Feuer zu Wasser), Rune fügt Wirkung hinzu, Rune entfällt, Rüstung mit Affinität.
- „Änderung = Differenz“: für mehrere Item-Paare aus dem Core und mehrere Klassen gilt `delta == nachher − vorher` der berechneten Werte; Elementschaden stimmt mit `forecast`/`resolveAttack` im Lab-Fall mit Referenzgegner überein.
- Gleiche Items ergeben eine leere Liste; ohne Probe Modus `state` mit allen Werten des Items; Beutelplatz und nicht tragbares Item liefern definiert leer, ohne Wurf.
- Icons: jeder Key hat ein Icon, Pfade sind gültige Befehlsfolgen; in Komponente und `ui.change.*` keine Emojis.
- Preact-Rendertest: Differenz grün/rot, „neu“, „fällt weg“, Leerzustand, Chips.

### Referenzen

- Epic 16, Story 16.13 und Reihenfolge (Planungsstand 2026-11-21, `concept/26-epics/epics/epic-16.md`)
- `concept/25-ux/EXPERIENCE.md` „Änderungsliste“, „Verzauberer (Werkbank)“, „Händler (zuerst die Person)“, „Waffenansicht“
- `concept/25-ux/DESIGN.md` `change-list`, „Händler-Zeile“, „Element-Band“, „Linien-Icons statt Emojis“
- Mockups `art/mockups/ausruestung-2026-11/verzauberer.html`, `haendler.html`
- `src/core/campaign/camp.ts` `equipPreview`; `src/core/rules/combat.ts` `elementMultiplier`, `calcSide`; `src/core/rules/stats.ts`; `src/ui/icons.tsx`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

### Completion Notes List

- Kernfunktion, Icons, Komponente, Locales und Tests umgesetzt; `equipPreview` entfernt. AC 10 (Bildbeleg) macht der Product Owner: Weg siehe Übergabebericht (Equip-Screen im Dev-Build bei 375 x 812, Spielsound 0).

### File List

- NEU `src/core/rules/changes.ts`, `src/ui/ChangeList.tsx`, `src/ui/change-list.css`, `tests/unit/change-list.test.ts`
- GEÄNDERT `src/core/rules/combat.ts` (`hitDamage`), `src/core/campaign/camp.ts` (`equipPreview` entfernt), `src/core/index.ts`, `src/ui/icons.tsx`, `src/app/screens/Equip.tsx`, `src/app/screens/Rooms.tsx` (Beschriftung Schmiede), `content/core/locales/de.yaml`, `en.yaml`, `tests/unit/camp.test.ts`, Story-Datei, `sprint-status.yaml`
