# Story 4.9: Feste Support-Paare

Status: review

## Story

Als Spieler
möchte ich, dass Freundschaften zwischen bestimmten Gefährten wachsen,
damit jeder seine eigene Geschichte in der Truppe hat.

## Acceptance Criteria

1. **Paare als Content:** `content/acts/act1/supports.yaml` beschreibt die festen Paare des Akts (Narrative „Die 25 Support-Paare“) mit Kennzeichnung der 6 S-Kernpaare und den Gesprächen je Rang.
2. **Schwellen:** Erreichen die Punkte eines Paars die Schwellen C 10, B 25, A 45, S 70, steht am Lagerfeuer ein Gespräch bereit; S gibt es nur für Kernpaare.
3. **Lagerfeuer in Akt 1:** Das Lagerfeuer erlaubt in Akt 1 nur C und B (A und S über die Burg-Stufen, Epic 10).
4. **Marke:** „Gespräche bereit“ erscheint in Truppe und Lager.

## Tasks / Subtasks

- [x] T1 Content und Schema (AC 1)
  - [x] `supports.yaml` je Akt: `pair`, `core`, `talks { C, B, A, S }`; `GameData.supports` (Schlüssel `pairKey`); `supportPairs`/`supportDialogues` in `campaign.yaml` entfallen
  - [x] Akt 1: die 7 Paare der Gefährten von Akt 1 (Kael × Rhen ★, Kael × Brenna ★, Brenna × Tobin ★, Liora × Rhen ★, Brenna × Varek, Tobin × Mira, Liora × Ysolde) mit den PoC-Gesprächen
  - [x] `content:check`: Gefährten bekannt, Paar nur einmal, Gespräch `S` nur bei Kernpaaren, Szenen vorhanden, höchstens 6 Kernpaare und 25 Paare (`balance.supports.corePairs`, `seasonPairs`), Bedingung `support` nur mit bekanntem Paar
- [x] T2 Kern (AC 2, 3)
  - [x] `maxRank(data, key)`: Kernpaar S, sonst A (Paare einer Karte, z. B. Gegner, bleiben bei S)
  - [x] `addSupportPoints` und `pendingRank` beachten den Höchstrang; Punkte stauen sich an der Schwelle des nächsten gesperrten Rangs
  - [x] `campfireMaxRank(data, c)` aus `balance.supports.campfireMaxRank` je Lagerfeuer-Stufe (Lager = 1 → B)
  - [x] `supportTalk(data, c, key)`: Gespräch bereit, wenn beide in der Truppe, Rang erreicht, vom Lagerfeuer erlaubt und Szene vorhanden; `availableSupportTalks`, `supportsReady` im Missionsergebnis und `unlockSupport` nutzen dieselbe Regel
  - [x] Neue Paare späterer Inhalte bekommen beim Laden einen leeren Eintrag (`normalizeCampaign`)
- [x] T3 UI (AC 4)
  - [x] Truppe: Zähler-Marke je Figur und Legende „Gespräche bereit“ (vorhanden, nutzt die neue Regel); Lager: Lagerfeuer-Stein mit Zähler und „Gespräche bereit“
- [x] T4 Tests (AC 1–4)

## Dev Notes

- **Quellen:** Epics 4.9; GDD „Supports“ (25 Paare, C/B/A am Lagerfeuer, S nur 6 Kernpaare, Schwellen C 10, B 25, A 45, S 70); GDD Heimat „Lagerfeuer: Ränge C und B → A → S (Kernpaare)“; Narrative „Die 25 Support-Paare“ (★ = S); Architektur §5.10 (Raumstufen schalten Lagerfeuer-Ränge frei).
- **Bestand:** Punkte, Ränge, Nachbarbonus, Tandem, Schutz und Trauer gibt es seit dem PoC (`src/core/rules/supports.ts`), Lagerfeuer-Panel und Truppen-Marke seit 6.1/6.3 (`availableSupportTalks`, `supportTalksOf`). Diese Story macht die Paare zu Content und setzt die Rang-Grenzen.
- **Burg-Stufen** gibt es noch nicht (Epic 10): `campfireMaxRank` liest `roomLevel(c, 'campfire')` (heute immer 1) gegen `balance.supports.campfireMaxRank: [B, A, S]`.
- **Paare je Akt:** Ein Paar steht in der `supports.yaml` des Akts, in dem sein späterer Gefährte beitritt; so prüft `content:check` jeden Namen gegen die Einheiten.

### Project Structure Notes

- Neu: `content/acts/act1/supports.yaml`, `tests/unit/supports-pairs.test.ts`.
- Geändert: `src/core/{defs,index}.ts`, `src/core/rules/supports.ts`, `src/core/campaign/{camp,campaign,apply}.ts`, `src/content/{schemas,load,validate}.ts`, `content/acts/act1/campaign.yaml`, `content/core/balance.yaml`, `src/app/screens/Camp.tsx`.

### Project Context Rules

- Spielwerte nur in YAML; `src/core` rein; Kampfregeln nur so weit, wie der Höchstrang eines Paars es verlangt.
- Fertig erst mit grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

### References

- [Source: concept/26-epics/epics.md#Story 4.9]
- [Source: concept/21-gdd/gdd.md#Supports]
- [Source: concept/22-narrative/narrative.md#Die 25 Support-Paare]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Die 7 Paare von Akt 1 sind genau die des PoC; neu ist die Kennzeichnung der 4 Kernpaare und die Grenze A für die übrigen.
- `unlockSupport` verlangt kein Gespräch (wie bisher), aber Rang innerhalb von Paar- und Lagerfeuer-Grenze; Lagerfeuer und Marke zeigen nur Ränge mit geschriebener Szene.
- Die Listen `supports` in `units.yaml` (Partner je Figur) sind PoC-Bestand und werden nicht gelesen; sie bleiben unangetastet.
- Im Browser geprüft (375×812, Deutsch): Lager mit Zähler 3 und „Gespräche bereit“, Lagerfeuer mit C/B/C-Gesprächen (Mira × Tobin an der A-Schwelle erscheint nicht), Truppe mit Zählern je Figur.

### File List

- Neu: `content/acts/act1/supports.yaml`, `tests/unit/supports-pairs.test.ts`
- `src/core/defs.ts`, `src/core/rules/supports.ts`, `src/core/campaign/{camp,campaign,apply}.ts`
- `src/content/{schemas,load,validate}.ts`
- `content/acts/act1/campaign.yaml`, `content/core/balance.yaml`
- `src/app/screens/Camp.tsx`, `src/ui/camp.css`
- Doku: `concept/24-architecture/{architecture,decision-log}.md`, `concept/25-ux/.decision-log.md`
