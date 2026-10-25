# Story 6.9: Die Paktwacht als Heimat

Status: review

## Story

Als Spieler
möchte ich nach der Eroberung der Paktwacht dort statt im Lager leben,
damit die Truppe schon in Akt 1 ein Zuhause hat und ihre Gefallenen einen Ort.

## Acceptance Criteria

1. **Wirkung `setHome` und Knoten-Wirkungen:** `setHome` ist umgesetzt (Architektur §5.3, Muster §8.2) und nicht mehr in `UNSUPPORTED_EFFECTS`. Knoten der Kampagne haben ein optionales Feld `effects` (Knoten-Belohnung, §5.3), das beim **Sieg** der Mission angewendet wird. Mit `m1_6` und `effects: [{ setHome: castle }]` ist nach dem Sieg `c.home.kind = 'castle'`, `c.home.rooms` (Stufen) bleibt unverändert.
2. **Burg als Heimat (UX-DR10, Lager/Burg Stufe 1):** Mit `c.home.kind = 'castle'` zeigt die Heimat oben die Paktwacht als Ruine (Ortsbild `locations/paktwacht_ruine`, wie das Lager ein Bild; Produktinhaber 2026-10-25: kein 3D-Modell in dieser Story) mit Raum-Ankern aus `content/home/home.yaml` und unten Konvoi, Händler, Schmied, Heiler, Taverne, Lagerfeuer und Gedächtnishalle als Raumsteine mit Stufe als Punkte. Ein Tipp auf Anker oder Stein öffnet das Raum-Panel.
3. **Ausbau gesperrt bis Akt 2:** Im Raum-Panel der Burg steht oben das Ausbau-Band „Ausbauen auf Stufe 2“ gestrichelt mit Grund („ab Akt 2“). Die Sperre steht in `rooms.yaml` (`levels` mit `requires: [{ act: 2 }]`), kein `if (act >= 2)` im Code.
4. **Gedächtnishalle (UX-DR11 Teil):** Die Gedächtnishalle (`fromAct: 1`, nur Burg) zeigt Gedenksteine entsättigt mit Glutlinie: zuerst die festen Steine aus `content/acts/act1/memorials.yaml` (Gerrit aus dem Prolog), dann `c.fallen` in der Reihenfolge des Fallens, Söldner eingeschlossen. Jeder Stein nennt Name, Ort und Rolle; das Zitat ist bei Gefährten die Zeile `last` aus `scn.farewell.<id>`, bei Gerrit die Zeile aus `memorials.yaml`, Söldner haben keins. Lektionen sind gesperrt mit „ab Akt 2“ (`unlocks` mit `requires: [{ act: 2 }]`; Story 10.6).

## Tasks / Subtasks

