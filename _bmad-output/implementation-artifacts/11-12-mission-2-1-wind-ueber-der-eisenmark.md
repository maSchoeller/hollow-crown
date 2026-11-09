---
baseline_commit: e85ed2129d478efe30809be53bd97a22da8f949e
---
# Story 11.12: Mission 2-1 „Wind über der Eisenmark“ und zwei Angebote

Status: review

<!-- Erstellt 2026-11-09 mit gds-create-story. PO-Entscheidung 2026-11-09 (Marvin, über die orchestrierende Session): F1 = B, F2 = A, F3 = A, F4 = A, alle wie empfohlen; Maelis nicht in 2-1, Reiter-Trigger entfällt, Werte von Brakka/Jory aus den Akt-2-Einheiten. -->

## Story

Als Spieler
möchte ich in der Windscharte unter Ballistenfeuer durchhalten und die Balliste selbst wenden,
damit Akt 2 mit neuem Land und neuer Regel beginnt.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/m2_1_windscharte.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_2_1_windscharte.yaml` (M 20 × 25, `survive` 10 Runden, 9 eigene gegen 24 auf Normal, L 20 / S 28, Leutnant Brakka) mit Feld `design:` auf den Entwurf, `map.act = 2`, Höhenstufen, Leiter, Ballisten-Objekten auf Gelände `ballista` wie im Entwurf. Alle Gegner nur mit `levelOffset` (−3…+2, Brakka über die Leutnant-Regel), keine Flieger, keine Reiter (content:check aus 11.2/11.7 grün).
2. **Balliste:** Erreicht die Truppe eine Felsnase, spielt die Lektion `scn.m2_1.tutorial_ballista` (Story 11.6) genau einmal; beide Ballisten sind von eigenen Fußtruppen bedienbar und schießen nach den Regeln aus 11.6; die gegnerische Bedienung (Brakka Ost, Crew West) schießt mit Profil `hold`.
3. **Wellen:** Söldnerwellen erscheinen angekündigt in Runde 3, 6 und 9 vom Nordrand (Ebene), in Runde 7 von Süden die Passstraße herauf, Stärke je Schwierigkeit wie im Entwurf.
4. **Jory:** steht als Gast (`team: other`, `guest: true`) am Gauklerwagen in Reichweite der Ostballiste und tritt nur bei, wenn ihn eine eigene Figur anspricht (`scn.m2_1.jory_talk`); Nebenziel „Jory anwerben“. Beitrittswerte nach `content/acts/act2/units.yaml` (11.5).
5. **Passhospiz:** Die Fort-Felder `[12,17]`/`[13,17]` heilen (Gelände `fort`, heal 20) und liegen im Schussfeld der Ostballiste.
6. **Drachenschatten:** Zu Beginn der Spielerphase von Runde 8 spielt `scn.m2_1.dragon_shadow` (Saat Drachen, nur Szene, keine Figur).
7. **Szenen:** `scn.m2_1.intro`, `scn.m2_1.outro`, `scn.m2_1.jory_talk`, `scn.m2_1.dragon_shadow` in DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen mit `requires: alive` und Ersatzsprecher-Kette, Hintergrund `windscharte`. In der Nachszene bieten Seraphine und Dravn den Freispruch an, Maelis noch nicht (PO-Entscheidung 2026-11-09, F1 = B: Haltungsantwort mit Folgen-Karte, ohne Flag).
8. **Knoten:** `m2_1` in `content/acts/act2/campaign.yaml` bekommt `pre`/`post`; `place: windscharte` bleibt; die Weltkarte bietet 2-1 an, sobald die Karte existiert (`mapInBuild` aus 11.3/11.11), und der Test aus 11.11 (`tests/unit/act2-campaign-order.test.ts`) sieht für m2_1 die Karte statt nur den Entwurf.
9. **Niederlage:** Avatar oder Lucan fallen (keine Schutzfigur im Entwurf).
10. **Gewinnbar und im Korridor:** `pnpm sim` mit Optionen aus 11.4 zeigt die Karte gewinnbar und im Korridor (NFR12) an frühester = spätester Position (2-1 ist `fixed: first`), Ergebnis mit Zahlen im Kopfkommentar der Karte; Act-1-Basislauf bleibt identisch.
11. **Unveröffentlicht:** `act2` bleibt in `content/packs.yaml` auf `released: false`; kein `pnpm content:lock`, keine Änderung an `content/released-ids.json`. Der Live-Schritt (F1) folgt mit dem ersten Live-Schritt nach 9.14, nicht mit dieser Story. Sichtprüfung im Dev-Build über `pnpm dev:act2`.
12. **Abnahme:** Bild der Karte bei 375 × 812 im Spiel; Abweichungen vom Entwurf stehen in `concept/27-ueberarbeitung/levels/abnahme/s2_2_1_windscharte.md` (neuer Abschnitt „Übernahme Story 11.12“); `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 Karte anlegen (AC 1, 3, 5, 9)
  - [x] `content/acts/act2/maps/m2_1_windscharte.yaml` aus dem Entwurf: `id: m2_1_windscharte`, `nameKey: map.m2_1_windscharte.name`, `act: 2`, `design:` = Entwurfsblock (Titel, intent, mood, phases, paths, zones, marks, notes) plus Verweis auf `s2_2_1_windscharte`; Kopfkommentar nach Muster `content/acts/act1/maps/m1_5_hungerlager.yaml:1-10` (Entwurf, Abweichungen, Sim-Zahlen [C], Szenen).
  - [x] Gegner: `level` streichen, nur `levelOffset` (11.2); `nameKey: unit.free_blade.name` statt des nicht vorhandenen `unit.mercenary.name`, Sprites wie Pool `free_blades` (`content/acts/act2/haunts.yaml:25-28`) [ASSUMPTION]. Waffen: Entwurf nennt Eisen; Akt 2 hat Stahl-Tier (11.7) – Eisen für P−3/P−2 behalten, nur wenn Sim es verlangt Stahl [ASSUMPTION].
  - [x] Brakka: `lieutenant: brakka`, Klasse/Signatur aus `content/acts/act2/lieutenants.yaml:20-29` (marksman, `wasp_sting`), `items` nach Leutnant-Definition statt `steel_bow` des Entwurfs; `levelOffset: 1` steht nur fürs Schema (Leutnant-Stufe kommt aus `lieutenantLevel`, 11-5 Dev Notes).
  - [x] Jory: `team: other`, `guest: true`, `recruit: { by: any, dialogue: scn.m2_1.jory_talk }`, `ignoreForRout: true`; Stufe/Items nicht aus dem Entwurf (Stufe 5, iron_dagger), sondern so, dass der Beitritt `units.yaml:8-18` (max(10, P−1), steel_dagger, travel_lute) entspricht (PO 2026-11-09: Werte aus den Akt-2-Einheiten; `raiseMapChar` hebt auf P − 1).
  - [x] Truhe `c_pay` (400 Gold) mit Schlüssel bei `g_east` (`drops: [1]`) wie Entwurf; Nebenziele `s_jory` (recruit, 200 Gold) und `s_pay` (open_chests, vulnerary).
  - [x] Trigger: Lektion per `unit_enters` (team player) auf die Nachbarfelder beider Ballisten bzw. Rampen-/Treppenfuß statt `turn_start 1` (PO-Entscheidung 2026-11-09, F3 = A); `t_riders`/`scn.s2_1.riders_lesson` **entfällt** (keine Reiter auf dem Brett, Epic 11/11.7); Drachenschatten `turn_start 8 player` → `scn.m2_1.dragon_shadow`.
  - [x] Höhen prüfen: Entwurf setzt Stufe 2 nur auf die Ballistenfelder `[3,13]`, `[16,10]`; Bedienung verlangt Nachbarfeld gleicher Höhe (`balance.yaml:202-205`). Sicherstellen, dass `crag`-Felder um die Ballisten Stufe 2 haben (ggf. `levels`-Bereich auf die Nase erweitern, als Abweichung dokumentieren).
  - [x] `goldReward: 1100` übernehmen [ASSUMPTION, 11.27 stimmt ab]; `nameKey` in `content/acts/act2/locales/{de,en}.names.yaml`.
