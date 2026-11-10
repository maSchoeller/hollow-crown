---
baseline_commit: fdb901f
---
# Story 11.16: Mission 2-5 „Die verstoßene Leibwache“ und Entscheidung E5

Status: review

<!-- Erstellt 2026-11-09 mit gds-create-story (Nachtbetrieb, PO schläft): offene Punkte als [ASSUMPTION] mit der empfohlenen Option, gesammelt unter „Offene Fragen an den Produktinhaber“. -->

## Story

Als Spieler
möchte ich Odile aus dem Kloster Silberquell über die Schlucht bringen, während Sable mich jagt,
damit ich von Halvards Briefen erfahre.

## Acceptance Criteria

1. **Karte übernommen:** `content/acts/act2/maps/m2_5_silberquell.yaml` übernimmt den Entwurf `concept/27-ueberarbeitung/levels/s2_2_5_silberquell.yaml` (M 20 × 25, Mittag, `escort` Odile zum Ausgang `rect [8,0,11,1]`, 9 eigene gegen 22 auf Normal, L 18 / S 26) mit Feld `design:` auf den Entwurf, `map.act = 2`, Nordrand auf Stufe 1, Rampen, zwei Hängebrücken (`footbridge`), Hospiz-Dorf `v_hospice` wie im Entwurf. Gegner nur mit `levelOffset` (−3…−1, Sable über die Leutnant-Regel), keine Flieger, keine Reiter (content:check aus 11.2/11.7 grün).
2. **Westbrücke:** Zu Beginn der Spielerphase von Runde 5 spielt `scn.m2_5.bridge_warn` und die Felder `[4,10]`, `[4,11]` sind als bedroht markiert (`set_terrain … warn: true`); in der Gegnerphase von Runde 6 werden sie zu `river`. Eine eigene Figur auf diesen Feldern wird dabei nach der bestehenden `set_terrain`-Regel behandelt (Verhalten aus 11.8/11.10, im Test belegt). Die Ostbrücke bleibt.
3. **Nordrand:** Schützen (`marksman`, `hold`) auf Stufe 1 schießen mit dem Höhenbonus der bestehenden Regel weiter über die Schlucht; Ritter (`guard`) halten die Rampen.
4. **Sable oder Hauptmann:** Am Ausgang `[9,4]` steht genau eine Figur: ohne `e07: warn` Sable (`lieutenant: sable`, `requires: [{ not: { flag: { e07: warn } } }]`), mit `e07: warn` ein Hauptmann des Grenzheers (`unit.border_captain.name`, gleiche Klasse, gleiche Stufe, gleiche Waffe, kein Leutnant). Auch ohne gesetztes `e07` (Spielstand ohne E7) steht Sable.
5. **Wellen:** angekündigt R3 (von hinten um die Mauer, 3), R5 (Südrand der Schlucht, 2), R7 (Ausgang, 2), Stufen P−2, wie im Entwurf.
6. **Odile:** steht als `team: other` mit Profil `follow` im Klosterhof und folgt der nächsten eigenen Figur; erreicht sie den Ausgang, ist die Mission gewonnen und sie tritt bei (`escort`, Beitritt nach Story 4.8). Fällt Odile, ist die Mission verloren. Beitrittswerte nach `content/acts/act2/units.yaml` (`odile`, `raiseMapChar` → P − 1), nicht Stufe 7 des Entwurfs.
7. **Amos:** steht als Gast (`team: other`, `guest: true`) im Hospiz und tritt nur bei, wenn ihn eine eigene Figur anspricht (`scn.m2_5.amos_talk`); Nebenziel „Amos gewinnen“. Werte nach `units.yaml` (`amos`).
8. **Niederlage:** Avatar, Lucan oder Odile fallen.
9. **Szenen:** `scn.m2_5.intro`, `scn.m2_5.outro`, `scn.m2_5.amos_talk`, `scn.m2_5.bridge_warn` (und `scn.m2_5.odile_meet`, siehe T2) in DE und EN, jede Box ≤ 110 Zeichen, Gefährtenzeilen mit `requires: alive` und Ersatzsprecher-Kette, Sprecher ohne Halbfigur nur als Erzähltext, Hintergrund `silberquell`. **Saat Stimme:** Odile erzählt von Halvards Briefen an Seraphine (Missionsliste: „Er schreibt ihr nachts, nach Gesprächen mit der Krone.“). Zeilen von Sable nur mit `flag: joined_sable` bzw. `alive: sable`.
10. **E5 in der Nachszene:** Seraphine bietet Odile die Rückkehr in die Garde an (Überbringer siehe F1). Die Wahlzeile trägt einen Titel (Folgen-Karte, Chronik), jede Antwort eine Haltung (warm, nüchtern, trotzig) und ein `summary`. `return` → `setFlag { e05: return }`, `leave: odile` (ihre Ausrüstung geht über die bestehende `leave`-Wirkung in den Konvoi), Abschiedszeile Odiles; `stay` → `setFlag { e05: stay }`. Die Kronfeld-Zeile liest `e05` erst in 11.19.
11. **Akademie-Hinweis (F3, PO 2026-11-06):** Die Akademie behält ihre gebaute Stufe. Steht die Akademie unter Stufe 3 und ist Varek nicht (mehr) in der Truppe, nennt die Folgen-Karte der Antwort `return` den Wegfall von Stufe 3; hat die Akademie schon Stufe 3 oder ist Varek in der Truppe, entfällt der Hinweis. Mechanik siehe F2 [ASSUMPTION A]; 11.17 nutzt dieselbe.
12. **Knoten:** `m2_5` in `content/acts/act2/campaign.yaml` bekommt `place: silberquell`, `pre: scn.m2_5.intro`, `post: scn.m2_5.outro`; die Weltkarte bietet 2-5 am Slot `silverspring` an, sobald die Karte existiert und `m2_4` erledigt ist (`mapInBuild`, 11.3/11.11); `tests/unit/act2-campaign-order.test.ts` sieht für m2_5 die Karte (Sieg-Typ `escort`).
13. **Gewinnbar und im Korridor:** `pnpm sim m2_5_silberquell --campaign act2 --start expected --runs 50` zeigt die Karte gewinnbar, Ergebnis mit Zahlen im Kopfkommentar der Karte und in der Abnahme-Datei, beide Varianten (`e07` warn/obey über `--set` bzw. Startflags); Gold der Mission im Akt-2-Korridor 2 000–3 000. Abweichungen nur berichten, abgestimmt wird in 11.27. Act-1-Basislauf bleibt identisch.
14. **Unveröffentlicht:** `act2` bleibt `released: false`; kein `pnpm content:lock`, keine Änderung an `content/released-ids.json`. Der Live-Schritt der gemeinsamen Regeln (Fixture-Spielstände aus dem letzten Live-Stand, Sperre) **entfällt bis 9.14/Release**, wie in 11.12.
15. **Ortsbild:** `art/mockups/locations-s1/silberquell.png` liegt vor (Prompt und Abnahme `art/prompts/loc_silberquell.md`), `silberquell` steht in `ACT2_LOCATIONS` (`tools/art/build.py`) und `locations/silberquell.webp` im Paket act2 (`content/packs.yaml`).
16. **Abnahme:** Bild der Karte bei 375 × 812 im Spiel (Lautstärken 0) und der Folgen-Karte von E5; Abweichungen vom Entwurf im neuen Abschnitt „Übernahme Story 11.16“ von `concept/27-ueberarbeitung/levels/abnahme/s2_2_5_silberquell.md`; `pnpm check` grün.