- [x] T1 Wirkung `setHome` (AC 1): `effects.ts` (validieren: Ziel ≠ aktuelle Heimat ist kein Fehler, unbekannte Art = `effect_invalid`; anwenden: `c.home.kind = v`, Räume bleiben; Event `homeChanged { home }`), aus `UNSUPPORTED_EFFECTS` streichen, `content/validate.ts` lässt sie zu; Tabelle §5.3 „Stand“ in `architecture.md` ergänzen
- [x] T2 Knoten-`effects` (AC 1): Zod-Schema → `CampaignNodeDef.effects?: Effect[]` → Referenzprüfung wie bei Antworten → beim Sieg im selben Ablauf wie `grants` anwenden (gleiche Funktion `applyEffects`, Events ins Ergebnis); Folgen-Karte (`consequences.ts` kennt `home` schon) prüfen
- [x] T3 Räume (AC 2, 3, 4): `rooms.yaml` + `roomSchema`/`RoomDef`: Funktion `memorial` (neuer Raum `memorial`, `homes: [castle]`, `fromAct: 1`), optional `levels` (Stufe 2 und 3, je `requires`) und `unlocks` (`{ id, requires }`); Burg-Räume tragen `levels: [{ requires: [{ act: 2 }] }, { requires: [{ act: 2 }] }]`, die Gedächtnishalle `unlocks: [{ id: lessons, requires: [{ act: 2 }] }]`. Reine Helfer in `core/campaign/camp.ts`: nächste Stufe eines Raums mit erster offener Bedingung, Status der `unlocks`
- [x] T4 Heimat-Daten (AC 2): `content/home/home.yaml` (Paket `core` per Glob `home/**`) mit je Heimat-Art Bild und Anker `{ room, at: [x%, y%] }`; Schema, `GameData.home`, Prüfung in `content:check` (Raum existiert und gehört zu der Heimat, Bild existiert unter `art/mockups/locations-s1`)
- [x] T5 Gedenksteine (AC 4): `content/acts/act1/memorials.yaml` nach dem Muster von `chronicle.yaml` (DE im YAML, EN in `content/locales/en/act1.*`); Eintrag Gerrit (Bild `gerrit`, Ort „Paktnacht“, Rolle „Bannerträger“, Zitat [C] vorläufig bis Story 9.1, `requires: [{ completed: prologue }]`); reine Funktion `memorialStones(data, c)` (feste Steine mit erfüllten `requires` zuerst, dann `c.fallen`)
- [x] T6 UI (AC 2–4): `Camp.tsx` je `c.home.kind` (Bild, Akt-Pille mit Burg-Symbol und „Die Paktwacht“, Titel, Anker über dem Bild, Stufen-Punkte); Ausbau-Band in `Rooms.tsx`; Panel Gedächtnishalle (Stil „Gedenken“ aus DESIGN.md: `mourn`-Farben, entsättigt, Glutlinie, oben rund unten gerade, ruhige Taste); Heimat-Ort der Weltkarte zeigt in der Burg das Burg-Symbol; `home.camp.later` „Burg ab Mission 1-6“
- [x] T7 Assets: `tools/art/build.py` baut `paktwacht_ruine` (Paket `act1` per `locations/**`) und den Kopf `gerrit` (Ids aus `memorials.yaml`)
- [x] T8 Tests: Wirkung, Knoten-Wirkung beim Sieg (nicht bei Niederlage), Räume der Burg und Sperren, Reihenfolge der Gedenksteine, `content:check`-Fehlerfälle; mit Fixture-Knoten, **nicht** über `content/acts/act1/campaign.yaml`
- [x] T9 Entscheidungen in `concept/24-architecture/decision-log.md` und `concept/25-ux/.decision-log.md`

## Dev Notes

### Entscheidungen des Produktinhabers (2026-10-25)

- Burg oben als gemaltes Bild wie das Lager (`paktwacht_ruine`), Raum-Anker als Steine über dem Bild; echtes 3D-Diorama später (EXPERIENCE „Burg in 3D“ bleibt offen). `render/home/` entsteht in dieser Story **nicht**.
- Gerrit kommt über eine Gedenkstein-Datei, nicht über eine Wirkung am Prolog-Knoten. Kampagnen-Dateien von Akt 1 bleiben unberührt (Knoten `m1_6` legt die Session „Level-Design Akt 1“ an).
- Zitat = Zeile `last` aus `scn.farewell.<id>`; Söldner ohne Zitat; Gerrit bekommt eine vorläufige Zeile, [C] markiert.

### Heutiger Stand (nicht brechen)

