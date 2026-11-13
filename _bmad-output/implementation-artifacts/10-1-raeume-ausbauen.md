<!-- Erstellt nach der Vorlage von 10-4 (gds-create-story) am 2026-11-13 -->

# Story 10.1: Räume ausbauen

Status: review

## Story

Als Spieler
möchte ich Räume der Paktwacht mit Gold auf Stufe 2 und zusätzlich mit einem ihrer Raum-Gefährten auf Stufe 3 bringen,
damit die Burg neben den Figuren eine zweite Fortschrittsachse ist.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-10.md`, Story 10.1 (vollständige Fassung dort). Kurz:

1. `roomSchema.levels[]` trägt `cost: { gold }` (strikt, ganzzahlig, positiv); `function` kennt zusätzlich `academy`, `workshop`, `training`. `content:check` verlangt für jeden Burg-Raum genau zwei Stufen, Stufe 3 nicht billiger als Stufe 2, und meldet unbekannte `alive`-Ids.
2. `rooms.yaml`: 11 Räume in Anzeige-Reihenfolge, je 1 500 / 4 000 Gold; Stufe 2 nur `{ act: 2 }`, Stufe 3 zusätzlich `any` aus zwei `alive` (Gefährten-Tabelle der Story).
3. Icons `academy`, `workshop`, `training`; Texte `room.<id>.name|desc|level.<n>`; Plätze der neuen Räume im Burg-Modell; Raumsteine der 3D-Burg mit Punkten und Pfeil.
4. Command `buildRoom { room }`: Gold −`cost.gold`, `c.home.rooms[room] = roomLevel + 1`, Events `goldChanged` und `roomBuilt { room, level }`; UI und `validateCampaign` rufen `roomBuild(data, c, roomId)` (ersetzt `nextRoomLevel`).
5. Fehler in dieser Reihenfolge: `unknown_room`, `max_level`, `room_locked` (auch im Lager immer), `not_enough_gold`.
6. Gebaute Stufen bleiben, wenn beide Raum-Gefährten fallen oder gehen; nur Stufe 3 ist dann gesperrt, Stufe 1 → 2 geht weiter.
7. Raum-Panel: grünes Band mit Stufe, Wirkung, ggf. erfülltem Gefährten und Taste „Ausbauen · ● 1 500“ (2 Taps); sonst gestrichelt mit erster offener Bedingung (`lockReason` kennt `any` mit `alive`) bzw. rotem Betrag; „Höchste Stufe“ auf Stufe 3.
8. Heimat: Pips und grüner Pfeil am Raumstein (Liste und 3D-Burg), Kopf „11 Räume · n ausbaubar“, Toast „Schmied auf Stufe 2 ausgebaut“; Klang später (Audio).
9. Stufen-Arrays in `balance.yaml`: `scarRemoval.goldByLevel` (ersetzt `gold`, `scarCost`), `tavern.offersByLevel` (ersetzt `tavernOffersPerChapter`, `tavernOfferCount`), `smithMaxUpgrade`, `rerollFromSmithLevel`, `campfireMaxRank`; Tests über `buildRoom`.
10. Architektur §8.1 und §5.10 stimmen mit dem Code; Handbuch `rooms_upgrade` nennt Kosten als Verweise.
11. Sim-Heuristik baut Räume aus (Schmied, Akademie, Heiler, Übungsplatz, Rest), solange Gold für Narbe und Aufwerten bleibt; Ausgabe je Mission mit Stufen; Tests: 1 → 2 → 3, jeder Fehlercode, beide Events, Determinismus, Replay.

## Tasks / Subtasks

- [x] Schema und Typen: `roomSchema` (`schemaCampaign.ts`), `RoomDef`/`RoomLevelDef` (`storyDefs.ts`), `scarRemoval.goldByLevel`, `tavern.offersByLevel`, `simulation.roomOrder` (`schemaBalance.ts`, `balanceDefs.ts`) (AC 1, 9)
- [x] Inhalt: `rooms.yaml` mit 11 Räumen, Kosten und Raum-Gefährten; `balance.yaml`; Locales DE/EN; Handbuch `rooms_upgrade` und `scars` (AC 2, 3, 9, 10)
- [x] Content-Prüfung: zwei Stufen je Burg-Raum, Stufe 3 ≥ Stufe 2 (`validateCampaign.ts`), Texte `room.<id>.level.<n>` (`validateLocales.ts`) (AC 1, 3)
- [x] Kern: `roomBuild`, `buildableRooms`, `scarCost`, `tavernOfferCount` in `camp.ts`; Command `buildRoom`, Fehler `unknown_room`/`room_locked`, Event `roomBuilt` (AC 4, 5, 6, 9)
- [x] UI: Ausbau-Band (`Rooms.tsx`), `lockReason` mit `any`/`alive`, Pips und Pfeil in Liste und 3D-Burg (`roomStone.tsx`, `Camp.tsx`, `Castle3d.tsx`), Icons, Panel für Werkstatt und Übungsplatz (AC 3, 7, 8)
- [x] Sim: `buildRooms` in der Heimat-Heuristik, Spalte `rooms` je Mission, `spent.rooms` (AC 11)
- [x] Tests `tests/unit/rooms-build.test.ts`, angepasste `home`, `camp`, `campaign-commands`, `sim-*`; Architektur, Logs; `pnpm check`

## Dev Notes

- `roomLevel` liest nur `c.home.rooms` (Default 1), nie die Gefährten: Fall und Weggang ändern keine gebaute Stufe.
- `roomBuild` prüft „offen“ über `homeRooms` (Heimat-Art, `fromAct`, `requires`); ein gesperrter oder fremder Raum ist `unknown_room`. Im Lager ist jeder Ausbau `room_locked`, auch wenn eine Bedingung erfüllt wäre.
- Kein neues persistiertes Feld: `c.home.rooms` hat seit 6.3 einen Default in `normalizeCampaign`; Speicherformat bleibt, keine gesperrte ID betroffen (`released-ids.json` gibt es noch nicht; Akt 2 ist unveröffentlicht).
- Hinweis (bleibt im Log): +5 kostet `dragon_scale` (Akt 3), Schmied Stufe 3 wirkt in Akt 2 also nur über Neu würfeln.
- Burg-Modell: `tools/art/blender_paktwacht.py` hat die Plätze von `academy`, `workshop`, `training` schon (`LAYOUT`, `LATE_ROOMS`, seit PR 100); kein neuer Blender-Lauf nötig.
- Akt 2 läuft im Sim (`pnpm sim --campaign act2`, Story 11.4); die Heuristik ist zusätzlich per Fixture in `rooms-build.test.ts` abgedeckt.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.1]
- [Source: _bmad-output/planning-artifacts/handoff-epic10.md §2–§3]
- [Source: concept/21-gdd/gdd.md „Heimat: Lager und Burg“]
- [Source: concept/24-architecture/architecture.md §5.10, §8.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Subagent, Session epic10-castle)

### Completion Notes List

- [ASSUMPTION] Sim-Heuristik: baut vor Heilen/Kaufen/Aufwerten, `balance.simulation.roomOrder: [smith, academy, healer, training]`, danach Rest in `rooms.yaml`-Folge; Reserve = aktuelle Narben-Kosten + billigste nächste Waffen-Aufwertung der stärksten Figuren; nach jedem Ausbau beginnt die Reihenfolge von vorn (Stufe 3 eines frühen Raums vor Stufe 2 eines späten).
- [ASSUMPTION] Wirkungssätze `room.<id>.level.<n>` aus der GDD-Tabelle „Heimat“ abgeleitet; die Stufen-Wirkungen von Konvoi, Händler, Verzauberer, Gedächtnishalle, Akademie, Werkstatt und Übungsplatz kommen erst mit 10.2/10.5–10.11, bis dahin beschreibt der Satz die geplante Wirkung.
- [ASSUMPTION] Werkstatt und Übungsplatz haben bis 10.7/10.9 ein Panel nur mit Ausbau-Band und „Der Raum wird noch eingerichtet.“ (UX-Log 2026-11-13).
- [ASSUMPTION] Band- und Stein-Gestaltung (Pfeil unten rechts, Punkte auf hellem Schild in 3D, Kopf ohne „0 ausbaubar“) im UX-Log 2026-11-13.
- [ASSUMPTION] Handbuch `rooms_upgrade` zeigt die Kosten des Schmieds stellvertretend (alle Räume gleich); die Gefährten nennt das Band, nicht das Handbuch.
- Fehlercodes und Ausbau-Band lesen dieselbe Funktion `roomBuild`; Toast über den `okText` des Commands.

### File List

- content/core/rooms.yaml, content/core/balance.yaml, content/core/handbook.yaml
- content/core/locales/de.yaml, en.yaml, de.handbook.yaml, en.handbook.yaml
- src/content/schemaCampaign.ts, schemaBalance.ts, validateCampaign.ts, validateLocales.ts
- src/core/storyDefs.ts, balanceDefs.ts, campaign/camp.ts, campaign/apply.ts, campaign/commands.ts, campaign/campaign.ts
- src/app/screens/Rooms.tsx, Camp.tsx, Castle3d.tsx, Castle3d.css, roomStone.tsx (neu); src/ui/camp.css, src/ui/icons.tsx
- tools/simCampaign.ts, tools/simulate.ts, tests/fixtures/saves/generate-act1-finale.ts
- tests/unit/rooms-build.test.ts (neu), home.test.ts, camp.test.ts, campaign-commands.test.ts, sim-campaign.test.ts, sim-acts.test.ts
- concept/24-architecture/architecture.md, decision-log.md; concept/25-ux/.decision-log.md

### Change Log

- 2026-11-13: Story umgesetzt, Status `review`.
