# Story 10.7: Übungsplatz, Lagerfeuer-Ränge und lebende Burg

Status: ready-for-dev

## Story

Als Spieler
möchte ich, dass die Reserve mitwächst, Freundschaften tiefer werden und die Burg sich mit den Menschen füllt,
damit die Heimat lebendig wirkt.

## Acceptance Criteria

1. **Raum Übungsplatz:** `rooms.yaml` `{ id: training, function: training, fromAct: 2, homes: [castle], levels: … }` mit Icon, Texten, Punkten, Anker (solange Bild); das Panel zeigt den Anteil der Stufe („Reserve erhält 20 % der Durchschnitts-EP“, Wert aus den Daten) und die Reserve der letzten Mission mit ihren EP.
2. **Reserve-EP:**
   **Angenommen** der Übungsplatz auf Stufe n (Stufe 1/2/3 = 20/35/50 %, `balance.yaml` z. B. `training.reservePctByLevel: [20, 35, 50]`)
   **Wenn** eine Mission gewonnen wird (`finishMission`, Sieg)
   **Dann** erhält jede Figur der Truppe, die nicht eingesetzt war und lebt („Reserve“), `round(Durchschnitt der EP der eingesetzten Figuren dieser Mission × pct / 100)` EP über dieselbe EP-Logik (Stufendeckel des Akts, Level-up mit Glättung aus `c.rng` in fester Reihenfolge der Truppe), und das Missionsergebnis zeigt sie in einer Zeile „Übungsplatz: Reserve +n EP“ (Mockup 08-Stil, EP als grüner Stern + Zahl).
   **Und** ohne Übungsplatz (Akt 1, Lager) gibt es keine Reserve-EP; Niederlage, Verlassen und Neustart geben keine; ob Heimsuchungen zählen und ob Söldner Reserve sind: Offene Fragen 1–2.
3. **Lagerfeuer-Ränge:**
   **Angenommen** das Lagerfeuer auf Stufe 2 bzw. 3 (Ausbau Story 10.1)
   **Dann** öffnet es Rang A bzw. S (S nur für die 6 Kernpaare, `core: true` in `acts/*/supports.yaml`); die Gespräche erscheinen am Lagerfeuer und als Marke in der Truppe, sobald die Punkte die Schwelle erreichen (A 45, S 70, `balance.supports.thresholds`). Dafür reicht der vorhandene Code (`campfireMaxRank: [B, A, S]`); diese Story prüft es über `buildRoom` und zeigt im Lagerfeuer-Panel gesperrte A/S-Gespräche mit Grund („ab Lagerfeuer Stufe 2“).
4. **Gefährten und ihre Gegenstände an festen Plätzen:**
   **Angenommen** jeder Story-Gefährte hat in seinen Daten einen persönlichen Gegenstand (Narrative „Die Paktwacht wächst mit“: Brennas Axtständer, Jorys Laute, Ysoldes Bücherstapel …) und `content/home/home.yaml` einen festen Platz dafür
   **Wenn** der Gefährte beitritt
   **Dann** steht er (Figur bzw. Porträt-Marke, je nach Antwort auf [PO-Frage] 3D) und sein Gegenstand an seinem Platz in der Burg oben.
   **Und** fällt er, verschwindet die Figur, der Gegenstand bleibt liegen, der Platz bleibt leer (entsättigt) und die Gedächtnishalle hat seinen Stein (Story 6.9); geht er (`leave`), siehe Offene Frage 5.
5. **Ausbauteile sichtbar:** Die Burg oben zeigt je Raum das Teil seiner Stufe (Art Direction §7: Stufe 1 Gerüst und Planen, Stufe 2 Dach und Fenster, Stufe 3 Banner, Licht, Leben – Rauch, Figuren) – **[PO-Frage]** 3D-Diorama oder Bild-Lösung; die Daten dafür stehen in `home.yaml` (je Raum und Stufe ein Teil), nicht im Code.
6. **Reproduzierbar:** Reserve-EP entstehen im Command `finishMission` aus Startzustand + Log + Kampagne; Replay und Simulation (`pnpm sim --campaign …`) liefern dieselben Stufen. Die lebende Burg ist reine Ansicht aus `c.roster`, `c.fallen`, `c.left`, `c.home` (kein neuer Zustand).

## Tasks / Subtasks

