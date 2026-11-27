# Story 16.19: Handbuch, Leistung und Abnahme

Status: in-progress

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
- [ ] T5 Messungen und Tabelle unten (AK 3)
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

- T3 (2026-11-27): Befund bestätigt. Gemessen mit `stance_shots.py` (neue Ausgabe `floor ...: lowest weapon point z`, Füße bei 0): Lanzenende in Ruhe z = 0,056, Stabende 0,037 über dem Boden. Hebel ist der Griffursprung im Waffenmodell: `GRIP_SHIFT` in `blender_weapon_lance.py` (0,059) und `blender_weapon_staff.py` (0,040) verschiebt die Geometrie samt Fassungs-Nodes um dieses Maß entlang des Schafts zum Ende hin (Ursprung liegt damit näher am Kopf); danach Lanzenende z = -0,003, Stabende -0,003 (berührt, 3 mm Bodenkontakt). Kein Figuren-Rebake nötig (Posen unverändert, die Waffe hängt am `grip_r`-Sockel). In der Kampfhaltung sitzt die Waffe um den Betrag weiter vorn in der Hand (Schaftmitte statt Schaftansatz), Sicht geprüft, wirkt unauffällig. Neu gebaut: `lance.glb`, `staff.glb`, Signatur-Lanzen `sig/wolf_fang|rowenas_lance|heirloom.glb` (erben das Lanzen-Skript; keine Signatur-Stäbe vorhanden), danach `weapon_grip_nodes.py`. Miras Bogen: `POSE["bow"]["rest"]["l"]` jetzt `hand((1.40, 0.12, -0.84), (0,0,1), (0.6,-0.8,0), W_BOW)` (Sehne senkrecht, Bauch nach außen/hinten, die Sehnenseite liegt vor dem Oberschenkel; vorher Bauch nach vorn, Bogen verschwand hinter dem Bein). Gilt für alle Bogenträger; neu gebacken (Clips + VAT + Pack): mira, mercenary, bandit_archer, fenn, ilka, nell, morra, brakka, temple_guard. Bogenende in Ruhe z = 0,038 (Bogen darf schweben, ist kürzer als der Arm reicht). [ASSUMPTION] Bodenkontakt 3 mm statt exakt 0, damit nichts schwebt; Bogen-Ruhehaltung nach Augenmaß aus vier Ansichten (Vorher/Nachher-Bilder in der Session, `stance-16-19/`). Die T4-Vorschau `staff_v2_preview.png` bleibt gültig (Form unverändert, nur der Ursprung wanderte).
- T1: neue Einträge `road_half` (Gelände, Werte `terrain.road.cost.foot`/`terrain.bridge.cost.foot`; verlinkt aus `movement` und `terrain_open`, damit „eine Seite je Gelände“ bleibt), `terrain_lens` (Anker `terrainLens`), `weapon_chronicle` (Waffen, `balance.weaponChronicle.epithetKills`), `shield_runes` (Items, ab Akt 2, `balance.element.shieldRune.*`); Eintrag `elements` um das Element-Band und die Schild-Rune erweitert (Text und Fundort DE/EN). Kein Resolver-Umbau: `terrain.<id>.cost.foot` löst schon auf.
- T2: `HelpStone anchor="terrainLens"` am Ende der `LensLegend`; Test „finds the entry of every ?“ prüft `terrainLens` und `elements`; neuer Test für die Werte von Straße, Schild-Runen und Chronik.
- [ASSUMPTION] Straße ½ hat keinen eigenen „?“-Anker: das „?“ der Feldkarte öffnet `terrain_open`, das auf `road_half` verweist.
- `pnpm content:check`, `vitest tests/unit/handbook.test.ts`, `pnpm lint` grün (nur Altwarnungen in fremden Tests).

### File List

- `content/core/handbook.yaml`, `content/core/locales/de.handbook.yaml`, `content/core/locales/en.handbook.yaml`
- `src/app/screens/TerrainLens.tsx`, `src/app/screens/TerrainLens.css`
- `tests/unit/handbook.test.ts`
- `art/mockups/weapons-2026-11/{bow,dagger,staff,book,lute,focus}_v2_preview.png` (T4), `tools/art/blender_weapons_v2_sheet.py` (neue Option `--set=iso`), `art/prompts/weapon_rune_concept.md` (Abschnitt ISO-Vorschauen)

### Abschluss T4

ISO-Vorschauen je Gruppe (Feuerstein Stufe I/II/III, Gesamtansicht und Fassungs-Nahaufnahme, Buch auch aufgeschlagen) aus den v2-GLBs gerendert, Befehl in `art/prompts/weapon_rune_concept.md`. Runen und Stufen sind lesbar. Stab zuletzt gerendert; baut ein anderer Agent `staff.glb` danach neu, Vorschau wiederholen.
- T3: `tools/art/blender_weapon_lance.py`, `tools/art/blender_weapon_staff.py`, `tools/art/stance_poses.py` (Bogen-Ruhe, Kommentar), `tools/art/stance_shots.py` (Bodenmaß, Ansichten `face`/`left`), `art/models/weapons-v2/{lance,staff}.glb`, `art/models/weapons-v2/sig/{wolf_fang,rowenas_lance,heirloom}.glb`, `art/models/units/{mira,mercenary,bandit_archer,fenn,ilka,nell,morra,brakka,temple_guard}.{glb,vat}`
