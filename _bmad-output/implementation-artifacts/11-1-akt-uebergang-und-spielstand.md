---
baseline_commit: 6586e7b
---
# Story 11.1: Akt-Übergang und Spielstand

Status: review

## Story

Als Spieler
möchte ich nach dem Finale von Akt 1 mit meinem Spielstand nahtlos in Akt 2 weiterziehen,
damit die Kampagne über die Akte hinweg eine Geschichte bleibt.

## Acceptance Criteria

Quelle: `concept/26-epics/epics/epic-11.md` § Story 11.1 (BDD dort vollständig).

1. **Loader je Akt:** `buildContent` lädt `campaign.yaml`, `units.yaml` und `flags.yaml` aller vorhandenen Akt-Ordner; `GameData.acts: Record<number, CampaignDef>`, `actCampaign(data, c)` liefert den laufenden Akt, `findNode(data, id)` sucht über alle Akte; keine Lesestelle von `data.campaign` bleibt. `content:check` meldet doppelte Gefährten-, Flag- und Knoten-IDs über Akte; Leutnant-Heimsuchungen nutzen `data.hauntPools[lt.act]`.
2. **Übergang:** Sieg im Finale + Akt n+1 freigeschaltet (Paket `act<n+1>` `released: true`) → `finishMission` setzt `c.act = n + 1` und meldet `actReached { act }`; sonst bleibt alles wie in 7.3. Kopfdateien von Akt 2 nicht in `core`. `content:check` erlaubt ab Akt 2 Knoten ohne Karte; die Weltkarte bietet sie nicht an und zeigt „Weitere Missionen folgen“, solange kein offener Knoten eine Karte hat. Replays und `simCampaign.ts` führen den Übergang ebenso aus; Eingriffe in `apply.ts`/`commands.ts` klein.
3. **Alte Spielstände:** `normalizeCampaign` füllt `c.act` (1) und holt den Übergang nach; Truppe, Gold, Tross, Flags, Groll, Gedenksteine bleiben; ohne Finale bleibt Akt 1. Fixture `tests/fixtures/saves/format<n>-act1-finale-done.json` ist ein echter Spielstand; `metaFromCampaign` liefert `c.act`.
4. **Werte je Akt:** bei `c.act = 2` gelten `levelCap` 20, `mechanics: {}`, Händlerstufen und `storyCount` von Akt 2; `availableNodes` = Story-Knoten des Akts + Nebenquests aller Akte bis `c.act`; Heimat und Räume bleiben; `rooms.yaml` bekommt bei Schmied, Heiler, Taverne, Lagerfeuer `any: [{ act: 2 }, { storyCount: { min: n } }]`, Test: kein Raum schließt.
5. **Akt-2-Dateien:** `campaign.yaml` (`act: 2`, `levelCap: 20`, `mechanics: {}`, `home: castle`, `defaultPlace: grauwacht`, Narben wie Akt 1, `nodes: []`, Händler Stufe 0), `units.yaml` (jory, ilka, odile, amos, nell, brann, sable mit Namen DE/EN), `flags.yaml` (Platzhalter aus 11.10 bleiben bis 11.5).
6. **Tests und Doku:** `tests/unit/act-transition.test.ts` (Übergang, gesperrter Übergang, Replay, offene Nebenquests, Werte je Akt, Räume, doppelte IDs); Coverage `src/core` sinkt nicht; Architektur §5.4/§5.5/§5.14 „Stand (Story 11.1)“.

## Tasks / Subtasks

- [x] `src/core/campaign/acts.ts`: `actOf`, `campaignOfAct`, `actCampaign`, `findNode`, `nodeAct`, `nodesUpTo`, `actUnlocked`, `scarDef` (AC 1)
- [x] `GameData.acts` + `releasedActs`, `CampaignState.act`, `BattleState.act` (nur ab Akt 2), Event `actReached` (AC 1, 2)
- [x] Graph: `storyCount`/`actFinished` je Akt, `enterNextAct`, `availableNodes` mit Nebenquests früherer Akte (AC 2, 4)
- [x] `finishMission` ruft `enterNextAct` (eine Zeile), `normalizeCampaign` füllt `act` und holt nach, `newCampaign` setzt `act: 1` (AC 2, 3)
- [x] Werte je Akt: `levelCap(data, act)`, `grantExp(…, act)`, `merchantStock(data, tier, act)`, `currentTier`, `maxCharges`/`applyVillageAid` mit Akt, `shopPrice`, Heimsuchungen (AC 4)
- [x] Loader (`buildContent`, `mergePackContent`), `releasedActs` aus `packs.yaml` (Node) bzw. Paketliste (Browser), `checkPacks`-Regel gegen Kopfdateien in core (AC 1, 2)
- [x] `content:check`: doppelte IDs, Platzhalter-Knoten ab Akt 2, `fixed: first` nur mit Knoten, Weltkarte über alle Akte, Locales je Akt (AC 1, 2)
- [x] App: Weltkarte (`mapInBuild`, Akt-Band, Nebel je `c.act`), Lager, Backup-Blatt, Packs, Flow, `metaFromCampaign` (AC 2, 3)
- [x] Akt-2-Kopfdateien, Namen in `acts/act2/locales/`, `act.2.season`, `rooms.yaml` (AC 4, 5)
- [x] Tests (`act-transition.test.ts`, bestehende Tests auf `data.acts[1]` umgestellt), Fixture, Architektur (AC 3, 6)

