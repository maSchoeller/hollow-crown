# Story 9.6: Mission 1-5 „Das Hungerlager“ und Entscheidung E3

Status: review

## Story

Als Spieler
möchte ich gegen Banditen kämpfen, die eigentlich Hungernde sind,
damit die Gewissensfrage „Gold gegen Gewissen“ spürbar wird.

## Acceptance Criteria

1. **Karte:** `m1_5_hungerlager` (16 × 16, Ziel `survive` 6 Runden, Abend, Asche). Gegner (Hungernde) Leicht 10 / Normal 12 / Schwer 14 einschließlich der Wellen in Runde 2 und 4; Gelände unverändert. Grosk steht nicht auf dem Brett.
2. **Grosk nach Runde 6:** Im Outro `scn.m1_5.outro` kommt er mit erhobenen Händen ins Lager der Truppe und redet; er gilt danach als begegnet (`c.lieutenants.grosk.met`), damit Steckbrief, Heimsuchungen und Finale funktionieren.
3. **E3 im Outro** nach dem Gespräch (Entscheidungszeile mit `title`): „verschonen“ (`e03: spare`, Grosk tritt bei, Hask-Groll −1) oder „Kopfgeld“ (`e03: bounty`, +600 Gold, Grosk wird abgeführt). Die Folgen-Karte zeigt die Wirkungen.
4. **Varek** per Ansprechen durch Kael im Kampf (`recruit: { by: [kael], dialogue: scn.m1_5.varek_talk }`), Nebenziel `recruit`; kurze Sichtungszeile `scn.m1_5.varek_spotted` über einen Trigger.
5. **Kinder:** drei Zivilisten im Lager, die kein Gegner angreift.
6. **Knoten `m1_5`** (`requires: completed m1_1`, `place hungerlager`, `merchantTier 1`), Weltkarte 1-5 zeigt ihn; mit 1-2 bis 1-5 sind vier Akt-Mitte-Knoten im Graphen.
7. **Szenen** (DE in der Datei, EN im Locale, Box ≤ 110 Zeichen, Hintergrund `hungerlager`): `intro`, `varek_spotted`, `varek_talk`, `hut_w`, `hut_e`, `outro`.
8. **Heimsuchungs-Anker:** `haunts:` mit drei Ankern (defend, boss, rout).
9. **Mechanik-Staffel:** Elemente, Status, Runen und Supports ab der dritten abgeschlossenen Story-Mission, unabhängig von der Reihenfolge.
10. **Prüfungen:** `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün; Simulation siehe Dev Agent Record.

## Tasks / Subtasks

- [x] T1 Kern: Wirkung `meet: { lt }` (Schema, `validateEffects`, `applyEffects`, `content:check`), Test in `lieutenants-grudge.test.ts`
- [x] T2 Kern: Karteneinheiten-Feld `untargetable` (Schema, `BattleUnit`, `attackTargets`, `itemTargets`, KI-Zielliste), Test `untargetable.test.ts`
- [x] T3 Karte: Grosk entfernt, `varek` mit Ansprechen, drei Kinder, Gegner Stufen 6/7 und `h9` (ersetzt Grosk in der Zählung), Trigger `t_varek_spotted`, Hütten mit `dialogue`, `haunts`
- [x] T4 Szenen `scn.m1_5.{intro,varek_spotted,varek_talk,hut_w,hut_e,outro}` und Englisch
- [x] T5 Knoten `m1_5`, Weltkarte `node: m1_5`, `units.yaml` (Varek bereinigt), Namen `unit.child.name`, `node.m1_5.title`
- [x] T6 Simulation abgestimmt, Decision-Logs, Architektur-Stand, Test `hunger-camp.test.ts`

## Dev Notes

- **Entscheidungen des Produktinhabers (bindend, 2026-10-27):** Grosk kommt erst nach Runde 6 (nicht auf dem Brett); E3 im Outro; Varek per Ansprechen durch Kael; Kinder als eigene Zivilisten, die nicht angegriffen werden; Gegner sind Hungernde (bewusst schwach für ihre Zahl).
- **Technische Entscheidungen:**
  - `met` setzte bisher nur `applyLieutenantOutcome` (Sicht oder Flucht im Kampf, `ltSeen`); weder `recruit: { lt }` noch `grudge` tun es. Neu: Wirkung `meet: { lt }` im Muster von `grudge` (Fehler `unknown_unit` für einen unbekannten Leutnant, einmalig, `encounters` mindestens 1, Groll bleibt). Keine Zeile auf der Folgen-Karte (die Begegnung ist Buchhaltung). In beiden E3-Antworten steht `meet` vor `recruit` bzw. `gold`.
  - `untargetable` an Karteneinheiten: Gegner wählen sie nie als Ziel (`attackTargets`, schädigende Gegenstände, `hostileUnits` der KI, damit auch Annäherung und Reihenfolge); Spieler greifen Team `other` nicht an. Gewählt statt eines Team-Tricks (`isHostile` kennt nur Teams) und statt `ignoreForRout` (nur Rout-Zählung). Replay-sicher (Feld im Startzustand, keine Zufallsquelle). Die Kinder sind `generic`, treten also nie bei. Grenze: brennende Felder schaden ihnen (Spieler könnten Gras anzünden); kein Gegner dieser Karte zündet etwas.
  - Gegnerzahl: Grosk zählte in 10/12/14 mit; für dieselben Zahlen ohne ihn kam `h9` (Vorkämpfer, Position [8,3]) für alle Schwierigkeiten dazu. Varek und die Kinder zählen nicht mit.
  - Hask-Groll −1: das Konzept nennt die Wirkung ohne Grund; eine Vorgeschichte zwischen Grosk und Hask ist nicht erfunden, die Szene sagt dazu nichts.
  - Varek wie Ysolde in 1-4: Team `enemy`, `hold`, keine Waffe, `ignoreForRout`; `units.yaml` trägt kein `recruit` mehr (Kommentar auf die Karte). Sein Desertionsgrund bleibt offen (Decision-Log 2026-10-24), er nennt nur Dravn.
  - Gefährtenzeilen in `intro`, Hütten und `outro` stehen unter `requires: alive` (Fenn, Liora, Mira, Ysolde, Varek), weil `canSpeak` auch Gefährten zulässt, die nie beigetreten sind; Brenna, Tobin, Kael, Rhen sind immer da. So bleibt die Reihenfolge 1-2 bis 1-5 frei.
  - Heimsuchungs-Anker: [8,8] defend (Hügel, 8 Runden), [8,2] boss (Grosks Lager), [8,14] rout (Talausgang; der frühere Entwurf nannte [8,13], das ist ein Lagerfeuer).
  - Mechanik-Staffel: `mechanics` des Kerns kennt nur `triangle`, `magic`, `elements`, `supports` (Schema `z.enum`), `campaign.yaml` setzt `elements: 3` und `supports: 3`. Status und Runen sind im Kern keine gestaffelte Mechanik (kein Schlüssel); nichts gebaut, nichts nachgetragen. Offene Frage im Bericht.
  - Sichtungszeile: Trigger `unit_enters` (Team player, Rechteck um Varek), einmalig.
  - Gold: `goldReward` 1200, Nebenziele `recruit` Varek 300 Gold, `visit_villages` 300 Gold, `no_downs` Heiltrank (unverändert [C]); Hütten: Wundsalbe und 200 Gold.
  - E3 steht in der Szene; die 600 Gold stehen literal in der Antwort (wie in anderen Szenen und im Architekturbeispiel).
- **Offen / aufgefallen:** Der Autoplay der Simulation schickt Rhen (Stufe 1) in `--fresh` früh zur westlichen Hütte, wo er fällt (Normal fresh 0 %); das ist ein Artefakt der Hütten-Heuristik, nicht der Karte (verkettet liegt Normal bei 89 %).

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5.5

### Debug Log References

- `pnpm sim m1_5 --runs N --difficulty …` (Siegrate / niedergestreckte Spielerfiguren je Lauf). Korridor: Leicht ≥ 95 % und ≤ 0,5; Normal 75–100 % und 0,4–1,3; Schwer 30–70 %. Schwer verkettet: nur ein Teil der Ketten kommt bis 1-5 (in Klammern die Zahl der Ketten).

| | Leicht | Normal | Schwer |
|---|---|---|---|
| verkettet | 100 % / 0,32 (200) | 89 % / 0,78 (157 von 200) | 50 % / 1,36 (58 von 500) |
| `--fresh` | 100 % / 1,00 | 0 % (Autoplay, siehe oben) | 0 % / 2,62 |

- Stufen: Hungernde 6 (Stufe-3-Plätze des Entwurfs) und 7; bei Stufe 5/6 lag Normal bei 96 % / 0,51 und Schwer bei 90 %, zu leicht; bei 6/7 trifft die verkettete Kampagne den Korridor. `--fresh` (Rhen und Kael Stufe 1) liegt darunter, wie schon bei 1-4 (der Korridor gilt für die verkettete Kampagne). Kampagnen-Lauf `pnpm sim --campaign act1 --runs 50` (Normal): 1-5 100 %, 0,50 niedergestreckt, Armee im Schnitt Stufe 4,8.
- `expectedLevel 5`: die verkettete Truppe vor 1-5 liegt bei etwa Stufe 4,8 (1-4: 3,9 bei `expectedLevel` 4), die Gegner bei 6–7 (Hungernde mit wenig Ausrüstung, Eisen-Tier).
- Der Autoplay wirbt Varek an (`recruited: {varek: …}`); das Nebenziel ist erreichbar.

### Completion Notes List

- Gegnerzahlen Leicht 10 / Normal 12 / Schwer 14, Gelände unverändert, Grosk nicht auf dem Brett. Gate: `pnpm lint`, `pnpm test`, `pnpm content:check`, `pnpm build` grün.

### File List

- Neu: `content/acts/act1/scenes/scn.m1_5.{intro,varek_spotted,varek_talk,hut_w,hut_e,outro}.yaml`, `tests/unit/{untargetable,hunger-camp}.test.ts`, diese Datei
- Geändert: `content/acts/act1/{campaign,units}.yaml`, `content/acts/act1/maps/m1_5_hungerlager.yaml`, `content/core/locales/{de,en}.names.yaml`, `content/locales/en/act1.dialogue.yaml`, `content/world/valmora.yaml`
- Code: `src/core/defs.ts`, `src/core/state.ts`, `src/core/battle/{create,actions}.ts`, `src/core/ai/ai.ts`, `src/core/campaign/effects.ts`, `src/content/{schemas,validate}.ts`
- Tests: `tests/unit/{lieutenants-grudge,core,migrations}.test.ts`
- Doku: `concept/22-narrative/decision-log.md`, `concept/24-architecture/{architecture.md,decision-log.md}`, `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-10-27: Story 9.6 umgesetzt (Mission 1-5 mit Varek, Kindern und Grosk im Outro, E3 mit der neuen Wirkung `meet`, Karteneinheiten-Feld `untargetable`).
