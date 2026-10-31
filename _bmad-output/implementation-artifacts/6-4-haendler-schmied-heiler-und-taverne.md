# Story 6.4: Händler, Schmied, Heiler und Taverne

Status: review

## Story

Als Spieler
möchte ich kaufen, aufwerten, Narben heilen und Söldner anheuern,
damit ich Gold sinnvoll einsetze.

## Acceptance Criteria

1. **Händler:** Börse, Kaufen/Verkaufen, Sortiment nach Ausrüstungs-Tier des Akts (das Angebot des Tages erst mit Händler-Stufe 3, Epic 10), jeder Preis als Münze + Zahl; die Haupttaste nennt den Betrag; „Für wen?“ zeigt, wer das Item führen kann. `priceMod` und `villageAid` wirken sichtbar: **offen** (siehe Dev Notes).
2. **Schmied, Heiler, Taverne:** Kosten und Grenzen aus `balance.yaml` (Aufwerten bis +3 auf Stufe 1, Narbe heilen 2 500, Söldner 600 + 150 × Stufe, 3 Angebote); Armee-Limit 20 Gefährten + 6 Söldner (Beitritt über Entscheidung oder Ansprechen bei vollem Limit: Story 3.7).

## Tasks / Subtasks

- [x] T1 Balance: `economy.mercenaryLimit`, `smithMaxUpgrade`, `rerollFromSmithLevel`, `tavern` (Klassen mit Ausrüstung und `requires`, Namensschlüssel, `levelSpread`) mit Schema, Typ und `content:check`
- [x] T2 Zustand: `CampaignState.tavern`; `refreshTavern` (Kampagnen-RNG) am Missionsende
- [x] T3 Command `hire { offer }` mit `army_full`; `upgrade` prüft `upgradeLimit`, `reroll` prüft `rerollAllowed`; `hireCost`, `hireError`, `armyCount`, `upgradeLimit`, `upgradePreview` in `camp.ts` (UI und Command rufen dieselbe Funktion)
- [x] T4 UI: `MerchantRoom` (Kaufen/Verkaufen, „Für wen?“), `SmithRoom` (Vorschau je Stufe, Kosten auf der Haupttaste), `HealerRoom` (Gold oder Seher-Kraut), `TavernRoom` (Angebote, Limit-Zeile), in `Rooms.tsx`
- [x] T5 Tests: Taverne (Angebote, Determinismus, Stufen, Magie erst nach Kapitel 1), `hire` (Kosten, Fehler, Limit), Schmied-Grenze und Vorschau, Reroll-Sperre

## Dev Notes

- **Söldner:** Truppenmitglieder ohne `charId` (`isMercenary`); sie zählen nur gegen das Söldner-Limit, Gefährten treten über die Handlung bei und ignorieren es.
- **Angebote:** drei je Kapitel, Stufe = erwartete Stufe der nächsten Mission minus 0..`levelSpread`; Klassen und Ausrüstung aus `balance.yaml`; Magier und Heiler erst nach Kapitel 1 (Magie gilt ab Kapitel 2).
- **Schmied:** Lager = Stufe 1: bis +3; „Affix neu würfeln“ erst ab Stufe 3 (`rerollFromSmithLevel`). `potionUpgrade` (Trank verstärken) ist ohne Command noch nicht im Panel.
- **Offen / Entscheidungen:** (a) `priceMod`/`villageAid` bleiben „not yet supported“ seit Story 4.2: ihr Zustand fehlt, ein sichtbarer Haken wäre nicht trivial; (b) die Kapitel-Angebote des Händlers (`c.offers`) zeigt die Oberfläche bis Händler-Stufe 3 nicht; (c) Beitritt bei vollem Limit gehört zu Story 3.7.

### References

- [Source: concept/26-epics/epics/epic-06.md#Story 6.4]
- [Source: concept/21-gdd/gdd.md#Heimat, Wirtschaft, Rekrutierung]
- [Source: concept/24-architecture/architecture.md#8.1]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5 (claude-sonnet-5-5)

### Debug Log References

- `pnpm lint`, `pnpm test` (115 Tests), `pnpm content:check` grün; `pnpm build`: Bundle 14,98 MB von 15,00 MB.
- Browser (Dev-Server, Port 5176): Taverne (Anheuern: Gold −1 050, Truppe +1), Heiler (Narbe entfernt, Gold −2 500), Schmied (Vorschau, Haupttaste), Händler („Für wen?“), Konvoi, Lagerfeuer, Verzauberer.

### Completion Notes List

- Der Code der Stories 6.3 und 6.4 liegt im Commit zu 6.3 (gemeinsame Dateien `Rooms.tsx`, `camp.ts`); dieser Commit trägt Story-Datei, Status und Entscheidungslog.

### File List

- `content/core/balance.yaml`, `src/core/{defs,state}.ts`, `src/core/campaign/{camp,campaign,commands,apply}.ts`, `src/content/{schemas,validate}.ts`
- `src/app/screens/Rooms.tsx`, `tests/unit/{camp,campaign-commands}.test.ts`, `content/core/locales/{de,en}.yaml`
