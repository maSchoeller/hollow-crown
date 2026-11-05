# Level-Werkzeug: Level-Blatt, Atlas, Stimmungsbild

> Etappe 5 der Konzept-Überarbeitung (2026-11-01). Jedes Level wird als YAML im Spielformat geschrieben; ein Skript zeichnet daraus das Level-Blatt, alle Blätter zusammen ergeben den Level-Atlas. Verbindlich ist das Raster auf dem Blatt; das Stimmungsbild von ChatGPT zeigt nur die Atmosphäre.

## Blatt und Atlas erzeugen

```bash
pnpm levels                                   # alle Karten aus content/ (Kampagnen-Reihenfolge) und alle Entwürfe hier unter levels/
pnpm levels m1_2_erlbach                      # nur eine Karte aus content/
pnpm levels concept/27-ueberarbeitung/levels/muster_mittel_20x25.yaml --png   # ein Entwurf, zusätzlich als PNG
```

Ausgabe in `concept/27-ueberarbeitung/levels/out/` (nicht eingecheckt): je Level `<id>.svg` (mit `--png` auch `<id>.png`) und `atlas.html`, eine einzelne Seite mit allen Blättern, die auch auf dem Handy lesbar ist. Weitere Optionen: `--out <ordner>`, `--moods <ordner>`.

Entwürfe liegen als `*.yaml` in `concept/27-ueberarbeitung/levels/`. Das Spiel lädt sie nicht; das Skript prüft sie gegen das Karten-Schema des Spiels (`mapSchema`) und bricht bei Fehlern mit der Liste ab, unbekannte Gelände- und Klassen-IDs meldet es als Warnung. Ist ein Level abgenommen, kommt es wie unter „Entwurf ins Spiel holen“ beschrieben in die Karte.

## Was das Blatt zeigt

- **Kopf:** Name, ID, Größe mit Felderzahl und Klasse (klein bis 360 Felder, mittel bis 800, darüber groß), Tageszeit und Wetter, Sieg, Niederlage, eigene Einheiten (aufstellbar, Pflicht), Gegner je Schwierigkeit (L/N/S, davon später über Wellen und Auslöser) und das Verhältnis Gegner zu eigenen auf Normal, Nebenziele, Absicht.
- **Raster:** Koordinaten am Rand (x oben, y links), jede fünfte Linie kräftiger; Gelände als Farbe und Zeichen; Startfelder blau nummeriert; Figuren als Steine in Teamfarbe mit Klassen-Kürzel und Stufe; Boss und Leutnant mit Goldrand und Krone; Figuren nur für einzelne Schwierigkeiten gestrichelt mit L/N/S; „z“ wartet, „h“ hält oder bewacht; Verstärkungen als Raute mit Runde (R4), Figuren aus Auslösern als violette Raute (A1); Zielgebiet gold, Auslöse-Gebiete violett; Besuchsorte (B), Truhen, Türen, Hebel.
- **Darunter:** Symbol- und Geländelegende mit Felderzahl, Klassen-Kürzel, Figuren gruppiert nach Klasse, Stufe und Verhalten, Verstärkungen und Auslöser, Besuchsorte mit Belohnung, Phasen, Marken, Notizen.

## Planungsangaben: das Feld `design:`

Was das Spielformat nicht kennt, steht im optionalen Feld `design:` der Karte. Das Schema prüft es streng, das Spiel liest es nicht (Architektur-Decision-Log 2026-11-01). Beispiel mit allen Angaben: `levels/muster_mittel_20x25.yaml`.

| Feld | Inhalt |
|---|---|
| `title` | Arbeitstitel, solange es noch keinen Text-Schlüssel gibt |
| `intent` | Zweck der Mission in ein, zwei Sätzen |
| `mood` | Stimmung für das Stimmungsbild, wird in die ChatGPT-Vorlage übernommen |
| `phases` | `{ id, turns: [von, bis], label, note? }`, erscheinen als P1, P2 … |
| `paths` | Wegpfeile `{ team, points: [[x,y], …], phase?, label? }`; Gegner rot gestrichelt, eigene blau |
| `zones` | benannte Gebiete `{ area, label, phase? }` (`area` wie im Spiel: `rect` oder `tiles`) |
| `marks` | Marken `{ at, label (bis 3 Zeichen), note }` für Hinterhalte, Engstellen, Kamerapunkte |
| `notes` | freie Notizen |

## Vom Blatt zum Stimmungsbild (ChatGPT)

