# Story 2.7: Kontext-Band für Bergen, Ansprechen, Besuchen und Öffnen

Status: review

## Story

Als Spieler
möchte ich situative Aktionen genau dann angeboten bekommen, wenn sie möglich sind,
damit das Dock fest bleibt und ich nichts übersehe.

## Acceptance Criteria

1. **Band erscheint:** **[entschieden 2026-10-24: kurze Grund-Unterzeile je Aktion über Locale-Schlüssel (`ui.ctx.*Sub`), ohne die Belohnung zu verraten; Bergen mit Verblutungs-Zähler]** Steht eine gewählte Einheit mit gesetzter Bewegung (`mode.k === 'moved'`) auf einem Feld, von dem aus Bergen, Ansprechen, Besuchen oder Öffnen möglich ist, zeigt das grüne Kontext-Band über der Einheitenkarte: Mini-Porträt bzw. Objekt-Symbol, Aktion, Grund und eine grüne Taste (Mockup 02, „Kontext-Aktion: Bergen“).
2. **Grund:** **[entschieden 2026-10-24: Öffnen (mit Schlüssel oder als Späher) erscheint im Band]** Das Band nennt den Grund (Bergen: „Verblutet nach n eigenen Phasen“ aus `bleedOutTurns - bleed`; Ansprechen, Besuchen, Öffnen: Texte nach Entscheidung der offenen Fragen). Alle Texte über Schlüssel in `de.yaml` und `en.yaml`.
3. **Tipp führt aus:** **[entschieden 2026-10-24: Band; der Klassen-Platz des Spähers bleibt Stehlen]** Ein Tipp auf das Band führt die Aktion über denselben Command-Pfad aus wie bisher (`act` mit `Action`); das Dock bleibt unverändert (vier feste Plätze).
4. **Mehrere Aktionen:** **[entschieden 2026-10-24: mobil Wischen mit Punkte-Anzeige, am PC Pfeiltasten (und Punkte)]** Sind mehrere Kontext-Aktionen möglich, steht die dringlichste vorn (Bergen vor Ansprechen vor Besuchen vor Öffnen), die anderen sind per Wischen erreichbar (Wisch-Geste und Alternative für Maus/Tastatur nach Entscheidung).
5. **Öffnen hängt ein:** **[entschieden 2026-10-24: `F` führt das vordere Band aus (in EXPERIENCE.md ergänzt)]** Das Band bindet Öffnen aus Story 2.6 (Truhe, Tür; Späher ohne Schlüssel) ein, ohne dass 2.7 neue Regeln im Kern ergänzt; Fernbergen (2.3, Distanz 2) und die Späher-Klassenaktion bleiben auf dem Klassen-Platz des Docks.
6. Die Auswahl und Reihenfolge der Bänder ist eine reine Funktion (testbar ohne DOM); `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün.

## Tasks / Subtasks

- [x] T1 Ausgangslage klären (siehe Dev Notes): welche Teile 2.1 schon liefert, was 2.7 ergänzt; Offene Fragen mit dem Produktinhaber klären, bevor T3 bis T5 starten
- [x] T2 Reine Funktion `contextOptions(options)` (Sortierung nach `CONTEXT_ORDER`, nur Bergen, Ansprechen, Besuchen, Öffnen und was die Fragen zulassen) und Gründe je Aktion; Unit-Test `tests/unit/context-band.test.ts` (Reihenfolge, mehrere Ziele, kein Band ohne Möglichkeit)
- [x] T3 `BattleHud.tsx › ContextBand`: Grund-Zeile je Aktion (Bergen mit Verblutungs-Zähler, Besuchen mit Dorfname bzw. Belohnungs-Hinweis falls entschieden, Ansprechen, Öffnen), Objekt-Symbol für Dorf, Truhe, Tür; Texte `ui.ctx.*Sub` de/en
- [x] T4 `Battle.tsx`: Mehrfach-Band (Wischen bzw. Alternative), Tastenkürzel falls entschieden, Verhalten nach Ausführen laut Entscheidung; `doAction` bleibt der einzige Auslöser
- [x] T5 Styles in `src/ui/hud.css` (Abschnitt `.hud-ctx`), Fokus-Zustand, Mindestgröße 44 px, Wisch-Indikator
- [x] T6 Öffnen aus 2.6 einhängen: `ActionOption` für Truhe und Tür auch ohne Schlüssel beim Späher; Kind-Namen und `ContextKind` angleichen
- [x] T7 Browser-Prüfung mit Screenshots (Bergen mit Zähler, zwei Bänder, Besuchen, Öffnen) auf Handy- und Tablet-Breite; Entscheidungsprotokoll `concept/25-ux/.decision-log.md`

## Dev Notes

### Ausgangslage im Code (nicht neu bauen)

- `ContextBand`, `ContextKind`, `CONTEXT_ORDER` stehen schon in `src/app/screens/BattleHud.tsx` (Story 2.1, Decision-Log: „Bänder für alle Kontext-Aktionen“). Styles `.hud-ctx` in `src/ui/hud.css`. `Battle.tsx` rendert im Modus `moved` **alle** möglichen Bänder untereinander (`contextOpts`), jedes ruft `doAction`.
- Heute zeigt das Band für Bergen nur „Niedergestreckt“ (`ui.ctx.rescueSub`); der Verblutungs-Zähler im Band fehlt (2.1 hat ihn ausdrücklich offen gelassen, Zähler selbst aus 1.6: `BattleUnit.bleed`, `balance.death.bleedOutTurns`, Chip `ui.hud.bleed` in der Einheitenkarte). Für Ansprechen, Besuchen, Öffnen gibt es keinen Grund-Text.
- Die Bänder `seize`, `escape`, `trade`, `convoy` existieren auch; die Story nennt nur vier Aktionen (siehe Offene Fragen).
- Regeln: `availableActions` in `src/core/battle/actions.ts` liefert `rescue` (Nachbarn), `talk` (Nachbarn mit `recruit`), `visit` (Feld mit geschlossenem Dorf), `chest` (Feld, nur mit Schlüssel `hasKey`), `door` (Nachbarfeld, nur mit Schlüssel). Auslösung in `apply.ts` (`doRescue`, `talk`, `visit`, `chest`, `door`); Zielwahl bei mehreren Zielen im Modus `target` (`ui.pick.*`).
- Einzelziel: `doAction` führt `rescue`/`talk` mit genau einem Ziel sofort aus; bei mehreren Zielen öffnet es die Zielwahl auf dem Brett (das Band nennt dann nur die Aktion).
- Fernbergen (2.3) liegt auf dem Klassen-Platz (`CLASS_KINDS`), gilt nur für Distanz 2 (entschieden 2026-10-24); Bergen im Band nur für Nachbarn, die Zielmengen überlappen nie. Ein Heiler kann beide haben: Band „Bergen“ für den Nachbarn, Dock „Fernbergen“ für den Entfernten.
- Öffnen: Story 2.6 (zuvor umgesetzt, Datei `2-6-*.md` ist beim Schreiben noch nicht vorhanden; Stand epics.md) gibt dem Späher „Öffnen“ ohne Schlüssel und „Stehlen“ (Klassen-Aktion `open_steal`, classes.yaml). Vor Start prüfen, ob 2.6 `chest`/`door` für den Späher in `availableActions` freischaltet oder eine eigene Klassen-Aktion `open` einführt; davon hängt T6 ab.
- Architektur: Regeln in `src/core`, nur Anzeige in `src/app`; Reihenfolge und Gründe kommen aus Daten und Locale-Schlüsseln, nicht aus Literalen im Code. Kein neuer Zufall, keine Replay-Änderung.
- Mockup 02 (Bergen): Pille mit Mini-Porträt (grau), Titel „Brenna bergen“, Unterzeile „Verblutet nach 2 eigenen Phasen“, Taste „Bergen“; der Zähler steht zusätzlich auf dem Brett (`.hc-bleed`, schon umgesetzt).
- EXPERIENCE.md: „Nicht mögliche Aktionen gedimmt, nie versteckt“ gilt für das Dock; das Band erscheint nur bei Möglichkeit. Stimme: Verb + Ziel, ohne Alarm („Verblutet nach 2 eigenen Phasen“).
- Texte: `ui.ctx.*` (Titel) und `ui.action.*` (Taste) existieren; „Öffnen“ heißt heute `ui.action.chest` „Öffnen“, `ui.action.door` „Tür öffnen“.
- Berührte Dateien (voraussichtlich): `src/app/screens/BattleHud.tsx`, `src/app/screens/Battle.tsx`, `src/ui/hud.css`, `content/core/locales/de.yaml`, `en.yaml`, `src/core/battle/actions.ts` (nur falls 2.6 nichts liefert), neu `tests/unit/context-band.test.ts`, `concept/25-ux/.decision-log.md`, ggf. `concept/25-ux/EXPERIENCE.md` (Wisch-Alternative).

### Offene Fragen für den Produktinhaber

1. **Gründe-Texte** für Ansprechen, Besuchen, Öffnen (nur Bergen ist vorgegeben). Optionen: (a) Ansprechen „Kann sich uns anschließen“, Besuchen „Bietet Hilfe oder Beute“ bzw. Belohnung konkret, Öffnen „Verschlossen; Schlüssel vorhanden“; (b) nur Name des Ziels, keine Unterzeile; (c) Text je Objekt/Gegner aus Content. Empfehlung: (a) als Text über Schlüssel; Belohnung nicht verraten (kein Spoiler).
2. **Öffnen mit Schlüssel für Nicht-Späher:** Läuft das übers Band? Optionen: (a) ja, jeder mit Schlüssel (heutiges Verhalten bleibt, Späher braucht keinen); (b) nur Späher übers Band, Schlüsselträger über Item im Dock; (c) Späher über Klassen-Platz, alle anderen übers Band. Empfehlung: (a), weil es das heutige Verhalten erhält und das Dock fest bleibt; Stehlen bleibt Klassen-Aktion.
3. **Späher-Öffnen: Band oder Klassen-Platz?** Optionen: (a) Band, Stehlen auf dem Klassen-Platz; (b) beides auf dem Klassen-Platz (2.3-Muster); (c) beides doppelt. Empfehlung: (a); nach 2.6 klären, wie `open_steal` dort umgesetzt ist.
4. **Wisch-Geste vs. PC:** Optionen: (a) horizontal wischen (Touch) plus Pfeiltasten/Punkte-Anzeige am Band (Maus); (b) Karussell mit Punkt-Indikator und Tipp auf Punkte; (c) alle Bänder gestapelt wie heute (kein Wischen). Empfehlung: (a) mit sichtbarer Punkte-Anzeige und Fokus per Tab.
5. **Tastenkürzel** für das Band. Optionen: (a) keines (nur Tab/Enter); (b) `Q` oder `F` führt das vordere Band aus; (c) Ziffern 1 bis 4. Empfehlung: (b) mit `F` auf PC, in EXPERIENCE.md ergänzen, weil Esc, Leertaste, E, D vergeben sind.
6. **Verhalten nach Ausführen:** **[entschieden 2026-10-24: unverändert, der Zug der Einheit endet]** Bergen, Ansprechen, Besuchen, Öffnen verbrauchen die Aktion des Zugs (Einheit ist danach erschöpft, wie heute in `apply.ts`). Optionen: (a) unverändert, Einheit endet; (b) Rückfrage vor unumkehrbaren Aktionen (Ansprechen); (c) Rückgängig bis Phasenende. Empfehlung: (a), kein Sonderfall; Zurück-Stein gilt weiter bis zur Aktion.
7. **Was zeigt das Dock bei sichtbarem Band?** **[entschieden 2026-10-24: Dock unverändert mit vier Plätzen]** Optionen: (a) unverändert vier feste Plätze (Angriff, Klasse, Item, Warten), wie in der Story; (b) Warten tritt zurück, wenn das Band eine Aktion anbietet. Empfehlung: (a).
8. **Verhältnis zu den weiteren Bändern** **[entschieden 2026-10-24: Entkommen, Ziel einnehmen, Tauschen, Konvoi bleiben als Bänder]** Entkommen, Ziel einnehmen, Tauschen, Konvoi (heute schon Bänder). Optionen: (a) bleiben als Band, gleiche Mechanik, Reihenfolge wie `CONTEXT_ORDER`; (b) wandern woanders hin; (c) nur die vier der Story. Empfehlung: (a), keine Verhaltensänderung außerhalb der Story.
9. **Mehrere Ziele bei Bergen/Ansprechen** **[entschieden 2026-10-24: ein Band je Ziel mit Mini-Porträt bzw. Objekt; dringlichstes (kleinster Zähler) zuerst]** (Band nennt nur die Aktion, Ziel wird auf dem Brett gewählt). Optionen: (a) wie heute; (b) ein Band je Ziel mit Porträt, dringlichstes (kleinster Zähler) vorn. Empfehlung: (b), weil Mockup 02 das Porträt und den Zähler zeigt; Reihenfolge Zähler aufsteigend.
10. **Sicht/Nebel (2.6):** **[entschieden 2026-10-24: Ziele im Nebel werden nicht angeboten]** Zeigt das Band Ziele, die im Nebel unsichtbar sind? Empfehlung: nein, Optionen aus sichtbaren Zielen filtern, falls 2.6 das nicht schon in `availableActions` erledigt.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Completion Notes List

- Reine Funktion `contextEntries(data, s, options)` in `src/core/battle/contextBand.ts` (ohne DOM): ein Eintrag je Ziel (Verbündeter, Ansprechpartner, Objekt), Reihenfolge nach `CONTEXT_ORDER` (Bergen, Ansprechen, Besuchen, Öffnen samt `chest`/`door`, dann Einnehmen, Entkommen, Tauschen, Konvoi), bei Bergen kleinster Verblutungs-Zähler zuerst, Grund als Locale-Schlüssel samt Parametern. `CONTEXT_ORDER` und `ContextKind` wanderten vom HUD in den Kern. Der Nebel braucht keinen eigenen Filter: die Optionen werden auf `visibleState` gebaut (2.6).
- Zählung Verblutet: wie Chip `ui.hud.bleed` und Story 1.6: `bleedOutTurns − bleed` (bei 0 gerade niedergestreckt: 3 eigene Phasen, `bleedOut` zählt zu Beginn jeder eigenen Phase und tötet bei `bleed >= max`); Singular-Text `rescueSub1`.
- `ContextBands` (BattleHud.tsx): vorderes Band, Punkte-Anzeige (44-px-Trefferfläche je 28 × 22 plus Band 56 px), Wischen per Pointer-Events (≥ 36 px waagerecht, ein Wisch löst keinen Tipp aus), Taste-Hinweis `F` nur bei Maus. `Battle.tsx`: nur Zustand `ctxSel`, `ctxRef` für F und Pfeiltasten, ein Einzeiler im Render; `doAction` bleibt der einzige Auslöser (der Eintrag trägt die auf sein Ziel verengte `ActionOption`, deshalb läuft Bergen/Ansprechen mit einem Ziel sofort).
- Styles in `src/ui/hud.css` (Abschnitt context band), Texte `ui.ctx.*Sub` und `ui.ctx.page` in de/en.
- Tests: `tests/unit/context-band.test.ts` (6 Fälle).

### File List

- src/core/battle/contextBand.ts (neu), src/core/index.ts
- src/app/screens/BattleHud.tsx, src/app/screens/Battle.tsx
- src/ui/hud.css
- content/core/locales/de.yaml, content/core/locales/en.yaml
- tests/unit/context-band.test.ts (neu)
- concept/25-ux/.decision-log.md, concept/25-ux/EXPERIENCE.md
- _bmad-output/implementation-artifacts/2-7-kontext-band-fuer-bergen-ansprechen-besuchen-und-oeffnen.md

### Nachträge Produktinhaber 2026-10-25

- Unterzeile Ansprechen „Ein Gespräch ist möglich“ / „You can talk“ freigegeben.
- Unterzeilen „Der Schlüssel passt“ und „Das Schloss lässt sich knacken“ freigegeben.
- Tauschen bleibt ein Band, das Ziel wird auf dem Brett gewählt.
