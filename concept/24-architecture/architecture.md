---
title: 'Game Architecture – Staffel 1 (Delta)'
project: 'Hollow Crown'
date: '2026-10-23'
author: 'Marvin'
version: '1.0'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
status: 'complete'
source: 'BMAD-Workflow gds-game-architecture'
gdd: 'concept/21-gdd/gdd.md'
epics: 'concept/26-epics/epics.md'
brief: 'concept/20-game-brief/brief.md'
narrative: 'concept/22-narrative/narrative.md'
art: 'concept/23-art-direction/art-direction.md'
decisions: 'concept/24-architecture/decision-log.md'
base: 'concept/10-tech-architecture.md'
supersedes: 'concept/10-tech-architecture.md §2 (Modulstruktur), §6 (Speichern), §9 KI-Budget-Hinweis; T9 aus 01-decisions.md'
---

# Game Architecture – Hollow Crown, Staffel 1 (Delta)

> **Delta-Dokument.** `concept/10-tech-architecture.md` bleibt gültig, wo dieses Dokument schweigt (Stack, Command/Event-Prinzip, Determinismus, Rendering-Grundlagen, i18n, Tools). Hier steht, was Staffel 1 neu braucht oder anders macht. Wo beide widersprechen, gilt dieses Dokument. Herleitungen stehen in `decision-log.md`. **[A]** = vom Produktinhaber gewählt, **[C]** = vom Assistenten gesetzter Default. IDs `AR1` ff. sind die Architekturentscheidungen dieser Etappe.

## 1. Executive Summary

Hollow Crown bleibt ein **Browser-Spiel auf eigenem Stack** (TypeScript, Vite, Babylon.js, Preact) mit reinem, deterministischem Regelkern. Staffel 1 verzehnfacht den Inhalt des Proof of Concept und fügt eine Kampagnenebene hinzu, die über Wochen und mehrere Releases läuft. Daraus folgen die Kernentscheidungen:

- **Zwei Command-Ebenen** (AR2): Neben dem Kampf läuft auch die Kampagne (Weltkarte, Heimat, Händler, Entscheidungen, Tageswechsel) über Commands mit Log. Die ganze Kampagne ist abspielbar und simulierbar.
- **Bedingungen und Wirkungen als Daten** (AR3): Eine kleine, gemeinsame Sprache für `requires` und `effects` trägt Kampagnen-Graph, Szenen, Entscheidungen, Nebenquests und Epilog-Mosaik.
- **Akt-Pakete** (AR15): Shell + Prolog bleiben unter 15 MB; der Rest jedes Akts lädt im Hintergrund nach und ist danach offline verfügbar.
- **Speicherformat 2** (AR16–AR18): bis zu 3 Kampagnen je Gerät, Auto-Save nach jeder Aktion, in Standard/Casual 3 Snapshots je Kampagne, Klassik streng nach Ehrensystem; PoC-Spielstände werden nicht migriert.
- **Tageswechsel um 04:00 Ortszeit** (AR6) als Command mit Tagesnummer; der Kern sieht nie eine Uhr. Heimsuchungen entstehen rein aus Seed, Tag und handgesetzten Ankern je Karte (AR7).
- **Gegner-KI im Web Worker** von Anfang an (AR14); der Worker führt dieselben reinen Kernfunktionen aus.
- **Eine Engine, drei 3D-Szenen** (AR12, AR13): Brett, Weltkarte und Heimat teilen Gelände-, Figuren- und Modellcode.

**Bereit für:** `gds-create-epics-and-stories` mit einem neuen technischen Fundament-Epic **E0** vor E1 (siehe §9).

## 2. Projektkontext

### 2.1 Systeme, die Architektur brauchen

| System | Quelle | Neu oder PoC | Komplexität |
|---|---|---|---|
| Kampfkern (Phasen, Formeln, Dreieck, Elemente, Status, Supports, Tod-Modi) | GDD Game Mechanics | PoC, erweitert | mittel |
| Rollenklassen, Klassen-Aktionen, Profi-Wege | GDD Rollenklassen | neu (ersetzt Waffenklassen) | hoch |
| Leutnants (Flucht, Groll, Skalierung, Kopfgeld) | GDD Leutnants | neu | hoch |
| Kampagnen-Graph mit freier Reihenfolge, gestaffelte Regeln | GDD Kampagnenstruktur, Narrative Missionsfolge | neu | mittel |
| Weltkarte, Tageswechsel, Heimsuchungen | GDD Welt und Erkundung | neu | hoch |
| Szenen mit Sprecherketten, Entscheidungen, Haltung, Epilog-Mosaik | Narrative Branching Dialogue | neu | hoch |
| Heimat (Lager zu Beginn von Akt 1, Burg ab Mission 1-6, 11 Räume und Ausbau ab Akt 2) | GDD Heimat | PoC-Lager, stark erweitert | mittel |
| Fortschritt (Deckel, Glutfunke, Verbluten, Übungsplatz, Lektionen) | GDD RPG | teils PoC | mittel |
| Speichern, Klassik-Regeln, Übertrag über Akt-Releases und in Staffel 2 | GDD Reproduzierbarkeit | PoC, neu gefasst | hoch |
| Auslieferung in Akt-Paketen, offline | GDD Leistungsanforderungen | neu | hoch |
| 3D-Szenen Weltkarte und Burg, Chibi-Figuren | Art Direction §4, §6, §7 | neu | mittel |

### 2.2 Plattform und Rahmen

- **Plattform:** 1. Handy-Browser im Hochformat (PWA), 2. Tablet/PC-Browser mit Maus, 3. später Capacitor. Kein Server, kein Konto, kein Netzwerkspiel; Netz nur für Auslieferung und Updates.
- **Leistung:** 60 FPS auf Pixel 6a / iPhone 12 über eine komplette Gegnerphase einer großen Schlacht (24×32, ~40 Einheiten); Kaltstart < 5 s; Shell + Prolog < 15 MB (gzip); KI < 300 ms je Gegnereinheit.
- **Team:** ein Entwickler mit KI-Agenten. Die Architektur muss vor allem verhindern, dass verschiedene Agenten dieselbe Sache unterschiedlich lösen.

### 2.3 Komplexitätstreiber und neuartige Konzepte

1. **Lange Kampagne über mehrere Releases:** Ein Spielstand lebt von Akt 1 bis zum Staffelende; Staffel 2 liest nur die Staffel-Zusammenfassung. IDs, Flags und Speicherformat müssen über die Akt-Releases stabil bleiben (AR19, AR20).
2. **Zeit im deterministischen Kern:** Heimsuchungen hängen am Kalendertag, der Kern darf keine Uhr lesen (AR6).
3. **Permadeath trifft verzweigte Story:** Jede Zeile eines Gefährten braucht eine Ersatzkette; Bedingungen über Leben, Flags, Haltung und Supports (AR3, AR9).
4. **Wiederkehrende Feinde ohne Nemesis-Patent:** feste Leutnant-Liste, nur Zahlen skalieren, nichts wird prozedural erzeugt (AR5).
5. **Content-Menge eines Solo-Projekts:** 36 Karten, ~4 650 Dialogboxen je Sprache, ~50 3D-Figuren; alles als Daten mit Schema und Prüfwerkzeug.

## 3. Engine und Stack

**Entscheidung AR1 [C]: Stack bleibt.** Eine Engine-Neuwahl (Godot, Unity, Phaser) steht nicht zur Debatte: Der PoC hat Kampfgefühl, 3D-Brett und Bedienung im Browser bestätigt, und der reine TS-Kern ist das wertvollste Teil des Projekts. Versionen laut Lockfile (Stand 2026-10-23), keine neuen Laufzeitabhängigkeiten:

| Bereich | Paket | Version | Rolle in Staffel 1 |
|---|---|---|---|
| Sprache | TypeScript (strict, `noUncheckedIndexedAccess`) | 6.0.3 | unverändert (T11) |
| Build | Vite | 8.3.5 | + Paket-Plugin (AR15), + Worker-Bundle (AR14) |
| 3D | `@babylonjs/core`, `loaders`, `materials` | 9.32.0 | Brett, Weltkarte, Heimat |
| UI | Preact + `@preact/signals` | 10.29.8 / 2.11.3 | alle Screens, Visual Novel |
| Daten | `yaml`, Zod | 2.9.1 / 4.6.7 | Content-Schemas, Save-Import |
| Persistenz | `idb` | 8.0.4 | Speicherformat 2 |
| PWA | `vite-plugin-pwa` (Workbox 7.4) | 2.0.0 | Precache Kern + Laufzeit-Caches je Paket |
| Tests | Vitest / Playwright | 5.0.5 / 1.64.1 | + Golden-Replays, Kampagnen-Sim, KI-Benchmark |

Was der Stack nicht mitbringt und hier selbst gebaut wird: Szenen-Host für drei 3D-Szenen, Paket-Manager, Kampagnen-Command-Ebene, Bedingungssprache, Worker-Protokoll.

## 4. Entscheidungsübersicht

> Die Spalte „Epics“ nutzt die Nummern aus `concept/26-epics/epics.md` (Epic 1–12, nachgetragen 2026-10-23). „E1–E12“ bezeichnet in GDD und Narrative die Story-Entscheidungen, nicht Epics.

