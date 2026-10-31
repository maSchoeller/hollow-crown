# Story 2.9: Gegnertypen von Akt 1

Status: done

## Story

Als Spieler
möchte ich in Akt 1 unterscheidbare Gegner (Banditen, Wolfsreiter zu Fuß, Söldner) erleben,
damit Kämpfe abwechslungsreich bleiben.

## Acceptance Criteria

1. **Gegnerklassen:** Die Gegnertypen von Akt 1 stehen im Rollenschema von `content/core/classes.yaml` (`role`, `tier`, `moveType`, `mov`, `weaponGroups`, `base`, `growth`, `caps`, Zod-Schema aus Story 2.2). Wolfsreiter sind in Akt 1 **Fußtruppen mit Wolfsfell**: `moveType: foot`, kein Reittier, keine Beritten-Effektivität (`mounted` kommt in keinem Wolfsreiter-Wert vor); Vierbeiner und Reittiere erst nach dem MVP.
   - **ENTSCHIEDEN: A. Nur `wolf_rider` neu; Söldner bleibt `skirmisher` (Schwert), Bandit bleibt `brigand` (Axt). Die Id `mercenary` bleibt legacyId/Sprite und wird nicht benutzt.**
2. **Unterscheidbar:** Banditen, Wolfsreiter und Söldner unterscheiden sich in Waffen (Waffengruppe/Items) und KI-Profil. Welche Werte, Gruppen und Profile genau gelten, ist als Entscheidung des Produktinhabers festgelegt (siehe „Offene Fragen“), nicht hier geraten.
   - **ENTSCHIEDEN: A. Werte/Wachstum/Caps von `skirmisher` abgeleitet (MOV 6, Fuß; SPD +1, DEF −1, Lanze), per Sim eingestellt.**
3. **Auf den Karten:** Die festgelegten Typen stehen auf den dafür bestimmten Akt-1-Karten (`content/acts/act1/maps/`); die Sprite-/Modell-Zuordnung bleibt Sache der Grafik-Session.
   - **ENTSCHIEDEN: Wolfsreiter führen die Lanze (bestehende Items `iron_lance`, keine neuen Items); Banditen Axt, Söldner Schwert.**
4. **Werte in Content:** Alle Werte und Profile stehen in Content-YAML (`classes.yaml`, `items.yaml`, Karten), keine Zahlen im Code; Texte (Klassennamen) als Schlüssel in `content/core/locales/de.yaml` und `en.yaml`. `pnpm content:check` ist grün.
   - **ENTSCHIEDEN: A. Nur Karten-Daten, kein neuer KI-Code: Banditen aggressive/raider, Söldner hold/trigger, Wolfsreiter aggressive/hunt.**
5. **Geprüft:** `pnpm sim <mapId> --runs 50` je berührter Karte (Prolog, ch01, ch02) liegt in den NFR12-Korridoren (Leicht ≥ 95 % Sieg und ≤ 0,5 Niedergestreckte; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %) oder die Abweichung ist im Entscheidungsprotokoll begründet. Vorher/nachher-Werte stehen im Dev Agent Record.
   - **ENTSCHIEDEN: A. Wolfsfell nur Optik, kein Item, kein Skill.**
6. **Tests:** `pnpm lint`, `pnpm test`, `pnpm build` grün; Coverage von `src/core` sinkt nicht. Neue Regelcode-Anteile (falls Frage 4 das erfordert) sind in `src/core` getestet.
   - **ENTSCHIEDEN: keine Sonderregeln, keine eigenen Geländeregeln.**

## Tasks / Subtasks