## Tasks / Subtasks

- [x] T1 Karte anlegen (AC 1, 3, 4, 5, 6, 7, 8)
  - [x] `content/acts/act2/maps/m2_5_silberquell.yaml` aus dem Entwurf: `id: m2_5_silberquell`, `nameKey: map.m2_5_silberquell.name` (DE/EN in `content/acts/act2/locales/{de,en}.names.yaml`), `act: 2`, `design:` = Entwurfsblock plus Verweis auf `s2_2_5_silberquell`; Kopfkommentar nach Muster `content/acts/act2/maps/m2_1_windscharte.yaml:1-10`.
  - [x] Gegner: `level` streichen, nur `levelOffset`; `nameKey: unit.border_soldier.name` mit Sprites wie Pool des Grenzheers (`content/acts/act2/haunts.yaml:10-12`: vanguard→soldier, skirmisher→mercenary, marksman→bandit_archer; für knight/brigand/healer passende vorhandene Sprites wählen). Waffen: Eisen für P−3/P−2 wie Entwurf, Stahl nur, wenn die Sim es verlangt [ASSUMPTION, wie 11.12].
  - [x] Sable: `lieutenant: sable` mit `requires: [{ not: { flag: { e07: warn } } }]`; Klasse/Signatur aus `content/acts/act2/lieutenants.yaml:44-54` (duelist, `dravns_oath`); `levelOffset: 1` nur fürs Schema (Leutnant-Stufe aus `lieutenantLevel`). Waffe wie in 11.12 gelernt: Kartenwaffe (`steel_sword`) behalten, die Signatur ist Beute.
  - [x] Hauptmann: `id: captain`, `nameKey: unit.border_captain.name` (neu in beiden `names.yaml`: „Hauptmann des Grenzheers“ / „Border Army Captain“), `class: duelist`, `levelOffset` so, dass die Stufe der von Sable entspricht (Leutnant P+1 bzw. `lieutenantLevel` prüfen), `steel_sword`, `ai: guard`, `requires: [{ flag: { e07: warn } }]`, **kein** `lieutenant:` (Korrektur 11.10). Test: genau eine der beiden Figuren je Flag-Zustand (warn / obey / ungesetzt).
  - [x] Odile: `char: odile`, `team: other`, `ai: { profile: follow }`, `ignoreForRout: true`, ohne eigene Stufe/Items (Werte aus `units.yaml:34-44`). Amos: `char: amos`, `team: other`, `guest: true`, `recruit: { by: any, dialogue: scn.m2_5.amos_talk }` (Entwurf: `scn.s2_5.amos_talk` → Schema `scn.<knoten>.*`).
  - [x] Sieg `escort` (unit odile, area `rect [8,0,11,1]`); `join: true` des Entwurfs weglassen oder belassen (Default ist Beitritt, `src/core/campaign/campaign.ts:294-296`). Niederlage avatar/lucan/odile. Nebenziele `s_amos` (recruit, 300 Gold), `s_fast` (turn_limit 11, 300 Gold).
  - [x] Trigger `t_warn` (turn_start 5 player → `scn.m2_5.bridge_warn`) und `t_cut` (turn_start 6 enemy → `set_terrain` `[4,10]`,`[4,11]` river, `warn: true`), dazu `t_odile` (`unit_enters`, team player, Nachbarfelder um `[10,18]` → `scn.m2_5.odile_meet`, once) [ASSUMPTION].
  - [x] Höhen und Wege prüfen: `levels` Stufe 1 auf `rect [0,0,19,7]`; Rampen `[4,8]`/`[15,8]` verbinden Brücke (Stufe 0, `footbridge` ist `water: true`) und Nordrand; die Treppe `ss` bei `[9,8]`/`[10,8]` endet über der Schlucht (keine Brücke in x 9–10) – prüfen, ob sie stört, sonst als Abweichung (`plain`/`road`) dokumentieren.
  - [x] `goldReward: 2000` statt 1 200 des Entwurfs (Korridor 2 000–3 000, wie 2-1 nach der Abnahme) [ASSUMPTION, 11.27 stimmt ab].
  - [x] Heimsuchungs-Anker `haunts:` gleich mitliefern (11.12 hat sie erst nach der Abnahme ergänzt): `escort` (Klosterhof → Ausgang) und `rout` (Nordrand), Format wie `m2_1_windscharte.yaml:73ff.` [ASSUMPTION].
