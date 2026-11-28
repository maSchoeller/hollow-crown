# Story 6.11: Aufstellung auf dem Brett

Status: done

## Story

Als Spieler
möchte ich vor jeder Mission auf dem Spielbrett selbst festlegen, wer mitkommt und auf welchem Startfeld jede Figur steht,
damit ich die Aufstellung an Karte und Gegner anpassen kann, statt eine feste Reihenfolge hinzunehmen.

Neu in Epic 6, ändert 6.10 (die Liste `prep` aus 6.10 entfällt). Entschieden vom Produktinhaber am 2026-11-08 (Fragetool): Auswahl und Positionen auf dem Brett; Tippen, dann Feld; Pflichtfiguren frei positionierbar; keine Aufstellung je Karte gemerkt; Gegner wie zu Beginn von Runde 1; Rechtsklick und Escape wählen ab.

## Acceptance Criteria

Aus `concept/26-epics/epics/epic-06.md` Story 6.11.

1. **Einstieg:** Bei einer Story-Mission oder Heimsuchung, egal wie groß die Truppe ist, öffnet „Aufbrechen“ auf der Knoten-Karte (eine Szene davor läuft wie bisher zuerst) das Brett der Karte im Aufstellungsmodus: alle Startfelder (`deploy.slots` bzw. die `deploy`-Felder des Heimsuchungs-Ankers) sind markiert, die Standardaufstellung (Pflichtfiguren zuerst, dann die Truppe in ihrer Reihenfolge bis zu den Plätzen) steht schon darauf. Oben stehen Zurück-Stein, Missionsname und Ziel sowie die Plätze als Symbol + Zahl (x/y); die Knoten-Karte hat nur noch „Aufbrechen“, der Listen-Screen `prep` aus 6.10 entfällt.
2. **Umstellen:** Figur auf dem Brett antippen, dann ein anderes Startfeld: sie zieht auf das freie Feld bzw. tauscht mit der Figur auf dem besetzten Feld; ein erneuter Tipp auf die Figur, ein Tipp neben die Startfelder, Rechtsklick oder Escape heben die Auswahl auf.
3. **Bank:** Eine Bank-Leiste unten zeigt alle Figuren, die nicht auf dem Brett stehen (Kopf, Name, Stufe). Bankfigur antippen, dann freies Startfeld: sie kommt aufs Brett; Brettfigur antippen, dann „Abziehen“: sie geht auf die Bank. Sind alle Plätze belegt, setzt ein Tipp auf ein besetztes Feld die Bankfigur gegen die dortige Figur ein, ein freies Feld meldet „Alle Plätze belegt“. Pflichtfiguren tragen ein Schloss und lassen sich nicht abziehen, aber frei auf jedes Startfeld stellen; „Tasche“ öffnet für die gewählte Figur das Ausrüsten wie bisher; „Standard“ stellt die Standardaufstellung wieder her.
4. **Sicht:** Die Gegner sind zu sehen wie zu Beginn von Runde 1: auf Nebelkarten nur, was die gerade aufgestellten Figuren sehen würden, und das läuft beim Umstellen mit; die Gefahrenzone lässt sich wie im Kampf ein- und ausschalten.
5. **Start:** Steht mindestens eine Figur auf dem Brett und ist die Truppe nicht über ihren Grenzen, beginnt „Mission starten“ (Desktop: Enter) Runde 1 mit genau dieser Aufstellung (Eröffnung, Dialoge, Leutnant-Zeilen wie bisher); ohne Figur auf dem Brett ist die Taste gesperrt.
6. **Kern:** Die Aufstellung ist Teil des Startzustands (`createBattle`/`createHauntBattle` nehmen Figur → Startfeld), ungültige Felder oder Figuren fallen auf die Standardaufstellung zurück, Pflichtfiguren fehlen nie. Replays aus Startzustand + Command-Log stimmen weiter, das Aktionsprotokoll (`battleStart`) nennt die Felder, und Autoplay, Simulation, `pnpm lab` und alte Aufrufe mit einer bloßen ID-Liste nutzen unverändert die Standardaufstellung; das Speicherformat ändert sich nicht.
7. **Form und Prüfung:** Bei 375 × 812 und am Desktop passen Brett, Bank und Tasten ohne Überlappung, alle Texte stehen in `de.yaml`/`en.yaml`, Styles in einer eigenen CSS-Datei neben der Komponente; Core-Tests für die Aufstellungsregeln und ein e2e-Test für Story-Mission und Heimsuchung.