- [x] T0 Offene Fragen 1–8 mit dem Produktinhaber klären (nicht still entscheiden); Antworten ins Entscheidungsprotokoll `concept/21-gdd/decision-log.md`
- [x] T1 Klassen: Gegnertypen in `classes.yaml` (Werte laut Entscheidung); Namensschlüssel `class.<id>.name` de/en
- [x] T2 Waffen: nur falls neue Items nötig sind (Frage 3), mit `group` und Preis; sonst bestehende Items nutzen
- [x] T3 KI-Profile: nur falls bestehende Profile nicht reichen (Frage 4): Typ `AiDef['profile']` (`defs.ts`), `aiProfile` (`schemas.ts`), Zweig in `src/core/ai/ai.ts`, Test; sonst nur Karten-Daten
- [x] T4 Karten: Gegner auf die bestimmten Karten setzen bzw. umstellen (Frage 5, 6); Platzhalter-`sprite` auf vorhandene Modelle
- [x] T5 `content:check` erweitern, falls sinnvoll (z. B. Gegnertyp ohne `playable`, Waffengruppe passt zur Klasse; die Prüfung „Startausrüstung passt zur Rolle“ aus 2.2 deckt Gegner bereits ab, vor Erweiterung prüfen)
- [x] T6 Sim je Karte vorher/nachher (`pnpm sim prologue_caravan|ch01_varnhold|ch02_silverbrook --runs 50`, alle drei Schwierigkeiten), Korridore prüfen, Log
- [x] T7 Tests: Content-Test, der die Typen und ihre Unterschiede festnagelt (Gruppe, KI-Profil, `moveType: foot`); Regressionslauf `tests/unit/roles.test.ts`

## Dev Notes

### Stand heute (Bestandsaufnahme, 2026-10-24)

- **Gegner sind Karteneinheiten:** `units:` und `reinforcements:` der Karte nennen `team: enemy`, `class`, `level`, `at`, `items`, `ai: { profile, radius?, then?, target? }`, optional `sprite`, `nameKey`, `difficulty: [...]`. Klasse, Waffen und KI-Profil sind **drei getrennte Angaben**; ein Gegnertyp ist also Klasse (`classes.yaml`) plus Ausrüstung plus Profil auf der Karte. Es gibt keinen „Gegnertyp“-Begriff, der alle drei bündelt.
- **Vorhandene Gegnerklassen** (`classes.yaml`, `playable: false`, Abschnitt „Gegnertypen“): `brigand` (MOV 5, Axt, Kletterer, hoher TP/STR, niedrige SKL/SPD/RES), `knight`, `pegasus_knight`, `drake_young`. **Banditen existieren also schon** (`brigand`). Wolfsreiter und eine eigene Söldner-Klasse gibt es nicht.
- **Die PoC-„Söldner“ sind `skirmisher`** (Plänkler, Schwert/Dolch, MOV 6; `legacyIds: [mercenary]`, Sprite/Modell `mercenary`). Gegner der Klassen `skirmisher`, `vanguard`, `marksman`, `elementalist` stehen schon auf allen drei PoC-Karten.
- **Waffengruppen** (`items.yaml`): sword, lance, axe, dagger (nur `iron_dagger`), bow, light_bow (`hunting_bow`), anima, light, staff, shield, focus, lute, breath. Gegner führen heute `iron_axe`/`steel_axe`/`hand_axe`, `iron_sword`/`steel_sword`, `iron_lance`, `iron_bow`, `ember`. `canEquip` prüft `group ∈ weaponGroups` der Klasse; `content:check` prüft die Startausrüstung der Karteneinheiten gegen die Rolle.
- **KI-Profile** (`AiDef['profile']`, `src/core/ai/ai.ts`): `aggressive` (Standard und Fallback: bester Angriffsplan, sonst auf den nächsten Gegner zulaufen), `hold`/`guard`/`trigger` (greifen nur an, was ohne Bewegung erreichbar ist; `trigger` wird bei Spieler in `radius` zu `then`, Standard `aggressive`), `support` (heilen, sonst angreifen), `raider` (Dorf plündern), `hunt` (Ziel-Figur jagen), `flee` (zur Fluchtzone). Ein Profil gilt **je Karteneinheit** (`ai` am Eintrag), **nicht je Klasse**; es gibt keinen Klassen-Standard und kein Profil „flankieren“. Zielwertung gemeinsam für alle Profile (Gewichte `balance.yaml › ai`); auf Schwer `aiDangerAware`.
- **Schwierigkeit:** Gegnerwerte `enemyStatPercent` −15/0/+15 pro Stufe (`balance.yaml › difficulty`); Karteneinheiten mit `difficulty: [...]` erscheinen nur dort; Schwer schaltet Hinterhalt-Verstärkung an.
- **PoC-Karten und ihre Gegner heute:**
  - `prologue_caravan` (rout): Boss Grosk (`brigand`, guard), Plänkler p_e1/p_e2 (aggressive), Vorkämpfer p_e3, Banditen p_e4/p_e5 (trigger r3), Verstärkung 1 Bandit (Schwer). Nur Nahkampf-Gegner, Produktinhaber 2026-10-24.
  - `ch01_varnhold` (reach): Boss Hask (`brigand`, guard), Banditen e1/e6 (raider, Dorf)/e8 (trigger)/Verstärkung, Vorkämpfer e2/e5/e9 (hold), Plänkler e4 (trigger)/e7 (hold), Bogenschütze e3 (trigger, Schwer/Normal).
  - `ch02_silverbrook` (defend Liora, 8 Runden): Boss Morra (`skirmisher`, trigger r2), Varek (`skirmisher`, rekrutierbar), Banditen m1/m5, Schütze m2, Vorkämpfer m3/m4, Elementaristen m6/m6e, Verstärkung in Runde 3/5/7.
  - Es gibt **keine** Wolfsreiter und keinen als „Söldner“ gekennzeichneten Gegner; Banditen und Plänkler stehen schon auf allen drei Karten.