1. Blatt als PNG erzeugen: `pnpm levels <id oder datei> --png`.
2. Im Atlas beim Level „ChatGPT-Vorlage für das Stimmungsbild“ aufklappen und kopieren. Die Vorlage nennt Größe und Ausrichtung, den Stil der Art Direction (§3), eine Beschreibung der Karte in Dritteln (Nord/Mitte/Süd × West/Mitte/Ost nach Hauptgelände), Tageszeit, Wetter und `design.mood`, und schließt Figuren, Schrift und Raster aus.
3. In ChatGPT (über Claude in Chrome, siehe AGENTS.md) das PNG anhängen und die Vorlage senden. Weicht die Lage von Wasser, Wegen, Mauern oder Häusern vom Raster ab, nachfordern: „Halte dich genauer an das Raster: …“.
4. Ergebnis als `concept/27-ueberarbeitung/levels/stimmung/<id>.png` speichern und `pnpm levels` erneut laufen lassen: Der Atlas bettet das Bild neben dem Blatt ein. Prompt und Abnahme wie üblich in `art/prompts/<id>.md`, Auflagen nach `23-art-direction/licensing.md` §6.

## Entwurf ins Spiel holen

Muster ist 1-4 (`content/acts/act1/maps/m1_4_wolfslager.yaml`, Test `tests/unit/m1-4-wolfshuegel.test.ts`). Der Entwurf ersetzt den Inhalt der alten Karte, ihre Hüllen bleiben.

1. **Bleibt von der alten Karte:** Dateiname, `id`, `nameKey`, `music`, Tageszeit und Wetter, wenn der Entwurf nichts sagt. Einheiten-IDs, auf die sich Szenen, Tests, Leutnants oder Nebenziele beziehen, wandern auf passende Figuren des Entwurfs, samt `requires`, `quote`, `drops`. Alle Figuren bekommen ihr `sprite`.
2. **Kommt aus dem Entwurf:** Größe, Legende, Terrain, Einheiten, Objekte, Ziele, Nebenziele, Wellen, Auslöser, `design:`, Kopfkommentar. Die Szenen-IDs `scn.s1_*` werden zu `scn.m*`. `haunts` je Variante auf dem neuen Gelände neu setzen, mit Grund als Kommentar, Aufstellgebiet klein halten (der Check läuft je Feld).
3. **Stufen:** Bereiche per `levels:` heben (später in der Liste gewinnt). Gelände behält seine Art, ein Wald auf der Terrasse bleibt Wald. Eine Verbindung liegt auf der unteren Stufe und hat genau einen Nachbarn eine Stufe höher. Bei einem Kamm aus zwei Reihen gehört die obere Reihe zur höheren Stufe, die untere zur tieferen, das Rampenfeld liegt in der unteren. Mindestens ein Schütze über einer Rampe.
4. **Veränderung:** Hebel = Gelände `lever` + Objekt `lever`, wird vom Nachbarfeld gezogen. Der Auslöser `object_activated` setzt Flag und `set_terrain` (mit `level:`, sonst fällt das Feld auf Stufe 0). Wellen, die dadurch entfallen, bekommen `unlessFlag`; das Flag steht als `kind: battle` in `flags.yaml`.
5. **Texte:** Fehlende Szenen in `content/acts/actN/scenes/`, englisch in `content/locales/en/actN.dialogue.yaml`, Namen in `content/core/locales/{de,en}.names.yaml`. Vorhandene Szenen nach dem alten Ort durchsuchen (Zelt, Käfig, Wald …) und anpassen, je Box höchstens 110 Zeichen.
6. **Prüfen:** `pnpm check`, Tests an die neue Karte anpassen, ohne ihre Absicht zu schwächen. Leicht und Normal mit `pnpm sim --campaign act1 --difficulty normal` und `pnpm sim <id> --difficulty easy` gegen die Korridore in `balance.yaml`, Schwer über die Kampagne. Abstimmen in kleinen Schritten über Stufen und KI-Profile, `[C]`-Kommentar in die Karte. Blatt mit `pnpm levels <id> --png --out <ordner>` ansehen, Karte im Spiel mit `await __hc.devNode('<knoten>')` öffnen (vorher `pnpm art:build`, wenn `public/assets` fehlt; Lautstärke auf 0).

Neues Gelände mit Modell: Eintrag in `content/core/terrain.yaml`, Namen, `content/core/handbook.yaml`, `TERRAIN` in `tools/levels/sheet.ts`, Modell in `content/packs.yaml` (`props`) und in seiner Gruppe unter `concept/23-art-direction/map-assets/groups/` auf `ships: true`.

## Abnahme durch den Produktinhaber

Der Atlas wird als Artifact veröffentlicht. Der Produktinhaber sieht je Level Blatt und Stimmungsbild nebeneinander, gibt Rückmeldung zum Raster und nimmt jedes Level einzeln ab (Etappe 6).

Je Level gibt es dazu eine knappe Abnahme-Ansicht `levels/abnahme/<id>.md`: Kurzfassung oben, darunter nur das Raster (aus dem PNG zugeschnitten), Details eingeklappt.
