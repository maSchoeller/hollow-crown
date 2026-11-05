# Entwurf: Epic 15 „Umbau von Akt 1 und Release“

> **Abgelöst am 2026-11-05:** festgeschrieben als `concept/26-epics/epics/epic-15.md`; das Release ist Story 9.14 (umgeschrieben), 15.12 entfällt. Dieser Entwurf bleibt nur zur Herleitung. Epic 11 wird hier bewusst nicht neu geschnitten, weil die Level von Akt 2 noch nicht abgenommen sind.

**Ziel:** Spieler bekommen Akt 1 in der abgenommenen Fassung: neue Karten, neue Folge, neue Weltkarte, stimmige Figuren. Danach wird Akt 1 das erste echte Release.

**Gilt für alle Stories:** `pnpm check` grün, sichtbare Änderungen als Bild bei 375 × 812 belegt, Karten mit `pnpm sim` geprüft, Werte in YAML, kein `content:lock` vor Story 15.12.

## Reihenfolge

```text
15.1 Format-Reste ──┐
15.2 Kampagnenfolge ┴─> 15.3–15.5 Karten ──> 15.6 Szenen ──> 15.10 Abstimmung ──> 15.12 Release
15.7 Weltkarte v5 ────────────────────────────────────────────┘                    ▲
15.8 Modelle nach Bedarf (parallel zu 15.3–15.5)                                   │
15.9 Brettfiguren, Schritt 1 (3 Modelle) ───────────────────────────────────────────┤
15.11 Leistung großer Karten (nach 15.5) ──────────────────────────────────────────┘
```

## Karten ins Spiel

### 15.1 Format-Reste für die Entwürfe

Ergänzt, was die abgenommenen Entwürfe noch brauchen: Gelände `roof` samt Stufe (N1), Item `pactwarden_shield` (N2), Wehrgänge in 1-6 und 1-8, die der GDD-Log für eine eigene Runde vorsieht.

**Fertig, wenn:** alle 12 Entwürfe ohne Sonderfälle `content:check` bestehen; der Handbuch-Eintrag zu Höhe, Tor und Hebel stimmt.

### 15.2 Neue Kampagnenfolge von Akt 1

`campaign.yaml` auf `P → 1-1 → (1-2 ∥ 1-3) → 1-4 → 1-5 → 1-6 → 1-7 → 1-8`, höchstens 2 Story-Missionen offen, Nebenquests zählen nicht mit. N1 nach E2 „schützen“, N2 nach 1-5, N3 nach 1-6. Varek tritt nur noch über N2 bei, Bedingung ist das Ansprechen durch Kael.

**Fertig, wenn:** ein Test jede erlaubte Reihenfolge prüft und keine Regel „kein Ziel zweimal hintereinander“ verletzt; der Weg ohne Varek durch alle Szenen läuft.

### 15.3–15.5 Karten in drei Paketen

Die Entwürfe aus `levels/s1_*.yaml` ersetzen die alten Karten unter `content/acts/act1/maps/`; das Feld `design:` bleibt. Gegner auf das neue Bild abstimmen (2–3× so viele, schwächer), Heimsuchungs-Anker je Karte neu setzen.

| Story | Karten | Besonderes |
|---|---|---|
| 15.3 Kleine Karten | P, 1-1, N1, N2, N3, 1-7 | P: Beben öffnet die Pforte; 1-7: Einsturz als Zeitdruck |
| 15.4 Mittlere Karten | 1-2, 1-3, 1-4, 1-5 | 1-3 wird `reach`; 1-4: Felsrutsch per Hebel; 1-2: Haus ab Runde 2, Plünderer ab Runde 4 |
| 15.5 Große Karten | 1-6, 1-8 | Je 30×40, gespiegelt; Morra durchs Westtor, Hask durch die Ostpforte; Söldner füllen Plätze auf |

**Fertig, wenn:** jede Karte im Spiel gewinnbar ist und vorläufig im Korridor liegt; verschlossene Truhen und Schlüsselträger laut GDD-Log funktionieren; alte Karten und ihre IDs sind entfernt.

### 15.6 Szenen an Welt und Folge anpassen

Szenen DE und EN nach `missionsliste-s1.md` und `geografie-valmora.md`: Flucht per Lastkahn, Banden in der Ruine, Gräber-Zeile in 1-7, Saaten Kharesh, Stimme und Pakt, Halvard und Liora, Goldspur durch die Erlenbucht, Kaels Herkunft. Fehlende Ortsbilder neuer Orte. Dabei `kael` überall zu `lucan` (Texte DE und EN, IDs, Dateien, Dokumente), vor dem ersten `content:lock`.

