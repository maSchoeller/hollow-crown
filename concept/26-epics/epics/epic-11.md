## Epic 11: Akt 2 „Glut“

Spieler ziehen nach dem Finale von Akt 1 durch die Windscharte ins herbstliche Hochland der Eisenmark und der Aure entlang bis an die Küste. Die drei Thronanwärter werben nacheinander: Seraphine und Dravn bieten in 2-1 an, Maelis erst, als Dravns Lüge in 2-4 platzt; in Kronfeld wird die Truppe verraten. Das Epic liefert den Akt-Übergang mit dem Paket `act2`, die Balliste als Regel-Schwerpunkt des Akts, die Gefährten und Leutnants, eine Story je Mission (2-1 bis 2-8) und Nebenquest (N4 bis N6), Supports, Barks, die Chronik-Szene, Galerie-Modelle, Brettfiguren, Leistung, Abstimmung und Release. Neu geschnitten am 2026-11-06 nach der Überarbeitung (`concept/27-ueberarbeitung/umsetzung-lueckenliste-akt2.md`, Decision-Log der Epics); die Fassung vom 2026-10-31 mit drei freien Strängen, Fliegern und Reitern ist abgelöst.

**Grundlage:** abgenommene Entwürfe `concept/27-ueberarbeitung/levels/s2_*.yaml` mit Abnahmen in `levels/abnahme/s2_*.md`, `concept/22-narrative/missionsliste-s1.md` (Akt 2), `geografie-valmora.md`, `concept/23-art-direction/figuren-bestand.md`, `map-assets/matrix.md`, `map-assets/jahreszeiten-plan.md`. Was dort steht, gilt vor `narrative.md` (Missionsfolge, Leutnant-Tabelle) und vor der alten Fassung dieses Epics. Werte, Schlüssel und Formeln, die die Überarbeitung nicht berührt (Akt-Übergang, Positionsstufe, Stahl-Tier, Supports, Relikte), stammen aus den Entscheidungen des Produktinhabers vom 2026-10-31.

**Gilt für alle Stories:** Fertig erst mit grünem `pnpm check`; sichtbare Änderungen als Bild bei 375 × 812 belegt; Karten mit `pnpm sim` geprüft (Optionen aus 11.4); Werte in YAML, als `[ASSUMPTION]` markierte Werte per Simulation zu prüfen; kein `content:lock` vor dem Release von Akt 1 (9.14), danach nach jedem Live-Schritt von Akt 2 (siehe „Stückweise live“). Keine Flieger und keine Pferde auf dem Brett, Pferde nur als Kulisse (GDD-Log 2026-11-05); die Flieger-Regel bleibt ungenutzt und getestet im Code. Mehr, aber schwächere Gegner: Gegner P−3 bis P−1, Leutnants P+1, Boss P+2 (GDD-Log 2026-11-05). Szenen DE und EN, jede Box ≤ 110 Zeichen, Schreib-Pipeline der Narrative; Gefährtenzeilen unter `requires: alive` mit Ersatzsprecher-Kette. Neue Entscheidungen ins zuständige Decision-Log unter `concept/`. Musik, Klang und Vertonung von Akt 2 kommen später und blockieren nichts. F1, F3 und F4 hat der Produktinhaber am 2026-11-06 entschieden (`umsetzung-lueckenliste-akt2.md`); F2 (Brettfiguren) am selben Tag: nur Rowena neu, sonst Platzhalter (Story 11.25). Die Antworten zum Readiness-Check vom 2026-11-07 (`concept/26-epics/fragen-po-2026-11-07.md`) sind eingearbeitet.

**Gemeinsame Regeln der Missions-Stories (11.12–11.22):**

- **Karte:** Der Entwurf ersetzt nichts, er wird übernommen: `content/acts/act2/maps/<id>.yaml` mit Feld `design:` auf den Entwurf, `map.act = 2`, Höhenstufen, Tore, Hebel und `set_terrain` wie im Entwurf. Die Karte ist im Spiel gewinnbar, liegt vorläufig im Korridor (NFR12, an der frühesten und spätesten Position laut 11.4, vorläufig ohne Aufstieg) und wird vom Produktinhaber im Spiel per Bild gesichtet; Abweichungen vom Entwurf stehen in der Abnahme-Datei.
- **Szenen:** IDs nach Akt-1-Schema (`scn.<knoten>.intro|outro`, `scn.<knoten>.<lt>_battle`, `scn.<knoten>.<einheit>_talk`, Besuche `scn.<knoten>.house_*`). Jede Mission hat Vor- und Nachszene passend zu Ort und Folge, die Prüfung auf Ersatzsprecher ist grün. Beitritte geschehen durch Ansprechen im Kampf, wie im Entwurf.
- **Entscheidungen:** Jede Antwort trägt eine Haltung (warm, nüchtern, trotzig) und zeigt ihre Folgen-Karte; Flags deklariert 11.5.
- **Ortsbilder:** Alle Orte von Akt 2 haben ein Bild in `art/mockups/locations-s1/`: vorhanden waren `grauwacht`, `salzpass`, `brandhang`, `kronfeld`; am 2026-11-07 vorgezogen (Frage 8 an den Produktinhaber, Antwort A) `windscharte` (2-1), `brandschneise` (2-4), `kraehenholm` (2-6), `kontor` (2-7), `clanlager` (N4), `kupfermine` (N5), `auemarkt` (N6), Prompt und Prüfung je in `art/prompts/loc_<id>.md`, Abnahme in `concept/23-art-direction/abnahme/akt2-ortsbilder.md` (offen). Die Missions-Story setzt die Id als `place` und Szenen-`background`, keine Platzhalter mehr. Damit `pnpm art:build` die Bilder baut, legt die erste Story mit Akt-2-Paket in `tools/art/build.py` eine Menge `ACT2_LOCATIONS` an (dazu `paktwacht_heimat` aus `ACT1_LOCATIONS` umziehen, wenn sie mit act2 kommen soll), lässt `build_locations` beide Mengen bauen und ordnet `locations/<id>.webp` dieser Ids in `content/packs.yaml` dem Paket act2 zu. Weil eine Datei zum ersten passenden Paket gehört, muss act1 dafür statt `locations/**` seine Orte einzeln nennen; so bleiben die Akt-2-Bilder aus dem ersten Download und aus act1.
- **Niederlage:** Avatar oder Lucan fallen, dazu die Schutzfigur der Mission laut Entwurf.
- **Live-Schritt:** Mit dem Merge ist die Mission für Spieler spielbar (F1). Vorher prüft die Story mit Fixture-Spielständen aus dem letzten Live-Stand, dass offene Spielstände mitten in Akt 2 ohne Verlust laden; nach dem Merge läuft `pnpm content:lock` und sperrt die neuen IDs.

**Reihenfolge:** Epic 11 beginnt nach dem Release von Akt 1 (Story 9.14). Ausnahme (Produktinhaber 2026-11-07, Frage 1): 11.6 Balliste, 11.8 Ziel-Phasen und 11.10 Format-Reste dürfen als Vorarbeit vor 9.14 beginnen, nacheinander in dieser Folge und nicht parallel zu den 9.14-Änderungen an `schemas.ts`/`validate.ts`; sie ändern nichts an Akt 1 und gehen erst nach 9.14 mit dem ersten Live-Schritt live. Danach 11.1 zuerst, weil Epic 10 `c.act`, `levelCap` 20 und die Gefährten-IDs braucht. Danach laufen 11.2–11.11 parallel zu 10.2–10.4. Die Missionen folgen der Kampagnenfolge; die Paare (2-2 ∥ 2-3, 2-5 ∥ 2-6) lassen sich in beliebiger Reihenfolge bauen. 11.23 nach 11.5, ihre Chronik-Szene nach 11.15. 11.24 läuft parallel zu den Karten, 11.25 hängt an F2, 11.26 nach 11.15 und 11.19. 11.27 kommt zuletzt, nach allen Stories dieses Epics und nach 10.1–10.12, weil diese Gold, EP, Glutfunken und Rabatte von Akt 2 verändern.