| ID | Kategorie | Entscheidung | Epics | Status |
|---|---|---|---|---|
| AR1 | Stack | Stack und Versionen bleiben, keine neuen Laufzeitabhängigkeiten | alle | C |
| AR2 | Zustand | Zwei Command-Ebenen: Kampf (`Command`) und Kampagne (`CampaignCommand`), beide mit validate → apply → Events | Epic 1, 4–6 | **A** |
| AR3 | Daten | Gemeinsame Bedingungs- und Wirkungssprache (`requires`, `effects`) im Kern | Epic 3–6 | C |
| AR4 | Kampagne | Verfügbarkeit von Knoten wird aus Bedingungen abgeleitet, nicht gespeichert; Akt-Fortschritt = Zahl abgeschlossener Story-Missionen | Epic 4 | C |
| AR5 | Leutnants | Feste Leutnant-Liste im Content, Zustand in `CampaignState.lieutenants`, Flucht als Kernregel | Epic 3 | C |
| AR6 | Zeit | Tageswechsel **04:00 Ortszeit**; die App liefert die Tagesnummer per `advanceDay`; Uhr zählt nur vorwärts | Epic 5 | **A** / C |
| AR7 | Heimsuchungen | **Handgesetzte Anker** je Karte, Generator rein aus Seed + Tag + Zustand | Epic 5 | **A** |
| AR8 | Klassen | Rollen-Datenmodell; Klassen-Aktionen als Aktionen bzw. passive Regeln im Kern, jede mit Vorschau | Epic 2 | C |
| AR9 | Dialog | Szenen-Schema 2: **deutscher Text in der Szene**, Sprecherketten, Bedingungen je Zeile, Auflösung im Kern | Epic 4, 9, 11, 12 | **A** / C |
| AR10 | Story-Zustand | Flag-Register je Akt; Entscheidungen, Haltung, Chronik und Epilog datengetrieben | Epic 4 | C |
| AR11 | Heimat | Räume als Daten (`rooms.yaml`), Ausbau und Nutzung als Kampagnen-Commands | Epic 6, 10 | C |
| AR12 | Rendering | Eine Babylon-Engine, ein Canvas, drei Szenen-Module; immer nur eine Szene aktiv, geteilter Asset-Cache | Epic 5, 6, 8, 10 | C |
| AR13 | Weltkarte | Weltkarte als Kachelraster in YAML, gebaut mit `terrain3d`; Orte als Miniatur-Modelle mit Varianten | Epic 5, 8 | C |
| AR14 | KI | **Gegnerphase im Web Worker von Anfang an**; der Worker führt `applyCommand` des reinen Kerns aus | Epic 2 | **A** |
| AR15 | Auslieferung | Pakete `core` (Shell + Regeln + Prolog), `act1`, `act2`, `act3`, Stimmen je Sprache getrennt; **Hintergrund-Download**, offline gecacht | Epic 7, 9, 11, 12 | **A** |
| AR16 | Speichern | Format 2: **bis zu 3 Kampagnen**, je Auto-Save; Standard/Casual + 3 Snapshots je Kampagne; Klassik nur Auto-Save; Journal getrennt | Epic 1 | **A** |
| AR17 | Migration | PoC-Spielstände: **sauberer Schnitt**, erkannt und exportierbar, nicht ladbar | Epic 1 | **A** |
| AR18 | Klassik | **Ehrensystem:** Export außerhalb des Kampfs, Import nur vom Titelbildschirm, überschreibt | Epic 1 | **A** |
| AR19 | Stabilität | Content-IDs sind nach einem Release gesperrt (`content/released-ids.json`), Umbenennen nur mit Migration | Epic 7, alle Content-Epics | C |
| AR20 | Staffel 2 | Staffel 2 startet neu und liest nur die Staffel-Zusammenfassung (Ende, Haltung, Überlebende, Entscheidungen) aus dem Spielstand oder dem eigenen Export | Epic 4, 12 | C |
| AR21 | Speicherschutz | `navigator.storage.persist()`, Installationshinweis, Backup-Erinnerung | Epic 1 | C |
| AR22 | Fehler | Kern meldet Spielerfehler per `validate`, Invarianten per Ausnahme; App fängt, bietet Fehlerbericht, lädt den letzten Auto-Save | Epic 1 | C |
| AR23 | Release | Veröffentlichte Akte stehen in `content/packs.yaml` (`released`); unveröffentlichte Pakete kommen nicht in den Build | Epic 7, 9, 11, 12 | C |

## 5. Architektur im Detail

### 5.1 Schichten

Die Abhängigkeitsregel aus `10` §2 bleibt und wird um zwei Schichten ergänzt:

```
core      ← nichts (rein, deterministisch)
content   ← core (Typen)
render    ← core, content
ui        ← core, content, i18n
worker    ← core, content            (NEU, AR14)
packs     ← content                  (NEU, AR15: Laden, Cache, Fortschritt)
persistence ← core (Typen)
app       ← alles (Controller, Screens, Store)
tools     ← core, content (Node)
```

ESLint-Schichtregeln (`eslint.config.js`) bekommen Einträge für `worker` und `packs`. `src/core` bleibt frei von DOM, Babylon, Preact, `Math.random` und `Date.now`.

### 5.2 Zwei Command-Ebenen (AR2) [A]

```
                 ┌──────────── Kampagne ────────────┐
UI ─CampaignCommand─▶ validateCampaign(c, cmd) ─ok─▶ applyCampaign(c, cmd) ─▶ c' + CampaignEvent[]
                 │                                                     │
                 │  startMission ─▶ createBattle(c, node, deploy) ─▶ BattleState
                 │                       ┌──────── Kampf ────────┐
                 │  UI/Worker ─Command─▶ validate(s, cmd) ─▶ apply(s, cmd) ─▶ s' + GameEvent[]
                 │                       └───────────────────────┘
                 │  finishMission{node} ─▶ finishBattle(c, s) ─▶ c' + Ergebnis
                 └───────────────────────────────────────────────┘
```

- **`CampaignCommand`** (plain JSON, Beispiele): `advanceDay{day}`, `startMission{node, deploy[]}`, `finishMission{}`, `abandonMission{}`, `choose{scene, line, option}`, `seeScene{scene}`, `buy{item}`, `sell{uid}`, `equip{unit, uid, slot}`, `upgrade{uid}`, `reroll{uid, index}`, `rune{op, …}`, `healScar{unit, index}`, `hire{offer}`, `buildRoom{room}`, `promote{unit, classId}`, `setLoadout{unit, skills}`, `craft{recipe}`, `inheritLesson{from, to, lesson}`, `unlockSupport{pair, rank}`, `rename{…}`.
- `validateCampaign` liefert strukturierte Fehler wie `validate` im Kampf (`not_enough_gold`, `room_locked`, `companion_missing`, `not_allowed_in_mode` …).
- **`CampaignEvent`**: `goldChanged`, `itemGained`, `companionJoined`, `companionLeft`, `grudgeChanged`, `questOpened`, `hauntSpawned`, `hauntExpired`, `roomBuilt`, `promoted`, `lessonInherited`, `flagSet`, `stanceChanged`, `actReached`, `seasonEnded`. Die UI zeigt Folgen daraus an („Folgen werden immer sichtbar gemacht“, Narrative).
- `src/core/campaign/camp.ts` wird in Command-Handler zerlegt; die heutigen Funktionen (`buy`, `upgrade`, `promoteUnit` …) werden zu Handlern von `applyCampaign`. Rechenhilfen wie `upgradeCost` bleiben exportiert (Vorschau = gleicher Code, Konvention aus AGENTS.md).
- **Journal:** Jedes angewendete Kampagnen-Command wird mit laufender Nummer in den IndexedDB-Store `journal` geschrieben; `finishMission` enthält das vollständige Kampf-Command-Log. Startzustand + Journal ergibt die Kampagne exakt neu, solange die Content-Version gleich ist. Bei einem App-Update schreibt die App einen **Checkpoint** (voller `CampaignState`) ins Journal; Replays beginnen am letzten Checkpoint.

### 5.3 Bedingungen und Wirkungen (AR3)

Eine Sprache für alles, was „wenn“ oder „dann“ in Content braucht: Knoten, Szenen, Zeilen, Antworten, Nebenquests, Leutnant-Zeilen, Epilog-Kacheln, Raumausbau.

**Bedingung** = Objekt mit genau einem Schlüssel; eine Liste bedeutet UND.

| Schlüssel | Wahr, wenn | Beispiel |
|---|---|---|
| `flag` | Flag hat den Wert (oder ist gesetzt bei `true`) | `{ flag: { e02: protect } }` |
| `alive` / `dead` / `left` | Gefährte lebt und ist in der Truppe / ist gefallen / ist gegangen | `{ alive: liora }` |
| `completed` | Knoten abgeschlossen | `{ completed: m1_3 }` |
| `storyCount` | Zahl abgeschlossener Story-Missionen im Bereich | `{ storyCount: { min: 3 } }` |
| `act` | aktueller Akt ≥ Wert | `{ act: 2 }` |
| `support` | Paar hat mindestens den Rang | `{ support: { pair: [brenna, kael], rank: B } }` |
| `stance` | vorherrschende Haltung des Avatars | `{ stance: warm }` |
| `met` | Leutnant schon begegnet | `{ met: hask }` |
| `chronicle` | Chronik-Seiten gesammelt (Anzahl oder Liste) | `{ chronicle: { min: 12 } }` |
| `any` / `not` | Oder-Verknüpfung / Negation | `{ any: [ { alive: liora }, { alive: ysolde } ] }` |