- [x] T2 Szenen DE/EN (AC 6, 7)
  - [x] `content/acts/act2/scenes/scn.m2_1.intro.yaml`: Ankunft am Scheitel des Grauen Kamms, Brakkas Sperre, `background: windscharte`. Text **entwerfen und als Vorschlag markieren** (Schreib-Pipeline der Narrative), nicht still endgültig.
  - [x] `scn.m2_1.jory_talk.yaml` (Ansprechen, Ersatzsprecher-Kette, Sprecher `by: any`).
  - [x] `scn.m2_1.dragon_shadow.yaml` (Söldner und Truppe halten inne; keine Figur).
  - [x] `scn.m2_1.outro.yaml`: Brakka zieht ab („wurde bezahlt“), Angebote Seraphine und Dravn (PO-Entscheidung 2026-11-09, F2 = A: Rowenas Lanzenreiter ohne Rowena + Bote Dravns), Maelis fehlt; Antwortmodell F1 = B (PO 2026-11-09).
  - [x] EN in `content/locales/en/act2.dialogue.yaml`; Box ≤ 110 Zeichen; Ersatzsprecher-Prüfung grün.
- [x] T3 Knoten verdrahten (AC 8)
  - [x] `m2_1` in `content/acts/act2/campaign.yaml:24`: `pre: scn.m2_1.intro`, `post: scn.m2_1.outro`; Kommentar „vorläufige Karten-Id“ für m2_1 entfernen. Nur diese Zeile anfassen (11.11 arbeitet parallel an derselben Datei – vor Beginn rebasen).
  - [x] Weltkarten-Slot `content/world/valmora.yaml:54` (`wind_gap`) prüfen, nichts neu anlegen.
