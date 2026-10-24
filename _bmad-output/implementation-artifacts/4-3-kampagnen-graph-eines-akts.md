# Story 4.3: Kampagnen-Graph eines Akts

Status: review

## Story

Als Spieler
möchte ich nach dem Akt-Einstieg zwischen mehreren Missionen wählen,
damit ich die Mitte eines Akts in meiner Reihenfolge spiele.

## Acceptance Criteria

1. **Graph:** `content/acts/act1/campaign.yaml` beschreibt Knoten mit `kind` (`story` | `side`), `fixed: first | finale`, `requires` (Bedingungen, Architektur §5.3) und `memorialIf`. `availableNodes(data, c)` liefert die verfügbaren Knoten: zuerst nur die feste erste Mission, danach alle mit erfüllten Bedingungen, das Finale erst nach allen anderen Story-Knoten. `CampaignState.available` und die `next`-Listen entfallen.
2. **Gestaffelte Regeln:** `mechanics` zählt nach `storyCount` (Zahl abgeschlossener Story-Missionen des Akts, ab der die Regel gilt). `lockedMechanics` rechnet beim Missionsstart mit dieser Zahl statt mit der Knotenposition.
3. **Klassen-Aktionen je Rolle:** Die Klassen-Aktion einer Kernrolle ist erst aktiv, wenn der erste Gefährte dieser Rolle beigetreten ist (`c.rolesSeen`).
4. **Nebenquests:** Ist der Auslöser einer Nebenquest gefallen (`memorialIf`), läuft beim Spielen die Gedenk-Variante der Szene. Story- und Nebenquest-Knoten sind nach Abschluss nicht wiederholbar. Die Wirkung `openQuest` öffnet eine Nebenquest.

## Tasks / Subtasks

- [x] T1 Schema und Typen (AC 1, 2, 4)
  - [x] `CampaignNodeDef`: `kind`, `fixed?`, `requires?`, `memorialIf?`, `memorial?: { pre?, post? }`; `next` und `CampaignDef.start` entfallen
  - [x] `mechanics: Partial<Record<Mechanic, number>>`
  - [x] `content/acts/act1/campaign.yaml` umstellen (Prolog `fixed: first`, Kapitel 1–2 über `requires`; Mechaniken 1/2/3/3)
- [x] T2 Kern (AC 1–4)
  - [x] `src/core/campaign/graph.ts`: `availableNodes`, `isAvailable`, `storyCount`, `nodeScenes` (Gedenk-Variante), `lockedMechanics(data, c)`, `lockedRoles(data, c)`, `noteRoles`
  - [x] `CampaignState`: `available` raus; neu `rolesSeen: string[]`, `quests: string[]` (per `openQuest` geöffnete Nebenquests); Defaults in `normalizeCampaign`
  - [x] `finishBattle` setzt kein `available` mehr; `validateCampaign` (`finishMission`, `restart*`) prüft `isAvailable`
  - [x] `createBattle`: `locked` aus `storyCount`, `lockedRoles` in den `BattleState`; `classActionId` beachtet gesperrte Rollen
  - [x] Wirkung `openQuest` unterstützt (Validierung: Knoten ist Nebenquest)
- [x] T3 Content-Prüfung (AC 1, 2, 4)
  - [x] genau ein `fixed: first`, höchstens ein `finale`; `requires`/`memorialIf` als Bedingungen geprüft; `memorialIf` nur bei `side` und nur mit `memorial`-Szene; `openQuest` nennt eine Nebenquest
  - [x] `expectedLevel` fällt nicht entlang der Story-Knoten (Dateireihenfolge und `completed`-Voraussetzungen)
  - [x] Magie-Prüfung (`validateMechanics`) über die kleinste mögliche `storyCount` eines Knotens
- [x] T4 App (AC 1, 4)
  - [x] Weltkarte, Titel-Info, Taverne und Neustart nutzen `availableNodes`; Neue Kampagne startet die feste erste Mission
  - [x] Szenen vor/nach der Mission über `nodeScenes`
  - [x] Speicherformat: `available` optional (alte Stände), Fixtures laden weiter
- [x] T5 Tests (AC 1–4)
  - [x] `tests/unit/graph.test.ts` mit synthetischem Graph (erste, freie Mitte, Finale, Nebenquest mit `requires`, `openQuest`, `memorialIf`), `lockedMechanics` nach `storyCount`, gesperrte Klassen-Aktion bis zum Beitritt
  - [x] bestehende Tests von `available`/`next` auf den Graph umstellen

## Dev Notes

