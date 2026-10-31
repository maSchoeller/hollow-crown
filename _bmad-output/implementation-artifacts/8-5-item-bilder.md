# Story 8.5: Item-Bilder

Status: review

## Story

Als Spieler
möchte ich jedes Item als gemaltes Bild sehen,
damit Ausrüstung so lebendig wirkt wie die Figuren.

## Acceptance Criteria

1. **Bild je Item:** Jedes Item und jede Rune aus `content/items.yaml` und `content/runes.yaml` hat ein gemaltes Bild in `art/items/`. Das optionale Feld `image` (Zod-Schema + Typ) nennt es, Standard ist die `id`; gestufte Runen (`fire_rune_1..3` usw.) teilen sich das Bild ihres Elements (`fire_rune`).
2. **Prüfung:** `pnpm content:check` scheitert für jedes Item und jede Rune, deren Bild in `art/items/` fehlt.
3. **Baustein `ItemImage`:** wiederverwendbare Komponente nach DESIGN.md `item-image`: 44 px, Rundung `{rounded.chip}`, Rahmen in Seltenheitsfarbe (`--hc-rarity-*`), Seltenheits-Rauten oben rechts (Gewöhnlich 0, Selten 1, Episch 2, Legendär 3; Relikt hohle Krone mit Glutorange-Rahmenakzent), Zahl unten (Aufwertung `+n`, Ladungen `n/m`, Runenstufe). Seltenheit über `instanceRarity`.
4. **Überall eingesetzt:** Inventar (Truppe, Ausrüstung, Konvoi, Vorbereitung, Kampf-Item- und Tauschdialoge), Händler (Sortiment, Angebot, Verkauf), Schmied und Verzauberer, Beute (Kampf-Hinweis bei Beute, Ergebnis), Vorschau (Kampfvorschau, Figurenkarte) und Ergebnis zeigen das Bild statt Linien-Icons.
5. **Aufräumen:** Die PoC-Item-Icons (`itemIcon`, Item-Pfade in `icons.tsx`, `.item-row .ico`-Platzhalter) entfallen; Linien-Icons bleiben nur für Aktionen, Rollen und Navigation.
6. **Prüfungen grün:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` (im Bundle-Budget).

## Tasks / Subtasks

- [x] T1 Feld `image` (AC 1)
  - [x] `itemSchema`/`runeSchema` + `ItemDef`/`RuneDef` um `image?: string`; Runen-Items erben das Bild der Rune
  - [x] `image` für gestufte Runen und die zwei Items ohne eigenes Bild in YAML setzen
- [x] T2 `content:check` (AC 2)
  - [x] `validateContent` prüft für alle Items (inkl. Runen) `image ?? id` gegen `art/items`; Test in `tests/unit/core.test.ts`
- [x] T3 `ItemImage` (AC 3)
  - [x] Komponente + CSS in `src/ui/pieces.tsx`/`pieces.css`, Bildpfad über `itemImageSrc(def)`
- [x] T4 Einsetzen (AC 4)
  - [x] `ItemRow`, `UnitCard`, `ForecastView` in `components.tsx`
  - [x] Camp: Verzauberer-Runenlisten, leere Ausrüstungsplätze
  - [x] Ergebnis (`Menus.tsx`): Beute-Items und gewährte Items, Belohnungen der Nebenziele
  - [x] Kampf: Beute-Hinweis mit Bild
- [x] T5 Aufräumen (AC 5)
- [x] T6 Prüfungen und Browser-Check (AC 6)

## Dev Notes

- **Heute:** `ItemRow` zeichnet ein Linien-Icon (`itemIcon` → `KIND_ICON` in `components.tsx`, Pfade unter `// items` in `icons.tsx`) in einem grauen Achteck (`.item-row .ico`, `clip-path: var(--cut)`). Materialien zeigen schon ihr Bild über `Amount` (Story 1.1), `content:check` verlangt Bilder nur für Materialien.
- **Bilder:** 139 Bilder in `art/items/<id>.png` (512 px, freigestellt), `pnpm art:build` baut sie nach `public/assets/items/<id>.webp` (132 px). Es gibt mehr Bilder als Items (ganze Staffel).
- **Seltenheit:** `instanceRarity(data, def, affixCount)` in `src/core/loot.ts`; `rarityOf` in `components.tsx` bleibt der Zugang für die UI. `Rarity` kennt (noch) kein Relikt; `ItemImage` nimmt `relic` trotzdem an, damit die Darstellung steht, wenn Relikte kommen.
- **Zahl unten:** Aufwertung `+n` (> 0), sonst Ladungen `n/m` bei Items mit `charges`, sonst Runenstufe (`RuneDef.tier`).
- **Erhalten:** Seltenheitsfarbe des Namens (`.r-*`), Aufbau der Item-Zeile (Bild, Name + Unterzeile, rechts Aktion/Preis).

