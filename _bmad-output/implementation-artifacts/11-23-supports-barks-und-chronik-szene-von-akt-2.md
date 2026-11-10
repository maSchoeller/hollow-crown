---
baseline_commit: 39772810
---
# Story 11.23: Supports, Barks und Chronik-Szene von Akt 2

Status: review

<!-- Erstellt 2026-11-10 mit gds-create-story (headless, für die orchestrierende Session), umgesetzt mit gds-dev-story.
     Offene Fragen nicht zurückgegeben: empfohlene Option als [ASSUMPTION], Liste unten. -->

## Story

Als Spieler
möchte ich am Lagerfeuer die neuen Paare kennenlernen, die neuen Gefährten im Kampf hören und in der Burg die Chronik entziffern lassen,
damit Akt 2 Beziehungen und das Pakt-Geheimnis vertieft.

## Acceptance Criteria

1. Die 8 Paare von Akt 2 (Jory × Nell, Nell × Varek, ★ Varek × Odile, Odile × Sable, Sable × Ilka, ★ Ilka × Brann, Liora × Amos,
   Amos × Grosk) stehen in `content/acts/act2/supports.yaml` mit C, B, A, die Kernpaare zusätzlich S; DE und EN, jede Box ≤ 110 Zeichen.
2. Der Rang folgt der Lagerfeuer-Stufe (Epic 10, `balance.supports.campfireMaxRank`: Stufe 1 B, 2 A, 3 S).
3. Gespräche mit fehlenden (Varek ohne N2, Brann ohne N5), gegangenen (Odile nach E5 `return`, Varek nach E6 `pardon`) oder noch nicht
   beigetretenen Figuren (Sable ohne E7 `warn`) erscheinen nicht – getestet.
4. Jeder Gefährte von Akt 2 (Jory, Ilka, Odile, Amos, Nell, Brann, Sable) hat die 6 Barks, eine Todeszeile und eine Trauerzeile je
   Support-Partner; die Akt-1-Partner der neuen Paare (Varek, Liora, Grosk) bekommen Trauerzeilen für ihre Akt-2-Partner.
5. Beat 10: `scn.castle.chronicle` läuft einmal in der 3D-Burg bei der Rückkehr nach 2-4; Liora entziffert die Chronik aus 1-7, sonst
   Ysolde, sonst Rhen; Kern „Der Pakt verlangt etwas von den Königen“; danach ist `chronicle_read` gesetzt und der Chronik-Eintrag zeigt
   „entziffert“. Getestet für beide Reihenfolgen des ersten Paars (2-2/2-3).

## Tasks / Subtasks

- [x] Paare: `content/acts/act2/supports.yaml`, 26 Gespräche `content/acts/act2/scenes/scn.support.*`, EN `locales/en/act2.supports_{a,b,c}.yaml` (AC 1)
- [x] Barks und Abschiede: `scn.bark.<id>`, `scn.farewell.<id>` für die 7 Gefährten, EN `locales/en/act2.barks.yaml`; Trauerzeilen in
      `act1/scenes/scn.farewell.{varek,liora,grosk}.yaml` + `locales/en/act1.dialogue.yaml` (AC 4)
- [x] Szenen daheim: `campaign.yaml` `homeScenes` (Schema, `HomeSceneDef`, `pendingHomeScene` in `core/campaign/homeScene.ts`,
      Prüfung in `validateCampaign.ts`), App: `Camp.tsx` zeigt die fällige Szene als Overlay über der Burg und führt am Ende ihre
      `effects` über das Command `effects` aus (AC 5)
- [x] Chronik: `balance.chronicle.sealed[].readFlag`, `chronicleView` liefert `deciphered`, Texte `chronicle.sealed.<flag>.read.*`,
      `ui.chronicle.deciphered`; `Chronicle.tsx` zeigt die entzifferte Fassung (AC 5)
- [x] Szene `scn.castle.chronicle` (DE, EN in `locales/en/act2.dialogue.yaml`) (AC 5)
- [x] Tests `tests/unit/act2-supports.test.ts`, `tests/unit/act2-chronicle-scene.test.ts`; angepasst `supports-pairs`, `chronicle` (AC 1–5)
- [x] Entscheidungen ins Narrative-Decision-Log

## Dev Notes

### Ausgangslage (origin/main 39772810)

- Supports: Paare je Akt in `acts/actN/supports.yaml` (Schema `supportPairSchema`), Punkte in `c.supports` (neue Paare bekommen beim
  Laden einen Eintrag, `normalizeCampaign`). `supportTalk` (core/campaign/camp.ts) verlangt beide im `c.roster` – Tod und `leave`
  nehmen eine Figur heraus, ein Leutnant kommt erst mit `recruit { lt }` hinein. Damit ist AC 3 schon Regel, die Story belegt es mit Tests.
- Lagerfeuer-Stufe: `campfireMaxRank` liest `c.home.rooms.campfire`. Ausbauen kann man Räume erst mit Story 10.1 (backlog); bis dahin
  bleibt das Lagerfeuer Stufe 1, Akt-2-Paare erreichen also höchstens B. A und S sind geschrieben und getestet, im Spiel aber erst mit 10.1/10.8.
- Barks: sechs feste Ids (`src/content/barkLines.ts`), ≤ `balance.scene.bubbleMaxChars` (56). Abschied: `last` + `grief_<partner>`.
- Szenen daheim gab es nicht; die Burg (`Camp.tsx`, `Castle3d`) spielte bisher nur Lagerfeuer-Gespräche als Portal.
- Chronik: versiegelter Eintrag `wardens_chronicle` (Story 9.8) über `balance.chronicle.sealed`.

