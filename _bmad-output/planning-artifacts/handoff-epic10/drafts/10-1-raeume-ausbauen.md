# Story 10.1: Räume ausbauen

Status: ready-for-dev

## Story

Als Spieler
möchte ich Räume mit dem passenden Gefährten und Gold auf Stufe 2 und 3 bringen,
damit die Burg eine zweite Fortschrittsachse ist.

## Acceptance Criteria

**Gruppe A – Ausbau selbst (Kern dieser Story)**

1. **Ausbau-Daten in `rooms.yaml`:**
   **Angenommen** `content/core/rooms.yaml`, in dem jeder Burg-Raum je Stufe 2 und 3 einen Eintrag `levels` mit `cost: { gold }` und `requires` trägt (Stufe 2 = 1 500, Stufe 3 = 4 000 Gold, GDD-Annahme 9; `requires` = `{ act: 2 }` plus der passende Gefährte als `{ alive: <charId> }`, [PO-Frage] welcher)
   **Wenn** `pnpm content:check` läuft
   **Dann** prüft es: Kosten > 0, Stufe 3 nicht billiger als Stufe 2, jede `alive`-Id ist ein Gefährte aus einem `acts/*/units.yaml` (Register wie bei Bedingungen, Architektur §5.3), höchstens zwei `levels`; ein fehlender Gefährte eines noch nicht vorhandenen Akt-Pakets ist ein Fehler nur, wenn das Paket `released` ist (siehe Dev Notes „Epic 11“).
2. **Command `buildRoom`:**
   **Angenommen** die Heimat ist die Burg (`c.home.kind = 'castle'`), der Raum gehört zur Burg, ist offen (`homeRooms`), hat eine nächste Stufe, alle `requires` dieser Stufe sind erfüllt und `c.gold ≥ cost.gold`
   **Wenn** der Spieler `{ type: 'buildRoom', room }` schickt
   **Dann** sinkt das Gold um `cost.gold`, `c.home.rooms[room]` steigt auf `roomLevel(c, room) + 1` (nicht `?? 0`, siehe Dev Notes), Events `goldChanged` und `roomBuilt { room, level }`; das Command steht im Journal und liefert beim Replay dasselbe Ergebnis.
   **Und** jede verletzte Vorbedingung liefert genau einen Fehlercode ohne Änderung: `unknown_room` (Raum unbekannt oder nicht in dieser Heimat/diesem Akt), `room_locked` (Raum selbst gesperrt oder eine `requires` der Stufe offen, z. B. Gefährte fehlt, Akt < 2), `max_level` (Stufe 3 erreicht), `not_enough_gold`. Im Lager (`camp`) gibt es keinen Ausbau (`room_locked`).
3. **Ausbau-Band im Raum-Panel (UX-DR10):**
   **Angenommen** ein Burg-Raum mit nächster Stufe
   **Wenn** alle Bedingungen und das Gold reichen
   **Dann** steht oben im Panel das Ausbau-Band in Grün (`colors.positive`) mit „Ausbauen auf Stufe n“, der Wirkung der nächsten Stufe in einem Satz, dem erfüllten Gefährten („Brann in der Truppe ✓“, Mockup 04) und der Taste „Ausbauen · ● 1 500“ (Betrag immer Symbol + Zahl, `Amount`); ein Tipp baut aus (Panel öffnen + Tippen = 2 Taps).
   **Und** fehlt etwas, bleibt das Band gestrichelt wie seit Story 6.9 und nennt die erste offene Bedingung (`lockReason`, neu auch für `alive`: „<Name> in der Truppe“) bzw. bei fehlendem Gold den Betrag rot (`short`); auf Stufe 3 verschwindet das Band.
