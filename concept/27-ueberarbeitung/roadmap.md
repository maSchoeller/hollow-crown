# Konzept-Überarbeitung nach dem Akt-1-Playtest

> Start 2026-11-01. Anlass: Der Produktinhaber hat Akt 1 gespielt („sehr gut gefallen“) und will Story, Figuren, Welt und alle 35 Level grundlegend überarbeiten, bevor weiter implementiert wird. Dieses Dokument ist der Arbeitsplan und hält die Leitplanken fest. Entscheidungen landen wie üblich im zuständigen Artefakt und dessen Decision-Log (GDD, Narrative, Art Direction); hier steht nur der Verweis.

## Leitplanken (Produktinhaber, 2026-11-01)

### Kartengrößen und Gegnerbild → GDD „Level Design Framework“

| Klasse | Anteil | Größe (B × H, Hochformat) | Eigene Einheiten | Missionen (von 35) |
|---|---|---|---|---|
| Klein | etwa ⅓ | bis etwa 16 × 20 | 6–8 | ~12 |
| Mittel bis groß-mittel | etwa ½ | um 20 × 25 | 8–12 | ~17 |
| Groß | Rest, etwa ⅙ | 30 × 40 bis 40 × 30 | 10–15 | ~6 |

- **Mehr, aber schwächere Gegner:** lieber viele Gegner unter dem Niveau der Truppe als wenige ebenbürtige. Richtwert für die Ausarbeitung: zwei- bis dreimal so viele Gegner wie eigene Einheiten, dafür niedrigere Werte (per `pnpm sim` abzustimmen).
- **Annahme, noch zu bestätigen:** „10–15 Charaktere“ bei großen Leveln meint eigene Einheiten.
- **Folgen, die mitzuplanen sind:** Leistung auf dem Handy (bis 1 200 Felder und 50+ Figuren, Architektur T8), Dauer der Gegnerphase (Schnelldurchlauf/Überspringen), Kamera und Übersicht auf großen Karten, Missionsdauer.

### Reittiere und Drachen → GDD, Narrative

- **Staffel 1:** keine Drachen-Gefährten und keine Flug- oder Wasserreiter. **Pferde sind erlaubt.** Die Reit-Mechanik wird nur vorbereitet (Datenmodell, Gelände-Kosten je Fortbewegungsart).
- **Staffel 2:** Drachen kommen dazu, reitbar und nach Element verschieden: Feuer, Luft (fliegt), Erde (überquert Gebirge), Wasser (schnell im Wasser). Dazu kommen Reittiere wie Pferd, Wolf, Pegasus und Krokodil (Vorteil im Wasser).
- **Staffel 3:** der klassische Antagonist, eventuell ein feindlicher Drache; es geht darum, für die Drachen zu kämpfen.
- **Konflikte mit dem Bestand, zu lösen in Etappe 1:** Akt 2 hat heute „Flieger und Balliste“ als Fokus (2-1), die Leutnants Rowena (Pegasus) und Brakka (Wyvern) sind Reiter, und laut Brief bringt Akt 3 die Drachen.

### Story → Narrative

- Die Story gefällt grundsätzlich, soll aber in Teilen hinterfragt werden.
- Der große Spannungsbogen wird **grafisch aufbereitet**: was wann passiert, über alle drei Staffeln gedacht.
- Staffel 2 und 3 werden grob vorgedacht, damit Staffel 1 schon jetzt Saat legt, zum Beispiel einen späteren Endgegner früh einführt oder heutige Gegner später zu Verbündeten macht.

### Figuren-Stil → Art Direction

- Der Stil wird **neu geöffnet**. Am besten gefallen die Turnarounds von **Rhen A und B, Tobin, Fenn und Ysolde** (`art/turnarounds/avatar_a_board`, `avatar_b_board`, `tobin_board`, `fenn_board`, `ysolde_board`). Aus ihnen wird ein Vorlagen-Prompt extrahiert; alle Figuren entstehen danach neu.
- Parallel wird ein Stiltest mit Alternativen gemacht, zum Vergleich.
- Ziel: Figuren individuell statt KI-Einheitslook. Formsprache, Körperbau, Proportionen, Gesicht und Farben unterscheiden sich je Figur, die Kleidung erzählt die Biografie.

### Level-Ansicht → Werkzeug

- **Level-Blatt + Stimmungsbild:** Jedes Level wird gleich als YAML im Spielformat geschrieben. Ein Skript zeichnet daraus ein Level-Blatt mit Raster, Gelände, Startfeldern, Gegnern, Wegpfeilen, Zielen, Verstärkungen und Phasen; alle Blätter kommen in einen Level-Atlas (HTML, auch aufs Handy). ChatGPT malt nach dem Raster ein Stimmungsbild. Verbindlich ist das Raster; das Bild zeigt die Atmosphäre.

## Etappen (vom Großen ins Kleine)

| # | Etappe | Ergebnis | Artefakt | Hängt ab von |
|---|---|---|---|---|
| 0 | Leitplanken | dieses Dokument, Decision-Log-Einträge | hier | – |
| 1 | Spannungsbogen und Staffel-Vorschau | Grafik des Bogens über S1–S3, Prüfung der Prämisse, neue Missionsliste mit Zweck je Mission | `22-narrative/` | 0 |
| 2 | Figurenstil | Stil-Vorlage aus den Lieblings-Turnarounds, Alternativtest, Entscheidung | `23-art-direction/`, `art/prompts/` | 0 |
| 3 | Figuren-Bibel | je Figur: Formsprache, Körperbau, Gesicht, Palette, Kleidung, Haltung; neue Turnarounds | `23-art-direction/`, `22-narrative/` | 1, 2 |
| 4 | Welt | Großlandschaft (Geografie, Wege, Regionen, Orte der 35 Missionen), neue Weltkarte | `22-narrative/` (Welt), `23-art-direction/` §6 | 1 |
| 5 | Level-Werkzeug | Level-Blatt-Renderer + Atlas, erprobt an Prolog, 1-1, 1-2 im neuen Maßstab | `tools/`, hier | 0 |
| 6 | Level-Design | alle 25 Story-Missionen + 10 Nebenquests, aktweise, jedes Level einzeln abgenommen | `content/acts/`, Atlas | 1, 4, 5 |
| 7 | Asset-Harmonisierung | Bestandsliste: was bleibt, was neu entsteht | `23-art-direction/` §14 | 2, 3, 4 |
| 8 | Umsetzungsplanung | Epics und Stories für den Umbau | `26-epics/` | alle |

Die Etappen 1, 2 und 5 hängen nicht voneinander ab und können parallel laufen.

**Stand Etappe 6 (2026-11-01):** Akt 1 abgenommen, 12 Entwürfe in `levels/s1_*.yaml`, Abnahme-Ansichten in `levels/abnahme/`. Offene Formatwünsche: Wirkung `set_terrain` (veränderliche Karten P, 1-4, 1-7), Gelände `roof` (N1), Item `pactwarden_shield` (N2). Als Nächstes Akt 2.

**Stand Etappe 7 (2026-11-04):** Bericht und Matrix in `concept/23-art-direction/map-assets/`, Richtung und Regeln entschieden (Tor, Mauer, Stufenmodell). Probeset in Arbeit.
