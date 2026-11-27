# Story 16.19: Handbuch, Leistung und Abnahme

Status: review

## Story

Als Spieler
möchte ich die neuen Regeln im Handbuch finden und alles flüssig auf dem Handy erleben,
damit das Epic vor dem Release rund ist.

## Acceptance Criteria

1. **Handbuch:** Einträge zu Straße ½ (16.1), Schild-Runen (16.4), Waffen-Chronik mit Kill-Zähler und Beinamen (16.5), Gelände-Linse (16.11) und Element-Band (16.12); alle Zahlen kommen über `ref:` aus den Daten (`content/core/terrain.yaml`, `balance.element.shieldRune`, `balance.weaponChronicle`, `balance.element.*`), Texte in `de.handbook.yaml` und `en.handbook.yaml`.
2. **Kontext-„?“:** an der Gelände-Linse (neu), an der Feldkarte (`TileCard`, vorhanden) und am Element-Band (`ElementBand`, vorhanden) öffnet es den passenden Eintrag; der Test „finds the entry of every '?' the battle shows“ deckt die Linse ab.
3. **Messung:** Paket-Budget (`check-bundle-size.mjs`), Ladezeit der 3D-Ansichten (Figurenblatt, Waffenansicht, Waffenkammer) und Bildrate (inkl. Kampfhaltung bei Auswahl, 16.10 AK 5) sind gemessen; Desktop-Ersatz nach NFR1 (`pnpm perf`), das Referenzgerät misst der Produktinhaber.
4. **Nachträge aus dem Review 2026-11-27:** Lanzen- und Stabende berühren in der Ruhe den Boden (Griffpunkt tiefer); Miras Bogen liegt nicht hinter dem Bein; Blaupausen und `<gruppe>_v2_preview.png` für Bogen, Dolch, Stab, Buch, Laute und Fokus liegen in `art/mockups/weapons-2026-11/`.
5. **Abnahme:** Der Produktinhaber hat Akt 1 auf dem Handy mit allen Neuerungen durchgespielt; Auffälligkeiten sind behoben oder als eigene Story eingetragen; danach ist 9.14 frei.

## Tasks / Subtasks

- [x] T1 Handbuch-Einträge `road`, `shieldRunes`, `weaponChronicle`, `terrainLens`, Ausbau `elements` um das Band (AK 1)
- [x] T2 `HelpStone` in `TerrainLens.tsx` mit eigenem Anker, Test-Abdeckung (AK 2)
- [x] T3 Griffpunkt Lanze/Stab, Miras Bogen (AK 4)
- [x] T4 Vorschauen der übrigen Waffengruppen (AK 4); Blaupausen entfallen per Entscheidung Produktinhaber 2026-11-27, nur Blender-Vorschauen
- [x] T5 Messungen und Tabelle unten (AK 3); Referenzgerät offen beim Produktinhaber
- [ ] T6 Handy-Durchlauf durch den Produktinhaber (AK 5)

## Dev Notes

### Quellen

- Epic: `concept/26-epics/epics/epic-16.md` (Story 16.19 mit Nachträgen vom 2026-11-27).
- Handbuch: `content/core/handbook.yaml` (Kopfkommentar Z. 1–11: `ref:`-Pfade, `{id}`-Platzhalter, keine Ziffern in Texten, `anchor`), Muster `elements` (Z. ~100), `runes` (Z. ~420); Helfer `src/core/handbook.ts`; Prüfung `src/content/validateHandbook.ts`; Tests `tests/unit/handbook.test.ts`.
- „?“: `src/app/screens/HelpStone.tsx`, `src/app/state/handbook.ts`; Aufrufer z. B. `TileCard.tsx:63`, `ElementBand.tsx:78`.
- Werte: `content/core/terrain.yaml` (road, bridge, boardwalk, footbridge, rope_bridge = 0,5), `balance.yaml` `element.*`, `element.shieldRune`, `weaponChronicle`.
- Messung: `tools/check-bundle-size.mjs`, `tests/perf/perf.spec.ts` (PERF_*), frühere Tabellen in `15-11-*.md` und `11-26-*.md`; NFR1/NFR2 in `concept/26-epics/epics/requirements.md`.
- Stand `pnpm check` am 2026-11-27: erster Download 14,43 MB (Budget 30, Ziel 12 → Warnung), Paket act1 39,25 von 40 MB.