- **Erzählung:** Akt 1 = „Kopfgeldjäger und Banditen“ (narrative.md): Grosk (Banditenführer), Hask (Marodeur-Hauptmann), Morra (Kopfgeldjägerin), **Ulvric (Wolfsreiter, Leutnant, Epic 3/12)**. Wolfsreiter treten in Mission 1-4 („Gefangene der Wolfsreiter“), 1-6 und 1-8 auf. Die Akt-1-Missionen 1-1 … 1-8 (Epic 11) gibt es noch nicht; die PoC-Karten sind Prolog, ch01, ch02.
- **Festlegungen (Quellen):** Wolfsreiter in Akt 1 zu Fuß mit Wolfsfell, Reittiere und Vierbeiner nach dem MVP (GDD „Gegner pro Akt“, decision-log 2026-10-24, art-direction §Gegnertypen); Gegnerklassen dürfen eigene Regeln haben (GDD Rollenklassen); Akt-1-Gegner: Banditen, Wolfsreiter, Söldner (`[ASSUMPTION]` im GDD). Gegner-KI-Profile laut GDD: aggressive, hold, guard, trigger, hunt, raider, flee, support.
- **Optik:** vorhandene Modelle/Sprites in `art/models/units/` u. a. `brigand`, `bandit_archer`, `fighter`, `mercenary`, `soldier`; **kein** Wolfsreiter-Modell. Die Gestaltung (Wolfsfell, Silhouette) macht eine Grafik-Session; diese Story setzt Platzhalter-Sprites. Platzhalterfarbe je Klasse in `src/render/assets.ts` (`brigand: '#6b5a44'`) für neue Klassen ergänzen.
- **Namenskollision:** `mercenary` ist `legacyId` von `skirmisher` (`campaign.ts` bildet alte Klassen-IDs darauf ab) und zugleich Sprite-/Modellname; eine neue Klasse `mercenary` würde damit kollidieren (Frage 1).
- **Baseline Sim** (nach Story 2.3, normal/standard, 50 Läufe, verkettet): prologue 100 % / 0,06 Niedergestreckte, ch01 92 % / 0,14, ch02 76 % / 1,37. Der Autoplay der Gegner-KI nutzt keine Klassen-Aktionen.

### Grenzen

- Keine Leutnants (Epic 3, auch nicht Ulvric); keine Weltkarte (`content/world/`, `src/render/board`); die Gegnerphase im Web Worker (2.8) baut eine andere Session; keine Modelle/Grafiken.
- Kein Eintrag in `concept/01-decisions.md` (eingefroren); Entscheidungen ins `concept/21-gdd/decision-log.md`.
- Keine Reittiere, keine Vierbeiner, keine Beritten-Effektivität.

### Offene Fragen für den Produktinhaber

**Alle acht Fragen vom Produktinhaber am 2026-10-24 entschieden** (Protokoll: `concept/21-gdd/decision-log.md`). Die Empfehlungen unten sind die gewählten Antworten, sofern nicht anders vermerkt.

