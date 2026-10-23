# Entscheidungslog – Epics und Stories Staffel 1

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-10-23 | Epics und Stories gestartet (`gds-create-epics-and-stories`), nach Architektur (`24`) und UX (`25`); Ablage `concept/26-epics/` (ursprünglich als `25-epics` gewählt, durch die eingeschobene UX-Etappe verschoben); löst die Grobfassung `concept/21-gdd/epics.md` ab | Etappe 5 des BMAD-Pfads |
| 2026-10-23 | Tiefe: MVP (alles bis zum Akt-1-Release) mit vollen Akzeptanzkriterien; Burg, Akt 2 und Akt 3 als Story-Liste mit Kurz-Kriterien, vor dem jeweiligen Akt zu verfeinern | Produktinhaber, Empfehlung bestätigt; spätere Details ändern sich nach dem MVP-Playtest |
| 2026-10-23 | Content-Epics: eine Story je Mission bzw. Nebenquest (Karte, Szenen, Leutnant, Heimsuchungs-Anker, Sim-Korridor) | Produktinhaber, Empfehlung bestätigt |
| 2026-10-23 | Erst UX-Etappe, dann Epics | Produktinhaber |
| 2026-10-23 | **12 Epics nach Spielerwert**, Fundament-Bausteine im ersten Epic, das sie braucht; E0 aus der Architektur entfällt | Produktinhaber, Empfehlung bestätigt; BMAD „keine große Vorleistung“, früh spielbar |
| 2026-10-23 | Profi-Wege und Fallensteller/Schatten wandern nach Epic 10 (Burg), weil Aufstieg erst ab Akt 2 möglich ist (Stufendeckel 10, Akademie ab Akt 2) | Assistent [C], folgt aus dem GDD |
| 2026-10-23 | Content-Layout `content/core/` + `content/acts/actN/` entsteht in Epic 4 (erste Story), weil Akt-Daten dort zuerst gebraucht werden; Epic 7 baut darauf die Pakete | Assistent [C] |
| 2026-10-23 | Epics 1–4 mit 31 Stories freigegeben; HTML-Ansicht in `concept/26-epics/html/epics-1-4.html` (erzeugt mit `tools/docs/epics_html.py`) | Produktinhaber |
| 2026-10-23 | Epics 5–9 mit 38 Stories freigegeben; HTML in `concept/26-epics/html/epics-5-9.html` | Produktinhaber |
| 2026-10-23 | Epics 10–12 (grob, 30 Stories) freigegeben; Validierung (FR- und UX-Abdeckung, Abhängigkeiten) im Dokument; `status: final`. Gesamtansicht `html/epics.html`; Verweise in `concept/README.md`, `AGENTS.md`, `21-gdd/epics.md`. Nächster Schritt: `gds-check-implementation-readiness`, dann `gds-sprint-planning` | Abschluss Etappe 5 |
| 2026-10-23 | Story 8.2 an den Stand von `main` angeglichen (PR #18: Teamtuch, Hand-Waffe, `pnpm art:tripo` vorhanden); offen bleiben Waffengruppen-Bibliothek, Animationsübertragung, Einbindung in die Pakete | Merge von `main` |
| 2026-10-23 | **Course Correction 8/8/8** (`concept/sprint-change-proposal-2026-10-23.md`, freigegeben): FR26, FR33, FR44, FR49, FR50, FR55, FR60–FR62 und NFR16 angepasst; neue Story 6.9 „Die Paktwacht als Heimat“ (aus 10.1 und dem Gedenkstein-Teil von 10.7, jetzt im MVP); Epic 9 mit 1-5 als survive, 1-6 Eroberung, neuen Stories 9.8 (1-7), 9.9 (Finale 1-8) und 9.12 (N3), Nummern bis 9.14; Epic 10 heißt „Die Burg ausbauen“, 10.1 entfällt, Nummern rücken auf (10.1–10.7); Epic 11 mit 11.8 (2-7, E8) und 11.11 (N6), Nummern bis 11.13; Epic 12 mit 12.5 (3-4, E11) und 12.8 (3-7), Pell in 3-1, Nummern bis 12.13. 106 Stories. HTML neu erzeugt | Produktinhaber |
