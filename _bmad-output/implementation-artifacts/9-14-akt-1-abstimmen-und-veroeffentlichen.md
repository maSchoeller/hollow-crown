# Story 9.14: Akt 1 abstimmen und veröffentlichen

Status: ready-for-dev

## Story

Als Produktinhaber
möchte ich Akt 1 in der umgebauten Fassung als erstes echtes Release veröffentlichen und testen,
damit die Kernhypothese geprüft wird.

Umgeschrieben am 2026-11-05: Das Release folgt auf den Umbau von Akt 1 (Epic 15); die Abstimmung liegt in Story 15.10, die Leistungsmessung in 15.11. Vorbereitet am 2026-11-07 (Antworten des Produktinhabers zu 15.10).

## Acceptance Criteria

1. **Angenommen** alle Stories von Epic 15, Epic 13 und der bewertete Tonbruch-Test (Story 8.1), **wenn** die Pflichtteile vorliegen (neue Karten, Missionsfolge, Weltkarte v5, Leistungsmessung auf dem Referenzgerät, Brettfiguren aus Schritt 1, Story 15.9), **dann** läuft `pnpm content:lock` erst jetzt (nach der Umbenennung `kael` → `lucan`), und ein Fixture-Spielstand für spätere Migrationen liegt unter `tests/fixtures/saves/`.
2. **Und** ein Playtest-Plan (5–10 Tester, Erfolgskriterien aus dem GDD, dazu Burg in 3D, neue Karten und Höhenregel) liegt vor; er misst die Spielzeit von Akt 1 je Tester. Musik und Vertonung (8.8, 8.9) blockieren das Release nicht.

## Release-Checkliste

Reihenfolge nach „Akt-Release“ in `AGENTS.md`. ✅ = am 2026-11-07 erledigt, 🔒 = sperrt oder veröffentlicht (erst nach Freigabe des Produktinhabers), 👤 = liegt beim Produktinhaber.

### A. Voraussetzungen (Stories)

