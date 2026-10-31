# 13 – V1-Umfang, Meilensteine, Abnahme

## 1. Ziel von V1

Ein **spielbarer Vertical Slice im Browser** (Handy hoch, Tablet, PC), der den Kernloop vollständig zeigt: Prolog + 5 Kapitel, alle Missionstypen, Kampf mit allen Regeln, Inventar mit Loot/Affixen/Runen/Skills, Lager, Permadeath, Scharmützel, Speichern. Finale Pixel-Grafik, Anime-Porträts, SFX, Musik und Teilvertonung über den parallelen Art-Track (`16-asset-pipeline.md` §12). Keine Monetarisierung, kein Backend.

## 2. In V1 enthalten (MUSS)

**Kampf**
- [ ] Phasen Spieler/Gegner/Dritte; Bewegen + Aktion; freie Aktionen Tauschen/Konvoi/Waffe wechseln
- [ ] Formeln laut `03-combat.md` aus `balance.yaml`, 2RN, Doppelangriff, Konter, Krit
- [ ] Waffendreieck, Effektivität, Elementkreis inkl. Licht/Dunkel, Affinität
- [ ] Status Brennen/Nass/Verlangsamt/Rückstoß; Geländeeffekte Brand/Löschen/Felswall/Nebel lichten
- [ ] Supports C/B/A (S nur Mechanik), Nachbarbonus, Tandem, Schutz, Gegner-Paare
- [ ] Tod-Modi Klassik/Standard/Casual, Niedergestreckt/Bergen/Narben; Schwierigkeit L/N/S
- [ ] Gelände laut `06` inkl. Türen, Truhen, Hebel, Ballisten, Dörfer, Beute; Nebel des Krieges
- [ ] Missionsziele: rout, boss, reach, seize, defend, survive, escape; Nebenziele; Verstärkungen; Trigger
- [ ] KI-Profile aggressive, hold, guard, trigger, hunt, raider, flee, support
- [ ] Kampfvorschau, Gefahrenzonen, Info-Sheets, Rücknahme der Bewegung, Befehl (Avatar), Sammelruf (Kael), Ansprechen/Rekrutieren
- [ ] EP, Level-up mit geglättetem Wachstum, Klassenaufstieg (6 Profiklassen + Siegel)

**Inventar & Items**
- [ ] Paperdoll + Beutel + Konvoi, Gewicht/Tragkraft/Überlast
- [ ] ~40 Items (siehe `data-samples/items.yaml`), Seltenheit, Affix-Generierung, 2 Sets, 2 Legendäre
- [ ] Runen I–III (6 Elemente) + 4 Hilfs-Runen; Verzauberer
- [ ] Item-Skills mit FP und Meisterung, Loadout
- [ ] Verbrauchsgüter mit Ladungen + Auffüllen

**Lager & Meta**
- [ ] Weltkarte (Knoten), Vorbereitung, Ergebnis-Bildschirm
- [ ] Händler, Schmied (Aufwerten, Neu würfeln, Tränke), Verzauberer, Taverne (3 Söldner/Kapitel, Traits), Heiler, Lagerfeuer (7 Support-Paare × C/B/A)
- [ ] Scharmützel (2 eigene Karten + Kapitelkarten, generierte Gegner) + Übungsplatz
- [ ] Avatar-Erstellung (Name, Pronomen, Porträt-Vorlage, Affinität)

**Content**
- [ ] Prolog + Kapitel 1–5 (Karten, Dialoge vor/nach, Kampfdialoge, Boss-Zitate) laut `archive/08-story-world.md`
- [ ] 8 Story-Charaktere, Gegnerklassen Ritter, Pegasusritter, Bandit, Jungdrache
- [ ] Alle Texte DE + EN

**Technik**
- [ ] Architektur laut `10-tech-architecture.md` (Kern ohne DOM/Babylon, Command/Event, Seed-RNG)
- [ ] Babylon-Renderer mit Zoom/Pan/Minikarte, Overlays, Tweens; HTML-UI responsiv (3 Breakpoints)
- [ ] Touch + Maus + Minimal-Tastatur
- [ ] Auto-Save nach jeder Aktion, 3 Slots, Export/Import, Save-Versionierung
- [ ] PWA offline-fähig
- [ ] Tools: `content:check`, Karten-Viewer, `sim`
- [ ] Tests: Vitest (≥ 90 % `src/core`), Playwright-Flows (4 Profile), CI
- [ ] Performance-Budget erfüllt (`10` §9)

## 3. Nicht in V1 (SOLL später)

