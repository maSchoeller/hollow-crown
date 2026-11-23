# Story 16.15: Figurenblatt als 3D-Ankleidepuppe

Status: ready-for-dev

## Story

Als Spieler
möchte ich meine Figur in 3D mit ihrer Ausrüstung sehen und direkt umziehen,
damit ich verstehe, was sie gerade leisten kann.

## Acceptance Criteria

Quelle: Epic 16, Story 16.15; EXPERIENCE „Figurenblatt (Ankleidepuppe)“ (Z. 109); DESIGN `dress-doll` (Z. 320), `doll-sheet` (321), `performance-grid` (322), `change-list` (317); Mockup `art/mockups/ausruestung-2026-11/truppe.html` Variante A, Fassung 5 (`#pA`); UX-DR34, UX-DR35, UX-DR39. Grundlage: 16.9 (Griff-Rig), 16.10 (Ruhe/Kampfhaltung), 16.13 (Änderungsliste), 16.14 (Waffenansicht, Item-Bühne) liegen auf `main`.

1. **Figur in 3D über das ganze Handy.** Das Figurenblatt (bisher `Figure` in `Troop.tsx`) wird zur Ankleidepuppe: eine neue Bühne `UnitStage` (`src/render/units/unitStage.ts`, `HostedView`, Muster `ItemStageView`) zeigt das **Brettmodell** der Figur (gleiche Modellauflösung wie das Brett: `modelId`, `unitModelPath`, `unitVatPath`, `loadUnitModel`, Ausrüstung mit Runen über dieselben `FigurePiece`-Bausteine wie `BoardUnits.gearOf`) bildschirmfüllend auf dem warmen dunklen Grund (`dress-doll`). Die Figur steht in **leichter Kampfhaltung**: `ModelFigure` mit `stanceSetup` und `setStance(true)` (16.10, `ready_<s>`), Runen leuchten voll (`setRuneGlow`/Zustand `full` wie bei der gewählten Brettfigur).
   - **Drehbar per Ziehen** (nur Gier; Neigung fest), Auslauf und Doppeltipp-Reset über `StageMotion` aus `src/render/items/stageMath.ts` (wiederverwenden, nicht kopieren); Zahlen in `render.yaml` Abschnitt `unitStage` mit Zod-Schema in `src/content/schemaRender.ts`.
   - Babylon-Code nur per **dynamischem Import** (Muster `ItemStageFrame.tsx`); bis zum Aufbau, ohne Modell (Blender-Figuren ohne Rig, Sprite-Figuren) oder bei Fehlschlag zeigt die Hülle die Büste/das Porträt groß (`UnitBust`) – kein leerer Schirm.
   - Eine Szene zur Zeit (AR12): das Figurenblatt aktiviert seine Bühne nur, wenn es **eigener Screen** ist (`troop`). In der Vorbereitung (`Prep.tsx`, `FigureFlow`), wo das Brett lebt, bleibt das Bild-Fallback ohne 3D [ASSUMPTION A1].
   - `dispose()` gibt alles frei (`host.release(this)`, Canvas aus dem Slot); Modelle über `host.store(this)` (geteilter Cache).