## Dev Agent Record

### Completion Notes List

- **Review-Fixes 2026-11-27:** Handbuch-Texte korrigiert (Gegner-Schild-Runen-Satz entfernt, Waffen-Chronik: nur Kompanie-Waffen, Leutnant-Name nur ohne Beinamen, Beiname bleibt; „Schaden durch das Element“; EN „tier“/US-Schreibweise; „nie anfälliger“, „unter dem Band“). Neues Handbuch-Format `cost` (über `costLabel`, „½“) für Straße und Brücke und die Gelände-Kostentabelle, Test in `handbook.test.ts`. Perf: Deckel der Waffenansicht 60 statt 30, Kommentar angepasst; Wiederholungsmessung siehe unter der Messtabelle.

- T3 (2026-11-27): Befund bestätigt. Gemessen mit `stance_shots.py` (neue Ausgabe `floor ...: lowest weapon point z`, Füße bei 0): Lanzenende in Ruhe z = 0,056, Stabende 0,037 über dem Boden. Hebel ist der Griffursprung im Waffenmodell: `GRIP_SHIFT` in `blender_weapon_lance.py` (0,059) und `blender_weapon_staff.py` (0,040) verschiebt die Geometrie samt Fassungs-Nodes um dieses Maß entlang des Schafts zum Ende hin (Ursprung liegt damit näher am Kopf); danach Lanzenende z = -0,003, Stabende -0,003 (berührt, 3 mm Bodenkontakt). Kein Figuren-Rebake nötig (Posen unverändert, die Waffe hängt am `grip_r`-Sockel). In der Kampfhaltung sitzt die Waffe um den Betrag weiter vorn in der Hand (Schaftmitte statt Schaftansatz), Sicht geprüft, wirkt unauffällig. Neu gebaut: `lance.glb`, `staff.glb`, Signatur-Lanzen `sig/wolf_fang|rowenas_lance|heirloom.glb` (erben das Lanzen-Skript; keine Signatur-Stäbe vorhanden), danach `weapon_grip_nodes.py`. Miras Bogen: `POSE["bow"]["rest"]["l"]` jetzt `hand((1.40, 0.12, -0.84), (0,0,1), (0.6,-0.8,0), W_BOW)` (Sehne senkrecht, Bauch nach außen/hinten, die Sehnenseite liegt vor dem Oberschenkel; vorher Bauch nach vorn, Bogen verschwand hinter dem Bein). Gilt für alle Bogenträger; neu gebacken (Clips + VAT + Pack): mira, mercenary, bandit_archer, fenn, ilka, nell, morra, brakka, temple_guard. Bogenende in Ruhe z = 0,038 (Bogen darf schweben, ist kürzer als der Arm reicht). [ASSUMPTION] Bodenkontakt 3 mm statt exakt 0, damit nichts schwebt; Bogen-Ruhehaltung nach Augenmaß aus vier Ansichten (Vorher/Nachher-Bilder in der Session, `stance-16-19/`). Die T4-Vorschau `staff_v2_preview.png` bleibt gültig (Form unverändert, nur der Ursprung wanderte).
- T1: neue Einträge `road_half` (Gelände, Werte `terrain.road.cost.foot`/`terrain.bridge.cost.foot`; verlinkt aus `movement` und `terrain_open`, damit „eine Seite je Gelände“ bleibt), `terrain_lens` (Anker `terrainLens`), `weapon_chronicle` (Waffen, `balance.weaponChronicle.epithetKills`), `shield_runes` (Items, ab Akt 2, `balance.element.shieldRune.*`); Eintrag `elements` um das Element-Band und die Schild-Rune erweitert (Text und Fundort DE/EN). Kein Resolver-Umbau: `terrain.<id>.cost.foot` löst schon auf.
- T2: `HelpStone anchor="terrainLens"` am Ende der `LensLegend`; Test „finds the entry of every ?“ prüft `terrainLens` und `elements`; neuer Test für die Werte von Straße, Schild-Runen und Chronik.
- [ASSUMPTION] Straße ½ hat keinen eigenen „?“-Anker: das „?“ der Feldkarte öffnet `terrain_open`, das auf `road_half` verweist.
- `pnpm content:check`, `vitest tests/unit/handbook.test.ts`, `pnpm lint` grün (nur Altwarnungen in fremden Tests).
- T5 (2026-11-27): neuer Messlauf `PERF_VIEWS=1` in `tests/perf/perf.spec.ts` (Opt-in, CI-Lauf von `pnpm perf` unverändert: der Test ist ohne die Variable übersprungen, die beiden anderen Tests bei gesetzter Variable). Messfunktionen `view` (Puppe, Waffenansicht, Waffenkammer) und `stance` (Brett ohne/mit wechselnder Wahl) in `tests/perf/bench.ts`; Auswertung mit `frameStats`/`median` aus `report.ts`; `report-summary.ts` überspringt die neuen `views-*.json`. Befehl und Ergebnis siehe „Messung 2026-11-27“ unten. Es wurde kein Code getunt.