```text
Vorarbeit vor 9.14: 11.6 Balliste ──> 11.8 Ziel-Phasen ──> 11.10 Format-Reste (live erst nach 9.14)

9.14 Release Akt 1 ──> 11.1 Akt-Übergang ──┬─> 11.2 Positionsstufe ──> 11.4 Simulation
                                           ├─> 11.3 Paket, Weltkarte, Titeltafel (erster Live-Schritt)
                                           ├─> 11.5 Gefährten, Leutnants, Flags
                                           ├─> 11.6 Balliste · 11.7 Gegner, Herbst
                                           ├─> 11.8 Ziel-Phasen · 11.9 Relikt-Stufen
                                           ├─> 11.10 Format-Reste · 11.11 Kampagnenfolge
                                           └─> Epic 10 (10.2–10.4 parallel, dann 10.1, 10.5–10.12)

11.12 2-1 ──> 11.13 2-2 ∥ 11.14 2-3 ──> 11.15 2-4 ──> 11.16 2-5 ∥ 11.17 2-6 ──> 11.18 2-7 ──> 11.19 2-8 ──┐
                         └─> 11.20 N4        └─> 11.21 N5             11.22 N6 (mit 2-7) ─────────────────┤
11.23 Supports, Barks, Chronik (nach 11.5, Chronik nach 11.15) ───────────────────────────────────────────┤
11.24 Galerie-Modelle (parallel zu den Karten) ───────────────────────────────────────────────────────────┤
11.25 Brettfigur Rowena (F2) ─────────────────────────────────────────────────────────────────────────────┤
11.26 Leistung von Akt 2 (nach 11.15 und 11.19) ──────────────────────────────────────────────────────────┤
10.1–10.12 ───────────────────────────────────────────────────────────────────────────────────────────────┴─> 11.27 Abstimmung und Abschluss
```

**Stückweise live (F1, Produktinhaber 2026-11-06):** Akt 2 geht früh und Stück für Stück live, nicht erst mit 11.27. Erster Live-Schritt sind 11.1 und 11.3 nach dem Release von Akt 1 (9.14): `act2` wird `released: true`, wer Akt 1 beendet, landet in Akt 2 und sieht „Weitere Missionen folgen“. Danach ist jede Missions-Story mit ihrem Merge ein Live-Schritt. Folgen, die jede Story beachtet:

- **Sperre:** Vor 9.14 wird nicht gesperrt. Ab dem ersten Live-Schritt sperrt `pnpm content:lock` die IDs von `act2` in `content/released-ids.json` (Knoten `m2_*`, Gefährten, Flags, Leutnants, Items, Szenen, Karten) und nach jedem weiteren Schritt die neuen. Danach heißt Umbenennen `alt: neu` in `content/renames.yaml`, Entfernen ist nicht mehr möglich; IDs deshalb vor dem Merge endgültig wählen. Erster Live-Schritt bleiben 11.1 und 11.3; IDs späterer Stories (auch die Flags und Gefährten aus 11.5) werden nach ihrem Merge dazugesperrt (`mergeLock`), kritisch ist nur späteres Umbenennen (Produktinhaber 2026-11-07, Frage 3).
- **Speicherformat:** Spieler haben ab dem ersten Schritt Spielstände mitten in Akt 2, auch auf „Weitere Missionen folgen“. Jede Änderung am Format braucht eine Migration in `src/persistence/save.ts` und eine Fixture `tests/fixtures/saves/format<n>-act2-*.json` aus dem letzten Live-Stand (`tests/unit/migrations.test.ts`); das gilt auch für Epic 10. Neue persistierte Felder bekommen möglichst Defaults in `normalizeCampaign` statt eines Formatwechsels; die alten Core-IDs räumt 9.14 vor der ersten Sperre auf, 10.2 und 10.4 brauchen daher keine Umbenennungs-Migration (Produktinhaber 2026-11-07, Frage 2).
- **Werte:** Jede Mission geht vorläufig abgestimmt live; 11.27 stimmt am Ende neu ab. Wertänderungen sind erlaubt, sie ändern laufende Spielstände nicht rückwirkend.
- **Platzhalter:** Knoten ohne Karte bietet die Weltkarte nicht an (11.11); Platzhalter-Figuren (11.7, 11.25) dürfen live gehen, Ortsbilder liegen vorab vor.
- **Leerer Akt 2:** Alles Gemergte wirkt sofort, auch für Spieler auf „Weitere Missionen folgen“: Heimsuchungen (11.7), Akademie (10.2), Ausbau (10.1); 11.27 stimmt die Werte am Ende über alle Reihenfolgen ab (Produktinhaber 2026-11-07, Frage 4).

**Datei-Zuständigkeit:** Epic 11 besitzt `content/acts/act2/**`, den Akt-Übergang, Gegner, Leutnants und Stahl-Items; Epic 10 besitzt `content/core/rooms.yaml` (einzige Ausnahme: 11.1 ergänzt bei den Akt-1-Räumen `{ act: 2 }`), die Profi-Klassen und den Glutfunken. In gemeinsamen Dateien ändert Epic 11 nur eigene Blöcke: „Gegnertypen“ in `classes.yaml`, „Akt 2: Stahl-Tier“ in `items.yaml`, in `balance.yaml` nur Akt-Schlüssel und die hier genannten.

### Story 11.1: Akt-Übergang und Spielstand

Als Spieler
möchte ich nach dem Finale von Akt 1 mit meinem Spielstand nahtlos in Akt 2 weiterziehen,
damit die Kampagne über die Akte hinweg eine Geschichte bleibt.

**Akzeptanzkriterien:**

**Angenommen** `content/acts/act2/` mit `campaign.yaml`, `units.yaml` und `flags.yaml`
**Wenn** der Loader den Content baut
**Dann** lädt er Kampagne, Gefährten und Flags aller vorhandenen Akt-Ordner; `GameData` hält die Kampagnen je Akt (`acts: Record<number, CampaignDef>`), `actCampaign(data, c)` liefert die des laufenden Akts, `findNode(data, id)` sucht über alle Akte; alle Lesestellen von `data.campaign` lesen danach den Akt der Kampagne
**Und** `content:check` meldet doppelte Gefährten-, Flag- und Knoten-IDs über Akte hinweg; Leutnant-Heimsuchungen nutzen `data.hauntPools[lt.act]`.

**Angenommen** die Truppe gewinnt das Finale eines Akts und der nächste Akt ist freigeschaltet
**Wenn** `finishMission` den Sieg verbucht
**Dann** setzt es `c.act = act + 1` und meldet `actReached { act }`; sonst bleibt alles wie in Story 7.3 („erscheint bald“)
**Und** „freigeschaltet“ heißt: Das Paket `act2` ist `released: true`. Das wird es im ersten Live-Schritt nach dem Release von Akt 1 (F1, Produktinhaber 2026-11-06; Beschluss 2026-11-05 „erst nach Akt 1“ bleibt); bis dahin erreicht man Akt 2 nur über `__hc.devMap` und Fixture-Spielstände, die Kopfdateien von Akt 2 stehen nicht im Paket `core`
**Und** `content:check` erlaubt in einem veröffentlichten Akt Knoten ohne Karte (Platzhalter aus 11.11); die Weltkarte bietet sie nicht an und zeigt „Weitere Missionen folgen“, solange kein offener Knoten eine Karte hat
**Und** Replays und die Simulation (`simCampaign.ts`) führen den Übergang genauso aus; die Eingriffe in `apply.ts` und `commands.ts` bleiben klein, weil Epic 10 dieselben Dateien ändert.

