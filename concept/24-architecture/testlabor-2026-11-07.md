# Testlabor, Simulation und Balancing – Bestandsaufnahme 2026-11-07

## Kurzfassung

- Ein Testlabor gibt es schon, nur verteilt: `arena()`/`place()` für Regeltests, Fixture-Karten (`tests/fixtures/maps/*.yaml`) mit `__hc.devMap()` im Browser, `__hc.devNode()` für echte Missionen, `pnpm sim` für Siegquoten, `pnpm report` für Replays. Regeln, Vorschau und Replay sind sauber genug, dass jede Frage *grundsätzlich* beantwortbar ist.
- Was fehlt, ist der kurze Weg: Eine Session schreibt für „Stirbt der Boss am Gegenschlag?“ heute ein eigenes 25-Zeilen-Skript mit zwei Fehlversuchen, im Browser lässt sich eine Lage nur mit einem undokumentierten Trick herstellen.
- Die Frage „Mission mit allen Nebenzielen in 10 Runden?“ beantwortet heute kein Werkzeug: Die Autoplay-KI verfolgt Nebenziele nicht, und `pnpm sim <map>` zeigt sie nicht an.
- Balancing-Läufe dauern 5,5–12,5 Minuten je Variante (einkernig) und werden als Textdateien von Hand verglichen.
- **Empfehlung:** zuerst S1 (Sim zeigt Nebenziele und Rundenverteilung, gibt JSON aus), S2 (`--set` für Balancewerte, parallele Läufe, `sim:diff`), dann M1 (`pnpm lab` mit Szenario-YAML, das auch im Browser startet). Kein Ausbau der Autoplay-KI zur Zielsuche jetzt (L, unsicherer Nutzen).

## 1. Bestand, im Code nachgemessen

| Baustein | Wo | Stärken | Lücken |
|---|---|---|---|
| `pnpm sim <map>` | `tools/simulate.ts` | KI gegen KI, verkettet oder `--fresh`, `--flag`/`--leave` für Entscheidungszweige, `--difficulty`, `--chain`, `--haunt` | Kennt keine Nebenziele; nur Text, kein JSON; verkettet kommen oft nur Teile der Läufe an (1-3: 9 von 20); kein Eingriff in Balancewerte ohne Dateiänderung |
| `pnpm sim --campaign act1` | `tools/simCampaign.ts` | Ganzer Akt mit Heimat-Heuristik, Korridore (NFR12) und Goldkurve aus `balance.yaml simulation`, Kampfzeit-Schätzung | 50 Läufe = 330–750 s; einkernig (keine Worker, 12 Kerne frei); Vergleich zweier Stände nur per `> base.txt` und Augenmaß (so liegen `base-*.txt`, `xp-*.txt` in den Session-Notizen) |
| Autoplay | `src/core/ai/autoplay.ts` (`autoCommand`, `autoplay`) | Deterministisch, beherrscht Siegziele inkl. Tür, Hebel, Eskorte, Schatzsuche, Halten | Nebenziele (Truhen, Runde X, Anwerben) verfolgt es nicht; Truhen nur, wenn sie Siegziel sind |
| `pnpm report` | `tools/report.ts`, `reportCheck.ts` | Fehlerbericht lesen, Replay bis zur ersten Abweichung, Kampagne ab Checkpoint | Nur für gemeldete Berichte; kein Weg, einen Bericht als Startlage im Browser oder in der Sim zu öffnen |
| Arena-Fixture | `tests/fixtures/arena.ts` | Leeres Feld, `place()` setzt Figuren; in 12 Testdateien genutzt | Nur in Vitest; Klassen-IDs, Feldindex, Timer-Format muss man im Code suchen |
| Fixture-Karten | `tests/fixtures/maps/*.yaml`, `devObjectiveMaps.ts` | Normales Karten-Schema: Terrain, Einheiten mit Stufe/Gegenständen/KI, `initialEffects` (Feuer), Ziele, Trigger. Im Browser `__hc.devMap(id)`, in Tests `addDevObjectiveMap` | Keine Runde, keine HP/Status/Werte je Figur; Kompanie kommt aus dem geladenen Spielstand, nicht aus der Datei; kein CLI-Weg (Sim/Vorschau) |
| `__hc` (Dev) / `__hcTest` (Playwright) | `src/app/state/devHooks.ts` | `devNode`, `devMap`, `autoWin`, `autoStep`, Heimsuchung, Leutnant, Szene, Aktende … | Eine *Lage* in einer laufenden Schlacht (Figur hierhin, HP so) lässt sich nicht setzen: Das Brett übernimmt einen geänderten `battle.value` nicht |
| e2e | `tests/e2e/*.spec.ts`, `lastMove.ts` | Baut Spielstände auf der Platte (`savedBeforeWin`) und importiert sie im Produktions-Build | Muster nur für „ein Zug vor dem Sieg“; nicht als allgemeines Werkzeug verfügbar |
| Balancewerte, Prüfung | `content/core/balance.yaml` (265 Zeilen), `pnpm content:check` | Ein Ort, Zod-geprüft, Handbuch verweist per `ref` auf Werte, Korridore stehen selbst in der Datei | – (gut so) |
| Spezialwerkzeuge | `bench:ai`, `tools/phase-state.ts`, `enemyPhase.ts`, `pnpm levels` | Leistung, Gegnerphasen-Dauer, Kartenblätter | – |