**Wirkung** = Objekt mit genau einem Schlüssel; nur in `effects` von Antworten, Knoten-Belohnungen und Nebenquests.

| Schlüssel | Bedeutung |
|---|---|
| `setFlag` | `{ setFlag: { e03: spare } }` |
| `recruit` / `leave` | Gefährte tritt bei / geht (Avatar und Kael nie, Schema verbietet es) |
| `grudge` | `{ grudge: { lt: hask, delta: -1 } }`, begrenzt auf 0–3 |
| `gold`, `material`, `item` | Belohnungen |
| `priceMod` | `{ priceMod: { pct: -10, act: 2 } }` |
| `villageAid` | Heiltrank +1 Ladung für einen Akt |
| `openQuest` | Nebenquest-Knoten wird verfügbar |
| `stance` | `{ stance: warm }` zählt für das Haltungsprofil |
| `chronicle` | Chronik-Seite erhalten |
| `setHome` | `{ setHome: castle }` wechselt `c.home.kind`; die Räume behalten ihre Stufe (Course Correction 2026-10-23: Burg ab 1-6) |

- Auswertung: `evalCondition(ctx, cond): boolean` und `applyEffects(c, effects, events)` in `src/core/campaign/conditions.ts` bzw. `effects.ts`. `ctx` ist eine schmale Sicht (`flags`, `roster`, `fallen`, `left`, `completed`, `supports`, `stance`, `lieutenants`, `chronicle`), damit dieselbe Funktion in Kampf und Kampagne läuft.
- Zod-Schema `conditionSchema`/`effectSchema` in `src/content/schemas.ts`; `content:check` prüft alle Referenzen (Gefährte, Knoten, Flag, Leutnant, Paar) gegen das Register.
- **Stand (Story 4.2):** umgesetzt sind alle Bedingungen außer `met` und die Wirkungen `setFlag`, `recruit` (Gefährte), `leave`, `gold`, `material`, `item`, `stance`, `chronicle`. Schema und Tabellen gelten vollständig; `grudge`, `priceMod`, `villageAid`, `openQuest`, `setHome`, `recruit: { lt }` und `met` lehnt `content:check` mit „not yet supported“ ab, bis der Zustand dazu existiert (Epic 3, 5, 6, Story 4.3). Wirkungen laufen im Command `effects { effects }`; `leave` legt die Ausrüstung des Gefährten in den Tross. **Story 4.3:** `openQuest` ist umgesetzt (`c.quests`, Event `questOpened`, nur Nebenquest-Knoten).

### 5.4 Kampagnen-Graph und Akte (AR4)

Je Akt eine `campaign.yaml` im Akt-Paket. Knoten haben eine Art und Bedingungen; was verfügbar ist, rechnet `availableNodes(data, c)` jedes Mal neu aus. Das ersetzt `CampaignState.available` und `next`-Listen.

```yaml
# content/acts/act1/campaign.yaml
act: 1
season: late_summer
levelCap: 10
mechanics: { triangle: 1, magic: 2, elements: 3, status: 3, runes: 3, supports: 3 }   # storyCount, ab dem die Regel gilt
nodes:
  - { id: prologue, kind: story, map: m1_0_paktnacht, fixed: first, pre: scn.a1.prologue.pre, post: scn.a1.prologue.post }
  - { id: m1_1, kind: story, map: m1_1_steckbriefe, requires: [{ completed: prologue }] }
  - { id: m1_2, kind: story, map: m1_2_erlbach, requires: [{ completed: m1_1 }] }
  - { id: m1_6, kind: story, map: m1_6_paktwacht, requires: [{ completed: m1_2 }, { completed: m1_3 }, { completed: m1_4 }, { completed: m1_5 }], effects: [{ setHome: castle }] }
  - { id: m1_7, kind: story, map: m1_7_gewoelbe, requires: [{ completed: m1_6 }] }
  - { id: m1_8, kind: story, map: m1_8_paktwacht_halten, fixed: finale }   # öffnet sich, wenn alle anderen Story-Knoten des Akts erledigt sind
  - { id: n1, kind: side, map: n1_ring, requires: [{ flag: { e02: protect } }], memorialIf: { dead: fenn } }
home: camp          # Startwert des Akts; m1_6 wechselt per setHome auf castle
worldRegion: borderland
```

- `fixed: first` ist nur ohne erledigte Story-Knoten des Akts verfügbar, `fixed: finale` erst nach allen anderen; Akt 1 bildet die feste Folge ab der Eroberung (1-6 → 1-7 → 1-8) und Akt 3 die ab der Krönung über `requires` ab.
- Story-Knoten sind nach dem Abschluss nicht wiederholbar; Nebenquests bleiben über Akte offen; ein gefallener Auslöser schaltet die Gedenk-Variante (`memorialIf`) statt die Quest zu sperren.
- **Gestaffelte Regeln:** `lockedMechanics(data, c)` zählt `storyCount` (nur `kind: story`) statt Knotenpositionen; `mechanics` nennt je Regel die Zahl. Klassen-Aktionen einer Rolle gelten, sobald der erste Gefährte dieser Rolle beigetreten ist (`c.rolesSeen`, `BattleState.lockedRoles`).
- **Stand (Story 4.3):** umgesetzt in `src/core/campaign/graph.ts` (`availableNodes`, `isAvailable`, `nodeScenes`, `lockedMechanics`, `lockedRoles`, `nodeLinks`). Knoten: `kind` (Standard `story`), `fixed`, `requires`, `memorialIf` mit `memorial: { pre?, post? }` (Gedenk-Szenen). Eine Nebenquest öffnet sich über `openQuest` oder eigene, nicht leere `requires`; ohne beides lehnt `content:check` sie ab. Der Akt-Übergang (`act + 1`, `actReached`) folgt mit Akt 2.
- **Akt-Übergang:** Nach dem Akt-Finale setzt `finishMission` `act + 1` und meldet `actReached`. Fehlt das Paket des nächsten Akts im Build (AR23), zeigt die Weltkarte „Akt 2 erscheint bald“. Heimsuchungen, Nebenquests, Supports und Heimat laufen weiter.

### 5.5 Leutnants (AR5)

- **Content:** `content/acts/actN/lieutenants.yaml` mit `id`, `nameKey`, `portrait`, `model`, `class`, `faction`, `signatureItem`, `grudgeSkills[3]`, `lines` (Szenen-IDs für erste Begegnung, Groll 1–3, Flucht ×3, Gedenk-Spott, Seitenwechsel). Genau 12 Einträge in Staffel 1, `content:check` prüft das. Nichts davon wird erzeugt (Nemesis-Patent, GDD Risiken).
- **Kampagnenzustand:** `c.lieutenants[id] = { met, grudge, target?, routs, signatureDropped, joined? }`.
- **Auf der Karte:** Map-Einheiten tragen `lieutenant: hask`. `createBattle` setzt Stufe = effektiver Durchschnitt der 6 stärksten Einheiten + `grudge`, Ausrüstungs-Tier + `grudge`, schaltet `grudgeSkills[0..grudge-1]` frei und gibt der KI das Groll-Ziel (+20).
- **Flucht:** Fällt ein Leutnant auf 0 TP, setzt `apply` `gone: 'fled'` statt niedergestreckt/tot und meldet `fled{unit, by}`. Ziele `boss` und `rout` zählen `fled` als besiegt. `previewAttack` liefert `outcome: 'flees'`, die UI zeigt „flieht“.
- **Nach der Mission:** `finishBattle` erhöht `routs`, setzt `grudge = min(3, grudge + 1)` und `target` auf den Vertreiber; Kopfgeld und Signatur-Drop laut `balance.yaml` (`lieutenant.bounty`, `lieutenant.signature`) aus dem Kampf-RNG. Stirbt das Ziel, bleibt `target` bis zur nächsten Vertreibung; die Szene wählt die Gedenk-Spottzeile über `{ dead: <target> }`.
- **Seitenwechsel** (Grosk, Sable, Mael): Wirkung `recruit` + Flag `joined`; der Leutnant erscheint danach nicht mehr in Heimsuchungen.

### 5.6 Tageswechsel und Heimsuchungen (AR6, AR7)

**Tagesnummer (App):**

```ts
// src/app/day.ts – einzige Stelle mit Wanduhr für die Kampagne
export function dayNumber(now = Date.now(), resetHour = 4): number {
  const d = new Date(now);
  const date = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  return d.getHours() < resetHour ? date - 1 : date;           // vor 04:00 zählt zum Vortag
}
```

Die App schickt beim Öffnen der Weltkarte und beim Fortsetzen `advanceDay{ day: dayNumber() }`. Sommerzeit ändert nichts, weil nur lokales Datum und lokale Stunde zählen (nicht „Zeitstempel − 4 h“, das verschiebt den Wechsel in den Umstellungsnächten um eine Stunde).

**Kern (`src/core/campaign/haunts.ts`):**