4. **Raumstein und Burg zeigen die Stufe:** Der Raumstein zeigt die neue Stufe sofort als Punkte (`Pips`), einen grünen Pfeil, solange ein Ausbau jetzt möglich ist (DESIGN `room-stone`), und die Kopfzeile „Räume 11 · n ausbaubar“ (Mockup 04). Die Burg oben zeigt das Ausbauteil des Raums (Art Direction §7: Stufe 2 Dach und Fenster, Stufe 3 Banner, Licht, Leben) – **[PO-Frage]** ob als 3D-Diorama in diesem Epic; solange die Burg das Bild `paktwacht_ruine` ist, genügen Punkte und Pfeil am Anker und dieses Kriterium gilt mit der Bild-Lösung, die der Produktinhaber wählt.
5. **Stufenwirkungen, die schon im Code hängen, greifen:** Schmied Stufe 2/3 = Aufwerten bis +4/+5, Affix neu würfeln ab Stufe 3 (`smithMaxUpgrade`, `rerollFromSmithLevel`, keine Code-Änderung, nur Test über `buildRoom`); Lagerfeuer Stufe 2/3 = Rang A bzw. S (`campfireMaxRank`, Abnahme in Story 10.7).
6. **Heiler je Stufe:** Narbe entfernen kostet 2 500 → 1 800 → 1 200 Gold (`balance.economy.scarRemoval.goldByLevel`), Panel und `healScar` lesen dieselbe Funktion `scarCost(data, c)`; „Trauer 2 statt 3 Missionen“ gilt ab der Stufe, die die Antwort auf Offene Frage 4 festlegt (Wert in `balance.yaml`, kein `if` im Code).
7. **Taverne Stufe 2:** 4 statt 3 Angebote je Kapitel (`balance.economy.tavern.offersByLevel: [3, 4, 4]` ersetzt `tavernOffersPerChapter`), wirkt beim nächsten `refreshTavern`.
8. **Händler Stufe 2 und Rabatt:** Stufe 2 öffnet ein größeres Sortiment (Daten im Akt: `merchant[].roomLevel`, siehe Dev Notes), Stufe 3 gibt 10 % Rabatt auf Käufe (`balance.economy.merchantDiscountByLevel: [0, 0, 10]`) in `shopPrice`, mit `priceMod` verrechnet; Verkauf bleibt 50 %.

**Gruppe B – neue Raumfunktionen der Stufen 2/3 (Kandidat für eine eigene Story, siehe Offene Frage 1)**

9. **Händler Stufe 3:** „Angebot des Tages“ (die schon erzeugten, aber nie gezeigten `c.offers`, `buyOffer`) erscheint im Händler-Panel; dazu rotierend ein Glutfunke für ● 3 000 (GDD: 3 Stück in Staffel 1, höchstens einer gleichzeitig, `items.ember_spark.price`), Zähler im Spielstand.
10. **Taverne:** Stufe 2 „bessere Traits“, Stufe 3 „Wunschrolle“ – erst umsetzbar, wenn Traits existieren und die Wunschrolle beschrieben ist (Offene Frage 5).
11. **Konvoi:** Stufe 2 Ausrüstungs-Vorlagen je Figur, Stufe 3 „Bestes anlegen“ (Offene Frage 6).

## Tasks / Subtasks

