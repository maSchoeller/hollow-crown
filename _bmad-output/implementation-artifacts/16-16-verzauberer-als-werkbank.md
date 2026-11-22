# Story 16.16: Verzauberer als Werkbank

Status: ready-for-dev

## Story

Als Spieler
möchte ich eine Rune zur Probe in die Waffe legen und sehen, was sie ändert,
damit Verzaubern kein Rätselraten ist.

## Acceptance Criteria

1. **Angenommen** Story 16.4 (Schild-Runen), 16.13 (Änderungsliste), 16.14 (Waffenansicht, `ItemStageFrame`), 16.17 (`PersonBar`), EXPERIENCE „Verzauberer (Werkbank)“ und GDD (Runenplätze frei belegbar, höchstens eine Element-Rune je Item), **wenn** der Raum öffnet, **dann** gilt er für eine Person: oben fest die `PersonBar` (Medaillons, Konvoi als letztes), darunter ihre Items mit Runenplätzen als Farbpunkten, in der Mitte das gewählte Item in der 3D-Bühne mit seinen Fassungen, darunter die Änderungsliste, unten der Runenvorrat als Steine mit Stufe und Anzahl. Der Raum öffnet mit dem Item aus `camp.item` (Person = Träger, im Konvoi das Konvoi-Medaillon), sonst mit der ersten Person und ihrem ersten Item mit Runenplatz.
2. Der erste Tipp auf einen Stein legt ihn **zur Probe** in die gewählte Fassung: Marke „Probe“, der Stein wächst auf, die Rinne füllt sich (Bühne `setRunes({ grow })`), die Änderungsliste zeigt **nur, was sich ändert** (`changeList` mit Probe gegen das Getragene). Die Haupttaste „Einsetzen“ setzt ein; ist die Fassung belegt, heißt sie „Tauschen“ und die alte Rune geht in den Konvoi. Erneutes Tippen auf den Stein nimmt die Probe zurück.
3. Ohne gewählten Stein baut die Haupttaste die Rune der gewählten Fassung **kostenlos** aus („Ausbauen“; die Rune liegt danach im Vorrat). Steine, die nicht passen (Schild/Körperrüstung nur Element-Runen, Schild ohne Licht/Dunkel, schon eine Element-Rune im Item), sind gedimmt und nennen den Grund. **Rune I** zum Kauf steht gestrichelt mit Preis (Symbol + Zahl) am Ende des Vorrats; Tipp legt sie zur Probe, die Haupttaste heißt „Kaufen und einsetzen · Preis“.
4. Umschalter „Einsetzen / Verschmelzen“: im Modus Verschmelzen zeigt jeder Stein seinen Stand („2/3 Steine“, „ab Verzauberer Stufe 3“, Höchststufe); ein bereiter Stein und die Haupttaste „Verschmelzen · Preis“ lassen **drei Steine in der Bühne zusammenfliegen** (Lichtblitz in Elementfarbe, `ItemStage.fuse`, Vertrag nur erweitert), danach liegt die nächste Stufe im Konvoi. Verschmolzen wird nur aus dem Konvoi (`mergeRunes`).
5. Rüstung (und alles ohne Modell) erscheint als Bild mit dem Stein am Brustteil (eine Fassung).
6. Alle Aktionen sind Kampagnen-Commands (`insertRune` mit `index`, neu `buyRune`, `removeRune`, `mergeRunes`), im Replay identisch; Prüfung, Vorschau und Tastenbeschriftung aus denselben reinen Kernfunktionen (`runeSetError`, `buyRuneError`, `mergeStatus`). Alte Journale ohne `index` bleiben gültig (keine Migration).
7. Texte DE und EN, keine Emojis, Beträge als Symbol + Zahl, Werte nur in YAML; Babylon nur lazy; eigene CSS-Datei neben dem Screen, der alte Verzauberer-Teil in `Rooms.tsx`/`camp.css`/`styles.css` entfernt. Sichtbares Ergebnis per Dev-Hook `__hc.devEnchanter()`.

## Tasks / Subtasks

- [ ] Task 1: Kern (AC: 2, 3, 6) – `src/core/campaign/enchant.ts` (`runeSetError`, `runesAfterSet`, `runeStones`, `mergeStatus`, `runeOffers`, `buyRuneError`), `insertRune.index` mit Tausch, Command `buyRune` (`commands.ts`, `apply.ts`, `history.ts`), Tests.
- [ ] Task 2: Bühne (AC: 4) – `ItemStage.fuse(element)`: drei Lichtpunkte fliegen zur Mitte, Lichtblitz in Elementfarbe; Dauer aus `render.yaml itemStage.fuseMs`.
- [ ] Task 3: Modell (AC: 1, 2, 5) – `enchanterModel.ts` (Person → Items, Fassungen, Probe-Item, Tastenzustand), Test.
- [ ] Task 4: Oberfläche (AC: 1–5, 7) – `Enchanter.tsx` + `Enchanter.css`, `EnchanterRoom` aus `Rooms.tsx` lösen, Schlüssel DE/EN, alter CSS-Teil weg.
- [ ] Task 5: Dev-Hook `devEnchanter`, `pnpm check`.

## Dev Notes

- Bausteine nutzen, nicht nachbauen: `changeList` (16.13) und `ChangeList`/`ChangeStats`, `PersonBar` (16.17), `ItemStageFrame` + `ItemStage` + `stageRunes`/`weaponStageModel`/`withoutRunes` (16.14), `runeLookOf`, Rune-Looks aus `render.yaml gear.rune`.
- Heute: `EnchanterRoom` in `Rooms.tsx` (Liste + Knöpfe, `insertRune` setzt immer in die erste freie Fassung). Das Alte entfällt.
- [ASSUMPTION] `insertRune` bekommt optional `index` statt eines neuen Tausch-Commands; ohne `index` verhält es sich wie zuvor. Eine belegte Fassung wird getauscht, die alte Rune geht in den Konvoi (Konvoi-Größe gleich, da der gelegte Stein ihn verlässt).
- [ASSUMPTION] Kaufen und Einsetzen ist ein eigenes Command `buyRune` (Preis wie `buy`, `shopPrice`), bei belegter Fassung braucht die alte Rune einen Konvoi-Platz (`convoy_full`).
- [ASSUMPTION] Die Fassungen der Bühne sind nach Anzeige geordnet: „groß“ = Fassung mit der Element-Rune, sonst Platz 0; „klein“ = die andere.
- [ASSUMPTION] Die Fusion-Animation läuft in der Bühne des gewählten Items und endet vor dem Command; der Command wird danach abgesendet (Replay unabhängig von der Animation).
- [ASSUMPTION] Items im Konvoi mit Runenplatz sind über das Konvoi-Medaillon erreichbar.
- Große Dateien (`Rooms.tsx`) nur per `grep -n` und Ausschnitt lesen.

### References

- [Source: concept/26-epics/epics/epic-16.md#Story 16.16]
- [Source: concept/25-ux/EXPERIENCE.md#Verzauberer (Werkbank), Änderungsliste]
- [Source: concept/25-ux/DESIGN.md#workbench-stage, rune-gem, person-bar, change-list]
- [Source: concept/21-gdd/gdd.md, Runen (Zeile 271), Verzauberer (Zeile 328)]
- [Source: art/mockups/ausruestung-2026-11/verzauberer.html (Variante A, #pA)]

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