Mahlzeiten/Training (V1.1), S-Rang-Gespräche, Kapitel 6–10 + Fraktionsrouten, weitere Klassen (Dieb, Wyvernreiter, zweite Profi-Zweige), Status Geblendet/Verflucht, Barrierefreiheit (Farbenblind-Modus, Schriftgröße, Linkshänder), Monetarisierung, Cloud-Save/Konto, Capacitor-Apps, Vollvertonung aller Dialoge, 3D-Ansicht des Bretts, separate Kampfszene, Optimieren-Knopf im Inventar.

## 4. Meilensteine

| # | Meilenstein | Ergebnis / Abnahme |
|---|---|---|
| M0 | Projekt-Setup | Vite + TS + Babylon + Preact, ESLint-Schichtenregeln, Vitest, Playwright, CI grün, PWA-Grundgerüst, leere Szene auf Handy im Hochformat |
| M1 | Content & Kern-Grundlagen | Zod-Schemas, Loader, `content:check`, Map-Parser; Seed-RNG; State-Modell; Pathfinding & Bewegung; `computeStats` inkl. Gewicht. Tests grün |
| M2 | Brett & Eingabe | Karte rendern, Kamera (Zoom/Pan), Einheit wählen, Bewegungsbereich, Geistervorschau, Bewegen, Rücknahme. Karten-Viewer (Dev) |
| M3 | Kampf | Angriff/Konter/Doppelt/Krit, Vorschau, Dreieck, Elemente, Status, Gelände-Effekte, Phasen, KI-Profile, Ziele/Trigger/Verstärkungen, Tod-Modi. Prolog spielbar (Platzhaltertexte). `sim` läuft |
| M4 | Inventar & Items | Paperdoll-UI, Tauschen, Konvoi, Beute, Affixe, Runen, Sets, Item-Skills/FP/Meisterung, Verbrauchsgüter |
| M5 | Fortschritt & Lager | EP/Level-up, Aufstieg, Supports/Tandem/Schutz, Lager-Hub mit allen V1-Bereichen, Weltkarte, Ergebnis-Screen, Taverne, Scharmützel, Speichern/Laden/Export |
| M6 | Content | Prolog + Kap. 1–5 Karten, Dialoge DE/EN, Supports, Balancing per `sim`, Nebenziele |
| M7 | Politur & Performance | Animationen, Feedback, Optionen, Performance-Budget, E2E-Flows komplett, Bugfixing |

**Art-Track (parallel):** A0 Pipeline-Beweis → A1 Prolog komplett → A2 UI-Kit → A3 Kap. 1–2 → A4 Kap. 3–5 → A5 Politur. Zuordnung zu M0–M7 und Inhalte: `16-asset-pipeline.md` §12. Audio-Umfang: `17-audio.md` §8.

## 5. Definition of Done (pro Feature)

- Regel im Kern implementiert, mit Vitest-Tests (inkl. Grenzfälle) – Formeln gegen die Tabellen in diesem Konzept.
- Werte aus `balance.yaml` / Content, keine Magic Numbers.
- UI funktioniert auf < 600 px, 600–1023 px, ≥ 1024 px; Touch und Maus.
- Texte als i18n-Schlüssel in DE und EN.
- Save/Load deckt neuen State ab (ggf. Migration).
- Abweichungen vom Konzept in `concept/01-decisions.md` dokumentiert.

## 6. Abnahmeszenarien V1 (Auszug)

1. **Neues Spiel → Prolog → Sieg** auf iPhone-13-Profil nur per Tap, ohne horizontales Scrollen der Seite.
2. **Permadeath Standard**: Einheit fällt → Bergen → Narbe sichtbar im Lager → Heiler entfernt Narbe gegen Gold.
3. **Permadeath Klassik**: Einheit fällt → tot, Ausrüstung im Konvoi, Gedenk-Zeile im Ergebnis.
4. **Inventar**: Stahlaxt anlegen → Überlast → Tempo und Doppelangriff in der Vorschau ändern sich korrekt.
5. **Runen**: Feuer-Rune III in Eisenschwert → Angriff auf Gegner im Wald → Brennen + Wald brennt → Brand breitet sich (Seed-reproduzierbar) aus.
6. **Skill-Meisterung**: Eisenschild bis 20 FP tragen → „Schildwall gemeistert“ → Schild ablegen, Skill im Loadout aktiv.
7. **Tandem**: Kael und Brenna mit Rang B benachbart → Angriff zeigt Tandem in der Vorschau und führt es aus.
8. **Unterbrechen**: Tab mitten in Gegnerphase schließen → Fortsetzen → exakt gleicher Zustand.
9. **Export/Import**: Spielstand am Handy exportieren → am PC importieren → identischer Stand.
10. **Determinismus**: Replay eines aufgezeichneten Kapitels ergibt identisches Endergebnis (CI-Test).
11. **Offline**: Nach erstem Laden im Flugmodus starten und Kapitel spielen.
