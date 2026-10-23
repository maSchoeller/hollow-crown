# 10 – Technische Architektur

> **Staffel 1:** Ergänzt und teilweise ersetzt durch `24-architecture/architecture.md` (Delta). Neu gefasst sind dort die Modulstruktur (§2) und das Speichern (§6); der Rest gilt, wo das Delta schweigt.

## 1. Stack

| Bereich | Wahl | Status |
|---|---|---|
| Sprache | TypeScript (strict, `noUncheckedIndexedAccess`) | A |
| Build/Dev | Vite | A |
| Rendering | Babylon.js (`@babylonjs/core`, ES-Module, Tree-Shaking), orthografische Kamera | A |
| UI | HTML/CSS-Overlay; Preact + @preact/signals | A / C |
| Daten | YAML (`yaml`), Validierung mit Zod | A |
| Tests | Vitest (Kern, Content), Playwright (E2E, Mobil-Profile) | A |
| Persistenz | IndexedDB (`idb`) | A |
| PWA | `vite-plugin-pwa` (Workbox), offline-fähig | A |
| App Stores | Capacitor (nach V1) | A |
| Paketmanager | pnpm, Node 22 LTS | C |
| Lint/Format | ESLint (typescript-eslint) + Prettier | C |

## 2. Modulstruktur

```
hollow-crown/
  concept/                 ← dieses Konzept
  content/                 ← Spieldaten (YAML), vom Spiel geladen
    balance.yaml
    classes.yaml  units.yaml  items.yaml  skills.yaml
    affixes.yaml  runes.yaml  sets.yaml  traits.yaml
    maps/*.yaml   dialogue/*.yaml   campaign.yaml
    locales/de.yaml  locales/en.yaml
  src/
    core/                  ← REINER Regelkern, KEIN DOM, KEIN Babylon, KEIN Math.random
      rng.ts               (Seed-RNG, z. B. sfc32/xoshiro128**)
      state/               (GameState, BattleState, CampaignState – serialisierbar)
      rules/               (stats, combat, damage, triangle, elements, status, terrain,
                            movement/pathfinding, supports, levelup, death, objectives)
      commands/            (Command-Typen + Validierung + Ausführung)
      events/              (Event-Typen)
      ai/                  (KI-Profile, Zielbewertung)
      camp/                (Händler, Schmied, Verzauberer, Taverne, Heiler)
      loot/                (Affix-/Drop-Generierung)
    content/               ← Laden, Zod-Schemas, Referenz-Validierung, Map-Parser
    render/                ← Babylon: Szene, Kamera, Tiles, Einheiten-Sprites, Overlays,
                             Animationen (konsumiert Events), Picking
    ui/                    ← Preact-Komponenten, Screens, Bottom Sheet, Vorschau, Lager
    input/                 ← Touch/Maus/Tastatur → Intents (Tap, LongPress, Pinch, Pan)
    app/                   ← Bootstrap, Screen-Router, Game-Controller (verbindet core/render/ui)
    persistence/           ← IndexedDB, Save-Format, Migrationen, Export/Import
    i18n/                  ← Schlüssel-Lookup, Pluralisierung, Pronomen
    platform/              ← Abstraktionen: Haptik, Wake-Lock, Monetarisierung (No-Op in V1)
  tools/
    map-validate.ts        (CLI: Karten/Content prüfen)
    simulate.ts            (CLI: KI vs. KI, N Durchläufe, Statistik)
  tests/e2e/               ← Playwright
```

**Abhängigkeitsregel** (per ESLint `no-restricted-imports` erzwingen):
`core` → nichts außer sich selbst. `content` → `core`-Typen. `render`, `ui` → `core`, `content`. `app` → alles. `tools` → `core`, `content`.

## 3. Regelkern: Command → Event

```
UI/KI ──Command──▶ core.validate(state, cmd) ──ok──▶ core.apply(state, cmd)
                                                         │
                                       ◀── neuer State + Event[] ──┘
Renderer spielt Events als Animationen ab; UI liest State (Signals).
```