- `c.day = { last, pending }`. Ist `day ≤ last`, passiert nichts (zurückgestellte Uhr erzeugt nichts). Sonst entstehen Tagespakete für höchstens die letzten 3 Tage bis `day`, dann `last = day`.
- Kein Paket vor der ersten Leutnant-Begegnung (`met` irgendeines Leutnants).
- Je Tagespaket `d`: `rng = seedRng(hash32(c.seed, d))`, 1–3 Heimsuchungen auf **abgeschlossenen Story-Karten mit Ankern**, die gerade nicht heimgesucht sind; Variante aus den Ankern der Karte (nicht dieselbe wie zuletzt); Leutnant aus bereits erreichten Akten, nicht gewechselt. Mehr als 6 offen → die älteste verfällt (`hauntExpired`).
- Gegner aus den Pools des Akts (`content/acts/actN/haunts.yaml`: Gegnertyp × Fraktion × Anteil), Stufe = erwartete Armee-Stufe, Ausrüstungs-Tier des Akts.
- Belohnung und Deckel aus `balance.yaml` (`haunt.goldPct 40`, `expPct 60`, `catchUpExpPct 50`, `halveFromNth 4`); keine Glutfunken.

**Anker je Karte [A]:**

```yaml
# Abschnitt in content/acts/act1/maps/m1_2_erlbach.yaml
haunts:
  - variant: defend
    target: { object: v_mill }            # zu schützendes Dorf
    enemySpawn: { rect: [0, 0, 15, 2] }
    deploy: { rect: [6, 10, 10, 13] }
    turns: 8
  - variant: treasure
    chests: [[2, 3], [13, 4], [7, 1]]
    enemySpawn: { rect: [0, 0, 15, 3] }
    deploy: { rect: [5, 12, 11, 15] }
    turns: 10
```

Jede Story-Karte bekommt 2–3 Anker; `content:check` prüft Erreichbarkeit (Pfad von jedem Einsatzfeld zum Ziel), `pnpm sim --haunt <mapId>:<variant>` prüft die Korridore.

### 5.7 Rollenklassen (AR8)

- **Schema** (`classes.yaml`): `role` (Kernrolle, `tactician`, `captain` oder Gegnertyp), `tier: base|pro|unique`, `moveType`, `mov`, `weaponGroups[]`, `classAction`, `proPaths: [a, b]`, `growth`, `base`, `caps`. Items bekommen `group` (Waffengruppe); `canEquip` prüft `group ∈ weaponGroups`. Bestehendes `weapons: WeaponType[]` entfällt.
- **Aktive Klassen-Aktionen** als neue `Action`-Arten: `aim` (Zielen, nur ohne Bewegung), `cast{at}` (Wirken), `farRescue{target}`, `open{object}`, `steal{target, item}`, `inspire{target}`, `trap{at}`, `disarm{at}`, `command`, `rally` (bestehend).
- **Passive** im Regelcode: Halten in `movement.ts` (Gegner stoppen auf Nachbarfeldern; die KI-Pfadsuche kennt Haltezonen und umgeht sie bei ≤ 2 Feldern Umweg). Nachsetzen als eigenes Command `pursue{unit, to}`, nur direkt nach einem Angriff mit Restbewegung erlaubt; jedes andere Command beendet die Möglichkeit.
- **Vorschau:** `previewAction(state, unit, action)` für jede Aktion, auf demselben Code wie `apply`.
- **Nebel:** `visibleTiles(state, team)` rein im Kern; Render und UI zeigen nur Sichtbares, Events auf unsichtbaren Feldern werden vor dem Abspielen gefiltert (`event.at`/`unit` gegen Sicht).

### 5.8 Szenen und Dialoge (AR9) [A]

Eine Szene je Datei unter `content/acts/actN/scenes/`. Deutscher Text steht in der Szene, Englisch in der Locale-Datei des Akts.

```yaml
# content/acts/act1/scenes/scn.a1.m1_4.post.yaml
id: scn.a1.m1_4.post
background: bg_wolfsbau
music: bgm_campfire
lines:
  - id: l01
    speaker: [liora, ysolde, vesna, avatar]      # Ersatzsprecher-Kette, erster Lebende spricht
    mood: sad
    text: "Diese Zeichen … das ist die alte Paktschrift."
    memorial:                                     # zusätzlich, wenn die erste Figur der Kette tot ist
      speaker: avatar
      text: "Liora hätte das lesen können."
  - id: l02
    requires: [{ flag: { e01: keep } }]
    speaker: mira
    mood: happy
    text: "Erlbach schickt Brot. Und Ärger."
  - id: c01
    choice:
      - { id: spare,  stance: warm,  text: "Wir lassen sie gehen.",   effects: [{ setFlag: { e03: spare } }, { recruit: grosk }, { grudge: { lt: hask, delta: -1 } }] }
      - { id: bounty, stance: sober, text: "Das Kopfgeld gehört uns.", effects: [{ setFlag: { e03: bounty } }, { gold: 600 }] }
```

- **Schlüssel** entstehen automatisch: `dlg.<sceneId>.<lineId>`, `….memorial`, `….<optionId>`. EN steht in `content/locales/en/act1.dialogue.yaml` unter diesen Schlüsseln. UI-Texte bleiben in `content/locales/{de,en}.yaml` (AGENTS.md: kein sichtbarer Text im Code).
- **Auflösung im Kern:** `resolveScene(data, ctx, sceneId, lang?) → ResolvedLine[]` wählt Sprecher, filtert `requires`, fügt Gedenkzeilen ein. Rein und getestet; die UI zeigt nur an. Gilt auch für Sprechblasen im Kampf (Kontext aus `BattleState`).
- **Antworten** gibt es nur außerhalb des Kampfs (Schema: Szenen mit `choice` dürfen nicht von Karten-Triggern ausgelöst werden). Die Wahl ist das Kampagnen-Command `choose`. **Stand (Story 4.6):** Eine Antwort-Zeile mit `title` ist eine Entscheidung (Marke, zwei Tipps, Folgen-Karte, Eintrag in `c.decisions`); jede ihrer Antworten trägt `summary`. `choose` zählt die Haltung jeder Antwort und merkt sie in `c.choices`, eine Wahl wird nie zweimal gefragt.
- **`content:check`:** Box ≤ 110 Zeichen in DE und EN; jede Sprecherkette endet mit `avatar` oder `kael` oder hat `fallback: skip`; EN-Abdeckung 100 % je veröffentlichtem Akt; Stimmungen ∈ {neutral, happy, angry, sad}; Bedingungen referenzieren nur Bekanntes.
- Die PoC-Dialoge sind seit Story 4.4 ins neue Format überführt (`content/acts/act1/scenes/`, IDs `scn.<…>`); das alte Schema entfällt.

### 5.9 Story-Zustand: Flags, Haltung, Chronik, Epilog (AR10)

- **Flag-Register** `content/acts/actN/flags.yaml`: `id`, erlaubte Werte, `kind: decision|story|quest|battle`, `season2: true|false`. Undeklarierte Flags lehnt `content:check` ab.
- `CampaignState.flags` wird `Record<string, string | number | true>` (heute `string[]`). Kampf-Trigger `set_flag` setzen weiter boolesche Flags, nur aus dem Register.
- **Haltung:** `c.stance = { warm, sober, defiant }` (Zähler für warm, nüchtern, trotzig); `dominantStance(c)` entscheidet einen Gleichstand in der festen Reihenfolge warm > sober > defiant.
- **Chronik:** `c.chronicle: string[]` (12 Seiten). **Stand (Story 4.7):** Seiten-Register `content/acts/actN/chronicle.yaml`, `balance.chronicle.seasonPages`; die Ansicht `chronicleView` zeigt je Akt die Entscheidungen (`c.decisions`, Story 4.6) und die gefundenen Seiten.
- **Epilog-Mosaik:** `content/acts/act3/epilogue.yaml` mit Kacheln je Gefährte und Region; jede Kachel hat Varianten mit `requires` (lebt/gefallen/gegangen + Wendung). Die erste passende Variante gewinnt; `content:check` prüft, dass jede Kachel eine Variante ohne Bedingung als letzte hat.

### 5.10 Heimat: Lager und Burg (AR11)

- `content/core/rooms.yaml`: `id`, `function`, `fromAct`, `levels[1..3]` mit `cost`, `requires` (passender Gefährte über AR3), `unlocks` (z. B. `maxUpgrade`, Rezepte, Lagerfeuer-Ränge, Übungsplatz-EP).
- `c.home = { kind: 'camp' | 'castle', rooms: Record<roomId, level> }`. Raumfunktionen prüfen `roomLevel(c, id)`; es gibt keine verstreuten `if (act >= 2)`.
- Der Wechsel vom Lager zur Burg geschieht mitten in Akt 1 über die Wirkung `setHome` an Knoten `m1_6`. Ausbau ab Akt 2 steht in den Daten: Stufe 2 und 3 tragen `requires: [{ act: 2 }]`, Verzauberer, Akademie, Werkstatt und Übungsplatz `fromAct: 2`; die Gedächtnishalle hat `fromAct: 1` (Gedenksteine), ihre Lektionen schaltet `unlocks` erst ab Akt 2 frei.
- Jede Interaktion ist genau ein Kampagnen-Command (≤ 2 Taps, GDD).
- **Supports (Story 4.9):** feste Paare je Akt in `content/acts/actN/supports.yaml` (`core` = S-Kernpaar); das Lagerfeuer schaltet Ränge bis `balance.supports.campfireMaxRank[Stufe − 1]` frei (Lager: B).
- Darstellung: Raum-Anker im Burg-Modell (`home.yaml`: Anker → Raum, Ausbauteile je Stufe, Platz für Gefährten-Gegenstände).

