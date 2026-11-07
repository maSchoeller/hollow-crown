---
stepsCompleted: [document-discovery, gdd-analysis, epic-coverage-validation, ux-alignment, epic-quality-review, final-assessment]
scope: Epic 10, Epic 11
date: 2026-11-07
mode: headless (aus der Session „Epic 10/11 vorbereiten“ gestartet, ohne Menü-Halte)
verdict: NEEDS WORK
---

# Implementation Readiness: Epic 10 und 11 (2026-11-07)

Abgleich auf `main` (`366881f`). Gelesen wurden nur die betroffenen Abschnitte: `epic-10.md` (Einleitung, Abhängigkeiten, Umbenennungen), `epic-11.md` (ganz), `requirements.md` (FR14/15, FR17, FR44–FR54, FR61, NFR1, NFR12, Coverage Map), Game Brief („Umfang“, „Offene Fragen“), GDD (Glutfunke, Heimat), Narrative (Gliederung, Staffel-2-Übergabe), Architektur §5.4, §5.16, §16, `EXPERIENCE.md` (Heimat, Weltkarte), `01-decisions.md` (O1–O5), `umsetzung-lueckenliste-akt2.md`, dazu Code-Stichproben (`save.ts`, `packs.yaml`, `tools/content-lock.ts`, Akt-1-Karten).

Fragen an den Produktinhaber: `concept/26-epics/fragen-po-2026-11-07.md`.

## Urteil: NEEDS WORK, kein Blocker für den Inhalt

Beide Epics sind fachlich vollständig geschnitten, und jede FR hat eine Story. Ein Teil der Rahmenbedingungen ist aber noch offen: Seit F1 („früh und Stück für Stück live“) hängt jede Story von Epic 10 und 11 an Sperre und Migration, und einige Querdokumente stehen noch auf dem alten Stand.

1. **Abdeckung vollständig.** FR14, FR15, FR44, FR50–FR54 (Epic 10) und FR61 (Epic 11) sind über Stories abgedeckt. FR17 und NFR1 sind auf den Stand vom 2026-11-06 nachgezogen. Keine FR ist verwaist.
2. **9.14 ist ein harter Vorläufer für 11.1, 11.3 und 10.2.** Alle drei verlangen eine Fixture als „echten Spielstand aus dem Akt-1-Release“. 11.3 schaltet außerdem `act2` erst nach 9.14 auf `released: true`. Vor 9.14 lassen sich nur Kern-Stories ohne Bezug zum Release beginnen (siehe unten).
3. **Die Live-Schritte haben Folgen, die die Epics nur teilweise auflösen.** (a) 11.5 soll Flags und Gefährten „vor dem ersten Sperren“ festlegen, ist aber nicht Teil des ersten Live-Schritts (11.1 + 11.3). (b) Sobald `act2` veröffentlicht ist, wird jede gemergte Datei unter `acts/act2/` sofort für Spieler wirksam, also auch Heimsuchungen (11.7), Akademie (10.2) und Raumausbau (10.1), solange Akt 2 noch keine Mission hat. (c) Bei `content:lock` in 9.14 werden auch die Core-IDs gesperrt, die Epic 10 entfernen will (`promotion_seal`, `sol`, `impale`, `longshot`). Danach geht das nur noch über `renames.yaml` und eine Migration.
4. **Querdokumente veraltet.** Architektur §5.4 beschreibt noch die alten Stränge (`m2_2`, `m2_4`, `m2_6` nach `m2_1`) und Offsets `+0…+2` statt −3…+2. Architektur §16 nennt O5 als „unverändert offen“ (geklärt seit 2026-10-24). In `EXPERIENCE.md` fehlen der Zustand „Akt 2 erreicht, Weitere Missionen folgen“ und die Titeltafel. Die bekannten Reste in `gdd.md`, `narrative.md` und Art Direction §4.3 sind weiter offen. Die „Offenen Fragen“ im Game Brief sind beantwortet, stehen dort aber noch als offen.
5. **Kleine Widersprüche in den Stories.** 11.9 nennt `pactwarden_shield`, im Spiel heißt das Item `pact_warden_shield` (wird mit 9.14 gesperrt). In 11.21 (N5) fehlt der Glutfunke, den Entwurf `s2_n5_mine` und GDD („7 der 10 Nebenquests“) vorsehen. 11.2 rechnet mit `positionLevel.base: 11`, die Sim von 15.10 misst die Armee vor 1-8 aber bei 8,6 (Normal), mit Heimsuchungen bei 9,5.