- [x] T2 Szenen DE/EN (AC 9, 10, 11)
  - [x] `content/acts/act2/scenes/scn.m2_5.intro.yaml`: Ankunft am Kloster in der Eisenschlucht, das Grenzheer ist schon drin, Lucan erkennt Sables Leute (ohne Sable bei `e07: warn`, dann Sable selbst in der Truppe). `background: silberquell`. Text **entwerfen und als Vorschlag markieren** (Schreib-Pipeline der Narrative).
  - [x] `scn.m2_5.odile_meet.yaml`: Odile (Halbfigur `odile` vorhanden) schließt sich an; kurz, Brücke Prinzessin.
  - [x] `scn.m2_5.amos_talk.yaml`: Ansprechen, Sprecher `by: any` mit Ersatzsprecher-Kette; Amos (58, Feldscher, Galgenhumor, vom Orden verstoßen, weil er Feinde behandelte – `narrative.md:227`).
  - [x] `scn.m2_5.bridge_warn.yaml`: Ruf über die Schlucht, Westbrücke wird gekappt (Erzähltext oder Gefährte).
  - [x] `scn.m2_5.outro.yaml`: Odile erzählt von Halvards Briefen (Saat Stimme; Halvard ist für die Truppe noch der Mentor – `narrative.md:173-181`, nichts verraten). Danach Seraphines Angebot (Überbringer F1) und Wahlzeile E5 nach Muster `content/acts/act1/scenes/scn.m1_5.outro.yaml:64-76`: drei Antworten (warm/nüchtern/trotzig) auf zwei Werte, z. B. warm → `stay` („Bleib bei uns“), nüchtern → `return` („Geh, es ist deine Pflicht“), trotzig → `stay` („Sie hat dich fortgeschickt“) [ASSUMPTION, Vorschlag]. Abschiedszeile Odiles unter `requires: [{ flag: { e05: return } }]`. Varek-Zeile (Support Varek × Odile) unter `requires: alive varek`, Sable-Zeile unter `flag: joined_sable`.
  - [x] F3-Hinweis nach F2-Antwort A: zweite Wahlzeile mit eigener Id (`c01` / `c01_capped`) und `requires`, die Variante `c01_capped` nur bei Akademie < 3 und `not: { alive: varek }`; ihr `return`-`summary` nennt den Wegfall von Stufe 3. Validator (`src/content/validateScenes.ts:79-82`) verlangt `title` + `summary` je Antwort.
  - [x] EN in `content/locales/en/act2.dialogue.yaml`; Box ≤ 110 Zeichen; Ersatzsprecher-Prüfung und `scene-view.test.ts` grün.
