# Story 16.11: Brett erklärt Gelände und Bewegungskosten

Status: done

## Story

Als Spieler
möchte ich sehen, was ein Feld bewirkt und was mich ein Weg kostet,
damit ich ohne Handbuch plane.

## Acceptance Criteria

1. **Linse an/aus:** Langer Druck (≥ 400 ms, grüner Füllring am Knopf) auf „Gefahr“ im Leerlauf-Dock bzw. Taste G am PC schaltet die Gelände-Linse ein. Sie bleibt an, bis „Gefahr“ erneut getippt wird (oder G). Solange sie an ist, heißt der Knopf „Gelände“ mit Lupen-Icon, Grund hellgrün, und die Gefahrenzone ist aus (die Linse ersetzt sie). Kurzer Tipp auf „Gefahr“ ohne Linse schaltet wie bisher die Gefahrenzone. Der Knopf zeigt oben rechts drei kleine Punkte als Hinweis aufs Halten.
2. **Linse färbt** jedes Feld nach Wirkung für die Bewegungsart „zu Fuß“ (`foot`): grün Schutz (def > 0 oder avoid > 0), gelb langsam (Kosten > 1), hell gestreift schnell (Kosten < 1, Straße/Brücke), rot Schaden (Brand / Schaden beim Betreten), grau schraffiert gesperrt (Kosten null); zwei Wirkungen diagonal geteilt (Wald: Schutz + langsam); neutrale Felder leicht abgedunkelt. Legende als Creme-Pille unter der Kopfleiste mit 13-px-Mustern, nur mit den Arten, die auf der Karte vorkommen.
3. **Einmal-Hinweis:** Im ersten Kampf mit besonderem Gelände (mindestens ein Feld, dessen Linsen-Klasse nicht neutral ist) erscheint einmal der Hinweis „Gefahr gedrückt halten: Gelände“ (DE/EN). Danach nie wieder (dauerhaft gemerkt, nicht im Kampf-State).
4. **Bewegungsbereich:** Teure Felder tragen unten rechts Kosten-Punkte (je Bewegungspunkt ein dunkler 5-px-Punkt mit Creme-Rand, erst ab Kosten 2), Straße/Brücke eine Creme-Pille „½“. Am Pfeilende (Pfad des Ziel-Checks/Geist) steht eine Glut-Pille mit Stiefel-Icon und „noch n“ (Rest-Bewegung, Halbe als „½“, z. B. „noch 2½“).
5. **Feldkarte** (`tile-card`, ersetzt `TerrainCard`): Feldbild 34 px mit Kontur, Name, Wirkungen als Chips mit Linien-Icon + Wort + Zahl (Verteidigung, Ausweichen, Heilung, Schaden beim Betreten, brennbar; Bonus grün, Malus rot), Kontext-„?“ (`HelpStone` bleibt). Darunter eine Kosten-Pille mit Glutrand für die **gewählte, sonst die nächste bereite** Figur („Brenna: 3 Bewegung“, Icon der Bewegungsart; gesperrt: „Brenna: kommt nicht hin“), die übrigen Bewegungsarten klein in einer Zeile. Keine Abkürzungen (kein „VER“). Mit gewählter Figur erscheint sie beim Tipp auf ein Feld außerhalb ihres Bereichs und ersetzt die Einheitenkarte, bis ein Zielfeld gesetzt wird.
6. **Eine Quelle:** Kosten in Feldkarte, Punkten und „noch n“ kommen aus `moveCost`/`stepCost`/`reachable` in `src/core/rules/movement.ts` (dieselben Funktionen wie die Wegsuche), nie aus einer Kopie oder direkt aus `terrain.yaml`.

## Tasks / Subtasks