- [x] T4 Simulation und Abstimmung (AC 10)
  - [x] `pnpm sim m2_1_windscharte --campaign act2 --start expected --runs 50` (Optionen im Kopf von `tools/simulate.ts`), alle drei Schwierigkeiten; Varianten mit `--set` / `--json` + `pnpm sim:diff`; mit und ohne Haunts (`--haunts`).
  - [x] Act-1-Basislauf `pnpm sim --campaign act1 --runs 50 --seed 1` unverändert.
- [x] T5 Ansicht und Abnahme (AC 12)
  - [x] `pnpm levels` (Atlas), Spielbild bei 375 × 812 über `pnpm dev:act2`, Lautstärken auf 0.
  - [x] Abschnitt „Übernahme Story 11.12“ in `levels/abnahme/s2_2_1_windscharte.md` mit allen Abweichungen (Id, Szenen-Ids, Reiter-Lektion gestrichen, Lektions-Trigger, Gegnernamen, Brakka-Items, Jory-Werte, Höhen).
  - [x] Ortsbild `windscharte` ist schon in `ACT2_LOCATIONS` (`tools/art/build.py:49`) und `packs.yaml` act2 – nichts zu tun außer `git lfs pull` vor `pnpm art:build`.
- [x] T6 Tests (AC 2–8)
  - [x] Karten-Test (`labState` oder Szenario in `tests/fixtures/lab/m2_1_*.yaml`): Ballisten bedienbar von beiden Nasen, Lektion feuert einmal, Wellen in R3/6/7/9 an den richtigen Rändern, Jory tritt nur bei Ansprechen bei, Hospiz heilt, Sieg nach Runde 10.
  - [x] Bestehenden Test `tests/unit/act2-drafts.test.ts` und `act2-campaign-order.test.ts` grün halten (m2_1 jetzt mit Karte).
- [x] T7 Abschluss
  - [x] Neue Entscheidungen (F1-Antwort, Überbringer, Trigger) ins Decision-Log von `concept/22-narrative/` bzw. `concept/26-epics/` eintragen, nie in `01-decisions.md`.
  - [x] `pnpm check` grün; **kein** `released: true`, **kein** `content:lock`.

## Dev Notes

### Ausgangslage (Stand 2026-11-09)