## Dev Notes

- **Freischaltung:** Der Kern kennt keine Paketliste; `GameData.releasedActs` trägt sie hinein (Node: `releasedActsOnDisk` aus `content/packs.yaml`, Browser: `packActs(virtual:hc-packs)`). Act 2 ist `released: false`, also bleibt in Simulation, Tests und Build alles bei Akt 1, bis 11.3 das Paket nach 9.14 veröffentlicht. Tests schalten mit `releasedActs: [1, 2]` frei.
- **Paket noch nicht geladen:** Im Browser kommt `acts/act2/campaign.yaml` erst mit dem Paket act2. `campaignOfAct` setzt bis dahin den Vorakt ohne Knoten ein (Stufendeckel, Händler, Narben bleiben benutzbar).
- **Akt 1 unverändert:** `BattleState.act` fehlt in Akt 1 (Startzustände und Prüfsummen bleiben), `merchantStock`, `levelCap`, `hauntGold` haben Akt 1 als Standard; Sim-Diff gegen main siehe Completion Notes.
- **Bewusst offen gelassen (Folge-Stories):** Positionsstufe und `__hc.devMap(…, 2)` (11.2), Titeltafel, Paket-Schalter, Nachladen des Pakets direkt nach dem Übergang (11.3), Leutnant Sable, Supports, Flags, endgültige Werte der Gefährten (11.5), Knoten von Akt 2 (11.11). Dev-, Lab- und Sim-Werkzeuge lesen weiter Akt 1 (`data.acts[1]!`).

### References

- `concept/26-epics/epics/epic-11.md` (Story 11.1, Stückweise live, Datei-Zuständigkeit)
- `concept/24-architecture/architecture.md` §5.4, §5.5, §5.14, §5.15
- `AGENTS.md` (Akt-Release, Speicherformat)

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `pnpm sim --campaign act1 --runs 50 --json` auf main (6586e7b) und auf dem Branch, `pnpm sim:diff`.

### Completion Notes List

- Werte der Akt-2-Gefährten sind `[ASSUMPTION]`: Akt-1-Figur derselben Klasse bis zur Stufe des Entwurfs fortgeschrieben; Ilka trägt `iron_bow` statt des Entwurfs-`hunting_bow` (die Gruppe `light_bow` darf ein `marksman` nicht führen). 11.5 legt sie fest.
- Händler von Akt 2 `[ASSUMPTION]`: Stufe 0 aus vorhandenen Eisen-/Stahlteilen, Heilung und Rüstung.
- `hauntGold(data, act)` mittelt ab Akt 2 die Story-Karten aller Akte bis dahin; `hauntLevel` nimmt den letzten erledigten Story-Knoten über alle Akte (kein Rückfall auf Stufe 1, vorgezogen aus 11.2).

### File List

Neu: `src/core/campaign/acts.ts`, `content/acts/act2/campaign.yaml`, `content/acts/act2/units.yaml`, `content/acts/act2/locales/de.names.yaml`, `content/acts/act2/locales/en.names.yaml`, `tests/unit/act-transition.test.ts`, `tests/fixtures/saves/format3-act1-finale-done.json`, `tests/fixtures/saves/generate-act1-finale.ts`.
Geändert (Auswahl): `src/core/gameData.ts`, `state.ts`, `defs.ts`, `index.ts`, `campaign/{graph,apply,campaign,commands,conditions,haunts,aid,camp,chronicle,effects}.ts`, `battle/{setup,act,hauntBattle}.ts`, `rules/{progression,items,stats,combat}.ts`, `src/content/{load,node,browser,packs,ids,validateCampaign,validateLocales,validateRefs,validateUnits}.ts`, `src/packs/plan.ts`, `src/persistence/save.ts`, `src/app/…` (WorldMap, Camp, Rooms, Prep, BackupSheet, packs, flow, toneTest, devHooks, campaignInfo, toneTestPlan), `src/ui/ConsequenceCard.tsx`, `src/lab/scenario.ts`, `tools/{simulate,simCampaign,simMap,bench-ai,content-check}.ts`, `tools/levels/atlas.ts`, `content/core/rooms.yaml`, `content/core/locales/{de,en}.names.yaml`, `concept/24-architecture/architecture.md`, Tests unter `tests/` (`data.campaign` → `data.acts[1]!`).

### Change Log

- 2026-11-08: Story angelegt und umgesetzt (Akte je Ordner, Übergang, Spielstand), Status review.