- [x] T1 Core: reine Funktionen in `src/core/rules/terrainLens.ts` (neu), mit Tests (AC 2, 3, 6)
  - [x] `lensKinds(data, terrainId, moveType='foot'): LensKind[]` mit `LensKind = 'cover'|'slow'|'fast'|'harm'|'blocked'` (max. zwei, Reihenfolge fest; `blocked` schließt andere aus). Schwellen aus den Terrain-Werten ableiten, kein Code-Wert; Schaden = `burning` über eine Terrain-Eigenschaft oder `isHazard`-Logik – bevorzugt ein Feld in `terrain.yaml`/Schema statt ID-Vergleich, wenn klein machbar, sonst `isHazard` wiederverwenden.
  - [x] `hasSpecialTerrain(data, s): boolean` für den Einmal-Hinweis.
  - [x] `tileEffects(data, s, p)` → Liste `{kind: 'def'|'avoid'|'heal'|'enterDamage'|'flammable', value?, good: boolean}`; Schaden beim Betreten aus `balance.yaml` (`burningEnterDamage`).
  - [x] `costLabel`-Hilfe für Halbe („½“, „2½“) als reine Funktion (UI-Text bleibt in Locales).
  - [x] Export über den bestehenden Core-Einstieg wie andere Regeln.
- [x] T2 Render: Overlay-Art `lens` in `src/render/board/overlays.ts` (AC 2)
  - [x] `Overlays.lens?: Array<[Pos, LensKind[]]>`; flache Quads wie die anderen Arten; Streifen/Schraffur mit vorhandenen Helfern in `shapes.ts` (vgl. `terrainWarn` Streifen, `hold` Schraffur); diagonale Teilung als zwei Dreiecke.
  - [x] Farben/Deckkraft in `content/core/render.yaml` `legibility.terrainLens` (+ Zod-Schema in `src/content/schema*.ts`): Schutz `{colors.positive}` ~55 %, langsam `{colors.gold}` ~60 %, Schaden `{colors.team-enemy}` ~60 %, schnell Creme-Streifen, gesperrt dunkle Schraffur 45°, neutral leicht dunkel. Hex-Werte aus `concept/25-ux/DESIGN.md` Farbtabelle.
  - [x] Kosten-Punkte und „½“ (AC 4): im Bewegungsbereich, gerendert entweder als Overlay-Meshes oder als DOM-Badges (siehe `src/render/board/badges.ts`) – die Variante wählen, die zum bestehenden Muster passt (Badges sind DOM über dem Brett, für Pillen mit Text naheliegend).
  - [x] „noch n“-Pille am Pfeilende mit Stiefel-Icon.
- [x] T3 App: `useBoardOverlays.ts` / `useBattleScreen.ts` / `useBattleInput.ts` / `Battle.tsx` (AC 1, 4, 5)
  - [x] State `lens` neben `danger`; Linse an ⇒ `threat` null, `lens`-Overlay gesetzt. In Modus `selected`/`moved` bleibt der Bewegungsbereich wie bisher; Linse gilt im Leerlauf (und bleibt an, wenn man eine Figur wählt? → Linse bleibt sichtbar unter Bereich, sofern lesbar; sonst nur im Leerlauf zeigen. [ASSUMPTION] nur im Leerlauf zeichnen, Zustand bleibt erhalten).
  - [x] Langdruck am Dock-Knopf: `DockAction` in `BattleHud.tsx` um Halten erweitern (Pointer-Events, 400 ms, CSS-Variable `--p` für den Füllring, Klick nach ausgelöstem Halten unterdrücken). Wert 400 ms aus `balance.yaml`/`render.yaml`, falls dort schon eine Langdruck-Dauer existiert (`onLongPress` des Bretts prüfen), sonst neue Einstellung in `render.yaml` `ui`/`legibility`.
  - [x] Taste G in der Tastaturbehandlung (`useBattleInput.ts`, neben D).
  - [x] Legende-Pille unter der Kopfleiste (neue Komponente, eigene CSS-Datei z. B. `src/app/screens/TerrainLens.css`).
  - [x] Einmal-Hinweis über `HintPill`; „gesehen“ dauerhaft merken in einem **eigenen kleinen Modul** unter `src/app/state/` (z. B. `coachHints.ts`, localStorage mit try/catch) – **nicht** `settings.ts` ändern (parallel Story 16.3 dort).
