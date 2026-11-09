---
baseline_commit: fdb901f
---
# Story 11.20: Nebenquest N4 „Der Clan im Schnee“

Status: ready-for-dev

<!-- Erstellt 2026-11-09 mit gds-create-story, autonom (orchestrierende Session): offene Design-Fragen nicht zurückgegeben, sondern mit der empfohlenen Option als [ASSUMPTION] gesetzt; Liste unten unter „Offene Fragen“. -->

## Story

Als Spieler
möchte ich Ilkas Clan im frühen Schnee gegen Dravns Vorposten halten,
damit Ilkas Herkunft ein Gesicht bekommt.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/n4_clanlager.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_n4_clan.yaml` (M 20 × 24, `survive` 9 Runden, 8 eigene gegen 20 auf Normal, L 17 / S 23, kein Leutnant) mit Feld `design:` auf den Entwurf, Höhenstufen (Felsnase `crag` Stufe 2, Terrasse Stufe 1, Treppe/Rampe), `fog: true`, `weather: snow`, `season: winter` (früher Schnee, Story 15.15; Akt 2 ist sonst Herbst). Gegner nur mit `levelOffset` (P−3…P−1), keine Flieger, keine Reiter.
2. **Nebel von allen Seiten:** Startgegner stehen im Wald im Norden, Westen, Osten und Süden; angekündigte Wellen R3 Nord, R5 Süd, R7 West wie im Entwurf.
3. **Felsnase:** Unter Nebel sieht eine Figur weiter, je höher sie steht (`balance.fog.levelBonus` je Höhenstufe, [ASSUMPTION] 2); auf dieser Karte ist die Felsnase (Stufe 2) der einzige hohe Punkt und damit der einzige Blick über den Nebel.
4. **Clanälteste:** steht als `team: other`, Klasse `civilian`, `ignoreForRout`, mitten im Lager; ihr Fall ist keine Niederlage, nur das Nebenziel `protect_npc` scheitert.
5. **Ilka Pflicht, solange sie lebt:** `deploy.forced: [avatar, lucan, ilka]`; ist sie gefallen, filtert die Aufstellung sie heraus (`presentForced`, 11.10). Ist sie gegangen, bleibt N4 zu (Bedingung in `campaign.yaml`, schon aus 11.11, Test vorhanden).
6. **Belohnung:** Knotenwirkungen Glutfunke (`ember_spark`) und Ilkas Signaturbogen Weißwolf (`white_wolf`), auch in der Gedenk-Variante (`memorialIf: { dead: ilka }`, Szenen `scn.n4.memorial_intro/outro`, Muster N3/Tobin).
7. **Weißwolf:** neues Item im Signatur-Block der Gefährten (`content/core/items.yaml`), Werte des Eisenbogens (items.md §6.2), Skill „Nebel und Schnee kosten keine Sicht“ als `visionBonus` [ASSUMPTION] 3 Felder Sicht unter Nebel.
8. **Szenen:** `scn.n4.intro`, `scn.n4.outro`, `scn.n4.memorial_intro`, `scn.n4.memorial_outro` DE (Szenendateien) und EN (`content/locales/en/act2.dialogue.yaml`), jede Box ≤ 110 Zeichen, Gefährtenzeilen unter `requires: alive` mit Ersatzsprecher-Kette, Hintergrund `clanlager`.
9. **Knoten:** `n4` bekommt `pre`/`post`, `memorialIf`/`memorial`, `effects`; `place: clanlager` bleibt.
10. **Niederlage:** Avatar oder Lucan fallen (keine Schutzfigur im Entwurf).
11. **Simulation:** `pnpm sim n4_clanlager --campaign act2 --start expected --runs 50` je Schwierigkeit gewinnbar; Zahlen (Sieg, Runden, Nebenziel Älteste, Verluste) im Kopfkommentar der Karte und in der Abnahme; Abweichungen nur berichtet (Abstimmung 11.27). Act-1-Basislauf unverändert.
12. **Unveröffentlicht:** `act2` bleibt `released: false`, kein `content:lock`.
13. **Abnahme:** Bilder bei 375 × 812 im Spiel (Schnee-Look, Höhen, Nebel); Abschnitt „Übernahme Story 11.20“ in `concept/27-ueberarbeitung/levels/abnahme/s2_n4_clan.md`; Lab-Szenario; `pnpm check` grün.

## Tasks / Subtasks

- [ ] T1 Karte `content/acts/act2/maps/n4_clanlager.yaml` (AC 1, 2, 4, 5, 10)
  - [ ] Aus dem Entwurf: `id: n4_clanlager`, `nameKey: map.n4_clanlager.name`, Kopfkommentar nach Muster `m2_1_windscharte.yaml:1-10`, `design:` = Entwurfsblock.
  - [ ] Gegner: `level` streichen, nur `levelOffset`; Namen `unit.border_soldier.name` (Fraktion `iron_march`, Dravns Grenzheer) statt des nicht vorhandenen `unit.dravn_outpost.name`, Sprites wie Pool `iron_march`; Hauptmann `unit.outpost_captain.name` (neu) [ASSUMPTION]. `knight` hat im Pool keine Figur – Sprite `soldier`.
  - [ ] Waffen: Eisen wie Entwurf (P−3/P−2), Stahl nur beim Hauptmann (wie Entwurf).
  - [ ] Älteste: `unit.clan_elder.name` (neu), Sprite/Porträt `villager_elder` wie der Zivilist in `haunts.yaml`.
  - [ ] Höhen: `crag` ist von sich aus Stufe 2, `terrace` Stufe 1; Entwurf setzt nur `[4,7]` (Treppe) auf 1 – prüfen, ob die Treppe zwischen Terrasse (1) und Felsnase (2) verbindet; Rampe `[2,8]` Gras→Terrasse.
  - [ ] Heimsuchungs-Anker (Muster 11.12, nach PO-Wunsch je Karte): `rout` im Lager [ASSUMPTION].
  - [ ] Namen in `content/acts/act2/locales/{de,en}.names.yaml`.
- [ ] T2 Sicht über den Nebel (AC 3, 7)
  - [ ] `src/core/rules/vision.ts`: `visionRadius` bekommt Höhe (`levelAt` × `balance.fog.levelBonus`) und den höchsten `visionBonus` der aktiven Skills (`activeSkillIds`).
  - [ ] `balance.yaml fog.levelBonus` [ASSUMPTION 2], Schema `schemaBalance.ts`, Typ `balanceDefs.ts`; Skill-Effekt `visionBonus` in `schemaUnits.ts` und `defs.ts`.
  - [ ] Akt 1 prüfen: Nebelkarten mit Höhen (`m1_3_silberbach`, `m1_5_hungerlager`) – die KI und die Simulation lesen den Nebel nicht; Act-1-Basislauf muss gleich bleiben.
  - [ ] Unit-Tests für Höhe und Skill.
- [ ] T3 Weißwolf (AC 6, 7): `white_wolf` im Signatur-Block, Skill `white_wolf_sight` in `skills.yaml`, Locale-Schlüssel (Item, Skill) DE/EN; Bild fehlt noch → prüfen, wie `magpie`/`heirloom` Bilder auflösen (ggf. `image: iron_bow` vorläufig).
- [ ] T4 Szenen DE/EN (AC 8): intro, outro, memorial_intro, memorial_outro; Text als Vorschlag (Schreib-Pipeline), Ilka-Zeilen `speaker: [ilka]` + `requires: alive`, Ersatz `[lucan, avatar]` in der Gedenk-Variante.
- [ ] T5 Knoten (AC 9): `n4` in `content/acts/act2/campaign.yaml` mit pre/post/memorial/effects; nur diese Zeile.
- [ ] T6 Tests und Lab: `tests/unit/n4-clanlager.test.ts` (Knoten, Gegnerzahl je Schwierigkeit, Wellen, Älteste keine Niederlage, Ilka Pflicht/gefallen, Belohnung in beiden Varianten, Sicht von der Felsnase); Lab-Szenario `tests/fixtures/lab/clanlager-n4.yaml`.
- [ ] T7 Simulation (AC 11), Sichtprüfung (AC 13), Abnahme-Abschnitt, Decision-Logs, Sprint-Status `review`, `pnpm check`.

## Dev Notes

### Ausgangslage (Stand 2026-11-09, main fdb901f)

- Knoten `n4` steht in `content/acts/act2/campaign.yaml:34` (`kind: side, map: n4_clanlager, place: clanlager, requires: completed m2_3 + any(alive ilka, dead ilka)`), noch ohne pre/post/effects. „Gegangen → bleibt zu“ ist damit schon abgebildet (Narrative-Log 2026-11-09, Test `tests/unit/act2-campaign-order.test.ts:165-169`).
- **Ilka:** Gefährten-Definition in `content/acts/act2/units.yaml:21-30` (marksman, `joins: m2_3`). Ihr Beitritt in 2-3 baut Story 11.14 parallel (noch nicht auf main). Diese Story baut gegen die Definition aus 11.5; Sim mit `--start expected` muss sie in die Truppe nehmen.
- **Signatur:** `white_wolf` gibt es noch nicht als Item (nur items.md §6.2: „Weißwolf, Bogen, N4, Nebel und Schnee kosten keine Sicht“; Bildauftrag in `art/prompts/items_all.md:44`). Muster `magpie`, `heirloom` (`items.yaml:131-143`), Skills `long_fingers`, `young_heroes` (`skills.yaml:99,106`).
- **Glutfunke** = `ember_spark` (`items.yaml:118`), Knotenwirkung `{ item: { def: ember_spark } }` wie N1/N2.
- **Gedenk-Variante:** Muster N3 (`content/acts/act1/campaign.yaml:45`, `maps/n3_erbe.yaml:5`): `memorialIf` + `memorial { pre, post }`, keine Kartenänderung, volle Belohnung.
- **Nebel:** `src/core/rules/vision.ts` – Radius = `fog.baseVision` (3) + höchster Rollen-/Bewegungsbonus (marksman +2); Höhe zählt bisher nicht. Der Nebel gilt nur für die Spielerseite; KI und Sim lesen ihn nicht (nur `lieutenantSight`/`lieutenants.ts` für Leutnant-Sichtung).
- **Schnee:** `weather` ist nur Darstellung (`defs.ts:27`); `weather: snow` ist in Akt 2 nur mit `season: winter` erlaubt (`validateLook.ts:18`). `season: winter` überschreibt die Akt-Saison (Herbst, 11.7) für diese Karte.
- **Ortsbild** `clanlager` liegt vor (`art/mockups/locations-s1/clanlager.png`, `ACT2_LOCATIONS`, `packs.yaml:78`).

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_n4_clan` | `n4_clanlager` | Karten-Id des Knotens |
| `unit.dravn_outpost.name` | `unit.border_soldier.name` | Fraktion `iron_march` (11.7) |
| `level` + `levelOffset` | nur `levelOffset` | 11.2 |
| „Felsnase sieht über den Nebel“ (nur Text) | Regel `fog.levelBonus` | Format hatte keine Höhensicht |
| `white_wolf` als Wunsch | Item + Skill `visionBonus` | neu |