- [ ] T1 Raum (AC 1): `rooms.yaml` `training` (Funktion im Schema aus Story 10.1 T0), Icon `training`, Texte `room.training.*`, `TrainingRoom`-Panel, Anker in `home.yaml`
- [ ] T2 Reserve-EP (AC 2, 6): `balance.yaml` Anteil je Stufe; in `finishBattle` (`src/core/campaign/campaign.ts`, nach dem Zurückschreiben der eingesetzten Figuren) reine Funktion `reserveExp(data, c, result)`; EP-Vergabe für `UnitRecord` außerhalb des Kampfes (eine Variante von `grantExp` in `rules/progression.ts`, die einen Record und `c.rng` nimmt – nicht kopieren, gemeinsamen Kern herausziehen); `BattleResult.reserve: Array<{ unit, exp, levelBefore, levelAfter }>` und `MissionResultView` (`resultView.ts`); Zeile in `Result.tsx`/`Result.css`
- [ ] T3 Lagerfeuer (AC 3): `CampfireRoom` (`Rooms.tsx` Z. ~469) zeigt Gespräche über dem Rang gesperrt mit Grund (`unlockableRank` liefert heute `null` ohne Grund → Funktion `campfireLock(data, c, key)`); Test: Ausbau 1→2 öffnet A, 2→3 öffnet S nur für Kernpaare
- [ ] T4 Content-Schema (AC 4, 5): `charSchema` bekommt `homeObject?: string` (Id des Gegenstands, `art/…`), `home.yaml` je `castle` `objects: [{ char, at: [x%, y%] }]` und `parts: [{ room, level, … }]`; `content:check`: jeder spielbare Story-Gefährte mit `homeObject` hat einen Platz, Bild/Modell existiert. **Als kleinen Schema-PR früh mergen**, damit Epic 11 die Gefährten von Akt 2 gleich mit Gegenstand anlegt
- [ ] T5 Ansicht (AC 4, 5): reine Funktion `castleScene(data, c)` (in `src/core/campaign/` oder `src/app/`) liefert Plätze mit Zustand `present | fallen | left | empty` und Teile je Raumstufe; `Camp.tsx` zeichnet sie über dem Bild (oder `render/home/` bei 3D); Gedenken-Stil (entsättigt) für leere Plätze; Styles `src/ui/camp.css`
- [ ] T6 Assets: Gegenstände der Akt-1-Gefährten (Brenna, Tobin, Mira, Fenn, Liora, Varek, Ysolde, Grosk) per ChatGPT (2D) bzw. Blender (3D) nach Antwort; Prompts `art/prompts/<id>.md`, `tools/art/build.py` übernimmt sie
- [ ] T7 Tests: Reserve-EP je Stufe (Rundung, Deckel, Level-up deterministisch, nicht bei Niederlage), `castleScene` (beigetreten/gefallen/gegangen), Lagerfeuer-Ränge nach Ausbau, `content:check`-Fehlerfälle
- [ ] T8 Architektur §5.10/§5.11 „Stand“, Decision-Logs; EXPERIENCE „Burg in 3D“ nach Antwort aktualisieren

## Dev Notes

### Heutiger Stand (nicht brechen)

- Lagerfeuer: `campfireMaxRank(data, c)` (`camp.ts`) liest `balance.supports.campfireMaxRank[roomLevel − 1]` = `[B, A, S]`; `unlockableRank` begrenzt darauf, `maxRank` (`rules/supports.ts`) lässt S nur für `core`-Paare zu. Die Akt-1-Paare haben schon A- und S-Szenen (`content/acts/act1/scenes/scn.support.*.A|S.yaml`, Kommentar in `supports.yaml`: „A und S öffnet erst die Burg, Epic 10“). Punkte: `pointsAdjacentEnd: 1`, `pointsTandemHealRescue: 2`.
- EP: `grantExp` (`rules/progression.ts`) arbeitet auf `BattleUnit` mit RNG des Kampfes und Stufendeckel `levelCap(data)` (Akt 1: 10); `finishBattle` (`campaign.ts` Z. ~320–335) schreibt `levelBefore/levelAfter/exp` je eingesetzter Figur ins Ergebnis und setzt danach `c.rng = rng` (Z. ~416). Reserve-EP müssen in diese Reihenfolge passen, sonst brechen Replays.
- Heimsuchungen zahlen `haunt.expPct` (60 %) mit Deckel „aufholen, nicht überholen“ (`expPercent`).
- Gefallene: `c.fallen` (Reihenfolge des Fallens), Gegangene: `ctx.left` (Bedingung `left`), Truppe: `c.roster`. Gefährten-Daten: `charSchema` (`schemas.ts` Z. 161) hat `portrait`, aber kein Feld für einen Gegenstand.
- Burg oben: Bild `paktwacht_ruine` mit Raum-Ankern aus `home.yaml` (`Camp.tsx` `hm__anchors`); kein `render/home/` (Produktinhaber 2026-10-25, Story 6.9).