- [x] T3 Bedingung Raumstufe (AC 11; nur bei F2 = A)
  - [x] Neue Bedingung `{ roomLevel: { id: <room>, min?: n, max?: n } }`: Typ in `src/core/storyDefs.ts:6ff.` (`Condition`), Schema in `src/content/schemaConditions.ts:18-38`, Auswertung in `src/core/campaign/conditions.ts:90ff.` (`ConditionContext` um Raumstufen erweitern, Quelle `c.home.rooms` über die bestehende Raumstufen-Hilfe aus `src/core/campaign/camp.ts`, z. B. wie `academyLevel` – keine zweite Rechnung), `lockReason`/Anzeige nur, falls Bedingungen dort aufgezählt werden. content:check: Raum-Id muss in `content/core/rooms.yaml` stehen.
  - [x] Tests in `tests/unit/` für die Bedingung (Lager ohne Akademie = 0, Stufe 1/2/3) und für die Szene: Variante mit Hinweis genau bei Akademie < 3 ∧ Varek fehlt.
  - [x] Eintrag im Architektur-Decision-Log (`concept/24-architecture/`), §5.3 Bedingungsliste ergänzen.
- [x] T4 Knoten und Ortsbild verdrahten (AC 12, 15)
  - [x] `content/acts/act2/campaign.yaml:30` (`m2_5`): `place: silberquell`, `pre`, `post`; nur diese Zeile anfassen (2-2..2-4 laufen parallel auf derselben Datei; Konflikte löst die lenkende Session per Merge, nie rebasen).
  - [x] Weltkarten-Slot `silverspring` (`content/world/valmora.yaml:49`) prüfen, nichts neu anlegen.
  - [x] `tools/art/build.py:49` `ACT2_LOCATIONS` um `silberquell`, `content/packs.yaml` act2 um `locations/silberquell.webp` (Block `:70-80`).
- [x] T5 Ortsbild per ChatGPT (erledigt die lenkende Session) (AC 15)
  - [x] Stand 2026-11-09 22:40: Die lenkende Session hat `art/mockups/locations-s1/silberquell.png` (1672 × 941) und `art/prompts/loc_silberquell.md` schon im Worktree erzeugt (noch nicht committet). Dev-Phase: Datei prüfen, PNG über Git LFS committen (`.gitattributes` greift für `art/**/*.png`, mit `git lfs ls-files` belegen), Eintrag in `concept/23-art-direction/abnahme/akt2-ortsbilder.md` (Abnahme offen, blockiert nicht).
  - [x] Fehlt das Bild doch: Prompt-Datei nach Muster `art/prompts/loc_windscharte.md`, Bild erzeugt die lenkende Session; T4 erst mit dem Bild committen, damit `pnpm art:build`/content:check nicht scheitern.
- [x] T6 Simulation (AC 13)
  - [ ] (nur Normal erledigt; Leicht/Schwer, Haunts und Kampagnen-Sim: lenkende Session) `pnpm sim m2_5_silberquell --campaign act2 --start expected --runs 50`, alle drei Schwierigkeiten, mit und ohne `--haunts`; Variante `e07: warn` (Hauptmann statt Sable; Startflag per `--set` oder Lab-Szenario). Varianten per `--json` + `pnpm sim:diff`. Achtung: `m2_5` verlangt `completed: m2_4`, dessen Karte fehlt – Start über `--start expected` / `--node`.
  - [x] Prüfen: autoplay führt Odile (Profil `follow`) bis zum Ausgang; Westbrücke R6 trennt nicht dauerhaft.
  - [x] Act-1-Basislauf `pnpm sim --campaign act1 --runs 50 --seed 1` unverändert (keine Akt-1-Datei geändert → kein sim:diff nötig).
- [x] T7 Tests (AC 2–12)
  - [x] `tests/unit/m2-5-silberquell.test.ts` nach Muster `tests/unit/m2-1-windscharte.test.ts`: Knoten/Ziel escort, 18/22/26 Gegner, Stufen auf P, Wellen R3/5/7 an den Rändern, Warnung R5 + Brücke R6 zu `river`, Sable/Hauptmann je `e07`, Odile folgt und tritt beim Erreichen des Ausgangs bei, Odiles Tod = Niederlage, Amos nur bei Ansprechen, E5 `return` → Odile in `c.left`, Ausrüstung im Konvoi, Flag; `stay` → bleibt; F3-Hinweis-Varianten.
  - [x] Lab-Szenario `tests/fixtures/lab/silberquell-2-5.yaml` für die Sichtprüfung (im Dev-Build `loadPack('act2')`, dann `__hc.lab('silberquell-2-5')`).
  - [x] `act2-campaign-order.test.ts` (m2_5 jetzt mit Karte, `victory.type` escort), `act2-drafts.test.ts`, `act-title.test.ts`, `sim-acts.test.ts` (30 s Timeout, Platzhalter-Annahmen) grün halten.
- [x] T8 Abnahme und Abschluss (AC 14, 16)
  - [ ] (lenkende Session: Spielbild und Folgen-Karte bei 375 × 812) `pnpm levels` (Atlas), Spielbild 375 × 812 über `pnpm dev:act2`, Lautstärken 0; Folgen-Karte E5 mit und ohne Hinweis.
  - [x] Abschnitt „Übernahme Story 11.16“ in `levels/abnahme/s2_2_5_silberquell.md` (Id, Szenen-Ids, Gegner-Sprites, Sable-Waffe, Odile/Amos-Werte, Gold, Anker, Treppe, Odile-Trigger, Sim-Zahlen).
  - [x] Neue Entscheidungen (F1–F4-Antworten, Bedingung `roomLevel`) in die Decision-Logs `concept/22-narrative/decision-log.md`, `concept/21-gdd/decision-log.md`, `concept/24-architecture/` – nie `01-decisions.md`.
  - [x] `pnpm check` grün; **kein** `released: true`, **kein** `content:lock`.

