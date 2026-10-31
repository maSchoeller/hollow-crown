# Story 9.13: Supports und Barks von Akt 1

Status: done

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

- [x] T1 Klärung mit dem Produktinhaber (Fragen-Tool), je Paar gebündelt (AC 1)
- [x] T2 Gespräche schreiben (AC 1): je Paar ein Sonnet-Subagent, Kontrolle gegen Narrative (Figur, Ton, Wissensstand), Humanizer-Regeln
  - [x] Kael × Rhen C/B/A/S, Kael × Brenna C/B/A/S, Brenna × Tobin C/B/A/S, Liora × Rhen C/B/A/S
  - [x] Brenna × Varek C/B/A, Tobin × Mira C/B/A, Liora × Ysolde C/B/A, Mira × Fenn C/B/A, Tobin × Grosk C/B/A
- [x] T3 `supports.yaml`: `talks` der 7 Paare vollständig (AC 2)
- [x] T4 Abschiedsszenen `scn.farewell.*` neu: brenna, tobin, mira, liora, varek, ysolde, dazu fenn und grosk; Trauerzeilen je Partner inkl. Kael und Avatar (AC 4)
- [x] T5 Barks (AC 3)
  - [x] Content: Szene `scn.bark.<charId>` je Gefährte mit den Zeilen `battle_start`, `crit`, `downed`, `rescued`, `level_up`, `ember` (Muster wie `scn.farewell.*`)
  - [x] Auslöser in der App (nicht im Kern, 17-audio §1): Kampfbeginn (erste Spielerphase, ein eingesetzter Gefährte), Krit eines Gefährten, niedergestreckt, geborgen (der Geborgene dankt), Stufenaufstieg; Glutfunke beim Aufstieg mit Glutfunke
  - [x] Anzeige über die vorhandenen Sprechblasen (`SceneBubbles`), nur eine Zeile; übersprungen im Überspringen-Modus
  - [x] `content:check`: Bark-Zeile ≤ `bubbleMaxChars`
- [x] T6 Englisch für alle neuen Zeilen, gleiche Schlüssel (`dlg.<scene>.<line>`) (AC 1, 3, 4)
- [x] T7 Tests für die Bark-Auswahl; Prüfungen grün; Screenshots (AC 5)
- [x] T8 Entscheidungen ins Decision-Log der Narrative bzw. Architektur; `17-audio.md` §3 auf die 6 Ereignisse der Narrative verweisen

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

- [Source: concept/26-epics/epics/epic-09.md#Story 9.13]
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
- Klärung mit dem Produktinhaber in fünf Fragerunden (Grundsatz, Paare, Barks); Ergebnisse im Decision-Log der Narrative (2026-10-24).
- 31 Gespräche (DE, je 11–16 Boxen) von Sonnet-Subagenten nach Schreib-Brief, je Paar vom Kontrolleur gegen Figuren, Ton und Wissensstand geprüft und nachgebessert (u. a. keine neuen Fakten zu Kaels Grenzkrieg, Brenna trägt nicht Gerrits Banner, Tobin wechselt bei Grosk in A vom Ihr ins Du). Englisch mit Haiku, stichprobenhaft geprüft.
- Mira × Fenn und Tobin × Grosk: Szenen fertig, Eintrag in `supports.yaml` folgt mit den Beitritten von Fenn und Grosk (9.1, 9.5). `unit.fenn.name` ergänzt, damit Fenn als Sprecher gilt.
- Barks: Darstellung in `src/app/battle/barks.ts`, Haken am Ende des Event-Handlers in Battle.tsx (verträglich mit dem Nebel-Filter aus 2.6), Sprechblase spielt nur eine Zeile, wird nicht als gesehen markiert. Geborgene sprechen über dem Kopf des Bergenden (der Geborgene verlässt das Brett). Nach einem Neustart der Schlacht kommt kein Kampfbeginn-Bark (Neustart spielt keine Start-Events).
- Glutfunke: Zitat-Toast mit Kopf der Figur im Figuren-Screen nach dem Aufstieg (`ui.farewell.quote`).
- Lagerfeuer-Gespräche laufen jetzt im Vollbild mit Halbfiguren wie die Szenen zwischen den Missionen (Produktinhaber 2026-10-24); vorher klemmte die Szene im Raum-Panel. `Rooms.tsx` rendert sie per Portal in `document.body`.
- Im Browser geprüft (375×812, Deutsch, nach `pnpm art:build`): Kampfbeginn-Bark (Mira, Tobin), Lagerfeuer mit „Gespräch bereit“, Gespräch Brenna × Kael B im Vollbild mit beiden Figuren, danach Rang B und zurück am Lagerfeuer.

### Review (2026-10-25, gds-code-review: Blind Hunter, Edge Case Hunter, Acceptance Auditor)

- Akzeptanzkriterien 1–4 erfüllt (Skript-Prüfung aller Szenen, Längen, Barks, Abschiede, EN-Schlüssel), AC 5 per Screenshots; keine Verstöße gegen AGENTS.md.
- Behoben: Barks folgen dem Kampftempo; der Kampfbeginn-Bark entfällt im Überspringen-Modus; der Glutfunke-Toast behält Kopf und Name der beförderten Figur auch nach einem Wisch; Tastatur ruht während eines Barks; Bark-Sprechblase je Bark neu aufgebaut; `content:check` prüft bei Barks Sprecher `[charId]`, bekannte Figur und keine Antworten.
- Bewusst gelassen: Ember erscheint als Zitat-Toast und der Geborgene spricht über dem Bergenden (Produktinhaber bzw. Decision-Log); Barks laufen auch ohne Auto weiter (Decision-Log). Offen, niedrig: Während eines Krit-Barks bleibt die Treffer-Animation stehen; das Vollbild-Gespräch per Portal liegt außerhalb von `#app` (auf iOS-PWA am Gerät prüfen).

### File List

- Neu: `content/acts/act1/scenes/scn.support.{avatar_kael,brenna_kael,brenna_tobin,avatar_liora}.{C,B,A,S}.yaml`, `scn.support.{brenna_varek,mira_tobin,liora_ysolde,fenn_mira,grosk_tobin}.{C,B,A}.yaml` (bestehende C/B ersetzt), `scn.bark.{kael,brenna,tobin,mira,fenn,liora,varek,ysolde,grosk}.yaml`, `scn.farewell.{fenn,grosk}.yaml`
- Neu geschrieben: `scn.farewell.{brenna,tobin,mira,liora,varek,ysolde}.yaml`
- `content/acts/act1/supports.yaml`, `content/locales/en/act1.dialogue.yaml`, `content/core/locales/{de,en}.names.yaml`
- Neu: `src/app/battle/barks.ts`, `src/content/barkLines.ts`, `tests/unit/barks.test.ts`
- `src/app/screens/{Battle,Scene,Troop,Rooms}.tsx`, `src/ui/SpeechBubbles.tsx`, `src/content/validate.ts`, `tests/unit/supports-pairs.test.ts`
- Doku: `concept/22-narrative/decision-log.md`, `concept/24-architecture/decision-log.md`, `concept/17-audio.md`
