# Lückenliste: Planung gegen die Überarbeitung

> Stand 2026-11-05, Abgleich mit main (`bb063c6`). Quellen: `roadmap.md`, Decision-Logs von GDD, Narrative, Art Direction, Architektur und UX seit 2026-11-01, `concept/22-narrative/missionsliste-s1.md`, `concept/26-epics/epics/`. **Nichts hiervon ist in die Epics übernommen.** Der Story-Vorschlag steht in `umbau-stories-entwurf.md`.

## Entscheidungen für den Produktinhaber

| # | Frage | Warum sie offen ist | Empfehlung |
|---|---|---|---|
| 1 | Neues Epic für den Umbau oder Stories 9.x wieder öffnen? | Die Stories 9.1–9.13 sind fertig, ihre Karten und Teile der Szenen werden aber ersetzt | Neues Epic 15; 9.1–9.13 bleiben als erledigt stehen |
| 2 | Bleiben die Brettfiguren oder entstehen sie neu? | Art-Log 2026-11-01: „Brettfiguren bleiben unverändert“; der Auftrag für diese Planung verlangt Brettfiguren zu den neuen Porträts | Beschluss aufheben, nach dem Bestandsabgleich nur Figuren mit sichtbarem Widerspruch neu bauen, Story-Figuren von Akt 1 zuerst |
| 3 | Heißt die Figur im Spiel Kael oder Lucan? | Art-Log und Porträt-Vorlage sagen Lucan, Narrative-Log, Missionsliste, Epics und aller Spielinhalt sagen Kael | Vor dem Umbau der Szenen entscheiden; eine Umbenennung kostet vor dem ersten `content:lock` am wenigsten |
| 4 | Was muss vor dem Release von Akt 1 fertig sein? | Story 9.14 verlangt alle Stories aus Epic 1–9, also auch den Tonbruch-Test 8.1 und das Audio 8.8 und 8.9; Audio soll laut früherer Vorgabe erst am Ende kommen | Karten, Weltkarte, neue Kampagnenfolge, Tonbruch-Test und Leistungsmessung sind Pflicht; Audio blockiert nicht, die neuen Modelle nur, soweit Karten von Akt 1 sie brauchen |
| 5 | Gibt es in Staffel 1 noch fliegende Gegner? | Keine Flug-Reiter (GDD-Log 2026-11-01), trotzdem bekam die Höhenregel am 2026-11-05 Flieger-Sonderfälle; Epic 11 plant `pegasus_knight`-Gruppen und eine Flieger-Lektion | Keine in Staffel 1; die Flieger-Regel bleibt im Kern für Staffel 2 |
| 6 | Reiten eigene Figuren in Staffel 1? | „Reit-Mechanik nur vorbereitet“ gegen „Reiterei zu Pferd“ mit Lektion in 2-1; Treppenregel und Eis in 3-4 nennen Reiter; `mounted` steht im Schema, aber keine Klasse nutzt es | Nur Gegner reiten in Staffel 1 (Rowena und Lanzenreiter mit `mounted`); eigene Reiter erst in Staffel 2 |
| 7 | Wann wird Epic 11 neu geschnitten, und läuft Akt 2 weiter sofort live? | Die Level von Akt 2 sind noch in Arbeit; 11.1 wurde vor der Überarbeitung als „sofort live“ beschlossen | Neu schneiden, wenn die Akt-2-Level abgenommen sind; Akt 2 erst nach dem Release von Akt 1 auf main freischalten |

Dazu ohne Eile zu bestätigen: „10–15 Charaktere“ meint eigene Einheiten (Roadmap, Annahme); Hebel vom Nachbarfeld (GDD-Log, Annahme [C]); Burgstufen-Schwellen 1/6/14 (Art-Log, `[ASSUMPTION]`); Zeitpunkt des Vorwerks am Passfuß (Narrative-Log 2026-11-04: „zu planen“).

## Epic 8

| Story | Lücke |
|---|---|
| 8.1 Tonbruch-Test | Weiter offen und nötig. Muss nun mit den Porträts v2.5 laufen, Ergebnis fehlt im Art-Log |
| 8.3 Brettfiguren | Als fertig gezählt, die Figuren entstanden aber vor den neuen Porträts. Siehe Entscheidung 2 |
| 8.4 Porträts | Überholt durch die 51 Porträts nach `portrait_master.md` v2.5. Bleibt erledigt, kein Nacharbeiten |
| 8.7 Titelbild | Zeigt laut Story Kael und Rhen; nicht mit Stil v2.5 und dem neuen Kael abgeglichen |
| 8.8, 8.9 Audio | Weiter offen. Im Repo liegen nur die 31 PoC-Klänge von 2026-10-22. Der Satz „Lizenzfrage GA26 bleibt offen“ ist seit 2026-10-24 falsch (AGENTS.md); dieselbe Altlast steht in Art Direction §13 |

