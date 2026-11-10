---
baseline_commit: fdb901f41e15cae411cb14ec8b27d0a93da827ef
---
# Story 11.21: Nebenquest N5 „Glut unter dem Berg“

Status: review

<!-- Erstellt 2026-11-09 mit gds-create-story (headless, für die orchestrierende Session). Offene Design-Fragen nicht zurückgegeben,
sondern mit der empfohlenen Option als [ASSUMPTION] umgesetzt; Liste unten unter „Offene Fragen an den Produktinhaber“.
Parallel baut eine andere Session N4 (11.20) und 2-3/2-4: keine N4-Dateien anfassen, gemeinsame Dateien nur in eigenen Blöcken. -->

## Story

Als Spieler
möchte ich Brann in den Stollen von Kupferhall finden und ansprechen,
damit er sich der Truppe anschließt, statt sich vor seiner Glut zu verstecken.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/n5_kupfermine.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_n5_mine.yaml` (K 16 × 20, `treasure` 4 Truhen in 12 Runden, 7 eigene gegen 15 auf Normal, L 12 / S 18, Innen, Nebel) mit Feld `design:`, Innen-Look (`interior: true`, `timeOfDay: indoor`, Glutadern als `lights`), Gegner nur mit `levelOffset`, keine Flieger/Reiter.
2. **Zwei Wege in die Knochenhalle:** Die verschlossene Mitteltür (zwei Flügel, verknüpft) öffnet ein Schlüssel – der Vorarbeiter trägt ihn und lässt ihn fallen – oder ein Späher (Fenn) ohne Schlüssel; das Gatter `[12,9]` öffnet nur der Hebel `[14,12]` (`set_terrain` zu `gate`).
3. **Brann:** steht als Gast (`team: other`, `guest: true`, `char: brann`) im Westgang und tritt nur bei, wenn Ilka oder Lucan ihn ansprechen (`recruit.by: [ilka, lucan]`, Szene `scn.n5.brann_talk`, Ilka spricht zuerst, sonst Lucan). Wer ihn nicht anspricht, hat ihn für die Staffel nicht; die Quest ist trotzdem gewonnen (Sieg hängt nur an den Truhen). Nebenziel „Brann gewinnen“.
4. **Saat Drachen:** Betritt eine eigene Figur die Knochenhalle, spielt `scn.n5.bones` genau einmal (Drachenknochen im Fels, nur Szene).
5. **Truhen:** `dragon_ember` (Relikt aus 11.9, Szene `scn.n5.relic`), `earth_rune_3` (Erd-Rune III), Chronik-Seite `a2_mine` (neue Seite in `content/acts/act2/chronicle.yaml`, EN in `content/locales/en/act2.chronicle.yaml`), Mondstahl × 3.
6. **Belohnung:** Knoten `n5` gibt bei Sieg einen Glutfunken (`effects: [{ item: { def: ember_spark } }]`), dazu `goldReward`.
7. **Szenen:** `scn.n5.intro`, `scn.n5.outro`, `scn.n5.brann_talk`, `scn.n5.bones`, `scn.n5.relic` in DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen unter `requires: alive` mit Ersatzsprecher-Kette, Hintergrund `kupfermine`; die Nachszene unterscheidet Brann beigetreten / nicht beigetreten.
8. **Knoten:** `n5` bekommt `pre`/`post`/`effects`, `place: kupfermine` bleibt; `requires: completed m2_4` bleibt.
9. **Niederlage:** Avatar oder Lucan fallen (keine Schutzfigur im Entwurf).
10. **Heimsuchung:** Keine Heimsuchungs-Anker – Heimsuchungen spielen nur auf Karten von Story-Knoten (`storyNodeOf`), wie bei N1–N3; content:check grün.
11. **Simulation:** `pnpm sim --campaign act2 --runs 50` läuft durch; `pnpm sim n5_kupfermine --campaign act2 --start expected --runs 50` je Schwierigkeit mit Siegquote, Runden, Truhen, Brann-Beitritt und Verlusten im Kopfkommentar und in der Abnahme; Abweichungen nur berichten (Abstimmung 11.27).
12. **Unveröffentlicht:** `act2` bleibt `released: false`, kein `content:lock`.
13. **Abnahme:** Lab-Szenario `tests/fixtures/lab/kupfermine-n5.yaml`, Bilder bei 375 × 812 (Innen-Look, Höhen), Abschnitt „Übernahme Story 11.21“ in `concept/27-ueberarbeitung/levels/abnahme/s2_n5_mine.md`; `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 Karte `content/acts/act2/maps/n5_kupfermine.yaml` (AC 1, 2, 3, 9, 10)
  - [x] Terrain/Legende/Objekte aus dem Entwurf; Türflügel `d_mid_w`/`d_mid_e` mit `links` aufeinander (Muster `m1_6_paktwacht.yaml:103-105`), Gatter per Trigger `object_activated l_gate` → `set_terrain` `gate` (wie Entwurf, damit kein Schlüssel das Gatter öffnet).
  - [x] Gegner: `level` streichen, nur `levelOffset`; Name `unit.duchess_looter.name` („Plünderer der Herzogin“, Fraktion Haus Silbermeer), Vorarbeiter `unit.foreman.name`, Figuren aus dem Pool `silver_sea` (`content/acts/act2/haunts.yaml`). Eisenwaffen wie 2-1.
  - [x] Schlüssel: Truhen brauchen einen Schlüssel oder einen Späher (`src/core/rules/scout.ts`); damit die Jagd nicht an Fenn hängt (Regel 9.8, m1_7), tragen außer dem Vorarbeiter je ein Plünderer in jedem Winkel einen Schlüssel (`drops`) [Abweichung].
  - [x] Brann: `char: brann`, ohne eigene Stufe/Waffen (Werte `content/acts/act2/units.yaml`, Stufe P − 1 über `raiseMapChar`, Muster Jory in 2-1).
  - [x] Innen: `interior: true`, `fog: true`, `timeOfDay: indoor`, `lights` als rote Glutadern und Fackeln (Muster `m1_7_gewoelbe.yaml:47-56`); keine Höhenstufen (Entwurf eben).
  - [x] Haunts: keine (Nebenquest-Karte, wie N1–N3).
  - [x] Namen in `content/acts/act2/locales/{de,en}.names.yaml` (eigener Block „N5“).
