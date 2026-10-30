# Story 14.7: Lektionen und Kontext-„?“

Status: review

## Story

Als Spieler
möchte ich die Lektionen des Prologs später nachlesen und aus dem Kampf direkt zur passenden Regel springen,
damit ich nicht erst suchen muss.

## Acceptance Criteria

**Angenommen** die Kategorie Lektionen
**Wenn** der Spieler sie öffnet
**Dann** stehen dort die Lektionen des Prologs (Bewegung, Gefahr, Heilen und alle weiteren Lektionen) als Text aus denselben Szenen-Schlüsseln, nicht als Kopie.

**Angenommen** Kampfvorschau, Gelände-Chip, Zustands-Symbole und Lektionen im Kampf
**Wenn** dort ein Kontext-„?“ steht (DESIGN.md `help-stone`) und der Spieler es antippt
**Dann** öffnet der Eintrag mit dem passenden Kontext-Anker als Blatt über dem Kampf; Schließen kehrt ohne Zustandsverlust zurück
**Und** jedes „?“ hat eine Tippfläche von mindestens 44 pt und verdeckt keine Zahl.

## Tasks / Subtasks

- [x] T1 Kategorie Lektionen: Bewegung, Gefahr, Heiltrank (Prolog) und Waffendreieck (1-1); die Zeilen kommen aus den Szenen-Schlüsseln (`dlg.<szene>.<zeile>`), nicht als Kopie
- [x] T2 `HelpStone` (DESIGN.md `help-stone`, Creme-Stein mit dunkler Kontur, 22 px, 44 pt Tippfläche) an Kampfvorschau (unter „vs“), Gelände-Chip am Zielfeld und Gelände-Stein, Zustands-Chips in der Einheiten-Info und an Lektionen im Sprechband bzw. Dialog
- [x] T3 Ein Tipp öffnet den Eintrag des Ankers als Blatt über dem Kampf; Zurück schließt es, der Dialog läuft nicht weiter

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 14, Verhalten `concept/25-ux/EXPERIENCE.md` („Handbuch“, Kontext-„?“), Aussehen `concept/25-ux/DESIGN.md` (Handbuch-Kategorie, Handbuch-Eintrag, `help-stone`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §8.3 und Decision-Log 2026-10-30.
- Inhalt: `content/core/handbook.yaml`, Texte `content/core/locales/de.handbook.yaml` und `en.handbook.yaml`; Werte sind Pfade in die Content-Daten, Texte setzen sie als `{id}` ein.
- Kein neues Speicherformat: Entdecken (NEU-Marken, Fortschritt) und Bestiarium sind nicht Teil des Epics.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 14 auf dem Branch `claude/elegant-wozniak-3p2ee2`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Titel → Handbuch und Prolog-Kampf, ohne LFS-Grafik).
- Offen zur Abnahme: Texte DE + EN durch den Produktinhaber.