## Tasks / Subtasks

Rekonstruiert aus PR #163 (Commits `12c63066`, `279eb0f5`, `a230ee09`); abgehakt, wo am 2026-11-27 im Code auf `main` nachgesehen.

- [x] T1 Entscheidungen festhalten: Story 6.11 in `epic-06.md`, Einträge in `concept/26-epics/decision-log.md`, `concept/25-ux/.decision-log.md`, `concept/24-architecture/decision-log.md`, `EXPERIENCE.md` (Commit `12c63066`)
- [x] T2 Kernregeln (AC 6): `src/core/battle/deploy.ts` mit `Placed`/`Placement`/`Deploy`, `deployRules`, `defaultPlacement`, `placementFor` (bereinigt: nur Startfelder, keine Dopplung, Platzgrenze, Pflichtfiguren fehlen nie), `placeUnit`, `benchUnit`, `placedAt`, `isSlot`; Export über `src/core/index.ts`
- [x] T3 Startzustand (AC 6): `createBattle`/`beginBattle` (`setup.ts`, `deployPlayers`) und `createHauntBattle`/`beginHauntBattle` (`hauntBattle.ts`) nehmen `Deploy` (ID-Liste = Standardaufstellung, oder Platzierung); kein neues Command, kein Speicherfeld, keine Migration (Commit `279eb0f5`)
- [x] T4 Ablauf (AC 1): `flow.ts` `playNode`/`playHaunt` → Szene davor → `openPrep` (lädt die Figuren der ganzen Truppe vor) → Screen `prep`; `beginMission`/`beginHaunt` nehmen die Platzierung; die Knoten-Karte (`WorldMap.tsx`) hat nur noch „Aufbrechen“ (`ui.hub.setOut`)
- [x] T5 Aufstellungs-Brett (AC 1–5): `src/app/screens/Prep.tsx` neu als Brett mit `BoardView`, Startfelder als `move`-Overlay, Kopf (Zurück, Missionsname, Ziel, Gefahrenzone), Plätze-Pille, Hinweis, Bank, „Tasche“, „Abziehen“, „Standard“, „Mission starten“; Tipp-Logik über `placeUnit`/`benchUnit`, Toasts `ui.prep.full`/`ui.prep.locked`; Gegner antippen zeigt `UnitInfo`; Escape/Enter per `keydown`, Rechtsklick über `onCancel`
- [x] T6 Sicht (AC 4): das Brett zeigt `visibleState` des Kampfs, den der Kern mit dieser Platzierung starten würde; Nebel (`fogBands`) und Gefahrenzone (`threatMap`) laufen mit
- [x] T7 Aktionsprotokoll (AC 6): `battleStart` trägt zusätzlich `at` (`src/app/state/battle.ts`, `src/app/trail.ts`, `tools/reportCheck.ts`)
- [x] T8 Altbestand (AC 1, 7): `src/app/prepDeploy.ts` und `tests/unit/prep-deploy.test.ts` aus 6.10 entfernt, `Prep.css` neu geschrieben, `WorldMap.tsx` ohne zweite Taste; Texte `ui.prep.*` in `de.yaml`/`en.yaml`
- [x] T9 Tests (AC 7): `tests/unit/deploy-placement.test.ts` (Regeln, Kampf mit Platzierung, Replay, Heimsuchung); e2e `tests/e2e/prep.spec.ts` neu (Umziehen, Tauschen, Bank, Pflicht, Tasche, Escape, Start übernimmt Aufstellung), Hilfen `tests/e2e/deploy.ts`, neuer Schritt in `smoke`, `worker`, `haunt`, `goalmarks`
- [x] T10 Sichtprüfung (AC 7): Browser 375 × 812, stumm, Story-Mission (1-2, 1-6) und Heimsuchung (Erlbach); Screenshots in `deploy-placement/`