**Angenommen** ein Spielstand aus dem Akt-1-Release mit erledigtem `m1_8`, auch einer, der wegen „erscheint bald“ in Akt 1 stand
**Wenn** er nach dem Release von Akt 2 geladen wird
**Dann** füllt `normalizeCampaign` das fehlende `c.act` (Standard 1) und holt den Übergang nach; Truppe, Gold, Tross, Flags, Groll und Gedenksteine bleiben; ein Stand ohne erledigtes Finale bleibt in Akt 1
**Und** die Fixture `tests/fixtures/saves/format<n>-act1-finale-done.json` ist ein echter Spielstand aus dem Akt-1-Release; `metaFromCampaign` liefert `c.act`, die Kampagnen-Liste zeigt „Akt 2“.

**Angenommen** `c.act = 2`
**Wenn** Regeln nachschlagen, was im Akt gilt
**Dann** gelten `levelCap` 20, `mechanics: {}`, Händlerstufen und `storyCount` von Akt 2; `availableNodes` liefert die Story-Knoten des laufenden Akts und die Nebenquests aller Akte bis `c.act`; Heimat und gebaute Räume bleiben
**Und** 11.1 ergänzt in `content/core/rooms.yaml` nur bei Schmied, Heiler, Taverne und Lagerfeuer die Bedingung `any: [{ act: 2 }, { storyCount: { min: n } }]`; ein Test belegt, dass beim Übergang kein Raum schließt.

**Angenommen** `acts/act2/campaign.yaml`, `units.yaml`, `flags.yaml`
**Wenn** sie angelegt sind
**Dann** enthält die Kampagne `act: 2`, `levelCap: 20`, `mechanics: {}`, `home: castle`, `defaultPlace: grauwacht`, `scars` wie Akt 1, `nodes: []` und einen Händler der Stufe 0 aus vorhandenen Teilen; `units.yaml` legt `jory` (minstrel), `ilka` (marksman), `odile` (skirmisher), `amos` (healer), `nell` (scout), `brann` (elementalist) und `sable` (`lieutenant`) mit Namen DE und EN an; `flags.yaml` ist leer (11.5)
**Und** `tests/unit/act-transition.test.ts` deckt Übergang, gesperrten Übergang, Replay, offene Akt-1-Nebenquests, Werte je Akt, Räume und doppelte IDs ab; die Abdeckung von `src/core` sinkt nicht; Architektur §5.4/§5.5/§5.14 bekommt einen Absatz „Stand (Story 11.1)“.

### Story 11.2: Positionsstufe der Akt-2-Missionen

Als Spieler
möchte ich, dass Gegner und neue Gefährten in Akt 2 zu meinem Fortschritt passen, auch in den Paaren und Nebenquests,
damit jede Mission fordert, ohne zu überfordern.

**Akzeptanzkriterien:**

**Angenommen** `acts/act2/campaign.yaml` mit `positionLevel: { base: 11 }` `[ASSUMPTION]` als Startwert; den endgültigen Wert setzt 11.4 nach der Messung (Produktinhaber 2026-11-07, Frage 6)
**Wenn** ein Knoten seine Stufe braucht
**Dann** liefert die reine Funktion `nodeLevel(data, c, node)` für Akte ohne `positionLevel` das Knotenfeld `expectedLevel` (Akt 1 unverändert) und sonst P = `base` + Zahl der erledigten Story-Knoten des Akts + `levelBonus` des Knotens; das gilt für Story- und Nebenquest-Knoten und ist replay-sicher
**Und** alle Leser von `expectedLevel` (Taverne, Heimsuchung, Weltkarte, Vorbereitung, Dev-Start, Simulation) lesen danach `nodeLevel`; die Weltkarte zeigt auf Knoten von Akt 2 „Stufe ≈ P“ über `ui.map.level`.

**Angenommen** Karteneinheiten von Akt 2
**Wenn** eine Karte geladen wird
**Dann** tragen sie `levelOffset` von −3 bis +2 statt `level`, auch in Verstärkungen und `spawn`-Triggern (Richtwerte: Start P−3, Wellen P−2, Elite P−1, Leutnants P+1, Boss P+2; GDD-Log 2026-11-05); `createBattle` rechnet `nodeLevel + levelOffset`, das Ergebnis steht im Startzustand
**Und** `content:check` verlangt auf Karten von Akt 2 `levelOffset` für alle Gegner und meldet Werte außerhalb −3 bis +2; `level` aus den Entwürfen gilt nur noch als Kommentar; `levelCap` gilt nur für die Truppe.

**Angenommen** ein Gefährte von Akt 2 tritt bei
**Wenn** sein Datensatz entsteht
**Dann** ist seine Stufe max(`level` der Definition, P − 1), die Werte steigen ohne Zufall um den Erwartungswert des Wachstums (wie `joinLieutenant`)
**Und** Heimsuchungen in Akt 2 fallen ohne Story-Karte nicht auf Stufe 1 zurück, sondern nehmen den letzten Akt mit Karten
**Und** `tests/unit/position-level.test.ts` deckt `nodeLevel` (Akt 1 und 2, beide Positionen eines Paars, Nebenquest früh und spät), `levelOffset`, Beitrittsstufe und Rückfall ab; die Fixture `tests/fixtures/maps/dev_eisenmark.yaml` startet mit `__hc.devMap('dev_eisenmark', 2)`.

### Story 11.3: Paket `act2`, Weltkarte und Titeltafel

Als Spieler
möchte ich beim Übergang eine Titeltafel sehen und die Eisenmark aus dem Nebel treten sehen,
damit der neue Akt als Ereignis beginnt.

Diese Story ist zusammen mit 11.1 der erste Live-Schritt von Akt 2 (F1).

**Akzeptanzkriterien:**

**Angenommen** das Paket `act2` in `content/packs.yaml`
**Wenn** gebaut wird
**Dann** hat es `load: background`, `act: 2`, ein Budget `[ASSUMPTION]` und `content: [acts/act2/**, locales/*/act2.*]`; Bilder und Modelle von Akt 2 stehen als Globs vor dem Paket `act1`; es wird mit dieser Story `released: true`, sobald Story 9.14 (Release von Akt 1) auf `main` ist; vorher bleibt es `released: false`, Entwickler laden es lokal über einen Schalter
**Und** Dateien unter `acts/actN/` kommen nur in den Build, wenn `actN` veröffentlicht ist (Test in `tests/unit/packs*.test.ts`); `core` und `act1` wachsen nicht
**Und** `duePacks` lädt `act2`, sobald `c.act ≥ 2` ist; ist es noch nicht geladen, zeigt die Weltkarte den Ladezustand (Story 7.2).

**Angenommen** die Weltkarte v5 (Stories 15.7, 15.12)
**Wenn** `c.act` gerade 2 geworden ist
**Dann** erscheint einmal die Titeltafel „Akt 2 · Glut“ (`act.2.title`, Feld `c.actTitleSeen`), danach lichtet sich der Nebel über Hochland und Küste bis an Aurenhall; Orte ohne spielbare Mission bleiben unter Nebel, und solange keine Mission offen ist, zeigt die Weltkarte das Band „Weitere Missionen folgen“ (`EXPERIENCE.md` State Patterns, UX-Log 2026-11-07); das Akt-Band zeigt „Akt 2 · Herbst – Glut“ (`act.2.season`)
**Und** die Knoten von Akt 2 liegen an den Orten aus `geografie-valmora.md` (Windscharte, Salzpass, Rabenweide, Brandhang, Silberquell, Krähenholm, Kontor, Kronfeld, Kupferhall, Aue-Insel, Jagdgründe), Stadtbilder als Sprites wie in 15.12; Fehlendes zeigt den Rückfall aus 15.7
**Und** nach dem Merge sperrt `pnpm content:lock` die IDs von `act2` (Kopfdateien, Knoten-Platzhalter); ein Fixture-Spielstand „Akt 2 ohne Missionen“ liegt unter `tests/fixtures/saves/` für die folgenden Live-Schritte
**Und** Brandhang hat eine Zustandsvariante „verbrannt“ (`site.variants`, nach E7 `obey`); Bild und Prompt liegen unter `art/prompts/`; Tests decken `actTitleSeen`, `duePacks` und die Build-Regel ab.