**Fertig, wenn:** jede Mission Vor- und Nachszene passend zum Ort hat; die Prüfung auf Ersatzsprecher grün ist.

### 15.7 Weltkarte v5 einbinden

`map_v5` als 3 × 3 Kacheln, Orte aus `map_places_v5.json`, Stadtbilder für 12 Orte, Nebel je Akt, Knoten nach der neuen Folge. Zustandsvarianten der Stadtbilder sind laut Art-Log erst hier zu entscheiden.

**Fertig, wenn:** die Karte auf dem Handy gestochen scharf zoomt; das Paket-Budget hält; Fehlendes zeigt einen Rückfall statt einer Lücke.

## Galerie-Modelle

### 15.8 Modelle aus der Galerie nach Bedarf

Von den 113 Modellen kommt nur in den Build, was eine abgenommene Karte braucht (Art-Log), Akt für Akt im späteren Paket. Grundlage: `map-assets/matrix.md`, Etappen 3 bis 5. Für Akt 1 nur den Rest; Akt 2 und 3 bekommen je eine eigene Story in ihrem Epic, Herbst und Winter nach `jahreszeiten-plan.md`.

**Fertig, wenn:** jedes verwendete Modell die vier Lesbarkeitsregeln besteht; Dreiecks- und Paket-Budget halten; `content:check` meldet kein fehlendes Modell.

## Brettfiguren

### 15.9 Brettfiguren zu den neuen Porträts

Grundlage ist `concept/23-art-direction/figuren-bestand.md`. Zuerst nur Lucan, Verwalter der Paktwacht und Osric Dunn mit dem vorhandenen Guthaben; danach entscheidet der Produktinhaber über die übrigen 9 Modelle und den Nachkauf von Credits. Der kostenlose Tausch `archer` auf `bandit_archer` gehört mit hinein. Je Figur: Waffe, Statur, Palette und Signaturteil wie im Porträt (Art-Log: Kael schlank statt bullig, Halvard mit weißem Haar; was davon auf dem Brett auffällt, zeigt der Abgleich). Turnaround → Tripo → Pipeline nach Art Direction §4.6.

**Fertig, wenn:** die drei Figuren den Silhouettentest im Zoom „Mittel“ besteht; jede Figur im Budget bleibt (7 000 Dreiecke, 512er-Textur, 0,5 MB); Prompts und Abnahmen unter `art/prompts/` liegen.

## Release von Akt 1

### 15.10 Akt 1 neu abstimmen

`pnpm sim --campaign act1` auf allen Schwierigkeiten, EP- und Goldkurve über die neuen Karten, Spielzeit gegen 30–35 Stunden je Staffel. Dauer der Gegnerphase auf großen Karten prüfen.

### 15.11 Leistung großer Karten

Bis 1 200 Felder und 50+ Figuren auf dem Referenzgerät; dazu die 3D-Burg. Kamera und Übersicht auf 30×40; Schnelldurchlauf der Gegnerphase. NFR1 auf den neuen Maßstab heben.

### 15.12 Akt 1 veröffentlichen (ersetzt 9.14)

Alle Stories oben fertig, Tonbruch-Test 8.1 bewertet, Playtest-Plan mit 5–10 Testern. Dann `pnpm content:lock`, Fixture-Spielstand für spätere Migrationen, PR gegen `main`. Audio 8.8 und 8.9 blockieren nicht und kommen später gesammelt.

**Wie mit 9.14 umgehen:** Die Story wird beim Festschreiben auf diesen Inhalt umgeschrieben oder als abgelöst markiert; empfohlen ist Umschreiben, dann entfällt 15.12.

## Danach, nicht Teil dieses Epics

1. Epic 11 neu schneiden, sobald die Level von Akt 2 abgenommen sind; Akt 2 geht erst nach dem Release von Akt 1 live. Pferde auf der Rabenweide als Deko-Modell.
2. Epic 10 nachziehen (10.1, 10.14, Vorwerk), dann wie geplant ab 11.1 bauen.
3. Epic 12 vor Akt 3 verfeinern.
4. GDD und `requirements.md` auf die Log-Einträge seit 2026-11-01 bringen; das gehört schon vor das Festschreiben dieses Epics.