2. **Kopfpille** oben (Mockup `.pill`): runder Pfeil zurück/vorige Figur, Name (Fraunces), Unterzeile Klasse · Stufe · Erfahrung (Symbol + Zahl, `expProgress`), Pfeil zur nächsten Figur. Wischen links/rechts und Pfeiltasten wechseln die Figur wie heute (`SWIPE_PX`), dabei baut die Bühne das neue Modell auf (alte Figur freigeben). Ein Zurück-Stein führt wie heute zur Medaillon-Liste (`onBack`).
3. **Plätze über dem Bild:** links Haupthand, Kopf, Körper; rechts Nebenhand, Accessoire 1, Accessoire 2 (`EQUIP_SLOTS`), je als 46-px-Stein mit Item-Bild (`ItemImage`), Runenpunkt (`ElementDot`, Farbe der Rune, unten rechts; nur bei Item mit Rune) und heller Beschriftung darunter; leere Plätze gestrichelt halbtransparent, gewählter mit Glutrand. Tippen markiert den Platz **ohne Kamerafahrt** (die Bühne bewegt sich nicht); erneutes Tippen hebt die Wahl auf.
4. **Heller Bereich unten** (`doll-sheet`, eigene Scrollfläche, Griff 40 × 5):
   - **Zu (ein Viertel):** Leistungs-Tabelle (`performance-grid`, 4 × 2) mit TP, Angriff, Treffer, Krit, Ausweichen, Verteidigung, Bewegung, Reichweite als Linien-Icon + Zahl + Beschriftung; die Zahlen kommen aus **demselben Formelcode wie Kampfvorschau/Auflösung** (keine Eigenrechnung; Kandidaten im Kern suchen, z. B. die Funktion hinter `changeList`-Zeilen bzw. `weaponProfile`/`computeStats`). Darunter **Beutel** (`balance.bag.size` Plätze als 36-px-Steine, Schlüssel fest und nicht tippbar) und **Last** (Balken + „n/m“, wie heute `.trp-load`).
   - **Hochgezogen (gut die Hälfte, Griff tippen oder ziehen):** Grundwerte mit vollem Namen (die drei stärksten markiert), Können mit FP-Stand (heutige `.trp-skill`-Zeilen, `ui.sp`/`ui.mastered`), Elemente von Waffe, Schild und Rüstung (Chips „Axt: Feuer II“, „Affinität: keine“). Alles übrige des alten Blatts bleibt erreichbar (Vorlagen speichern/anlegen, „Bestes anlegen“, Fähigkeiten-Loadout, Beförderung, Narben, Eigenschaften, Herkunft) [ASSUMPTION A2].
   - **Platz gewählt (knapp zwei Drittel):** Item-Details **wie beim Kauf** (Bild, Typ, Seltenheit, Preis als Symbol + Zahl, Beschreibung, Werte mit Namen, Rune als `ChangeList` gegenüber „ohne Rune“, gelehrte Fähigkeit mit FP-Fortschritt, Set) – vorhandene Bausteine des Händlers (16.17) bzw. `ItemSheet`-Inhalt wiederverwenden, nicht doppeln; Tasten „Wechseln“ (öffnet die bestehende Kandidatenliste `EquipView` für diesen Platz) und „Waffe ansehen“ (nur Waffe/Schild, `openWeapon(uid, { unit })`, 16.14). Leerer Platz: nur „Ausrüsten“ (→ `EquipView`). Leistungs-Tabelle und Beutel sind dann verborgen.
5. **Beutel direkt aus dem Konvoi:** Tippen auf einen **leeren** Beutelplatz zeigt im Bereich die Liste der passenden Konvoi-Items (`equipCandidates(…, 'bag')`); Tippen auf eins legt es ein (`{type:'equip', unit, uid, slot:'bag'}`). Tippen auf einen **vollen** Beutelplatz zeigt seine Karte mit „zurück in den Konvoi“ (`{type:'unequip', uid}`). Fehler wie heute über `ui.camp.err.*` als Toast; Konvoi voll → Taste gedimmt mit Grund.
6. **Alte Styles weg:** Der Figurenblatt-Block in `src/ui/troop.css` (`.trp-fig*`, `.trp-bust*` soweit nur hier, `.trp-role`, `.trp-exp*`, `.trp-bar*`, `.trp-stats/.trp-stat`, `.trp-slots/.trp-slot*`, `.trp-load`, `.trp-skill*`, `.trp-chips/.trp-gear`, `.trp-scar`, ca. Z. 131–312) ist gelöscht; `.trp-head*` und die Medaillon-Liste (Z. 5–130) bleiben (andere Screens nutzen `.trp-head`, Farewell `.trp-bust` – prüfen und nur Unbenutztes löschen). Gibt es in `src/ui/styles.css` noch Regeln des alten Figurenblatts/Equip, werden sie ebenfalls gelöscht (Epic nennt `styles.css`; der Block liegt tatsächlich in `troop.css`). Neue Styles in `src/app/screens/Doll.css` (bzw. neben der neuen Komponente), Tokens aus `tokens.css`, keine harten Schatten; `styles.css` wächst nicht.
7. **Texte** als Schlüssel (`ui.doll.*`) in `content/core/locales/de.yaml` und `en.yaml` (Plätze, Tabellenköpfe, Beutel, Last, Grundwerte, Können, Elemente, „Wechseln“, „Ausrüsten“, „Waffe ansehen“ (vorhandener Schlüssel `ui.weaponView.open` darf bleiben), „zurück in den Konvoi“, „aus dem Konvoi“, Hinweis „ziehen dreht“, aria der Bühne „{Name} in 3D, ziehen dreht“). Keine Emojis, nur Linien-Icons aus `src/ui/icons.tsx` (fehlende dort ergänzen).
8. **Beleg** bei 375 × 812 neben `truppe.html` `#pA`: Figur mit Waffe und Schild in Kampfhaltung, ein Platz gewählt (Item-Details). Dev-Aufruf über vorhandenes `__hc.devConvoy()` bzw. `devJoin('troop')`; ggf. ein schlanker Hook `__hc.devDoll(unitId?)`.
9. **Tests und Abschluss:** siehe Testanforderungen; `pnpm check` grün (lint, test, content:check, build inkl. Bundle-Budget, Zahl vorher/nachher in den Notes); Coverage von `src/core` nicht gesenkt; kein `content:lock`; keine neuen Spielwerte, kein neues Speicherformat.