## 1. Dokumente

| Dokument | Stand | Bemerkung |
|---|---|---|
| `epic-10.md` | nachgezogen 2026-11-06 | Einleitung, 10.1, 10.14, F1/F3/F4 eingearbeitet |
| `epic-11.md` | neu geschnitten 2026-11-06 (27 Stories) | Grundlage: Entwürfe `levels/s2_*.yaml`, Missionsliste |
| `requirements.md` | FR17, FR61, NFR1 nachgezogen | FR62 (Akt 3, Drachen als dritte Partei) veraltet, betrifft Epic 12 |
| `gdd.md` | teilweise veraltet | Missionsfolge „Flieger und Balliste“, Kartentypen bis 24 × 32, Gegner je Akt |
| `narrative.md` | teilweise veraltet | Leutnant-Tabelle (Pegasus/Wyvern), Missionsfolge |
| `architecture.md` | §5.4 und §16 veraltet | siehe Punkt 4 |
| `EXPERIENCE.md` | Lücke | leerer Akt 2, Titeltafel |
| `brief.md` | „Offene Fragen“ veraltet | im GDD bzw. in der Narrative beantwortet |

## 2. Anforderungen aus GDD, Brief und Narrative

- **Brief:** Akt 2 „Glut“ mit Burgausbau, Akademie und Glutfunke, Region 2 und 4 Leutnants. Deckt sich mit Epic 10 und 11.
- **GDD, Glutfunke:** 12 Stück in der Staffel, je einer aus 7 der 10 Nebenquests (ohne die persönlichen Quests von Tobin, Jory sowie Kit und Pell). In Akt 2 heißt das: N4 und N5 geben einen, N6 (Jory) die Signaturlaute. Epic 11 nennt den Funken nur in N4.
- **GDD, Akademie:** Raum-Gefährten Varek und Odile. F3 ist eingearbeitet (Stufe bleibt, die Folgen-Karte nennt den Wegfall).
- **Narrative:** „Der Spielstand trägt in Staffel 2“. Flags mit `season2: true` (`maelis_ledgers`, `chronicle_read`) sind in 11.5 angelegt.

## 3. Epic-Abdeckung

| FR | Story | Befund |
|---|---|---|
| FR14 Profi-Wege | 10.2–10.4 | ok |
| FR15 Fallensteller, Schatten | 10.5 | Nebel-Karten aus Epic 11, bis dahin Fixtures |
| FR17 Gegnertypen | 11.7 | ok (keine Flieger und keine Reiter) |
| FR44 Glutfunke | 10.2, 10.9, 11.20 | **N5 fehlt** (11.21) |
| FR46 Stahl-Tier | 11.5, 10.9 | ok, Zuständigkeit geregelt |
| FR47 Goldkurve Akt 2 | 11.4, 11.27 | ok |
| FR48 Sim über Akte | 11.4 | ok |
| FR50–FR54 Burg | 10.1, 10.6–10.11, 10.14 | ok; die Gegenstände in 10.14 brauchen die Abnahme des Produktinhabers |
| FR61 Inhalte Akt 2 | 11.11–11.23 | ok |
| NFR1 Leistung | 11.26 | 2-8 hat rund 60 Figuren; das Vorgehen bei Überschreitung ist festgelegt |
| NFR12 Korridore | 11.4, 11.27 | ok |