### 5.11 Fortschritt und Wirtschaft

- Stufendeckel aus `campaign.yaml` des Akts (`levelCap`), EP darüber verfallen (`exp`-Event meldet `capped`).
- **Verbluten:** `BattleUnit.bleed` zählt eigene Phasen seit dem Niederstrecken; bei `balance.death.bleedOutTurns` (3) stirbt die Einheit; Zähler in State und Event, damit die UI ihn zeigt.
- **Glutfunke** ist ein Item (`kind: promotion`); `promote` verbraucht ihn, prüft Stufe ≥ 10 und Akademie.
- Übungsplatz, Lektionen der Gedächtnishalle, Händler-Sortiment je Tier, Kopfgeld: alles in `balance.yaml` bzw. `rooms.yaml`, Code liest nur.
- **Simulation:** `pnpm sim --campaign act1` spielt den Akt verkettet (KI auf beiden Seiten, Heimat-Heuristik kauft und wertet auf) und prüft die Korridore je Story-Mission aus dem GDD.

### 5.12 Rendering: eine Engine, drei Szenen (AR12, AR13)

```
src/render/
  host.ts          Engine, Canvas, Qualitätsstufe, FPS-Deckel, aktive Szene wechseln
  shared/          terrain3d.ts, models.ts, figures.ts, assets.ts, camera.ts, season.ts (Jahreszeit/Tageszeit/Wetter aus render.yaml)
  board/           Kampfkarte (heute board.ts, aufgeteilt in scene, overlays, playback, picking)
  world/           Weltkarte: Kachelraster, Orts-Miniaturen, Nebel je Region, Drachenzeichen, Wimpel
  home/            Lager/Burg: Diorama-Modell, Raum-Anker, Ausbauteile, Gefährten-Gegenstände
```

- **Eine Szene aktiv:** Beim Wechsel wird die alte Szene entsorgt (`dispose`), Modelle bleiben im **geteilten Asset-Cache** (glTF als `AssetContainer`, Referenzzählung), damit der Wechsel Brett ↔ Weltkarte nicht neu lädt. Während einer Visual-Novel-Szene läuft der Canvas mit `board.fpsIdle` oder pausiert.
- **Jede Szene hat dieselbe kleine Schnittstelle** wie heute das Brett: `load`, `play(events)`, `setOverlays`, `centerOn`, `relayout`, `quality`, `dispose`. Der Kern kennt keine Szene.
- **Weltkarte** (`content/world/valmora.yaml`): gröberes Kachelraster im Kartenformat (ASCII + Legende) mit `regions` (Akt, Jahreszeit), `locations` (Knoten-ID → Feld, Modell, Varianten mit `requires`), Kamera mit 2 Zoomstufen. Gebaut mit `terrain3d`, dieselben Bodentexturen und Requisiten.
- **Figuren:** Tripo-Modelle nach Art Direction §4.6; Teamtuch über Vertex-Alpha-Maske (wie heute), Leutnant-Markierungen und Verblutungs-Zähler als Overlays. 2D-Sprites bleiben als Option, werden nicht weiterentwickelt.

### 5.13 KI im Web Worker (AR14) [A]

- `src/worker/protocol.ts` definiert Anfrage und Antwort; `src/worker/core.worker.ts` lädt dieselben Content-Pakete wie die App und beantwortet Anfragen mit dem reinen Kern:

```ts
export interface WorkerRequest {
  id: number;
  kind: 'apply';
  packs: string[];
  state: BattleState;
  command: Command;
}

export type WorkerResponse =
  | { id: number; ok: true; state: BattleState; events: GameEvent[] }
  | { id: number; ok: false; error: string; code?: string; details?: Record<string, unknown> };
```

- Der Worker holt die Pakete einer Anfrage über `loaders` aus `virtual:hc-packs`, nicht über `src/packs`; Anfragen laufen nacheinander.
- `handleRequest(data, req)` in `src/worker/handle.ts` ist die eine Rechenfunktion für Worker und Rückfall; sie läuft über `applyCommand`.
- Die App schickt `endPhase` (und damit Gegner- und Dritte-Partei-Phase) an den Worker, Spielerzüge rechnet der Hauptthread direkt. Das Log enthält weiter nur Spieler-Commands; Replays laufen mit oder ohne Worker identisch (Test).
- `ok: false` mit `code` ist eine Regelverletzung (`CoreInvariantError`) und führt zum Fehlerbildschirm. Ohne `code` ist es ein Fehler des Workers; die App rechnet dieselbe Anfrage auf dem Hauptthread.
- Rückfall auf den Hauptthread bei Absturz, `messageerror`, Start-Fehler oder Zeitüberschreitung (30 s, `WORKER_TIMEOUT_MS`). Der Worker wird dann beendet, und die Sitzung bleibt auf dem Hauptthread.
- Die Antwort wird verworfen, wenn der Schlacht-Zustand inzwischen ersetzt wurde (Neustart, Weltkarte, Laden).
- Ein Worker für die ganze Sitzung (`src/app/coreWorker.ts`), eine Anfrage gleichzeitig; Fallback auf synchrone Ausführung, wenn `Worker` fehlt (Tests, alte Browser).
- Benchmark in CI: `pnpm bench:ai` (`tools/bench-ai.ts`) misst die Gegnerphase in Node auf der Referenzschlacht `tests/perf/benchMap.ts` und meldet zusätzlich `ch02_silverbrook`. Budget 300 ms je Gegnereinheit (`TARGETS.aiMsPerUnit`); nur die Referenzschlacht lässt den CI-Schritt scheitern.

### 5.14 Content- und Asset-Pakete (AR15, AR23) [A]

| Paket | Inhalt | Laden | Budget (Transfer, Startwert) |
|---|---|---|---|
| `core` | App-Shell, Regeln (`content/core/`), UI-Texte, Prolog-Karte und -Szenen, Prolog-Figuren, Grundtexturen Spätsommer | Precache beim Installieren | **< 15 MB** (Build bricht ab) |
| `act1` | übrige Akt-1-Karten, Szenen, EN-Dialoge, Figuren, Porträts, Hintergründe, Musik | Hintergrund direkt nach dem ersten Start | ≤ 40 MB |
| `act2`, `act3` | wie `act1`, dazu Herbst- bzw. Wintertexturen, Burg (act2), Drachen (act3) | Hintergrund, sobald der Vorakt erreicht ist | ≤ 40 MB je Akt |
| `voice.<act>.<lang>` | vertonte Zeilen eines Akts in einer Sprache | nur die gewählte Sprache, nach dem Akt-Paket | ≤ 15 MB |

- **Ablage:** `content/core/**`, `content/acts/act1/**` …; `content/packs.yaml` ordnet Dateien per Glob den Paketen zu (z. B. Prolog-Karte und -Szenen aus `acts/act1/` nach `core`), Assets in `public/assets/<pack>/…` mit Manifest je Paket (`public/assets/<pack>/manifest.json`, erzeugt von `pnpm art:build`).
- **Bau:** Ein Vite-Plugin erzeugt je Paket ein virtuelles Modul `virtual:hc-pack/<id>` (alle YAML des Pakets als ein JSON-Chunk) und eine `packs.json` mit Dateiliste, Hash und Größe je Paket. Nur Pakete mit `released: true` in `content/packs.yaml` kommen in den Build.
- **Laden:** `src/packs/` lädt ein Paket, indem es alle Dateien aus `packs.json` in einen Cache `hc-pack-<id>-<hash>` legt; der Service Worker liefert diese Pfade cache-first. `loadPack(id)` importiert danach das Content-Modul und registriert Daten und Locales. Fortschritt als Signal für Weltkarte und Optionen; bei Fehler Wiederholung mit Backoff.
- **Sperre:** Ein Knoten ist startbar, wenn sein Paket vollständig geladen ist; sonst zeigt die Weltkarte den Ladezustand.
- **Updates:** Neuer Hash → nur geänderte Dateien werden neu geholt, alte Caches werden nach Erfolg gelöscht. Die bestehende Update-Abfrage (`src/app/update.ts`) bleibt.
- **Capacitor (später):** Pakete liegen der App bei; der Paket-Manager hat dafür die Quelle `bundled`.
- `tools/check-bundle-size.mjs` misst `core` gegen 15 MB (Abbruch) und meldet die anderen Pakete gegen ihr Budget (Warnung).

### 5.15 Speichern, Format 2 (AR16–AR18, AR20, AR21) [A]

**IndexedDB `hollow-crown`, Version 2:**

| Store | Schlüssel | Inhalt |
|---|---|---|
| `campaigns` | `id` | Meta: Name, Avatar, Tod-Modus, Schwierigkeit, Akt, Story-Fortschritt, Spielzeit, `contentVersion`, `createdAt`, `updatedAt` |
| `saves` | `[campaignId, slot]`, `slot ∈ auto, 1, 2, 3` | `SaveRecord` (Format 2) |
| `journal` | `[campaignId, seq]` | Kampagnen-Command oder Checkpoint (§5.2) |
| `legacy` | `slot` | unverändert übernommene PoC-Stände (nur Export) |