### Was nicht angefasst wird

- `content/packs.yaml` (`released` bleibt false), `content/released-ids.json`, `src/persistence/save.ts` (kein neues persistiertes Feld).
- `concept/01-decisions.md` (eingefroren).
- Ilkas Beitritt in 2-3 (Story 11.14).

### Testing

- `pnpm check`; `pnpm sim n4_clanlager --campaign act2 --start expected --runs 50` (alle Schwierigkeiten); `pnpm sim --campaign act2 --runs 50` (verkettet; N4 ohne m2_3 nicht erreichbar); Act-1-Basis `pnpm sim --campaign act1 --runs 50 --seed 1`.
- Lab-Szenario, Sichtprüfung über `pnpm dev:act2`, Lautstärken 0.

### Previous Story Intelligence (11.12)

- Lab spielt Akt-2-Karten in Akt 2 (`src/lab/scenario.ts`), Herbst kommt aus `c.act`; hier überschreibt `season: winter`.
- Tests, die „Akt 2 hat nur m2_1“ annehmen, ggf. nachziehen (`scenery`, `sim-acts`, `act2-campaign-order`).
- Szenen: Sprecher ohne Halbfigur brechen `scene-view.test.ts` – nur Sprecher mit Porträt (Ilka hat ggf. noch keins → prüfen).
- `pnpm sim <map>` braucht `--campaign act2 --start expected`.

### Project Context Rules

- Keine Spielwerte im Code, kein sichtbarer Text im Code, IDs Englisch, Konzepttexte Deutsch; Zufall nur aus dem Seed-RNG; nie auf main.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 412-423]
- [Source: concept/27-ueberarbeitung/levels/s2_n4_clan.yaml; levels/abnahme/s2_n4_clan.md]
- [Source: concept/22-narrative/missionsliste-s1.md:85; narrative.md:228; decision-log.md:121]
- [Source: concept/21-gdd/items.md §3, §6.2]
- [Source: src/core/rules/vision.ts; src/content/schemaUnits.ts:189-236; content/core/balance.yaml:209-213]

## Offene Fragen an den Produktinhaber (autonom als [ASSUMPTION] gesetzt)

Siehe Dev Agent Record → Completion Notes; die Liste wird beim Umsetzen ergänzt.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created (gds-create-story, 2026-11-09).

### File List

### Change Log
