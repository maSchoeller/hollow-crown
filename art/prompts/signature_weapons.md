# Signaturwaffen und Relikte (Story 16.8)

Stand 2026-11-22. Skript `tools/art/blender_weapon_signatures.py`, Ausgabe `art/models/weapons-v2/sig/<itemId>.glb`.
Sammelbild: `blender -b --factory-startup --python tools/art/blender_weapons_v2_sheet.py -- --set=sig` (Rune je Stück laut Tabelle, Stein in der Hauptfassung).

## Stand der Abnahme

- Keine ChatGPT-Skizzen (T1): ChatGPT war in dieser Nacht nicht erreichbar. Die Merkmale wurden direkt aus der Tabelle der Story in Blender gebaut. [ASSUMPTION]
- Abnahme durch den Produktinhaber **offen** (AC 3): ein Sammelbild aller 14 Stücke, Merkmale und feste Runen sind sein Vorschlag, nicht entschieden.
- Sammelbild liegt in der Session-Ablage (`s4-16-8-sammelbild.png`); nach Abnahme nach `art/mockups/weapons-2026-11/signatures_v2_preview.png` übernehmen (T5).

## Gebaut: Merkmal je Stück

Jedes Stück ist das Gruppenmodell (Rahmen, Knoten, Fassung, Rinne unverändert) plus ein Merkmalsmesh im Metallmesh und abgewandelte Farben (Wicklung/Holz per Palettenüberschreibung der Gruppe, Merkmal aus `hollow-64.hex`).

| id | Gruppe | feste Rune | Merkmal wie gebaut | Dreiecke |
|---|---|---|---|---|
| `tinder` | axe | `fire_rune_2` | echte V-Kerbe in der Schneide (Boolean-Schnitt), Kerbrand verkohlt mit Glutrand, Glutorange-Wicklung | 7 724 |
| `bounty` | bow | `edge_rune` | Armbrust: Bogenarme als Prod, Holzschaft zur Schnursehne (+Y) mit Nuss, Lederkappe, Goldmünze mit Prägekreuz als Knauf | 5 086 |
| `wolf_fang` | lance | `wind_rune_2` | gebogene Elfenbein-Wolfszahnspitze, zwei Fangzähne am Kragen, graue Fellwicklung mit Fellbüscheln an beiden Enden | 6 852 |
| `little_hands` | shield | `earth_rune_2` | drei erhabene Kinderhand-Abdrücke (Goldton) auf dem Schild, oben und links/rechts außerhalb der Ringrinne | 6 344 |
| `rowenas_lance` | lance | `wind_rune_3` | zwei Flügelfinnen (je drei Federspitzen, Elfenbein/Gold) unter der Spitze am Kragen | 6 136 |
| `wasp_sting` | bow | `precision_rune` | Armbrust mit gelb-schwarz geringeltem Wespenleib-Schaft, schwarz-gelbe Wicklung, langer Stachelbolzen (nach vorn, −Y) mit Gelbfedern | 4 878 |
| `gold_hook` | sword | `water_rune_1` | goldener Enterhaken am +X-Parierstangenende mit Endknopf, Klinge zu 0,034 zum Säbel gebogen (Metall und Rinne), Goldwicklung | 7 066 |
| `dravns_oath` | sword | `dark_rune_1` | schwarzes Eidtuch: zwei Bänder um den +X-Arm, zwei flatternde Tuchenden; Siegelring mit dunkler Scheibe und Goldbalken auf beiden Knaufseiten, schwarze Wicklung | 7 482 |
| `magpie` | dagger | `feather_rune` | Elsternkopf als Knauf (Schnabel, Brust, Augen, Schopf), schwarz-weiß gewendelte Wicklung | 6 352 |
| `white_wolf` | bow | `water_rune_2` | weißer Wolfskopf (Schnauze, Ohren, Augen) auf dem oberen Wurfarm mit Silberring, Silbertönung der Arme | 4 786 |
| `heirloom` | lance | `light_rune_1` | graviertes Familienzeichen (Messingplakette mit dunklem Zweig-Zeichen) auf beiden Schaftseiten, zwei Messingringe, abgegriffene sandfarbene Wicklung | 6 472 |
| `final_curtain` | lute | `light_rune_1` | karminroter Vorhangzipfel am Wirbelkasten, Goldkordel, Goldquaste mit Fransen | 6 378 |
| `pact_warden_shield` | shield | `earth_rune_2` (Stufe 1..3 → `earth_rune_1..3`) | Paktsiegel-Ring (Gold, innerhalb der Ringrinne um den Buckel) mit zwölf violetten Siegelzähnen | 8 412 |
| `dragon_ember` | Relikt (Schmuck) | `fire_rune_2` (Stufe 1..2 → `fire_rune_1..2`) | Drachenschuppen-Anhänger: Schuppenplatte mit Goldrand, drei Glut-Hörnern, Hauptfassung in der Mitte, kurze Rinne (`fill`) im Bogen um die untere Schuppe, Kette nach oben (Bügel + 10 Glieder) | 3 372 |

## Vertrag

- Waffen: Metallmesh heißt wie das Gruppenmodell (`axe`, `bow`, `lance`, `shield`, `sword`, `dagger`, `lute`), Material `HC_Vertex`; `rune_channel` mit UV 1 `fill`; `rune_socket2`; Knoten `socket_rune_a*` / `socket_rune_b*` wie im Gruppenmodell; kein `rune_stone`. Alle ≤ 8 500 Dreiecke (größtes: `pact_warden_shield` 8 412). Waren die Gruppenmodelle fast am Limit (Lanze, Schwert, Schild), wurde das Basismesh vor dem Merkmal per planarem Auflösen/leichter Reduktion ausgedünnt.
- `dragon_ember`: Mesh `dragon_ember`, `rune_channel` (UV 1 `fill`), Knoten nur `socket_rune_a` (kein `rune_socket2`, kein Griff). Ursprung Anhängermitte, +X Kuppelseite, Kette nach +Z (glTF +Y), kein Sockel an der Figur. [ASSUMPTION]
- Armbrüste: Bogenrahmen und -knoten, Haltung wie `bow` (links, `motion: shoot`). [ASSUMPTION]
- Merkmale liegen nie über Fassung oder Rinne (Sichtprüfung am Sammelbild).

## Farben

Nur `art/palette/hollow-64.hex`: Glutorange (15–17), Gold (18/19/44), Elfenbein (6/9/10), Silber (5/27/28), Gelb/Schwarz (19/20, 1–3), Karmin (45–47, nur als kleine Fläche am Vorhang), Violett (48–50, Siegelzähne). Keine Teamfarben als große Fläche.

## Offen

- Abnahme der Merkmale und festen Runen (Produktinhaber, T1/T5).
- Merkmale sind klein; ob sie auf Brettgröße lesbar sind, ist am Brett noch nicht geprüft (Brettmodelle zeigen die Waffe in etwa 1/6 der Sammelbildgröße).
- Ladeplan, `render.yaml` (`gear.items`), Pipeline (`build.py`, Ordner `sig/`) und Tests folgen in T3/T4/T6.
