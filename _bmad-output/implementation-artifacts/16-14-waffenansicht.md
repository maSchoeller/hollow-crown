# Story 16.14: Waffenansicht

Status: review

## Story

Als Spieler
möchte ich eine Waffe groß und drehbar mit Rune, Werten und Chronik ansehen,
damit ich meine Ausrüstung kenne.

## Acceptance Criteria

(Stand 2026-11-22: 16.4 (PR #236), 16.5 (#237), 16.6 (#239), 16.12 (#240) und 16.13 (#238) sind auf `main`; die Story ist darauf angepasst, die Annahmen A1, A5 und A7 unten sind korrigiert. Quelle: Epic 16, Story 16.14; EXPERIENCE „Waffenansicht“, „Änderungsliste“, „Verzauberer (Werkbank)“; DESIGN `workbench-stage`, `rune-gem`, `change-list`; Art Direction §4.5, §4.7; FR67, UX-DR34, UX-DR35, AR26. Maßgeblich ist der Planungsstand 2026-11-21.)

1. **Gemeinsame 3D-Item-Bühne `ItemStage`.** Ein Modul `src/render/items/itemStage.ts` (Klasse `ItemStageView implements HostedView, ItemStage`, `RenderHost.activate`) zeigt ein Item als Modell auf der Szene des Hosts: `show(path, runes: GearRunes)`, `setRunes(runes, { grow })`, `reset()`, `dispose()`. Es ist der Baustein für Waffenansicht (diese Story), Verzauberer (16.16) und Waffenkammer (16.18); die API ist vollständig typkommentiert und stabil (Dev Notes „Vertrag der Bühne“). Der reine Teil (Drehung, Auslauf, Einpassen, Aufrichten) liegt in `src/render/items/stageMath.ts` und ist ohne WebGL getestet.
   - Modell **drehbar per Ziehen** (Pointer-Ereignisse auf dem Canvas-Slot: Gier horizontal, Neigung vertikal begrenzt auf ±69° = ±1,2 rad, `touch-action: none`), langsamer Eigendrehgang, bis der Spieler zieht; Auslaufen mit Dämpfung; Doppeltippen setzt die Ansicht zurück (kürzester Weg).
   - **Rune in der Fassung, Leuchten, Rinne nach Stufe: die Bausteine von 16.6, keine zweite Implementierung.** Die Bühne zieht das Modell mit `store.container`, kleidet es mit `dressRuneWeapon` (Rinne `rune_channel` mit UV1 `fill`, Steine `runes-v2/<runeId>.glb` an `socket_rune_a*`/`socket_rune_b`, Metalltönung) und setzt den `RuneKit` auf Zustand `full`. Rinnen-Füllung (I ein Drittel, II zwei Drittel, III ganz mit Puls), Farben und Puls kommen aus `render.yaml` `gear.rune`; das Laden der Steine ist aus `attachGear` als `stoneLoader` in `models.ts` herausgezogen und wird von Brett und Bühne gleich benutzt. Wechsel der Rune lässt den Stein aufwachsen (`itemStage.growMs`).
   - **Ressourcen:** Modelle und Steine nur über `host.store(this)` (geteilter Asset-Cache, AR12; ein vom Brett geladenes Modell wird nicht doppelt geladen); `dispose()` gibt alles frei (`host.release`, Lichter, Kamera, Materialien, Pointer-Listener, Canvas aus dem Slot); danach läuft keine Bildraten-Schleife weiter.
   - **Rendern nur bei Bedarf:** `busy()` ist wahr bei Eingabe, Auslauf, Rückfahrt, Eigendrehgang, Wachstum und Stufe III (Puls); sonst fällt die Bühne auf `fpsIdle`.
2. **Waffenansicht als Vollbild-Overlay.** Neue Komponente `WeaponView` (`src/app/screens/WeaponView.tsx`, `WeaponView.css` daneben), geöffnet als Screen `{ name: 'weapon'; item: string; unit?: string; back: Screen }` (Muster von `options`/`handbook`): 
   - **Kopf:** Name (Beiname der Chronik nach dem Namen, falls vorhanden), Seltenheit (Pille, Farbe nach Seltenheit) und runder Schließen-Stein (Zurück zum Screen `back`, Android-Zurück ebenso).
   - **Bühne** (DESIGN `workbench-stage`: warmer dunkler Grund, nur hier radial; oben rechts die Fassungen als `rune-gem`, groß/klein beschriftet, gewählte mit Glutrand; unten links Hinweis „ziehen dreht“) füllt den oberen Teil; Tippen auf eine Fassung zeigt die dort sitzende Rune (Stein + Rinne), kein Probe-Modus (der gehört dem Verzauberer, 16.16).
   - **Werte** als Symbol + Zahl (Angriff, Treffer, Krit, Reichweite, Gewicht, bei Schilden Verteidigung usw.): die `state`-Liste `changeList(data, unit, null, { slot, base: item })`, also dieselben Formeln und Symbole wie überall, keine Eigenrechnung.
   - **Rune als Änderungsliste „gegenüber ohne Rune“:** `<ChangeList result={changeList(data, unit, itemMitRune, { base: itemOhneRune, slot })} />` (`ChangeList` aus `src/ui/ChangeList.tsx`, Icons aus `icons.tsx`); ohne Rune oder ohne Änderung steht dort „keine Rune“ bzw. „keine Änderung“ (Locale). Für Waffen ohne Träger (Konvoi/Waffenkammer) rechnet die Liste für die Figur aus `unit` des Screens, sonst die erste der Truppe (siehe [ASSUMPTION] A5).
   - **Chronik-Zeile:** „Kills · Beiname“ (Locale `ui.weaponView.kills`, Trenner `ui.weaponView.sep`; Teile entfallen, wenn leer; ohne beides und für Waffen ohne Chronik (`chronicleKey` leer: Schilde, feste Waffen) entfällt die Zeile). Gelesen wird direkt `inst.kills` und `inst.epithet` (16.5), der Beiname über `epithetText` aus `src/core/rules/chronicle.ts`; die Namen holt `nameOfId` aus dem Truppenstand. Eine **Herkunft** gibt es am Item nicht (16.5 speichert keine), die Zeile hat sie deshalb nicht [ASSUMPTION A1]. Der Beiname steht zusätzlich im Kopf hinter dem Namen.
   - **Tasten:** „Verzaubern“ öffnet den Verzauberer für diese Waffe, „Aufwerten“ den Schmied für diese Waffe (siehe AC 5); „Verzaubern“ ist nur sichtbar, wenn die Waffe Runenplätze hat (`runeSlotCount > 0`), „Aufwerten“ nur, wenn `upgradable`. Ist der Raum noch nicht gebaut oder gesperrt, ist die Taste gedimmt und nennt den Grund (Muster der Raum-Stein-Logik in `roomStone.tsx`).
3. **Stücke ohne 3D-Modell** (Rüstung, Accessoires, Verbrauchsgüter, Waffengruppen ohne v2-Modell): die Bühne wird **nicht** aktiviert (kein Canvas, kein Babylon-Import); statt dessen zeigt der gleiche Rahmen das Item-Bild (`ItemImage`, groß, mittig auf dem warmen Grund) ohne „ziehen dreht“. Werte, Änderungsliste (bei Rüstung mit „Feuer-Treffer gegen dich ×0,8“) und Chronik/Herkunft bleiben, „Verzaubern“/„Aufwerten“ nach Möglichkeit wie in AC 2. Fehlschlag beim Laden des Modells (`container` liefert `null`) fällt auf dasselbe Bild zurück (Test).
4. **Schließen und Ressourcen.** Schließen (Stein, Zurück-Geste, Wechsel des Screens) ruft `dispose()` der Bühne; danach hält der Host keinen Verweis mehr auf das Modell dieser Ansicht (`refs(key)` zurück auf Anfangswert; Test mit `RefCache`), der Canvas ist aus dem Slot entfernt, der Speicher wächst bei zehnmal Öffnen/Schließen nicht (Dev-Messung in den Debug Notes).
5. **Einstiege und Sprünge.**
   - Einstieg **vorerst aus dem bestehenden Figurenblatt/Equip-Screen**: in `Equip.tsx` (Haupt-/Nebenhand, gewähltes oder getragenes Stück) und `Troop.tsx` (eine Taste je Waffe/Schild unter den Plätzen) eine Taste „Waffe ansehen“ (Linien-Icon `eye`, neu in `icons.tsx`), die `openWeapon(uid, { unit })` aufruft; `back` ist das Figurenblatt der Figur (`troop` mit `unit`). 16.15 ersetzt den Auslöser im neuen Figurenblatt und ruft denselben Screen; 16.18 ruft ihn aus der Waffenkammer. Der Einstieg ist darum **ein** Aufruf `openWeapon(item, back)` in `src/app/state/screen.ts`-Nähe (Hilfsfunktion in `src/app/state/weaponView.ts`, kein Barrel; die Logik ohne Zeichnen in `src/app/screens/weaponViewModel.ts`, wegen der Groß-/Kleinschreibung des Dateisystems nicht `weaponView.ts` neben `WeaponView.tsx`).
   - „Verzaubern“ setzt `{ name: 'camp', tab: 'enchanter', unit?, item: uid }`, „Aufwerten“ `{ name: 'camp', tab: 'smith', unit?, item: uid }`. `Screen` bekommt dafür das Feld `item?: string` bei `camp`; `Camp` reicht es als `item` an `Room` weiter; `SmithRoom` und `EnchanterRoom` in `Rooms.tsx` starten mit `useState(item ?? null)` (heute `null`). Zurück aus dem Raum führt über die bestehende Raumschließung; der Rücksprung zur Waffenansicht ist nicht nötig. [ASSUMPTION A6]
6. **Texte.** Alle sichtbaren Texte als Schlüssel `ui.weaponView.*` in `content/core/locales/de.yaml` und `en.yaml` (Titel, Schließen, „ziehen dreht“, „Fassung groß/klein“, „keine Rune“, „keine Änderung“, Chronik-Format, „Verzaubern“, „Aufwerten“, Gründe für gedimmte Tasten, `aria`-Beschriftungen für Bühne und Fassungen); kein sichtbarer Text im Code, keine Emojis.
7. **Styles.** Eigene Datei `src/app/screens/WeaponView.css` (Tokens aus `tokens.css`, keine harten Schatten); die Bühnen-Rahmen-Styles (`workbench-stage`) in `src/app/screens/ItemStageFrame.css` neben einer kleinen Preact-Hülle `ItemStageFrame` (`src/app/screens/ItemStageFrame.tsx`), damit der Verzauberer sie wiederverwendet; `styles.css` wächst nicht. [Ort geändert: `src/ui` darf `render` nicht importieren (Ebenenregel, ESLint), die Hülle lädt die Bühne und liegt deshalb neben `Castle3d.tsx` in `src/app/screens/`.]
8. **Paket-Budget und Laden.** Babylon-Code der Bühne kommt über **dynamischen Import** (`import('../../render/items/itemStage')`, Muster `Castle3d.tsx`), nie in den ersten Download; `pnpm build` mit `check-bundle-size.mjs` bleibt unter dem Budget (Zahl vorher/nachher in den Completion Notes). Die Modelle `weapons-v2/*.glb` und `runes-v2/*.glb` gehören in das Paket der Waffenmodelle (Eintrag in `content/packs.yaml`/`plan.ts` nach 16.6); die Bühne lädt sie nur bei Bedarf und zeigt bis dahin das Item-Bild.
9. **Beleg.** Bei 375 × 812 als Bild belegt (mit dem Mockup `verzauberer.html` Bühnenteil und `truppe.html` daneben): Axt mit Rune Stufe I/II/III (Rinne), Schild, ein Stück ohne Modell (Rüstung); Spielsound dabei auf 0. Dev-Aufruf: `__hc.devWeapon(itemId?, runeId?, smallRuneId?)` (`src/app/state/devHooks.ts`; Standard: Hammer mit `fire_rune_2` und `edge_rune`, zwölf Kills, Beiname; ungespeicherte Kampagne). Der Bildbeleg steht beim Produktinhaber aus (kein Dev-Server in dieser Session).
10. **Tests und Abschluss.** Siehe Testanforderungen; `pnpm check` grün (lint, test, content:check, build inkl. Bundle-Budget); Coverage von `src/core` nicht gesenkt; kein `content:lock`.

## Tasks / Subtasks

- [x] Task 1: Abhängigkeits-Check (vor allem anderen)
  - [x] 1.1 `git fetch origin`; prüfen, ob 16.5 (`ItemInstance.kills`/`epithet`), 16.6 (`art/models/weapons-v2/`, `render.yaml` Einträge) und 16.13 (`changeList`, `ChangeList`, Icons) auf dem Arbeitszweig liegen; Stand in den Completion Notes festhalten
  - [x] 1.2 16.5 ist gemergt: kein Adapter, `chronicleLine` liest `inst.kills`/`inst.epithet` direkt
  - [x] 1.3 16.6 ist gemergt: Bühne baut auf `dressRuneWeapon`/`RuneKit`/`gear.rune`; Gruppen ohne v2-Modell fallen auf das Bild zurück
- [x] Task 2: Bühne (AC 1, 4, 8)
  - [x] 2.1 `src/render/items/itemStage.ts`: HostedView, Kamera (Fit nach Bounding-Box, `fov` aus `render.yaml`), Lichter (Warm, Rand), Drehsteuerung, Auslauf, Doppeltipp-Reset
  - [x] 2.2 Fassung, Stein, Rinne und Leuchten über die Bausteine von 16.6; Wachstum der Steine
  - [x] 2.3 `dispose()` und Cache-Haltung über `host.store(this)`; Test für Freigabe
  - [x] 2.4 `render.yaml`: Abschnitt `itemStage` (Blickwinkel, Drehung, Dämpfung, `growMs`, Pose je Modell, Lichter) mit Zod-Schema in `src/content/schemaRender.ts`
- [x] Task 3: Oberfläche (AC 2, 3, 6, 7)
  - [x] 3.1 `ItemStageFrame` (Hülle mit Slot, Hinweis, Fassungen als `rune-gem`; Fallback-Bild)
  - [x] 3.2 `WeaponView.tsx` und `.css`: Kopf, Bühne, Werte, Änderungsliste, Chronik-Zeile, Tasten
  - [x] 3.3 Locale-Schlüssel DE/EN
- [x] Task 4: Einstiege und Sprünge (AC 5)
  - [x] 4.1 `Screen`-Variante `weapon`, `camp.item`; Routing in `App`/Screen-Weiche
  - [x] 4.2 „Waffe ansehen“ in `Equip.tsx` und `Troop.tsx`
  - [x] 4.3 `SmithRoom`/`EnchanterRoom` mit Vorauswahl (Ausschnitt um `useState<string | null>(null)`, Rooms.tsx nur im Ausschnitt lesen)
- [x] Task 5: Tests, Beleg, Abschluss (AC 9, 10)
  - [x] 5.1 Tests (unten); der Bildbeleg bei 375 × 812 mit Mockup daneben steht aus (kein Dev-Server in dieser Session)
  - [x] 5.2 `pnpm check` grün, Bundle-Zahl notieren

## Dev Notes

### Ist-Zustand (gelesen)

- **Render-Host** (`src/render/host.ts`): ein `Engine`, ein Canvas (`hc-stage`), **eine** aktive Szene (`activate(view)` entsorgt die vorige; `HostedView`: `busy/frame/resize/dispose`). `host.store(holder)` liefert `AssetStore` (`container(path, materials?)` über `RefCache`, geteilt; `texture`, `vat`, `materials`). `mount(slot)` hängt das Canvas in ein leeres Element (`.hc-stage-slot`), in das Preact nie rendert. Muster zum Nachbauen: `src/app/screens/Castle3d.tsx` (dynamischer Import, `ready`-Zustand, Fallback-Bild bis zum Aufbau).
  - **Folge:** Weil nur eine Szene lebt, darf die Waffenansicht nicht über einer lebenden Brett-/Burgszene liegen; als eigener Screen (`weapon`) mit `back` ersetzt sie den vorigen Screen (Muster `options`, `handbook`). Kehrt der Spieler zurück, baut der vorige Screen seine Szene selbst neu auf (die Modelle bleiben im Cache). Das ist für Figurenblatt (HTML, 16.15 später mit eigener Bühne) und Waffenkammer (16.18, eigene Szene) zu beachten: **16.15 und 16.18 stellen sicher, dass nie zwei Szenen gleichzeitig aktiv sind.**
- **Modelle laden** (`src/render/shared/models.ts`, 26 KB, nur Ausschnitte gelesen): `loadContainer(scene, path, materials)` lädt GLB in einen `AssetContainer` (`removeAllFromScene`); `instantiate()` kopiert Modelle in die Szene und entfernt Container-Materialien wieder aus der Szenenliste (sonst löscht der Host sie beim Wechsel). `loadStaticMesh(store, path, name, material)` lädt eine Datei als ein statisches Mesh (Muster für Waffen allein). Bisherige Waffen: `art/models/weapons/{axe,sword,lance,shield,…}.glb`, an Hand-Sockets der Figuren (`socket_r`/`socket_l`), geplant über `src/app/loading/plan.ts` (`gearModels`, `weaponModels`).
  - Die Bühne nutzt **eigene Materialien** (Rinne mit `fill`-Leuchten) statt der glTF-Materialien (`skipMaterials` wie auf dem Brett) und bleibt in der Gammaraum-Schattierung des Bretts, damit Waffe und Stein so aussehen wie dort.
- **Item-Details heute:** `src/ui/ItemSheet.tsx` (`ItemSheet`, `ItemInfoButton`, Long-Press) mit `itemInfo(data, inst, shownRelics)` aus `src/ui/itemInfo.ts` (Typ, Beschreibung, Fakten, Wirkungen, Seltenheit, Relikt). **Wiederverwenden** (`itemInfo`, `rarityOf`, `itemName`, `ItemImage`), nichts doppeln. `Equip.tsx` (Wechsel-Screen, `Deltas`/`equipPreview`, nach 16.13 `changeList`) und `Troop.tsx` (`EquipView`, Plätze mit `ItemImage`) sind die heutigen Einstiege.
- **Räume** (`src/app/screens/Rooms.tsx`, über 25 KB, nur Ausschnitt): `SmithRoom` (Z. ~411, `const [sel, setSel] = useState<string | null>(null)`, wählt Items nach `upgradable`) und `EnchanterRoom` (Z. ~771, gleiches Muster, `runeSlotCount`, `locateItem`, `insertRune`). Raum-IDs aus `content/core/rooms.yaml`: `smith` (ab Akt 1), `enchanter` (ab Akt 2, nur Burg). `Camp` bekommt `tab`/`unit` und reicht `unit` an den Raum; `item` kommt neu dazu.
- **Navigation:** `src/app/state/screen.ts` (Blattmodul, `Screen`-Union, `signal`); Varianten mit `back: Screen` für Vollbilder existieren (`options`, `handbook`, `licenses`).
- **Runen:** `content/core/runes.yaml` (`element`, `tier`, `price`, `image`, optional `terrainOnHit`, `statusOnHit`), `ItemInstance.runes: Array<string | null>`. v2-Modelle `art/models/runes-v2/<id>.glb` (20 Steine; z. B. `fire_rune_1`, `edge_rune`, `feather_rune`, `force_rune`).
- **Baustellen-Stand (2026-11-22):** 16.4, 16.5, 16.6, 16.12 und 16.13 sind auf `main`; die v2-Modelle (`weapons-v2/{axe,sword,lance,shield}.glb`, 20 Steine in `runes-v2/`) liegen im Zweig (nach `git lfs pull`). `ItemInstance` trägt `kills`, `killsBy`, `epithet` (16.5), `changeList` und `ChangeList` stehen (16.13), `Overlays.glow`, `runeGlow.ts`, `runeLook.ts` und `render.yaml` `gear.rune` stehen (16.6).

### Vertrag der Bühne (für 16.15/16.16/16.18 stabil halten)

```ts
interface ItemStage {
  /** lädt die Modelldatei (`models/…glb`) und kleidet sie mit den Runen; false, wenn die Datei fehlt – die Hülle zeigt dann das Item-Bild */
  show(path: string, runes: GearRunes): Promise<boolean>;
  /** tauscht die Runen in den Fassungen; `grow` lässt einen neuen Stein aufwachsen */
  setRunes(runes: GearRunes, opts?: { grow?: boolean }): Promise<void>;
  /** Kamera/Drehung zurück auf die Anfangsansicht (auch Doppeltippen) */
  reset(): void;
  dispose(): void;
}
```

`GearRunes` kommt aus `gearRunesOf(data.runes, inst.runes, runeSlotCount, metal)` (16.6, `stageRunes` in `weaponViewModel.ts`). Die Preact-Hülle `ItemStageFrame` (`src/app/screens/ItemStageFrame.tsx`) lädt die Bühne per dynamischem Import und zeigt bis dahin, ohne Modell oder bei Fehlschlag das Item-Bild; sie setzt `setRunes(…, { grow: true })`, wenn sich der Runenschlüssel ändert (so setzt 16.16 „Probe“ und Verschmelzen später an). Die Bühne **kennt weder Spielstand noch Kernregeln**; die Auflösung Item → Modellpfad (`weaponStageModel`) liegt in `src/app/screens/weaponViewModel.ts`, nicht im Render-Modul. Die Pose je Modell (Gier, `upright`) und alle Zahlen stehen in `render.yaml` `itemStage`.

### Fassungs-Anker und Dateien (zu prüfen am Material)

- Waffen v2: `axe`, `sword`, `shield`, `lance` unter `art/models/weapons-v2/`; Fassung nach Art Direction §4.7 (Axt: Blatt am Stiel, Schwert: Parierstange, Schild: Buckel, Lanze: Tülle). Anker und UV sind in den GLBs vorhanden (`rune_channel` mit `TEXCOORD_1`, Knoten `socket_rune_a*`/`socket_rune_b`, Mesh `rune_socket2`); die Bühne braucht sie nicht zu kennen, `dressRuneWeapon` (16.6) findet sie über die Namen.
- Alle anderen Waffengruppen (Bogen, Dolch, Stab, Buch, Laute) haben bis 16.7 **kein** v2-Modell: sie fallen nach AC 3 auf das Item-Bild zurück. Nicht die alten Modelle (`models/weapons/*.glb`) auf der Bühne zeigen, außer sie tragen eine Fassung: Entscheidung dazu siehe A3.
- PNG und GLB unter `art/` liegen in Git LFS: vor Bildbeleg und `pnpm art:build` `git lfs pull`.

### Entscheidungen (Annahmen)

- [ASSUMPTION A1] **16.5/16.6 sind gemergt (korrigiert).** Die Chronik-Zeile liest `inst.kills`/`inst.epithet`/`epithetText` direkt (kein Adapter), die Bühne nutzt `dressRuneWeapon`, `RuneKit` und `gear.rune`. Eine Herkunft am Item gibt es nicht; die Chronik-Zeile zeigt Kills und Beiname, keine Herkunft (Empfehlung: Herkunft erst zeigen, wenn ein Feld sie trägt).
- [ASSUMPTION A2] **Bühne als eigene `HostedView`**, nicht als Teil der Brett-Szene; dynamisch geladen. Ein Canvas, eine aktive Szene (AR12); Overlay = eigener Screen mit `back`.
- [ASSUMPTION A3] **Nur Modelle mit Fassung** (v2) kommen auf die Bühne; das Bild-Fallback gilt auch für Waffengruppen ohne v2 (bis 16.7) und für alte Modelle. Wird 16.7 gemergt, kommen sie ohne Änderung der Bühne dazu (nur `render.yaml`/Pfadauflösung).
- [ASSUMPTION A4] **Keine Probe in der Waffenansicht**: die Ansicht zeigt den Ist-Zustand; Probe und Tausch gehören dem Verzauberer (16.16). Tippen auf eine Fassung wechselt nur die Anzeige zwischen großer und kleiner Fassung.
- [ASSUMPTION A5] **Änderungsliste ohne Träger:** `changeList` rechnet für eine Figur; die Ansicht nimmt die per `unit` übergebene Figur (Figurenblatt), sonst den Träger, sonst die erste der Truppe. Ein Zusatz „für {Name}“ an der Überschrift „Werte“ nennt sie. Eine neutrale Referenzfigur der Kernfunktion gibt es nicht (`changeList` hat keine); die Annahme aus dem Entwurf entfällt.
- [ASSUMPTION A6] **Sprung in Räume mit Vorauswahl über `Screen`-Feld `item`**, nicht über einen globalen Signal-Zustand; die Räume bleiben sonst unverändert. Zurück aus dem Raum geht zur Burg/Lager, nicht zurück zur Waffenansicht (spart `back`-Ketten).
- [ASSUMPTION A7] **Seltenheit** zeigt `rarityOf` (inkl. „Relikt“) als Pille mit den Farben des Item-Blatts; die Relikt-Stufe steht nicht in der Ansicht (sie bleibt im Item-Blatt).
- [ASSUMPTION A10] **Tippen auf eine Fassung** wählt nur die Anzeige (Rahmen mit Glutrand und die Zeile „Große Fassung: Feuerrune, Stufe II“ über den Werten); die Bühne bewegt sich dabei nicht, beide Steine sind ohnehin zu sehen.
- [ASSUMPTION A11] **Lage der Modelle** (Gier je Modell, Lanze aufgerichtet) steht in `render.yaml` `itemStage.models` und ist **ohne Sichtprüfung gesetzt** (kein Dev-Server in dieser Session): Schwert 0°, Axt 90°, Lanze 90° + automatisch aufgerichtet, Schild −90°. Beim Bildbeleg ggf. nur diese Zahlen nachziehen.
- [ASSUMPTION A12] **`itemStage` steht auf oberster Ebene von `render.yaml`**, nicht unter `look`: es ist keine Zeit-/Wetter-Beleuchtung, und die Rinnen-Werte kommen ohnehin aus `gear.rune` (keine Doppelung der Füllstufen).
- [ASSUMPTION A13] **Zurück:** Schließen-Stein und Escape führen auf `back`; eine eigene Android-Zurück-Geste gibt es im Projekt für keinen Screen, sie kommt dazu, wenn sie allgemein eingeführt wird.
- [ASSUMPTION A8] **Kein neues Speicherformat, keine neuen Spielwerte.** Alle Zahlen der Bühne (Zoom, Dämpfung, `growMs`, Füllstufen) in `render.yaml`; Bildraten über `board.fpsIdle`/`fpsActive`.
- [ASSUMPTION A9] **Barrierefreiheit:** Bühne hat `role="img"` mit Beschreibung („{Name}, Rune {Rune}, Stufe {n}“); Ziehen ist optional, kein Inhalt hängt davon ab; Tasten mit sichtbarem Fokus.

### Projektregeln (AGENTS.md)

- `src/core` unberührt, solange nur gelesen wird; kein `Math.random`/`Date.now`; Stufe→Füllwert nicht im Kern, sondern aus `render.yaml`.
- Kein sichtbarer Text im Code; Beträge als Symbol + Zahl; Code und Bezeichner Englisch; neue Symbole nur als Linien-Icons in `src/ui/icons.tsx`.
- App-Zustand in `src/app/state/` ein Modul je Verantwortung, kein Barrel, keine Zyklen (`screen.ts` bleibt Blattmodul, `weaponView.ts` importiert es, nie umgekehrt).
- Styles je Screen in eigener CSS-Datei neben der Komponente; `styles.css` wächst nicht.
- Fertig erst mit `pnpm check` grün; kein `content:lock`; PR gegen `main`, nie direkt auf `main`.
- Große Dateien nur im Ausschnitt lesen: `models.ts`, `Rooms.tsx`, `BattleHud.tsx`, `architecture.md`.

### Zu ändernde Dateien (geplant)

NEU: `src/render/items/itemStage.ts`, `src/app/screens/ItemStageFrame.tsx`, `src/app/screens/ItemStageFrame.css`, `src/app/screens/WeaponView.tsx`, `WeaponView.css`, `weaponView.ts` (Chronik-Adapter, Modellauflösung), `src/app/state/weaponView.ts` (`openWeapon`), Tests (unten).
ÄNDERN: `src/app/state/screen.ts` (`weapon`, `camp.item`), `src/app/screens/Camp.tsx` (`item` durchreichen), `Rooms.tsx` (`SmithRoom`, `EnchanterRoom` Vorauswahl), `Equip.tsx`/`Troop.tsx` („Waffe ansehen“), Screen-Weiche in `App`, `src/ui/icons.tsx` (`eye`), `content/core/render.yaml` + Schema, Locales DE/EN, ggf. `content/packs.yaml`/`src/app/loading/plan.ts` (Modellpaket).

## Testanforderungen

Umgesetzt in `tests/unit/weapon-view.test.ts` (15 Tests, ohne WebGL: der Host braucht eine echte Engine, deshalb der reine Teil und das Cache-Verhalten getrennt):

- **Bühne (`stageMath`):** Eigendrehgang bis zum Ziehen, Ziehen/Neigungsgrenze/Auslauf bis `busy() === false`, Rückfahrt auf kürzestem Weg, Einpassen in das engere Sichtfeld, Aufrichten einer schrägen Längsachse.
- **Cache-Haltung:** zwei Halter auf dieselbe Datei laden einmal; `release(halter)` senkt `refs`, der andere Halter behält sie (das ist, was `dispose()` der Bühne über `host.release` tut).
- **`weaponStageModel`:** Axt, Schwert, Schild → v2-Pfad (Datei existiert); Rüstung, Verbrauchsgut, Bogen → `null`.
- **Werte und Runenänderung:** Werte = `weaponProfile`; Änderung „gegenüber ohne Rune“ = Element neu und Differenz der Krit-Werte aus `weaponProfile` mit/ohne Rune; ohne Rune leer.
- **Chronik-Zeile:** DE/EN, Teile entfallen, Schilde ohne Chronik ohne Zeile.
- **Tasten/Räume:** `viewKeys`, `roomAccess` (Burg mit Verzauberer, Lager ohne).
- **Locales:** alle `ui.weaponView.*` in DE und EN, keine Emojis.
- **Nicht automatisiert:** Komponentensicht, Raum-Vorauswahl, Bundle-Chunk (`pnpm build` ist grün und hält das Budget), Bildbeleg bei 375 × 812.

## Abhängigkeiten und Reihenfolge

- Epic-Reihenfolge: nach 16.5, 16.6 und 16.13; ein Merge-Zwang besteht für die Bauschritte nicht (siehe Task 1, Adapter und `origin/main`-Modelle). Danach 16.15 (Figurenblatt ruft `openWeapon`), 16.16 (Verzauberer nutzt `ItemStage`), 16.17 (Händler nutzt `ChangeList`), 16.18 (Waffenkammer ruft dieselbe Ansicht).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Sub-Session der Staffel-3-Screens)

### Debug Log References

- Gezielt `pnpm vitest run tests/unit/weapon-view.test.ts` (15 Tests grün); `pnpm check` siehe Completion Notes.
- GLB-Prüfung per Skript: Axt und Schwert lang entlang Y, die Schildfläche zeigt nach +X, die Lanze ist im Griff schräg (Y/Z) gebaut; deshalb `upright` und Gier je Modell in `render.yaml`.
- Dateinamen-Falle: `weaponView.ts` neben `WeaponView.tsx` kollidiert auf Windows (TS1261); die Logik heißt `weaponViewModel.ts`.

### Completion Notes List

- Bühne `ItemStageView` (HostedView) und Hülle `ItemStageFrame` (dynamischer Import, Item-Bild bis zur Bereitschaft, ohne Modell oder bei Fehlschlag), Waffenansicht `WeaponView` als Screen `weapon`, Einstiege in `Equip.tsx` und `Troop.tsx`, Sprünge „Verzaubern“/„Aufwerten“ (`camp` mit `item`, `SmithRoom`/`EnchanterRoom` starten mit der Auswahl), Dev-Hook `__hc.devWeapon`.
- Nicht geprüft (kein Dev-Server): Sicht, Lage der Modelle, Bühnenlicht, Layout bei 375 × 812; der Bildbeleg steht aus. Kein Test für die Raum-Vorauswahl (Rooms.tsx hat keine Komponententests; die Änderung ist `useState(item ?? null)`).

### File List

NEU: `src/render/items/itemStage.ts`, `src/render/items/stageMath.ts`, `src/app/screens/ItemStageFrame.tsx`, `src/app/screens/ItemStageFrame.css`, `src/app/screens/WeaponView.tsx`, `src/app/screens/WeaponView.css`, `src/app/screens/weaponViewModel.ts`, `src/app/state/weaponView.ts`, `tests/unit/weapon-view.test.ts`.
GEÄNDERT: `src/render/shared/models.ts` (`instantiate` exportiert, `stoneLoader` aus `attachGear`), `src/app/state/screen.ts` (`weapon`, `camp.item`), `src/app/App.tsx`, `src/app/screens/Camp.tsx`, `src/app/screens/Rooms.tsx` (`item` an Schmied und Verzauberer), `src/app/screens/Equip.tsx`, `src/app/screens/Troop.tsx`, `src/app/state/devHooks.ts` (`devWeapon`), `src/ui/icons.tsx` (`eye`), `content/core/render.yaml`, `src/content/schemaRender.ts`, `src/core/renderDefs.ts` (`itemStage`), `content/core/locales/de.yaml`, `en.yaml` (`ui.weaponView.*`), `_bmad-output/implementation-artifacts/sprint-status.yaml`.
