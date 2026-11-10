---
baseline_commit: 656280a3
---
# Story 11.19: Mission 2-8 „Kronfeld“ (Finale, große Schlacht)

Status: review

<!-- Erstellt und umgesetzt 2026-11-10 (Nachtbetrieb, PO schläft): offene Punkte als [ASSUMPTION] mit der empfohlenen Option, gesammelt unter „Offene Fragen an den Produktinhaber“. Branch claude/story-11-19-mission-2-8 auf origin/main (2-7 als PR #186 inzwischen gemergt). -->

## Story

Als Spieler
möchte ich am neutralen Treffpunkt den Verrat der Mächte überleben und über den Fluss ausbrechen,
damit Akt 2 mit „Die Krone war hohl“ endet.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/m2_8_kronfeld.yaml` übernimmt den Entwurf `s2_2_8_kronfeld.yaml` (G 30 × 40, Abend, Herbst über `act: 2`, 15 eigene gegen L 36 / N 40 / S 46) mit `design:`; Gegner nur mit `levelOffset` (−3…−1, Leutnants +1/+2), keine Flieger, keine Reiter.
2. **Ziel-Phasen (11.8):** `survive 5 → escape` Nordufer `rect [0,0,29,1]`, `min: 6`, `must: [avatar, lucan]`; Niederlage Avatar oder Lucan.
3. **Höhen:** Treffpunkt und Osthügel Terrasse (Stufe 1), Felsnase `crag` (Stufe 2), Balliste `b_hill` [24,13] auf Stufe 2, Treppe [24,15] Stufe 1; Aufstellung nur auf der Terrasse.
4. **Leutnants:** Rowena (Norden, vor dem Tor), Grell (Westen), Brakka (Osten an der Balliste, `hold`), Sable (Süden); nach `e07: warn` statt Sable der Hauptmann mit gleichen Werten.
5. **Brückentor:** `gate_closed` [14,6]/[15,6]; Runde 6 `scn.m2_8.rowena_hesitates`, Tor auf (`set_terrain gate`), Rowena, n1, n2 `hold` (Saat Rowena).
6. **Furt:** Wer die Furt `rect [23,2,25,5]` betritt, beginnt die Flucht sofort (`advance_objective`, `scn.m2_8.ford`); Wellen R3 West, R5 Ost, R7 Süd, R9 Lanzen an der Furt, angekündigt.
7. **Szenen DE/EN, Box ≤ 110:** `scn.m2_8.intro`, `.hollow_crown` (R1), `.rowena_hesitates` (R6), `.ford`, `.outro`; Hintergrund `kronfeld`; Seraphine spricht mit Halbfigur (`unit.seraphine.name` neu).
8. **Folgen:** `e05` (Odile bei Seraphine bzw. in der Truppe), `e06: pardon` (Varek unter Dravns Bannern), `e07`/`joined_sable` (Sable spricht als Gefährtin bzw. Hauptmann im Süden), `e08` + `maelis_ledgers` (Seraphines Zeile), `m2_2_seal`, `chronicle_read`; Gefährten von Akt 2 (Jory, Ilka, Nell, Amos, Brann, Odile, Sable) nur mit `requires: alive` bzw. Ersatzsprecher-Kette.
9. **Relikt-Stufen (11.9):** ab `completed m2_8` Schild der Paktwächter Stufe 3 (VER 6, `warden_ward_awake` + `warden_hold`), Drachenglut Stufe 2 (MAG +3, `ember_stir`) [ASSUMPTION].
10. **Akt-Ende (11.1):** `m2_8` ist `fixed: finale` mit `pre`/`post` und zwei Glutfunken [ASSUMPTION]; danach ist Akt 2 vorbei, ohne Paket act3 bleibt `c.act = 2` („Weitere Missionen folgen“), offene Nebenquests bleiben.
11. **Gold:** `goldReward` 3 000 (oberer Rand des Korridors 2 000–3 000), Nebenziele „niemand fällt“ 800 und „14 Runden“ 500 (Anteil 43 %) [ASSUMPTION].
12. **Heimsuchungen:** zwei Anker (`rout` Treffpunkt, `treasure` Osthügel).
13. **Chronik:** keine fünfte Akt-2-Seite (Narrative: 4 je Akt, alle vergeben); die Nachszene fasst die Seiten zusammen, wenn die Chronik gelesen ist [ASSUMPTION F1].
14. **Unveröffentlicht:** `act2` bleibt `released: false`; kein `content:lock`.
15. **Prüfung:** `pnpm check` grün; Kampagnen-Sim act2 Normal und Schwer, Abweichungen nur berichtet (11.27).

## Tasks / Subtasks

- [x] T1 Karte (AC 1–6, 11, 12), Namen `map.m2_8_kronfeld.name`, `unit.seraphine.name`.
- [x] T2 Szenen DE/EN (AC 7, 8, 13).
- [x] T3 Knoten verdrahten, Relikt-Stufen, Skills `warden_hold`, `ember_stir` mit Namen (AC 9, 10).
- [x] T4 Tests: `tests/unit/m2-8-kronfeld.test.ts` (14 Tests), nachgezogen `act-title`, `act-transition`, `act2-campaign-order` (Ziel der Phase), `relic-stages`; Lab `kronfeld-2-8`.
- [x] T5 Sim Normal und Schwer (AC 15).
- [x] T6 Abnahme-Datei, Decision-Log Narrative, `pnpm check`, Status review.
  - [ ] (lenkende Session) Spielbild 375 × 812 von Karte, Tor-Szene und Nachszene.

## Dev Notes

### Abweichungen Entwurf ↔ Spielformat (alle in der Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_8_kronfeld`, `scn.s2_8.*` | `m2_8_kronfeld`, `scn.m2_8.*` | Karten-Id des Knotens, Szenen-Schema |
| `level` + `levelOffset` | nur `levelOffset`, Figuren per `sprite` | 11.2, 11.7 |
| `silver_lance`, `crown_soldier`, `smuggler`, `mercenary` | `lance_knight`, `lance_squire`, `privateer`, `free_blade` | vorhandene Namen (11.7) |
| Grell `brigand` mit `steel_axe` | `skirmisher` mit `steel_sword` | Leutnant-Regel (wie 2-2, 2-4, 2-6) |
| `victory: escape` (Phase über das Tor) | `survive 5 → escape` mit `must` | Ziel-Phasen aus 11.8 |
| keine Furt-Regel | Trigger `t_ford` beginnt die Flucht | Entwurf: „wer früher weg will, Furt“ |
| `goldReward: 2000` | 3 000 | Finale am oberen Rand [ASSUMPTION F4] |
| keine Anker | `rout`, `treasure` | Muster 2-1/2-5–2-7 |

### Testing

- `pnpm vitest run tests/unit/m2-8-kronfeld.test.ts`; `pnpm check`.
- Lab `pnpm lab kronfeld-2-8`; Sim `pnpm sim --campaign act2 --runs 50 [--difficulty hard --start expected]`.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 232-258, 399-411]
- [Source: concept/27-ueberarbeitung/levels/s2_2_8_kronfeld.yaml; levels/abnahme/s2_2_8_kronfeld.md]
- [Source: concept/22-narrative/missionsliste-s1.md:79,120-122; narrative.md:84-85,187-195,438,549-559,692-695]
- [Source: concept/21-gdd/items.md §5]