- **Höchstens 3 Kampagnen** je Gerät. Jede hat einen Auto-Save nach jeder Aktion. **Standard/Casual:** zusätzlich 3 manuelle Plätze je Kampagne, speicherbar nur außerhalb des Kampfs. **Klassik:** nur der Auto-Save.
- `SaveRecord = { format: 2, campaignId, slot, createdAt, appVersion, contentVersion, payload }`, `payload = { campaign: CampaignState, battle?: { start, commands, turnStartIndex }, screen }`.
- **Neustart:** Runde neu = Replay von `start` bis `turnStartIndex`; Mission neu = `start`. Beides sind Kampagnen-Commands (`restartTurn`, `restartMission`), die `validateCampaign` in Klassik ablehnt, außer `restartMission` nach einer Niederlage. Damit setzt ein Neustart auch Tode zurück (GDD).
- **Klassik, Ehrensystem [A]:** Export jederzeit außerhalb des Kampfs; Import nur vom Titelbildschirm, er überschreibt die Kampagne gleicher ID. Keine weitere technische Sperre.
- **Export:** JSON mit Prüfsumme, mit `CompressionStream('gzip')` komprimiert, wo verfügbar. Import: Größenlimit 5 MB, Zod-Validierung, Migrationen, dann Prüfung, ob die nötigen Pakete im Build sind.
- **PoC-Stände (Format 1) [A]:** werden beim ersten Start mit Format 2 in `legacy` verschoben, im Laden-Dialog als „Proof of Concept, nicht mehr kompatibel“ gezeigt und lassen sich exportieren. Keine Migration.
- **Migrationen ab Format 2:** `migrations[n]` nur für Spielstände aus veröffentlichten Akt-Releases, jede mit Fixture-Spielstand in `tests/fixtures/saves/` und Test.
- **Staffel 2 (AR20, geändert 2026-10-24):** Staffel 2 startet neu und übernimmt nur die Entscheidungen samt Zusammenfassung; Truppe, Ausrüstung und Burg tragen nicht weiter. Bei der Wahl E12 schreibt `choose` zusätzlich `c.archive.s1 = { ending, stance, survivors, fallen, departed, flags (nur `season2: true`) }`; die Abschlussszene bietet den Export dieser Zusammenfassung als eigene Datei an.
- **Speicherschutz (AR21):** Beim ersten Speichern `navigator.storage.persist()`; ist die App nicht installiert, Hinweis auf „Zum Home-Bildschirm“ (Safari löscht Daten nicht installierter Seiten nach 7 Tagen ohne Besuch); nach jedem Akt-Finale Backup-Erinnerung.
- **Schreiben:** Auto-Save asynchron nach jedem Commit, ohne die Eingabe zu blockieren; bei `visibilitychange → hidden` wird der letzte Stand sofort geschrieben.

### 5.16 Stabile IDs (AR19)

- Nach jedem Release erzeugt `pnpm content:lock` die Liste aller veröffentlichten IDs (Gefährten, Klassen, Items, Skills, Knoten, Karten, Flags, Leutnants, Räume, Szenen) in `content/released-ids.json`.
- `content:check` schlägt fehl, wenn eine gesperrte ID fehlt, außer sie steht mit Ziel in `content/renames.yaml`; die nächste Save-Migration liest dieselbe Datei.

## 6. Querschnittsthemen

### 6.1 Fehlerbehandlung (AR22)

| Art | Beispiel | Umgang |
|---|---|---|
| Spieler-Eingabe ungültig | Ziel außer Reichweite, zu wenig Gold | `validate`/`validateCampaign` liefern Fehlercode; die UI zeigt einen Hinweis, nichts wird geworfen |
| Kern-Invariante verletzt | Einheit ohne Position greift an | `throw new CoreInvariantError(code, details)`; die App fängt im Controller, zeigt „Etwas ist schiefgelaufen“, bietet Fehlerbericht und lädt den letzten Auto-Save |
| Content-Fehler | fehlende Referenz, zu lange Box | im Build durch `content:check`; zur Laufzeit im Dev-Build als Overlay, im Release als Warnung im Log, Anzeige mit Fallback |
| Asset fehlt | Modell, Porträt | Platzhalter wie heute (`assets.ts`), Warnung im Log |
| Paket-Download scheitert | offline, Server weg | Wiederholung mit Backoff; Knoten im Paket bleiben gesperrt mit Hinweis |
| Speichern scheitert | Speicher voll | Banner „Speichern fehlgeschlagen“, nächster Versuch beim nächsten Commit, Export anbieten |

**Fehlerbericht:** JSON mit App- und Content-Version, Gerät (User-Agent, Qualitätsstufe), letztem Checkpoint, Journal danach, laufendem Kampf und den letzten 500 Log-Zeilen. Wird nur lokal erzeugt und vom Spieler geteilt.

### 6.2 Logging

- `src/app/log.ts`: Ringpuffer mit 500 Einträgen, Stufen `error`, `warn`, `info`, `debug`; `debug` nur im Dev-Build oder mit `?debug`.
- Format `{ t, level, area, msg, data? }`, `area` aus festem Satz (`core`, `content`, `packs`, `save`, `render`, `audio`, `worker`, `ui`).
- `src/core` loggt nicht; es liefert Events und Fehler. Keine Telemetrie, kein Netzwerk-Logging.

### 6.3 Konfiguration

| Art | Ort | Liest |
|---|---|---|
| Regelkonstanten, Balancing | `content/core/balance.yaml` | core |
| Darstellung (Kamera, Qualität, Jahreszeit, Tageszeit, Wetter) | `content/core/render.yaml` | render |
| Auslieferung | `content/packs.yaml` | Build, packs |
| Akt-Werte (Stufendeckel, gestaffelte Regeln) | `content/acts/actN/campaign.yaml` | core |
| Spieler-Einstellungen | `localStorage` (wie heute), Schlüssel `hc.settings` | app |

### 6.4 Zeit und Zufall

- Einzige Wanduhr der Kampagne: `src/app/day.ts`. Zeitstempel für Metadaten (`createdAt`) setzt nur `persistence`.
- Zufall nur aus Seed-RNGs im State: `battle.rng`, `campaign.rng`, Tagespakete aus `hash32(seed, day)`.

### 6.5 Ereignisse zwischen Systemen

- Kern → Render/UI nur über Events und neuen State. Render spielt `GameEvent[]` ab, UI liest Signals.
- Kampagnen-Events treiben Hinweise, Banner und Szenen-Auslöser. Es gibt keinen globalen Event-Bus; der Controller in `src/app` reicht Events gezielt weiter.

## 7. Projektstruktur

```
hollow-crown/
  concept/24-architecture/        ← dieses Dokument + decision-log.md
  content/
    packs.yaml                    Pakete, released-Flag, Budgets
    released-ids.json             gesperrte IDs (AR19)
    renames.yaml                  ID-Umbenennungen mit Migration
    core/                         Paket core
      balance.yaml render.yaml terrain.yaml classes.yaml items.yaml skills.yaml
      affixes.yaml runes.yaml sets.yaml rooms.yaml traits.yaml
      locales/de.yaml en.yaml de.names.yaml en.names.yaml
    acts/
      act1/                       Paket act1; Prolog-Karte und -Szenen weist packs.yaml dem Paket core zu
        campaign.yaml flags.yaml lieutenants.yaml haunts.yaml units.yaml supports.yaml
        maps/<mapId>.yaml
        scenes/<sceneId>.yaml
        locales/en.dialogue.yaml
      act2/ act3/                 wie act1; act3 zusätzlich epilogue.yaml
    world/valmora.yaml            Weltkarte (Paket core)
    home/camp.yaml castle.yaml    Anker und Ausbauteile
  src/
    core/
      battle/                     wie heute + flee, pursue, visibility
      campaign/
        commands.ts               CampaignCommand, CampaignError
        apply.ts                  validateCampaign, applyCampaign
        conditions.ts effects.ts  AR3
        graph.ts                  availableNodes, storyCount, lockedMechanics
        haunts.ts lieutenants.ts home.ts scenes.ts epilogue.ts
        campaign.ts camp.ts       Bestand, wird in Handler zerlegt
      rules/ ai/                  wie heute
    content/                      Schemas, Laden, Referenzprüfung, Paket-Registry
    packs/                        Download, Cache, Fortschritt, loadPack
    worker/core.worker.ts         AR14
    render/host.ts shared/ board/ world/ home/
    ui/                           Komponenten; base.css tokens.css pieces.css + eine CSS-Datei je Screen (styles.css = Altbestand, schrumpft nur)
    app/
      screens/                    Title, NewGame, World, Home, Scene, Prep, Battle, Result, Memorial, Epilogue, Options
      controllers/                campaign.ts battle.ts saves.ts packs.ts
      state/                      App-Zustand, ein Modul je Verantwortung: settings.ts screen.ts session.ts battle.ts flow.ts
      day.ts log.ts coreWorker.ts audio.ts update.ts
    persistence/                  Format 2, Migrationen, Legacy, Export/Import
    i18n/
  tests/
    unit/                         Kern, Content, Bedingungen, Szenen
    golden/                       Replays je Story-Mission (Start + Log + erwartetes Ergebnis)
    fixtures/saves/               Spielstände je Format
    e2e/
  tools/
    content-check.ts simulate.ts bench-ai.ts content-lock.ts check-bundle-size.mjs
    art/ audio/
```

**Namenskonventionen (Code und Daten Englisch):**