- [ ] T0 **Schema-PR vorziehen (Koordination Epic 11):** nur Schema + Typen + `content:check`, ohne Spiellogik, als eigener kleiner PR gegen `main`: `levels[].cost` (`z.strictObject({ gold: z.number().int().positive() })`), Raumfunktionen `academy`, `workshop`, `training` im Enum (`roomSchema.function`, `RoomDef.function`), `merchant[].roomLevel` optional. So kann die Session von Epic 11 Räume und Händler-Sortimente von Akt 2 gleich richtig anlegen (AC 1)
- [ ] T1 Daten (AC 1): `rooms.yaml` – alle Burg-Räume `levels: [{ cost: { gold: 1500 }, requires: [{ act: 2 }, …] }, { cost: { gold: 4000 }, requires: [{ act: 2 }, …] }]`; Gefährten-Bedingungen erst nach Antwort auf [PO-Frage] eintragen, bis dahin nur `{ act: 2 }` mit Kommentar `# [PO] Gefährte offen`. Kopfkommentar der Datei aktualisieren (Ausbau kommt jetzt)
- [ ] T2 Kern (AC 2): `CampaignCommand` `buildRoom`, `CampaignError` `unknown_room`, `room_locked`, `CampaignEvent` `roomBuilt` in `src/core/campaign/commands.ts`; reine Funktion `roomBuild(data, c, roomId): { level, cost, unmet?, error? } | null` in `camp.ts` (erweitert `nextRoomLevel`, UI und `validateCampaign` rufen dieselbe); `validateCampaign`/`applyCampaign` in `apply.ts` nach Muster §8.1
- [ ] T3 UI (AC 3, 4): `UpgradeBand` in `src/app/screens/Rooms.tsx` – grüner Zustand mit Taste, gestrichelter mit Grund; `lockReason` kennt `alive` (Name über `unitName`/`charName`); Raumstein-Pfeil und Zähler „n ausbaubar“ in `Camp.tsx`; Styles in `src/ui/camp.css` (nicht `styles.css`); Schlüssel `ui.room.build`, `ui.room.buildable`, `ui.room.needs` in `de.yaml`/`en.yaml`; Toast „Schmied auf Stufe 2 ausgebaut“
- [ ] T4 Raumwirkungen (AC 5–8): `balance.yaml` `economy.scarRemoval.goldByLevel`, `supports.griefMissionsByHealerLevel` (oder gleichwertig), `economy.tavern.offersByLevel`, `economy.merchantDiscountByLevel`; Helfer `scarCost`, `tavernOffers`, `merchantDiscount` in `camp.ts`/`aid.ts`; `refreshTavern`, `merchantStock`/`buyPrice`, `healScar`, `finishBattle` (Trauer) und Panels darauf umstellen; `defs.ts` Balance-Typen
- [ ] T5 Gruppe B (AC 9–11) nur, wenn Offene Frage 1 „in 10.1“ ergibt; sonst als Story-Vorschlag in `sprint-status.yaml` durch den Produktinhaber
- [ ] T6 Darstellung der Stufe oben (AC 4) nach Antwort auf [PO-Frage] 3D; ohne 3D: Anker-Stein mit Punkten und Pfeil (`Camp.tsx` `hm-anchor`)
- [ ] T7 Handbuch (Epic 14): `content/core/handbook.yaml` Eintrag `rooms_upgrade` bekommt Werte als Verweise (`ref: rooms.<id>.levels.0.cost.gold` o. ä., nie abgetippt); Texte `de.handbook.yaml`/`en.handbook.yaml`
- [ ] T8 Simulation: `tools/simulate.ts` Heimat-Heuristik baut Räume (z. B. Schmied zuerst), damit `pnpm sim --campaign act2` (sobald Akt 2 existiert) die Wirtschaftskurve „eine von drei großen Investitionen je Mission“ prüft
- [ ] T9 Tests: `tests/unit/home.test.ts` bzw. neue `tests/unit/rooms-build.test.ts` – gültiger Ausbau 1→2→3, jeder Fehlercode, Events, Determinismus (zweimal anwenden), Replay über Journal, Schmied-Limit und Lagerfeuer-Rang nach Ausbau, Heilerkosten/Taverne/Rabatt je Stufe, `content:check`-Fehlerfälle; mit Fixture-Daten, nicht über `content/acts/act1/campaign.yaml`
- [ ] T10 Architektur §5.10 „Stand“ und §8.1 (Beispiel korrigieren), `concept/24-architecture/decision-log.md`, `concept/25-ux/.decision-log.md` (Band-Verhalten, siehe Offene Frage 7)

## Dev Notes

### Heutiger Stand (nicht brechen)