**Gut genug und nicht anfassen:** Determinismus (Seed-RNG, Replay), gemeinsamer Formelcode von Vorschau und Auflösung (`forecast`), `balance.yaml` als zentrale Stelle, `content:check`, `pnpm report`.

## 2. Die vier Maßstabsfragen, nachgemessen

| Frage | Heute | Aufwand gemessen | Ergebnis |
|---|---|---|---|
| 1. „Ist 1-3 mit allen Nebenzielen in 10 Runden schaffbar?“ | `pnpm sim m1_3 --runs 20` | 61 s, 1 Befehl | Nur Teilantwort: Sieg 100 %, Median 10 Runden, aber 9 von 20 Läufen kamen an, und ob `s_chests` und `s_fast` erfüllt wurden, steht nirgends. Die KI öffnet Neben-Truhen nicht. **Nicht beantwortbar.** |
| 2. „Stirbt der Boss am Gegenschlag von Liora?“ | Eigenes Skript: Kampagne bauen, auf `expectedLevel` heben, `beginBattle`, Figur verschieben, `forecast` | ~10 min, 25 Zeilen, 1 Fehlversuch | Beantwortbar (Osric gegen Liora in 1-4: Liora kann nicht zurückschlagen). Gelingt, aber jede Session baut dasselbe Gerüst neu. |
| 3. „Wählt die Wegsuche den Weg um das Feuer?“ | Im selben Skript: `arena`, `place`, Feld auf `burning` + Timer, `reachable`/`pathTo` | ~5 min, 2 Fehlversuche (Klassen-ID, Feldindex) | Beantwortbar: Der Weg geht **durch** das Feuer (Kosten 2 wie Wald; der Eintrittsschaden `burningEnterDamage` 5 zählt nicht in die Wegkosten). Ob das gewollt ist, ist eine Designfrage (s. §5). |
| 4. „Wie sieht diese Situation im Browser auf dem Handy aus?“ | Dev-Server, `__hc.devNode('m1_4')`, Dialog mit Entscheidung durchklicken, `battle.value` ändern | ~12 Werkzeugaufrufe | Erst mit Trick: Bildschirm auf Weltkarte, `battle.value` mit geänderter Lage setzen, zurück auf `battle` – dann baut das Brett neu auf. Direktes Ändern wirkt nur im HUD, nicht auf dem Brett. |

Das Prüfskript zu Frage 2 und 3 lag nur im Scratch-Ordner und ist nicht Teil dieses PRs.

## 3. Vorschläge

Aufwand: S ≤ 1 Story-Tag, M 2–4 Tage, L mehr. Nutzen: wie oft Sessions die Lücke treffen und wie viel Zeit sie kostet.

### S1 – Sim zeigt Nebenziele und Rundenverteilung, gibt JSON aus (S, Nutzen hoch)

`simulate.ts` hat den Endzustand; `sideObjectiveDone` (`src/core/battle/objectives.ts`) gibt es schon.

```
pnpm sim m1_3 --runs 50 --json .sim/m1_3.json
win 100 %, turns p10/p50/p90 8/10/13, ankommen 50/50 (--fresh) bzw. 21/50 (verkettet)
side  s_chests 0 %   s_fast 52 %   alle Nebenziele 0 %
```

Dazu die Ankunftsquote deutlich ausweisen und bei unter 50 % auf `--chain easy` oder `--fresh` hinweisen. Damit wird Frage 1 ehrlich beantwortet: „Die KI schafft es nicht; was sie nicht versucht, steht als 0 %.“

### S2 – Balancewerte ohne Dateiänderung variieren, parallel rechnen, vergleichen (S–M, Nutzen hoch)

```
pnpm sim --campaign act1 --runs 50 --set experience.killBase=38 --json .sim/kill38.json
pnpm sim:diff .sim/base.json .sim/kill38.json      # Tabelle nur der Abweichungen, ↑/↓ gegen die Korridore
```

- `--set pfad=wert` (mehrfach) patcht `data.balance` nach dem Laden und vor der Validierung, also kein Editieren und Zurücksetzen von `balance.yaml`.
- `--workers n` verteilt die Läufe (Seeds `seed0 + r` sind schon unabhängig) auf `worker_threads`; bei 12 Kernen werden aus 330–750 s etwa 1–2 min. Determinismus bleibt, weil jeder Lauf seinen Seed hat.
- `sim:diff` liest zwei JSON-Ausgaben und zeigt nur Zeilen, die sich über einer Schwelle bewegen.

### S3 – `__hc.lab(fn)`: Lage in der laufenden Schlacht ändern (S, Nutzen mittel)