- [x] Epic 13 done (`sprint-status.yaml`)
- [x] Epic 15: 15.1, 15.2, 15.4, 15.5, 15.7, 15.8, 15.9, 15.10, 15.13, 15.14 done; 15.3 done seit 2026-11-07 (Prolog nur Siegquote)
- [ ] 👤 **15.6** Szenen: offen ist nur noch die Abnahme der fünf neuen Ortsbilder (`art/prompts/loc_*.md`, darunter `loc_paktwacht_spaetsommer.md`: die eroberte Paktwacht im Spätsommer für 1-6 nach, 1-7 nach, 1-8 vor und nach, seit 2026-11-13 eingebunden)
- [ ] 👤 **15.11** Leistung großer Karten: Handy-Test des Produktinhabers auf dem Referenzgerät (Status review)
- [ ] 👤 **15.12** Weltkarte flüssig, Paktwacht als Ruine: Handy-Test des Produktinhabers (Status review)
- [x] **15.15** Jahreszeiten-Boden: done (PR #130, #131)
- [x] **15.16** Winter-Deko und Waldvarianten: blockiert das Release nicht (Produktinhaber 2026-11-07); betrifft nur Akt 2 und 3
- [ ] 👤 **8.1** Tonbruch-Test: Bögen von Produktinhaber und 2–3 Testern auswerten (`concept/23-art-direction/tonbruch-test.md`); ohne bestandenen Test kein Release

### B. Inhalt und Prüfungen (ohne Sperre)

- [x] Abstimmung Leicht und Normal im Korridor (Story 15.10, Nachtrag 2026-11-07); Schwer nach dem Release (Story 9.15)
- [x] `pnpm check` grün auf dem Stand vom 2026-11-07
- [x] Playtest-Plan `concept/21-gdd/playtest-akt1.md` mit Spielzeit-Messung (AK 2)
- [x] Alte IDs vor der ersten Sperre aufgeräumt (Produktinhaber 2026-11-07): `promotion_seal` entfernt (Item, Locales, Bild), Skills `sol` → `pro_duel`, `impale` → `pro_guard`, `longshot` → `pro_far_shot` umbenannt, Wirkung unverändert. Kein Akt-1-Spielstand kann sie tragen: das Siegel steht in keinem Händler, keiner Beute und keiner Wirkung von `act1`, Profiklassen entstehen nur per Aufstieg mit `use.promote` (in Akt 1 hat kein erhältliches Item das), Klassen-Skills folgen aus `classId` und stehen nicht im Spielstand. Damit entfallen Migration und `renames.yaml` in Story 10.2 und 10.4.
- [x] Nach Abschluss von A: `pnpm check` grün, `pnpm sim --campaign act1 --runs 50` auf Leicht und Normal erneut gemessen am 2026-11-13 (nach Story 11.28, die in der Simulation Söldner anwirbt). Tabelle unten; `balance.yaml` dabei nicht geändert.

#### Messung 2026-11-13 (nach Story 11.28)

| Mission | Leicht: Sieg % / Ohnm. / Gold / Stufe (erw.) | Normal: Sieg % / Ohnm. / Gold / Stufe (erw.) |
| --- | --- | --- |
| Prolog | 100 / 0,00 / 398 / 1,5 (1) | 88 / 0,12 / 380 / 1,5 (1) |
| 1-1 | 100 / 0,02 / 1348 / 1,6 (2) | 98 / 0,48 / 1382 / 1,8 (2) |
| 1-2 | 100 / 0,04 / 1600 / 2,7 (3) | 96 / 0,40 / 1600 / 3,1 (3) |
| 1-3 | 100 / 0,26 / 1100 / 3,5 (3) | 98 / 1,00 / 1100 / 3,9 (3) |
| 1-4 | 100 / 0,16 / 1000 / 4,1 (4) | 98 / 0,98 / 1098 / 4,9 (4) |
| 1-5 | 100 / 0,48 / 900 / 5,1 (5) | 100 / 0,82 / 900 / **6,2 ↑** (5) |
| 1-6 | 100 / **0,80 ↑** / 1462 / 6,6 (6) | 100 / **1,57 ↑** / 1590 / **7,2 ↑** (6) |
| 1-7 | 100 / 0,22 / 1160 / 7,7 (8) | 100 / 0,41 / 965 / 8,1 (8) |
| 1-8 | 100 / 0,18 / 1200 / 8,4 (9) | 98 / 1,00 / 1200 / 8,9 (9) |

Abschluss: Leicht 50/50 Läufe, Endgold 2501, Endstufe 8,8, Kampfzeit rund 2,2 h. Normal 49/50 (ein Lauf scheitert in 1-2), Endgold 2151, Endstufe 9,2, Kampfzeit rund 2,4 h.

Auffällig:
- **Söldner (neu):** die Heimat wirbt jetzt 3,5 bis 3,6 Söldner je Lauf an und gibt dafür 4716 Gold (Normal) bzw. 5067 Gold (Leicht) aus – der größte Posten, vor Heilen (2500 / 2150). Das Endgold liegt damit unter den Zahlen von vor Story 11.28; die Truppe ist größer statt reicher.
- **Armeestufe über Erwartung** auf Normal in 1-5 (6,2 statt 5) und 1-6 (7,2 statt 6): Folge der angeworbenen Söldner. Ab 1-7 ist der Korridor wieder eingehalten – die Mitte des Akts ist leichter geworden, das Ende nicht.
- **Ohnmachten über Korridor in 1-6** auf beiden Stufen (0,80 bzw. 1,57). Bekannt und unverändert: 1-6 ist die längste Karte (17 bis 19 Runden).
- **Nebenziel-Gold unter der GDD-Kurve** in 1-1, 1-3 und 1-5 auf beiden Stufen – unverändert gegenüber der Messung vom 2026-11-07, keine Folge von 11.28.
- Werte in `balance.yaml` wurden nicht geändert. Ob die leichtere Aktmitte so bleiben soll, entscheidet der Produktinhaber.
- [x] **EP vor 1-8:** bleibt bei 8,6 auf Normal, 1-7 bekommt keine eigene EP-Quelle (Produktinhaber 2026-11-07, GDD-Log)
- [ ] 👤 **Rechtliche Prüfung Nemesis-Patent** vor der Veröffentlichung (GDD „Risiken“, `[ASSUMPTION: Prüfung nötig]`)

### C. Sperren und veröffentlichen (🔒, erst nach A und B)

- [ ] 🔒 `content/packs.yaml`: Paket `act1` steht schon seit Story 7.1 (2026-10-24) auf `released: true`, damit der Entwicklungs-Build Akt 1 enthält. Vor dem Lock bestätigt der Produktinhaber, dass genau dieser Stand das Release ist; kein weiteres Paket auf `released: true`.
- [ ] 🔒 `pnpm content:lock` → `content/released-ids.json` (sperrt alle IDs von `core` und `act1`). Danach scheitert `content:check`, wenn eine gesperrte ID fehlt; umbenennen nur mit `alt: neu` in `content/renames.yaml`.
- [ ] 🔒 Fixture-Spielstand des Releases: `pnpm tsx tests/fixtures/saves/generate.ts` auf dem gesperrten Stand, dazu einen Spielstand `tests/fixtures/saves/format2-release-act1.json` (Kampagne nach 1-8, Burg als Heimat), damit die erste Migration nach dem Release dagegen testet (`tests/unit/migrations.test.ts`). Speicherformat bleibt 2 (`SAVE_FORMAT` in `src/persistence/save.ts`), keine Migration nötig, solange sich Format und gesperrte IDs nicht ändern.
- [ ] 🔒 Alle Prüfungen grün, Pull Request gegen `main`; nach dem Merge bekommen Spieler die Update-Abfrage.
- [ ] Playtest starten (Plan oben), Ergebnis in `concept/21-gdd/decision-log.md`; danach Story 9.15 (Schwer).

## Dev Notes

- **Nicht vor Freigabe sperren:** `content:lock` und das Release-Fixture erst, wenn A vollständig ist und der Produktinhaber freigibt (Auftrag 2026-11-07: kein `content:lock`, kein `released: true` vor dem Handy-Test für 15.11 und 15.12).
- **Merge:** nach grüner CI (check, e2e, perf) per Pull Request, nie `gh pr merge --auto` (main hat keine Pflicht-Checks).
- **IDs prüfen vor dem Lock:** Karten-IDs wie `m1_3_silberbach` sind absichtlich geblieben (Spielstände, Story 15.3). Nach dem Lock kostet jede Umbenennung einen `renames.yaml`-Eintrag und ggf. eine Migration.
- **Spielzeit:** Die Kampagnenliste zeigt die Spielzeit je Spielstand (`formatPlaytime`, `src/app/campaignInfo.ts`); Tester lesen sie nach 1-8 ab.
- **Werkzeuge:** `tools/content-lock.ts`, `tools/content-check.ts`, `src/content/ids.ts` (`collectIds`, `mergeLock`), `tests/fixtures/saves/generate.ts`.

### References

- `AGENTS.md` „Akt-Release“
- `concept/26-epics/epics/epic-09.md` Story 9.14 und 9.15, `epic-15.md`
- `concept/24-architecture/architecture.md` §5.15 (Fixtures), §5.16 (ID-Sperre)
- `concept/21-gdd/gdd.md` „Success Metrics“, „Risiken“
- `_bmad-output/implementation-artifacts/15-10-akt-1-neu-abstimmen.md`

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Vorbereitung, gds-create-story)

### Completion Notes List

- 2026-11-07: Alte IDs vor der Sperre aufgeräumt (siehe Checkliste B); `pnpm check` grün, `pnpm sim --campaign act1 --runs 50` auf Normal unverändert gegenüber `main`.

- 2026-11-07: Story-Datei mit Release-Checkliste angelegt; Playtest-Plan geschrieben; alles ohne Sperre erledigt. Offen beim Produktinhaber: 15.6 (Bild Paktwacht Spätsommer, Abnahme Ortsbilder), Handy-Test 15.11 und 15.12, Tonbruch-Test 8.1, Nemesis-Prüfung, EP vor 1-8, ob 15.16 das Release blockiert, Freigabe für `content:lock`.

### File List

- `_bmad-output/implementation-artifacts/9-14-akt-1-abstimmen-und-veroeffentlichen.md` (neu)
- `concept/21-gdd/playtest-akt1.md` (neu)