- **Commands** (Beispiele): `SelectDeploy`, `Move{unit, to}`, `Attack{unit, target, weaponUid}`, `UseItem`, `Cast`, `Trade{a, b, moves[]}`, `Convoy`, `Talk`, `Visit`, `Open`, `Rescue`, `Command(avatar)`, `Rally`, `Wait`, `EndPhase`, `Flee`.
- **Events** (Beispiele): `UnitMoved`, `AttackStrike{hit, crit, dmg}`, `StatusApplied`, `TerrainChanged`, `UnitDowned`, `UnitDied`, `UnitRescued`, `LevelUp{gains}`, `SkillMastered`, `ItemLooted`, `ReinforcementsArrived`, `DialogueTriggered`, `ObjectiveCompleted`, `PhaseChanged`, `BattleEnded`.
- `validate` liefert strukturierte Fehler (für UI-Hinweise und Tests).
- **Vorschau** = `previewAttack(state, cmd)` ohne RNG (gleiche Formeln).
- **Rücknahme der Bewegung**: `Move` wird erst gemeinsam mit der Folgeaktion committed (`MoveAndAct`), außer die Bewegung erzeugt Info-Events (Nebel, Trigger) → dann sofortiger Commit, keine Rücknahme.
- State ist **plain JSON** (keine Klassen-Instanzen, keine Maps/Sets im persistierten State) → trivial serialisierbar.

## 4. Determinismus

- Ein RNG-Zustand im State (`state.rng`), alle Zufallsentscheidungen ziehen daraus in fester Reihenfolge.
- Kein `Math.random`, kein `Date.now` im Kern (ESLint-Regel).
- **Replay** = Startzustand + Command-Log. Gleiche Eingabe → gleiches Ergebnis (Test: Golden-Replays).
- Bug-Report-Export: Startzustand + Commands als JSON.

## 5. Rendering (Babylon)

> **Stand 2026-10-22: Echtzeit-3D-Brett** (`concept/01-decisions.md` D1–D16). Die frühere Pixel-Draufsicht (T3 alt) ist abgelöst.

- **Kamera** (`src/render/board.ts`, Rechnung in `src/render/camera.ts`): orthografisch, um `render.yaml camera.tiltDeg` aus der Senkrechten geneigt, Norden oben, nicht drehbar. Drei Zoomstufen (`zoomSteps`, Spalten auf der kürzeren Bildschirmseite), Pinch/Mausrad wechseln die Stufe. Pan begrenzt auf den Kartenrand plus `margin` × freie Sichtfläche; die freie Fläche liegt zwischen den gemessenen HUD-Leisten (D10).
- **Gelände** (`src/render/terrain3d.ts`): Blöcke mit Höhe aus `terrain.yaml`, Oberseiten mit gemalten Texturen über eine Splat-Map (MixMaterial), Seitenwände Erde/Fels/Mauer, Mauerkronen, abgesenktes Wasser, Brückendecks. Rundherum `board.skirt` Felder abgedunkelte Landschaft.
- **Requisiten**: glTF-Modelle pro Zustand (`src/render/models.ts`), je Modell ein Mesh mit Thin Instances; Landschaft außerhalb der Karte über Instanzfarbe abgedunkelt.
- **Einheiten** (`src/render/figures.ts`): `ModelFigure` (glTF mit Animationsgruppen, Teamfarbe aus dem Vertex-Alpha) oder `SpriteFigure` (Pixel-Sheet als Billboard, Option „Figuren: 2D“). Bewegung per Tween, Treffer-Events zum Treffer-Frame der Sprite-Zeile `attack_s`.
- **Licht**: Umgebungslicht aus `ambient`, Sonne aus `sun` der Karte mit Schattenkarte je Qualitätsstufe, Punktlichter aus `lights` und brennenden Feldern (gedeckelt durch `board.lightsMax`).
- **Picking**: Bildschirm → Feld per Strahl durch die Höhenkarte (kein Mesh-Picking).
- **Austauschbarkeit**: Das Brett hat nach außen nur `load`, `play`, `setOverlays`, `centerOn`, `relayout`, `skip`, `speed`, `quality`, `figures`, `dispose`; der Kern bleibt unberührt.