### Messung 2026-11-27

Desktop-Ersatz nach NFR1/NFR2, **nicht** das Referenzgerät. Rechner: Intel UHD Graphics 630 (ANGLE/D3D11), Chromium über Playwright, Profil `pixel6a` (412 × 915, DPR 2,625), `PERF_GPU=1` (wie die Messungen 11.26 und 15.11; ohne GPU rendert SwiftShader und die Waffenkammer fiel auf 8 FPS, das ist kein Handy-Ersatz), Qualität `mid`, je Zeile Median aus 3 Läufen, „max“ über alle Läufe. Befehl: `PERF_GPU=1 PERF_VIEWS=1 PERF_STAGES=1,2,4 PERF_RUNS=3 pnpm perf --project=pixel6a`. Gemessen werden gezeichnete Bilder (Abstand zweier Zeichnungen); Ruhebilder laufen mit `board.fpsIdle` = 30, bewegte Ansichten mit 60. Ziel je Stufe nach NFR1 (60 bei 2×, 30 bei 4×), gedeckelt auf die Bildrate der Ansicht; 1× ohne Ziel. Grenze: kein Seitenbild über 100 ms. „Laden“ = Konstruktor bis Modell auf der Bühne plus zwei Bilder. Auswahl im Brett = die Figuren des Bretts (12 eigene) wechseln alle 0,7 s als gewählte Figur (Glow-Menge der Overlays, die die Kampfhaltung 16.10 auslöst; ohne Reichweitenfelder und Vorschau).

| Szenario | Drossel | Laden ms | Ø FPS | Ziel FPS | p95 ms | max ms (Seitenbild) | Render ms/Bild | Draw Calls | Urteil |
|---|---|---|---|---|---|---|---|---|---|
| Figurenblatt (Puppe) | 1× | 703 | 30 | – | 34,7 | 48,6 (17) | 0,3 | 3 | – |
| Waffenansicht | 1× | 321 | 60 | – | 18,0 | 32,7 (17) | 0,2 | 2 | – |
| Waffenkammer (alle Relikte und Signaturstücke) | 1× | 1 085 | 60 | – | 18,1 | 32,0 (17) | 1,5 | 118 | – |
| Brett, nichts gewählt | 1× | – | 29,9 | – | 34,9 | 51,5 (17) | 1,9 | 77 | – |
| Brett, Wahl wechselt | 1× | – | 55,7 | – | 33,2 | 50,2 (33) | 2,6 | 77 | – |
| Figurenblatt (Puppe) | 2× | 916 | 30 | 30 | 34,9 | 48,8 (17) | 1,5 | 3 | ok |
| Waffenansicht | 2× | 381 | 60 | 30 | 18,1 | 18,7 (17) | 0,9 | 2 | ok |
| Waffenkammer | 2× | 1 223 | 59,6 | 60 | 19,2 | 33,9 (17) | 5,4 | 118 | ok |
| Brett, nichts gewählt | 2× | – | 29,8 | 30 | 36,6 | 73,8 (67) | 7,8 | 77 | ok |
| Brett, Wahl wechselt | 2× | – | 55,3 | 60 | 32,4 | 55,6 (50) | 8,0 | 77 | **knapp unter Ziel** (92 %) |
| Figurenblatt (Puppe) | 4× | 1 369 | 29,1 | 30 | 43,0 | 54,1 (33) | 5,1 | 3 | ok |
| Waffenansicht | 4× | 599 | 55,4 | 30 | 30,7 | 36,3 (17) | 3,5 | 2 | ok |
| Waffenkammer | 4× | 2 424 | 47,3 | 30 | 35,6 | 86,4 (67) | 17,7 | 118 | ok |
| Brett, nichts gewählt | 4× | – | 27,1 | 30 | 47,6 | **137,4 (133)** | 27,4 | 77 | **über** (Ø FPS 90 %, ein Bild über 100 ms) |
| Brett, Wahl wechselt | 4× | – | 32,3 | 30 | 42,2 | 60,4 (67) | 24,5 | 77 | ok |

