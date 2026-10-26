# Story 6.10: Aufstellung vor der Mission im Stil B

Status: review

## Story

Als Spieler
möchte ich die Aufstellung vor einer Mission im selben Stil wie Truppe, Lager und Ergebnis sehen,
damit der Weg von der Knoten-Karte in den Kampf nicht durch einen Bildschirm aus dem Prototyp bricht.

## Acceptance Criteria

1. **Aufbau (Mockup `concept/25-ux/mockups/09-aufstellung.html`):** Der Screen `prep` zeigt über der weichgezeichneten Weltkarte (`Backdrop`, Bild `world/<data.world.image>`) oben den Kopf (`ScreenHead`: runder Zurück-Stein, Titelpille „Aufstellung“), darunter den Missions-Stein (Kicker „Story-Mission 1-1“, Titel der Mission, Zielsatz `goalLine`, Chips „x/y Plätze“ und „Stufe ≈ n“ wie die Knoten-Karte der Weltkarte), darunter die Truppe als Liste von Einheitenkarten und unten genau eine Glut-Haupttaste „Kampf beginnen“.
2. **Einheitenkarte (DESIGN.md „Einheitenkarte“):** je Gefährte eine Steinzeile mit rundem Medaillon (TP-Ring voll in Teamblau), Name (Fraunces), „Klasse · St. n“ **ohne Zeilenumbruch**, TP als Zahl („31 TP“, Höchstwert wie heute) und der Waffe als Item-Chip mit gemaltem Bild (`ItemChip`; ohne Waffe ein ruhiger Chip „Unbewaffnet“). Rechts ein Schaltstein (Haken = dabei, Plus = frei, Schloss = Pflicht) und der Taschen-Knopf. Jedes tippbare Element hat mindestens 44 px Trefferfläche.
3. **Pflicht-Figuren:** Figuren aus `map.deploy.forced` stehen oben, sind immer dabei, ihr Schaltstein ist ein Schloss ohne Wirkung, und die Karte trägt in einer eigenen Zeile den festen Grundtext „Pflicht in dieser Mission“ (ein Schlüssel für alle Karten, **kein neues Feld** an Karten oder Missionen).
4. **Reihenfolge und Schalten:** Die Reihenfolge ist fest (Pflicht-Figuren zuerst, dann `c.roster` in seiner Reihenfolge). Ein Tipp auf den Schaltstein wählt ab bzw. an; abgewählte Karten sind gedimmt und tragen ein Plus. **Nichts springt**: keine Umsortierung, keine Höhenänderung der Zeilen beim Umschalten.
5. **Voll und zu groß:** Sind alle Plätze besetzt (`chosen.length >= map.deploy.max`), werden die Plus-Steine der übrigen gestrichelt dargestellt (`aria-disabled`, nicht `disabled`), die Plätze-Pille ist dunkel, und ein Tipp auf einen solchen Stein zeigt den Hinweis „Alle Plätze besetzt. Nimm zuerst jemanden heraus.“ als `Toast`. Liegt die Truppe über dem Söldner-Limit (`armyOverLimit`), ist „Kampf beginnen“ grau und gesperrt, und darunter steht in einem Stein mit `role="alert"` der Satz `ui.army.over` (EXPERIENCE: Haupttaste „gesperrt grau mit Grund darunter“).
6. **Tasche:** Der Taschen-Knopf öffnet wie heute `FigureFlow` (Ausrüsten); nach „Zurück“ steht die Aufstellung mit derselben Auswahl wieder da (`chosen` bleibt im State von `Prep`).
7. **Funktion unverändert:** Auswahl, Pflicht-Figuren, Ausrüsten, Start (`beginMission(node, chosen, screen.value)`), Zurück zu `from` und der Alarm bei zu großer Truppe verhalten sich wie in `Camp.tsx:153-228` (`Prep`). Die Startauswahl ist wie heute: Pflicht-Figuren, dann die Truppe der Reihe nach bis `deploy.max`.
8. **Breite Bildschirme (EXPERIENCE „Responsive“):** 600–1023 px: Seitenleiste rechts mit 320 px und einer Spalte Karten, links die Weltkarte mit Kopf, Missions-Stein und Haupttaste. Ab 1024 px: links Kopf, Missions-Stein und Taste (360 px), rechts die Truppe als Stein mit zwei Spalten Karten. Die Karten sind auf allen Breiten dieselben.
9. **Stil B und Ablage:** `Prep` zieht aus `Camp.tsx` nach `src/app/screens/Prep.tsx` mit eigener `Prep.css` daneben; der Abschnitt für die Aufstellung in `src/ui/styles.css` entfällt, ebenso alles Altbestand-CSS, das danach niemand mehr braucht. Alle Texte stehen in `de.yaml` und `en.yaml`.
10. **Mockup-Abgleich:** Bei 375 × 812 und am Desktop (1280 × 800) passt der Screen zum Mockup (Sichtprüfung mit Screenshots, auch 600–1023 px). Prüfungen grün: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`; neuer E2E-Test grün.

## Tasks / Subtasks

- [x] T1 Umzug (AC 7, 9): `Prep` aus `Camp.tsx` nach `src/app/screens/Prep.tsx` verschieben; `App.tsx` (Zeile ~92) importiert von dort; in `Camp.tsx` die dann ungenutzten Importe streichen (`armyOverLimit`? prüfen, `UnitCard`, `UnitHead`, `FigureFlow`, `goalLine`, `beginMission`)
- [x] T2 Screen bauen (AC 1–5): Gerüst `hc-view` + `Backdrop`, `ScreenHead`, Missions-Stein, Liste, Haupttaste; Einheitenkarte als eigene Komponente in `Prep.tsx` (`UnitRow`), Medaillon mit Ring in `Prep.css` (`prp-medal`), Waffen-Chip über `ItemChip`
- [x] T3 Schalten und Pflicht (AC 3–5): Schaltstein als `button` mit `aria-pressed`, Pflicht als Schloss ohne Taste, voller Zustand mit `aria-disabled` und `Toast`; kein Umsortieren
- [x] T4 Breite Layouts (AC 8): `Prep.css` mit `@media (min-width: 600px)` und `(min-width: 1024px)`, Raster wie im Mockup
- [x] T5 Texte (AC 9): neue Schlüssel in `de.yaml` und `en.yaml`, nicht mehr benutzte entfernen (Liste unter Dev Notes)
- [x] T6 Altbestand aufräumen (AC 9): `UnitCard` und `HpBar` in `src/ui/components.tsx` (nur `Prep` nutzt sie, vorher mit `grep` belegen), die dazugehörigen Regeln `.unit-card`, `.unit-name`, `.unit-sub`, `.hpbar*`, `.hp-num` in `src/ui/styles.css`; was danach in `components.tsx` an Importen ungenutzt ist (`computeStats`, `ElementIcon`, `ruleOn` …) mitnehmen
- [x] T7 E2E-Test (AC 10): `tests/e2e/prep.spec.ts` und Fixture-Spielstand, Route unter Dev Notes
- [x] T8 Sichtprüfung und Prüfungen (AC 10): Screenshots 375 × 812, ~800 × 600 und 1280 × 800 gegen das Mockup; `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`; Eintrag in `concept/25-ux/.decision-log.md` für Abweichungen vom Mockup

## Dev Notes

### Entscheidungen des Produktinhabers (2026-10-26), verbindlich

- **Layout:** Liste von Einheitenkarten, eine Steinzeile je Gefährte (Medaillon, Name, „Klasse · St. n“ ohne Umbruch, TP als Zahl, Waffe als Item-Chip mit gemaltem Bild; rechts Schaltstein und Taschen-Knopf). Der TP-Balken entfällt zugunsten des vollen TP-Rings um das Medaillon (der HUD-Look): `UnitRecord` trägt keine aktuellen TP, außerhalb des Kampfes wären alle Balken voll und ohne Aussage.
- **Pflicht-Figuren:** gesperrt mit festem Grundtext „Pflicht in dieser Mission“ für alle Karten (ein Locale-Schlüssel, kein neues Kartenfeld).
- **Hintergrund:** die Weltkarte, weichgezeichnet (`Backdrop`, wie die übrigen Stil-B-Vollbild-Ansichten).
- **Reihenfolge:** fest, Pflicht-Figuren oben; Abgewählte gedimmt mit Plus; nichts springt.
- **Kopf und Fuß:** `ScreenHead`; oben Missions-Stein (Kicker, Titel, Ziel, Plätze „x/y“ wie die Knoten-Karte in `03-weltkarte.html`); unten **genau eine** Glut-Haupttaste „Kampf beginnen“, bei zu großer Truppe grau und gesperrt mit Grund darunter (EXPERIENCE, Zeile „Haupttaste“).
- **Funktion:** wie heute (Auswahl, Pflicht-Figuren, Ausrüsten über die Tasche, Start, Alarm bei zu großer Truppe).

### Bestätigt vom Produktinhaber (2026-10-26)

Mockup unverändert abgenommen: Liste von Einheitenkarten, Toast „Alle Plätze besetzt …“ beim Tipp auf ein gestricheltes Plus bei voller Truppe, Schaltstein „dabei“ dunkel (nicht Glut), nur „Kampf beginnen“ in Glut; Titel „Aufstellung“ (`ui.prep.title`), Missionstitel aus `map.<map>.name` wie die Knoten-Karte; TP als voller Ring um das Medaillon samt Zahl, kein Balken; Funktion unverändert (Auswahl, Pflicht-Figuren gesperrt mit festem Grundtext, Ausrüsten über die Tasche, Start über `beginMission`, bei zu großer Truppe die Haupttaste grau und gesperrt mit Grund darunter); responsiv wie im Mockup (Handy, 600–1023 px Seitenleiste, ab 1024 px zwei Spalten). Damit sind die folgenden Punkte beschlossen:

### Vom Umsetzer gewählt, im Mockup gezeigt

- **Titel „Aufstellung“** statt „Vorbereitung“ (so heißt die Fläche in EXPERIENCE.md und die Taste auf der Knoten-Karte; `ui.prep.title` bekommt den Wert von `ui.hub.prep`, EN „Deployment“).
- **Titel der Mission** aus `map.<map>.name` (wie die Knoten-Karte, z. B. „Steckbriefe in Varnhold“) statt `titleKey` des Knotens („Steckbriefe“, heute in `Prep`); der Kicker nutzt `nodeShort(node)` wie dort.
- **Voller Zustand:** gestricheltes Plus plus Toast statt eines stummen `disabled` (Gesperrtes ohne Rückmeldung ist am Handy ein toter Tipp), dazu die dunkle Plätze-Pille.
- **Schaltstein „dabei“** ist dunkel (Linienfarbe, Haken), nicht Glut: Glut gehört der einen Haupttaste (DESIGN.md).

### Heutiger Stand (nicht brechen)

- `Prep` in `src/app/screens/Camp.tsx:153-228` (Altbestand-Klassen `screen`, `screen-narrow`, `panel sheet`, `list`, `btn`): lokaler State `chosen` (Startwert: Pflicht-Figuren, die im `roster` stehen, dann der Reihe nach bis `map.deploy.max`) und `inv` (Id der Figur, deren Tasche offen ist; dann rendert `Prep` stattdessen `FigureFlow` aus `Troop.tsx` mit `units={c.roster.map(...)}`, `onBack` setzt `inv` zurück). `over = armyOverLimit(data, c)`. Pflicht-Schalter `disabled={locked || (!on && chosen.length >= max)}`. Start: `void beginMission(node, chosen, screen.value)`; Zurück: `screen.value = { name: from }`.
- Erreichbar über `playNode` in `src/app/state/flow.ts:93`: `screen.value = { name: 'prep', node, from }`, wenn `opts.prep` (Knoten-Karte „Aufstellung“, `WorldMap.tsx:490`) **oder** `roster.length > map.deploy.max`. Vorher blockt `armyBlocksMission()` bei zu großer Truppe, der Alarm in `Prep` ist die zweite Absicherung (bleibt). `App.tsx:92` rendert `<Prep node from />`.
- `UnitCard` (`src/ui/components.tsx:77`) und `HpBar` (`:44`) kennen nur `Prep` als Nutzer (`grep` zeigt keinen weiteren Treffer in `src/` und `tests/`; `UnitCardB` im Kampf ist ein anderes Ding und bleibt). `.unit-card`, `.unit-name`, `.unit-sub`, `.hpbar*`, `.hp-num` in `styles.css:158-209` sind dann ungenutzt. `.btn`, `.panel`, `.list`, `.sheet` bleiben (Menus.tsx, `Modal` u. a. nutzen sie; vor dem Löschen je Klasse prüfen).
- TP-Zahl wie in `UnitCard`: `computeStats(data, unit).maxHp`.
- Bausteine, die es schon gibt: `ScreenHead`, `Backdrop`, `PrimaryButton`, `ItemChip` (`src/ui/pieces.tsx`); `hc-view` (Vollbild-Gerüst, `pieces.css`, Breite `min(560px, 100%)` mittig; für die breiten Layouts in `Prep.css` überschreiben); `UnitHead` (`unitArt.tsx`, rundes Bild mit eigener Kontur und Schatten, im Ring die Kontur/den Schatten zurücknehmen); Icons `back`, `check`, `plus`, `lock`, `bag`, `company` (`src/ui/icons.tsx`); `Toast` (`components.tsx`); Chip- und Kicker-Stile der Knoten-Karte (`wm-card__kicker`, `wm-tag` in `WorldMap.css`) als Vorlage kopieren, nicht importieren (Styles je Screen in eigener Datei). `Medallion` aus `BattleHud.tsx` nimmt eine `BattleUnit` und passt hier nicht.
- Kein Zufall, keine Regel im UI: die Aufstellung ruft nur `beginMission` und die bestehende `armyOverLimit`; **keine Kern-Änderung**, kein neues Command, kein Speicherformat.

### Dateien (anfassen)

| Datei | Änderung |
|---|---|
| `src/app/screens/Prep.tsx` (neu) | `Prep` und `UnitRow`, aus `Camp.tsx` verschoben und im Stil B neu |
| `src/app/screens/Prep.css` (neu) | alle Styles der Aufstellung, Präfix `prp-`, Medaillon-Ring, Schaltsteine, breite Layouts |
| `src/app/screens/Camp.tsx` | `Prep` und nun ungenutzte Importe raus |
| `src/app/App.tsx` | Import von `./screens/Prep` |
| `src/ui/components.tsx` | `UnitCard`, `HpBar` und danach ungenutzte Importe entfernen, falls `grep` bestätigt |
| `src/ui/styles.css` | `.unit-card`, `.unit-name`, `.unit-sub`, `.hpbar*`, `.hp-num` löschen; weitere nur-Prep-Regeln, falls sich welche finden |
| `content/core/locales/de.yaml`, `en.yaml` | Schlüssel siehe unten |
| `tests/e2e/prep.spec.ts` (neu), `tests/fixtures/saves/generate.ts` | E2E und Fixture, siehe unten |
| `concept/25-ux/.decision-log.md` | nur falls das Ergebnis vom Mockup abweicht |

### Neue Schlüssel (de + en, beide Dateien gleich)

| Schlüssel | DE | EN |
|---|---|---|
| `ui.prep.places` | `{n}/{max} Plätze` | `{n}/{max} places` |
| `ui.prep.forced` | `Pflicht in dieser Mission` | `Required for this mission` |
| `ui.prep.full` | `Alle Plätze besetzt. Nimm zuerst jemanden heraus.` | `All places taken. Take someone out first.` |
| `ui.prep.take` | `{name} mitnehmen` | `Take {name}` |
| `ui.prep.leave` | `{name} zurücklassen` | `Leave {name} behind` |
| `ui.prep.bag` | `{name}: Ausrüstung öffnen` | `{name}: open equipment` |

Geändert: `ui.prep.title` wird „Aufstellung“ / „Deployment“. Entfernt: `ui.prep.count` (ersetzt durch `ui.prep.places`; vorher mit `grep` prüfen). Bleiben: `ui.prep.start`, `ui.army.over`, `ui.unarmed`, `ui.lv`, `ui.map.kicker`, `ui.map.level`, `ui.world.goal.*`. `ui.inventory` bleibt (Kampf-Panel nutzt es). Beträge: hier keine; TP ist eine Zahl mit Einheit „TP“ (`ui.hud.hp` liefert „x/y TP“, für die einzelne Zahl `{n} TP` nötig: falls es keinen passenden Schlüssel gibt, `ui.prep.hp`: `{n} TP` / `{n} HP`).

### E2E-Test: Weg in die Aufstellung

Ziel: Aufstellung erscheint, Pflicht-Figuren sind gesperrt, bei vollen Plätzen lässt sich keine fünfte Figur aufnehmen, Abwählen gibt einen Platz frei, „Kampf beginnen“ startet die Mission.

- **Nicht machbar: durchspielen.** Der erste Weltkarten-Knoten nach dem Prolog (`m1_1`) ist nur nach einem **gewonnenen Prolog-Kampf** erreichbar (`availableNodes`: erst nur `fixed: first`). Der Prolog-Kampf läuft im Browser auf Software-WebGL; die bestehenden Tests spielen nur eine Runde (Minuten). Die Dev-Helfer `__hc.autoWin` u. ä. gibt es nur im Dev-Build (`import.meta.env.DEV`), E2E läuft gegen `pnpm preview`.
- **Auch dann gäbe es keine Auswahl:** nach 1-1 hat die Truppe 3 Gefährten (Rhen, Kael, Fenn) bei `deploy.max` 4; mehr Gefährten als Plätze braucht Söldner (Taverne) oder spätere Rekruten.
- **Machbare Route: Spielstand importieren.** (1) `tests/fixtures/saves/generate.ts` schreibt zusätzlich einen exportierten Spielstand `prep-worldmap-export.json`: `newCampaign` wie dort, `completed: ['prologue']`, über Wirkungen (`recruit`) 4 weitere Gefährten dazu (z. B. `brenna`, `tobin`, `fenn`, `varek`; Ids gegen `content/acts/act1/units.yaml` prüfen) = 6 im `roster`, Platzhalter `screen: 'worldmap'`, als `SaveRecord` verpackt und mit `exportSave(rec)` (`src/persistence/save.ts`, Hülle mit Prüfsumme; `importSave` lehnt sonst mit `checksum` ab). Feste `campaignId`, `createdAt`, `contentVersion: 'fixture'` wie beim Format-2-Fixture. (2) Der Test: `Kampagnen` öffnen, `page.setInputFiles('input[type=file]', <Datei>)` (das Eingabefeld ist `hidden` in `Campaigns.tsx`), der Import landet direkt auf der Weltkarte (`restore` → `worldmap`). (3) Knoten `m1_1` antippen (`getByRole('button', { name: 'Steckbriefe' })`, `aria-label` = Knotentitel), dann auf der Karte **„Aufstellung“**; das öffnet `prep`, auch ohne Wahl (`playNode(id, { prep: true })`, Pre-Dialog läuft vorher, `scn.m1_1.intro`: überspringen wie `skipIntro` in `smoke.spec.ts`, falls nötig).
- **Wartezeit beachten:** die Karte von `m1_1` liegt im Paket `act1` (`maps/**`, Hintergrund-Download, Story 7.2). Bis es da ist, zeigt die Knoten-Karte `PackWait` statt der Tasten: auf den Knopf „Aufstellung“ mit großzügigem `timeout` warten (kein fester Sleep). Gegen `pnpm preview` lokal ist das schnell, aber nicht sofort.
- **Prüfungen im Test:** Zähler „4/4 Plätze“; die zwei Pflicht-Karten tragen „Pflicht in dieser Mission“ und haben kein tippbares Haken-/Plus-Steuerelement; ein gesperrtes Plus tippen blendet „Alle Plätze besetzt“ ein und ändert nichts; eine gewählte Nicht-Pflicht-Karte abwählen → „3/4 Plätze“, danach ein Plus antippen → wieder „4/4“; „Kampf beginnen“ → `canvas.hc-stage` sichtbar (Zeit wie `smoke.spec.ts`, ~60 s für das Brett). Zusätzlich in den Projekten iphone13 und desktop: kein waagrechtes Scrollen (`scrollWidth ≤ innerWidth`).
- **Offen für den Umsetzer:** ob der Import eines `contentVersion: 'fixture'`-Spielstands im Preview-Build ohne Rückfrage durchläuft (`ensureRecordContent`); wenn nicht, die Version im Generator aus dem Build ableiten oder den Spielstand im Test über `page.evaluate` in IndexedDB legen.

### Regeln

- Spielwerte und Texte nie im Code (Schlüssel in `de.yaml`/`en.yaml`); Beträge Symbol + Zahl (hier nur TP, Zahl + „TP“).
- Eine Handlung = ein Tipp, höchstens 2 Taps (Wählen 1 Tipp, Tasche 1 Tipp, Start 1 Tipp).
- Styles je Screen in eigener CSS-Datei neben der Komponente; `styles.css` schrumpft nur.
- Ein Glut-Knopf je Ansicht (nur „Kampf beginnen“); Schaltsteine dunkel, nicht Glut.
- Nichts nur über Farbe: Haken/Plus/Schloss sind Formen, Pflicht und Voll haben Text, TP-Ring ist Dekor zur Zahl.
- Kein neuer Zufall, keine Regel im UI, kein Eingriff in `src/core` (Coverage-Vorgabe unberührt).
- Der Zugriff auf `FigureFlow` (Ausrüsten) und `beginMission` bleibt unverändert; keine neue Abhängigkeit zwischen den State-Modulen unter `src/app/state/`.

### Learnings aus den Nachbar-Stories

- 6.1/6.2 (Truppe, Ausrüsten): Medaillon-Kopf (`UnitHead`), `hc-view`, `Backdrop image={homeBackdrop()}` und `Tabs`/`Piece` sind das Muster; `FigureFlow` bringt Wischen und Ausrüsten schon mit.
- 6.6/6.7 (Ergebnis, Abschied) und 6.9: je Screen eigene CSS-Datei neben der Komponente, Altbestand-Abschnitt in `styles.css` im selben Commit löschen, Sichtprüfung im Dev-Server (Hochformat) und Screenshots senden.
- Bildabhängigkeit: Köpfe (`avatars/*.webp`) und Item-Bilder entstehen mit `pnpm art:build` (in einem frischen Worktree vorher `git lfs pull`); fehlt ein Kopf, zeigt `UnitHead` die Initiale.

### References

- [Source: concept/26-epics/epics.md#Story 6.10]
- [Source: concept/25-ux/mockups/09-aufstellung.html]
- [Source: concept/25-ux/DESIGN.md Components „Einheitenkarte“, „Item-Chip“, „Haupttaste“, „Medaillon“; Layout & Spacing „Vollbild-Ansichten“]
- [Source: concept/25-ux/EXPERIENCE.md „Component Patterns“ (Haupttaste), „Responsive & Platform“, Information Architecture „Aufstellung“]
- [Source: concept/25-ux/mockups/03-weltkarte.html Knoten-Karte, 06-truppe.html, 08-ergebnis-abschied.html]
- [Source: concept/25-ux/.decision-log.md 2026-10-26]
- [Source: src/app/screens/Camp.tsx:153-228, src/app/state/flow.ts `playNode`, src/app/screens/WorldMap.tsx `NodeCard`, src/app/screens/Troop.tsx `FigureFlow`, src/ui/pieces.tsx]
- [Source: _bmad-output/implementation-artifacts/6-1-truppe-und-figur.md, 6-6-missionsergebnis.md, 6-9-die-paktwacht-als-heimat.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (gds-dev-story, nicht interaktiv)

### Debug Log References

- Sichtprüfung im Dev-Server (`localhost:5173`): Spielstand über das Eingabefeld der Kampagnen-Ansicht importiert (`tests/fixtures/saves/prep-worldmap-export.json`), Knoten 1-1, „Aufstellung“, Vorgespräch überspringen. Screenshots unter `scratchpad/shots/6-10/`.

### Completion Notes List

- `Prep` liegt in `src/app/screens/Prep.tsx` (+ `Prep.css`, Präfix `prp-`), `UnitRow` als eigene Komponente. Die Startauswahl kommt aus `defaultDeploy(node)` in `flow.ts` (dieselbe Funktion wie beim direkten Start, keine zweite Kopie der Regel). Die reinen Regeln (Schalten, feste Reihenfolge) stehen in `src/app/prepDeploy.ts` (`toggleDeploy`, `deployOrder`) mit Unit-Test `tests/unit/prep-deploy.test.ts`.
- Entscheidungen des Produktinhabers vom 2026-10-26 (Mockup unverändert abgenommen) sind oben unter „Bestätigt vom Produktinhaber“ vermerkt; keine Abweichung vom Mockup, daher kein neuer Eintrag im `.decision-log.md`.
- Kleine Ergänzung gegenüber der Schlüsselliste der Story: `ui.prep.roster` („{n} Gefährten“ / „{n} companions“) für die Überschrift „Truppe · 6 Gefährten“ der breiten Layouts (im Mockup so gezeigt) und `ui.prep.hp` („{n} TP“ / „{n} HP“), das die Story als Möglichkeit nannte.
- Toast: der bestehende `Toast` wird in `Prep.css` nach unten über die Haupttaste gelegt (Mockup) und trägt ein Plus-Symbol als `lead`; in den breiten Layouts mittig über der linken Spalte.
- Trefferfläche: Schalt- und Taschen-Stein sind 38 px groß mit 44 px Trefferfläche (`::before`, Abstand 6 px).
- Altbestand entfernt: `UnitCard`, `HpBar` (`src/ui/components.tsx`, dazu ungenutzte Importe `computeStats`, `ruleOn`, `ElementIcon`, `BattleState`, `BattleUnit`, `Team`, `UnitRecord`) und `.unit-card`, `.unit-name`, `.unit-sub`, `.hpbar*`, `.hp-num` in `src/ui/styles.css` (vorher per `grep` belegt: nur `Prep` nutzte sie). `ui.prep.count` entfernt (nirgends sonst benutzt).
- E2E: `tests/e2e/prep.spec.ts` importiert `prep-worldmap-export.json` (vom Generator `tests/fixtures/saves/generate.ts` erzeugt: Kampagne nach dem Prolog, sechs Gefährten) über das Eingabefeld der Kampagnen-Ansicht; der Import mit `contentVersion: 'fixture'` läuft ohne Rückfrage durch. Der Generator schreibt bei jedem Lauf auch `format1-auto.json` und `format2-auto.json` neu; diese beiden Dateien bleiben bewusst unverändert (Fixtures aus dem vorigen Release), beim Neuerzeugen des Prep-Exports also nur die neue Datei übernehmen.

- Prüfungen grün: `pnpm lint`, `pnpm test` (70 Dateien, 844 Tests), `pnpm content:check`, `pnpm build`, `pnpm test:e2e` (17 bestanden, 3 übersprungen wie zuvor). Im E2E-Test ist der gestrichelte Plus-Stein `aria-disabled`; Playwright hält ihn für nicht bedienbar, daher `click({ force: true })`.

### File List

- `src/app/screens/Prep.tsx` (neu)
- `src/app/screens/Prep.css` (neu)
- `src/app/prepDeploy.ts` (neu)
- `src/app/screens/Camp.tsx` (Prep und ungenutzte Importe entfernt)
- `src/app/App.tsx` (Import von `./screens/Prep`)
- `src/ui/components.tsx` (`UnitCard`, `HpBar`, ungenutzte Importe entfernt)
- `src/ui/styles.css` (Regeln `.unit-card`, `.unit-name`, `.unit-sub`, `.hpbar*`, `.hp-num` entfernt)
- `content/core/locales/de.yaml`, `content/core/locales/en.yaml` (`ui.prep.*`)
- `tests/unit/prep-deploy.test.ts` (neu)
- `tests/e2e/prep.spec.ts` (neu)
- `tests/fixtures/saves/generate.ts`, `tests/fixtures/saves/prep-worldmap-export.json` (neu)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (6-10: review)