- **Quelle:** Architektur §5.4 (Graph, gestaffelte Regeln, `rolesSeen`), §5.3 (Bedingungen, `openQuest`), §8.1–8.3 (Muster), §8.7 (Defaults beim Laden). GDD „Reihenfolge“ und „Gestaffelte Regeln“ (Waffendreieck nach 1, Magie nach 2, Elemente/Status/Runen/Supports nach 3 Story-Missionen).
- **Verfügbarkeit (rein, jedes Mal neu gerechnet):**
  - abgeschlossen → nie verfügbar (nicht wiederholbar, auch Nebenquests).
  - solange keine Story-Mission des Akts abgeschlossen ist: nur `fixed: first`.
  - `fixed: first` danach nie wieder.
  - `fixed: finale`: alle anderen Story-Knoten abgeschlossen und `requires` erfüllt.
  - übrige Story-Knoten: `requires` erfüllt.
  - Nebenquest: per `openQuest` geöffnet **oder** nicht-leere `requires` erfüllt. Ohne beides bleibt sie zu.
  - Reihenfolge = Dateireihenfolge.
- **`storyCount`** zählt nur Knoten mit `kind: story` dieses Akts (vorher alle Knoten).
- **Gedenk-Variante:** Knoten tragen `memorial: { pre?, post? }`; gilt `memorialIf`, ersetzen diese Szenen `pre`/`post`. Die Auswahl macht `nodeScenes(data, c, id)`, die App zeigt nur an.
- **Rollen:** `rolesSeen` = Rollen der Klassen aller Truppenmitglieder, die je beigetreten sind (wird nach jedem Kampagnen-Command und am Missionsende nachgeführt, nie gekürzt). Gesperrt werden nur Kernrollen (`CORE_ROLES`), die noch niemand mitgebracht hat; Gegner-Typen, Taktiker und Hauptmann nie. Die Sperre gilt für alle Teams (die Rolle wird mit dem ersten Gefährten eingeführt). `BattleState.lockedRoles` (fehlt in alten Ständen = nichts gesperrt).
- **Grenze:** Kampfregeln werden nicht geändert; einzig `classActionId` bekommt den optionalen Zustand, um gesperrte Rollen auszublenden.
- **Akt-Übergang** (`act + 1`, `actReached`) bleibt offen, bis Akt 2 existiert.

### Project Structure Notes

- Neu: `src/core/campaign/graph.ts`, `tests/unit/graph.test.ts`.
- Geändert: `src/core/{defs,state,index}.ts`, `src/core/campaign/{campaign,apply,conditions,effects}.ts`, `src/core/battle/{setup,actions}.ts`, `src/content/{schemas,validate}.ts`, `src/persistence/schema.ts`, `src/app/{campaignInfo.ts,state/flow.ts,screens/WorldMap.tsx}`, `content/acts/act1/campaign.yaml`, Tests.

### Project Context Rules

- Spielwerte nur in YAML, kein sichtbarer Text im Code, `src/core` deterministisch und ohne DOM; Coverage von `src/core` nicht senken.
- Fertig erst mit grünem `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build`.

### References

- [Source: concept/24-architecture/architecture.md#5.4 Kampagnen-Graph und Akte]
- [Source: concept/21-gdd/gdd.md#Reihenfolge, Gestaffelte Regeln]
- [Source: concept/26-epics/epics.md#Story 4.3]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Graph rein in `graph.ts`; Verfügbarkeit wird nie gespeichert. `isAvailable` ersetzt in `validateCampaign` die Liste (`finishMission`, `restartTurn`, `restartMission`).
- `replayCampaign` normalisiert den Checkpoint (alte Stände ohne `quests`/`rolesSeen`).
- `lockedRoles` zählt neben `rolesSeen` auch die aktuelle Truppe, damit ein Kampf mit nachträglich eingesetzten Einheiten (Tests, Dev-Helfer) die Rolle nicht sperrt; der Fixture-Kampf in `class-actions.test.ts` hebt die Sperre ausdrücklich auf.
- Weltkarte zeichnet Pfade entlang der `completed`-Voraussetzungen (`nodeLinks`), nicht mehr entlang `next`.
- Akt-1-Inhalt bleibt linear (Prolog → Kapitel 1 → Kapitel 2); freie Mitte, Finale und Nebenquests sind mit synthetischem Graph in `graph.test.ts` geprüft.

### File List

- `src/core/campaign/graph.ts` (neu), `tests/unit/graph.test.ts` (neu)
- `src/core/{defs,state,index}.ts`, `src/core/campaign/{campaign,apply,commands,conditions,effects}.ts`, `src/core/battle/{setup,actions}.ts`
- `src/content/{schemas,validate}.ts`, `src/persistence/schema.ts`
- `src/app/{campaignInfo.ts,state/flow.ts,state/session.ts,screens/WorldMap.tsx}`
- `content/acts/act1/campaign.yaml`
- Tests: `camp`, `core`, `journal`, `restart`, `story`, `scene-view`, `class-actions`, `campaign-commands`, `fault`, `result`, `roles`, `fixtures/saves/generate.ts`
- Doku: `concept/24-architecture/{architecture,decision-log}.md`