### References

- [Source: concept/26-epics/epics/epic-08.md#Story 8.5: Item-Bilder]
- [Source: concept/25-ux/DESIGN.md – `item-image`, Komponententabelle „Item-Bild“, Farben `rarity-*`]
- [Source: concept/25-ux/mockups/06-truppe.html – `.ic`, `.gem`, `.plus`]
- [Source: concept/23-art-direction/art-direction.md §5.6]
- [Source: art/prompts/items_all.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm lint` (ESLint + tsc) grün
- `pnpm test` grün: 6 Dateien, 60 Tests (neu: `item images (story 8.5)` in `tests/unit/core.test.ts`)
- `pnpm content:check` grün (75 Items inkl. Runen, alle mit Bild)
- `pnpm build` grün: 14,85 MB Transfer (Budget 15,00 MB), unverändert, weil die Item-Bilder schon gebaut wurden
- Browser (375 × 812): Händler, Truppe/Figur (leere Plätze gestrichelt), Konvoi mit Rune Stufe 2, `+2`, Rauten 1/2, Ladungen `1/3`, Ergebnis (Beute, Nebenziel-Belohnung, „erhält Glut“) geprüft; keine Konsolenfehler. Kampfvorschau und Beute-Hinweis nur per Code/Typprüfung, nicht im Browser angesehen

### Completion Notes List

- `ItemImage` in `src/ui/pieces.tsx` (+ `pieces.css`): 44 px Chip, Rahmen und Rauten in `--hc-rarity-*`, Relikt mit hohler Krone und Glutorange-Ring (Typ `Rarity` kennt noch kein Relikt, daher nur per `rarity="relic"`), Zahl unten: Aufwertung `+n` → Ladungen `n/m` (nur bei mehr als 1 Ladung) → Runenstufe. Unter 36 px ohne Zahl. `itemImageSrc` nutzt `image ?? id`, auch `Amount` für Materialien.
- Feld `image` in `itemSchema`/`runeSchema`, `ItemDef`/`RuneDef`; Runen-Items erben es. Gestufte Runen → Element-Bild; `drake_breath` → `dragon_scale`, `promotion_seal` → `chronicle_page` als Interim (kein passendes eigenes Bild unter den 139; Entscheidungslog UX).
- `validateContent` meldet jedes Item/jede Rune ohne Bild (vorher nur Materialien).
- Eingesetzt: `ItemRow` (Truppe, Konvoi, Händler, Schmied, Verzauberer, Kampf-Inventar, Item-Nutzung, Tausch, Konvoi im Kampf), `UnitCard` (Waffe), `ForecastView` (Waffe je Seite), Verzauberer (Runenlisten, Ein-/Ausbauknöpfe, gewähltes Item), Heiler (Kraut-Knopf), Ergebnis (Beute-Items mit Seltenheitsfarbe, gewährte Items, Nebenziel-Belohnung), Beute-Hinweis im Kampf (`Toast` mit `lead`).
- Entfernt: `itemIcon`/`KIND_ICON` und die Item-Pfade in `icons.tsx`; Linien-Icons nur noch für Aktionen, Rollen, Navigation. Leere Ausrüstungsplätze als gestrichelter Chip.
- Namensfarben `.r-rare`/`.r-epic` auf die Seltenheits-Tokens (vorher Teamblau, verstößt gegen DESIGN.md).

### File List

- content/items.yaml
- content/runes.yaml
- src/content/schemas.ts
- src/content/load.ts
- src/content/validate.ts
- src/core/defs.ts
- src/ui/pieces.tsx
- src/ui/pieces.css
- src/ui/components.tsx
- src/ui/icons.tsx
- src/ui/styles.css
- src/app/screens/Battle.tsx
- src/app/screens/Camp.tsx
- src/app/screens/Menus.tsx
- tests/unit/core.test.ts
- concept/25-ux/.decision-log.md
- _bmad-output/implementation-artifacts/8-5-item-bilder.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
