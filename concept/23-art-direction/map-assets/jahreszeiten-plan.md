# Plan: Herbst- und Winterboden, Schneehauben

Status: im Spiel seit Story 15.15 (2026-11-06), Abweichungen und Stand im Decision-Log (`../decision-log.md`). Weg B am 2026-11-07 abgenommen; Winter-Deko und je zwei weitere Waldvarianten folgen in Story 15.16. Vorher: Plan, nicht im Spiel. Gehört zu Etappe 3 der Matrix (`matrix.md`). Probe: Herbstlaub im vierten Feld von `art/ground/refs/sheet6_mire_creek_peat_autumn.png`.

## Ziel

Akt 2 steht heute mit Herbstlaub auf Sommerwiese, Akt 3 mit Schneefichten. Boden und Requisiten sollen zur Jahreszeit passen, ohne dass Regeln oder Karten sich ändern. Die Wirkung eines Felds bleibt in jeder Jahreszeit an derselben Form erkennbar (Art Direction §3.2).

## Boden

| Oberfläche | Akt 1 (heute) | Akt 2 | Akt 3 |
|---|---|---|---|
| `grass` | `grass` | `grass_autumn`: Laub auf stumpfem Gras | `snow`: Schnee mit Grasspitzen |
| `dirt` | `dirt` | `dirt` (etwas kühler) | `dirt_frozen`: gefrorene Erde, Reif |
| `road` | `road` | `road` | `road_snow`: Fahrspuren im Schnee |
| `sand`, `ash`, `peat`, `vault`, `stone` | bleiben | bleiben | bleiben (Innenräume haben keine Jahreszeit) |

- **Texturen:** zwei neue Blätter per ChatGPT (`sheet7`, `sheet8`), Protokoll in `art/prompts/`, Aufbereitung über `SHEETS` in `tools/art/ground.py`.
- **Technik:** `render.yaml` bekommt `board.seasonGround: { 2: { grass: grass_autumn }, 3: { grass: snow, dirt: dirt_frozen, road: road_snow } }`. `buildTerrain` tauscht nur die Textur des Splat-Layers, die Layer selbst bleiben. Eine Karte mit `interior: true` tauscht nichts.
- **Download:** nur Texturen des laufenden Akts laden, sonst wachsen die 24 Bodentexturen um weitere 4. Vier Texturen kosten rund 400 KB.

## Requisiten

| Klasse | Akt 2 | Akt 3 | Stand |
|---|---|---|---|
| Wald | `grove_autumn_a`, zwei Varianten fehlen | `grove_snow_a`, zwei Varianten fehlen | je ein Modell gebaut |
| Felsmasse | `massif_*` bleibt | Schneehaube | offen, siehe unten |
| Häuser | bleiben | Schneehaube auf den Dächern | offen, siehe unten |
| Mauer, Turm | bleiben | `snowcap_wall_idle`, `snowcap_tower_idle` | gebaut, Brett wählt sie noch nicht |

## Schneehauben: zwei Wege

- **A, eigener Modellsatz:** Je Modell eine Winter-Fassung in Blender wie `snowcap_wall_idle`. Sieht am besten aus, kostet aber Arbeit und Download je Modell.
- **B, weiß von oben im Material (für Fels, Dächer, Kleinkram):** Der Requisiten-Shader mischt nach Normalenrichtung Weiß auf nach oben zeigende Flächen. Das kostet keinen Download und gilt sofort für alles, wirkt aber weniger gestaltet.

Entschieden (Produktinhaber, 2026-11-05): B als Grundlage, A nur für das, was der Spieler lange ansieht (Mauer, Turm, Wald). Vorher eine Probe auf einem Entwurf aus Akt 3 zeigen.

## Reihenfolge

1. Herbstboden mit dem Probe-Feld auf einem Entwurf aus Akt 2 zeigen, sobald die Entwürfe von Akt 2 stehen.
2. Blätter `sheet7` und `sheet8`, `seasonGround` im Brett.
3. Probe Schneehaube Weg B auf einer Karte aus Akt 3, Entscheidung des Produktinhabers.
4. Fehlende Waldvarianten für Herbst und Schnee.