## 4. UX

- Akademie, Raumsteine und die Burg in 3D sind in `EXPERIENCE.md` beschrieben (Raumstein-Muster, „Burg in 3D“ 2026-11-04).
- **Lücke:** Es gibt keinen Zustand „Akt 2 erreicht, keine spielbare Mission“. Zeile 120 kennt nur „Akt beendet, nächster nicht veröffentlicht“, die Szene in Zeile 226 nur „Akt 2 erscheint bald“. Story 11.3 verlangt beides neu (Titeltafel `act.2.title` und „Weitere Missionen folgen“). Ohne Vorgabe entscheidet das die Story.
- Folgen-Karte bei E5 und E6 (F3): Text und Platz sind nicht skizziert; das kann die Story nach dem bestehenden Muster lösen.

## 5. Qualität der Stories

**Abhängigkeiten und Reihenfolge**

- Die Reihenfolge ist sauber benannt: 11.1 vor Epic 10, 11.27 zuletzt, Paare frei. Es gibt keine Vorwärts-Abhängigkeit außer der bekannten auf 9.14.
- **Widerspruch zur Sperre:** Laut 11.5 sollen Flags und Gefährten beim ersten Sperren feststehen, der erste Live-Schritt ist aber 11.1 + 11.3. `tools/content-lock.ts` sperrt zusätzlich (`mergeLock`, früher gesperrte IDs bleiben), späteres Hinzufügen ist also unkritisch. Kritisch ist nur das Umbenennen. Zu klären: 11.5 in den ersten Live-Schritt ziehen oder den Satz streichen (Frage 3).
- **Live ohne Mission:** 11.7 (Heimsuchungen von Akt 2), 10.1 (Ausbau Stufe 2 „nur Akt 2“) und 10.2 (Akademie) wirken ab ihrem Merge für alle, die im leeren Akt 2 stehen. Ob das gewollt ist, steht nirgends (Frage 4).

**Sperre und Migration (F1)**

- Heute: `SAVE_FORMAT = 2`, keine Migration registriert, Fixtures `format1-auto.json` und `format2-auto.json`. `content/released-ids.json` und `content/renames.yaml` gibt es noch nicht. `act1` steht schon auf `released: true`, die erste Sperre läuft mit 9.14.
- 9.14 sperrt **alle** Pakete mit `released: true`, also auch `core` mit Klassen, Items und Skills. Dann brauchen die geplanten Entfernungen aus 10.2 (`promotion_seal: ember_spark`) und 10.4 (`sol`, `impale`, `longshot`) Einträge in `renames.yaml` und die generische Migration 2 → 3. Werden sie vor der Sperre entfernt (`promotion_seal`) bzw. nur umbenannt (die drei Skills hängen an `classes.yaml` Z. 223/246/292, an PoC-Profiklassen, die in Akt 1 niemand erreicht), fallen beide weg; ohne die Migration startet 10.2 dann einfacher (Frage 2).
- Ab dem ersten Live-Schritt von Akt 2 braucht jede Formatänderung eine Fixture aus dem **letzten Live-Stand**, nicht nur aus dem Akt-1-Release. Eine Fixture-Kette pflegt bisher keine Story. 11.3 legt „Akt 2 ohne Missionen“ an, jede Missions-Story müsste ihren Stand nachlegen. Empfehlung: Neue persistierte Felder (z. B. `c.act`, `actTitleSeen`, `tavernWish`, `gearTemplate`) bekommen weiter Defaults in `normalizeCampaign` und keinen Formatwechsel. Der einzige geplante Formatwechsel bleibt 2 → 3 in 10.2, und alle späteren Umbenennungen laufen nur über `renames.yaml`.
- `BattleState.traps` (10.5) und die Ziel-Phase (11.8) verändern den Kampfzustand. Ob Kampf-Zwischenstände mitten in einer Mission gespeichert werden und dann eine Migration brauchen, prüft die jeweilige Story (Architektur §8.7).
- IDs vor dem Merge endgültig wählen. Das betrifft vor allem `pact_warden_shield` (11.9 schreibt es falsch) und die Platzhalter `e7_order`/`e7_warned` (11.5 stellt sie auf `e07` um).