- [x] T4 Feldkarte (AC 5, 6): `TerrainCard` in `BattleHud.tsx` zur `tile-card` umbauen (oder in eigene Datei `TileCard.tsx` + `TileCard.css` auslagern – bevorzugt, `BattleHud.tsx` ist > 25 KB). Figur: `mode.uid` falls gewählt, sonst nächste bereite (gleiche Logik wie „Nächste“ im Dock). Feldbild: vorhandenes Bodenbild unter `art/ground/` bzw. Handbuch-Bild nutzen, falls im Build verfügbar; sonst [ASSUMPTION] Farbfeld der Linsen-Klasse. Übrige Bewegungsarten: `foot`, `armored`, `mounted`, `flier` ohne die eigene ([ASSUMPTION] `monster` weglassen, Spieler haben sie nie). Tipp auf Feld außerhalb des Bereichs bei gewählter Figur zeigt sie (prüfen, was heute passiert – Abwählen? – und dort einhängen, ohne Abwählen zu brechen).
- [x] T5 Texte DE + EN in `content/core/locales/de.yaml`/`en.yaml`: Knopf „Gelände“, Legende (Schutz, langsam, schnell, Schaden, gesperrt), Hinweis, Chips (Verteidigung, Ausweichen, Heilung, Schaden beim Betreten, brennbar), „{name}: {n} Bewegung“, „{name}: kommt nicht hin“, „noch {n}“, Bewegungsarten ausgeschrieben.
- [x] T6 Icons in `src/ui/icons.tsx`: fehlende Linien-Icons ergänzen (Lupe `lens`, Stiefel `boot`, Heilung, Flamme/Brand). Vorhandene: `shield`, `avoid`, `armored`, `danger`. Keine Emojis.
- [x] T7 Tests: Unit-Tests für T1 (Wald = cover+slow, Straße = fast, Berg = blocked für foot, Brand = harm+…, Ebene neutral; `hasSpecialTerrain`; Halbe-Formatierung); Komponententest der Feldkarte falls Muster vorhanden (`tests/unit/*hud*`); Kosten der Feldkarte = `moveCost`.
- [ ] T8 Handbuch/Hilfe: falls `HelpStone`-Anker für die Linse sinnvoll ist, `content/core/…` Handbuch-Eintrag ergänzen (optional, nicht Pflicht).

## Dev Notes

### Ausgangslage (gelesen)
- `src/core/rules/movement.ts`: `moveCost(data,s,unit,p,overrides)` (Eintrittskosten; null = gesperrt), `stepCost` (inkl. Leiter/Höhe), `reachable` (Dijkstra, `ReachNode.cost`), `minStepCost` (seit 16.1 Halbe). Kosten-Overrides kommen aus Skills (`st.skills.terrainCost`) – für Feldkarte/Punkte **mit** Overrides der Figur rechnen (über `computeStats(...).skills.terrainCost`), damit die Zahl zur Wegsuche passt.
- `content/core/terrain.yaml`: `road` kostet 0.5 für alle (16.1), Wald 2/3/3/1/2, Berg null für Fuß; Felder `def`, `avoid`, `heal`, `flammable`, `cost{foot,armored,mounted,flier,monster}`. Brand: `burning` (Kosten 2), Schaden beim Betreten `balance.yaml` `burningEnterDamage: 5`.
- `TerrainCard` in `src/app/screens/BattleHud.tsx:262` (heute nur Name, Höhe, def, avoid, heal, `HelpStone`), eingebunden in `Battle.tsx:205–209` über `tileInfo` (`useBattleScreen.ts:46`).
- Gefahrenzone: `danger`-State in `useBattleScreen.ts:31` (Default `settings.value.dangerDefault`), Knopf `Battle.tsx:179` (`DockAction icon="danger"`), Overlay `threat` in `useBoardOverlays.ts:21–26`, Taste D in `useBattleInput.ts:~291`.
- Overlays: `src/render/board/overlays.ts` (`Overlays`-Interface, Legibility-Werte aus `render.yaml legibility`), Formen in `shapes.ts`, DOM-Marken in `badges.ts`/`badges.css`.
- Brett-Langdruck existiert (`useBoardLifecycle.ts:32 onLongPress`) – Dauer dort nachsehen und wiederverwenden.