- `content/acts/act2/` hat `campaign.yaml`, `flags.yaml`, `haunts.yaml`, `lieutenants.yaml`, `units.yaml`, Locales und `scenes/` (`scn.lt.*`, `scn.m2_1.tutorial_ballista`). **`maps/` gibt es noch nicht** – diese Story legt den Ordner an.
- Knoten `m2_1` (`campaign.yaml:24`): `fixed: first, map: m2_1_windscharte, place: windscharte, merchantTier: 0`, noch ohne `pre`/`post`. `positionLevel.base: 12` (Entwurf rechnet mit P = 11 → Stufen im Entwurf um 1 zu niedrig, `levelOffset` gleicht das aus).
- Ballistenregel (11.6): Objekt `type: ballista` braucht Gelände `ballista` darunter (unpassierbar); Bedienung von Fuß-/Rüstungstruppen auf Nachbarfeld gleicher Höhe; `ballista_bolt` Mt 12, Tr 70, Rw 3–10; ein Schuss je Ballista und Phase, kein Gegenschlag; KI schießt, wenn wach und benachbart, `hold` darf hingehen. Brakkas Skills `besideBallista`, `siegeRangeBonus` (`content/core/skills.yaml:86-87`).
- Flags aus 11.5 (`content/acts/act2/flags.yaml`): `e05`…`e08`, `joined_sable`, `maelis_ledgers`, `chronicle_read`, `m2_2_seal` – **nichts für 2-1**. E5 (Odile/Seraphine) und E6 (Varek/Dravns Freispruch) liegen nach 2-5/2-6.
- Szenen-Schema (`src/content/schemaCampaign.ts:24-60`): Wahlzeile `{ id, title?, choice: [{ id, text, stance, effects?, summary? }] }` ist in jeder Szene erlaubt; Effekte (`schemaConditions.ts:44-59`) u. a. `setFlag`, `stance`, `meet`. Muster E3: `content/acts/act1/scenes/scn.m1_5.outro.yaml:64-76`. `summary` ist der Text der Folgen-Karte.
- Trigger-Typen (`src/content/schemaMap.ts:104-105`): `turn_start`, `unit_enters` (team/unit/area).
- Heilung: `fort` heal 20 (`content/core/terrain.yaml:17`, gelesen in `src/core/rules/effects.ts:299`); das Passhospiz sind die `F`-Felder in Zeile y 17.
- Ortsbild: `art/mockups/locations-s1/windscharte.png` (LFS) und `art/prompts/loc_windscharte.md` existieren; `ACT2_LOCATIONS` und die packs-Zuordnung hat Story 11.3 schon angelegt – die gemeinsame Regel „erste Story mit Akt-2-Paket legt `ACT2_LOCATIONS` an“ ist damit erledigt. Abnahme der Ortsbilder (`concept/23-art-direction/abnahme/akt2-ortsbilder.md`) ist noch offen und blockiert nicht.

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_1_windscharte` | `m2_1_windscharte` | Karten-Id des Knotens (11.3/11.11) |
| `scn.s2_1.*` | `scn.m2_1.*` | Szenen-Schema `scn.<knoten>.*`; `units.yaml` nennt schon `scn.m2_1.jory_talk` |
| `scn.s2_1.ballista_lesson` R1 | `scn.m2_1.tutorial_ballista` per `unit_enters` | Szene aus 11.6, Kommentar dort |
| `t_riders` / `riders_lesson` | entfällt | keine Reiter (GDD-Log 2026-11-05, 11.7) – Rest der alten Reiterfassung |
| `unit.mercenary.name` | `unit.free_blade.name` | Schlüssel existiert nicht; Fraktion `free_blades` |
| `level` + `levelOffset` | nur `levelOffset` | 11.2, content:check |
| Brakka `steel_bow`, Stufe 12 | Leutnant-Definition (`wasp_sting`), `lieutenantLevel` | 11.5 |
| Jory Stufe 5, `iron_dagger` | Werte aus `units.yaml` | 11.5 (max(10, P−1), steel_dagger) |
| Notizen „Regel Balliste fehlt“, „brakka fehlt“ | erledigt | 11.6, 11.5 |

### Szenen-Inhalt: Quellenlage

- Missionsliste `concept/22-narrative/missionsliste-s1.md:66,72`: „Neues Land, neue Gefahr; zwei Angebote auf Freispruch (Seraphine, Dravn)“, Saat Drachen. Maelis erst ab 2-4.
- `narrative.md:63` Freispruch gegen einen Auftrag, nacheinander; `:84,:193,:203` Seraphines Freispruch ist eine Falle (Erlass mit dem Siegel aus 2-2, Lüge platzt in 2-8); `:150,:460` Haltungen nur in Schlüsselszenen, ohne mechanische Wirkung; `:682-701` Entscheidungstabelle ohne Entscheidung in 2-1; `:243` Brakka „Söldnerin für den Meistbietenden“; `:223` Jory, 26, Spielmann der Gaukler.
- Widerspruch: `narrative.md:436` (Key Conversation 6 „Drei Angebote“, Sprecher inkl. **Maelis**) und `:594` („drei Throne, drei Gesichter“) gegen Epic, Missionsliste und Narrative §63 (nur zwei in 2-1). **Es gilt das Epic** (Artefakt-Regel in AGENTS.md); Maelis kommt in 2-1 nicht vor.
- Entwurf `:149,:181`: „Rowenas Lanzen und ein Bote Dravns“ überbringen. Rowena ist Bossin von 2-3 → siehe F2.
- `geografie-valmora.md:31,50,59`: Windscharte = Scheitel des Wachpasses, Grauer Kamm 1400 m, trockenes altes Flusstal, Drachenort (Luft). Passhospiz steht in keiner Narrative-Quelle (nur Entwurf).
- Brakkas Auftraggeber in 2-1 nennt keine Quelle (in 2-7 Maelis). Vorschlag: im Text offen lassen („der andere zahlt heute“, passt zu `scn.lt.brakka.yaml:8`) – PO-Entscheidung 2026-11-09, F4 = A.

### Was nicht angefasst wird

- `content/packs.yaml` (`released` bleibt false), `content/released-ids.json`, `src/persistence/save.ts`: Akt 2 ist in diesem Auftrag unveröffentlicht; keine Migration, keine Spielstand-Fixture nötig, solange das Speicherformat gleich bleibt.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` wird von der parallel laufenden Story 11.11 gepflegt.
- `concept/01-decisions.md` (eingefroren).