**Werte**

- `positionLevel.base: 11` `[ASSUMPTION]` gegen die gemessenen 8,6–9,5 vor 1-8 (15.10). Das Finale bringt noch EP, die Lücke zu P = 11 bleibt aber wahrscheinlich über `levelTolerance`. Prüft 11.4; Frage 6.

## 6. Startbar ohne Release 9.14 und ohne Entscheidung des Produktinhabers

| Story | Startbar? | Warum |
|---|---|---|
| 11.25 Brettfigur Rowena | **ja** | F2 entschieden, reine Art-Pipeline; die Einbindung als Leutnant kommt mit 11.5 |
| 11.24 Galerie-Modelle (nur Modellbau) | **ja** | Modelle laut Matrix bauen und abnehmen; die Paket-Einbindung kommt mit 11.3 und den Karten |
| Ortsbilder 2-1, 2-4, 2-6, 2-7, N4–N6 | **ja**, als Grafik-Tasks | stehen in den Missions-Stories, hängen aber an keiner Regel (Frage 8: vorziehen?) |
| 10.14, Teil Vorwerk | **ja** | F4 entschieden, nur Bild an Burgstufe 3; `castleTier` gibt es schon. Die Gegenstände warten auf Frage 7 |
| 11.6 Balliste | ja, **mit Frage 1** | Regel im Kern; keine Akt-1-Karte nutzt `ballista`, für Akt 1 also folgenlos. Das Epic sagt aber „Epic 11 beginnt nach 9.14“. Konflikt mit `autoplay.ts` und der KI möglich (Session gegnerphase-1-8 läuft) |
| 11.8 Ziel-Phasen | ja, **mit Frage 1** | neuer Zieltyp mit Fixture `dev_phases`, für Akt 1 folgenlos |
| 11.10 Format-Reste | ja, **mit Frage 1** | Schema und `content:check`, Entwürfe liegen unter `concept/`; berührt `schemas.ts` und `validate.ts`, die auch die 9.14-Vorbereitung ändern kann |
| 11.1, 11.3 | nein | Fixture aus dem Akt-1-Release, `released: true` nach 9.14 |
| 11.2, 11.4, 11.5, 11.7, 11.11 | nein | brauchen den Loader für mehrere Akte aus 11.1 |
| 11.9 Relikt-Stufen | nein | ändert das Akt-1-Item `pact_warden_shield` (Stufe 2 ab `m1_6`) und damit die Balance von Akt 1 kurz vor dem Release |
| 11.12–11.23, 11.26, 11.27 | nein | Missionsfolge bzw. Ende |
| 10.1–10.13 | nein | nach 11.1, 10.2 braucht die Fixture aus dem Release |

## Empfohlene nächste Schritte

1. Fragen 1–4 in der Nachmittags-Session klären, vor allem Frage 2, weil sie 9.14 betrifft.
2. Art-Tasks sofort starten: Rowena (11.25), Galerie-Modelle (11.24), Vorwerk (10.14), bei „Ja“ zu Frage 8 auch die Ortsbilder.
3. Nach Frage 1: 11.6, 11.8 und 11.10 als Kern-Vorarbeit einplanen, nacheinander oder auf getrennte Dateien verteilt.
4. Doku-Abgleich als eigene kleine Aufgabe vor 11.12: Architektur §5.4/§16, `EXPERIENCE.md` (leerer Akt 2), Brief „Offene Fragen“, `gdd.md`, `narrative.md`, Art Direction §4.3; dazu in Epic 11 `pact_warden_shield` und der Glutfunke in N5.
