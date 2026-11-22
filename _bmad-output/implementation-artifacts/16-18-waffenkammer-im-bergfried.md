# Story 16.18: Waffenkammer im Bergfried

Status: done

## Story

Als Spieler
möchte ich meine Relikte und Signaturwaffen in der Burg ausgestellt sehen,
damit meine Trophäen einen Ort haben.

## Acceptance Criteria

1. **Stein und Kachel:** Ab der Burg (Heimat `castle`) erscheint über dem Bergfried ein eigener Stein ohne Stufenpunkte und ohne Ausbau-Pfeil, sobald die Truppe das erste Relikt oder die erste Signaturwaffe besitzt. In der Raumliste steht die Waffenkammer als **letzte** Kachel, ebenfalls ohne Stufenpunkte. Ohne Stück: weder Stein noch Kachel.
2. **Vollbild-Gewölbe:** Tippen auf Stein oder Kachel öffnet die Waffenkammer als 3D-Vollbild (eigener Screen) mit rundem Zurück-Stein (zurück in die Burg) und Kopfpille „Waffenkammer“ mit der Zahl der Stücke (Symbol + Zahl).
3. **Drehscheibe:** Ständer (runder Steinsockel mit Ring in Runenfarbe, ohne Rune gold; leer grau) stehen auf einer Drehscheibe. Wischen dreht sie und rastet auf einen Ständer ein; das vordere Stück steht im Licht. Die Stücke drehen sich langsam, Runen leuchten wie auf dem Brett.
4. **Spiegel, keine Ablage:** Jedes Relikt und jede Signaturwaffe im Besitz steht auf einem Ständer, auch getragene. Getragenes steht als heller, halb durchsichtiger Umriss; das Namensschild zeigt den Kopf der Trägerin und „trägt <Name>“. Nichts wird hineingelegt, herausgenommen oder blockiert.
5. **Leere Ständer:** verborgene Relikte mit Schloss („noch verborgen“), Signaturen in Reichweite mit Stand („Ulvric 2 von 4“). Waffen mit Beinamen und die Ausrüstung Gefallener kommen nicht hinein.
6. **Waffenansicht:** Tippen auf Stück oder Namensschild öffnet die Waffenansicht (`openWeapon`), Zurück dort führt wieder in die Waffenkammer (gleicher Ständer vorn). Stücke ohne 3D-Modell zeigen ihr Item-Bild auf dem Ständer; die Waffenansicht zeigt Signatur-/Relikt-Modelle aus 16.8 (`modelFor`) statt des Gruppenmodells.
7. **Banner:** Außen am Bergfried hängt je Stück im Besitz ein Banner in der Farbe seiner Rune (ohne Rune gold).
8. **Keine Funktion:** keine Spielwerte, keine Commands, kein Dock-Knopf, kein Eintrag im Speicherformat.
9. Texte DE und EN, nur Linien-Icons, Werte (Drehgeschwindigkeit, Radius, Farben, Licht) in YAML, Styles in eigener CSS-Datei, `pnpm check` grün, Paket-Budget gehalten.

## Tasks / Subtasks