### Story 11.4: Simulation über Akte

Als Produktinhaber
möchte ich Akt 2 in der Simulation verkettet nach Akt 1 und an jeder möglichen Position einer Mission spielen lassen,
damit jede Missions-Story ihren Korridor prüfen kann.

**Akzeptanzkriterien:**

**Angenommen** `pnpm sim --campaign act2`
**Wenn** ein Lauf startet
**Dann** spielt er Akt 1 bis zum Finale, wechselt per Übergang in Akt 2 und spielt dessen Folge; der Bericht nennt Armee-Stufe und Gold beim Eintritt, die Goldkurve prüft `perAct['2']`
**Und** neue Optionen: `--start expected` (Startarmee auf P ohne Akt-1-Lauf), `--position <k>` (setzt P), `--order` (Reihenfolge innerhalb der Paare), `--flags e07=warn` (Ausgang einer Entscheidung), `--map-file <pfad>`; sie stehen im Kopf von `tools/simulate.ts`
**Und** `tests/unit/sim-acts.test.ts` belegt gleichen Bericht bei gleichem Seed sowie die Wirkung von `--position`, `--order` und `--flags`
**Und** aus der gemessenen Armee-Stufe beim Eintritt (Akt 1 bleibt, wie er ist: vor 1-8 auf Normal 8,6, mit Heimsuchungen 9,5; 1-7 bekommt keine eigene EP-Quelle, GDD-Log 2026-11-07) setzt die Story `positionLevel.base` von Akt 2 und trägt Wert und Messung ins GDD-Log ein (Produktinhaber 2026-11-07, Frage 6).

### Story 11.5: Gefährten, Leutnants und Flags von Akt 2

Als Spieler
möchte ich in Akt 2 neue Gefährten und vier Leutnants mit eigenem Charakter treffen,
damit der Akt neue Gesichter, Rivalen und Beute bringt.

**Akzeptanzkriterien:**

**Angenommen** `acts/act2/units.yaml` aus 11.1
**Wenn** die Werte ergänzt sind
**Dann** haben die Gefährten Basiswerte auf Stufe 10, Wachstum, Affinität, persönliche Fähigkeit, Ausrüstung und Supports nach der Fassung vom 2026-10-31 (`jory` `stage_presence`, `odile` `sworn_guard`, `nell` `smugglers_stash`, `brann` `buried_glow`, `amos` `field_surgeon`, `ilka` `still_hunter`, `sable` `old_orders`) `[ASSUMPTION]`
**Und** die Beitritte folgen der Missionsliste: Jory in 2-1, Ilka in 2-3, Odile und Amos in 2-5, Nell in 2-6, Brann nur in N5 (Ilka spricht ihn an, sonst Lucan), Sable nur bei E7 „warnen“ in 2-4; Varek (N2) und Brann sind optional, Szenen und Entscheidungen ohne sie entfallen ohne Lücke.

**Angenommen** `acts/act2/lieutenants.yaml`
**Wenn** `content:check` läuft
**Dann** sind vier Leutnants zu Fuß angelegt, mit Klasse, Fraktion, Signatur, drei Groll-Fähigkeiten ohne Flieger-Bezug, Titel und Szene `scn.lt.<id>` `[ASSUMPTION]`:

| ID | Klasse | Fraktion | Rolle | Signatur (neu, wo Flieger-Bezug) | Missionen |
|---|---|---|---|---|---|
| `rowena` | `knight` | `silver_lance` | Lanzenritterin, verteidigt ihr Gestüt | `rowenas_lance` statt `wing_lance` (`silver_lance` bleibt die Silberlanze von Akt 3, Produktinhaber 2026-11-09) | 2-3, 2-8 |
| `brakka` | `marksman` | `free_blades` | Ballistenmeisterin, Söldnerin | Bogen statt `wyvern_cleaver` | 2-1, 2-7, 2-8 |
| `grell` | `skirmisher` | `silver_sea` | Kaperkapitän, Maelis' Schmuggler | `gold_hook` | 2-2, 2-4, 2-6, 2-8 |
| `sable` | `duelist` | `iron_march` | Dravns Offizierin, `joins: true` | `dravns_oath` | 2-4 (ohne Kampf), 2-5, 2-6, 2-8 |

**Und** Groll-Fähigkeiten mit Flieger- oder Reittier-Bezug (`dive`, `wing_retreat`, `wyvern_dive`, `scale_hide`, `over_the_lines`) sind ersetzt, Brakkas zum Beispiel durch Ballisten-Bezug (Schuss +1 Reichweite, Bediener hält stand); es gibt keine Klasse `brakka_wyvern`
**Und** die Szenen `scn.lt.<id>` haben `first`, `grudge_1..3`, `flee_1..3`, `mock`, Sable zusätzlich `join`; die erste Begegnung spielt `first`, egal in welcher Mission.

**Angenommen** der Block „Akt 2: Stahl-Tier“ in `items.yaml` und die Akt-Schlüssel in `balance.yaml`
**Wenn** sie ergänzt sind
**Dann** gibt es die Stahl-Teile aus `items.md` §6.1/§6.6 nach der Ableitungsregel der Fassung vom 2026-10-31, die vier Signaturen (`rarity: legendary`), `materialByAct: { 2: moonsteel }` und die Händler-Stufen 1 und 2 von Akt 2 `[ASSUMPTION]`; Händler-Stufe 3 und die Liste `roomLevel: 2` gehören Story 10.9.

**Angenommen** `content/acts/act2/flags.yaml`
**Wenn** `content:check` läuft
**Dann** sind alle Flags deklariert, bevor eine Missions-Story sie nutzt: `e05`, `e06`, `e07`, `e08`, `joined_sable`, `maelis_ledgers` (`season2: true`), `chronicle_read` (`season2: true`); die Platzhalter `e7_order`/`e7_warned` der Entwürfe sind auf `e07` umgestellt; Brandhang brennt allein über `e07: obey`, ohne eigenen Flag (Produktinhaber 2026-11-09)
**Und** auf `dev_eisenmark` zeigen Steckbrief, Groll, Flucht und Kopfgeld die neuen Daten; Tests decken Beitrittsstufe und Groll-Fähigkeiten ab.

### Story 11.6: Balliste

Als Spieler
möchte ich Ballisten bedienen, erobern und gegen mich gerichtet sehen,
damit Geschütze den Akt taktisch prägen.

Die Balliste steht schon in Schema, Zustand und Brett (`type: ballista`), die Regel fehlt in `src/core`.

**Akzeptanzkriterien:**

**Angenommen** ein Kartenobjekt `type: ballista`
**Wenn** eine Figur auf einem Nachbarfeld steht (jedes Team)
**Dann** kann sie mit der Aktion `{ kind: 'ballista'; object; target }` schießen: Werte aus dem Item `ballista_bolt` (`mt: 12`, `hit: 70`, `crit: 0`, `rng: [3, 10]`, Gruppe `siege` außerhalb des Dreiecks, Tag `fixed`), Schaden mit STR des Bedieners, kein Gegenangriff, unbegrenzte Munition, ein Schuss je Zug statt der Aktion
**Und** sie zählt als Fernkampf: +1 Reichweite von einer höheren Stufe auf jede tiefere (GDD-Log 2026-11-05), Nebel begrenzt die Ziele
**Und** Vorschau und Auflösung laufen über denselben Formelcode (synthetische Waffe `ballista:<objectId>`, Optionen in `AttackMods`), das Ballistenfeld ist nicht betretbar, das Kontext-Band bietet „Balliste“ an.

