---
baseline_commit: 6d88ee6
---
# Story 11.3: Paket `act2`, Weltkarte und Titeltafel

Status: review

## Story

Als Spieler
möchte ich beim Übergang eine Titeltafel sehen und die Eisenmark aus dem Nebel treten sehen,
damit der neue Akt als Ereignis beginnt.

Zusammen mit 11.1 der erste Live-Schritt von Akt 2 (F1). Setzt auf 11.1 (`c.act`, `enterNextAct`, `releasedActs`) und 11.2 (`nodeLevel`, `positionLevel`; PR #168 offen).

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-11.md` § Story 11.3 (BDD dort vollständig); Architektur §5.4 („Akt 2 stückweise live“), §5.12 (Weltkarte), §5.14 (Pakete); UX `EXPERIENCE.md` State Patterns, Zeile Weltkarte.

1. **Paket:** `act2` in `content/packs.yaml` mit `load: background`, `act: 2`, `budgetMb: 40` `[ASSUMPTION]`, `content: [acts/act2/**, locales/*/act2.*]`; die Bilder von Akt 2 (Ortsbilder `locations/<id>.webp` aus `ACT2_LOCATIONS`, Stadtbild-Variante Brandhang) stehen als Globs in `act2`, und `act2` steht vor `act1`, damit `act1`s `world/**` sie nicht greift. `act1` nennt seine Ortsbilder einzeln statt `locations/**`. Modelle von Akt 2 gibt es noch nicht (11.24/11.25).
2. **Nicht veröffentlicht:** 9.14 ist nicht auf `main`, also bleibt `act2` `released: false`; kein `content:lock`, `released-ids.json` bleibt unberührt. Entwickler laden das Paket lokal über einen Schalter (`pnpm dev:act2`, Modus `act2` mit `VITE_HC_PACKS=act2`; nur der Dev-Server, nie `vite build`).
3. **Build-Regel:** Dateien unter `acts/actN/` kommen nur in den Build, wenn `actN` veröffentlicht ist; `core` und `act1` wachsen nicht (Test in `tests/unit/packs.test.ts`).
4. **Laden:** `duePacks` liefert `act2`, sobald `c.act ≥ 2` ist, Akt-Pakete nach Akt geordnet (act1 vor act2, unabhängig von der Reihenfolge in `packs.yaml`); das Paket wird auch direkt nach dem Übergang nachgeladen, nicht erst beim nächsten Start. Bis es da ist, zeigt die Weltkarte den Ladezustand (Story 7.2, `PackRing`), die Titeltafel wartet.
5. **Titeltafel:** Ist `c.act` gerade 2 geworden (`c.act > c.actTitleSeen`) und das Paket des Akts geladen, erscheint einmal die Titeltafel „Akt 2 · Glut“ (`act.2.title`, Paket act2). Antippen schließt sie per Kampagnen-Command `markActTitleSeen` (Feld `c.actTitleSeen`, Standard 1, `normalizeCampaign` füllt es; kein Formatwechsel).
6. **Nebel:** Danach lichtet sich der Nebel über Hochland und Küste bis an Aurenhall (der Nebel des Vorakts blendet in `render.yaml worldMap.fogLiftMs` aus). Orte des laufenden Akts ab Akt 2 ohne offenen oder erledigten Stein bleiben unter einem Nebelfleck (`worldMap.veil`); Akt 1 unverändert. Ohne offene Mission zeigt die Weltkarte „Weitere Missionen folgen“ (vorhanden), das Akt-Band „Akt 2 · Herbst – Glut“ (vorhanden, `act.2.season`).
7. **Knoten:** Platzhalter-Knoten `m2_1`…`m2_8`, `n4`…`n6` in `acts/act2/campaign.yaml` (Karten-Ids ohne Karte, Weltkarte bietet sie nicht an), an den Slots der Orte aus `geografie-valmora.md` gebunden (Windscharte 2-1, Salzpass 2-2, Rabenweide 2-3, Brandhang 2-4, Silberquell 2-5, Krähenholm 2-6, Kontor 2-7, Kronfeld 2-8, Jagdgründe N4, Kupferhall N5, Aue-Insel N6). Titel DE/EN.
8. **Brandhang verbrannt:** Ort `burnt_slope` bekommt ein Stadtbild ohne eigenes Grundbild (`site.base: false`; das gemalte Dorf der Karte ist der Grundzustand) und die Variante `burnt_slope_burnt` mit `requires: [{ flag: e7_order }]` (E7 „gehorchen“). Bild und Prompt unter `art/prompts/burnt_slope_burnt_site.md` nach licensing §6; fehlt das Bild, greift der Rückfall aus 15.7 (ohne Grundbild: nichts zeichnen).
9. **Fixture:** `tests/fixtures/saves/format3-act2-no-missions.json` (Akt 2 erreicht, Titeltafel gesehen, keine Mission von Akt 2) mit Generator; `migration-chain.test.ts` kennt sie.
10. **Tests:** `actTitleSeen` (Command, Normalisierung, alter Spielstand), `duePacks` (Ordnung, Akt 2), Build-Regel, Nebelflecken und Stadtbild ohne Grundbild.

## Tasks / Subtasks

- [x] packs.yaml (act2 vor act1, Globs, Budget), `tools/art/build.py` `ACT2_LOCATIONS`, act1-Ortsbilder einzeln (AC 1)
- [x] Dev-Schalter `VITE_HC_PACKS` im Paket-Plugin (nur `serve`), Skript `dev:act2`, `.env.act2`, launch.json (AC 2)
- [x] `duePacks` nach Akt ordnen; `startPacks` lädt nach, wenn `c.act` steigt (AC 4)
- [x] Kern: `actTitleSeen` in `CampaignState`, `newCampaign`, `normalizeCampaign`; Command `markActTitleSeen` + Event (AC 5)
- [x] Weltkarte: Titeltafel (eigene Komponente + CSS), Nebel-Ausblendung, Nebelflecken, `site.base` (AC 5, 6, 8)
- [x] Inhalte: Platzhalter-Knoten, Slots, Titel, `act.2.title`, render.yaml-Werte, Brandhang-Site (AC 7, 8)
- [ ] Bild Brandhang verbrannt per ChatGPT (offen: Claude in Chrome nicht verbunden); Prompt-Datei und `map_places_v5.json` erledigt, Rückfall greift (AC 8)
- [x] Fixture + Generator, Tests (AC 9, 10)
- [x] Sichtprüfung 375 × 812 (Titeltafel, Weltkarte Akt 2), `pnpm check`

## Dev Notes

- **Heute:** `fogAreas(world, act)` legt Nebel über Regionen späterer Akte; `moreMissionsFollow` und das Band `wm-more` gibt es (11.1); `siteImage` wählt Variante → Grundbild → Ortsschild. `startPacks` reiht Pakete nur beim Start ein. `mapInBuild` filtert Platzhalter-Knoten. `packOf` nimmt das erste passende Paket.
- **Akt 1 unverändert:** Stadtbilder von Orten späterer Akte, deren Bild im Build fehlt, zeichnet die Karte nicht (statt Ortsschild), damit das unveröffentlichte Brandhang-Bild in Akt 1 nichts ändert. Nebelflecken erst ab Akt 2. `actTitleSeen` ist kein Teil von Kampf-Startzuständen.
- **Titeltafel-Text** liegt im Paket act2 (`acts/act2/locales/*.names.yaml`), deshalb wartet die Tafel auf das Paket (`data.acts[act]` geladen).
- **Kein Formatwechsel:** neues Feld mit Default in `normalizeCampaign` (§8.7).
- Regeln: AGENTS.md (kein Text im Code, Werte in YAML, Schemas in `schema*.ts`, Styles je Screen in eigener CSS-Datei).

### Annahmen

- `[ASSUMPTION]` `budgetMb: 40` für act2 (wie act1).
- `[ASSUMPTION]` Platzhalter-Knoten tragen schon die Folge der Missionsliste als `requires` (Nebenquests N4 nach 2-3, N5 nach 2-4, N6 nach 2-7); 11.11 prüft und verfeinert sie (Ilka/Jory-Bedingungen). Karten-Ids `m2_<n>_<ort>` / `n<n>_<ort>` vorläufig, die Missions-Stories dürfen sie umbenennen (nichts gesperrt).
- `[ASSUMPTION]` „Orte ohne spielbare Mission bleiben unter Nebel“ = runder Nebelfleck je Ort des laufenden Akts ohne offenen/erledigten Stein (Radius in `render.yaml`).
- `[ASSUMPTION]` Brandhang hat kein eigenes Grundbild (die Karte malt dort schon ein Dorf); verbrannt = Overlay. Bedingung über den vorläufigen Flag `e7_order` (11.5 darf ihn umbenennen).
- `[ASSUMPTION]` Titeltafel schließt per Antippen, kein automatisches Ausblenden.

### References

- `concept/26-epics/epics/epic-11.md` (Story 11.3, Gemeinsame Regeln „Ortsbilder“)
- `concept/24-architecture/architecture.md` §5.4, §5.12, §5.14; `concept/25-ux/EXPERIENCE.md` State Patterns
- `concept/22-narrative/geografie-valmora.md`, `missionsliste-s1.md` (Akt 2)
- `concept/23-art-direction/licensing.md` §6, `art/prompts/erlbach_burnt_site.md` (Muster)

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- Sichtprüfung im Dev-Server `pnpm dev:act2` mit `__hc.devActStart()` bei 375 × 812 (Lautstärken 0): Titeltafel „Akt 2 · Glut / Herbst / Weiter“, danach Nebel des Vorakts ausgeblendet, Nebelflecken über den Orten von Akt 2, Band „Weitere Missionen folgen“.
- `pnpm check` grün (Build-Warnung „first download über 12 MB Ziel“ ist nur Hinweis; Budget 30 MB).

### Completion Notes List

- Paket act2 vor act1, act1 nennt Ortsbilder einzeln; `duePacks` nach Akt geordnet; `startPacks` lädt bei jedem neuen `c.act` nach.
- Entwickler-Schalter `VITE_HC_PACKS` (nur `vite` serve), `.env.act2`, `pnpm dev:act2`, launch.json `dev-act2`; Dev-Hook `__hc.devActStart(seen?)`.
- `CampaignState.actTitleSeen` (Standard 1), Command `markActTitleSeen`, Event `actTitleSeen`; kein Formatwechsel.
- Weltkarte: `ActTitle` (eigene CSS), Nebel des Vorakts blendet aus (`fogLiftMs`, Ende per `transitionend`, Rückfall 2 × Dauer), `veilAreas` ab Akt 2, `site.base: false`.
- Platzhalter-Knoten von Akt 2 an ihren Orten, Titel DE/EN, `act.2.title` im Paket act2.
- **Offen:** Bild `burnt_slope_burnt` nicht erzeugt (Claude in Chrome in der Session nicht verbunden). Prompt liegt in `art/prompts/burnt_slope_burnt_site.md`; bis dahin zeichnet die Karte an Brandhang nichts Eigenes (Rückfall).
- Kein `content:lock`, `released-ids.json` unverändert, act2 bleibt `released: false` (9.14 nicht auf main).

### File List

Neu: `src/app/screens/ActTitle.tsx`, `src/app/screens/ActTitle.css`, `tests/unit/act-title.test.ts`, `tests/fixtures/saves/format3-act2-no-missions.json`, `tests/fixtures/saves/generate-act2-no-missions.ts`, `art/prompts/burnt_slope_burnt_site.md`, `.env.act2`.
Geändert: `content/packs.yaml`, `content/acts/act2/campaign.yaml`, `content/acts/act2/locales/{de,en}.names.yaml`, `content/core/locales/{de,en}.yaml`, `content/core/render.yaml`, `content/world/valmora.yaml`, `art/world/map_places_v5.json`, `tools/art/build.py`, `tools/build/packs-plugin.ts`, `vite.config.ts`, `package.json`, `.claude/launch.json`, `src/core/{state,renderDefs}.ts`, `src/core/campaign/{apply,campaign,commands}.ts`, `src/content/{schemaCampaign,schemaRender}.ts`, `src/packs/plan.ts`, `src/app/state/{packs,devHooks}.ts`, `src/app/screens/{WorldMap.tsx,WorldMap.css,worldMapView.ts}`, `concept/24-architecture/architecture.md`, Tests (`act-transition`, `core`, `graph`, `migration-chain`, `migrations`, `packs`, `world-map`, `src/packs/plan.test.ts`), `sprint-status.yaml`.