## Tasks / Subtasks

- [ ] Task 1: Ausrüstungs-Bausteine aus `BoardUnits` lösen (AC 1)
  - [ ] 1.1 `gearOf`/`withRunes`/`stanceKeyOf`/`weaponOf` (heute `protected` in `src/render/board/boardUnits.ts`, auf `BattleUnit`) in ein gemeinsames Modul ziehen (z. B. `src/render/shared/unitGear.ts`), das nur `equip`/`classId`/`team` braucht, damit `UnitRecord` und `BattleUnit` es nutzen; `BoardUnits` ruft es auf (Verhalten unverändert, bestehende Tests grün)
- [ ] Task 2: `UnitStage` (AC 1)
  - [ ] 2.1 `src/render/units/unitStage.ts`: `HostedView`, Kamera/Lichter (Fit nach Bounding-Box), `StageMotion` (Neigung 0, Grenze 0), Pointer-Listener mit `AbortController`, `show(unit…) : Promise<boolean>`, `dispose()`
  - [ ] 2.2 `ModelFigure` mit `stanceSetup`, `setStance(true)`, `setRuneGlow` voll, `tick(now)` je Frame; `busy()` wahr bei Eingabe/Auslauf/Haltungswechsel/Gesten, sonst `fpsIdle`
  - [ ] 2.3 `render.yaml` `unitStage` (fov, margin, startYawDeg, dragDegPerPx, dampingPerSec, spinDegPerSec 0, doubleTapMs, tapSlopPx, resetMs, Lichter, Bodenhöhe/Blickhöhe) + Schema
- [ ] Task 3: Oberfläche (AC 2–5, 7)
  - [ ] 3.1 Hülle `UnitStageFrame` (lazy, Fallback `UnitBust`), Prop `stage3d`
  - [ ] 3.2 Neue Komponente `Doll` (`src/app/screens/Doll.tsx` + `Doll.css`) ersetzt `Figure` in `FigureFlow`; reine Logik (Platzliste, Leistungswerte, Element-Chips, Beutel-Aktionen als Commands) in `src/app/screens/dollViewModel.ts`
  - [ ] 3.3 Kopfpille, Plätze, Bereich zu/hoch/Details, Beutel aus dem Konvoi, Übernahme der übrigen Blatt-Funktionen in den hochgezogenen Bereich
  - [ ] 3.4 Locales DE/EN
- [ ] Task 4: Aufräumen (AC 6) — `troop.css`-Block löschen, `styles.css` prüfen, `Troop.tsx` verschlanken
- [ ] Task 5: Tests, Beleg, Abschluss (AC 8, 9)

## Dev Notes

### Ist-Zustand (gelesen)