| Was | Regel | Beispiel |
|---|---|---|
| Dateien TS | camelCase, Screens/Komponenten PascalCase `.tsx` | `haunts.ts`, `WorldMap.tsx` |
| Typen, Interfaces | PascalCase | `CampaignCommand`, `HauntAnchor` |
| Funktionen, Variablen | camelCase | `availableNodes`, `dayNumber` |
| Konstanten | UPPER_SNAKE nur für echte Konstanten | `SAVE_FORMAT` |
| Command-/Event-Typen | camelCase-Verb bzw. Partizip | `buildRoom` / `roomBuilt` |
| Content-IDs | snake_case, ASCII | `iron_sword`, `hask` |
| Story-Knoten | `prologue`, `m<akt>_<nr>`, Nebenquests `n<nr>` | `m1_3`, `n4` |
| Karten | `<knoten>_<ort>` | `m1_2_erlbach` |
| Szenen | `scn.a<akt>.<knoten>.<anlass>` | `scn.a1.m1_4.post` |
| Flags | Entscheidungen `e01`–`e12`, sonst `<bereich>_<name>` | `e03`, `quest_n2_tower` |
| Locale-Schlüssel | Punkt-Pfad, Dialog automatisch | `ui.world.title`, `dlg.scn.a1.m1_4.post.l01` |

## 8. Implementierungsmuster

Diese Muster sind verbindlich, damit verschiedene Agenten gleich bauen.

### 8.1 Neues Kampagnen-Command

1. Typ in `src/core/campaign/commands.ts` ergänzen (plain JSON, keine Funktionen, keine Klassen).
2. Prüfung in `validateCampaign` (nur lesen, Fehlercode zurück), Wirkung in `applyCampaign` (auf Kopie, Events anhängen).
3. Kosten- oder Vorschaufunktion exportieren, wenn die UI vorher etwas anzeigt; UI und `apply` rufen dieselbe Funktion.
4. Unit-Test: gültig, jeder Fehlercode, Events, Determinismus (zweimal anwenden → gleiches Ergebnis).

```ts
case 'buildRoom': {
  const cost = roomCost(data, c, cmd.room);          // auch von der UI genutzt
  if (!cost) return err('room_locked');
  if (c.gold < cost.gold) return err('not_enough_gold');
  if (!evalCondition(ctxOf(c), cost.requires)) return err('companion_missing');
  const next = clone(c);
  next.gold -= cost.gold;
  next.home.rooms[cmd.room] = (next.home.rooms[cmd.room] ?? 0) + 1;
  return ok(next, [{ t: 'roomBuilt', room: cmd.room, level: next.home.rooms[cmd.room]! }]);
}
```

### 8.2 Neue Bedingung oder Wirkung

Schlüssel im Zod-Schema, Auswertung in `conditions.ts`/`effects.ts`, Referenzprüfung in `content/validate.ts`, Tabelle in §5.3 dieses Dokuments ergänzen. Bedingungen dürfen nichts verändern; Wirkungen laufen nur innerhalb eines Kampagnen-Commands.

### 8.3 Neues Content-Feld

Zod-Schema → Typ in `core/defs.ts` → Referenzprüfung → Beispiel in einer Content-Datei → `pnpm content:check`. Spielwerte nie im Code (AGENTS.md).

### 8.4 Szene einbinden

Szene als Datei anlegen, an Knoten (`pre`, `post`), Trigger (`dialogue`) oder Raum hängen, EN-Schlüssel ergänzen, `content:check`. Die UI ruft nur `resolveScene` und schickt bei Antworten `choose`.

### 8.5 Arbeit im Worker

Nur reine Kernfunktionen; alles, was der Worker braucht, kommt aus der Anfrage oder aus geladenen Paketen. Neue Anfragearten bekommen einen Typ in `WorkerRequest` und einen synchronen Fallback.

### 8.6 3D-Szene erweitern

Neue Darstellung bekommt Events oder Overlays, nie direkten Zugriff auf `CampaignState`-Mutationen. Assets über den geteilten Cache laden, Werte aus `render.yaml`.

### 8.7 Konsistenzregeln

- Kein Zustand außerhalb von `BattleState`/`CampaignState`, der für Regeln zählt (kein Spielzustand in Signals, Komponenten oder Render-Objekten).
- Keine Maps, Sets, Klassen oder `undefined` mit Bedeutung im persistierten State.
- Jede Zufallsentscheidung zieht aus einem RNG im State, in fester Reihenfolge.
- Die Vorschau ruft denselben Formelcode wie die Auflösung.
- Neue Felder in persistiertem State brauchen einen Default beim Laden (Migration oder `??`).
- App-Zustand liegt in `src/app/state/`, ein Modul je Verantwortung, ohne Sammel-Datei (kein Barrel, kein neues `store.ts`): `settings.ts` (Einstellungen), `screen.ts` (aktueller Screen, Blatt-Modul), `session.ts` (Inhalte, aktive Kampagne, Kampagnen-Commands, Auto-Save, Journal, Kampagnenliste; kennt weder Screens noch Kämpfe, holt sich den Live-Zustand über `bindLive`), `battle.ts` (laufender Kampf), `flow.ts` (Missionsablauf, Laden/Neu/Import, Bedingungen und Wirkungen für die UI, Dev-Helfer `window.__hc`). Abhängigkeiten laufen nur in eine Richtung: `flow` → `battle` → `session`, alle → `screen`/`settings`; keine Zyklen. Neuer Zustand bekommt ein eigenes Modul oder gehört in das, dessen Verantwortung er trägt, damit parallele Stories nicht dieselbe Datei ändern.
- Styles: Tokens in `tokens.css`, allgemeine Grundregeln in `base.css`, gemeinsame Bausteine in `pieces.css`, jeder Screen bekommt seine eigene CSS-Datei neben der Komponente (wie `hud.css`, `campaigns.css`). `styles.css` ist Proof-of-Concept-Altbestand und schrumpft nur: Wer einen Screen neu baut, löscht dessen Abschnitt dort und legt die neuen Styles in einer Datei je Screen ab. Am Ende verschwindet `styles.css`; übrig bleiben `tokens.css`, `pieces.css`, `base.css` und die Screen-Dateien.

## 9. Epic-Zuordnung

> **Achtung, alte Nummern:** Die Tabelle unten nutzt die frühere Epic-Zählung E0–E10 aus dem GDD-Entwurf; maßgeblich sind die Epics 1–12 in `concept/26-epics/epics.md` (Zuordnung je Entscheidung in §4).
>
> **Nachtrag aus `gds-create-epics-and-stories` (2026-10-23):** Das Fundament-Epic E0 entfällt. Seine Bausteine entstehen im ersten Epic, das sie braucht (Speicherformat, Kampagnen-Commands, Fehlerbericht → Epic 1; Worker → Epic 2; Content-Layout, Bedingungen, Szenen-Schema → Epic 4; Pakete, ID-Sperre → Epic 7). Maßgeblich ist `concept/26-epics/epics.md`; die Tabelle unten bleibt als Zuordnung der Bausteine.

Ursprünglicher Vorschlag: ein technisches Fundament-Epic vor E1, danach die Reihenfolge aus dem GDD.

| Epic | Architektur-Bausteine | Entscheidungen |
|---|---|---|
| **E0 Fundament Staffel 1** (neu) | Content-Layout `core/` + `acts/`, Paket-Plugin und Paket-Manager, Speicherformat 2 mit Legacy und Journal, Kampagnen-Commands (Umbau `camp.ts`), Bedingungen/Wirkungen, Szenen-Schema 2, Flag-Register, Core-Worker, ID-Sperrliste, Fehlerbericht und Log | AR2, AR3, AR9, AR10, AR14–AR17, AR19, AR21–AR23 |
| E1 Rollenklassen | Klassenschema, Waffengruppen, Klassen-Aktionen mit Vorschau, Halten in Pfadsuche und KI, Nachsetzen, Nebel-Sicht | AR8 |
| E2 Leutnants | Leutnant-Content, Kampagnenzustand, Flucht in `apply`, Vorschau „flieht“, Skalierung in `createBattle`, Kopfgeld, Steckbrief | AR5 |
| E3 Weltkarte & Heimsuchungen | Weltkarten-Szene, `advanceDay`, Heimsuchungs-Generator, Anker je Karte, Deckel | AR6, AR7, AR12, AR13 |
| E4 Kampagne, Entscheidungen, Supports | Kampagnen-Graph je Akt, `storyCount`, `choose`, Haltung, Chronik, Epilog-Mosaik, 25 Paare, Staffel-Zusammenfassung | AR3, AR4, AR10, AR20 |
| E5 Fortschritt & Wirtschaft | Stufendeckel, Verbluten, Glutfunke, Neustart-Commands und Klassik-Regeln, Kampagnen-Sim | AR16, AR18 |
| E6 Heimat | `rooms.yaml`, Raum-Commands, Lager- und Burg-Szene | AR11, AR12 |
| E7 Chibi-Stil & Audio | Tripo-Figuren im Asset-Cache, Jahreszeit/Tageszeit-Presets, Stimmen-Pakete je Sprache | AR12, AR15 |
| E8–E10 Content je Akt | Akt-Paket mit Karten, Ankern, Szenen, Leutnants, Flags; `released`-Freigabe, ID-Sperrliste | AR15, AR19, AR23 |

Hinweis für die Story-Planung: Die E1-Story „Spielstände migrieren“ entfällt (AR17); stattdessen erkennt E0 PoC-Stände und bietet den Export an.

