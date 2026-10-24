# Story 9.13: Supports und Barks von Akt 1

Status: ready-for-dev

## Story

Als Spieler
möchte ich am Lagerfeuer die Paare von Akt 1 kennenlernen,
damit Beziehungen wachsen.

## Acceptance Criteria

1. **Gespräche aller Akt-1-Paare:** Für alle 9 Paare, deren beide Figuren in Akt 1 beitreten (Narrative „Die 25 Support-Paare“), sind die Lagerfeuer-Gespräche bis zum Höchstrang geschrieben: Kernpaare ★ (Kael × Rhen, Kael × Brenna, Brenna × Tobin, Liora × Rhen) C, B, A, S; die übrigen (Brenna × Varek, Tobin × Mira, Liora × Ysolde, Mira × Fenn, Tobin × Grosk) C, B, A. Je Gespräch 8–16 Boxen, je Box ≤ 110 Zeichen, Deutsch in der Szene, Englisch in `content/locales/en/act1.dialogue.yaml`.
2. **Bereit am Lagerfeuer:** Die sieben Paare in `supports.yaml` verweisen auf ihre Szenen und stehen am Lagerfeuer bereit, sobald die Punkte reichen (in Akt 1 bis B, A und S über die Burg-Stufen, Epic 10). Mira × Fenn und Tobin × Grosk werden eingetragen, sobald Fenn und Grosk als Einheiten existieren (Missions-Stories 9.1 und 9.5); ihre Szenen liegen bereit.
3. **Barks:** Jeder Akt-1-Gefährte hat seine Barks für die 6 Ereignisse der Narrative: Kampfbeginn, Krit, niedergestreckt, Dank fürs Bergen, Stufenaufstieg, Glutfunke. Je Bark ≤ `balance.scene.bubbleMaxChars` (eine Sprechblasen-Seite). Im Kampf erscheinen sie als Sprechblase am Kopf der Figur.
4. **Gedenken:** Jeder Akt-1-Gefährte hat seine Todeszeile (`last`) und je Support-Partner eine Trauerzeile (`grief_<partner>`) in `scn.farewell.<charId>`.
5. **Prüfungen:** `pnpm content:check`, `pnpm lint`, `pnpm test`, `pnpm build` grün; je ein Gespräch am Lagerfeuer und ein Bark im Kampf im Browser gezeigt.

## Tasks / Subtasks

- [ ] T1 Klärung mit dem Produktinhaber (Fragen-Tool), je Paar gebündelt (AC 1)
- [ ] T2 Gespräche schreiben (AC 1): je Paar ein Sonnet-Subagent, Kontrolle gegen Narrative (Figur, Ton, Wissensstand), Humanizer-Regeln
  - [ ] Kael × Rhen C/B/A/S, Kael × Brenna C/B/A/S, Brenna × Tobin C/B/A/S, Liora × Rhen C/B/A/S
  - [ ] Brenna × Varek C/B/A, Tobin × Mira C/B/A, Liora × Ysolde C/B/A, Mira × Fenn C/B/A, Tobin × Grosk C/B/A
- [ ] T3 `supports.yaml`: `talks` der 7 Paare vollständig (AC 2)
- [ ] T4 Abschiedsszenen `scn.farewell.*` neu: brenna, tobin, mira, liora, varek, ysolde, dazu fenn und grosk; Trauerzeilen je Partner inkl. Kael und Avatar (AC 4)
- [ ] T5 Barks (AC 3)
  - [ ] Content: Szene `scn.bark.<charId>` je Gefährte mit den Zeilen `battle_start`, `crit`, `downed`, `rescued`, `level_up`, `ember` (Muster wie `scn.farewell.*`)
  - [ ] Auslöser in der App (nicht im Kern, 17-audio §1): Kampfbeginn (erste Spielerphase, ein eingesetzter Gefährte), Krit eines Gefährten, niedergestreckt, geborgen (der Geborgene dankt), Stufenaufstieg; Glutfunke beim Aufstieg mit Glutfunke
  - [ ] Anzeige über die vorhandenen Sprechblasen (`SceneBubbles`), nur eine Zeile; übersprungen im Überspringen-Modus
  - [ ] `content:check`: Bark-Zeile ≤ `bubbleMaxChars`