- `c.home = { kind, rooms }` (`src/core/state.ts` Z. ~238/285); `roomLevel(c, id) = c.home.rooms[id] ?? 1` (`camp.ts`). **Achtung:** Das Beispiel in Architektur §8.1 rechnet `(rooms[id] ?? 0) + 1` – das ergäbe beim ersten Ausbau Stufe 1. Immer `roomLevel(c, id) + 1`.
- `rooms.yaml` hat acht Räume (sechs Lager/Burg, `memorial`, `enchanter`); alle tragen schon `levels` mit nur `requires: [{ act: 2 }]` (Story 6.9). `nextRoomLevel` liefert Stufe + erste offene Bedingung; `UpgradeBand` (`Rooms.tsx` Z. ~63) zeigt **nur** den gesperrten Zustand und gibt sonst `null` zurück – das ändert diese Story.
- `homeRooms` filtert nach `homes` ∋ `c.home.kind` und `fromAct` ≤ Akt; `requires` = UND, erste offene = Grund (`lockReason`). Keine `if (act >= 2)` im Code (Architektur §5.10).
- Schon stufenabhängig: `upgradeLimit` (`smithMaxUpgrade: [3, 4, 5]`), `rerollAllowed` (`rerollFromSmithLevel: 3`), `campfireMaxRank` (`[B, A, S]`). Test `campaign-commands.test.ts:155` setzt `c.home.rooms.smith` direkt – bleibt gültig.
- Heiler: `scarRemoval: { gold: 2500, altItem: seers_herb }` (ein Preis), Seherkraut-Weg bleibt. Trauer: `griefMissions: 3` in `finishBattle` (`campaign.ts` Z. ~348).
- Taverne: `refreshTavern` zieht `tavernOffersPerChapter` (3) Angebote nach jeder **Story**-Mission (nicht nach Heimsuchungen).
- Händler: `merchantStock(data, tier)` über `currentTier` (höchstes `merchantTier` erledigter Knoten bzw. `storyCount`); das ist die Akt-Fortschrittsachse und bleibt. `refreshOffers` erzeugt nach jeder Story-Mission 1–2 Angebote mit Affix in `c.offers`, **keine UI zeigt sie** (`buyOffer` existiert). `shopPrice` verrechnet `priceMod` des Akts.
- Konvoi-Panel hat einen Filter nach Art („Sortieren“ = Stufe 1 gilt als erfüllt). `autoEquip` existiert in `campaign.ts` (Söldner) – Kandidat für „Bestes anlegen“.
- Speichern: Format 2, `c.home.rooms` ist schon persistiert; neue Zähler (Glutfunke beim Händler) brauchen einen Default in `normalizeCampaign` (Architektur §8.7). Solange Akt 1 nicht veröffentlicht ist (Story 9-14 backlog), keine Migration; wird 9-14 vorher veröffentlicht, gilt der Release-Ablauf aus AGENTS.md (gesperrte IDs, Fixture-Spielstand).

### Koordination mit Epic 11 (parallele Session)

Epic 11 (Akt 2) legt Gefährten, Händler-Sortiment und Nebenquests mit Glutfunken an und braucht Räume und Profi-Wege. Deshalb **T0 zuerst** als eigenen kleinen PR: Schema-Felder (`levels[].cost`, neue Raumfunktionen, `merchant[].roomLevel`), Typen in `defs.ts`, `content:check`. Die Gefährten-Bedingungen der Räume referenzieren Akt-2-Gefährten (Jory, Brann, Amos …), die erst Epic 11 anlegt: Bedingungen erst eintragen, wenn deren `units.yaml` gemergt ist, oder die Prüfung „Gefährte existiert“ für unveröffentlichte Pakete weich machen.

### Regeln

- Spielwerte nur in YAML (`rooms.yaml`, `balance.yaml`); kein sichtbarer Text im Code; Beträge Symbol + Zahl; jede Handlung ein Command, ≤ 2 Taps (GDD).
- `src/core` ohne DOM/`Math.random`/`Date.now`; Kosten- und Vorschaufunktion einmal, UI und Command rufen sie (§8.1).
- Styles der Heimat in `src/ui/camp.css`; `styles.css` nur schrumpfen.
- Audio: Ausbau-Klang später (Audio), bis dahin `audio.sfx('confirm')`.

### Offene Fragen

