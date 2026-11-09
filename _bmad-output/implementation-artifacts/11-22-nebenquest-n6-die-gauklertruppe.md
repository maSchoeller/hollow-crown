---
baseline_commit: fdb901f41e15cae411cb14ec8b27d0a93da827ef
---
# Story 11.22: Nebenquest N6 „Die Gauklertruppe“

Status: ready-for-dev

<!-- Erstellt 2026-11-09 mit gds-create-story (headless, für die orchestrierende Session). Offene Design-Fragen nicht zurückgegeben,
sondern mit der empfohlenen Option als [ASSUMPTION] umgesetzt; Liste unten unter „Offene Fragen an den Produktinhaber“.
Parallel bauen andere Sessions N4 (11.20), N5 (11.21) und 2-5/2-6: keine N4/N5-Dateien anfassen, gemeinsame Dateien nur in eigenen Blöcken. -->

## Story

Als Spieler
möchte ich Jorys alte Truppe vom Herbstmarkt auf der Aue-Insel retten,
damit Jory seine Laute und seine Geschichte zurückbekommt.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/n6_auemarkt.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_n6_gaukler.yaml` (K 14 × 18, `escort` Gauklermeisterin zum Boot `rect [1,15,4,17]` mit `join: false`, 7 eigene gegen 16 auf Normal, L 13 / S 19) mit Feld `design:`, `map.act = 2` (aus dem Ordner), Herbst-Look (Jahreszeit des Akts), Höhen wie im Entwurf (Bühne als Terrasse Stufe 1 mit Treppe), Gegner nur mit `levelOffset` (P−3 bis P−1, Anführer kein Leutnant), keine Flieger/Reiter.
2. **Veränderliche Karte:** Der Steg `[2,14]` (footbridge) wird ab Runde 6 zu `river` (`set_terrain` mit `warn: true`, Markierung und HUD-Zeile ab Runde 5), dazu in Runde 5 die Szene `scn.n6.tide_warn`; danach bleibt nur die Steinbrücke `[6..7,14]`.
3. **Boote:** Schuldeneintreiber landen in Runde 3 im Osten (3) und in Runde 5 im Westen (2), beide Wellen angekündigt.
4. **Meisterin:** `troupe_master` (`team: other`, Spielmann, KI `follow`, `ignoreForRout`) steht auf der Bühne; fällt sie, ist die Mission verloren; sie tritt nicht bei.
5. **Jory:** Pflicht (`deploy.forced`), solange er in der Truppe ist; die Aufstellung filtert `forced` auf die Truppe, so trägt dieselbe Karte die Gedenk-Variante.
6. **Gedenk-Variante:** Ist Jory gefallen, spielen `scn.n6.memorial_intro` / `scn.n6.memorial_outro` (`memorialIf: { dead: jory }`), Karte und Belohnung unverändert. Ist er gegangen, bleibt N6 zu (`requires any alive/dead jory`, schon in `campaign.yaml`).
7. **Belohnung:** Knotenwirkung Signaturlaute `final_curtain` (Nebenhand, Gruppe Laute, Werte der Wanderlaute, legendary, 1 000 G) mit Item-Skill `final_curtain` = `cheerTargets: 2` (Anfeuern auf zwei Ziele aus Story 10.4, `src/core/battle/actions.ts` `cheerReach`), auch in der Gedenk-Variante; dazu `goldReward`.
8. **Szenen:** `scn.n6.intro`, `scn.n6.outro`, `scn.n6.tide_warn`, `scn.n6.master_talk` (Jory spricht die Meisterin an, Szene beim Betreten der Bühne), `scn.n6.memorial_intro`, `scn.n6.memorial_outro` in DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen unter `requires: alive` bzw. mit Ersatzsprecher-Kette bis Avatar/Lucan, Hintergrund `auemarkt`.
9. **Knoten:** `n6` bekommt `pre`/`post`/`memorialIf`/`memorial`/`effects`; `requires` und `place: auemarkt` bleiben.
10. **Heimsuchung:** keine Anker (Heimsuchungen nur auf Story-Knoten, `storyNodeOf`, wie N1–N5).
11. **Simulation:** `pnpm sim --campaign act2 --runs 50` läuft; N6 als Probe an Stelle von 2-7 (`--map-file <kopie> --node m2_7 --position 18`) je Schwierigkeit 50 Läufe mit Sieg, Runden p10/p50/p90, Niedergestreckten, Toten, Meisterin überlebt; Abweichungen nur berichten (11.27).
12. **Unveröffentlicht:** `act2` bleibt `released: false`, kein `content:lock`.
13. **Abnahme:** Lab-Szenario `tests/fixtures/lab/auemarkt-n6.yaml`, Bilder 375 × 812 (Herbst-Look, Höhen, Steg vor/nach Runde 6), Abschnitt „Übernahme Story 11.22“ in `concept/27-ueberarbeitung/levels/abnahme/s2_n6_gaukler.md`; `pnpm check` grün.

## Tasks / Subtasks

- [ ] T1 Karte `content/acts/act2/maps/n6_auemarkt.yaml` (AC 1–5, 10): Terrain/Legende/Objekte aus dem Entwurf, `level` streichen, Sprites wie 2-1 (brigand/mercenary/bandit_archer), Namen `unit.debt_collector.name`, `unit.debt_boss.name`, `unit.troupe_master.name`, Karte `map.n6_auemarkt.name` in `content/acts/act2/locales/{de,en}.names.yaml` (eigener Block „N6“). Trigger Flut + Warnszene + Bühnen-Szene.
- [ ] T2 Signaturlaute (AC 7): `final_curtain` in `content/core/items.yaml` (Block „Signaturen der Gefährten“), Skill in `content/core/skills.yaml` (eigene Zeile), Namen/Beschreibung in `content/core/locales/{de,en}.{names,items}.yaml`.
- [ ] T3 Szenen DE/EN (AC 2, 6, 8): `content/acts/act2/scenes/scn.n6.*.yaml`, EN in `content/locales/en/act2.dialogue.yaml` (eigener Block am Ende).
- [ ] T4 Knoten `n6` in `content/acts/act2/campaign.yaml` (AC 6, 7, 9): nur diese Zeile.
- [ ] T5 Tests `tests/unit/n6-auemarkt.test.ts`; act-title/act-transition/scenery an die neue Karte anpassen (nur die eine Zeile).
- [ ] T6 Simulation (AC 11), Lab-Szenario und Sichtprüfung (AC 13), Abnahme-Abschnitt.
- [ ] T7 Abschluss: Decision-Logs (Narrative, GDD), `sprint-status.yaml` 11-22 → review, `pnpm check`.

## Dev Notes

### Ausgangslage (Stand 2026-11-09, origin/main fdb901f)

- Knoten `n6` (`content/acts/act2/campaign.yaml:36`): `kind: side, map: n6_auemarkt, requires: [completed m2_5, completed m2_6, any [alive jory, dead jory]], place: auemarkt, merchantTier: 1`. „Gegangen“ ist weder alive noch dead → N6 bleibt zu (Narrative-Log 2026-11-09, Story 11.11). Kein Beitritt in 2-1 → N6 bleibt ebenfalls zu.
- Jory (`content/acts/act2/units.yaml`): minstrel, `stage_presence`, Laute `travel_lute`, `joins: m2_1`. In 2-1 erzählt er: Die Truppe ist bei Tagesanbruch mit den Pferden fort, ihm blieben Laute und Wagen ohne Rad (`scn.m2_1.jory_talk`).
- 10.4 ist auf main: `cheerTargets`/`cheerRange` im Skill-Schema (`src/content/schemaUnits.ts:227`), `cheerReach` in `src/core/battle/actions.ts:105-112` nennt die Laute `final_curtain` schon als Quelle; `pro_song` (Barde) zeigt das Muster. Die Laute braucht keinen Code, nur `grantsSkill` (Muster `magpie`, `heirloom` in `items.yaml`).
- Gedenk-Variante: `memorialIf` + `memorial { pre, post }` wie N3/Tobin (`content/acts/act1/campaign.yaml:45`, Szenen `scn.n3.memorial_*`); `deploy.forced` wird auf die Truppe gefiltert (`src/core/battle/deploy.ts`).
- Eskorte: `escort` + KI `follow` (Story 4.8, `src/core/ai/ai.ts:319`), `followRadius` 4 in `balance.yaml`.
- Flut: `set_terrain` mit `warn` (Story 11.10, `src/core/battle/terrainWarn.ts`); steht eine Figur auf dem Feld, bleibt es Steg (`src/core/rules/effects.ts` `eventTerrain`).
- Positionsstufe: P = 12 + erledigte Story-Knoten von Akt 2 → N6 mit 2-7 bei P 18, nach 2-7 bei 19 (`src/core/campaign/position.ts`).
- Gelände `footbridge`, `bridge`, `stall`, `wagon`, `terrace`, `stairs`, `village` vorhanden (`content/core/terrain.yaml`); kein Boot- und kein Bühnen-Modell (Formatwunsch des Entwurfs).
- 2-5 und 2-6 baut eine andere Session parallel; N6 baut gegen den Stand im Epic und verweist nicht auf Einzelheiten dieser Missionen.

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_n6_gaukler` | `n6_auemarkt` | Karten-Id des Knotens |
| `level` + `levelOffset` | nur `levelOffset`; Meisterin `levelOffset: -3` | 11.2 |
| Flut `turn_start 6 enemy` | `turn_start 6 player` | AC „ab Runde 6 unter Wasser“ [ASSUMPTION] |
| `goldReward: 1300` | 2 000 [ASSUMPTION] | Goldkurve Akt 2 (PO 2026-11-09 bei 2-1) |
| Modelle Bühne, Boot | Bühne = Terrasse + Treppe, Boote ohne Modell | kein Modell vorhanden |