**Angenommen** die Gegner-KI und das Autoplay
**Wenn** eine Balliste auf der Karte steht
**Dann** nutzt ein Gegner sie nur mit Profil `hold` oder wenn er schon daneben steht (Produktinhaber 2026-10-31); das Autoplay des Spielers nutzt sie, wenn der Schuss besser ist als der beste Angriff; die Gefahrenzone (13.5) zählt Bediener mit Ballisten-Reichweite.

**Angenommen** die Lektion
**Wenn** Story 11.12 sie in 2-1 auslöst
**Dann** stehen `scn.m2_1.tutorial_ballista` und der Handbuch-Eintrag „Balliste“ (`lesson_ballista`, Kontext-Anker) bereit
**Und** `tests/unit/ballista.test.ts` deckt Nachbarschaft, Reichweite 2/3/10/11, Höhe, Nebel, kein Gegenangriff, Vorschau = Auflösung, Leutnant-Flucht, KI-Regel und Replay ab; das Modell kommt aus der Galerie oder Blender.

### Story 11.7: Gegner, Herbst und Heimsuchungen von Akt 2

Als Spieler
möchte ich in Akt 2 auf neue Gegnergruppen im herbstlichen Hochland und an der Küste treffen,
damit der Akt sich anders anfühlt als Akt 1.

**Akzeptanzkriterien:**

**Angenommen** die generischen Gegner von Akt 2 aus vorhandenen Klassen
**Wenn** sie auf Karten und in Heimsuchungen stehen
**Dann** gibt es Eisenmark-Soldaten (`vanguard`, `skirmisher`, `marksman`), Ritter der Silbernen Lanze zu Fuß (`knight`), Kaperfahrer (`brigand`, `skirmisher`, `marksman`), Söldner und Kontorwachen mit eigenen Namen DE und EN; `knight` ist auf Stufe 8–20 geprüft (verwundbar gegen Axt, Magie, Panzerstecher)
**Und** es gibt keine Flieger, keine Reiter und keine Klasse `cavalier`; `pegasus_knight` bleibt im Code für Staffel 2, aber auf keiner Karte und in keinem Pool.

**Angenommen** Herbst auf dem Brett
**Wenn** eine Karte von Akt 2 oder eine Heimsuchung in Akt 2 läuft
**Dann** folgen Boden, Bäume und Tönung `map-assets/jahreszeiten-plan.md` (Herbst), die Jahreszeit richtet sich nach `c.act`, nicht nach dem Ordner der Karte; Wetter `clear`, `fog`, `rain`, Ausnahmen `ash` in 2-4 und `snow` in N4
**Und** ein Bild vergleicht dieselbe Testkarte in Akt 1 und Akt 2
**Und** im Handy-Test von Akt 2 ist geprüft, dass rote Gegnerringe auf Herbstlaub gut zu sehen sind; nur bei Bedarf wird das Laub weiter entsättigt (`GRADE` in `tools/art/ground.py`; Produktinhaber 2026-11-07 zu Story 15.15).

**Angenommen** `content/acts/act2/haunts.yaml`
**Wenn** Heimsuchungen entstehen
**Dann** gibt es Pools je Fraktion ohne Flieger (`iron_march`, `silver_lance` mit `knight` statt `pegasus_knight`, `silver_sea`, `free_blades`) mit Stahl-Waffen, `civilian` und `chestLoot` `[ASSUMPTION]`; Gegner stehen auf `hauntLevel`
**Und** Brettfiguren: Grenzheer nutzt `soldier`; Ritter der Lanze und Kaperfahrer nutzen vorhandene Modelle als Platzhalter, auch live und über Akt 2 hinaus; neu entschieden wird erst nach 11.27 (F2, Produktinhaber 2026-11-07, Frage 10; vermerkt in `art/README.md`); Brann behält sein Modell.

### Story 11.8: Ziel-Phasen (Kern)

Als Spieler
möchte ich, dass ein Missionsziel mitten im Kampf wechseln kann,
damit eine große Schlacht wie Kronfeld erst Halten und dann Flucht verlangt.

**Akzeptanzkriterien:**

**Angenommen** eine Karte mit `victory: { type: survive, turns: n, then: { type: escape, area, min, must: [avatar, lucan] } }`
**Wenn** Runde n endet oder ein Trigger die Phase wechselt
**Dann** gilt danach `escape` (Event `objectiveChanged`, Rundenpille und Zieltext wechseln, die Fluchtzone erscheint), ein Trigger `objective_changed` kann eine Szene starten
**Und** der Sieg fällt, sobald Avatar und Lucan geflohen sind und mindestens `min` Figuren (Kronfeld: 6, Vorschlag aus dem Entwurf) das Ufer erreicht haben; Lucan flieht als Letzter wie bisher
**Und** Schema, Typen, `objectives.ts`, KI, Autoplay und `content:check` kennen die Phase; Tests decken Wechsel, Sieg, Niederlage und Replay ab; Fixture `tests/fixtures/maps/dev_phases.yaml`; Architektur §5.7 bekommt einen Absatz „Stand (Story 11.8)“.

### Story 11.9: Relikt-Stufen

Als Spieler
möchte ich, dass Relikte mit der Geschichte erwachen,
damit besondere Fundstücke mit dem Akt mitwachsen.

**Akzeptanzkriterien:**

**Angenommen** Relikte nach `items.md` §5
**Wenn** ein Relikt eine Stufe erreicht
**Dann** beschreibt das Item `stages` mit Bedingung, Bild und Wirkung; die Stufe ist eine reine Funktion des Kampagnenstands, Vorschau und Werte lesen sie
**Und** `dragon_ember` (Stufe 1 schlafend MAG +2) und `pact_warden_shield` (Stufe 2 ab `completed m1_6`; Id aus Akt 1, mit 9.14 gesperrt) sind angelegt `[ASSUMPTION]`; Stufen ab `completed m2_8` trägt 11.19 ein
**Und** ein Spielstand aus dem Akt-1-Release mit Schild und erledigtem `m1_6` zeigt sofort Stufe 2; Tests decken Stufenwechsel und Vorschau = Auflösung ab.

### Story 11.10: Format-Reste für die Akt-2-Entwürfe

Als Leveldesigner
möchte ich alles im Spielformat ausdrücken können, was die abgenommenen Akt-2-Entwürfe verlangen,
damit keine Karte einen Sonderfall im Code braucht.

**Akzeptanzkriterien:**

**Angenommen** die 11 Entwürfe `levels/s2_*.yaml`
**Wenn** bedingte Pflichtfiguren (Ilka in N4, Jory in N6 nur, solange sie leben), Einheiten mit `requires` auf Flags (Sable oder Hauptmann nach E7), Gast-Einheiten `team: other` als Schutzziel (Brann in 2-4, nicht steuerbar, `ignoreForRout`) und Warnungen vor `set_terrain` (eine Runde vorher, Zeile und Markierung) als Schema, Regel und Darstellung vorliegen
**Dann** bestehen alle 11 Entwürfe `content:check` ohne Ausnahme
**Und** Steinschlag (2-2), Feuer und Schneise (2-4), gekappte Brücke (2-5), Ebbe und Flut (2-6, N6), Kran-Steg (2-7) und Brückentor (2-8) laufen über `set_terrain`, Hebel und Trigger, je mit einem Test.

**Angenommen** das Level-Blatt (`pnpm levels`)
**Wenn** es eine Karte mit `terrace`, `crag`, `ramp`, `stairs`, `ladder`, `vault`, `footbridge` oder `gate_closed` zeichnet
**Dann** hat jedes dieser Gelände eine Farbe und kein „?“; die Abnahme-Ansichten von Akt 2 sind neu erzeugt.

