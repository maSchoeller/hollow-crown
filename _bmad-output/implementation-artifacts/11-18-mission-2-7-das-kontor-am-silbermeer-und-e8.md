---
baseline_commit: 8c70d765
---
# Story 11.18: Mission 2-7 „Das Kontor am Silbermeer“ und Entscheidung E8

Status: review

<!-- Erstellt und umgesetzt 2026-11-10 (Nachtbetrieb, PO schläft): offene Punkte als [ASSUMPTION] mit der empfohlenen Option, gesammelt unter „Offene Fragen an den Produktinhaber“. Branch claude/story-11-18-mission-2-7 auf origin/main (2-1 bis 2-6 und N4–N6 gemergt). -->

## Story

Als Spieler
möchte ich in Maelis' Kontor die Geschäftsbücher holen,
damit ich einen Beweis gegen die Herzogin in der Hand habe.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/m2_7_kontor.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_2_7_kontor.yaml` (M 20 × 25, Regen, Morgen, `reach` Schreibstube `rect [6,2,7,3]`, 10 eigene gegen 26 auf Normal, L 22 / S 30) mit Feld `design:`, `map.act = 2`. Gegner nur mit `levelOffset` (−3…−2, Brakka über die Leutnant-Regel), keine Flieger, keine Reiter.
2. **Höhen [ASSUMPTION F4]:** Nordkai mit Kontor und Balliste auf Stufe 1 (`levels` rect [1,0,18,10]), Kaifuß y 11 auf Stufe 0, Treppen [9,11], [10,11] (Brückenkopf) und [18,11] (Ostseite).
3. **Balliste:** Brakka (`lieutenant: brakka`, `hold`) steht neben der Balliste `b_quay` [10,8] und hält die Steinbrücke unter Feuer.
4. **Kran:** Hebel `l_crane` [16,15]; gezogen spielt `scn.m2_7.crane` und `rect [15,12,15,14]` wird `footbridge` (Steg über das Becken).
5. **Schlüssel:** Das Kontor hat zwei Türen vorn und eine an der Ostseite; der Zahlmeister (`unit.purser.name`, [16,6]) trägt `door_key` mit `drops`. Fenn (Kundschafter) öffnet ohne Schlüssel.
6. **Wellen:** angekündigt R3 (Westkai), R5 (Ostkai), R7 (von der Stadt), P−2.
7. **Chronik-Seite:** Truhe `c_page` [13,2] in der Schreibstube mit `chronicle: a2_kontor` und `scn.m2_7.page`; Saat Pakt: erste und letzte Seite aus derselben Hand [ASSUMPTION F3]. Nebenziele Seite und 12 Runden.
8. **Niederlage:** Avatar oder Lucan fallen.
9. **Szenen:** `scn.m2_7.intro`, `scn.m2_7.crane`, `scn.m2_7.page`, `scn.m2_7.outro` in DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen mit `requires: alive` bzw. Ersatzsprecher-Kette, Hintergrund `kontor`.
10. **E8 in der Nachszene:** Wahl mit Titel, drei Haltungen mit `summary` (Folgen-Karte): `seraphine` → `setFlag { e08: seraphine }`, `grudge { lt: grell, delta: -1 }`; `sell` → `setFlag { e08: sell }`, `gold: 1000` [ASSUMPTION]. `maelis_ledgers` setzt der Knoten mit dem Sieg (`effects`) [ASSUMPTION F5]. Die Zeile in Kronfeld kommt mit 11.19.
11. **Knoten:** `m2_7` bekommt `pre`, `post`, `effects`; N6 öffnet mit 2-7 (schon in `campaign.yaml`).
12. **Gold:** `goldReward` 2 000 (Korridor 2 000–3 000) [ASSUMPTION F6], Truhe 300, Nebenziel 400.
13. **Heimsuchungen:** zwei Anker (`rout` Südkai, `treasure` Nordkai).
14. **Unveröffentlicht:** `act2` bleibt `released: false`; kein `content:lock`.
15. **Prüfung:** `pnpm check` grün; Kampagnen-Sim act2 Normal und Schwer, Abweichungen nur berichtet (11.27).

## Tasks / Subtasks

- [x] T1 Karte (AC 1–8, 12, 13): `m2_7_kontor.yaml`, Namen `map.m2_7_kontor.name`, `unit.purser.name`; Söldner als `unit.free_blade.name` (Brakkas Freie Klingen), Wachen `unit.counting_guard.name`.
- [x] T2 Chronik-Seite `a2_kontor` (DE `chronicle.yaml`, EN `act2.chronicle.yaml`).
- [x] T3 Szenen DE/EN (AC 9, 10).
- [x] T4 Knoten verdrahten (AC 11).
- [x] T5 Tests und Lab: `tests/unit/m2-7-kontor.test.ts` (13 Tests), Lab `kontor-2-7`, nachgezogen `act-title`, `act-transition`.
- [x] T6 Sim Normal und Schwer (AC 15).
- [x] T7 Abnahme-Datei, Decision-Log Narrative, `pnpm check`, Status review.
  - [ ] (lenkende Session) Spielbild 375 × 812, Folgen-Karte E8 im Spiel.

## Dev Notes

### Abweichungen Entwurf ↔ Spielformat (alle in der Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_7_kontor`, `scn.s2_7.*` | `m2_7_kontor`, `scn.m2_7.*` | Karten-Id des Knotens, Szenen-Schema |
| `level` + `levelOffset` | nur `levelOffset`, Figuren per `sprite` | 11.2, 11.7 |
| `unit.mercenary.name`, `unit.kontor_guard.name` | `unit.free_blade.name`, `unit.counting_guard.name`, Zahlmeister `unit.purser.name` | vorhandene Schlüssel (11.7), Brakkas Fraktion |
| flach | Nordkai Stufe 1, drei Treppen, Schützen n3/n4 auf y 10 | Höhenstufen [ASSUMPTION F4] |
| `chron_a2_ledger` | `a2_kontor` | Schema der Akt-2-Seiten |
| `goldReward: 1300` | 2 000 | Korridor Akt 2 [ASSUMPTION F6] |
| keine Anker | `rout`, `treasure` | Muster 2-1/2-5/2-6 |