## Epic 9 und Story 9.14

Die Stories 9.1–9.13 bleiben als Geschichte erledigt; ihr Inhalt stimmt nicht mehr mit der abgenommenen Missionsliste überein. **Keiner der 12 abgenommenen Entwürfe ist im Spiel.** Die Felder wachsen stark, zum Beispiel 1-6 von 340 auf 1 240 und 1-2 von 272 auf 504.

**Story 9.14 verlangt neu oder anders:**

- Die Sim-Korridore und die Spielzeit müssen mit den neuen Karten und dem neuen Gegnerbild (2–3× so viele, schwächer) gemessen werden; alle bisherigen Werte sind hinfällig.
- NFR1 misst noch 24×32 mit etwa 40 Einheiten; verlangt sind jetzt bis 30×40 mit 50+ Figuren. Auch die 3D-Burg ist nicht auf echtem Gerät gemessen.
- `act1` steht in `content/packs.yaml` schon auf `released: true`, `released-ids.json` fehlt. Das Kriterium „Paket ist released“ prüft also nichts; entscheidend ist `content:lock`, und das erst nach allen Umbenennungen.
- Der Playtest-Plan muss Burg in 3D, neue Karten und Höhenregel abdecken.
- Vor dem Release fehlen: neue Kampagnenfolge, Karten, Szenenfolgen, Weltkarte v5 (noch nicht eingebunden).

**Noch fehlendes Format für die Entwürfe:** Gelände `roof` samt Stufe (N1), Item `pactwarden_shield` (N2), Wehrgänge in 1-6 und 1-8. `set_terrain` ist seit PR 102 da.

## Epic 10

| Stelle | Lücke |
|---|---|
| Einleitung | „Burg bleibt bis 10.14 das gemalte Bild“ und „Akt 1 ist veröffentlicht“ stimmen nicht |
| 10.1 | Punkte und Pfeil „auf dem gemalten Bild am Anker“ sind überholt: Die Anker werden nicht mehr angezeigt, die Steine sitzen über den Modellen (UX-Log 2026-11-04) |
| 10.1 | Varek, Brann und Pell treten jetzt nur optional bei. Stufe 3 von Taverne, Akademie, Verzauberer und Werkstatt hängt an einem Paar mit Varek oder Brann. Kein Blocker, weil es Oder-Paare sind, aber zu prüfen |
| 10.14 | Der Ausgang „Bild“ entfällt; nur der Stand-Absatz ist nachgezogen, die Kriterien nennen noch `home.yaml` und den Spike-Branch. Die Gegenstände brauchen Plätze im Modell |
| Fehlt | Burgstufe ist gebaut, aber nicht als Kriterium verankert; Vorwerk am Passfuß hat keine Story |

Die Reihenfolge 11.1 vor Epic 10 bleibt inhaltlich gültig, beginnt aber erst nach dem Umbau.

## Epic 11

**Der Missionsteil ist überholt und muss neu geschnitten werden.** Die drei freien Stränge sind weg; die Folge ist `2-1 → (2-2 ∥ 2-3) → 2-4 → (2-5 ∥ 2-6) → 2-7 → 2-8`. Die Grundlage verweist noch auf „Missionsfolge“ in `narrative.md`.