### Testing

- `pnpm check` (lint inkl. Typecheck, test, content:check, build mit Bundle-Budget).
- Lab-Szenario für Ballisten- und Wellen-Prüfungen (`pnpm lab`, Format in `tools/lab.ts`, `src/lab/scenario.ts`).
- Vitest-Timeouts: bei Timeout Datei allein laufen lassen, nicht Worker reduzieren (AGENTS.md).

### Previous Story Intelligence

- 11.6: Lektion-Szene liegt schon vor; Handbuch `lesson_ballista` (`content/core/handbook.yaml:411`) verweist darauf – nur den Trigger setzen.
- 11.5: Leutnant-Stufe überschreibt `levelOffset`; Jory `joins: m2_1`; Ersatzsprecher-Ketten für Akt-2-Gefährten.
- 11.7: keine Flieger/Reiter/`cavalier` ab Akt 2 (content:check); Stahl-Tier; Fraktion `free_blades`.
- 11.10: `guest: true` nur mit `team: other`; Gäste treten nur nach Ansprechen bei; content:check validiert die Entwürfe (`src/content/drafts.ts`).
- 11.4: Sim-Optionen `--campaign act2`, `--start expected`, `--position`, `--node`, `--map-file`, `--haunts`; Act-1-Basis muss identisch bleiben.
- 11.11 (parallel): `tests/unit/act2-campaign-order.test.ts:18` ordnet m2_1 → `s2_2_1_windscharte`, `:130` prüft Sieg-Typ `survive`; nach dieser Story muss der Test die echte Karte finden.
- Muster Akt 1: `9-6-mission-1-5-das-hungerlager-und-entscheidung-e3.md` (survive, Aufgabenstruktur T1–T6), Karte `m1_5_hungerlager.yaml`, Anwerben `m1_4_wolfslager.yaml`.

### Project Context Rules