### Leitplanken (AGENTS.md)
- Werte nur in YAML (`render.yaml`, `balance.yaml`), kein sichtbarer Text im Code, DE + EN.
- Beträge als Symbol + Zahl (Stiefel + Zahl, Schild + Zahl …). Keine Abkürzungen, keine Emojis.
- `src/core` ohne DOM/Babylon; neue Core-Datei voll testen (Coverage nicht senken).
- Styles je Screen in eigener CSS-Datei; `src/ui/styles.css` nicht wachsen lassen.
- Große Dateien (`BattleHud.tsx`, `boardProps.ts`, `models.ts`) nur ausschnittsweise lesen.
- Bundle-Budget von `pnpm build` halten.
- `settings.ts` nicht anfassen (Story 16.3 parallel).

### Referenzen
- Epic: `concept/26-epics/epics/epic-16.md` Story 16.11; UX-DR32 in `concept/26-epics/epics/requirements.md`.
- `concept/25-ux/DESIGN.md` Zeilen 337–339 (`terrain-lens`, `tile-card`, `cost-pips`); `concept/25-ux/EXPERIENCE.md` Zeilen 85, 91, 92, 145, 151.
- Mockup: `art/mockups/ausruestung-2026-11/brett.html` (Teil 1 Linse Variante A, Bewegung B, Feldkarte B; Ist-Bilder `ist-brett-*.jpg`).
- Vorgänger: `16-1-strassen-und-bruecken-kosten.md` (Halbe in Wegsuche und KI).

### Annahmen
- [ASSUMPTION] Linse wird nur im Leerlauf gezeichnet; mit gewählter Figur zeigt das Brett den Bewegungsbereich (Zustand der Linse bleibt erhalten).
- [ASSUMPTION] Einmal-Hinweis je Gerät/Profil (localStorage), nicht je Kampagne.
- [ASSUMPTION] `monster` fehlt in der Zeile der übrigen Bewegungsarten.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Sub-Session)

### Completion Notes List