- **Routing:** `screen.ts:25` `{ name:'troop'; unit?; from? }`, `App.tsx:121` rendert `<Troop from>`. `Troop` (Medaillon-Raster) → gewählte Figur → `FigureFlow({unit, units, onSelect, onBack, readOnly})` (`Troop.tsx:131`) → `eq` gesetzt ? `EquipView` : `Figure`. `Prep.tsx:43/306` nutzt `FigureFlow` ebenfalls (Brett lebt dort!).
- **`Figure` (`Troop.tsx:143`)**: Kopf mit `UnitBust`, Name, Rolle, Klasse/Stufe, EXP (`expProgress`); `computeStats(data, unit, {relics: campaignRelics.value})`; Plätze `EQUIP_SLOTS` + `balance.bag.size` Beutel + Schlüssel (`isKey`, fest); Augen-Chips `openWeapon` für Haupt-/Nebenhand; Last-Balken; Narben; FP-Zeilen (`unit.sp`, `grantsSkill.masteryCost`); Loadout (`unit.mastered`, `unit.loadout`, `loadoutSlots`); aktive Fähigkeiten (`activeSkillIds`); `TraitChips`; Herkunft; Beförderung (`camp` mit Akademie). Commands: `saveGearTemplate`, `applyGearTemplate`, `equipBest`, `setLoadout`; `apply(cmd)` → `campaignCommand`, `audio.sfx`, Toast `ui.camp.err.*`.
- **`Equip.tsx` (`EquipView({unit, slot, index, onBack})`)**: Kandidaten `equipCandidates(data, c, unit, slot, excludeUid?)` (Beutel + Konvoi, `error` je Eintrag), `changeList(data, unit, inst, {slot})` → `ChangeList`, `Deltas`, `reason()`; Commands `{type:'equip', unit, uid, slot, replace?}` / `{type:'unequip', uid}`; Beutel-Index zählt Nicht-Schlüssel-Plätze. **Bleibt als „Wechseln“-Liste.**
- **Brettmodell** (`src/render/board/boardUnits.ts` `makeFigure` ~92–107): `modelId(u, manifest.units, data.classes)` (`src/core/figure.ts:24`), `unitVatPath`, `loadUnitModel(store, mid, team, name, gearOf(u), unitPacks, vatPath)` (`models.ts:437`, nur Ausschnitt lesen), `root.scaling.setAll(board.figureScale)`, `new ModelFigure(model, weaponOf(u)?.motion, idleHz, tintPool, {key: stanceKeyOf(u), switchS, gestureEveryS})` (`src/render/shared/figures.ts:66`); ohne Modell `SpriteFigure`. `gearOf` (:48) und `withRunes` (:61: `gearRunesOf`, `runeLookOf`, `fixedRuneOf`) sind `protected` → Task 1.
- **Haltung (16.10):** `ModelFigure.setStance(ready)` (:219) spielt `ready_in_<s>` in `switchS` (0,25 s, `render.yaml board.stance`); kein API für eine feste Pose ohne Ticken → `tick(now, 1, true)` je Frame. Blender-Figuren (`avatar`, `fighter`, `mage`) ohne Rig: kein VAT, keine Haltung → spielen `idle`, das ist ok.
- **Item-Bühne (16.14):** `ItemStageView` (`src/render/items/itemStage.ts:56`): `renderHost(data)`, `host.mount(slot)`, `host.store(this)`, `host.activate(this)`, `host.setQuality(quality)`, `FreeCamera`, Hemi/Key/Rim, `pivot`, `StageMotion`, Pointer mit Capture, `fitDistance`; Hülle `ItemStageFrame.tsx` (lazy import, `gone`-Flag, Fallback). `quality` aus `settings.value.quality`.
- **Mockup `#pA`:** `.stage` (Canvas), `.pill` (Pfeile `data-nav`), `[data-left]` (left 12, top 84, Spalte gap 26: main, head, body), `[data-right]` (off, acc1, acc2), `.slot` 46 px / `.slot.sm` 36 px, `.rn` 15 px, `.lb` 9,5 px; `.sheetA` 25 % / `.big` 58 % / `.det-on` 64 %, Creme rgba(255,248,236,.95), 18 px Ecken; `.perf` 4 × 2; Beutel + Last „10/16“; `[data-more]` Grundwerte (5 Spalten, `.hi` drei stärkste), Können-Chips („Wucht 18/25“), Element-Chips; Details `detailHTML` (:237) mit `.vals`, `.drow`, `.fp`, Tasten `swap`/`view`; Beutel-Karte „Beutel n füllen · aus dem Konvoi“ bzw. „zurück im Konvoi“.
- **Styles:** Das alte Figurenblatt liegt in `src/ui/troop.css` (nicht `styles.css`), importiert in `Troop.tsx:39` und `unitArt.tsx:6`. `.trp-head` nutzen PersonBar, Chronicle, Farewell, Merchant, Result, Dialogue, camp, consequence; `.trp-bust` nutzt Farewell.