- [x] T1 Inhalt (AC 1, 5): Signaturwaffen bekommen in `content/core/items.yaml` den Tag `signature` (tinder, bounty, wolf_fang, little_hands, rowenas_lance, wasp_sting, gold_hook, dravns_oath, magpie, white_wolf, heirloom, final_curtain – vorher per Grep prüfen, welche Items unter den Signatur-Überschriften stehen und welche `relic` tragen). Relikte erkennt man am vorhandenen Tag `relic`. Schema für `tags` prüfen (Enum?) und ggf. erweitern; Content-Querprüfung: jedes `signatureItem` eines Leutnants trägt `signature`.
- [x] T2 Kern (AC 1, 4, 5): reine Funktion `armoryOf(data, c)` in neuem Modul `src/core/campaign/armory.ts` (Export über `src/core/index.ts` wie die Nachbarn) → `{ pieces: ArmoryStand[] }` mit Ständer-Arten `owned` (uid, def, wearer?: unitId), `hidden` (Relikt-Def, nicht im Besitz) und `reach` (Signatur-Def eines Leutnants, getroffen, noch nicht gefallen/beigetreten, `routs` und `guaranteedRout` aus `balance.lieutenant.signature`). Besitz = Ausrüstung lebender Roster-Einheiten + Konvoi (Gefallene zählen nicht). Reihenfolge stabil: Besitz (Relikte vor Signaturen, dann Item-Reihenfolge in `data.items`), danach leere. Hilfen `armoryCount(...)` (Zahl der Stücke im Besitz) und `armoryOpen(data, c)` (Burg + ≥ 1 Stück). Unit-Tests in `tests/unit/` (Muster der Nachbartests, `labState`/Fixtures wie dort), Coverage von `src/core` nicht senken.
- [x] T3 Screen (AC 2, 4, 5, 6): `Screen`-Variante `{ name: 'armory'; at?: string }` in `src/app/state/screen.ts`, Fall in `App.tsx`; neue Komponente `src/app/screens/Armory.tsx` + `Armory.css`. Kopfpille, Zurück-Stein (`{ name: 'camp' }`), Namensschilder `stand-plate` nach DESIGN.md (Creme-Pille, 1,5 px Kontur, Barlow Condensed 12 px, Linien-Icon Stern für Relikt / Krone für Signatur oder `UnitHead` 16 px + „trägt Brenna“; getragen gestrichelt 70 %, leer gestrichelt 55 % mit Schloss oder Stand). Schilder sind DOM-Elemente, die die 3D-Szene je Frame unter ihren Ständer setzt (Muster `setPin` in `src/render/home/castle.ts`); nur das vordere und seine Nachbarn sichtbar, wenn es eng wird. Tippen → `openWeapon(uid, { unit: wearer, back: { name: 'armory', at: uid } })`. Icons nur aus `src/ui/icons.tsx` (fehlt eins, als Linien-Icon dort ergänzen).
- [x] T4 Szene (AC 3, 4, 6): `src/render/items/armory.ts` – `ArmoryView implements HostedView`, lazy per `import()` wie `Castle3d`/`ItemStageFrame`, eigener Szenen-Inhalt auf dem `renderHost`: Gewölbe prozedural (Steinwand mit Säulen, dunkler Boden, warmes Licht von vorn oben), Drehscheibe mit Ständern im Kreis, Swipe dreht mit Einrasten (Hilfen aus `stageMath.ts` wiederverwenden, keine Kopie), vorderes Stück im Spot. Modelle über `host.store(this)` (geteilter Cache), Pfad über `modelFor` + `pieceFolder` (16.8, `sig/` lädt bei Bedarf), Runen über `dressRuneWeapon`/`RuneKit` aus `runeGlow.ts` mit `stageRunes` bzw. `fixedRuneOf` (Relikt-Stufe aus `relicCtx`). Getragen: heller halb durchsichtiger Einheitsmaterial-Umriss. Ohne Modell oder Datei fehlt: Item-Bild als Billboard-Ebene. `dispose()` gibt alles frei. Werte in `content/core/render.yaml` Abschnitt `armory` (Radius, Drehung °/s, Einrast-Dauer, Licht, Ringfarbe gold, Umriss-Deckkraft …) mit Zod-Schema in `src/content/schemaRender.ts` und Typ in `src/core/renderDefs.ts`.
- [x] T5 Waffenansicht (AC 6): `weaponStageModel` in `src/app/screens/weaponViewModel.ts` nutzt `modelFor` (eigene Modelle aus `gear.items` mit `sig/`-Ordner), `stageRunes` zeigt `fixedRuneOf` in leerer Hauptfassung. Bestehende Tests der Waffenansicht grün halten.
- [x] T6 Burg (AC 1, 7): In `Camp.tsx` letzte Kachel „Waffenkammer“ ohne `Pips`, in `Castle3d.tsx` ein zusätzlicher Stein `armory` ohne Pips/Pfeil; `CastleView.setPin('armory', el)` setzt ihn über die Bergfried-Spitze (`KEEP_TIP` plus Abstand aus YAML). Banner: `CastleView.setBanners(colours: string[])` hängt je Farbe ein kleines Tuch (prozedurale Ebene, leichtes Wehen optional) an den Bergfried; Farben aus `armoryOf` (Runenfarbe der Hauptfassung, sonst gold aus YAML). Kein Eintrag in `CASTLE_ROOMS`/`rooms.yaml` (kein Raum).
- [x] T7 Texte (AC 9): Schlüssel in `content/core/locales/de.yaml` und `en.yaml` (z. B. `ui.armory.title`, `.count`, `.hidden`, `.reach` mit `{name} {n} von {max}`, `.worn` „trägt {name}“, `.back`).
- [x] T8 Dev-Hook: `__hc.devArmory()` in `src/app/state/devHooks.ts` (Muster `devWeapon`/`devEnchanter`): Burg-Kampagne mit einem Relikt im Konvoi, einer getragenen Signatur mit Rune, einem verborgenen Relikt und einem Leutnant in Reichweite; öffnet die Waffenkammer.
- [x] T9 Prüfen: `pnpm check` grün. Tests dürfen **keine echten GLB-Inhalte** voraussetzen (in der CI sind es Git-LFS-Zeiger) – Szene nicht in Vitest laden, Logik in reinen Funktionen testen.