| Story heute | Neu laut Missionsliste |
|---|---|
| 11.10 Mission 2-1, „drei Angebote“ | Zwei Angebote (Seraphine, Dravn); Maelis erst nach 2-4. Brakka ist Ballistenmeisterin, Lektion Pferde statt Flieger |
| 11.11 Mission 2-2 | Niemand tritt bei (Nell wandert nach 2-6); Grell mit Maelis' Schmuggelware; neue Spur Kundschafter per Schiff |
| 11.12 Mission 2-3 „Leibwache“, E5 | Wird 2-5 in Silberquell; Sable jagt die Truppe, Amos tritt mit Odile bei |
| 11.13 Mission 2-4 „Wyvernhorst“, E6 | Wird 2-3 „Die Rabenweide“; Rowena zu Pferd. E6 wandert hinter 2-6 und entfällt ohne Varek |
| 11.14 Mission 2-5 „Brandschneise“, E7 | Wird 2-4, groß; Brann nur als Gast, Grell plündert, Maelis bietet danach an |
| 11.15 Mission 2-6 | Krähenholm, Grell und Sable statt Rowena; Nell tritt bei, Amos nicht mehr |
| 11.16 Mission 2-7 | Brakka von Maelis angeheuert; Chronik-Fund in den Büchern |
| 11.17 Mission 2-8 | Karte 30×40; Brakka nicht mehr als Wyvern; Rowena-Saat; Voraussetzungen neu |
| 11.18–11.20 | N5: Brann tritt nur hier bei, durch Ansprechen. N6: Aue-Insel, öffnet mit 2-7. Auslöser neu |

**Weitere Stories:**

- **11.2 Positionsstufe:** Die Positionsspannen schrumpfen auf die zwei Paare; Formel prüfen.
- **11.3 Weltkarte:** Muss auf Weltkarte v5 und die neue Geografie aufsetzen.
- **11.5:** Rowena und `brakka_wyvern` als Flieger entfallen; Varek und Brann sind optional, Supports brauchen Ersatz.
- **11.6 Balliste:** Die Balliste steht schon in Schema, Zustand und Brett; zu prüfen, was davon die Story noch braucht. Flieger-Bezüge streichen. Zusammenspiel mit Stufe und Reichweite (+1 von oben) ist nicht definiert.
- **11.7:** Flieger-Teile, Pegasus-Pools, Reittier-Grafik und Lektion entfallen (Entscheidung 5). Neu nötig: Reiter zu Pferd (Entscheidung 6). Herbstboden folgt jetzt `map-assets/jahreszeiten-plan.md`.
- **Gemeinsame Regeln:** „Niederlage bei 2-3: Odile“ wandert nach 2-5; Reihenfolge und Abhängigkeiten sind neu zu schreiben; Kartengrößen fehlen; die Chronik-Szene „nach der 3. Mission“ (11.21) gegen die feste Folge prüfen.
- **Fehlt ganz:** Höhenstufen, Tor, Hebel, `set_terrain` und veränderliche Karten als Kriterien der Karten; Akt-2-Assets aus der Galerie; Beitritt nur durch Ansprechen.
- **Branch `claude/epic11-act2-f4df6f`:** Der pausierte Entwurf 11-1 trägt den alten Schlüssel und Zuschnitt (13 Stories, Wyvernreiter). Nicht als Grundlage nehmen; die fünf Antworten der Übergabe sind in Epic 11 eingeflossen.

## Epic 12

Das Epic ist ohnehin „grob, vor Akt 3 verfeinern“. Vorweg bekannt:

- **Drachen:** „Drachen als dritte Partei“ (12.1, 12.7, 12.8, FR17, FR62) entfällt. 3-6 heißt „Das Südtor“, in 3-7 liegt ein schlafender Drache als Gelände, im Finale erwacht Vhaelyra.
- **Folge:** `3-1 → (3-2 ∥ 3-3) → 3-4 → 3-5 …` statt „3-2 bis 3-4 frei wählbar“.
- **Beitritte und Auslöser:** Pell über N10 (nur bis zur Krönung), nicht in 3-1. N7 nach 3-1, N9 nach 3-6, N8 nach 3-7.
- **Fehlt:** Nachholen von N7 und N10 nach dem Akt über die Weltkarte; Eisregel (R4 noch offen); Porträt für Brennas Bruder; Staffel-2-Saaten im Archiv.

## Quer durch die Dokumente

- **GDD:** Kartentypen (`gdd.md:358`, bis 24×32), Missionsgrößen (`gdd.md:231`) und „Akt 2: Flieger und Balliste“ (`gdd.md:371`) stehen noch auf altem Stand, obwohl der Log sie ersetzt.
- **Requirements:** FR17, FR62 und NFR1 in `requirements.md` sind überholt.
- **Epics-Index:** Die Reihenfolge nennt Epic 14 „nach dem MVP-Release“; beide Epics sind schon fertig.
- **Story-Dateien:** 17 Dateien in `_bmad-output/implementation-artifacts/` stehen noch auf `Status: review`, der Sprint-Status auf `done`. Nicht nachgeprüft, ob jede davon wirklich abgenommen wurde; der Sprint-Status bleibt maßgeblich.