### Previous Story Intelligence

- 11.21 (N5, PR #177) und 11.20 (N4, lokal): Nebenquest-Karten ohne Heimsuchungs-Anker; Kampagnen-Sim spielt nur Story-Knoten → Probe als Kopie an Stelle eines Story-Knotens; act-title/act-transition/scenery prüfen, welche Knoten eine Karte haben; N4 zeigt das Gedenk-Muster in Akt 2.
- Sprecherketten (`canSpeak`) prüfen nur gefallen/gegangen, nicht den Beitritt: Akt-2-Gefährten neben Jory nur mit `requires: alive`.
- 11.12 (2-1): Muster Kopfkommentar, Szenen, Lab `windscharte-2-1.yaml`, Dev-Build `pnpm dev:act2` + `loadPack('act2')`.

### Project Context Rules

- Keine Spielwerte, kein sichtbarer Text im Code; Code/IDs Englisch, Konzepttexte Deutsch; Zufall aus dem Seed-RNG.
- Nie auf `main`; kein `released: true`, kein `content:lock`; kein Push (macht die orchestrierende Session).

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 439-450; epic-10.md:247, 276]
- [Source: concept/27-ueberarbeitung/levels/s2_n6_gaukler.yaml; levels/abnahme/s2_n6_gaukler.md]
- [Source: concept/22-narrative/missionsliste-s1.md:87; decision-log.md:121; concept/21-gdd/items.md:109]
- [Source: content/acts/act2/{campaign,units}.yaml; content/core/items.yaml:134-143; content/core/skills.yaml:19]

## Offene Fragen an den Produktinhaber

Werden in der Umsetzung als [ASSUMPTION] (empfohlene Option) entschieden und unten im Dev Agent Record nachgetragen.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (gds-create-story, gds-dev-story), headless für die orchestrierende Session.

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created (gds-create-story, 2026-11-09).

### File List

### Change Log

- 2026-11-09: Story 11.22 angelegt (ready-for-dev).