### Testing

- `pnpm vitest run tests/unit/m2-7-kontor.test.ts`; `pnpm check`.
- Lab `pnpm lab kontor-2-7`; Sim `pnpm sim --campaign act2 --runs 50 [--difficulty hard]`.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 382-398]
- [Source: concept/27-ueberarbeitung/levels/s2_2_7_kontor.yaml; levels/abnahme/s2_2_7_kontor.md]
- [Source: concept/22-narrative/missionsliste-s1.md:78,87; narrative.md:387,565,695]
- [Source: _bmad-output/implementation-artifacts/11-17-mission-2-6-gold-fuer-banditen-und-e6.md]

## Offene Fragen an den Produktinhaber

- **F1 [ASSUMPTION A] Wer überbringt Maelis' Rückkauf-Angebot?** A) Brakka unter weißem Tuch, Seraphines Reiter am Stadttor; B) Brief mit Möwensiegel; C) Faktor als Erzähltext. **Angenommen A.**
- **F2 [ASSUMPTION A] Haltungen bei E8:** A) warm/trotzig → Seraphine, nüchtern → verkaufen; B) trotzig → verkaufen; C) zwei Antworten. **Angenommen A.**
- **F3 [ASSUMPTION A] Seite `a2_kontor` und Saat Pakt:** A) Silbermeer kaufte die Wächterbücher, letzter Eintrag deutet an, Gefährten erkennen dieselbe Hand; B) nur die Szene vergleicht; C) eigener Text. **Angenommen A.**
- **F4 [ASSUMPTION A] Höhen:** A) Nordkai Stufe 1 mit drei Treppen; B) flach wie Entwurf. **Angenommen A.**
- **F5 [ASSUMPTION A] `maelis_ledgers`:** A) immer mit dem Sieg; B) nur bei `seraphine`. **Angenommen A.**
- **F6 [ASSUMPTION A] Gold:** A) 2 000 + 300 + 400, Verkauf +1 000; B) Entwurf 1 300. **Angenommen A.**

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (2026-11-10). Szenentexte selbst entworfen (Schreib-Pipeline: Vorschlag, Abnahme durch den Produktinhaber offen).

### Completion Notes List

- Karte, Szenen, E8, Chronik-Seite und Knoten wie in den AC; `tests/unit/m2-7-kontor.test.ts` (13 Tests), `chronicle.test.ts` kennt die neue Seite.
- Sim [C] Normal (`pnpm sim --campaign act2 --runs 50`, verkettet): 2-7 erreicht 39/50, Sieg 92 %, Runden 12/14/17, Niedergestreckte 0,44, Tote 0,11, Gold 2 042; Nebenziele schwach (Seite 0 %, 12 Runden 11 %), Armee-Stufe 21,5 statt 18.
- Sim [C] Schwer: verkettet scheitern alle Läufe an 2-4 (0 %, vorbestehend); mit `--start expected` erreichen 9/50 die Karte, Sieg 22 %, Tote 1,00 – unter dem Korridor, nur berichtet (11.27).
- Act 1 unverändert (keine Akt-1-Datei geändert), daher kein `sim:diff`. Doppelte Locale-Schlüssel: keine neuen; vorbestehend `unit.border_soldier.name` in core- und act2-Namen (gleicher Text).

### File List

- content/acts/act2/maps/m2_7_kontor.yaml (neu)
- content/acts/act2/scenes/scn.m2_7.intro.yaml (neu)
- content/acts/act2/scenes/scn.m2_7.crane.yaml (neu)
- content/acts/act2/scenes/scn.m2_7.page.yaml (neu)
- content/acts/act2/scenes/scn.m2_7.outro.yaml (neu)
- content/acts/act2/campaign.yaml
- content/acts/act2/chronicle.yaml
- content/acts/act2/locales/de.names.yaml
- content/acts/act2/locales/en.names.yaml
- content/locales/en/act2.dialogue.yaml
- content/locales/en/act2.chronicle.yaml
- tests/unit/m2-7-kontor.test.ts (neu)
- tests/fixtures/lab/kontor-2-7.yaml (neu)
- tests/unit/act-title.test.ts
- tests/unit/act-transition.test.ts
- concept/27-ueberarbeitung/levels/abnahme/s2_2_7_kontor.md
- concept/22-narrative/decision-log.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/11-18-mission-2-7-das-kontor-am-silbermeer-und-e8.md

### Change Log

- 2026-11-10: Story 11.18 angelegt und umgesetzt (Karte, Szenen DE/EN mit E8, Chronik-Seite, Tests, Lab, Abnahme, Decision-Log); Status review.