- [x] T2 Chronik-Seite `a2_mine` (AC 5): `content/acts/act2/chronicle.yaml` neu (Akt-2-Schwerpunkt „dass sie beim Paktfest etwas gaben“, narrative.md „Found Documents“), EN in `content/locales/en/act2.chronicle.yaml`; Text als Vorschlag markieren.
- [x] T3 Szenen DE/EN (AC 4, 5, 7): `content/acts/act2/scenes/scn.n5.*.yaml`, EN in `content/locales/en/act2.dialogue.yaml` (eigener Block).
- [x] T4 Knoten `n5` in `content/acts/act2/campaign.yaml` (AC 6, 8): nur diese Zeile; `pre`, `post`, `effects` ember_spark.
- [x] T5 Tests `tests/unit/n5-kupfermine.test.ts`: Knoten/Ziel/Belohnung, Gegnerzahl je Schwierigkeit, Stufen, Tür mit Schlüssel und Späher, Hebel öffnet Gatter, Brann nur durch Ilka/Lucan, Knochen-Szene einmal, Truhen-Inhalte, Szenen-Varianten; bestehende Tests (act-title, act2-campaign-order, act2-drafts) grün halten.
- [x] T6 Simulation (AC 11), Lab-Szenario und Sichtprüfung (AC 13), Abnahme-Abschnitt.
- [x] T7 Abschluss: Decision-Logs (`concept/22-narrative/decision-log.md`, `concept/21-gdd/decision-log.md`), `sprint-status.yaml` 11-21 → review, `pnpm check`.

## Dev Notes

### Ausgangslage (Stand 2026-11-09, origin/main fdb901f)

