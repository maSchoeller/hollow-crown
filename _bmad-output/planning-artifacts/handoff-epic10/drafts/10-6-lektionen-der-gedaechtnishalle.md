# Story 10.6: Lektionen der Gedächtnishalle

Status: ready-for-dev

## Story

Als Spieler
möchte ich das Erbe der Gefallenen an Gefährten weitergeben,
damit Verlust Bedeutung behält.

## Acceptance Criteria

1. **Lektionen als Content:**
   **Angenommen** `content/core/lessons.yaml` (oder Lektionen als Skills mit `source: lesson` in `skills.yaml`, siehe Dev Notes) mit je Rolle mindestens einer Lektion = passiver Skill der Rolle (GDD-Beispiele: „+5 Treffer“, „+1 MOV im Wald“; Mockup 04: Fenns „Leichter Schritt“)
   **Dann** prüft `content:check`: jede Kernrolle hat Lektionen, jede Lektion ist ein gültiger Skill-Baustein, Namen/Texte DE/EN vorhanden. Die Liste je Rolle: **[PO-Frage]**.
2. **Freischaltung ab Akt 2:** Die Gedächtnishalle (Raum `memorial`, Story 6.9) zeigt ab Akt 2 statt der gesperrten Zeile „Lektionen ab Akt 2“ die Aktion „Lektion vererben“ (`unlocks: [{ id: lessons, requires: [{ act: 2 }] }]` bleibt die Quelle, kein `if` im Code).
3. **Command `inheritLesson`:**
   **Angenommen** ein Gedenkstein eines Gefallenen mit Rolle (aus `c.fallen[].classId`), ein lebender Gefährte der Truppe als Empfänger und im laufenden Akt noch ein freies Vererben (Stufe 1: 1, Stufe 2: 2 je Akt; Werte `balance.yaml` `memorial.lessonsPerActByLevel: [1, 2, 2]` o. ä.)
   **Wenn** der Spieler `{ type: 'inheritLesson', from, to, lesson? }` schickt
   **Dann** erhält der Empfänger die Lektion dauerhaft (neues Feld am `UnitRecord`, z. B. `lessons: string[]`, Default `[]` beim Laden), der Akt-Zähler steigt (`c.lessonsGiven`), Event `lessonInherited { from, to, lesson }`.
   **Und** welche Lektion: Stufe 1 und 2 die feste bzw. eine von zwei Lektionen der Rolle des Gefallenen, Stufe 3 „freie Wahl der Lektion“ (Lesart Offene Frage 2); `lesson` im Command nur, wenn eine Wahl besteht.
   **Und** Fehler ohne Änderung: `not_available` (Akt < 2, kein Vererben mehr frei, Gefallener hat schon vererbt), `unknown_unit` (Empfänger nicht in der Truppe, Avatar/Kael siehe Offene Frage 4), `unknown_choice` (Lektion nicht erlaubt).
4. **Wirkung im Kampf:** Eine vererbte Lektion wirkt wie ein passiver Skill (`activeSkillIds`, `rules/skills.ts`) in Kampf, Vorschau, KI und Simulation; die Figur-Ansicht zeigt sie unter Skills mit Herkunft („von Fenn“).
5. **Panel (UX-DR11, Mockup 04 „Gedächtnishalle“):** entsättigt bis auf Glutorange (Stil „Gedenken“, `mourn`-Farben, ruhige Taste, keine Bewegung außer langsamem Ausblenden); Stein wählen (1) → darunter „→ Lektion vererben: Fenns ‚Leichter Schritt‘ an …“ mit Wahl des Empfängers (2) → „Lektion vererben“ (3). Anzeige „1× in Akt 2“ (freie Vererbungen dieses Akts). Ein Stein, der vererbt hat, trägt eine kleine Glutmarke.
6. **Reproduzierbar und persistent:** Command im Journal, Replay gleich; neue Felder mit Default in `normalizeCampaign`; Akt-Wechsel setzt nur den Zähler, nie die Lektionen zurück; Staffel-Übertrag (Format 2) behält die Lektionen.