1. **Klassen-Ids und Umfang:** Neue Klassen `wolf_rider` (Wolfsreiter) und `mercenary` (Söldner) oder Bestehendes weiterverwenden?
   - A: `wolf_rider` neu; „Söldner“ bleibt `skirmisher` mit anderem Profil/Waffen (keine Namenskollision mit `legacyIds: [mercenary]`).
   - B: beide neu, Söldner-Id z. B. `sellsword`/`hired_blade` (nicht `mercenary`).
   - C: nur Items/Profile ändern, keine neuen Klassen.
   - Empfehlung: A, weil `skirmisher` bereits der Gegner-Söldner der PoC-Karten ist. Wäre ein eigener Gegnertyp „Söldner“ gewollt, dann B mit anderem Id.
2. **Werte und Wachstum** von `wolf_rider` (und ggf. Söldner, Banditen-Anpassung): MOV, Basiswerte, Wachstum, Caps. Wolfsreiter gelten als schnell und leicht; konkrete Zahlen wären geraten.
   - A: von `skirmisher` ableiten (MOV 6, Fuß, etwas weniger DEF, mehr SPD).
   - B: eigener Wertesatz nach Produktinhaber-Vorgabe.
   - Empfehlung: A als Startwert, danach per `pnpm sim` feinstellen; Vorgabe der Zahlen im Protokoll festhalten.
3. **Waffengruppen und Items:** Welche Gruppen führt welcher Typ?
   - Heute: Banditen Axt, Söldner Schwert/Dolch, Wolfsreiter nicht belegt. Mögliche Wolfsreiter-Waffen: Lanze, Schwert, Dolch (nur `iron_dagger` vorhanden), leichter Bogen (`hunting_bow`), Handaxt (Reichweite 1–2).
   - Empfehlung: Banditen Axt, Söldner Schwert (plus Lanze für Vorkämpfer wie heute), Wolfsreiter Dolch/leichter Bogen oder Lanze; ob dafür neue Items (z. B. `wolf_spear`, Fell-Rüstung) nötig sind, entscheidet der Produktinhaber.
4. **KI-Profil je Typ:** Soll es ein neues Profil „flankieren/umgehen“ geben, oder genügen die vorhandenen (`aggressive`, `trigger`, `hold`, `guard`, `raider`, `hunt`)?
   - A: nur Karten-Daten: Banditen `aggressive`/`raider`, Söldner `hold`/`trigger`, Wolfsreiter `aggressive` bzw. `hunt` (jagt eine Zielfigur).
   - B: neues Profil `flank` (Ziel mit der schwächsten Deckung/Rückseite, Danger-Map ausweichen) mit Test in `src/core/ai`.
   - C: Klassen-Standardprofil in `classes.yaml` (`defaultAi`), Karte kann überschreiben.
   - Empfehlung: A für diese Story (kein neuer Regelcode); B/C als eigene Story, wenn der Unterschied sonst nicht spürbar ist.
5. **Wolfsfell:** Item, Skill oder nur Optik?
   - A: nur Optik/Name (Modell der Grafik-Session), ohne Regeleffekt.
   - B: Skill der Klasse (z. B. Spähsinn/Kletterer, `skill:` in `classes.yaml`; Skills in `skills.yaml`).
   - C: Körper-Item (`armor`, z. B. leichte Rüstung mit DEF/Mov-Wert).
   - Empfehlung: A; Regeleffekt erst, wenn die Sim zeigt, dass der Typ sonst nicht unterscheidbar ist.
6. **Gegner mit eigenen Regeln** (GDD erlaubt es): Soll ein Typ eine Sonderregel bekommen (z. B. Wolfsreiter ignoriert Waldkosten, Bandit plündert, Söldner kämpft im Nachbarfeld mit einem Verbündeten)?
   - Empfehlung: keine in dieser Story; die Unterscheidung kommt aus Werten, Waffen, Profil.