- Keine Spielwerte im Code, kein sichtbarer Text im Code (Locales), Code/IDs Englisch, Konzepttexte Deutsch.
- Zufall nur aus dem Seed-RNG; Vorschau und Auflösung nutzen denselben Formelcode.
- Nie auf `main`, PR nach grüner CI.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 290-301]
- [Source: concept/27-ueberarbeitung/levels/s2_2_1_windscharte.yaml; levels/abnahme/s2_2_1_windscharte.md]
- [Source: concept/22-narrative/missionsliste-s1.md:66-78,120]
- [Source: concept/22-narrative/narrative.md:63,150,223,243,436,460,594,682-701]
- [Source: concept/22-narrative/geografie-valmora.md:31,50,59]
- [Source: content/acts/act2/{campaign,flags,units,lieutenants,haunts}.yaml]
- [Source: src/content/schemaCampaign.ts:24-60,135-160; schemaMap.ts:104-105; schemaConditions.ts:44-59]

## Offene Fragen an den Produktinhaber

- **F1 (entschieden 2026-11-09: B)** Wie wird „bieten den Freispruch an“ abgebildet?**
  A) nur Szene, keine Antwort; B) eine Antwort Rhens mit Haltung (warm/nüchtern/trotzig) und Folgen-Karte, Effekt nur `stance`, kein Flag (alles hält sich offen bis E5/E6); C) echte Entscheidung mit neuem Flag (z. B. `e2_1_offer: seraphine|dravn|none`) und späteren Folgen; D) B plus Merk-Flags `met_seraphine`/`met_dravn` ohne Wahl.
  **Vorschlag B**: Quellen sehen in 2-1 keine Entscheidung (narrative.md:682-701), die gemeinsame Regel verlangt aber Haltung und Folgen-Karte je Antwort; C würde E5/E6 vorwegnehmen.
- **F2 (entschieden 2026-11-09: A)** Wer überbringt die Angebote?** A) Rowenas Lanzen (ohne Rowena) + Dravns Bote, Briefe/Siegel; B) Seraphine und Dravn persönlich; C) Rowena persönlich als Seraphines Stimme. **Vorschlag A** (Entwurf; Rowena bleibt Überraschung für 2-3).
- **F3 (entschieden 2026-11-09: A)** Lektion Balliste: A) per `unit_enters` an der ersten Nase; B) wie Entwurf zu Rundenbeginn 1. **Vorschlag A** (11.6 sieht es so vor).
- **F4 (entschieden 2026-11-09: A)** Brakkas Abgang/Auftraggeber: A) Auftraggeber bleibt ungenannt, sie zieht nach R10 ab; B) Andeutung auf Maelis (Vorgriff auf 2-7); C) Dravn. **Vorschlag A.**

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (gds-dev-story); Szenenentwurf und Übersetzung per Haiku-Subagent (Schreib-Pipeline), überarbeitet.

### Debug Log References

- `pnpm sim --campaign act2 --start expected --runs 50` (Normal/Leicht/Schwer, JSON im Scratchpad), Varianten per `--map-file` (ohne Ballisten, Wellen P−3, Westballiste unbemannt, nur Brakka bemannt, zwei Startgegner weniger); `pnpm sim --campaign act2 --runs 50` verkettet.
- `pnpm sim m2_1_windscharte` ohne `--campaign` geht nicht (Werkzeug kennt nur Knoten von Akt 1) – deshalb `--campaign act2 --start expected`.

### Completion Notes List