Vergleich Standardmessung (`PERF_GPU=1 PERF_RUNS=3 pnpm perf --project=pixel6a`, Gegnerphase der Referenzschlacht mit 40 Figuren, gleicher Rechner):

| Szenario | Drossel | Ø FPS | Ziel | p95 ms | max ms | Draw Calls | Urteil |
|---|---|---|---|---|---|---|---|
| Gegnerphase 24×32 | 2× | 60 | 60 | 16,7 | 33,4 (alle Läufe 66,7) | 69 | ok |
| Gegnerphase 24×32 | 4× | 36,4 | 30 | 50 | 100 (alle Läufe **116,6**) | 68 | Ø FPS ok, ein Bild über 100 ms (schon vorher so: Baseline 216,6) |
| Kaltstart (installierte App bis Titel, 4×) | – | – | < 5 s | – | 3 191 ms | – | ok |
| Erstbesuch bis Titel (4×) | – | – | – | – | 8 064 ms | – | ohne Budget |

Pakete (`pnpm build`, `check-bundle-size.mjs`): erster Download **14,43 MB** (Budget 30, Ziel 12 → Warnung „über dem Ziel“, unverändert zum Stand `pnpm check`); Paket act1 **39,25 MB** von 40 (554 Dateien); Paket act2 **2,41 MB** von 40; Figurenmodelle 45 geprüft, 0 über Budget (7 000 Dreiecke, 512², 0,5 MB gz); Berufspfad-Teile 16 geprüft, 0 über Budget; Waffenmodelle v2 1,23 MB (14 Dateien, nur bei Bedarf geladen, zählen nicht zum ersten Download).

Deutung:

- Die drei neuen Ansichten liegen mit GPU bis 4× im Budget: Puppe und Waffenansicht kosten 3 bzw. 2 Draw Calls und 0,2–5 ms je Bild; die Ladezeiten 0,3–0,9 s bei 1×/2× und 0,6–1,4 s bei 4× sind klein gegen den Kaltstart. Die Waffenkammer ist mit 118 Draw Calls bei vollem Tresor (jedes Relikt und Signaturstück im Besitz, Worst Case) die teuerste: 17,7 ms je Bild bei 4×, aber 47 FPS und kein Bild über 87 ms; Laden 1,1–2,4 s.
- Die Kampfhaltung bei Auswahl hebt das Brett vom Ruhetakt (30 FPS) auf den aktiven Takt (55–56 statt 30 FPS, Renderzeit je Bild gleich), also etwa doppelte Arbeit je Sekunde, solange eine Figur ihre Haltung wechselt. Bei 2× fehlen dem 60-FPS-Ziel 5 FPS (55,3, kein Bild über 56 ms); bei 4× reicht es (32,3 FPS, schlechtester Wert 60 ms). Auffällig ist stattdessen die Ruhe-Zeile bei 4×: ein Bild von 137 ms in einem der 3 Läufe (Seitenbild 133 ms, Renderzeit 27 ms je Bild, das ist die Streuung des Rechners wie bei den schon bekannten Ausreißern der Gegnerphase), nicht die Haltung selbst.
- **Wiederholung 2026-11-27** (gleicher Rechner, `PERF_GPU=1 PERF_VIEWS=1 PERF_STAGES=2,4 PERF_RUNS=3 pnpm perf --project=pixel6a`, Test nicht auf die Brett-Zeilen einschränkbar, daher ganz gelaufen; die Stufe 1× entfiel):

  | Szenario | Drossel | Ø FPS | Ziel | p95 ms | max ms (Seitenbild) | Render ms/Bild |
  |---|---|---|---|---|---|---|
  | Brett, nichts gewählt | 2× | 29,9 | 30 | 37,4 | 69,2 (67) | 9,1 |
  | Brett, Wahl wechselt | 2× | 54,9 | 60 | 32,6 | 62,2 (33) | 9,6 |
  | Brett, nichts gewählt | 4× | 26,9 | 30 | 49,5 | **129,6 (133)** | 28,1 |
  | Brett, Wahl wechselt | 4× | **24,1** | 30 | 53,0 | **151,1 (117)** | 33,4 |
  | Waffenansicht (Deckel jetzt 60) | 4× | 58,4 | 60 | 20,8 | 36,8 (17) | 2,9 |

  Die Haltung bei 2× reproduziert sich: 54,9 FPS (92 % von 60), kein Bild über 62 ms. Der Ruhe-Ausreißer bei 4× reproduziert sich ebenfalls (129,6 ms, Seitenbild 133 ms; zuvor 137,4 ms), ist also kein einmaliges Rauschen. Zusätzlich fiel diesmal die Haltung bei 4× unter das Ziel (24,1 statt 32,3 FPS, ein Bild 151 ms); das Brett kostet bei 4× 28–33 ms je Bild und hat damit wenig Spielraum, die Werte streuen von Lauf zu Lauf stark. Bei 4× sind beide Brett-Zeilen demnach nicht verlässlich im Budget; Referenzgerät entscheidet. Nichts getunt.