### Story 11.11: Kampagnenfolge von Akt 2

Als Spieler
möchte ich Akt 2 in der Folge der abgenommenen Missionsliste spielen,
damit Weg und Geschichte zusammenpassen.

**Akzeptanzkriterien:**

**Angenommen** `acts/act2/campaign.yaml`
**Wenn** die Folge `2-1 → (2-2 ∥ 2-3) → 2-4 → (2-5 ∥ 2-6) → 2-7 → 2-8` gilt, mit höchstens 2 offenen Story-Missionen, N4 nach 2-3 (Ilka in der Truppe), N5 nach 2-4 und N6 mit 2-7 (Jory in der Truppe)
**Dann** prüft ein Test jede erlaubte Reihenfolge, und keine verletzt „kein Ziel zweimal hintereinander“ (nur Story-Missionen)
**Und** offene Nebenquests bleiben bis 2-8 spielbar, Akt-1-Nebenquests bleiben offen; die Knoten sind bis zu ihrer Missions-Story Platzhalter ohne Karte, die die Weltkarte nicht anbietet.

### Story 11.12: Mission 2-1 „Wind über der Eisenmark“ und zwei Angebote

Als Spieler
möchte ich in der Windscharte unter Ballistenfeuer durchhalten und die Balliste selbst wenden,
damit Akt 2 mit neuem Land und neuer Regel beginnt.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_2_1_windscharte` (M 20 × 25, `survive` 10 Runden, 9 eigene gegen 24, Leutnant Brakka)
**Wenn** er nach den gemeinsamen Regeln übernommen ist
**Dann** lösen die Felsnasen die Lektion Balliste aus (11.6), Söldnerwellen kommen in Runde 3, 6 und 9, in Runde 7 von hinten; Jory am Gauklerwagen tritt durch Ansprechen bei, das Passhospiz heilt im Schussfeld
**Und** in Runde 8 zieht ein Drachenschatten über die Scharte (Saat Drachen, nur Szene); in der Nachszene bieten Seraphine und Dravn den Freispruch an, Maelis noch nicht.

### Story 11.13: Mission 2-2 „Das Siegel im Salzpass“

Als Spieler
möchte ich im Nebel des Salzpasses das Siegel der Prinzessin bergen,
damit der erste Zweifel an Seraphine wächst.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_2_2_salzpass` (K 16 × 20, `treasure` 11 Runden, 7 gegen 16, Leutnant Grell, Nebel, veränderliche Karte)
**Wenn** er übernommen ist
**Dann** engt der Steinschlag in Runde 3, 5 und 8 Süd-, Nordenge und Leiste ein, die Straße bleibt offen; Fenn öffnet die Siegeltruhe ohne Schlüssel, sonst trägt ihn Grells Zahlmeister; Grells Nachhut kommt in Runde 6
**Und** Grell bringt Maelis' Schmuggelware über den Pass; die Kundschafter aus Kharesh im Westwinkel tragen die Saat in ihrer Truhe; niemand tritt bei.

### Story 11.14: Mission 2-3 „Die Rabenweide“

Als Spieler
möchte ich auf dem Gestüt der Silbernen Lanze gegen Rowena kämpfen,
damit Dravns erste kleine Lüge und Rowenas Ehre sichtbar werden.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_2_3_rabenweide` (M 22 × 26, `boss` Rowena, 9 gegen 24)
**Wenn** er übernommen ist
**Dann** kämpft Rowena zu Fuß mit ihren Rittern am Gestütshof und gibt nach ihrer Niederlage auf; Flanken kommen in Runde 3 und 5, die drei Furten sind die Engstellen; Pferde stehen nur als Kulisse (Deko-Pferd aus 11.24)
**Und** Ilka im Wald am Nordostufer tritt durch Ansprechen bei und öffnet N4; Rowena lässt einen verwundeten Gefährten versorgen (Saat Rowena).

### Story 11.15: Mission 2-4 „Die Brandschneise“ und Entscheidung E7

Als Spieler
möchte ich ein Bergdorf gegen Feuer und Plünderer halten, während Brann die Schneise reißt,
damit Dravns Lüge platzt und die Lage der Truppe kippt.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_2_4_brandschneise` (G 30 × 40, `defend` Brann 12 Runden, 12 gegen 38, Leutnant Grell, Asche, veränderliche Karte)
**Wenn** er übernommen ist
**Dann** frisst sich das Feuer von Norden durch den Wald, Brann (Gast, nicht steuerbar) reißt in Runde 3 und 6 die Schneise, Plünderer gehen auf die Häuser, Grell kommt in Runde 6 über das Verbrannte; Sable steht als Dravns Offizierin auf einer Lichtung und greift nicht ein
**Und** Brann flieht nach dem Sieg in die Minen von Kupferhall (öffnet N5); die Chronik-Seite liegt in der Köhlerruine.

**Angenommen** die Nachszene
**Wenn** E7 fällt
**Dann** bei `warn` warnt die Truppe das Dorf, Sable bindet sich das glutorange Tuch um und tritt bei (`joinLieutenant`, Groll erlischt); bei `obey` brennt Brandhang (Weltkarten-Variante aus 11.3), Händler −10 % in Akt 2 über `priceMod`, Sable bleibt Leutnant; Summe und Deckel der Rabatte baut 10.9
**Und** das Grenzheer jagt die Truppe, Maelis bietet als Dritte an; Saat Dravn (Feuer gegen Drachen) und die Spur Dravn–Maelis sind gesetzt.

### Story 11.16: Mission 2-5 „Die verstoßene Leibwache“ und Entscheidung E5

Als Spieler
möchte ich Odile aus dem Kloster Silberquell über die Schlucht bringen, während Sable mich jagt,
damit ich von Halvards Briefen erfahre.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_2_5_silberquell` (M 20 × 25, `escort` Odile, 9 gegen 22, veränderliche Karte)
**Wenn** er übernommen ist
**Dann** kappen Sables Leute in Runde 6 die Westbrücke (Warnung in Runde 5), Schützen am Nordrand schießen weiter; Sable hält den Ausgang, nach E7 `warn` ein Hauptmann des Grenzheers mit gleichen Werten
**Und** Odile tritt mit der Eskorte bei, Amos im Hospiz durch Ansprechen; Saat Stimme: Odile erzählt von Halvards Briefen.

**Angenommen** die Nachszene
**Wenn** E5 fällt
**Dann** bietet Seraphine Odile die Rückkehr in die Garde an; bei `return` geht Odile mit Abschiedszeile, ihre Ausrüstung in den Konvoi, `e05` bestimmt ihre Zeile in Kronfeld
**Und** die Akademie behält ihre gebaute Stufe; erreicht sie Stufe 3 nicht mehr, weil Varek fehlt oder bei E6 geht, nennt die Folgen-Karte den Wegfall von Stufe 3 (F3, Produktinhaber 2026-11-06); hat die Akademie schon Stufe 3, entfällt der Hinweis.

### Story 11.17: Mission 2-6 „Gold für Banditen“ und Entscheidung E6

Als Spieler
möchte ich auf Krähenholm beweisen, dass das Gold der Banden aus Dravns Kasse über Maelis floss,
damit beide Spuren zusammenlaufen.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_2_6_kraehenholm` (M 22 × 26, `rout`, 10 gegen 28, Leutnants Grell und Sable, veränderliche Karte)
**Wenn** er übernommen ist
**Dann** liegt die Sandbank nur von Runde 4 bis 8 frei (Warnung vor der Flut), der Klippenpfad ist bewacht; Sable übergibt auf der Felsnase Dravns Gold, nach E7 `warn` steht dort ein Hauptmann und Sable belastet Dravn in einer Szene
**Und** Nell im Nordwesten tritt durch Ansprechen bei; Maelis lässt die Truppe fallen; nur bei `e07: warn` zeigt `scn.m2_6.burnt_village` auf dem Rückweg ein von Drachenschatten verbranntes Dorf (Beat 9, nie zwei brennende Dörfer).