### Abhängigkeiten

- Story 10.1 (Ausbau, Schema-PR), 10.6 (Gedächtnishalle bleibt der Ort der Steine).
- Epic 11/12 legen die Gefährten von Akt 2/3 an; ihr Gegenstand muss mit dem Schema aus T4 kommen.

### Regeln

- Kein Zustand außerhalb von `CampaignState` (§8.7): Plätze und Gegenstände werden berechnet, nicht gespeichert.
- Werte in YAML; Beträge Symbol + Zahl; Gedenken entsättigt bis auf Glutorange.
- Audio (Lagerfeuer-Knistern, Burg-Atmosphäre): **später (Audio)**.

### Offene Fragen

1. **Heimsuchungen:** GDD „Durchschnitts-EP der Mission“ – zählen Heimsuchungen (mit 60 %-Anteil und Aufhol-Deckel) mit? Vorschlag: ja, auf Basis der tatsächlich vergebenen EP.
2. **Wer ist Reserve?** Alle lebenden Truppenmitglieder, die nicht eingesetzt waren – auch Söldner, auch Figuren über der erwarteten Stufe? Vorschlag: alle inkl. Söldner; Heimsuchungs-Deckel gilt auch für sie.
3. **[PO-Frage]** Wird die Burg in diesem Epic ein 3D-Diorama (dann Figuren, Gegenstände und Ausbauteile als Modelle, `render/home/`, Art Direction §7, ca. 25 Requisiten laut §11) oder bleibt sie ein Bild (dann gemalte Gegenstände/Teile als freigestellte Bilder über dem Bild)?
4. **Was steht am Platz:** nur der Gegenstand oder auch die Figur des Gefährten? Epic-Text „Gefährten und ihre Gegenstände stehen an festen Plätzen“, Narrative nur der Gegenstand. Vorschlag: Gegenstand + kleine Porträt-Marke (2D) bzw. Brettfigur in Idle (3D).
5. **Gegangene Gefährten** (`leave`, Entscheidungen): Nehmen sie ihren Gegenstand mit (Platz leer, kein Gedenkstein)? Vorschlag: ja.
6. **Gegenstände für alle 20 Gefährten:** Die Narrative nennt drei Beispiele. Liste je Gefährte fehlt (wer schreibt sie – Narrative-Session/Produktinhaber)?
7. **Söldner** haben keinen Platz (narrativ „Ersatzbank“) – bestätigen.

### References

- [Source: concept/26-epics/epics.md#Story 10.7]
- [Source: concept/21-gdd/gdd.md#Heimat (Übungsplatz, Lagerfeuer), #NPC und Dialog (Supports, Schwellen), #Figurensystem (EP)]
- [Source: concept/22-narrative/narrative.md#Visual Storytelling „Die Paktwacht wächst mit“ (Z. ~483), „Leere Plätze“; #Die 25 Support-Paare]
- [Source: concept/23-art-direction/art-direction.md#7 Heimat-Burg, #11 Asset-Umfang (Requisiten)]
- [Source: concept/25-ux/EXPERIENCE.md Z. 39, 145, 228 („Burg in 3D“); mockups/04-heimat.html Variante B „lebende Burg“]
- [Source: concept/24-architecture/architecture.md#5.10 (Platz für Gefährten-Gegenstände in `home.yaml`), #5.11 (Übungsplatz in YAML), #5.12 (`render/home/`), #8.6, #8.7]
- [Source: _bmad-output/implementation-artifacts/4-9-feste-support-paare.md, 9-13-supports-und-barks-von-akt-1.md, 6-6-missionsergebnis.md, 6-9-die-paktwacht-als-heimat.md]
- Code: `content/core/balance.yaml` (`supports`, `experience`, `haunt`), `content/home/home.yaml`, `content/core/rooms.yaml`, `src/core/campaign/campaign.ts` (`finishBattle`), `camp.ts` (`campfireMaxRank`, `unlockableRank`), `resultView.ts`, `src/core/rules/progression.ts`, `supports.ts`, `src/content/schemas.ts` (`charSchema`), `src/app/screens/Camp.tsx`, `Rooms.tsx` (`CampfireRoom`), `Result.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story-Kontext mit `gds-create-story` erstellt (2026-10-31); offene Punkte stehen unter „Offene Fragen“, nichts davon ist entschieden.

### File List