- Nichts davon wurde getunt; Messwerte nur berichtet. Unter SwiftShader (ohne `PERF_GPU=1`) sind die Werte nicht verwertbar (Waffenkammer 8 FPS, Bild bis 150 ms).
- **Offen für den Produktinhaber:** Messung auf dem Referenzgerät (Pixel 6a / iPhone 12): Ladezeit von Figurenblatt, Waffenansicht und Waffenkammer, Bildrate der Waffenkammer und im Kampf beim Wechsel der gewählten Figur; Befehle wie oben, auf dem Gerät per `pnpm perf` mit `PERF_STRICT=1` bzw. von Hand (Architektur §10, Story 9.14).


### File List

- Review-Fixes 2026-11-27: `src/core/renderDefs.ts` (Format `cost`), `src/core/handbook.ts`, `src/app/screens/Handbook.tsx` (Kostentabelle über `costLabel`), `tests/perf/perf.spec.ts`, `src/app/screens/TerrainLens.css` (Kommentar)
- `content/core/handbook.yaml`, `content/core/locales/de.handbook.yaml`, `content/core/locales/en.handbook.yaml`
- `src/app/screens/TerrainLens.tsx`, `src/app/screens/TerrainLens.css`
- `tests/unit/handbook.test.ts`
- T5: `tests/perf/bench.ts` (`view`, `stance`), `tests/perf/perf.spec.ts` (Test `PERF_VIEWS=1`), `tests/perf/report-summary.ts`
- `art/mockups/weapons-2026-11/{bow,dagger,staff,book,lute,focus}_v2_preview.png` (T4), `tools/art/blender_weapons_v2_sheet.py` (neue Option `--set=iso`), `art/prompts/weapon_rune_concept.md` (Abschnitt ISO-Vorschauen)

### Abschluss T4

ISO-Vorschauen je Gruppe (Feuerstein Stufe I/II/III, Gesamtansicht und Fassungs-Nahaufnahme, Buch auch aufgeschlagen) aus den v2-GLBs gerendert, Befehl in `art/prompts/weapon_rune_concept.md`. Runen und Stufen sind lesbar. Stab zuletzt gerendert; baut ein anderer Agent `staff.glb` danach neu, Vorschau wiederholen.
- T3: `tools/art/blender_weapon_lance.py`, `tools/art/blender_weapon_staff.py`, `tools/art/stance_poses.py` (Bogen-Ruhe, Kommentar), `tools/art/stance_shots.py` (Bodenmaß, Ansichten `face`/`left`), `art/models/weapons-v2/{lance,staff}.glb`, `art/models/weapons-v2/sig/{wolf_fang,rowenas_lance,heirloom}.glb`, `art/models/units/{mira,mercenary,bandit_archer,fenn,ilka,nell,morra,brakka,temple_guard}.{glb,vat}`