7. **Bestehende PoC-Gegner umstellen?** Auf welchen Karten (Prolog, ch01, ch02) sollen die neuen Typen erscheinen und welche der heutigen Banditen/Plänkler/Vorkämpfer weichen?
   - **ENTSCHIEDEN: B, minimal. Einzelne Gegner auf ch01 und ch02 umgestellt (siehe Dev Agent Record); Prolog unverändert.**
   - A: keine PoC-Gegner umstellen; die neuen Typen kommen mit den Akt-1-Missionen (Epic 11), hier nur Klassen/Content bereit.
   - B: ausgewählte Gegner auf ch01/ch02 ersetzen (z. B. Plänkler → Wolfsreiter, Prolog bleibt), Sim neu einstellen.
   - C: alle drei Karten umbauen.
   - Empfehlung: B nur für ch01 und ch02, Prolog unverändert (Tutorial, im Korridor, nur Nahkampf-Gegner). Damit ist das Kriterium „wenn sie auf Karten stehen“ prüfbar.
8. **Optik/Modelle:** Welches Platzhalter-Modell trägt ein Wolfsreiter, bis die Grafik-Session eines liefert? (Vorhanden: `brigand`, `mercenary`, `fighter`; das neue Modell liegt nicht bei dieser Story.)
   - **ENTSCHIEDEN: `mercenary` als Platzhalter-Sprite/-Modell (Klasse `art: mercenary`, Karteneinheit `sprite: mercenary`).**
   - Empfehlung: `mercenary` als Platzhalter, `sprite` ist je Karteneinheit überschreibbar; die Grafik-Session bringt das Modell mit Wolfsfell.

### Voraussichtlich berührte Dateien

- `content/core/classes.yaml` (neue/angepasste Gegnerklassen), `content/core/items.yaml` (nur falls Frage 3/5 neue Items verlangt), `content/core/locales/{de,en}.yaml` (Klassen- und ggf. Gegnernamen)
- `content/acts/act1/maps/{ch01_varnhold,ch02_silverbrook}.yaml` (und `prologue_caravan.yaml` nur bei Frage 7 C)
- nur falls Frage 4 B/C: `src/core/defs.ts` (`AiDef['profile']`), `src/content/schemas.ts` (`aiProfile`), `src/core/ai/ai.ts`, Test in `tests/unit/`
- `src/render/assets.ts` (Platzhalterfarbe neuer Klassen), `tests/unit/roles.test.ts` bzw. neuer Content-Test
- `concept/21-gdd/decision-log.md` (Entscheidungen und Sim-Ergebnisse); `_bmad-output/implementation-artifacts/sprint-status.yaml` setzt später der Dev-Workflow

### References