## Tasks / Subtasks

- [ ] T1 Content (AC 1): Lektionen-Datei bzw. `skills.yaml`-Abschnitt nach [PO-Frage]; `skillSchema.source` um `lesson` erweitern; Zuordnung Rolle → Lektionen (`lessons.yaml`: `{ role, lessons: [skillId, …] }`); Texte `skill.<id>.name|desc`
- [ ] T2 Zustand (AC 3, 6): `UnitRecord.lessons` (+ Herkunft, z. B. `lessons: Array<{ skill, from }>`), `CampaignState.lessonsGiven: Array<{ act, from, to, skill }>`; Defaults in `normalizeCampaign`; Speicher-Fixture prüfen (`tests/unit/migrations.test.ts` nur, falls 9-14 inzwischen veröffentlicht ist)
- [ ] T3 Kern (AC 3, 4): `inheritLesson` in `commands.ts`/`apply.ts`; reine Funktion `lessonOptions(data, c, fallenId)` (erlaubte Lektionen + freie Vererbungen) in `src/core/campaign/memorial.ts`; `activeSkillIds` nimmt `lessons` dazu
- [ ] T4 UI (AC 5): `MemorialRoom` (`Rooms.tsx` Z. ~617) – Aktion statt gesperrter Zeile, Empfänger-Wahl (Liste wie `PersonLine`), Glutmarke am `Grave`; Skill-Anzeige mit Herkunft in `Troop.tsx`; Schlüssel `ui.memorial.lesson.*`; Styles `src/ui/camp.css`
- [ ] T5 Handbuch: Eintrag `lessons_memorial` o. ä. (Kategorie home, `fromAct: 2`), **nicht** in die Kategorie `lessons` (das sind die Regel-Lektionen des Prologs, Story 14.7)
- [ ] T6 Tests: Vererben gültig, Zähler je Akt und Stufe, jeder Fehlercode, Wirkung im Kampf (Vorschau = Auflösung), Söldner-Stein nach Antwort auf Offene Frage 3, Replay, Laden alter Spielstände ohne Felder

## Dev Notes

### Heutiger Stand (nicht brechen)

- Raum `memorial` (`rooms.yaml`): `fromAct: 1`, nur Burg, `levels` mit `{ act: 2 }`, `unlocks: [{ id: lessons, requires: [{ act: 2 }] }]`. `roomUnlocks()` (`camp.ts`) liefert den Status, `MemorialRoom` zeigt die Zeile gesperrt (`room.memorial.unlock.lessons`).
- `memorialStones(data, c)` (`src/core/campaign/memorial.ts`): erst feste Steine aus `content/acts/act1/memorials.yaml` (Gerrit), dann `c.fallen` in Reihenfolge, Söldner eingeschlossen. `c.fallen[]` = `{ id, nameKey, name?, node, classId?, portrait?, mercenary? }` – `classId` ist optional (alte Einträge), die Rolle kommt über `data.classes[classId].role`.
- Gerrit ist kein `c.fallen`-Eintrag und hat keine `classId` (Rolle „Bannerträger“ steht als Text in `memorials.yaml`).
- Skills: `skillSchema.source` = `class | personal | item | grudge`; aktiv über `activeSkillIds` (`rules/skills.ts`): Klassen-Skill, persönlicher Skill, Loadout (gemeisterte Item-Skills, max. 4/5). Lektionen sollen den Loadout **nicht** belegen (Offene Frage 5).
- Skill-Ids: Es gibt schon einen Groll-Skill `bulwark` – gleiche Id wie die Klasse `bulwark`; neue Lektions-Ids eindeutig wählen (Präfix `lesson_`).

### Begriff

„Lektion“ heißt im Spiel bereits die Tutorial-Zeile der gestaffelten Regeln (GDD „höchstens eine Lektion pro Runde“, EXPERIENCE State „Lektion“, Handbuch-Kategorie `lessons`, Story 14.7). Bezeichner im Code daher eindeutig (`legacy`/`inheritLesson`, Datei `lessons.yaml` nur mit Kommentar), sichtbarer Text siehe Offene Frage 6.