## 6. Speichern

- **Auto-Save** (Slot `auto`): bei jedem Commit `{ battleStart: Snapshot, commands: Command[] }` (append-only, klein); Laden = Snapshot + Replay. Zwischen Missionen: voller `CampaignState`.
- **3 manuelle Slots** im Lager/auf der Weltkarte.
- Format: `{ version: number, createdAt, appVersion, payload }`; `migrations[version] → payload'`, getestet mit Fixture-Saves.
- **Export/Import**: JSON-Datei (gzip optional), mit Prüfsumme; Import validiert per Zod.
- Klassik-Modus: Kein Neustart der Runde; Auto-Save trotzdem (für Unterbrechung).

## 7. i18n

- Alle Texte über Schlüssel (`ui.camp.title`, `item.iron_sword.name`, `dlg.ch01.intro.003`).
- Locale-Dateien YAML; fehlende Schlüssel → Fallback EN + Warnung im Dev-Build; CI-Test: alle Schlüssel in DE **und** EN vorhanden.
- Platzhalter `{name}`, Plural (`Intl.PluralRules`), Pronomen des Avatars (`{avatar.pronoun.subject}`).
- Zahlen/Formate via `Intl`.

## 8. Tools

- **Karten-Viewer/Validator** (Dev-Route `/#/dev/map/<id>`): rendert die Karte, zeigt Spawns, Ziele, Trigger-Bereiche, Gefahrenzonen der Gegner zu Runde 1, Erreichbarkeit (Pfad Kael → Ziel existiert), Fehlerliste.
- **CLI** `pnpm content:check`: validiert alle YAML (Schema, Referenzen auf IDs, Rastergröße, Legende, i18n-Schlüssel).
- **CLI** `pnpm sim <mapId> --runs 200 --seed 1 --difficulty normal`: Spieler-Seite wird von der KI (Profil `aggressive` + einfache Heuristik) gespielt; Ausgabe: Siegquote, Ø Runden, Ø Verluste, häufigste Todesursachen. Dient Balancing und KI-gestütztem Karten-Bau.

## 9. Qualität & Performance

- **Vitest**: Formeln (Tabellen-Tests), Pathfinding, Wachstum-Glättung (statistischer Test mit Seed), Element/Dreieck, Tod-Modi, Tandem/Schutz, Trigger, KI-Entscheidungen, Wirtschaft, Save-Migration, Replay-Determinismus. Ziel: ≥ 90 % Zeilenabdeckung in `src/core`.
- **Playwright** mit Geräteprofilen `iPhone 13`, `Pixel 7`, `iPad (gen 7) landscape`, `Desktop Chrome`: Neues Spiel → Prolog spielen (deterministischer Seed) → Sieg; Inventar tauschen; Speichern/Laden/Export; Unterbrechen & Fortsetzen.
- **Performance-Budget**: 60 FPS auf ~3 Jahre altem Mittelklasse-Handy (Referenz: Pixel 6a / iPhone 12) bei 24×32 Karte mit 40 Einheiten; Kaltstart < 5 s auf 4G; initialer Download < 15 MB (gzip); KI-Phase < 300 ms Rechenzeit pro Gegnereinheit (Web Worker, falls nötig).
- **CI** (GitHub Actions): lint, typecheck, unit, content:check, e2e (Chromium-Mobil-Emulation), Build-Größe prüfen.

## 10. Plattform-Abstraktionen (für später)

```ts
interface Monetization { showRewardedAd(placement): Promise<'rewarded'|'skipped'|'unavailable'>;
                         purchase(sku): Promise<PurchaseResult>; isAdFree(): boolean; }
interface Haptics { impact(kind): void }
interface CloudSave { push(save): Promise<void>; pull(): Promise<Save|null> }
```
V1 liefert No-Op-Implementierungen. Capacitor-Plugins (AdMob, In-App-Purchases) werden später dahinter gesteckt.