- `c.home = { kind, rooms }` (`state.ts`), Default in `normalizeCampaign`. `homeRooms(data, c)` filtert Räume nach `homes` ∋ `c.home.kind` und `fromAct` ≤ Akt; `requires` = UND, erste offene Bedingung = Grund (`lockReason` in `Camp.tsx`). Diese Logik bleibt, die Burg nutzt sie mit.
- `campaign.yaml` hat `home: camp`; Knoten haben bisher **kein** `effects`-Feld. Wirkungen laufen heute über das Command `effects { effects }` (`runEffects` in `flow.ts`, auch Dev-Helfer `__hc.runEffects`).
- Lager-Bild: `Camp.tsx` zeigt `locations/lager_unterwegs.webp`; `tools/art/build.py` baut nur `SHELL_LOCATIONS`. `public/assets/` ist nicht in Git (CI: `git lfs pull` + `pnpm art:build`).
- Abschied-Szenen `scn.farewell.<id>` liegen im Paket `act1` (Hintergrund): Zitate können im Browser kurz fehlen; dann den Stein ohne Zitat zeigen, kein Fehler.
- Heimat-Ort der Weltkarte: `WorldMap.tsx` Zeile ~310, `placeOf(world, { home })`.
- Mockup 04 zeigt die Burg mit „Akt 2 · Herbst“ und „Burg ab Akt 2“: veraltet (Course Correction 2026-10-23, Burg ab 1-6). Pille: „Akt 1 · Spätsommer“ / „Die Paktwacht“.

### Regeln

- Spielwerte und Sperren nur in YAML; kein sichtbarer Text im Code (Schlüssel in `de.yaml`/`en.yaml`); Beträge Symbol + Zahl.
- Jede Handlung genau ein Kampagnen-Command, ≤ 2 Taps.
- Styles je Screen in eigener CSS-Datei (`src/ui/camp.css` gehört zur Heimat); `styles.css` nur schrumpfen.
- Neue persistierte Felder brauchen Default beim Laden; hier keine neuen Felder in `CampaignState` (Gedenksteine werden aus Daten + `c.fallen` berechnet).

### References