## Dev Notes

### Quellen
- Epic: `concept/26-epics/epics/epic-16.md` Story 16.18.
- Verhalten: `concept/25-ux/EXPERIENCE.md` Zeile 42, 112 („Waffenkammer (Bergfried)“), 241 (letzte Kachel ohne Stufenpunkte).
- Aussehen: `concept/25-ux/DESIGN.md` Zeile 341 (`stand-plate`); `concept/23-art-direction/art-direction.md` Zeile 279, 373 (§7 Gewölbe, Banner).
- GDD: `concept/21-gdd/gdd.md` Zeile 342.
- Mockup: `art/mockups/ausruestung-2026-11/vitrine.html`, Variante C (`#mC`).

### Bausteine (nicht neu erfinden)
- Item-Bühne 16.14: `src/render/items/itemStage.ts` (`ItemStageView`, Kamera/Licht/Runen-Ausstattung als Vorbild), `stageMath.ts` (`StageMotion`, `fitDistance`, `uprightAngle`), `src/app/screens/ItemStageFrame.tsx` (lazy Import, Fallback-Bild).
- Modelle 16.8: `src/render/shared/gearModel.ts` (`modelFor`, `fixedRuneOf`), `render.yaml` `gear.items` (`sig/<id>`), `pieceFolder` aus core, `plan.ts` hält `sig/` aus dem Erstdownload.
- Runen: `src/render/shared/runeGlow.ts` (`dressRuneWeapon`, `RuneKit`), `runeLook.ts` (`gearRunesOf`), Runenfarben aus `data.runes`.
- Waffenansicht: `openWeapon` (`src/app/state/weaponView.ts`), `weaponViewModel.ts`.
- Relikt-Stufen: `relicCtx` (`src/core/campaign/relics.ts`), Leutnants: `lieutenantState`, `isJoined` (`src/core/campaign/lieutenants.ts`), `LieutenantState.routs/signatureDropped`.
- Gegenstand finden: `locateItem` (`src/core/campaign/camp.ts`).
- Burg: `src/render/home/castle.ts` (`setPin`, `KEEP_TIP`), `src/app/screens/Castle3d.tsx`, `Camp.tsx` (Raumliste, `Pips`).
- Kopf: `UnitHead` in `src/app/screens/unitArt.tsx`.