- Knoten `n5` (`content/acts/act2/campaign.yaml`): `kind: side, map: n5_kupfermine, place: kupfermine, requires: [{ completed: m2_4 }], merchantTier: 1`, ohne `pre`/`post`/`effects`. Ortsbild `kupfermine` liegt in `ACT2_LOCATIONS` (`tools/art/build.py:49`) und in `packs.yaml` act2.
- Brann (`units.yaml`): elementalist, Erde, `buried_glow`, `stone_fist`/`rockfall`, Support Ilka, `joins: n5`. Ilka `joins: m2_3`. Halbfiguren `art/mockups/characters-s1/brann.png`, `ilka.png` vorhanden.
- 2-3 (Ilka-Beitritt) und 2-4 (Brann als Gast, Flucht in die Minen) sind **noch nicht gebaut** (andere Session); N5 baut gegen den Stand von Epic/11.5 und verweist in den Szenen nur lose auf die Brandschneise.
- Items: `dragon_ember` (11.9, `items.yaml:142`), `earth_rune_3` (`runes.yaml:11`; Runen sind Items in `data.items`, `load.ts:271`, gehen in den Konvoi `goesToConvoy`), `moonsteel` (Material), `ember_spark` (Glutfunke). **Neu nur die Chronik-Seite** – Akt 2 hat noch keine `chronicle.yaml`.
- Truhen öffnen: Schlüssel (`door_key`, 1 Ladung) oder Späher (`open_steal`); Hebel zieht jeder vom Nachbarfeld (`act.ts:271`); Tür-Flügel über `links`.
- Gast-Regel (11.10): `guest: true` nur mit `team: other`, Beitritt nur über Ansprechen.

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_n5_mine` | `n5_kupfermine` | Karten-Id des Knotens |
| `level` + `levelOffset` | nur `levelOffset` | 11.2 |
| Brann Stufe 8, `rockfall` | `char: brann` mit Werten aus `units.yaml` | 11.5 |
| nur Vorarbeiter mit Schlüssel | weitere Plünderer mit Schlüssel | Truhen brauchen Schlüssel (Regel 9.8) |
| `goldReward: 1500` | 2 000 [ASSUMPTION] | Goldkurve Akt 2 (PO 2026-11-09 bei 2-1) |
| `t_bones` beim Öffnen der Drachenglut | Knochen-Szene beim Betreten der Halle, Relikt-Szene an der Truhe | AC „Knochen tragen die Saat“ |

### Previous Story Intelligence

- 11.12 (2-1): Muster für Karte, Kopfkommentar, Szenen, Gast-Beitritt (Jory `char` ohne Werte), Lab-Szenario `windscharte-2-1.yaml`, Sim mit `--campaign act2 --start expected`; Lab spielt Akt-2-Karten in Akt 2.
- 11.9: Drachenglut Stufe 1 schlafend (MAG +2), Stufen ab 2-8 trägt 11.19 ein.
- 9.10/9.11 (N1/N2): Glutfunke als Knotenwirkung, Chronik-Seite als Truhen-Inhalt `chronicle:`.

### Project Context Rules

- Keine Spielwerte, kein sichtbarer Text im Code; Code/IDs Englisch, Konzepttexte Deutsch; Zufall aus dem Seed-RNG.
- Nie auf `main`; kein `released: true`, kein `content:lock`.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 425-437]
- [Source: concept/27-ueberarbeitung/levels/s2_n5_mine.yaml; levels/abnahme/s2_n5_mine.md]
- [Source: concept/22-narrative/missionsliste-s1.md:12,75,86,121; narrative.md:226,321,549-566,732; geografie-valmora.md:59]
- [Source: content/acts/act2/{campaign,units,haunts}.yaml; content/core/items.yaml:136-142]
- [Source: src/content/schemaMap.ts; src/content/validateMap.ts:230-256; src/core/battle/act.ts:83-170; src/core/rules/scout.ts]

## Offene Fragen an den Produktinhaber

Alle mit der empfohlenen Option umgesetzt, A1 und A3–A7 bestätigt (PO 2026-11-10), A2 bleibt [ASSUMPTION]; Werte leicht änderbar in der Karte bzw. den Szenen:

- **A1 Schlüssel:** Truhen brauchen Schlüssel oder Späher. A) mehrere Plünderer lassen Schlüssel fallen (gewählt), B) nur der Vorarbeiter, Truhen nur mit Fenn/Händler-Schlüsseln, C) Truhen in N5 ohne Schlüssel (Regeländerung).
- **A2 Gold:** A) 2 000 nach Goldkurve Akt 2 (gewählt), B) 1 500 wie Entwurf.
- **A3 Gegner:** A) „Plünderer der Herzogin“ (Haus Silbermeer) (gewählt), B) Freie Klingen, C) Grenzheer Dravns.
- **A4 Ilka-Zeilen:** A) Ilka spricht, wenn sie in der Truppe ist, sonst Lucan mit denselben Worten (gewählt), B) eigene Lucan-Fassung mit anderem Text, C) Kette ohne Beitrittsprüfung.
- **A5 Saat Drachen:** A) Szene beim Betreten der Knochenhalle + eigene Relikt-Szene (gewählt), B) eine Szene beim Öffnen der Drachenglut wie Entwurf.
- **A6 Chronik-Seite a2_mine:** Text „Was der Berg nimmt“ als Vorschlag (A), oder B) Platzhalter bis 11.23.
- **A7 Nachszene ohne Brann:** A) Spur verliert sich, keine zweite Chance (gewählt), B) Brann taucht später als Gast wieder auf.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (gds-create-story, gds-dev-story), headless für die orchestrierende Session.

### Debug Log References

- Kampagnen-Sim spielt nur Story-Knoten: N5 als Kopie `.sim/n5_probe.yaml` (Id geändert) an Stelle von 2-2 mit `--map-file --node m2_2 --position 16`, je Schwierigkeit 50 Läufe; `pnpm sim --campaign act2 --runs 50` verkettet läuft durch (m2_1 87 %, N5 nicht gespielt).
- Sprecherketten (`canSpeak`) prüfen nur gefallen/gegangen, nicht den Beitritt: Ilka-Zeilen deshalb mit `requires: alive`, Lucan-Fassung `…b`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created (gds-create-story, 2026-11-09).
- T1: Karte aus dem Entwurf übernommen (Abweichungen in der Abnahme-Datei); Türflügel verknüpft, Gatter per Hebel-Trigger, Brann als Gast mit Werten aus units.yaml, Innen-Look mit Glutadern als Lichter, keine Heimsuchungs-Anker (Heimsuchungen nur auf Story-Karten, wie N1–N3; AC 10 entsprechend angepasst), Namen der Gegner in den Akt-2-Locales.
- T2: erste Chronik-Seite von Akt 2 `a2_mine` (DE/EN). Runen sind Items (`load.ts`), Truhe mit `earth_rune_3` geht in den Konvoi; Mondstahl und Drachenglut gab es schon – kein neues Item nötig.
- T3: Szenen intro/brann_talk/bones/relic/outro DE+EN, Boxen ≤ 110 Zeichen (content:check).
- T4: Knoten n5 mit pre/post und Glutfunke.
- T5: `tests/unit/n5-kupfermine.test.ts` (12 Tests).
- T6 [C]: Normal 96 % Sieg, 7/8/10 Runden, 0,34 Niedergestreckte, 0,08 Tote, Brann 8 %; Leicht 100 %, 0,00, Brann 92 %; Schwer 82 %, 0,50, 0,13 Tote, Brann 0 % (ohne Ilka, 2-3 fehlt). Lab `kupfermine-n5`, Bilder 375 × 812 im Dev-Build act2 (Port 5181).
- T7: Decision-Logs GDD und Narrative; act2 bleibt unveröffentlicht, kein content:lock.
- Fehlende Missionen: 2-3 (Ilka) und 2-4 (Brann als Gast, Flucht in die Minen) baut eine andere Session; N5 verweist nur lose auf die Brandschneise.

### File List

- content/acts/act2/maps/n5_kupfermine.yaml (neu)
- content/acts/act2/scenes/scn.n5.intro.yaml, scn.n5.brann_talk.yaml, scn.n5.bones.yaml, scn.n5.relic.yaml, scn.n5.outro.yaml (neu)
- content/acts/act2/chronicle.yaml (neu)
- content/locales/en/act2.chronicle.yaml (neu)
- content/locales/en/act2.dialogue.yaml
- content/acts/act2/campaign.yaml
- content/acts/act2/locales/de.names.yaml, en.names.yaml
- tests/unit/n5-kupfermine.test.ts (neu)
- tests/unit/act-title.test.ts, act-transition.test.ts, scenery.test.ts, chronicle.test.ts (N5-Karte und erste Akt-2-Seite)
- tests/fixtures/lab/kupfermine-n5.yaml (neu)
- concept/27-ueberarbeitung/levels/abnahme/s2_n5_mine.md
- concept/21-gdd/decision-log.md, concept/22-narrative/decision-log.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/11-21-nebenquest-n5-glut-unter-dem-berg.md

### Change Log

- 2026-11-09: Story 11.21 angelegt und umgesetzt (Karte, Szenen DE/EN, Chronik-Seite, Knoten, Tests, Lab, Abnahme, Decision-Logs); Status review.