- [Source: concept/26-epics/epics.md#Story 6.9], UX-DR10, UX-DR11
- [Source: concept/24-architecture/architecture.md#5.3, #5.4, #5.10, #8.2, #8.3]
- [Source: concept/21-gdd/gdd.md Heimat (Zeile ~308, Raumtabelle)]
- [Source: concept/25-ux/DESIGN.md Gedenken-Farben, Grabstein-Porträt; EXPERIENCE.md Raumstein, Zustand Heimat]
- [Source: concept/25-ux/mockups/04-heimat.html Variante B, Gedächtnishalle]
- [Source: _bmad-output/implementation-artifacts/6-3-das-lager-in-akt-1.md, 6-7-abschied-von-gefallenen.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm lint`, `pnpm content:check`, `pnpm test` (45 Dateien, 459 Tests) und `pnpm build` grün; Bundle: erster Download 11,58 MB (Budget 15, Ziel 12), Paket `act1` 19,37 MB (Budget 40).
- Sichtprüfung im Dev-Server (Hochformat): `__hc.runEffects([{ setHome: 'castle' }])` zeigt die Burg, Anker öffnen Panels, Gedächtnishalle und Ausbau-Band stehen, keine Konsolenfehler.

### Completion Notes List

- **T1/T2:** `setHome` umgesetzt, aus `UNSUPPORTED_EFFECTS` gestrichen, Event `homeChanged`. Knoten-`effects` (Schema, `CampaignNodeDef.effects`, Referenzprüfung wie bei Antworten) laufen in `applyCampaign` bei `finishMission` nur beim Sieg, nach den Dialog-Wirkungen des Kampfes, durch `applyEffects`; Events stehen vor `missionFinished`, die angewendete Liste in `BattleResult.effects` und `MissionResultView.effects` (die Ergebnis-Ansicht zeigt sie noch nicht, siehe offene Punkte). Lehnen die Regeln die Liste ab, entfällt sie, die Mission endet trotzdem (wie bei Dialog-Wirkungen).
- **T3:** Raumfunktion `memorial`, `levels` und `unlocks` in `rooms.yaml`/Schema/`RoomDef`, Helfer `nextRoomLevel` und `roomUnlocks` in `camp.ts`. Alle Burg-Räume (auch Verzauberer) tragen `levels` mit `act: 2`, die Gedächtnishalle `unlocks: lessons`.
- **T4:** `content/home/home.yaml` (Paket `core`), `GameData.home`, Prüfungen in `content:check` (Raum existiert, gehört zur Heimat, Anker einmalig, Bild unter `locations-s1`). Anker der Burg sind Startwerte [C] nach `paktwacht_ruine`; das Lager hat keine Anker.
- **T5:** `memorials.yaml` + EN-Datei (beide im Paket `core`, damit die Halle die festen Steine sofort zeigt), `memorialStones` in `core/campaign/memorial.ts`, Gerrit mit vorläufiger Zeile [C] bis Story 9.1.
- **T6:** `Camp.tsx` je `c.home.kind`, Anker über dem Bild, Stufen-Punkte, Pille mit Burg-Symbol und Jahreszeit, Ausbau-Band (`UpgradeBand`) im Raum-Panel, `MemorialRoom`, Icons `castle` und `stone`, Weltkarte zeigt das Burg-Symbol, `home.camp.later` „Burg ab Mission 1-6“. `lockReason` wanderte von `Camp.tsx` nach `Rooms.tsx`. Styles in `src/ui/camp.css`.
- **T7:** `tools/art/build.py` baut `paktwacht_ruine` und den Kopf `gerrit` (Ids aus `memorials.yaml`).
- **T8:** `tests/unit/home.test.ts` (19 Tests, nur Fixtures: Test-Belohnung am ersten Knoten in einer Datenkopie). Zwei bestehende Tests angepasst, die `setHome` als „nicht unterstützt“ erwarteten (`story.test.ts`), zwei, die die Ortsbilder der Heimat in der Menge der vorhandenen Bilder brauchen (`core.test.ts`).
- **T9:** Einträge in beiden Entscheidungslogs; Architektur §5.3 (Stand) und §5.10 ergänzt.
- **Nachtrag (Produktinhaber 2026-10-25):** Das Missionsergebnis zeigt „Neue Heimat: <Name>“ mit Burg-Symbol (`MissionResultView.movedHome`, Schlüssel `ui.result.newHome`, Style `.res-note.is-home` in `Result.css`; Folgen-Karte nimmt für `setHome` das Burg-Symbol). `Backdrop` hinter Vollbild-Ansichten folgt der Heimat über `homeBackdrop()` (`campaignInfo.ts`, Bild aus `home.yaml`). Test in `result.test.ts`.
- Bewusst nicht gemacht: `render/home/` und 3D-Burg; Änderung an `content/acts/act1/campaign.yaml` (der Knoten `m1_6` und sein `setHome` kommen mit der Level-Design-Session); ein Ausbau-Befehl (Epic 10); Lektionen vererben (Story 10.6).

### File List

- `src/core/defs.ts`, `src/core/index.ts`, `src/core/campaign/effects.ts`, `commands.ts`, `apply.ts`, `campaign.ts`, `camp.ts`, `farewellView.ts`, `resultView.ts`, `memorial.ts` (neu)
- `src/content/schemas.ts`, `load.ts`, `validate.ts`
- `src/app/screens/Camp.tsx`, `Rooms.tsx`, `WorldMap.tsx`, `unitArt.tsx`, `src/ui/camp.css`, `src/ui/icons.tsx`
- `content/home/home.yaml` (neu), `content/acts/act1/memorials.yaml` (neu), `content/locales/en/act1.memorials.yaml` (neu), `content/core/rooms.yaml`, `content/core/locales/de.yaml`, `en.yaml`, `content/packs.yaml`
- `tools/art/build.py`
- `src/core/campaign/resultView.ts`, `src/app/campaignInfo.ts`, `Result.tsx`, `Result.css`, `Chronicle.tsx`, `Equip.tsx`, `Farewell.tsx`, `Troop.tsx`, `src/ui/ConsequenceCard.tsx`, `tests/unit/result.test.ts`
- `tests/unit/home.test.ts` (neu), `tests/unit/story.test.ts`, `tests/unit/core.test.ts`
- `concept/24-architecture/architecture.md`, `decision-log.md`, `concept/25-ux/.decision-log.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`, diese Datei
