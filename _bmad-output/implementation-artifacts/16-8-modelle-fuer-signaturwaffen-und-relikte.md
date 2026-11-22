# Story 16.8: Modelle für Signaturwaffen und Relikte

Status: review

## Story

Als Spieler
möchte ich Signaturwaffen und Relikte an ihrem eigenen Merkmal erkennen,
damit eine Trophäe nicht aussieht wie jede andere Waffe.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-16.md` Story 16.8 (Zeilen 126-138), Art Direction §4.7 („In der Waffenkammer“).

1. **Angenommen** die Signaturen der Leutnants und Gefährten von Akt 1 und 2, die Relikte in `content/core/items.yaml` und Story 16.7
   **Wenn** jede Signatur das v2-Modell ihrer Gruppe mit eigener Tönung, fester Rune und einem Merkmal bekommt (Entscheidung Produktinhaber 2026-11-21: Gruppenmodell + Merkmal) und das Item in `render.yaml` auf sein Modell zeigt
   **Dann** haben auch die Stücke ohne bisheriges Modell eins: `bounty`, `white_wolf`, `wasp_sting`, `magpie`, `final_curtain`, `pact_warden_shield`
2. Das Relikt `dragon_ember` („Drachenglut“) bekommt als Schmuckstück ein eigenes Modell.
3. Der Produktinhaber hat die Merkmale an **einem** Sammelbild aller Stücke abgenommen.
4. Brett, Figurenblatt, Waffenansicht und Waffenkammer zeigen dasselbe Modell (eine Quelle: `render.yaml`).

## Bestandsliste (14 Stücke: 12 Signaturen, 2 Relikte)

Quelle `content/core/items.yaml` (Akt 1 Zeilen 133-136, Gefährten 139-140, Relikte 145-150, `heirloom`/`final_curtain` 151-152, Akt 2 Zeilen 181-184); Leutnants `content/acts/act1/lieutenants.yaml` (`signatureItem`), `act2/lieutenants.yaml`. Akt-Inhalte liegen **nicht** in `content/acts/act*/items`: alle Items stehen in `content/core/items.yaml`. „Rune“ = Vorschlag, denn **es gibt noch keine feste Rune** an Items (`ItemInstance.runes`, `state.ts:12`; Feld `fixedRune` ist neu, T3) [ASSUMPTION: Rune folgt Effekt/Element des Items; Produktinhaber prüft am Sammelbild].

| id | Gruppe | Besitzer | Modell heute | feste Rune (Vorschlag) | Merkmal (Vorschlag) |
|---|---|---|---|---|---|
| `tinder` | axe | Hask (L1) | Gruppe `axe` | `fire_rune_2` (Brandwirkung 30 %, Element fire) | verkohlte Kerbe in der Schneide, Glutorange-Wicklung am Stiel (Signaturfarbe, §2.2/§ Unikate) |
| `bounty` | bow | Morra (L1) | keins (Armbrust, Bild fehlt als Modell) | `edge_rune` (Krit 15) | Armbrust: Querbogen + Schaft, Münzknauf am Ende |
| `wolf_fang` | lance | Ulvric (L1) | Gruppe `lance` | `wind_rune_2` (Skill wolf_run) | gebogener Wolfszahn als Lanzenspitze, Fellwicklung |
| `little_hands` | shield | Grosk (L1) | Gruppe `shield` | `earth_rune_2` (Skill renewal) | erhabene Kinderhand-Prägung im Buckelring |
| `rowenas_lance` | lance | Rowena (L2) | Gruppe `lance` (Bild `wing_lance`) | `wind_rune_3` | zwei kleine Flügelfinnen unter der Spitze |
| `wasp_sting` | bow | Brakka (L2) | keins (Armbrust, Bild `steel_bow`) | `precision_rune` (effektiv gegen Flieger/Gepanzerte) | Armbrust mit gelb-schwarz geringeltem Schaft, langer Stachelbolzen |
| `gold_hook` | sword | Grell (L2) | Gruppe `sword` | `water_rune_1` (Krit 20 %) | goldener Enterhaken als Parierstangen-Ende, Säbel-Krümmung |
| `dravns_oath` | sword | Sable (L2) | Gruppe `sword` | `dark_rune_1` (Skill last_order) | Eidband: schwarzes Tuch um die Parierstange, Siegelring im Knauf |
| `magpie` | dagger | Fenn (N1) | keins | `feather_rune` (Skill long_fingers) | Elsternkopf als Knauf, schwarz-weiße Wicklung |
| `white_wolf` | bow | Ilka (N4) | keins | `water_rune_2` (Nebel/Schnee) | weißer Wolfskopf am oberen Wurfarm, Silbertönung |
| `heirloom` | lance | Tobin (N3) | Gruppe `lance` | `light_rune_1` (Skill young_heroes) | eingravierte Familienmarke am Schaft, abgegriffene Wicklung |
| `final_curtain` | lute | Jory (N6) | keins | `light_rune_1` (Anfeuern) | karminroter Vorhangzipfel und Quaste am Wirbelkasten |
| `pact_warden_shield` (Relikt Akt 1) | shield | Konvoi (N2) | keins | `earth_rune_1..3` je Erwachungsstufe | Paktsiegel-Ring um den Buckel; Stufe 2/3 füllen die Rinne (Bilder `pact_warden_shield_1..3`) |
| `dragon_ember` (Relikt Akt 2) | accessory (Amulett) | Konvoi (N5) | keins | `fire_rune_1..2` je Stufe (Stufe 3 mit Akt 3) | **eigenes Schmuckmodell**: Drachenschuppen-Anhänger mit Glutstein in einer Fassung, Kette |

Hinweise: `heirloom` und `rowenas_lance` sind in der Epic-Zeile nicht einzeln genannt, aber Signaturen mit Item in Akt 1/2 und gehören zum Satz. Die Beispiele `wolf_fang`-Zahn und `gold_hook`-Haken stammen vom Produktinhaber. `ballista_bolt` ist ein Geländeobjekt und kein Stück (siehe 16.7). Leutnant Akt-1-Items `tinder` etc. haben keine `image`-Stufen; Relikte haben Stufenbilder (`stages` mit `image`, `items.yaml:145-150`).

## Tasks / Subtasks

- [ ] **T1 Sammelbild und Merkmale abstimmen (AC 3)**: aus der Tabelle ein Sammelbild-Entwurf (Skizzen der 14 Merkmale per ChatGPT, Prompt/Abnahme in `art/prompts/signature_weapons.md`) dem Produktinhaber vorlegen, bevor modelliert wird; Merkmale und Runen als Vorschlag, [ASSUMPTION]-Spalten sind seine Entscheidung
- [ ] **T2 Modelle bauen (AC 1, 2)**
  - [ ] T2.1 Ein Skript `tools/art/blender_weapon_signatures.py`: je Item Gruppenskript aus 16.6/16.7 per `exec` laden, Metallmesh um ein **Merkmalsmesh** ergänzen (Zahn, Flügelfinnen, Haken, Elsternkopf …) und Farben abwandeln; Ausgabe `art/models/weapons-v2/sig/<itemId>.glb`; Vertrag unverändert (Metallmesh nach dem Modell benannt mit `HC_Vertex`, `rune_channel` mit UV 1 `fill`, `rune_socket2`, Knoten `socket_rune_a*`/`_b*`, kein `rune_stone`)
  - [ ] T2.2 Merkmalsgeometrie mit dem Dreiecksbudget der Gruppe (rund 8 000, Budget 8 500); Merkmal liegt nie über Fassung oder Rinne (Stein muss in jede Waffe passen)
  - [ ] T2.3 **Eigene Tönung** je Signatur: Farbwerte im Skript aus `art/palette/hollow-64.hex`, Leutnant-Signaturen tragen die Fraktionsfarbe (§2.2, Art Direction Zeile ~331); die Metallstufe (`metal`) bleibt Pflichtfeld des Items, die Signaturtönung liegt darüber (Vertexfarben der Teile Wicklung/Zierrat, nicht des Metalls)
  - [ ] T2.4 Armbrust (`bounty`, `wasp_sting`): Querbogen am Gruppenmodell `bow`; Griffachse bleibt wie `bow` (links, `motion: shoot`) [ASSUMPTION: Armbrust nutzt Bogenhaltung, keine eigene Animation]; `white_wolf` ist ein echter Bogen
  - [ ] T2.5 `final_curtain`: Lautenmodell aus 16.7 + Vorhangzipfel; `pact_warden_shield`: Schildmodell aus 16.6 + Siegelring
  - [ ] T2.6 `dragon_ember` Schmuckstück (kein Griff): eigenes Skript-Teil mit Anhänger an Kette, Fassung und Rinne (kurzer Bogen um die Schuppe, `fill`), Knoten `socket_rune_a`; Rahmen: Ursprung Anhängermitte, Kette nach oben; **kein** Sockel an der Figur (Accessoire wird nur in Waffenansicht, Figurenblatt und Waffenkammer gezeigt, nicht am Brettmodell) [ASSUMPTION]
- [ ] **T3 Daten und Schema (AC 1, 4)**
  - [ ] T3.1 `content/core/render.yaml`: neuer Block `gear.items` (Schlüssel = Item-Id) mit `{ base: <Gruppe>, model: sig/<id>, hold?/hand?/motion? nur falls abweichend }`; `gearOf` (`src/render/board/boardUnits.ts:29-60`) sucht zuerst `gear.items[itemId]`, dann `gear.weapons[weaponType]`/`offHand[group]`; Schema `src/content/schemaRender.ts` (`gearPiece` Zeile 8, `gear` Zeile ~138) und Typ `src/core/defs.ts:~379` gemeinsam ändern; `content:check` prüft: Item-Id existiert, Datei existiert, Relikte/Signaturen **alle** abgedeckt
  - [ ] T3.2 `fixedRune` (Rune-Id oder Liste je Stufe für Relikte) am Item: `ItemDef` (`src/core/mapDefs.ts` ~151) und `src/content/schemaItems.ts` optional, Werte laut Tabelle; Slot belegt, nicht ausbaubar, im Verzauberer nicht überschreibbar (Regelwirkung ändert sich **nicht**: Rune sitzt nur als Darstellung; falls die Rune Regelwerte liefern soll, ist das eine Regelentscheidung → nachfragen, nicht still bauen) [ASSUMPTION: nur Darstellung]
  - [ ] T3.3 Relikt-Stufen: Stufe 1-3 bestimmt `tier` der angezeigten Rune und damit `fill` (Stufe = `stages` des Items, `items.yaml:145-150`); Auswahl der Stufe aus Kampagnenstand wie das Stufenbild
  - [ ] T3.4 Ladeplan `src/app/loading/plan.ts` (`gearModels`, Zeilen ~79-108) und Pipeline `tools/art/build.py` `build_models` (Ordner `sig/` mit kopieren); `plan.test.ts` ergänzen
- [ ] **T4 Eine Quelle für alle Ansichten (AC 4)**: Brett (`boardUnits.ts`), Figurenblatt (16.15), Waffenansicht (16.14), Waffenkammer (16.18) lesen **dieselbe** Funktion/Auflösung (`render.yaml` `gear.items`); keine zweite Tabelle in den Screens; Test: je Stück liefern die Auflösung für Brett und die Anzeige-Auflösung dieselbe Datei (reine Funktion in `src/render/shared/`, z. B. `modelFor(itemDef, gear)`)
- [ ] **T5 Abnahme (AC 3)**: ein Sammelbild aller 14 Stücke nebeneinander (je mit Rune-Stein auf Fassung, Rinne gefüllt) in `art/mockups/weapons-2026-11/signatures_v2_preview.png`, im Browser-Fenster zeigen; Produktinhaber nimmt Merkmale ab; Mängel in dieser Story nacharbeiten
- [ ] **T6 Prüfung/Doku**: Modell-Test (Knoten, UV1, Dreiecke) auf `sig/` erweitern; `pnpm check`; Eintrag ins `art-direction.md.decision-log.md` (Merkmale, feste Runen); Hinweis in `concept/21-gdd/items.md` nur falls die festen Runen Regelwirkung bekommen (dann Rückfrage)

## Dev Notes

### Vertrag und Vorarbeit

- Modellvertrag aus 16.6/16.7: Docstring `tools/art/blender_weapons_v2.py:1-37`, Kit `:227-285`; Laufzeit (`attachGear` `src/render/shared/models.ts:~219-262`, `runeGlow.ts`, `gear.rune` mit Elementfarben/`metals`) aus 16.6. Diese Story baut auf 16.6 **und** 16.7 auf (Gruppenmodelle `bow`, `dagger`, `book`, `lute` entstehen dort).
- Lösung „Item → Modell“ heute: nur nach Gruppe (`render.yaml:256-268`, `gearOf` in `boardUnits.ts:29-60`, `gearKey` ebenda `:56` für den Neubau). Pro-Item-Zuordnung gibt es nicht: neu (T3.1). `gearKey` muss die Item-Id enthalten, sonst bleibt beim Wechsel Signatur ↔ Standardwaffe das alte Modell.
- Stufenbilder der Relikte (2D) sind `image`-Felder, keine 3D-Modelle; die 3D-Stufe ist Rune-Tier (T3.3).

### Hinweise je Gruppe

- Bogen/Armbrust und Laute entstehen erst in 16.7; ohne sie ist T2.4/T2.5 blockiert (Reihenfolge einhalten).
- Schmuckstück: kein Griff, kein `hand`/`hold`/`motion`; die Waffenkammer (Ständer, Art Direction §4.7) und die Waffenansicht zeigen es drehbar; Figurenblatt/Brett zeigen kein Accessoire-Modell (Entscheidung in T2.6, beim Produktinhaber bestätigen).
- Signaturfarben: Fraktionsfarbe der Leutnants (§2.2), Brennas-Glutorange-Beispiel (Art Direction Zeile ~331); Gefährten-Signaturen tragen die Farbe ihrer Figur [ASSUMPTION].
- Bundle: 14 Dateien zu je rund 0.1 MB gzip = rund 1.4 MB; nur Stücke, die der Spieler besitzt oder ein Gegner trägt, laden (Plan), Waffenkammer lädt auf Anforderung. Erstdownload-Budget 12 MB (`content/packs.yaml:15,37`), `tools/check-bundle-size.mjs` ausführen.
- Keine Regeländerung, kein Speicherformat (`SAVE_FORMAT` `src/persistence/save.ts:11`), Replays unberührt; `fixedRune` nur anzeigen, bis anders entschieden.
- Offene Punkte nicht still entscheiden: Rune-Zuordnung, Armbrust-Haltung, Schmuckstück am Brett → gebündelt per Fragetool an den Produktinhaber.

### Project Context Rules (AGENTS.md)

- Werte in `render.yaml`/Content-YAML, kein Text im Code, Zod + Typ gemeinsam, Commits Englisch, Doku Deutsch; `pnpm check` grün; Bilder per ChatGPT (Prompt in `art/prompts/`), 3D per Blender, nie Tripo für Waffen; GLB/PNG in Git LFS (`git lfs pull`); Sprint-Status nicht ändern.

### References

- [Source: concept/26-epics/epics/epic-16.md#Story 16.8] · [art-direction.md §2.2, §4.7, Unikate Zeile ~331]
- `_bmad-output/implementation-artifacts/16-6-…md`, `16-7-runenwaffen-v2-fuer-alle-uebrigen-waffengruppen.md`; Folge: 16.14 (Waffenansicht), 16.15 (Figurenblatt), 16.18 (Waffenkammer)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Completion Notes (Nachtlauf 2026-11-22)

- 14 Stücke unter `art/models/weapons-v2/sig/` (Skript `tools/art/blender_weapon_signatures.py`), Sammelbild `s4-16-8-sammelbild.png` im Notizordner des Nachtlaufs; ohne ChatGPT-Skizzen (nicht erreichbar) [ASSUMPTION].
- `render.yaml` `gear.items`, Auflöser `src/render/shared/gearModel.ts` (`modelFor`, `fixedRuneOf`) für Brett und spätere Screens; `fixedRune` nur Darstellung [ASSUMPTION].
- `sig/` lädt bei Bedarf, nicht im Erstdownload (14,46 MB statt 15,68 MB).
- `pnpm check` grün. Abnahme der Merkmale durch den Produktinhaber offen.