### Entscheidungen (Annahmen)

- [ASSUMPTION A1] **Vorbereitung ohne 3D:** In `Prep` lebt die Brettszene; zwei Szenen gibt es nicht (AR12). Dort zeigt die Ankleidepuppe das Bild-Fallback (gleiches Layout). Frage an den PO in `morgen-fragen-16-15.md`.
- [ASSUMPTION A2] **Übrige Funktionen des alten Blatts** (Vorlagen, Bestes anlegen, Loadout, Beförderung, Narben, Eigenschaften, Herkunft) wandern in den hochgezogenen Bereich unter Grundwerte/Können/Elemente; nichts entfällt.
- [ASSUMPTION A3] **Leistungs-Tabelle** zeigt die Werte mit der aktuellen Haupthand gegen einen neutralen Gegner (wie die Änderungsliste, 16.13 S3-Annahme: DEF/RES 0, kein Dreieck); Reichweite als „min–max“.
- [ASSUMPTION A4] **Nur Gier drehen**, Neigung fest; kein Eigendrehgang (die Figur atmet/gestikuliert ohnehin), Start leicht schräg (`startYawDeg` in `render.yaml`).
- [ASSUMPTION A5] **Rüstung und Accessoires** haben kein Modell und erscheinen nur als Platz (EXPERIENCE, PO 2026-11-21).

### Projektregeln (AGENTS.md)

- `src/core` bleibt Regeln/Events, kein Babylon/DOM; Bühne kennt keinen Spielstand (Auflösung Einheit → Modell/Teile in App- oder Shared-Render-Modul).
- Werte nur in YAML (`render.yaml`), Texte DE+EN, Beträge Symbol + Zahl, Linien-Icons, Styles je Screen eigene CSS-Datei, `styles.css` nur schrumpfen.
- App-Zustand in `src/app/state/` ein Modul je Verantwortung, kein Barrel, keine Zyklen.
- Große Dateien nur im Ausschnitt: `models.ts`, `Rooms.tsx`, `BattleHud.tsx`, `boardProps.ts`, `architecture.md`.
- Tests dürfen **keine echten GLB-/VAT-Inhalte** voraussetzen (CI: Git-LFS-Zeiger).

## Testanforderungen

- `tests/unit/doll-view.test.ts`: Platzliste (sechs Plätze links/rechts, leere/gewählte), Runenpunkt nur bei Rune, Leistungswerte = Kernformel (gleicher Aufruf wie Vorschau), Element-Chips, Beutel: leerer Platz → Kandidaten aus Konvoi und `equip`-Command mit `slot:'bag'`, voller Platz → `unequip`; Schlüssel nicht tippbar.
- Ausgelöste Ausrüstungs-Bausteine (Task 1): `gearOf` für `UnitRecord` und `BattleUnit` gleich (Haupthand, Nebenhand, Runen); bestehende Brett-Tests grün.
- `unitStage`-Schema: `render.yaml` lädt, Zahlen im erwarteten Bereich; Bewegung über `StageMotion` (nur Gier).
- Locales: alle `ui.doll.*` in DE und EN, keine Emojis.
- Nicht automatisiert: Komponentensicht und 3D (Bildbeleg).

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List
