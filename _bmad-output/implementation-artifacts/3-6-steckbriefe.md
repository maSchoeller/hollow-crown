# Story 3.6: Steckbriefe

Status: review

## Story

Als Spieler
möchte ich alles über einen Leutnant nachlesen können,
damit ich planen kann, wer ihn stellt.

## Acceptance Criteria

1. **Ansicht aus dem Kern:** Eine reine Funktion im Kern (z. B. `wantedView(data, c, ltId)` in `src/core/campaign/`) liefert alles, was der Steckbrief zeigt: Name, Rolle (Klasse), Stufe (im Kampf die der Einheit), Groll 0–3, Groll-Ziel (Name, oder „gefallen“, oder keines), Begegnungen und Vertreibungen, Kopfgeld und Material, die drei Groll-Fähigkeiten mit Zustand (frei/gesperrt), Fluchtregel-Schlüssel. Das Kopfgeld rechnet mit derselben Funktion `bountyGold` wie Story 3.5 (Formel nur einmal im Kern).
2. **Steckbrief-Komponente:** Eine eigene Komponente (Datei plus CSS neben der Komponente) zeigt nach DESIGN.md („Steckbrief“) und Mockup `02-kampf.html` (Einzelansicht): großes Medaillon mit Goldring und Stufen-Pille, Groll-Kerben als Goldpunkte, Name und Rolle, Zeile „Groll gegen <Ziel>“ mit Mini-Porträt (oder „gefallen“), Faktenfeld (Fluchtregel aus der Locale, Kopfgeld als Münze + Zahl und Material als Symbol + Zahl, Begegnungen und Vertreibungen), die drei Groll-Fähigkeiten als Chips (freigeschaltete normal, gesperrte gestrichelt mit „Groll n“), Zurück-Taste.
3. **Im Kampf:** Der Langdruck auf einen Leutnant (≥ 400 ms) öffnet den Steckbrief statt der Einheitenkarte und zeigt zugleich seine Gefahrenzone. Der Steckbrief schließt mit Zurück oder Tipp daneben. Alle anderen Einheiten öffnen weiter die Einheitenkarte.
4. **Liste der bekannten Leutnants:** Ein neuer Screen `wanted` listet alle Leutnants mit `met` (Medaillon, Name, Kerben, Ziel); ein Tipp auf einen Eintrag öffnet den Steckbrief (gleiche Komponente), Zurück führt zur Liste und von dort zur Weltkarte. Erreichbar über die Leiste der Weltkarte („Steckbriefe“): aktiv, sobald mindestens ein Leutnant `met` ist; sonst bleibt der Stein gedimmt mit dem vorhandenen Hinweis (`ui.map.soon.wanted`).
5. **Texte und Darstellung:** Kein sichtbarer Text im Code (Locale DE/EN, u. a. Fluchtregel „flieht und kehrt wieder“, „gefallen“, „Begegnet … · … vertrieben“, „Groll n“); Beträge als Symbol + Zahl; nichts nur über Farbe (Kerben als Punkte, Fähigkeiten gestrichelt statt nur grau); Layout 375 px Hochformat und Breitbild.
6. **Prüfungen:** Tests der Ansicht (alle Zustände: unbekannt/neu, Groll 0–3, Ziel lebt/gefallen/keines, Fähigkeiten frei/gesperrt, Kopfgeld = Formel aus 3.5), der Liste (nur `met`), der Navigation (Langdruck-Entscheidung als reine Funktion); `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Screenshots: Steckbrief im Kampf mit Gefahrenzone und die Liste.

## Tasks / Subtasks

- [x] T1 Kern (AC 1)
  - [x] `wantedView` und `wantedList` (nur `met`) in `src/core/campaign/` (z. B. `wanted.ts`), exportiert über `src/core/index.ts` (nur ergänzen)
  - [x] Freischaltung der Fähigkeiten: Anzahl = Groll (die Skalierung selbst ist Story 3.4); im Kampf zeigt die Ansicht den Groll der Einheit (`BattleUnit.grudge`)
- [x] T2 Komponente (AC 2, 5)
  - [x] `src/app/screens/Wanted.tsx` (Steckbrief und Liste) plus `wanted.css`; Bausteine aus `src/ui/pieces.tsx` (`Piece`, `Amount`, `ScreenHead`, `Backdrop`), `UnitHead` für Medaillons, Icon `wanted`
  - [x] Locale-Schlüssel `ui.wanted.*`
- [x] T3 Kampf (AC 3)
  - [x] `longRef` in `Battle.tsx`: Leutnant → Steckbrief + `watch`; Eingriff klein, Darstellung in der eigenen Komponente
- [x] T4 Liste und Weltkarte (AC 4)
  - [x] `screen.ts`: `{ name: 'wanted'; unit?: string; from?: From }` (nur ergänzen); `App.tsx` Fall `wanted`; `WorldMap.tsx` Leiste
- [x] T5 Belege und Tests (AC 6)
  - [x] Dev-Helfer in `flow.ts` (`window.__hc`) nur ergänzen, wenn für Screenshot nötig: Kampf mit Leutnant bzw. Kampagne mit bekannten Leutnants öffnen
  - [x] Tests, Screenshots auf 375 × 812 und Breitbild

## Dev Notes

### Quellen

- Epics 3.6; DESIGN.md Bausteine „Medaillon“ (Leutnant mit Goldring), „Groll-Wimpel“, **„Steckbrief“** (Stein mit großem Leutnant-Medaillon, Groll-Kerben als Goldpunkte, Groll-Ziel, Faktenfeld mit Fluchtregel, Kopfgeld, Begegnungen, Groll-Fähigkeiten als Chips, gesperrte gestrichelt), „Leiste“ (vier Steine: Weltkarte/Heimat, Truppe, Steckbriefe, Chronik); EXPERIENCE: Eingabe „Langdruck ≥ 400 ms: Info: Steckbrief, Figur, Gefahrenzone eines Gegners“, Steckbrief per Langdruck „auf dem Brett zeigt derselbe Langdruck zugleich seine Gefahrenzone; schließt mit Zurück oder Tipp daneben“, Tabelle der Screens („Steckbriefe | Leiste | alle Leutnants mit Groll, Ziel, Begegnungen“; „Steckbrief-Liste: spine-only, Mockups bei Bedarf“), Zustand „geflohen (Leutnant, Wimpel fällt)“; Mockup `concept/25-ux/mockups/02-kampf.html` (Feld „3 Steckbrief“, Klassen `.wanted`, `.wanted-head`, `.lt-tag`, `.grudge`, `.facts`, `.skills`); GDD „Leutnants“ (Fluchtregel, Kopfgeld); Architektur §5.5.
- Beispieltexte im Mockup: „Leutnant · Groll ●○○“, „Groll gegen **Kael** · greift ihn bevorzugt an“, „Bei 0 TP: flieht und kehrt wieder“, „Kopfgeld ● 400 · ◆ 1“, „Begegnet 2× · 1× vertrieben“, Chips „Fackelwurf“ und gesperrt „Groll 2 · Brandmauer“. Die Namen im Mockup sind Platzhalter; echte Fähigkeiten stehen in Story 3.1.
- Kopfgeld im Steckbrief ist das für die **nächste** Vertreibung: `200 × (Groll + 1)` (Mockup: Groll 1 → 400).

### Vorhandener Code (Fundstellen, Stand HEAD 3d7cb9f)

- **Langdruck im Kampf:** `src/app/screens/Battle.tsx`: `longRef` 488–495 (`setInfo(at.uid)`; für Gegner `setWatch` toggelt die Gefahrenzone), Registrierung `onLongPress` Zeile ~146, `watch`-State 108, Gefahrenzone `dangerTiles`/`dangerZone(data, s, 'player', watch)` 211–215, Einheitenkarte `UnitInfo` ab `BattlePanels.tsx:81`, eingehängt in `Battle.tsx:917` (`infoUnit`). `cancelRef` (`info` zuerst schließen) ~497–512.
- **Weltkarte/Leiste:** `src/app/screens/WorldMap.tsx:398-416`: vier Steine; der Stein „Steckbriefe“ ist heute `is-dim` mit Toast `ui.map.soon.wanted` (`de.yaml:300`, `en.yaml:300`), Beschriftung `ui.map.wanted`; Icon `wanted` in `src/ui/icons.tsx:48`. Stil `.wm-nav` in `WorldMap.css:298ff`.
- **Screens:** `src/app/state/screen.ts:8-23` (Union `Screen`, Modul „leaf“); `src/app/App.tsx:79-111` (`switch (sc.name)`); Muster eines Listen-Screens mit Zurück: `src/app/screens/Chronicle.tsx` (`Backdrop`, `ScreenHead` mit `onBack`, `Piece`, `Tabs`, `from: From`).
- **Bausteine:** `src/ui/pieces.tsx` (`Piece` 12, `Backdrop` 73, `Amount` 118, `ItemImage`, `ScreenHead`), `src/app/screens/unitArt.tsx:23` `UnitHead` (Porträt; `artId(portrait, classId)`), `src/ui/Sheet`. Porträts der Leutnants: `public/assets/avatars/{hask,morra,grosk}.webp` vorhanden, **Ulvric fehlt** (Rückfall auf Klassenbild prüfen).
- **Zustand:** `LieutenantState` (nach 3.3: `met, encounters, grudge, target?, routs, signatureDropped`) in `src/core/state.ts`; `BattleUnit.grudge`/`grudgeTarget` (3.1/3.3); Namen: `nameKey`, `unit.<id>.name`; Rolle: `class.<id>.name`; Gefallene: `c.fallen`.
- **Kopfgeld:** `bountyGold` und Balance-Abschnitt aus Story 3.5 (`lieutenant.bounty`), Material des Akts aus `balance`.
- **Dev-Helfer:** `src/app/state/flow.ts:331ff` (`window.__hc`: `campaign`, `battle`, `screen`, `runEffects` …) – für den Screenshot darf ein Eintrag ergänzt werden.
- **Tests als Muster:** `tests/unit/world-map.test.ts`, `tests/unit/result.test.ts` (Ansichten aus dem Kern), `tests/unit/camp.test.ts`.

### Was sich ändert / was bleibt

- **Bleibt:** Einheitenkarte (`UnitInfo`) für alle Nicht-Leutnants; die Gefahrenzone-Umschaltung für Gegner (Langdruck) bleibt, der Leutnant bekommt zusätzlich den Steckbrief; Leiste der Weltkarte mit vier Steinen.
- **Ändert sich:** `Battle.tsx` (`longRef`, ein Zweig für Leutnants, Einhängen der Komponente), `screen.ts`, `App.tsx`, `WorldMap.tsx` (Stein „Steckbriefe“ aktiv/gedimmt), Locales.
- **Zustand „unbekannt“:** Im Kampf kann ein Leutnant zum ersten Mal erscheinen (`met` noch falsch). Der Steckbrief zeigt dann Begegnungen 0 und Groll 0; Zahlen kommen aus dem Kampagnenzustand vor dem Kampf, nicht aus dem laufenden Kampf (`encounters`/`routs` ändern sich erst bei Sieg).
- **Stufe im Kampf:** Die Stufen-Pille zeigt die Stufe der Einheit auf dem Brett; in der Liste (außerhalb des Kampfs) gibt es noch keine Stufe, die Pille entfällt dort (Skalierung kommt in 3.4).
- **Erreichbarkeit:** Epic-Vorgabe: „über das Menü (ab Epic 5 über die Leiste)“; die Leiste der Weltkarte existiert (Story 5.3), also nur dort. Aus der Heimat/Lager ist der Stein nicht vorgesehen, solange die Leiste dort fehlt.

### Grenzen zu anderen Stories und Sessions

- **Nicht hier:** Flucht und „flieht“ in der Vorschau (3.2); Zustand, Zeilen im Kampf, Groll-Fortschreibung (3.3); Skalierung der Stärke und tatsächliche Freischaltung im Kampf (3.4); Berechnung/Gutschrift des Kopfgelds (3.5, hier nur Anzeige); Seitenwechsel (3.7, ein beigetretener Leutnant verschwindet aus der Liste/zeigt „in der Truppe“, wenn 3.7 es verlangt); Langdruck auf Heimsuchungs-Knoten der Weltkarte (5.5); Karten (Level-Design).
- **Session „Kampf“** (Branch `claude/pensive-jepsen-b9ce35`) ändert `src/app/screens/{Battle,BattleHud,BattlePanels}.tsx`, `src/ui/hud.css`, `src/ui/icons.tsx`, `src/render/board/overlays.ts`, `src/core/{state,events,defs,index}.ts` u. a. Hier nur **ergänzend**: In `Battle.tsx` genau einen Zweig in `longRef` und das Einhängen der Komponente; kein Umbau von `UnitInfo`; `hud.css` nicht anfassen (neues CSS in `wanted.css`); Icons nur nutzen (`wanted` existiert), kein neues in `icons.tsx`, wenn vermeidbar.
- **Abhängigkeiten:** 3.1 (Definitionen, Ring/Wimpel), 3.3 (Zustand), 3.5 (`bountyGold`) vorher.

### Geklärte Fragen (Produktinhaber 2026-10-25, Fragetool)

1. **Material im Faktenfeld:** als Symbol + Spanne „1–2“ (Werte aus `balance.yaml`).
2. **Rolle/Titel:** Unter dem Namen steht der Titel je Leutnant (`titleKey` aus `lieutenants.yaml`, angelegt in Story 3.1), dazu die Klasse als Rolle.

### Project Structure Notes

- Neu: `src/core/campaign/wanted.ts` (oder in `lieutenants.ts`), `src/app/screens/Wanted.tsx`, `src/app/screens/wanted.css`, `tests/unit/wanted.test.ts`.
- Geändert: `src/core/index.ts` (Export), `src/app/state/screen.ts`, `src/app/App.tsx`, `src/app/screens/{Battle,WorldMap}.tsx`, Locales `de.yaml`/`en.yaml`, optional `src/app/state/flow.ts`.

### Project Context Rules

- Styles je Screen in einer eigenen CSS-Datei neben der Komponente; `src/ui/styles.css` ist Altbestand und wächst nicht; Grundregeln in `base.css`.
- App-Zustand in `src/app/state/`, ein Modul je Verantwortung; keine Sammel-Datei, kein Barrel-Re-Export, keine Import-Zyklen. `screen.ts` bleibt ein Blatt-Modul.
- Die Ansicht liegt im Kern und ist rein (kein DOM, keine Zufälle); die Oberfläche legt nur aus. Beträge als Symbol + Zahl. Kein sichtbarer Text im Code.
- Mobile-first, Hochformat 375 px; Touch-Ziele nach DESIGN.md, nichts nur über Farbe.
- Fertig erst, wenn `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün sind; für diese sichtbare Story zusätzlich Screenshots.
- In `sprint-status.yaml` nur die Zeilen der Story ändern.