- [ ] T6 Englisch für alle neuen Zeilen, gleiche Schlüssel (`dlg.<scene>.<line>`) (AC 1, 3, 4)
- [ ] T7 Tests für die Bark-Auswahl; Prüfungen grün; Screenshots (AC 5)
- [ ] T8 Entscheidungen ins Decision-Log der Narrative bzw. Architektur; `17-audio.md` §3 auf die 6 Ereignisse der Narrative verweisen

## Dev Notes

- **Quellen:** Epics 9.13; Narrative „Dialogue Framework“ (Stimmen je Figur, Du/Ihr, Weltflüche, 8–16 Boxen, ≤ 110 Zeichen), „Weitere Gesprächsarten“ (Barks ~6 je Gefährte, Gedenken), „Die 25 Support-Paare“, „Characters“, „Missionsfolge“; GDD Supports (C 10, B 25, A 45, S 70); EXPERIENCE Sprechblase (blockiert kurz, höchstens 2 Zeilen).
- **Mechanik steht seit 4.9:** `supports.yaml` (`pair`, `core`, `talks`), `supportTalk`, `campfireMaxRank` (Lager = B). Szenen-Schema 4.4 (`speaker`-Kette, `fallback: skip`, `mood` neutral/happy/angry/sad, `requires`). Abschied 6.7: `scn.farewell.<charId>` mit `last` und `grief_<partner>`, `farewellView`.
- **Szenen-Konventionen:** Datei `content/acts/act1/scenes/scn.support.<a>_<b>.<Rang>.yaml`, Namen alphabetisch (`avatar_kael`, `brenna_kael`, `fenn_mira`, `grosk_tobin`, `liora_ysolde` …), `background: bg_camp_night`, `music: camp`, Zeilen-IDs `l01…`. Avatar spricht als `avatar`, wird mit `{avatar}` genannt; Rhen nie in der dritten Person mit Pronomen nennen (Pronomen wählbar), sondern direkt ansprechen.
- **Wissensstand (Produktinhaber 2026-10-24):** C und B laufen in Akt 1 in beliebiger Missionsreihenfolge: nur Prolog (Gerrits Tod), Steckbriefe (1-1) und Beitritte beider Figuren voraussetzen. A und S kommen erst mit der Burg: Wissensstand Ende Akt 1 (Paktwacht als Heimat, versiegelte Chronik gefunden, Rhens Geständnis geschehen), nichts aus Akt 2 und 3. Die Truppe weiß offen, dass Liora Halvards Ziehtochter ist und kennt ihn als Ehrwürden Halvard. Romantische S-Ränge (Kael × Brenna, Liora × Rhen) sprechen die Liebe zurückhaltend aus, kein Kuss im Text.
- **Barks:** Narrative gilt vor `17-audio.md` (18 Zeilen in 11 Ereignissen ist älter); Variantenwahl ist Darstellung, kein Seed-RNG. Sprechblasen heute: `SceneBubbles`/`SpeechBubbles` spielen eine ganze Szene; für Barks reicht eine Zeile.
- **Grenzen:** Missionen 9.1–9.12 nicht bauen; Kampf-Auslöser baut parallel die Session „Kampf“ (Battle.tsx): Bark-Logik in eigenem Modul halten, Eingriff in Battle.tsx klein.

### Project Structure Notes

- Neu: `content/acts/act1/scenes/scn.support.*.{C,B,A,S}.yaml` (31), `scn.farewell.{fenn,grosk}.yaml`, `scn.bark.*.yaml`.
- Geändert: `content/acts/act1/supports.yaml`, `content/locales/en/act1.dialogue.yaml`, bestehende `scn.support.*` und `scn.farewell.*`; Bark-Auslöser in `src/app/screens/Battle.tsx` bzw. eigenem Modul, `src/content/validate.ts`.

### Project Context Rules

- Kein sichtbarer Text im Code; Deutsch in der Szene, Englisch im Locale. Code und Schlüssel englisch, Konzept deutsch.
- `src/core` rein; Barks sind Darstellung.
- In `sprint-status.yaml` nur die Zeile 9-13 ändern.

### References

- [Source: concept/26-epics/epics.md#Story 9.13]
- [Source: concept/22-narrative/narrative.md#Dialogue Framework]
- [Source: concept/22-narrative/narrative.md#Die 25 Support-Paare]
- [Source: concept/21-gdd/gdd.md#Supports]
- [Source: concept/25-ux/EXPERIENCE.md]
- [Source: _bmad-output/implementation-artifacts/4-9-feste-support-paare.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (Kontrolle), Sonnet (Gespräche), Haiku (Schlüssel, Abgleich, Prüfungen)

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List