### Annahmen
- [ASSUMPTION A1] Signaturen per neuem Tag `signature` in `items.yaml` erkannt (inhaltsgetrieben statt aus `render.yaml` abgeleitet).
- [ASSUMPTION A2] „In Reichweite“ nur Leutnants, die die Truppe getroffen hat (`met`), deren Signatur noch nicht gefallen ist und die nicht beigetreten sind; Stand = `routs` von `guaranteedRout`. Gefährten-Signaturen (Nebenquests) und nie getroffene Leutnants erscheinen nicht als leere Ständer.
- [ASSUMPTION A3] Verborgene Relikte = alle Items mit Tag `relic` aus veröffentlichten bzw. geladenen Paketen, die nicht im Besitz sind.
- [ASSUMPTION A4] Kopfpille zählt nur Stücke im Besitz, nicht leere Ständer.
- [ASSUMPTION A5] Banner-Farbe = Farbe der Rune in der Hauptfassung (eingesetzt, sonst `fixedRune` der aktuellen Stufe), sonst gold.

### Konventionen (AGENTS.md)
- Werte nur in YAML, kein sichtbarer Text im Code, DE + EN, Beträge Symbol + Zahl, keine Emojis.
- Styles in `Armory.css` neben der Komponente; `src/ui/styles.css` nur schrumpfen.
- `src/core` ohne Babylon/DOM/Math.random/Date.now; State bleibt Plain-JSON, kein neues Speicherfeld.
- App-Zustand in `src/app/state/` je Verantwortung, kein Barrel, keine Importzyklen.
- Große Dateien (`Rooms.tsx`, `models.ts`) nur per `grep -n` und Ausschnitt lesen.
- Paket-Budget: Babylon-Szene nur lazy, nichts davon ins Hauptpaket.

## Dev Agent Record

### Agent Model Used

claude-sonnet-5-5 (Sonnet 5.5)

### Completion Notes List