- Core `src/core/rules/terrainLens.ts` (neu, exportiert über `core/index.ts`): `lensKinds`, `lensTiles`, `lensPresent`, `hasSpecialTerrain`, `tileEffects`, `costLabel`, `unitTileCost`, `otherMoveCosts`, `costMarks`, `restMovement`. Kosten über `moveCost` (mit Skill-Overrides der Figur), neu `moveCostOf` (einzige Terrain-Tabellen-Abfrage, `moveCost` ruft sie) und `reachable`; `isHazardTerrain` ersetzt den ID-Vergleich in `isHazard`.
- Render: `Overlays.lens` (Quads, Streifen, 45°-Schraffur, Diagonalteilung als zwei Hälften, Geometrie rein in `shapes.ts` `lensShapes`, getestet), Farben und Streifenmaße in `render.yaml` `legibility.terrainLens` (+ Schema, `renderDefs`). Kosten-Punkte und „½“-Pille als DOM-Marken im Float-Layer, je Feld an das Brett gepinnt (`boardUnits.ts` `syncCostMarks`, `costMarks.css`); „noch n“ als zweite gepinnte Pille am Pfeilende (`restRef`).
- App: `lens`-State neben `danger` (Linse an = Gefahrenzone aus), Halten am Dock-Knopf (`holdPress.ts`, Füllring und drei Punkte in `TerrainLens.css`, Dauer `terrainLens.holdMs` = 400), Taste G, Legende (`LensLegend`), Einmal-Hinweis (`useCoachHint`, merkt sich in `state/coachHints.ts` per localStorage; `settings.ts` unberührt).
- Feldkarte `TileCard.tsx` ersetzt `TerrainCard` (und deren `.hud-terrain`-Regeln in `hud.css`, die Datei wurde dadurch kleiner).
- Texte DE + EN, Icons `boot`, `mounted`, `flier`, `lens` ergänzt; für Lupe, Heilung und Flamme vorhandene Icons genutzt.
- [ASSUMPTION] Linse nur im Leerlauf gezeichnet, Zustand bleibt beim Wählen einer Figur erhalten.
- [ASSUMPTION] Feldbild der Feldkarte = Farbfeld im Linsenmuster der ersten Wirkung (kein Bodenbild zur Laufzeit im Build).
- [ASSUMPTION] Mit gewählter Figur lässt ein Tipp auf ein leeres Feld außerhalb des Bereichs die Figur gewählt und zeigt die Feldkarte; ein zweiter Tipp auf dasselbe Feld wählt ab (früher: jeder Tipp daneben wählte ab). Die Karte endet bei neuer Wahl, Zielfeld oder Abwählen.
- [ASSUMPTION] Schaden-Wirkung eines Brandfelds teilt das Feld mit „langsam“ (Kosten 2): gelb/rot diagonal; Heilung zählt nicht als Schutz.
- [ASSUMPTION] Einmal-Hinweis steht `terrainLens.hintMs` (7 s) und gilt als gesehen, sobald er erscheint.
- [ASSUMPTION] `monster` fehlt in der Zeile der übrigen Bewegungsarten; Kosten-Punkte ab Kosten 2 (Halbe aufgerundet), „½“-Pille bei Kosten unter 1.
- Nicht gemacht: T8 (Handbuch-Anker, optional).
- Tests: `tests/unit/terrain-lens.test.ts`, `tile-card.test.ts`, `lens-shapes.test.ts`. Sichtprüfung im Browser steht aus (kein Dev-Server in dieser Session).

### File List

- `src/core/rules/terrainLens.ts` (neu), `src/core/rules/movement.ts`, `src/core/index.ts`, `src/core/renderDefs.ts`
- `content/core/render.yaml`, `src/content/schemaRender.ts`, `content/core/locales/de.yaml`, `content/core/locales/en.yaml`
- `src/render/board/shapes.ts`, `src/render/board/overlays.ts`, `src/render/board/boardBase.ts`, `src/render/board/boardUnits.ts`, `src/render/board/costMarks.css` (neu)
- `src/app/screens/TerrainLens.tsx` / `.css` (neu), `TileCard.tsx` / `.css` (neu), `holdPress.ts` (neu), `src/app/state/coachHints.ts` (neu)
- `src/app/screens/Battle.tsx`, `BattleHud.tsx`, `useBattleScreen.ts`, `useBoardOverlays.ts`, `useBattleInput.ts`, `src/ui/icons.tsx`, `src/ui/hud.css`
- `tests/unit/terrain-lens.test.ts`, `tests/unit/tile-card.test.ts`, `tests/unit/lens-shapes.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review (gds-code-review, 2026-11-22)

- Behoben: Linse ging nach dem Halten beim Loslassen wieder aus (`onHold` jetzt immer gebunden); Einmal-Hinweis gilt erst nach voller Standzeit als gesehen und wartet auf Dialog, Banner, Cut-in; mit gewählter Figur bleibt die Gefahrenzone sichtbar, auch wenn die Linse an ist; Feld der Feldkarte trägt den Cursor.
- Offen (defer): Kosten-Punkte und Feldkarte zeigen den Betretenspreis (`moveCost`), ohne Höhen-/Leiter-Aufschlag; „noch n“ nutzt den Pfadpreis aus `reachable`. Heil-Prozent wird im Code mit „%“ zusammengesetzt.
- Sichtprüfung (375 × 812, Lab `feuer-weg`): Linse mit Legende, Feldkarte Wald („Vorkämpfer: 3 Bewegung“, übrige Arten), Kosten-Punkte und „noch 2“ beim Schützen.