## 10. Leistung

- **Brett:** Maßnahmen aus D17 bleiben (GPU-Skinning, Thin Instances, FPS-Deckel 60/30, Schattenkarte je Stufe). Große Schlachten: Figuren-Budget nach Art Direction §4.6, Animationen ≤ 0,5 MB je Figur, Landschafts-Requisiten auf „Niedrig“ begrenzt.
- **Weltkarte/Burg:** gleiche Qualitätsstufen; nur die aktive Szene lebt (AR12).
- **KI:** im Worker (AR14), Budget 300 ms je Gegnereinheit, `pnpm bench:ai` in CI.
- **Laden:** Kaltstart lädt nur `core`; Content als JSON-Chunk statt YAML-Parsing zur Laufzeit (wie heute).
- **Speichern:** Auto-Save asynchron; Journal append-only; keine Kopie des ganzen Journals in Spielständen.
- **Messung:** FPS-Overlay im Dev-Build (`?debug`), Playwright-Lauf über die Gegnerphase der größten Schlacht mit Zeichenaufrufen und Frame-Zeiten; echte Geräte manuell je Akt-Release.

## 11. Sicherheit und Datenschutz

- Kein Server, kein Konto, keine Telemetrie. Spielstände bleiben lokal; Fehlerberichte teilt nur der Spieler selbst.
- Importe sind untrusted: Größenlimit, Zod, Prüfsumme (Integrität, kein Schutz), keine dynamische Code-Ausführung.
- Content stammt nur aus dem eigenen Build; Pakete werden nur vom selben Ursprung geladen.

## 12. Auslieferung und Betrieb

- GitHub Pages über `.github/workflows/pages.yml` wie heute; CI (`ci.yml`) zusätzlich mit `pnpm bench:ai`, Golden-Replays und Paket-Budgets.
- **Akt-Release:** Paket in `content/packs.yaml` auf `released: true`, `pnpm content:lock`, Save-Migration falls nötig, Merge per Pull Request, Spieler bekommen die Update-Abfrage.
- Capacitor nach V1: Pakete gebündelt, Speicher über dasselbe IndexedDB-Modul.

## 13. Entwicklungsumgebung

### 13.1 Voraussetzungen

Node ≥ 22, pnpm 10 (`packageManager`), Git LFS (`git lfs pull` vor Art-Arbeit), Python mit Pillow und numpy für `pnpm art:build`, Blender für `tools/art/blender_*.py`, Chromium für Playwright.

### 13.2 KI-Werkzeuge (MCP)

Babylon.js hat keinen Engine-MCP wie Godot oder Unity; die Prüfung läuft über Tests, `pnpm sim` und Playwright. Im Einsatz bleiben: Blender-MCP (Modelle, Requisiten), ElevenLabs-MCP bzw. `tools/audio/elevenlabs.py` (Musik, SFX, Stimmen), Claude in Chrome für ChatGPT-Bilder und Tripo (Bild-zu-3D, Web).

### 13.3 Befehle

```bash
pnpm install --frozen-lockfile
pnpm dev                       # Entwicklung
pnpm lint && pnpm test && pnpm content:check && pnpm build
pnpm sim m1_2 --runs 50        # Balancing einer Mission
pnpm sim --campaign act1       # verketteter Akt (neu, Story 6.8)
pnpm bench:ai                  # KI-Budget (neu, Story 2.8)
pnpm content:lock              # IDs nach Release sperren (neu, Story 7.4)
```

## 14. Architecture Decision Records

**ADR-1 Kampagne als Commands (AR2).** *Kontext:* Die Kampagne läuft 30–35 Stunden über mehrere Releases, mit Entscheidungen, Tagespaketen und Wirtschaft. *Entscheidung:* eigenes Command-Log mit validate/apply/Events. *Folgen:* Umbau von `camp.ts`; dafür verkettete Simulation, Fehlerberichte mit vollständigem Verlauf und gleiche Testmuster wie im Kampf.

**ADR-2 Tag als Eingabe (AR6).** *Kontext:* Heimsuchungen hängen am Kalender, der Kern darf keine Uhr lesen. *Entscheidung:* App rechnet die Tagesnummer (04:00 Ortszeit) und schickt `advanceDay`; der Kern zählt nur vorwärts und deckelt den Stau. *Folgen:* reproduzierbar, testbar, Uhrmanipulation bringt höchstens 3 Pakete.

**ADR-3 Akt-Pakete (AR15).** *Kontext:* 15-MB-Ziel, offline spielbar, Akt für Akt veröffentlicht. *Entscheidung:* Pakete `core`, `act1–3`, Stimmen je Sprache; Hintergrund-Download in eigene Caches. *Folgen:* eigener Paket-Manager und Vite-Plugin; Content-Ordner wird umgebaut.

**ADR-4 Speicherformat 2 (AR16–AR18).** *Kontext:* GDD-Regeln je Tod-Modus, mehrere Kampagnen, langer Übertrag. *Entscheidung:* Kampagnen-Store, Auto + 3 Snapshots (nicht Klassik), Journal getrennt, PoC-Schnitt, Klassik als Ehrensystem. *Folgen:* klare Regeln ohne Scheinsicherheit; PoC-Tester beginnen neu.

**ADR-5 KI im Worker (AR14).** *Kontext:* Große Schlachten mit ~40 Einheiten auf Mittelklasse-Handys. *Entscheidung:* Gegnerphase von Anfang an im Worker, gegen die Empfehlung „bei Bedarf“. *Folgen:* etwas Infrastruktur in E0; die UI bleibt in der Gegnerphase immer flüssig; Replays bleiben identisch, weil der Worker denselben Kern ausführt.

**ADR-6 Szenen mit deutschem Text (AR9).** *Kontext:* ~4 000 Boxen je Sprache, Schreib-Pipeline mit Haiku-Subagenten, Sprecherketten wegen Permadeath. *Entscheidung:* DE in der Szene, Schlüssel automatisch, EN je Akt. *Folgen:* Autoren sehen Kontext und Text zusammen; die Regel „Text in Locale-Dateien“ gilt weiter für UI.

## 15. Validierung

### 15.1 Abdeckung GDD und Narrative

| Anforderung | Abgedeckt durch |
|---|---|
| Rollenklassen, Klassen-Aktionen, Profi-Wege | AR8, §5.7 |
| Leutnants: Flucht, Groll, Skalierung, Kopfgeld, Signatur | AR5, §5.5 |
| Weltkarte, Regionen im Nebel, Miniaturen mit Varianten | AR12, AR13, §5.12 |
| Tageswechsel, Stau 3, max. 6 offen, Uhr nur vorwärts | AR6, §5.6 |
| Heimsuchungs-Varianten, Belohnung, Deckel | AR7, §5.6 |
| Freie Reihenfolge, feste erste Mission und Finale, Akt 3 linear | AR4, §5.4 |
| Gestaffelte Regeln nach Missionszahl | §5.4 |
| Entscheidungen mit Folgen, Haltung, Chronik, Epilog-Mosaik | AR3, AR10, §5.8, §5.9 |
| Ersatzsprecher, Gedenkzeilen, `requires { flags, alive, stance }` | AR9, §5.8 |
| Supports 25 Paare, S nur Kernpaare | §5.9 (Bedingung `support`), E4 |
| Heimat mit 11 Räumen, 3 Stufen, ≤ 2 Taps | AR11, §5.10 |
| Stufendeckel, Glutfunke, Verbluten, Übungsplatz, Lektionen | §5.11 |
| Speicherregeln je Tod-Modus, Neustart setzt Tode zurück | AR16, AR18, §5.15 |
| Spielstand über Akt-Releases und in Staffel 2 | AR19, AR20, §5.15, §5.16 |
| 60 FPS, < 5 s, < 15 MB, offline, Qualitätsstufen | AR14, AR15, §10 |
| Reproduzierbarkeit inkl. Affixe, Brand, Heimsuchungen | AR2, AR6, §6.4 |
| Nemesis-Patent: keine prozedurale Erzeugung | AR5 |

### 15.2 Prüfergebnis

- Entscheidungen widersprechen sich nicht: Worker (AR14) und Kampagnen-Journal (AR2) nutzen denselben reinen Kern; Pakete (AR15) und Spielstände (AR16) sind über `contentVersion` und die Paketprüfung beim Laden verbunden.
- Alle Systeme aus §2.1 haben einen Ort in §7 und ein Epic in §9.
- Muster mit Beispiel für: Kampagnen-Command, Bedingung/Wirkung, Szene, Anker, Worker-Protokoll, Tagesnummer.
- Keine Platzhalter; Startwerte (Paket-Budgets, Box-Länge, Logpuffer) sind als solche markiert und gehören zur Abnahme in E0.

## 16. Offene Punkte

- **O5/GA26 Lizenzen:** unverändert offen; nichts kommerziell veröffentlichen.
- **Nemesis-Patent:** rechtliche Prüfung vor einer Veröffentlichung (GDD); die Architektur hält sich an die Leitplanken.
- **Paket-Budgets:** Startwerte; nach dem Bau von Akt 1 messen und hier nachtragen.
- **Kamerawinkel (D2):** weiter im Playtest.
- **Animationsgröße der Tripo-Figuren:** Ziel ≤ 0,5 MB (Art Direction §4.6), beeinflusst die Paket-Budgets.