### References

- [Source: concept/26-epics/epics.md#Story 3.6]
- [Source: concept/25-ux/DESIGN.md] (Bausteine Steckbrief, Medaillon, Leiste)
- [Source: concept/25-ux/EXPERIENCE.md] (Eingabe, Screens, Zustände)
- [Source: concept/25-ux/mockups/02-kampf.html] (Steckbrief per Langdruck)
- [Source: concept/21-gdd/gdd.md#Leutnants]
- [Source: concept/24-architecture/architecture.md#5.5 Leutnants (AR5)]
- [Source: _bmad-output/implementation-artifacts/4-7-chronik.md] (Listen-Screen mit Zurück)

## Review (2026-10-25)

Grundlage: Code-Review Epic 3 (Diff PR #48 + #52, Prüfschichten Blind Hunter, Edge Case Hunter, Acceptance Auditor, Querschnitt Replay/Vorschau/Migration/Worker, Simulation, Browser).

Kurzergebnis: Übrige ACs ohne Befund.

| # | Schwere | Befund | Ort | Ergebnis |
|---|---|---|---|---|
| R2 | E→fix | „Begegnet“ ohne Sichtkontakt. Entscheidung: nur bei Sicht oder Flucht. | lieutenants.ts applyLieutenantOutcome | wird behoben im Fix-PR (folgt) |
| R4 | S3 | Langdruck schaltet Gefahrenzone dauerhaft ein. Entscheidung: beim Schließen aus, außer sie war vorher an. | Battle.tsx:143, :613 | wird behoben im Fix-PR (folgt) |
| R5 | E→fix | Kopfgeld-Material aus Kampagnen-Akt statt Leutnant-Akt. Entscheidung: Akt des Leutnants. | lieutenants.ts payBounties, wanted.ts | wird behoben im Fix-PR (folgt) |
| R11 | S3 | `wantedView(data, campaign.value!, …)` ohne Kampagnen-Prüfung. | Battle.tsx:832 | wird behoben im Fix-PR (folgt) |
| R13 | S3 | Decision-Log-Einträge zu 3.5 und 3.6 fehlen. | concept/*/decision-log | wird behoben im Fix-PR (folgt) |
| R30 | S3 | Text `ui.wanted.target.alive` „wird bevorzugt angegriffen“ kippt das Subjekt (Mockup: „greift ihn bevorzugt an“). | de.yaml:640 | vermerkt, kein Handlungsbedarf |

Empfehlung und Entscheidung über `done`: siehe unten (folgt nach dem Fix-PR).

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm test:coverage` läuft unter Instrumentierung in 5-s-Timeouts (core.test, lieutenants.test, chronicle.test: Ladezeit des Inhalts); mit `--testTimeout=60000` grün (502 Tests, Statements gesamt 81,11 %).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Kern: `wantedView`, `wantedList`, `longPressView` in `src/core/campaign/wanted.ts`; Kopfgeld über `bountyGold`, Material-Spanne aus `balance.lieutenant.bounty`; Zahlen (Begegnungen, Vertreibungen) immer aus der Kampagne, Stufe/Groll/Ziel im Kampf aus der Einheit.
- Oberfläche: `Wanted.tsx` (`WantedCard`, `WantedDock` ohne Schleier, damit die Gefahrenzone sichtbar bleibt, und Liste/Einzelansicht als Screen `wanted`), `wanted.css`. `Amount` bekam das optionale `max` für die Spanne "1–2".
- Kampf: `state/wanted.ts` (Signal `wantedUid`); Langdruck auf Leutnant setzt es, `Battle.tsx` fügt die Gefahrenzone nur hinzu (kein Umschalten); Zurück/Tipp daneben/Esc schließen.
- Abweichung: Kerben als Goldpunkte (DESIGN/Mockup) statt der weißen Striche der Ergebnisansicht.
- E2E-Fall entfällt: ohne Dev-Helfer ist kein Leutnant erreichbar (Prolog hat keinen, Weltkarte erst nach dem Prolog).
- Dev-Helfer: `__hc.devWantedBattle(id, grudge, target)`, `__hc.devWantedList(list)`.

### File List

- neu: `src/core/campaign/wanted.ts`, `src/app/screens/Wanted.tsx`, `src/app/screens/wanted.css`, `src/app/state/wanted.ts`, `tests/unit/wanted.test.ts`
- geändert: `src/core/index.ts`, `src/app/state/screen.ts`, `src/app/state/flow.ts` (Dev-Helfer), `src/app/App.tsx`, `src/app/screens/Battle.tsx`, `src/app/screens/WorldMap.tsx`, `src/ui/pieces.tsx` (`Amount.max`), `content/core/locales/de.yaml`, `content/core/locales/en.yaml`

### Change Log

- 2026-10-25: Story 3.6 umgesetzt (Steckbrief, Liste, Langdruck im Kampf, Leiste der Weltkarte).
- 2026-10-25 Kontrolleur: Checks grün (502 Tests), Screenshots Steckbrief im Kampf und Liste; Steckbrief in Lager/Heimat nicht verlangt (EXPERIENCE: Brett, Weltkarte, Steckbriefe); Darstellung beigetretener Leutnants klärt Story 3.7; Status review.