### Regeln

- Spielwerte nur in YAML; kein `if (act >= 2)`; ein Command je Handlung; ≤ 2 Taps sind hier 3 Tipps (Stein, Empfänger, Taste) – Stein-Wahl ist Anzeige, nicht Handlung (wie Item-Zeile).
- Neue persistierte Felder mit Default (§8.7); keine Maps/Sets im State.

### Offene Fragen

1. **[PO-Frage]** Lektionen je Rolle (Liste, Werte, Namen).
2. **Stufen „1 Lektion → 2 Lektionen → freie Wahl der Lektion“:** Bedeutet „2 Lektionen“ zwei Vererbungen je Akt oder Wahl aus zwei Lektionen der Rolle? Und „freie Wahl“: aus allen Lektionen der Rolle des Gefallenen oder aller Rollen? Vorschlag: Stufe 2 = 2 Vererbungen je Akt, Stufe 3 = freie Wahl innerhalb der Rolle des Gefallenen; Stufe 1 = feste erste Lektion der Rolle.
3. **Söldner und Gerrit:** Mockup 04 zeigt den Söldner „Wulf“ als Stein. Dürfen gefallene Söldner vererben? Und Gerrit (Prolog, kein `c.fallen`)? Vorschlag: Söldner ja (stärkt „Jeder zählt“), Gerrit mit fester Bannerträger-Lektion über `memorials.yaml` (`lesson:`).
4. **Empfänger:** Jeder Gefährte (auch andere Rolle, auch Avatar/Kael, auch Söldner)? Wie viele Lektionen darf eine Figur tragen? Vorschlag: alle außer Söldnern, je Figur höchstens eine Lektion.
5. **Loadout:** Belegt eine Lektion einen Loadout-Platz (4/5) oder ist sie immer aktiv? Vorschlag: immer aktiv, kein Platz.
6. **Begriffsdoppel „Lektion“** (Tutorial vs. Erbe): sichtbaren Namen beibehalten (Mockup, EXPERIENCE Z. 215 „Fenns Lektion an Tobin“) oder „Vermächtnis“? Vorschlag: im Spiel „Lektion“ lassen, im Handbuch klar trennen.
7. **Zeitpunkt „einmal pro Akt“:** Darf das Vererben eines Akts nachgeholt werden (Zähler läuft auf), und zählt ein Gefallener aus Akt 1 in Akt 2? Vorschlag: nicht nachholbar; alle Gefallenen jeder Zeit zählen.

### References

- [Source: concept/26-epics/epics/epic-10.md#Story 10.6], UX-DR11
- [Source: concept/21-gdd/gdd.md#Heimat (Gedächtnishalle-Zeile, Z. 324), #Quest-System (Tutorial-„Lektion“)]
- [Source: concept/22-narrative/narrative.md#Visual Storytelling (Gedenkstein, leerer Platz)]
- [Source: concept/25-ux/EXPERIENCE.md Z. 41, 161, 215; DESIGN.md Gedenken-Farben, ruhige Taste; mockups/04-heimat.html „Gedächtnishalle“]
- [Source: concept/24-architecture/architecture.md#5.10 (Gedächtnishalle, `unlocks`), #5.11 (Lektionen in YAML), #8.7]
- [Source: _bmad-output/implementation-artifacts/6-9-die-paktwacht-als-heimat.md, 6-7-abschied-von-gefallenen.md, 14-7-lektionen-und-kontext-fragezeichen.md]
- Code: `content/core/rooms.yaml` (`memorial`), `skills.yaml`, `src/core/campaign/memorial.ts`, `camp.ts` (`roomUnlocks`), `src/core/rules/skills.ts`, `src/core/state.ts` (`fallen`, `UnitRecord`), `src/app/screens/Rooms.tsx` (`MemorialRoom`, `Grave`), `Troop.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story-Kontext mit `gds-create-story` erstellt (2026-10-31); offene Punkte stehen unter „Offene Fragen“, nichts davon ist entschieden.

### File List