## Dev Notes

### Ausgangslage (Stand 2026-11-09, main `fdb901f`)

- `content/acts/act2/maps/` enthält nur `m2_1_windscharte.yaml` (11.12, gemergt). 2-2 bis 2-4 baut eine andere Session parallel; **nichts davon ist auf main**.
- Knoten `m2_5` (`campaign.yaml:30`): `map: m2_5_silberquell, requires: [{ completed: m2_4 }], merchantTier: 1`, **ohne `place`**, ohne `pre`/`post`.
- Flags (`content/acts/act2/flags.yaml`): `e05` (return|stay), `e06`, `e07` (warn|obey), `joined_sable` deklariert. `e07` wird erst in 2-4 (11.15) gesetzt.
- Gefährten (`units.yaml:34-57`): `odile` (skirmisher, `sworn_guard`, `joins: m2_5`, Supports varek/sable), `amos` (healer, `field_surgeon`, `joins: m2_5`). Halbfiguren `odile` (+ Stimmungen), `amos`, `sable`, `seraphine`, `varek`, `lance_rider`, `dravn_envoy` liegen in `art/mockups/characters-s1/`. **Keine** Halbfigur für einen Grenzheer-Hauptmann (siehe F3).
- Leutnant `sable` (`lieutenants.yaml:44-54`): duelist, iron_march, `dravns_oath`, `scene: scn.lt.sable`, `joins: true`.
- Namen: `unit.border_soldier.name` vorhanden, `unit.border_captain.name` **fehlt**, `map.m2_5_silberquell.name` fehlt.
- Sieg `escort` existiert (Story 4.8, `src/core/battle/objectives.ts:90`, Schema `schemaMap.ts:98`), bisher nur in Heimsuchungen benutzt; Beitritt per Default (`campaign.ts:294-296`). KI-Profil `follow` existiert (`src/core/ai/ai.ts:528`). `set_terrain … warn` aus 11.10 (`schemaMap.ts:121-125`).
- `leave` legt die Ausrüstung in den Konvoi und trägt die Figur in `c.left` (`src/core/campaign/effects.ts:149-157`); die Folgen-Karte zeigt dafür eine `leave`-Zeile (`consequences.ts:38`). Wahlzeilen-Schema `schemaCampaign.ts:42-56`; `summary` ist der Titel der Folgen-Karte (`Dialogue.tsx:200`).
- **Akademie:** Story 10.2 (Status review, auf main): Raum `academy` (`content/core/rooms.yaml:16`, Stufen 2/3 nur `{ act: 2 }`), `academyLevel` (`src/core/campaign/camp.ts:254`), Stufe 2 Weg wechseln, Stufe 3 zweiten Weg lernen (`balance.academy`). **Story 10.1 (Raum-Gefährten varek | odile für Stufe 3) ist backlog** – heute braucht Stufe 3 keinen Gefährten. Eine Bedingung auf Raumstufen gibt es nicht (`schemaConditions.ts:18-38`).
- Ortsbild `silberquell` fehlt auf main; im Worktree liegt seit 22:40 ein frisch erzeugtes (unversioniert, siehe T5). Weltkarten-Slot `silverspring` (`valmora.yaml:49`, Wege zu kronfeld, greywatch, burnt_slope, raven_meadow) existiert.

### Was aus 2-2 bis 2-4 fehlt (Abhängigkeiten)

- **`m2_4` ohne Karte:** 2-5 ist im Spiel erst erreichbar, wenn 11.15 gemergt ist. Prüfen nur über Sim (`--start expected`), Lab und Tests mit gesetztem Zustand.
- **E7 / `e07` wird nirgends gesetzt** (11.15): beide Zweige mit Fixture-Flags testen; der Pfad „ungesetzt“ zählt wie `obey` (Sable steht).
- **Sable als Offizierin / `joinLieutenant`** (11.15): bei `e07: warn` ist Sable in der Truppe. Ihre Zeilen nur unter `flag: joined_sable` (bzw. `alive: sable`, falls 11.15 sie in den Roster legt) mit Ersatzsprecher; nicht auf eine API aus 11.15 bauen, die es noch nicht gibt. Nach dem Merge von 11.15 die Bedingung angleichen (kein Rebase).
- **Erstes Treffen mit Sable:** Liegt es laut 11.15 schon in 2-4, entfällt in 2-5 kein Begegnungs-Code; sonst übernimmt `scn.lt.sable` (Leutnant-Regel) das von selbst.
- **Rowena (2-3):** falls F1 = C gewählt wird, braucht der Text den Ausgang von 2-3.

### Abweichungen Entwurf ↔ Spielformat (alle in die Abnahme-Datei)