Den gefundenen Trick als Hook: `__hc.setBattle(s => { liora.pos = [10, 3] })` klont den Zustand, wendet die Funktion an, setzt `start` und `state` und baut das Brett neu auf. Klein, aber nur ein Zwischenschritt bis M1.

### M1 – `pnpm lab`: Szenario-YAML für Node und Browser (M, Nutzen hoch)

Ein Szenario ist eine Fixture-Karte (gleiches Schema wie `tests/fixtures/maps/*.yaml`) plus ein kleiner `lab`-Block für das, was die Karte nicht kennt. Alternativ verweist es auf eine echte Karte und überschreibt nur Teile.

```yaml
# tests/lab/boss-gegenschlag.yaml
base: { map: m1_4_wolfslager, node: m1_4 }   # oder: map: dev_fog / eigene terrain-Zeilen
company: expected                             # Kompanie wie devNode: Beitritte bis zum Knoten, auf expectedLevel
seed: 3
turn: 4
units:
  liora: { at: [10, 3], hp: 9 }
  osric: { hp: 12, status: [burning] }
fire: [[4,3],[4,4],[4,5]]                     # wird zu Terrain burning + Timer, wie initialEffects
remove: [enemy:wolf_*]
```

```
pnpm lab tests/lab/boss-gegenschlag.yaml --forecast osric liora     # Vorschau beider Richtungen, Tötungschance
pnpm lab tests/lab/feuer.yaml --path rhen 6,5                       # Weg, Kosten, betretene Gefahrenfelder
pnpm lab tests/lab/boss-gegenschlag.yaml --play --runs 50           # Autoplay ab dieser Lage, Ausgabe wie S1
pnpm lab tests/lab/boss-gegenschlag.yaml --save .lab/boss.json      # Spielstand zum Import (Muster savedBeforeWin)
```

Im Browser: `__hc.lab('boss-gegenschlag')` (oder `?lab=boss-gegenschlag` im Dev-Build) baut dieselbe Lage über denselben Loader und öffnet die Schlacht ohne Szenen; Speichern bleibt aus wie bei `devMap`. Ein Loader in `src/` (nur Dev-Import) für beide Seiten, damit Node und Browser nicht auseinanderlaufen. Fehler im Szenario (unbekannte Einheit, Feld außerhalb) meldet der Loader mit der Liste gültiger IDs, wie `devNode` es heute schon tut.

Nutzen: Fragen 2, 3 und 4 werden je ein Befehl; dieselbe Datei kann ein Regeltest (`labState(file)` in Vitest) oder ein Fehlerfall aus `pnpm report` werden (`pnpm report x.json --lab out.yaml` als spätere Erweiterung).

### M2 – Autoplay verfolgt Nebenziele (M, Nutzen mittel)

Ein Schalter `sideGoals: true` für `autoCommand`: Truhen und Dörfer als Botengänge über den vorhandenen `errand()`-Mechanismus, sobald die Gefahr klein ist; Rundenziel als Tempo-Druck. Danach misst S1 nicht mehr nur „was die KI zufällig schafft“. Gefahr: verändert die Korridor-Zahlen der Kampagnen-Sim; deshalb nur per Option, nicht als neues Standardverhalten.

### L1 – Zielsuche per Sim (L, Nutzen unsicher)

Eine Suche (z. B. Beam-Search über Commands mit Autoplay als Rollout), die beantwortet „gibt es *irgendeinen* Zugweg, der alle Nebenziele in 10 Runden schafft“. Technisch möglich, weil der Kern deterministisch und klonbar ist; der Suchraum großer Karten (30×40, 28 Gegner) ist aber riesig, und M2 + S1 beantworten die Praxisfrage „schafft ein ordentlicher Spieler das?“ meist schon. **Jetzt nicht bauen**; erst wenn M2 zeigt, dass die Heuristik regelmäßig falsche „nicht schaffbar“-Antworten gibt.

## 4. Empfehlung

1. **S1 + S2 zusammen als eine Story** (Sim: Nebenziele, Perzentile, JSON, `--set`, `--workers`, `sim:diff`). Größter Hebel fürs Balancing kurz vor dem Akt-1-Release, kleinstes Risiko, betrifft nur `tools/`.
2. **M1 `pnpm lab`** als nächste Story; S3 entfällt dann bzw. wird Teil davon.
3. M2 danach, wenn Nebenziel-Balancing ansteht. L1 nicht.

## 5. Nebenbefund (keine Entscheidung getroffen)

Brennende Felder kosten beim Wegsuchen 2 (wie Wald); der Eintrittsschaden fließt nicht in die Wegkosten. Die Spieler-Reichweite (`reachable`/`pathTo`) führt deshalb durch Feuer, wenn der Umweg länger ist; ob die Gegner-KI es in ihrer Feldbewertung meidet, wurde hier nicht geprüft. Ob das gewollt ist, gehört in GDD bzw. Architektur; hier nur festgehalten.