**Angenommen** die Nachszene und Varek in der Truppe
**Wenn** E6 fällt
**Dann** bietet Dravns Bote Varek die Begnadigung im Heer an; ohne Varek entfällt E6 ohne Szene; zum Hinweis auf die Akademie gilt dasselbe wie in 11.16 (F3): fällt E6 als zweite der beiden Entscheidungen, nennt ihre Folgen-Karte den Wegfall von Stufe 3.

### Story 11.18: Mission 2-7 „Das Kontor am Silbermeer“ und Entscheidung E8

Als Spieler
möchte ich in Maelis' Kontor die Geschäftsbücher holen,
damit ich einen Beweis gegen die Herzogin in der Hand habe.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_2_7_kontor` (M 20 × 25, `reach` Schreibstube, 10 gegen 26, Leutnant Brakka, Regen, veränderliche Karte)
**Wenn** er übernommen ist
**Dann** hält Brakkas Balliste die Steinbrücke unter Feuer, der Hebel am Kran legt einen Steg über das Becken, den Kontor-Schlüssel trägt der Zahlmeister (Fenn braucht keinen); Wellen in Runde 3, 5 und 7
**Und** die Chronik-Seite in der Schreibstube trägt die Saat Pakt (erste und letzte Seite aus derselben Hand); N6 öffnet mit dieser Mission, wenn Jory in der Truppe ist.

**Angenommen** die Nachszene
**Wenn** E8 fällt
**Dann** gibt `seraphine` die Bücher der Prinzessin (Grell-Groll −1, Zeile in Kronfeld), `sell` verkauft sie an Maelis zurück (+1 000 Gold `[ASSUMPTION]`); `maelis_ledgers` ist gesetzt.

### Story 11.19: Mission 2-8 „Kronfeld“ (Finale, große Schlacht)

Als Spieler
möchte ich am neutralen Treffpunkt den Verrat der Mächte überleben und über den Fluss ausbrechen,
damit Akt 2 mit „Die Krone war hohl“ endet.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_2_8_kronfeld` (G 30 × 40, `survive → escape` mit 11.8, 15 eigene gegen 40, Leutnants Rowena, Grell, Brakka, Sable)
**Wenn** er übernommen ist
**Dann** zögert Rowena in Runde 6, das Brückentor geht auf und ihre Leute halten still (Saat Rowena); die Furt im Osten wird ab Runde 9 von Lanzen gesperrt; Brakkas Balliste auf dem Osthügel reicht bis zum Treffpunkt; nach E7 `warn` führt im Süden der Hauptmann
**Und** Sieg mit 6 Figuren am Nordufer (Vorschlag, per Simulation geprüft); die Zeilen nach `e05`, `e08` und `joined_sable` sind eingebaut; die Relikt-Stufen ab `completed m2_8` (11.9) sind eingetragen.

### Story 11.20: Nebenquest N4 „Der Clan im Schnee“

Als Spieler
möchte ich Ilkas Clan im frühen Schnee gegen Dravns Vorposten halten,
damit Ilkas Herkunft ein Gesicht bekommt.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_n4_clan` (M 20 × 24, `survive` 9 Runden, 8 gegen 20, Schnee, Nebel, kein Leutnant)
**Wenn** er übernommen ist
**Dann** kommen die Vorposten im Nebel von allen Seiten, die Felsnase gibt als einzige Blick über den Nebel; die Clanälteste kann fallen (Nebenziel, keine Niederlage)
**Und** Ilka ist Pflicht, solange sie lebt (11.10); Belohnung Glutfunke und Ilkas Signaturbogen, auch in der Gedenk-Variante.

### Story 11.21: Nebenquest N5 „Glut unter dem Berg“

Als Spieler
möchte ich Brann in den Stollen von Kupferhall finden und ansprechen,
damit er sich der Truppe anschließt, statt sich vor seiner Glut zu verstecken.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_n5_mine` (K 16 × 20, `treasure` 4 Truhen in 12 Runden, 7 gegen 15, Innen, Nebel)
**Wenn** er übernommen ist
**Dann** führt die verschlossene Mitteltür (Schlüssel beim Vorarbeiter, Fenn braucht keinen) oder das Gatter mit Hebel in die Knochenhalle; Brann im Westgang tritt bei, wenn Ilka ihn anspricht, sonst Lucan; wer ihn nicht anspricht, hat ihn für die Staffel nicht, die Quest ist trotzdem gewonnen
**Und** die Drachenknochen im Fels tragen die Saat Drachen; die Truhen enthalten `dragon_ember` (11.9), Erd-Rune III, eine Chronik-Seite und Mondstahl
**Und** N5 gibt als Belohnung einen Glutfunken wie N4 (Entwurf `s2_n5_mine`, GDD „7 der 10 Nebenquests“; Produktinhaber 2026-11-07, Frage 9).

### Story 11.22: Nebenquest N6 „Die Gauklertruppe“

Als Spieler
möchte ich Jorys alte Truppe vom Herbstmarkt auf der Aue-Insel retten,
damit Jory seine Laute und seine Geschichte zurückbekommt.

**Akzeptanzkriterien:**

**Angenommen** der Entwurf `s2_n6_gaukler` (K 14 × 18, `escort` Gauklermeisterin, 7 gegen 16, veränderliche Karte)
**Wenn** er übernommen ist
**Dann** steht der Steg im Westen ab Runde 6 unter Wasser (Warnung in Runde 5), Schuldeneintreiber kommen mit Booten in Runde 3 und 5; Jory ist Pflicht, solange er lebt
**Und** Belohnung Jorys Signaturlaute `final_curtain` (nutzt das Anfeuern auf zwei Ziele aus 10.4), auch in der Gedenk-Variante.

### Story 11.23: Supports, Barks und Chronik-Szene von Akt 2

Als Spieler
möchte ich am Lagerfeuer die neuen Paare kennenlernen, die neuen Gefährten im Kampf hören und in der Burg die Chronik entziffern lassen,
damit Akt 2 Beziehungen und das Pakt-Geheimnis vertieft.

**Akzeptanzkriterien:**

**Angenommen** die 8 Paare von Akt 2 (Jory × Nell, Nell × Varek, ★ Varek × Odile, Odile × Sable, Sable × Ilka, ★ Ilka × Brann, Liora × Amos, Amos × Grosk)
**Wenn** ihre Gespräche geschrieben sind (`supports.yaml`, DE und EN)
**Dann** haben alle C, B und A, die Kernpaare zusätzlich S; der Rang folgt der Lagerfeuer-Stufe (Epic 10); Gespräche mit Figuren, die fehlen (Varek, Brann optional), gegangen (Odile nach E5, Varek nach E6) oder noch nicht beigetreten sind (Sable), erscheinen nicht
**Und** jeder Gefährte von Akt 2 hat etwa 6 Barks, eine Todeszeile und Trauerzeilen je Support-Partner.

**Angenommen** Beat 10 „Die Chronik“
**Wenn** die Truppe nach 2-4 in die Burg zurückkehrt (bei fester Folge die 3. Story-Mission)
**Dann** läuft einmal `scn.castle.chronicle` in der 3D-Burg: Liora entziffert die Chronik aus 1-7, sonst Ysolde, sonst Rhen; Kern „Der Pakt verlangt etwas von den Königen“
**Und** `chronicle_read` ist gesetzt, der Chronik-Eintrag wechselt auf „entziffert“; getestet für beide Reihenfolgen des ersten Paars.