| Entwurf | Spiel | Grund |
|---|---|---|
| `id: s2_2_5_silberquell` | `m2_5_silberquell` | Karten-Id des Knotens |
| `scn.s2_5.*` | `scn.m2_5.*` | Szenen-Schema `scn.<knoten>.*` |
| `level` + `levelOffset` | nur `levelOffset` | 11.2, content:check |
| Odile Stufe 7, Amos Stufe 7, eigene Items | Werte aus `units.yaml` (P − 1) | 11.5 / Muster Jory 11.12 |
| Sable `levelOffset: 1` | Leutnant-Stufe | 11.5 |
| `goldReward: 1200` | 2 000 [ASSUMPTION] | Korridor Akt 2 |
| keine Heimsuchungs-Anker | `escort`, `rout` [ASSUMPTION] | Lehre aus 11.12 |
| — | `t_odile` / `scn.m2_5.odile_meet` [ASSUMPTION] | Beitritt „mit der Eskorte“ braucht eine Begegnung |
| Formatwunsch Hängebrücken-, Wasserfall-Modell | `footbridge` (Steg), Wasserfall als Fluss | Modelle fehlen laut Matrix; nicht Teil dieser Story |

### Szenen-Inhalt: Quellenlage

- Missionsliste `concept/22-narrative/missionsliste-s1.md:76`: Klosterhof Silberquell, Odile kennt Halvards Briefe an Seraphine, Amos Feldscher des Klosters, E5 nach 2-5, Saat-Zitat.
- `narrative.md:203` Seraphines Strang sät Zweifel (Odile weiß von den Briefen), Freispruch ist eine Falle, platzt erst in 2-8. `:173-193` Halvard ist der heimliche Täter und Mentor – für die Truppe noch nicht enthüllt; Odiles Zeile darf beunruhigen, nicht aufklären. `:224` Odile (31), entlassene Leibwächterin, „zerrissen zwischen Pflicht und Truppe“. `:227` Amos (58). `:229, :363, :385` Sable, Dravns Champion, Seitenwechsel über Brandhang. `:692` E5. `:729-730` Supports Varek × Odile, Odile × Sable. `:496` Odiles Ding steht in der Akademie (Raum-Gefährtin).
- `geografie-valmora.md:48,73,93` Eisenschlucht, Weg Kronfeld–Grauwacht über Silberquell, Silberquell als eigenes Stadtbild.

### Was nicht angefasst wird

- `content/packs.yaml` `released`, `content/released-ids.json`, `src/persistence/save.ts` (keine Formatänderung geplant; die neue Bedingung ist Content, kein persistiertes Feld).
- `content/core/rooms.yaml` gehört Epic 10 (10.1 setzt die Raum-Gefährten). Diese Story liest Raumstufen nur.
- `concept/01-decisions.md` (eingefroren).

### Testing

- `pnpm check`; Einzeltest `pnpm vitest run tests/unit/m2-5-silberquell.test.ts --reporter=verbose`. Timeouts nicht durch weniger Worker lösen (AGENTS.md).
- Lab: `pnpm lab silberquell-2-5 --play` / `--enemy`; `src/lab/scenario.ts` sucht Knoten in allen Akten und spielt Akt-2-Karten im Herbst.

### Previous Story Intelligence (11.12)

- Szenenboxen ≤ 110 Zeichen, DE und EN; Sprecher ohne Halbfigur nur als Erzähltext (`scene-view.test.ts`); Gefährtenzeilen unter `requires: alive` mit Ersatzsprecher-Kette; Entwurf per Haiku-Subagent, danach von Hand überarbeiten (Floskeln, sprecherneutrale Kettenzeilen).
- Leutnants fliehen bei 0 KP; ein Boss-Ziel zählt die Flucht als Sieg (hier escort – Sables Flucht öffnet nur den Ausgang).
- Gold im Akt-2-Korridor 2 000–3 000 (2-1 nach Abnahme 2 000). Balancing-Abweichungen nur berichten, Abstimmung in 11.27.
- `pnpm sim` für Akt 2 nur mit `--campaign act2 --start expected`. Im Dev-Build ist act2 nicht vorgeladen: `loadPack('act2')`, dann `__hc.lab(...)`.
- Signatur-Waffe des Leutnants filtert `lieutenantItems` aus den Kartenwaffen → Kartenwaffe behalten.
- Tests, die „Akt 2 hat keine Karte“ annahmen, wurden in 11.12 nachgezogen (`act-title`, `act-transition`, `scenery`, `sim-acts`); mit 2-5 erneut prüfen.
- Halbfiguren neuer Sprecher erzeugte die lenkende Session per ChatGPT, Protokolle in `art/prompts/`.

### Project Context Rules

- Keine Spielwerte und kein sichtbarer Text im Code; Code/IDs Englisch, Konzepttexte Deutsch; Beträge als Symbol + Zahl.
- `src/core` reine Commands/Events, Zufall nur aus dem Seed-RNG; neue Bedingung bleibt rein und replay-fest.
- Coverage `src/core` nicht senken; neue Bedingung mit Tests.
- Nie auf `main`, PR nach grüner CI; Akt 2 nie veröffentlichen.