## Dev Notes

### Quellen

- [Source: concept/26-epics/epics/epic-06.md#Story 6.11] (Akzeptanzkriterien, Entscheidungen 2026-11-08)
- [Source: concept/26-epics/decision-log.md, concept/25-ux/.decision-log.md, concept/24-architecture/decision-log.md, Einträge 2026-11-08]
- [Source: concept/25-ux/EXPERIENCE.md, Aufstellung]
- [Source: _bmad-output/implementation-artifacts/6-10-aufstellung-vor-der-mission-im-stil-b.md] (Vorgänger, dessen Liste entfällt)
- [Source: PR #163 „Story 6.11: Aufstellung auf dem Brett“, gemergt 2026-11-08]

### Spätere Änderungen auf `main`

- `a997d009` (Brett bleibt über Screens erhalten): `Prep.tsx` parkt das gebaute Brett beim Verlassen (`parkBoard`, `boardKey`), „Mission starten“ übernimmt es; `prep.spec.ts` angepasst. Verhalten der Aufstellung unverändert.
- Das Speicherformat ist seitdem aus anderen Gründen auf 4 gestiegen (`83ea6dc6`); 6.11 selbst hat `src/persistence/save.ts` nicht angefasst.

## Dev Agent Record

### Agent Model Used

Unbekannt (Umsetzung in PR #163). Story-Datei nachgetragen 2026-11-27 aus PR #163 von Claude Opus 5.5.

### Completion Notes List

- nachgetragen 2026-11-27 aus PR #163: Die Story-Datei fehlte; Inhalt aus PR-Beschreibung, Commits und Diff rekonstruiert, Abgleich gegen den Code auf `main` unten unter „Review 2026-11-27“.
- Laut PR: `pnpm check` grün (1698 Tests); e2e `prep.spec.ts` grün auf iphone13, pixel7, ipad-landscape, desktop; smoke, worker, haunt, goalmarks mit dem neuen Schritt grün (desktop).
- Eine Heimsuchung hat keine Pflichtfiguren; daher ist „Mission starten“ ohne Figur auf dem Brett gesperrt (Produktinhaber 2026-11-08).

### File List

- `src/core/battle/deploy.ts` (neu)
- `src/core/battle/setup.ts`, `src/core/battle/hauntBattle.ts`, `src/core/index.ts`
- `src/app/screens/Prep.tsx`, `src/app/screens/Prep.css` (neu geschrieben)
- `src/app/screens/WorldMap.tsx`
- `src/app/state/flow.ts`, `src/app/state/battle.ts`, `src/app/trail.ts`
- `src/app/prepDeploy.ts` (gelöscht)
- `tools/reportCheck.ts`
- `content/core/locales/de.yaml`, `content/core/locales/en.yaml`
- `tests/unit/deploy-placement.test.ts` (neu), `tests/unit/prep-deploy.test.ts` (gelöscht)
- `tests/e2e/deploy.ts` (neu), `tests/e2e/prep.spec.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/worker.spec.ts`, `tests/e2e/haunt.spec.ts`, `tests/e2e/goalmarks.spec.ts`
- `concept/26-epics/epics/epic-06.md`, `concept/26-epics/html/epics.html`, `concept/26-epics/decision-log.md`, `concept/25-ux/.decision-log.md`, `concept/25-ux/EXPERIENCE.md`, `concept/24-architecture/decision-log.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Screenshots `_bmad-output/implementation-artifacts/deploy-placement/`: `story-default-375x812.jpg`, `story-moved-375x812.jpg`, `story-forced-picked-375x812.jpg`, `story-bag-375x812.jpg`, `haunt-bench-375x812.jpg`, `haunt-picked-375x812.jpg`, `haunt-danger-bench-375x812.jpg`

## Review 2026-11-27

Abgleich jedes AC gegen den Code auf `main` (`0be3696f`). Ergebnis: **DONE**.

| AC | Befund | Beleg |
|---|---|---|
| 1 Einstieg | erfüllt | `flow.ts:88-104` (`playNode` → Szene davor → `openPrep`), `flow.ts:164-170` (`openPrep` → Screen `prep`), `flow.ts:198-212` (`playHaunt`); Knoten-Karte nur „Aufbrechen“ `WorldMap.tsx:679`, `:744`; Startfelder als Overlay `Prep.tsx:148`, Standardaufstellung `Prep.tsx:57`; Kopf mit Zurück, Missionsname, Ziel `Prep.tsx:222-229`, Plätze als Symbol + Zahl `Prep.tsx:235-238` |
| 2 Umstellen | erfüllt | `Prep.tsx:151-170` mit `placeUnit` (`deploy.ts:83-98`: freies Feld = ziehen, besetzt = tauschen); erneuter Tipp `Prep.tsx:154`, neben die Felder `:156-160`; Rechtsklick `boardFrame.ts:28-31` → `onCancel` `Prep.tsx:100,170`; Escape `Prep.tsx:176` |
| 3 Bank | erfüllt | Bank mit Kopf, Name, Stufe `Prep.tsx:243-259`; Abziehen `:200-206` über `benchUnit` (`deploy.ts:101-104`, Pflicht `locked`); voll + freies Feld → `full` → Toast `ui.prep.full` (`deploy.ts:96`, `Prep.tsx:76-80`); Bankfigur auf besetztes Feld ersetzt (`deploy.ts:92-95`); Schloss `Prep.tsx:266`, Abziehen gesperrt `:273`; Tasche `:269`, `:304-308`; Standard `:207-210` |
| 4 Sicht | erfüllt | Brett zeigt `visibleState` des Kampfs mit genau dieser Platzierung `Prep.tsx:67-68`; Nebel läuft mit `:143`; Gefahrenzone-Schalter `:230-232`, `threatMap` `:137-142` |
| 5 Start | erfüllt | `Prep.tsx:71-74`, Taste gesperrt ohne Figur oder bei zu großer Truppe `:280`, Enter `:177`; `beginMission`/`beginHaunt` `flow.ts:177-182`, `:215-223` |
| 6 Kern | erfüllt | `deploy.ts:42-57` (`placementFor`), `setup.ts:40`, `:106-118`, `hauntBattle.ts:93`, `:116`; `battleStart` mit `at` `battle.ts:59`, `trail.ts:22`; Sim/Lab mit ID-Liste `tools/simMap.ts:120,144`, `tools/simCampaign.ts:603`, `src/lab/scenario.ts:252`; `save.ts` von 6.11 nicht berührt |
| 7 Form und Prüfung | erfüllt | Texte `ui.prep.*` in `de.yaml:634-648`, `en.yaml:634-648`; `Prep.css` neben der Komponente; Core-Tests `tests/unit/deploy-placement.test.ts` (8 Tests); e2e Story-Mission `tests/e2e/prep.spec.ts:42`, Heimsuchung über das Aufstellungs-Brett `tests/e2e/haunt.spec.ts:54`; Screenshots 375 × 812 in `deploy-placement/` |

- `pnpm vitest run tests/unit/deploy-placement.test.ts`: 1 Datei, 8 Tests grün (2026-11-27).
- e2e am 2026-11-27 nicht neu laufen lassen (laut PR #163 grün auf vier Geräten); `prep.spec.ts` wurde seitdem nur in `a997d009` angepasst, das auf `main` mit grüner CI gemergt ist.
- Hinweis, keine Lücke: Die e2e-Prüfung der Heimsuchung startet nur mit der Standardaufstellung (`startFromDeploy`); Umstellen auf dem Heimsuchungs-Brett deckt der Core-Test `deploy-placement.test.ts:137` ab.