- T1: Tag `signature` auf den 12 Signaturen in `items.yaml` (tinder, bounty, wolf_fang, little_hands, magpie, white_wolf, heirloom, final_curtain, rowenas_lance, dravns_oath, gold_hook, wasp_sting); `tags` ist ein freier String-Array (kein Enum). Test: jedes `signatureItem` eines Leutnants trägt den Tag (`tests/unit/armory.test.ts`). Relikte: `relic`-Tag oder `stages` (pact_warden_shield, dragon_ember).
- T2: `armoryOf` / `armoryCount` / `armoryOpen` in `src/core/campaign/armory.ts`, Export über `core/index.ts`; Tests in `armory.test.ts`.
- T3-T4: `Armory.tsx`/`Armory.css`, `render/items/armory.ts` (`ArmoryView`, lazy per `import()`), reine Drehscheibe in `render/items/armoryMath.ts` (`Carousel`, Tests `armory-math.test.ts`; nutzt `fitDistance`/`uprightAngle` aus `stageMath.ts`), Ständer-Vorgaben in `screens/armoryModel.ts` (`armorySpecs`, `bannerColours`). Werte in `render.yaml` `armory:` (Schema `schemaRender.ts`, Typ `ArmoryDef` in `renderDefs.ts`). Fällt die Szene aus (Chunk lädt nicht), stehen die Schilder als schlichte Liste.
- T5: `weaponStageModel` nutzt `modelFor`; `stageRunes(data, inst, stage?)` zeigt `fixedRuneOf` nur, wenn eine Stufe übergeben wird (Waffenansicht ja, Verzauberer nein, damit dort die echten Fassungen bleiben).
- T6: Kachel in `Camp.tsx` (ohne Pips), Stein `armory` in `Castle3d.tsx`, `CastleView.setPin('armory')` über `KEEP_TIP` + `pinLift`, `CastleView.setBanners(colours)`.
- T7: `ui.armory.*` in `de.yaml` und `en.yaml`; neue Linien-Icons `armory` und `crown` in `icons.tsx`.
- T8: `__hc.devArmory()` (öffnet die Waffenkammer), `__hc.devArmory(false)` zeigt die Burg mit Stein und Bannern.
- T9: `pnpm check`, siehe Bericht der Session. Szene und Banner wurden **nicht im Browser gesehen** (kein Dev-Server erlaubt): Kamera, Größen, Licht und Banner-Position sind Startwerte [C] in `render.yaml` und brauchen eine Sichtprüfung.
- [ASSUMPTION A6] Als „getragen“ zählt auch ein Stück im Rucksack einer Figur (`wearer` = jede lebende Roster-Einheit, die es hält).
- [ASSUMPTION A7] Ein antippbares Schild/Stück eines leeren Ständers rastet ihn nur ein (keine Waffenansicht, es gibt kein Stück); ein Tippen auf ein Stück öffnet die Waffenansicht auch bei den Nachbarn, nicht nur beim vorderen.
- [ASSUMPTION A8] Das Schild eines verborgenen Relikts nennt den Namen nicht („Relikt“ + Schloss „noch verborgen“); das Schild einer Signatur in Reichweite nennt den Waffennamen und „<Leutnant> n von max“ (max = `guaranteedRout`).
- [ASSUMPTION A9] Die Pose (Gier, aufrecht) eines Signaturmodells ist die des Gruppenmodells (`modelFor(...).fallback ?? model` als Schlüssel in `itemStage.models`); die eigenen `sig/`-Modelle haben keine eigene Pose.
- [ASSUMPTION A10] Banner hängen in einer oder mehreren Reihen (`perRow`) an einer festen Stelle relativ zur Bergfried-Spitze (`armory.banners.anchor`); die Lage ist ungeprüft.


### File List

- content/core/items.yaml, content/core/render.yaml, content/core/locales/de.yaml, content/core/locales/en.yaml
- src/core/campaign/armory.ts (neu), src/core/index.ts, src/core/renderDefs.ts, src/content/schemaRender.ts
- src/render/items/armory.ts (neu), src/render/items/armoryMath.ts (neu), src/render/home/castle.ts
- src/app/screens/Armory.tsx (neu), Armory.css (neu), armoryModel.ts (neu), weaponViewModel.ts, WeaponView.tsx, Camp.tsx, Castle3d.tsx, src/app/App.tsx
- src/app/state/screen.ts, src/app/state/devHooks.ts, src/ui/icons.tsx
- tests/unit/armory.test.ts (neu), armory-math.test.ts (neu), armory-model.test.ts (neu)

### Prüfung durch den Orchestrator (2026-11-22)

- Sichtprüfung 375 × 812: Bühne war nur 150 px hoch (`.hc-view > *` überschrieb `position: absolute`), Schilder blieben unsichtbar (leerer Inline-Wert fiel auf CSS `hidden` zurück, lokale statt Weltposition), Randschilder abgeschnitten, Wischen brach bei fehlschlagendem `setPointerCapture` ab, Umriss trug Vertex-Farben, Stein über der Spitze lag im HUD-Bereich (jetzt `pinLift: -1.6`), Icon glich dem Übungsplatz (jetzt schräges Schwert wie Mockup C). Alles behoben; Kamera `aimY 1.8`, `frontScale 1.5`.
- Review (gds-code-review, Sonnet): keine Blocker. Behoben: Content-Prüfung „Leutnant-Signatur trägt Tag `signature`“, unbenutzter Schlüssel `ui.armory.loading` entfernt, Ständer werden nur bei geändertem Inhalt neu aufgebaut. Offen (Nit): Animationsgruppen aus `instantiate()` werden nicht eigens freigegeben (Waffen-GLBs ohne Animation).