### References

- [Source: concept/26-epics/epics/epic-11.md:1-49, 347-381]
- [Source: concept/27-ueberarbeitung/levels/s2_2_5_silberquell.yaml; levels/abnahme/s2_2_5_silberquell.md]
- [Source: concept/27-ueberarbeitung/umsetzung-lueckenliste-akt2.md:45,54 (F3)]
- [Source: concept/26-epics/epics/epic-10.md:3,7,41,60 (Akademie-Gefährten varek | odile, 10.1)]
- [Source: concept/22-narrative/missionsliste-s1.md:24,76,120; narrative.md:173-203,224-229,496,692,729-730]
- [Source: content/acts/act2/{campaign,flags,units,lieutenants,haunts}.yaml; content/core/rooms.yaml:16]
- [Source: src/content/schemaConditions.ts; src/core/campaign/{conditions,effects,consequences,camp,campaign}.ts; src/content/validateScenes.ts:79-82]
- [Source: _bmad-output/implementation-artifacts/11-12-mission-2-1-wind-ueber-der-eisenmark.md]

## Offene Fragen an den Produktinhaber

- **F1 [ASSUMPTION A] Wer überbringt Seraphines Angebot an Odile?** In 2-1 kamen Lanzenreiter und Bote statt der Anwärter selbst. A) ein Lanzenreiter (Halbfigur `lance_rider` vorhanden) mit Seraphines Brief; B) Seraphine persönlich (Halbfigur vorhanden, nimmt ihren Auftritt in 2-8 vorweg); C) Rowena als Seraphines Stimme (hängt am Ausgang von 2-3). **Angenommen A.**
- **F2 [ASSUMPTION A] Wie zeigt die Folgen-Karte den Wegfall von Akademie-Stufe 3?** Heute gibt es weder eine Raumstufen-Bedingung noch Raum-Gefährten (10.1 backlog). A) neue Bedingung `roomLevel` und zwei Varianten der Wahlzeile, die Variante mit Hinweis trägt ihn im `summary`; B) neue Zeilenart der Folgen-Karte, aus Zustand und den Raum-Gefährten von 10.1 berechnet (wartet auf 10.1); C) Hinweis als Erzählzeile vor der Wahl, nicht auf der Karte. **Angenommen A** (unabhängig von 10.1, von 11.17 wiederverwendbar).
- **F3 [ASSUMPTION A] Spricht der Hauptmann des Grenzheers (Pfad `e07: warn`)?** Eine Halbfigur gibt es nicht. A) keine eigene Zeile, nur Erzähltext; Sable kommentiert aus der Truppe; B) eigene Halbfigur `border_captain` per ChatGPT und Sprecherzeilen. **Angenommen A.**
- **F4 [ASSUMPTION A] Wie verteilen sich die drei Haltungen auf die zwei Werte von E5?** A) warm → bleibt, nüchtern → kehrt zurück, trotzig → bleibt; B) warm → kehrt zurück („ich lasse dich gehen“), nüchtern → bleibt, trotzig → bleibt; C) beide Werte je mit eigener Haltung, die dritte Haltung entfällt (nur zwei Antworten). **Angenommen A.**

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (gds-dev-story, 2026-11-09). Szenentexte selbst entworfen (Schreib-Pipeline: Vorschlag, Abnahme durch den Produktinhaber offen).

### Debug Log References

- `pnpm sim m2_5_silberquell --campaign act2 --start expected --runs 50` (Normal): spielt m2_1 und m2_5, 2-2 bis 2-4 übersprungen (keine Karte).
- `pnpm lab silberquell-2-5-warn`: Hauptmann am Ausgang, Sable fehlt.

### Completion Notes List