- [Source: concept/26-epics/epics/epic-02.md#Story 2.9]
- [Source: concept/21-gdd/gdd.md#Rollenklassen, #Gegner-KI; Gegner pro Akt]
- [Source: concept/22-narrative/narrative.md, Akt 1: Kopfgeldjäger und Banditen; Ulvric]
- [Source: concept/24-architecture/architecture.md §5.7]
- [Source: concept/21-gdd/decision-log.md, 2026-10-24 Readiness-Klärung (Wolfsreiter zu Fuß)]
- [Source: concept/23-art-direction/art-direction.md, Gegnertypen]
- [Source: _bmad-output/implementation-artifacts/2-2-rollenmodell-und-waffengruppen.md]
- [Source: content/core/classes.yaml, content/core/items.yaml, content/core/balance.yaml, content/acts/act1/maps/*.yaml, src/core/ai/ai.ts, tools/simulate.ts]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

Sim-Messung (`pnpm sim <map> --runs 50 --difficulty <d>`, Seed 1, death standard, verkettete Kampagne) **auf dem heutigen Graph** (prologue_caravan → ch01_varnhold → ch02_silverbrook, ohne die geplanten Knoten Paktnacht/m1_1 davor). Nach dem Merge des neuen Kampagnen-Graphs ist nachzumessen und die Karten ggf. nachzustellen.

Siegquote % / Niedergestreckte je Lauf:

| Karte | Leicht vorher | Leicht nachher | Normal vorher | Normal nachher | Schwer vorher | Schwer nachher |
|---|---|---|---|---|---|---|
| prologue_caravan | 100 / 0,00 | 100 / 0,00 | 96 / 0,48 | 96 / 0,48 | 46 / 1,06 | 46 / 1,06 |
| ch01_varnhold | 100 / 0,00 | 100 / 0,00 | 81 / 0,21 | 85 / 0,54 | 48 / 0,91 | 52 / 0,91 |
| ch02_silverbrook | 100 / 0,22 | 100 / 0,08 | 82 / 0,69 | 85 / 0,71 | 27 / 0,36 | 42 / 0,33 |

Korridore (Leicht ≥ 95 % und ≤ 0,5; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %): alle neun Zellen nachher im Korridor. Der Prolog ist unverändert.

Zwischenstände beim Einstellen (ch01 normal/hard): Wolfsreiter `hunt` auf Kael ließ Schwer auf 26–30 % fallen (Kael-Tod = Niederlage), deshalb `aggressive`; Wolfsreiter als Schwer-Verstärkung machte ch02 Schwer 8 % (er erreicht Liora). Beides verworfen. Beobachtung: ch02 hängt über die verkettete Armee an ch01 (ch02 Schwer 27 % → 42 % allein durch die ch01-Änderungen).

### Completion Notes List

- Neue Klasse `wolf_rider` (`content/core/classes.yaml`): Rolle `wolf_rider`, Tier base, `moveType: foot`, MOV 6, Waffengruppe nur Lanze, `playable: false`, keine Klassen-Aktion, keine Tags (kein `mounted`), Basis HP 18 / STR 5 / SKL 6 / SPD 8 / LCK 2 / DEF 3 / RES 1 (Skirmisher: SKL 7, SPD 7, DEF 4), Wachstum SPD 55 / SKL 45 / DEF 20, Caps SPD 26 / DEF 18; kein Skill (Wolfsfell nur Optik), `art: mercenary` als Platzhalter.
- Namen: `class.wolf_rider.name` in `de.names.yaml` („Wolfsreiter“) und `en.names.yaml` („Wolf Rider“).
- Platzhalterfarbe `wolf_rider` in `src/render/shared/assets.ts` (Platzhalter-Sheet ohne Modell); Sprite je Karteneinheit `mercenary`. `src/render/board/` unberührt.
- Karten (nur diese Einheiten geändert):
  - `ch01_varnhold`: **e4** Plänkler (trigger) → Wolfsreiter, `iron_lance`, `aggressive`; **e7** Plänkler `hold` → `trigger` (radius 3, then aggressive), Klasse bleibt Söldner (`skirmisher`).
  - `ch02_silverbrook`: **m1** Bandit → Wolfsreiter, `iron_lance`, `aggressive`; Verstärkung Runde 7 (Normal/Schwer) Vorkämpfer mit Handaxt → Wolfsreiter, `iron_lance`, `aggressive`.
  - Banditen (`brigand`, Axt: aggressive/raider/trigger) und Söldner (`skirmisher`: Morra/Varek/e4-Reste: trigger/hold) bleiben, wo sie stehen. Prolog nicht angefasst.
- Kein neuer Regel- oder KI-Code, keine neuen Items, `content:check` unverändert (die Prüfung „Startausrüstung passt zur Rolle“ deckt den Wolfsreiter schon ab).
- Test: `tests/unit/enemy-types.test.ts` (Klasse: Rolle, Fuß, Lanze, nicht spielbar, kein `mounted`, `mercenary` bleibt legacyId; Waffengruppen der drei Typen; Locale-Schlüssel; Wolfsreiter auf ch01/ch02 mit aggressive/hunt und Lanze, nicht im Prolog; Content ohne Issues). `roles.test.ts` grün.
- Checks: `pnpm lint`, `npx vitest run --maxWorkers=2` (52 Dateien, 617 Tests), `pnpm content:check`, `pnpm build` grün. Coverage von `src/core` nicht berührt (kein Core-Code geändert).

### File List

- `content/core/classes.yaml`
- `content/core/locales/de.names.yaml`
- `content/core/locales/en.names.yaml`
- `content/acts/act1/maps/ch01_varnhold.yaml`
- `content/acts/act1/maps/ch02_silverbrook.yaml`
- `src/render/shared/assets.ts`
- `tests/unit/enemy-types.test.ts`
- `concept/21-gdd/decision-log.md`
- `_bmad-output/implementation-artifacts/2-9-gegnertypen-von-akt-1.md`