## Offene Fragen an den Produktinhaber

Gesammelt in der Übergabe `morgen-fragen-11-19.md` (Notizordner der Session).

- **F1 [ASSUMPTION A] Chronik-Seite in 2-8:** A) keine neue Seite (4 je Akt sind vergeben), die Nachszene fasst zusammen; B) fünfte Seite `a2_kronfeld` im Festzelt. **Angenommen A.**
- **F2 [ASSUMPTION A] Wer spricht „Die Krone war hohl“?** A) Rhen nach Lioras Zusammenfassung der Seiten, Lucan: „Seraphine soll sie als Nächste tragen“; B) Rowena; C) nur Erzähltext. **Angenommen A.**
- **F3 [ASSUMPTION A] Odile nach E5 `return`:** A) steht stumm neben Seraphine (Erzählzeile); B) kämpft als Gegnerin in der Garde; C) warnt die Truppe. **Angenommen A.**
- **F4 [ASSUMPTION A] Gold:** A) 3 000 + 800 + 500; B) Entwurf 2 000. **Angenommen A.**
- **F5 [ASSUMPTION A] Relikt-Stufen ab 2-8:** A) Schild Stufe 3 VER 6 + Schutz 10 % je Nachbar, Drachenglut Stufe 2 MAG +3 und +10 % Zustandschance; B) nur Werte ohne neue Skills. **Angenommen A.**
- **F6 [ASSUMPTION A] Belohnung des Finales:** A) zwei Glutfunken wie 1-8; B) keine. **Angenommen A.**
- **F7 [ASSUMPTION A] Furt:** A) Betreten der Furt beginnt die Flucht sofort; B) Flucht erst ab Runde 6 für alle. **Angenommen A.**
- **Bilder:** Halbfigur `seraphine` (nur neutral) und `rowena` vorhanden, keine neuen Bilder; Stimmungsbilder (traurig/zornig) für Seraphine fehlen, Platzhalter ist die neutrale Figur.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (2026-11-10). Szenentexte selbst entworfen (Schreib-Pipeline: Vorschlag, Abnahme durch den Produktinhaber offen).

### Completion Notes List

- Karte, Szenen, Folgen, Relikt-Stufen und Knoten wie in den AC; 14 neue Tests, vier Testtabellen nachgezogen.
- Sim [C]: Normal verkettet 38/50 erreicht, Sieg 8 %, Niedergestreckte 6,0; `--start expected` 19 % (Probe min 4: 31 %); Schwer 2/50 erreicht, 0 %. Weit unter dem Korridor, nur berichtet (11.27). Details in der Abnahme-Datei.
- Doppelte Locale-Schlüssel: keine neuen; vorbestehend `unit.border_soldier.name` in core- und act2-Namen (gleicher Text).

### File List

- content/acts/act2/maps/m2_8_kronfeld.yaml (neu)
- content/acts/act2/scenes/scn.m2_8.intro.yaml (neu)
- content/acts/act2/scenes/scn.m2_8.hollow_crown.yaml (neu)
- content/acts/act2/scenes/scn.m2_8.rowena_hesitates.yaml (neu)
- content/acts/act2/scenes/scn.m2_8.ford.yaml (neu)
- content/acts/act2/scenes/scn.m2_8.outro.yaml (neu)
- content/acts/act2/campaign.yaml
- content/acts/act2/locales/de.names.yaml, en.names.yaml
- content/core/items.yaml, skills.yaml, locales/de.names.yaml, locales/en.names.yaml
- content/locales/en/act2.dialogue.yaml
- tests/unit/m2-8-kronfeld.test.ts (neu), tests/fixtures/lab/kronfeld-2-8.yaml (neu)
- tests/unit/act-title.test.ts, act-transition.test.ts, act2-campaign-order.test.ts, relic-stages.test.ts
- concept/27-ueberarbeitung/levels/abnahme/s2_2_8_kronfeld.md
- concept/22-narrative/decision-log.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-11-10: Story 11.19 angelegt und umgesetzt (Karte, Szenen DE/EN, Folgen E5–E8, Relikt-Stufen, Akt-Ende, Tests, Lab, Abnahme, Decision-Log); Status review.