### Beitritte, die noch nicht auf main sind

2-2 bis 2-8 (11.13–11.19) und N6 sind backlog: Ilka (2-3), Odile/Amos (2-5), Nell (2-6), Sable (E7 nach 2-4) und die Entscheidungen
E5/E6 haben noch keine Szene. Die Story baut gegen den Stand aus 11.5 (`units.yaml` `joins`, `flags.yaml`) und prüft Beitritt und
Abgang über die Wirkungen `recruit`/`leave`, die die Missions-Stories setzen werden. Die Chronik-Szene hängt an `completed: m2_4`; bis
11.15 die Karte baut, ist sie im Spiel nicht erreichbar (nur in Tests und mit Dev-Hooks).

### References

- `concept/26-epics/epics/epic-11.md` Story 11.23 und gemeinsame Regeln; `concept/22-narrative/narrative.md` (Characters, Dialogue
  Framework, Key Conversations #7, Found Documents, Die 25 Support-Paare, Hidden Secrets); `missionsliste-s1.md` Akt 2;
  `concept/27-ueberarbeitung/umsetzung-lueckenliste-akt2.md` („nach der 3. Mission“ heißt bei fester Folge „nach 2-4“).

## Offene Fragen an den Produktinhaber

1. **Zeitpunkt der Chronik-Szene.** Epic: „nach 2-4“; Narrative-Log 2026-10-31: „nach der dritten Akt-2-Story-Mission, egal welcher“
   (wäre nach dem zweiten Missions-Paar-Teil). Optionen: A nach 2-4 · B nach der 3. Story-Mission (`storyCount { min: 3 }`).
   Bestätigt (PO 2026-11-10): A (Epic gilt vor narrative.md); eine Zeile in `campaign.yaml`.
2. **Chronik nicht gefunden.** Die Szene verlangt `wardens_chronicle` (1-7 setzt es immer beim Sieg). Optionen: A verlangen · B ohne
   Bedingung. Bestätigt (PO 2026-11-10): A.
3. **Ysolde nie beigetreten.** Die Sprecherkette der Engine lässt eine nie beigetretene Figur sprechen; die Szene nutzt deshalb
   `requires: alive`-Varianten. Optionen: A so lassen · B Kettenregel allgemein auf „in der Truppe“ ändern (betrifft Akt-1-Szenen).
   [ASSUMPTION] A.
4. **Hintergrund der Gespräche.** Optionen: A Burg `paktwacht_heimat` · B Lager `lager_unterwegs` wie Akt 1. Bestätigt (PO 2026-11-10): A.
5. **Erfundene Details in den Gesprächen** (Vorschläge, leicht änderbar): Nell auf einer Sandbank ausgesetzt, Schiffsjunge Tamm;
   Vareks „die Münzen waren Dörfer“; Sable zeichnete die Karte der Brandschneise; Brann verbrannte seinem Bruder die Hand; Ilkas Name
   wird am Clanfeuer nicht mehr gerufen, ihr Wolfsfell; Amos' Schuld (ein Junge aus dem Grenzheer starb auf Befehl des Priors);
   Liora wurde verstoßen, weil sie nach den jungen Königen fragte. Optionen: A behalten · B streichen/ersetzen. Bestätigt (PO 2026-11-10): A.
6. **Entzifferter Chronik-Text** (Karte im Chronik-Bildschirm): Kern wie Szene, ohne zu verraten, *was* die Könige geben (Akt 3).
   Bestätigt (PO 2026-11-10): Vorschlagstext.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Texte in vier parallelen Subagenten nach einem gemeinsamen Schreib-Brief, Code und Prüfung in der Story-Session)

### Completion Notes List

- 26 Lagerfeuer-Gespräche, 7 × 6 Barks, 7 Abschiede, 4 neue Trauerzeilen in Akt-1-Abschieden, Chronik-Szene; alles DE und EN.
- Neuer Mechanismus „Szenen daheim“ (`homeScenes`), datengetrieben, ohne neues Speicherfeld (einmal = `scenesSeen`).
- Kein Speicherformat-Wechsel, kein `content:lock`, `act2` bleibt unveröffentlicht.

### File List

- content/acts/act2/supports.yaml (neu), content/acts/act2/scenes/scn.support.*, scn.bark.*, scn.farewell.*, scn.castle.chronicle.yaml (neu)
- content/acts/act2/campaign.yaml, content/core/balance.yaml, content/core/locales/{de,en}.yaml
- content/acts/act1/scenes/scn.farewell.{varek,liora,grosk}.yaml, content/locales/en/act1.dialogue.yaml, act2.dialogue.yaml,
  act2.supports_{a,b,c}.yaml, act2.barks.yaml (neu)
- src/core/campaign/homeScene.ts (neu), src/core/campaign/chronicle.ts, src/core/storyDefs.ts, src/core/balanceDefs.ts, src/core/index.ts
- src/content/schemaCampaign.ts, schemaBalance.ts, validateCampaign.ts, validateLocales.ts, validateReach.ts
- src/app/screens/Camp.tsx, Chronicle.tsx
- tests/unit/act2-supports.test.ts, act2-chronicle-scene.test.ts (neu), supports-pairs.test.ts, chronicle.test.ts
- concept/22-narrative/.decision-log.md bzw. decision-log.md

### Change Log

- 2026-11-10: Story angelegt und umgesetzt (Status review).