- T1: Karte aus dem Entwurf übernommen (Abweichungen in der Abnahme-Datei): Gegner nur mit `levelOffset` als „Freie Klinge“ mit Pool-Figuren, Plänkler der Wellen mit Schwert (skirmisher führt keine Lanze), Brakka behält `steel_bow` (Signatur `wasp_sting` filtert `lieutenantItems` aus den Kartenwaffen, sie ist Beute), Jory `char: jory` ohne eigene Stufe/Waffen (Stufe 11 = P − 1 über `raiseMapChar`). Höhen passten schon (crag = Stufe 2). Lektion per `unit_enters` auf Felsnasen und Treppen, Drachenschatten R8. Keine Heimsuchungs-Anker (Entwurf hat keine).
- T2: Szenen intro/jory_talk/dragon_shadow/outro DE in `content/acts/act2/scenes/`, EN in `content/locales/en/act2.dialogue.yaml`; Entwurf Haiku, danach von Hand überarbeitet (Floskeln, Sprecher-neutrale Kettenzeilen, Brakkas Formel nicht doppelt zur Begegnungszeile). Outro: Antwort `c01` mit Titel (Folgen-Karte, Chronik-Eintrag), drei Haltungen ohne Wirkung; Lucans Satz danach folgt der vorherrschenden Haltung; Jory nur mit `requires: alive`. Lanzenritter und Bote sprechen als Erzähltext mit wörtlicher Rede (für sie gibt es keine Halbfigur, `scene-view.test.ts` verlangt eine je Sprecher); Kartenname `map.m2_1_windscharte.name`.
- T3: `m2_1` mit `pre`/`post`; Weltkarten-Slot `wind_gap` unverändert.
- T4 [C]: Normal 78 % Sieg / 4,64 Niedergestreckte / 1,65 Tote (Niedergestreckte über dem Korridor 0,4–1,3), Leicht 86 % / 1,36, Schwer 70 % / 8,12; verkettet nach Akt 1 87 % / 1,63 / 0,54. Gold 1 300 unter der Akt-2-Kurve (2 000–3 000). Ohne Ballisten 100 % / 2,40: die Ballisten treiben die Niedergestreckten. Nicht still geändert, als PO-Frage gemeldet. Akt 1: keine Datei von Akt 1 und kein Code geändert, Basislauf damit unverändert (kein sim:diff nötig).
- T5: `pnpm levels` neu erzeugt, Abschnitt „Übernahme Story 11.12“ in der Abnahme-Datei; Lab-Szenario `tests/fixtures/lab/windscharte-2-1.yaml` für die Sichtprüfung.
- T6: `tests/unit/m2-1-windscharte.test.ts` (12 Tests): Knoten/Ziel, 20/24/28 Gegner, Stufen auf P, Wellen R3/6/9 Nord und R7 Süd, Ballisten von beiden Nasen bedienbar, Lektion einmal, Drachenschatten R8, Jory als Gast auf Stufe 11, Hospiz heilt im Schussfeld, Nachszene mit Lanzenritter/Bote ohne Maelis/Rowena, Haltung ohne Flag, Jory- und Lucan-Zeilen nach Bedingung.
- Bestehende Tests nachgezogen, die „Akt 2 hat noch keine Karte“ annahmen: `act-title`, `act-transition`, `scenery` (Akt der Karte aus dem Ordner), `sim-acts` (Probekarte jetzt ausdrücklich an `m2_1`).
- Sichtprüfung 375 × 812 (Dev-Build act2, Lautstärken 0): Karte zu Beginn, Nachszene mit den drei Haltungen und Folgen-Karte.
- T7: Decision-Logs `concept/22-narrative/decision-log.md` und `concept/21-gdd/decision-log.md`; act2 bleibt `released: false`, kein content:lock.
- Ultimate context engine analysis completed - comprehensive developer guide created (gds-create-story, 2026-11-09). Sprint-Status bewusst nicht geändert (paralleler Auftrag 11.11).

### File List

- content/acts/act2/maps/m2_1_windscharte.yaml (neu)
- content/acts/act2/scenes/scn.m2_1.intro.yaml (neu)
- content/acts/act2/scenes/scn.m2_1.jory_talk.yaml (neu)
- content/acts/act2/scenes/scn.m2_1.dragon_shadow.yaml (neu)
- content/acts/act2/scenes/scn.m2_1.outro.yaml (neu)
- content/acts/act2/campaign.yaml
- content/acts/act2/locales/de.names.yaml
- content/acts/act2/locales/en.names.yaml
- content/locales/en/act2.dialogue.yaml
- tests/unit/m2-1-windscharte.test.ts (neu)
- tests/fixtures/lab/windscharte-2-1.yaml (neu)
- tests/unit/act-title.test.ts
- tests/unit/act-transition.test.ts
- tests/unit/scenery.test.ts
- tests/unit/sim-acts.test.ts
- concept/27-ueberarbeitung/levels/abnahme/s2_2_1_windscharte.md
- concept/22-narrative/decision-log.md
- concept/21-gdd/decision-log.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/11-12-mission-2-1-wind-ueber-der-eisenmark.md

### Change Log

- 2026-11-09: Story 11.12 umgesetzt (Karte, Szenen DE/EN, Knoten, Tests, Abnahme, Decision-Logs); PO-Antworten F1–F4 eingearbeitet; Status review.