### Story 11.24: Galerie-Modelle für Akt 2

Als Spieler
möchte ich auf den Karten von Akt 2 die Kulisse sehen, die beim Leveldesign abgenommen wurde,
damit Brett und Abnahme-Ansicht übereinstimmen.

Kommt aus Story 15.8, läuft parallel zu den Karten-Stories und vor 11.27. Weil jede Mission mit ihrem Merge live geht (F1), kommen die Modelle einer Karte am besten mit ihr; sonst geht die Karte mit Platzhaltern live.

**Akzeptanzkriterien:**

**Angenommen** die Galerie (`map-assets/groups/`), `map-assets/matrix.md` und die Karten von Akt 2
**Wenn** nur die Modelle in den Build kommen, die eine Karte von Akt 2 zeichnet (Paket `act2`, Auswahl im Art-Log), und fehlende laut Matrix entstehen (u. a. Koppel, Stall, Gestüt, Getreideterrasse, Bergdorf, Hängebrücke, Wasserfall, Kai, Lagerhaus, Kran, Gaukelbühne, Stollen, Lore, Drachenknochen, Fackel; Deko-Pferd für 2-3 in Blender ohne Reittier-Pipeline)
**Dann** besteht jedes Modell die vier Lesbarkeitsregeln (art-direction §3.2), Dreiecks- und Paket-Budget halten
**Und** `content:check` meldet kein fehlendes Modell; Modelle, die schon in `act1` liegen, stehen mit Paket-Entscheidung im Art-Log.

### Story 11.25: Brettfigur Rowena (Schritt 3, verkleinert)

Als Spieler
möchte ich Rowena auf dem Brett so sehen wie in ihrem Porträt,
damit ich sie wiedererkenne.

**F2 (Produktinhaber 2026-11-06):** Nur Rowena entsteht neu, mit dem Rest-Guthaben (205 Credits, eine Figur zu 140). Brann behält sein Modell, Ritter der Lanze und Kaperfahrer nutzen Platzhalter aus 11.7; über sie entscheidet der Produktinhaber erst nach 11.27 (Frage 10 vom 2026-11-07). Brakka bleibt, wie sie ist.

**Akzeptanzkriterien:**

**Angenommen** `concept/23-art-direction/figuren-bestand.md` und die Figurenblätter von Rowena (Lanzenritterin zu Fuß, Helm unterm Arm) und Brakka (Ballistenmeisterin) auf dem Stand der Missionsliste
**Wenn** Rowena neu entsteht (Turnaround → Tripo → Pipeline nach Art Direction §4.6) und Brakkas Figurenblatt ohne neues Modell auf Ballistenmeisterin berichtigt ist
**Dann** besteht Rowena den Silhouettentest im Zoom „Mittel“ und bleibt im Budget (7 000 Dreiecke, 512er-Textur, 0,5 MB)
**Und** Prompts und Abnahmen liegen unter `art/prompts/`; Figuren-Bestand und `art/README.md` sind nachgezogen; Rowenas Platzhalter ist ersetzt, die übrigen bleiben.

### Story 11.26: Leistung von Akt 2

Als Spieler
möchte ich auch in der Brandschneise und in Kronfeld flüssig spielen,
damit die großen Schlachten von Akt 2 auf dem Handy funktionieren.

**Akzeptanzkriterien:**

**Angenommen** die Stories 11.15 und 11.19 und die Messung aus Story 15.11
**Wenn** auf dem Referenzgerät 2-4 (Feuer, `set_terrain` je Runde) und 2-8 (rund 60 Figuren, Ballisten) gemessen werden
**Dann** halten beide die Leistungsziele aus NFR1 in der Fassung von 15.11; reicht das nicht, sinkt erst die Gegnerzahl in Absprache mit der Abstimmung, dann wird optimiert
**Und** Gegnerphase mit Schnelldurchlauf und Kamera auf 30 × 40 funktionieren wie in Akt 1; die Messung steht in der Story.

### Story 11.27: Akt 2 abstimmen und abschließen

Als Produktinhaber
möchte ich Akt 2 über alle Reihenfolgen abgestimmt und abgeschlossen sehen,
damit Spieler aus Akt 1 ohne Brüche und im Korridor weiterspielen.

Akt 2 ist zu diesem Zeitpunkt schon live, Mission für Mission (F1). Diese Story stimmt den ganzen Akt ab und schließt ihn ab.

**Akzeptanzkriterien:**

**Angenommen** alle Stories von Epic 11 sowie 10.1–10.12 auf `main`
**Wenn** `pnpm sim --campaign act2 --runs 50` die verkettete Kampagne mit Aufstiegen spielt
**Dann** liegen alle Story-Missionen auf allen Schwierigkeiten in den Korridoren (NFR12), 2-8 am oberen Rand; die Armee weicht höchstens `levelTolerance` von P ab; Gold je Mission in `perAct['2']`
**Und** geprüft sind beide Reihenfolgen beider Paare, je mit E7 `warn` und `obey`, mit und ohne Varek und Brann; N4–N6 an früher und später Position
**Und** Wertänderungen stehen nur in YAML und im GDD-Log; die Rabatt-Summe bleibt ≤ −30 %, die Glutfunken von Akt 2 passen zur Rechnung des GDD; die Spielzeit von Akt 2 passt zu rund einem Drittel von 30–35 Stunden.

**Angenommen** der Abschluss von Akt 2
**Wenn** der Produktinhaber ihn auslöst
**Dann** sperrt `pnpm content:lock` alle restlichen IDs, Fixtures aus dem Akt-1-Release und aus jedem Live-Schritt von Akt 2 laden ohne Verlust; ändert sich das Speicherformat, gibt es Migration und Fixture
**Und** Wertänderungen der Abstimmung gelten für laufende Spielstände ab der nächsten Mission, ohne Migration
**Und** ein Playtest-Plan für Akt 2 (Folge, Verrat in Kronfeld, Balliste, Höhen) liegt vor (`gds-playtest-plan`); alle Prüfungen sind grün, der Pull Request gegen `main` nennt die Ergebnisse.

### Story 11.28: Die Simulation wirbt an

Als Produktinhaber
möchte ich, dass die verkettete Kampagnen-Simulation Söldner anwirbt wie ein vernünftiger Spieler,
damit die Messung über die ganze Kampagne (vor allem 2-8) eine Truppe in voller Stärke zeigt und Akt 2 nach Epic 10 belastbar neu abgestimmt werden kann.

Folge-Story aus 11.27 (Antwort 6 B vom 2026-11-10): verkettet lag 2-8 auf Normal bei 5 %, im Lab mit voller Truppe bei 85 %, weil die Sim-KI kaum anwirbt.

**Akzeptanzkriterien:**

**Angenommen** die Heimat-Heuristik der Kampagnen-Simulation (`tools/simCampaign.ts`)
**Wenn** zwischen zwei Missionen die Taverne Angebote hat und die Truppe kleiner ist als das Einsatz-Limit der nächsten Mission
**Dann** wirbt sie Söldner an (höchste Stufe zuerst), solange mindestens `simulation.hire.reserve` Gold übrig bleibt, und zwar nach dem Heilen der Narben und vor Heiltränken und Aufwertungen
**Und** die Angebote kommen aus dem Seed-RNG der Kampagne, gleiche Seeds geben gleiche Läufe; der Bericht nennt Söldner und Anwerbe-Gold je Lauf.

**Angenommen** die neue Heuristik
**Wenn** `pnpm sim --campaign act1` und `--campaign act2` auf Leicht, Normal und Schwer mit 50 Läufen laufen
**Dann** steht die Messtabelle mit dem Vergleich zu 11.27 in der Story; `balance.yaml` ändert keine Spielwerte, Auffälligkeiten gehen als Bericht an den Produktinhaber.