- Vorgaben der lenkenden Session (2026-11-09): F1–F4 und die weiteren Annahmen übernommen; Browser-Sichtprüfung und Screenshots (T8 Bild 375 × 812, Folgen-Karte), Sim über die ganze Kampagne und der PR übernimmt die lenkende Session. Nie rebasen; act2 bleibt `released: false`, kein `content:lock`.
- T3 (zuerst, eigener Commit): Bedingung `roomLevel { id, min?, max? }` – Typ (`storyDefs.ts`), Schema (`schemaConditions.ts`), Auswertung (`conditions.ts`, `ConditionContext.rooms` aus `roomLevel` von `castle.ts` für die Räume der aktuellen Heimat ab `fromAct`), Referenzprüfung (`validateRefs.ts`, unbekannte Raum-Id). Test in `story.test.ts`. Architektur §5.3-Tabelle und Decision-Log ergänzt.
- T1: Karte aus dem Entwurf; Abweichungen in der Abnahme-Datei (Grenzheer-Figuren per `sprite`, Odile/Amos aus `units.yaml` auf P − 1, Hauptmann `levelOffset: 1` statt Leutnant-Stufe, Gold 2 000, Anker `escort`/`rout`, `t_odile`, `join: true` entfällt als Standard, Treppe bleibt als Kulisse). Den `rout`-Anker musste ich anders spawnen lassen (`enemySpawn` y 0–2), weil content:check Ziel und Spawn trennt.
- T2: Szenen intro, odile_meet, amos_talk, bridge_warn, outro (DE in `content/acts/act2/scenes/`, EN in `content/locales/en/act2.dialogue.yaml`), alle Boxen ≤ 110 Zeichen. Sable-Zeilen hängen an `e07: warn` (statt `joined_sable`, das 11.15 noch nicht setzt; die Karte entscheidet über dasselbe Flag). E5 als zwei Wahlzeilen `c01` / `c01_capped` mit `requires`; nur die Folgen-Karte von `sober`/`return` in `c01_capped` nennt den Wegfall von Akademie-Stufe 3.
- T4/T5: Knoten `m2_5` mit `place: silberquell`, `pre`, `post`; Slot `silverspring` unverändert; `silberquell` in `ACT2_LOCATIONS` und `packs.yaml` act2. Ortsbild und Prompt-Datei der lenkenden Session per LFS committet, Vorschau-JPG und Nachtrag in `concept/23-art-direction/abnahme/akt2-ortsbilder.md` (PO-Abnahme offen).
- T6 [C]: Sim Normal 50 Läufe: 2-5 erreicht 49, **Sieg 100 %, Niedergestreckte 0,86 (im Korridor 0,4–1,3), Tote 0,14, Runden p10/p50/p90 12/15/22 (Schnitt 16,2), Gold 2 000 + 312 Nebenziele = 2 312**, Amos 100 %, „binnen 11 Runden“ 4 %; Armee-Stufe 14,7 statt erwartet 16, weil 2-2 bis 2-4 übersprungen werden. Sieg 100 % liegt über dem Korridor (≤ 95 %) – nur berichtet, Abstimmung in 11.27. Die Variante `e07: warn` deckt Lab und Test ab, Akt-1-Basis unverändert (keine Akt-1-Datei, kein Regelcode außer der neuen Bedingung).
- T7: `tests/unit/m2-5-silberquell.test.ts` (16 Tests), Lab-Szenarien `silberquell-2-5` und `silberquell-2-5-warn`. Nachgezogen: `act-title`, `act-transition` (m2_5 hat jetzt eine Karte), `sim-acts` (`maxMissions: 1`, sonst spielt jeder Lauf zusätzlich die echte Karte 2-5 und reißt das 30-s-Timeout).
- T8: Abschnitt „Übernahme Story 11.16“ in der Abnahme-Datei, Decision-Logs Narrative und Architektur; `pnpm check` grün.
- Ultimate context engine analysis completed - comprehensive developer guide created (gds-create-story, 2026-11-09).

### File List

- src/core/storyDefs.ts
- src/content/schemaConditions.ts
- src/core/campaign/conditions.ts
- src/content/validateRefs.ts
- tests/unit/story.test.ts
- content/acts/act2/maps/m2_5_silberquell.yaml (neu)
- content/acts/act2/scenes/scn.m2_5.intro.yaml (neu)
- content/acts/act2/scenes/scn.m2_5.odile_meet.yaml (neu)
- content/acts/act2/scenes/scn.m2_5.amos_talk.yaml (neu)
- content/acts/act2/scenes/scn.m2_5.bridge_warn.yaml (neu)
- content/acts/act2/scenes/scn.m2_5.outro.yaml (neu)
- content/acts/act2/campaign.yaml
- content/acts/act2/locales/de.names.yaml
- content/acts/act2/locales/en.names.yaml
- content/locales/en/act2.dialogue.yaml
- content/packs.yaml
- tools/art/build.py
- art/mockups/locations-s1/silberquell.png (neu, LFS)
- art/prompts/loc_silberquell.md (neu)
- concept/23-art-direction/abnahme/akt2-ortsbilder.md
- concept/23-art-direction/abnahme/akt2-orte-silberquell.jpg (neu)
- concept/27-ueberarbeitung/levels/abnahme/s2_2_5_silberquell.md
- concept/22-narrative/decision-log.md
- concept/24-architecture/decision-log.md
- concept/24-architecture/architecture.md
- tests/unit/m2-5-silberquell.test.ts (neu)
- tests/fixtures/lab/silberquell-2-5.yaml (neu)
- tests/fixtures/lab/silberquell-2-5-warn.yaml (neu)
- tests/unit/act-title.test.ts
- tests/unit/act-transition.test.ts
- tests/unit/sim-acts.test.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/11-16-mission-2-5-die-verstossene-leibwache-und-e5.md

### Change Log

- 2026-11-09: Story 11.16 angelegt (ready-for-dev), vier PO-Fragen als [ASSUMPTION] markiert.
- 2026-11-09: Umgesetzt (Bedingung `roomLevel`, Karte, Szenen DE/EN mit E5 und Akademie-Hinweis, Ortsbild eingebunden, Tests, Lab, Abnahme, Decision-Logs); Sim Normal 100 % / 0,86 / 0,14 Tote / 15 Runden (Median) / 2 312 Gold; Status review. Sichtprüfung, Kampagnen-Sim und PR bei der lenkenden Session.
