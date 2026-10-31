# Story 14.6: Einträge Heimat und Items

Status: done

## Story

Als Spieler
möchte ich nachlesen, wie Räume, Ausbau, Items, Seltenheit, Runen, Sets und Last funktionieren,
damit ich Gold und Material sinnvoll einsetze.

## Acceptance Criteria

**Angenommen** die Kategorien Heimat und Items
**Wenn** der Spieler sie öffnet
**Dann** gibt es Einträge zu Lager und Burg, Räumen und Ausbau (`rooms.yaml`), Glutfunke, Seltenheit (Rauten), Aufwerten, Runen, Sets, Gewicht und Last mit Werten aus den Content-Dateien
**Und** Inhalte, die erst mit Epic 10 kommen, sind als „ab Akt 2“ gekennzeichnet; Texte DE + EN abgenommen.

## Tasks / Subtasks

- [x] T1 Heimat: Lager und Burg, Räume, Ausbau der Burg (ab Akt 2), Händler und Konvoi, Glutfunke und Aufstieg (ab Akt 2)
- [x] T2 Items: Seltenheit (Tabelle aus `balance.economy.rarityAffixes`/`rarityRuneSlots`), Aufwerten, Runen (ab Akt 2), Sets, Gewicht und Last
- [x] T3 `fromAct` zeigt „ab Akt n“ in Liste und Titelpille; Texte DE + EN

## Dev Notes

- Quelle: `concept/26-epics/epics.md` Epic 14, Verhalten `concept/25-ux/EXPERIENCE.md` („Handbuch“, Kontext-„?“), Aussehen `concept/25-ux/DESIGN.md` (Handbuch-Kategorie, Handbuch-Eintrag, `help-stone`), Mockup `concept/25-ux/mockups/10-lesbarkeit-handbuch.html`, Architektur §8.3 und Decision-Log 2026-10-30.
- Inhalt: `content/core/handbook.yaml`, Texte `content/core/locales/de.handbook.yaml` und `en.handbook.yaml`; Werte sind Pfade in die Content-Daten, Texte setzen sie als `{id}` ein.
- Kein neues Speicherformat: Entdecken (NEU-Marken, Fortschritt) und Bestiarium sind nicht Teil des Epics.

## Dev Agent Record

- Umgesetzt zusammen mit allen Stories von Epic 14 auf dem Branch `claude/elegant-wozniak-3p2ee2`.
- Prüfungen: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Sichtprüfung per Screenshots (iPhone-13-Profil, Titel → Handbuch und Prolog-Kampf, ohne LFS-Grafik).
- Offen zur Abnahme: Texte DE + EN durch den Produktinhaber.

## Abnahme (2026-10-31)

Abgenommen im Spiel (Titel, Kampfmenü, Kontext-„?“ an Lektion und Kampfvorschau) und gegen den Code geprüft; Texte DE + EN vom Produktinhaber abgenommen. Bei der Abnahme behoben: Kontext-„?“ auch an den Zustands-Chips von Einheitenkarte und Kampfvorschau, „?“ der Kampfvorschau unter die Tabelle (verdeckte den Waffennamen), Abstand des „?“ zu Zahlen, Ziffern-Prüfung auf alle `handbook.*`-Texte ausgeweitet, Kulissenhaus heißt „Gebäude“, Profi-Klassen tragen „ab Akt 2“. Wunsch für später: Einträge mit Ausschnitten wichtiger UI-Elemente bzw. Beispiel-Assets bebildern. Status: done.