1. **Schnitt der Story:** Gruppe A (Ausbau, Schmied/Heiler/Taverne-Anzahl/Händler-Sortiment und Rabatt) ist eine runde Story. Gruppe B (Angebot des Tages + Glutfunke-Rotation, Taverne Traits/Wunschrolle, Konvoi-Vorlagen/„Bestes anlegen“) bringt je eigene Commands, Zustand und UI. Vorschlag: Gruppe B als neue Story **10.8 „Neue Raumfunktionen der Stufen 2 und 3“** abspalten.
2. **[PO-Frage]** Welcher Gefährte gehört zu welchem Raum für Stufe 2 und 3 (Mockup 04 zeigt nur „Schmied Stufe 3: Brann“)? Gleicher Gefährte für beide Stufen? Was gilt, wenn er fällt oder geht – bleibt die gebaute Stufe (Vorschlag: ja, die Stufe bleibt, nur weiterer Ausbau braucht ihn)?
3. **[PO-Frage]** Wird die Burg in diesem Epic ein echtes 3D-Diorama (`render/home/`, Art Direction §7, EXPERIENCE „Burg in 3D“)? Vorschlag: nein; Stufe über Punkte/Pfeil am Anker, 3D als eigene Story.
4. **Heiler „Trauer 2 statt 3 Missionen“:** Die GDD-Zelle `2 500 → 1 800 → 1 200 Gold, Trauer 2 statt 3 Missionen` (gdd.md Z. 319) lässt offen, ab welcher Stufe. Vorschlag: ab Stufe 3.
5. **Taverne:** Traits gibt es im Code nicht (nur `extract-01-decisions.md` Z. 50: Zäh, Flink, Gierig …); „Wunschrolle“ ist nirgends beschrieben. Vorschlag: Traits als eigene kleine Story; Wunschrolle = auf Stufe 3 wählt der Spieler eine Rolle, die nächste Angebotsrunde enthält sicher ein Angebot dieser Rolle (Command `setTavernWish { role }`).
6. **Konvoi:** Was ist eine „Ausrüstungs-Vorlage“ (gespeicherte Belegung je Figur, ein Tipp stellt sie wieder her?) und was „Bestes anlegen“ (nach welchem Maß)? Vorschlag: Vorlage = Snapshot der Item-Uids je Figur, „Bestes anlegen“ = `autoEquip` mit höchster Mt bzw. DEF/RES aus dem Konvoi.
7. **Band-Verhalten:** EXPERIENCE Z. 102 sagt „Ausbau-Band erscheint nur, wenn Gefährte und Gold reichen; sonst nennt die Stufe, was fehlt“; Story 6.9 zeigt ein gestricheltes Band mit Grund. Vorschlag: so lassen (gestrichelt = was fehlt), EXPERIENCE anpassen.
8. **Händler „größeres Sortiment“ vs. `merchantTier`:** Das Sortiment wächst schon mit dem Akt-Fortschritt. Vorschlag: Raumstufe 2 öffnet zusätzliche Listen `merchant[].roomLevel: 2` je Akt (Inhalt legt Epic 11 fest).
9. **Glutfunke beim Händler:** Wann rotiert er (nach jeder Story-Mission, einmal je Akt)? Vorschlag: nach einem Kauf erscheint der nächste nach der nächsten Story-Mission, bis 3 verkauft sind.
10. **Raumkosten-Ort:** Architektur §5.10 legt Stufenwirkungen als `unlocks` in `rooms.yaml` fest, der Code nutzt Stufen-Arrays in `balance.yaml` (`smithMaxUpgrade`, `campfireMaxRank`). Vorschlag: Kosten in `rooms.yaml`, Wirkungen weiter als Arrays in `balance.yaml`; §5.10 nachziehen.
11. **„Trank verstärken“** (Schmied, GDD-Tabelle Stufe 1; `potionUpgrade` in `balance.yaml`) hat seit Story 6.4 kein Command und keine UI. Gehört das hierher oder in eine eigene Story?

### References

- [Source: concept/26-epics/epics.md#Story 10.1], UX-DR10
- [Source: concept/21-gdd/gdd.md#Heimat: Lager und Burg (Z. 309–327), #Wirtschaft und Ressourcen (Z. 335–340), #Fortschritt des Spielers (Glutfunke)]
- [Source: concept/24-architecture/architecture.md#5.3, #5.10, #8.1, #8.3, #8.7]
- [Source: concept/25-ux/DESIGN.md room-stone, Raum-Panel, Positiv-Farbe; EXPERIENCE.md Raumstein (Z. 102), Heimat-Zustände (Z. 121), Offene Punkte „Burg in 3D“]
- [Source: concept/25-ux/mockups/04-heimat.html Raum-Panel Schmied, Variante B „Räume 11 · 2 ausbaubar“]
- [Source: concept/23-art-direction/art-direction.md#7 Heimat-Burg]
- [Source: _bmad-output/implementation-artifacts/6-9-die-paktwacht-als-heimat.md, 6-4-haendler-schmied-heiler-und-taverne.md, 6-3-das-lager-in-akt-1.md]
- Code: `content/core/rooms.yaml`, `content/home/home.yaml`, `content/core/balance.yaml` (`economy`, `supports`), `src/core/campaign/camp.ts`, `apply.ts`, `commands.ts`, `campaign.ts` (`refreshTavern`, `refreshOffers`, `merchantStock`), `aid.ts`, `src/content/schemas.ts` (`roomSchema`), `src/core/defs.ts` (`RoomDef`), `src/app/screens/Camp.tsx`, `Rooms.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story-Kontext mit `gds-create-story` erstellt (2026-10-31); offene Punkte stehen unter „Offene Fragen“, nichts davon ist entschieden.

### File List
