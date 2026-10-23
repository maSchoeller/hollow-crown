---
title: "Sprint Change Proposal: Staffel 1 auf 8/8/8 Story-Missionen, Burg ab 1-6"
status: zur Freigabe
created: 2026-10-23
source: BMAD-Workflow gds-correct-course (Batch-Modus)
appendix: concept/sprint-change-proposal-2026-10-23-anhang.md
scope: Moderat (Backlog-Umbau, keine Neuplanung)
---

# Sprint Change Proposal: 8/8/8 und Burg ab 1-6

Die Durchrechnung mit allen Tabellen (Missionsfolge, Prüfregeln, Nebenquests, Kosten) steht im **Anhang** `concept/sprint-change-proposal-2026-10-23-anhang.md`. Dieser Vorschlag sagt, welche Stellen in welchem Dokument sich dadurch ändern.

## 1. Problem

**Auslöser:** Review der Planung durch den Produktinhaber, noch vor der Umsetzung (es gibt noch keine Story-Dateien und keinen Sprint-Status). Art der Änderung: neue Anforderung des Produktinhabers.

**Problem:** Die Gefährten treten zu dicht hintereinander bei, und späte Figuren haben zu wenig Einsätze, um zu „zählen“. Das schwächt die Säule „Jeder zählt“.

**Belege:**

- Akt 1: 10 Figuren in 7 Missionen bei 5–7 Einsatzplätzen; Varek und Grosk treten in 1-5 und 1-6 bei.
- Akt 3: Pell tritt in 3-5 bei, eine Mission vor dem Staffelfinale; Harlan und Vesna in den beiden einzigen freien Missionen.
- Die Burg, eine der vier neuen Hauptmechaniken, kommt im MVP nicht vor; der Playtest kann sie nicht prüfen.

## 2. Auswirkungen

### Epics und Stories

| Epic | Auswirkung |
|---|---|
| 1–5, 7, 8 | keine |
| 6 Truppe, Fortschritt und Lager | neue Story 6.9: Paktwacht als Heimat auf Stufe 1 mit Gedenksteinen (aus Story 10.1 und dem Gedenkstein-Teil von 10.7); 6.8 Simulation über P + 8 |
| 9 Akt 1 (MVP) | 1-5 wird survive; 1-6 ist nicht mehr Finale; neue Stories für 1-7, 1-8 und Nebenquest N3 (Tobin); 9.1–9.11 werden 9.1–9.14 |
| 10 Burg | 10.1 wandert in Epic 6; 10.7 behält nur die Lektionen; Umnummerierung 10.2–10.8 → 10.1–10.7 |
| 11 Akt 2 | neue Mission 2-7 „Das Kontor am Silbermeer“; E8 wandert von 2-6 nach 2-7; Kronfeld wird 2-8; Nebenquest N6 (Jory); Nummern der Nebenquests verschieben sich |
| 12 Akt 3 | Pell tritt in 3-1 bei; neue Missionen 3-4 „Der Zweifler“ (Mael, E11) und 3-7 „Der Weg ins Gebirge“; Krönung, Drachen und Finale werden 3-5, 3-6, 3-8; Nebenquest N10 (Kit und Pell) |

Kein Epic entfällt, kein neues Epic entsteht. Die Reihenfolge bleibt; nur Story 6.9 liegt jetzt vor dem MVP-Release.

### Artefakte

| Artefakt | Konflikt |
|---|---|
| Game Brief | Umfang (20/7, 25–30 h), Akt-Tabelle und Kernloop („Räume ausbauen ab Akt 2“ bleibt, Burg aber ab 1-6) |
| GDD | Kampagnenstruktur, Reihenfolge, Missionsgrößen, Quest-System, Glutfunke-Quellen, Heimat, Kartentypen, Assets, Epic-Tabelle, Spielzeit |
| Narrative | Akt-Aufbau, Beats, Spannungskurve, Orte, Schlüsselgespräche, Missionsfolge, Entscheidungen (Orte von E3-Beitritt, E4, E8, E11), Nebenquests, Story Gating, Schreibumfang, Zeitleiste |
| Items | Nummern der Nebenquests (Signaturen, Relikte) und Missionsnummern in den Relikt-Stufen |
| Architektur | `home` hängt am Akt-Paket; Akt 1 braucht den Wechsel mitten im Akt; Beispiel-Manifest; Content-Menge und Spielzeit |
| UX | Heimat-Zeile in EXPERIENCE.md |
| Art Direction | Burg ab Akt 2 → ab 1-6; neue Orte für Dialog-Hintergründe |
| Addendum zum Brief | Burg-Absatz und Abgelöst-Hinweis (7 Nebenquests) |
| `21-gdd/epics.md` | **keine Änderung**: als abgelöst markiert, bleibt Herleitung |
| `01-decisions.md` | **keine Änderung**: eingefroren (AGENTS.md) |

### Technik

Es gibt keinen Code für Akt-Inhalte; betroffen ist nur die Planung. Eine kleine Erweiterung der Kampagnensprache wird nötig (Wirkung `setHome`, Ausbau erst ab Akt 2), umgesetzt in Story 6.9 nach dem Muster aus Architektur §8.2. `tools/simulate.ts` und `content/` bleiben unberührt, bis die Stories umgesetzt werden.

## 3. Empfohlener Weg

**Direkte Anpassung mit bewusst größerem MVP.**

- **Option 1 (direkte Anpassung): tragfähig.** Aufwand mittel, Risiko niedrig, weil nur Planung betroffen ist.
- **Option 2 (Rückbau): entfällt.** Es ist noch nichts umgesetzt.
- **Option 3 (MVP-Review): Der MVP wächst.** Er bekommt 2 Missionen, 1 Nebenquest und die Burg auf Stufe 1 dazu; der Produktinhaber hat das in F5 bestätigt.

**Begründung:** Das Problem liegt im Tempo der Beitritte, nicht in der Zahl der Figuren. Fünf zusätzliche Missionen und drei persönliche Nebenquests lösen es und bleiben deutlich unter der Erweiterung auf 30 Missionen und 15 Nebenquests. Die Burg im MVP prüft die Säule „Jeder zählt“ früh.

**Kosten** (Details im Anhang §1):

| | Änderung |
|---|---|
| Karten | +6 (36 statt 30) |
| Text | +16 % (~65 000 statt ~56 000 Wörter je Sprache) |
| Spielzeit | ~30–35 statt 25–30 Stunden |
| Stories | +7 (99 → 106) |

**Risiken:**

- Der MVP-Release kommt später.
- Wirtschaft und EP verteilen sich auf mehr Missionen; Story 6.8 kalibriert das per Simulation.
- Akt 1 zieht ein zweites Heimat-Diorama vor.

## 4. Änderungen im Einzelnen

Grundsatz: Die neuen Tabellen (Missionsfolge, Nebenquests) übernehme ich wörtlich aus dem Anhang §2 und §5. Unten steht je Dokument, was alt und was neu ist; reine Umnummerierungen sind zusammengefasst.

### 4.1 Game Brief (`20-game-brief/brief.md`, Log, Addendum)

| Stelle | alt | neu |
|---|---|---|
| Executive Summary | „drei Akte mit rund 20 Story-Missionen“ | „drei Akte mit 25 Story-Missionen (Prolog und je 8 pro Akt)“ |
| Kernloop 2 | „Im Lager bzw. in der Burg …“ | unverändert |
| Umfang | „20 Story-Missionen, 7 Nebenquests … 25–30 Stunden“ | „25 Story-Missionen, 10 Nebenquests … rund 30–35 Stunden“ |
| Akt-Tabelle, Akt 1 | „Am Ende erobert sie eine Burgruine.“ · „Prolog und 6 Missionen …, wanderndes Lager“ | „Mitten im Akt erobert sie eine Burgruine und muss sie im Finale halten.“ · „Prolog und 8 Missionen …, wanderndes Lager, Burg (Stufe 1) mit Gedächtnishalle“ |
| Akt-Tabelle, Akt 2 | „Heimat-Burg, Akademie …“ | „Burg-Ausbau, Akademie …“ |
| Offene Fragen | „über rund 20 Missionen“ | „über 25 Missionen“ |
| Addendum, Heimat-Burg | „Am Ende von Akt 1 erobert sie eine Burgruine, ab Akt 2 ist das ihr Zuhause.“ | „In Mission 1-6 erobert sie eine Burgruine, die ab dann ihr Zuhause ist; ausgebaut wird ab Akt 2.“ |
| Addendum, Abgelöst-Hinweis | „7 Nebenquests“ | „10 Nebenquests“ |
| Log | – | neuer Eintrag; der Eintrag „Burg ab Akt 2 … hält den MVP schlank“ gilt als ersetzt |

### 4.2 GDD (`21-gdd/gdd.md`, Log)

| Stelle | alt | neu |
|---|---|---|
| Überblick | „20 Story-Missionen, 7 Nebenquests“ | „25 Story-Missionen, 10 Nebenquests“ |
| Ziele | „25–30 Stunden“ | „30–35 Stunden“ |
| Kernloop 3 | „Lager in Akt 1, Burg ab Akt 2“ | „Lager zu Beginn von Akt 1, Burg ab Mission 1-6“ |
| Kampagnenstruktur | Story-Missionen „Prolog + 6 / 7 / 6“, Nebenquests „2 / 2 / 3“, Heimat Akt 1 „Lager; am Akt-Ende Eroberung der Burgruine“ | „Prolog + 8 / 8 / 8“, „3 / 3 / 4“, „Lager; ab 1-6 Burg auf Stufe 1“ |
| Reihenfolge | Ausnahme nur Akt 3 | Akt 1: nach der freien Mitte (1-2 bis 1-5) fest 1-6 → 1-7 → 1-8; Akt 3: nach drei freien Missionen fest 3-5 bis 3-8 |
| Missionsgrößen | „14 der 20 … 3 kompakt …“ | „19 der 25 mittel bis mittelgroß; 3 kompakt; 3 große Schlachten“ |
| Quest-System | „(20)“, „(7) … je ein Glutfunke“ | „(25)“, „(10) … 7 mit Glutfunke, 3 persönliche mit Signaturwaffe“ |
| Glutfunke | „1 je Nebenquest (7)“ | „1 aus 7 der 10 Nebenquests“ (Summe bleibt 12) |
| Heimat | „Ab Akt 2 übernimmt die Burg alle Funktionen.“ · „Gedächtnishalle (ab Akt 2)“ | „Ab Mission 1-6 übernimmt die Burg die Lagerfunktionen auf Stufe 1; Ausbau auf Stufe 2/3 und die Räume Verzauberer, Akademie, Werkstatt und Übungsplatz ab Akt 2.“ · „Gedächtnishalle (Gedenksteine ab 1-6, Lektionen ab Akt 2)“ |
| Kartentypen | Story 17 + 3, Nebenquest 7 | Story 22 + 3, Nebenquest 10 (davon 2 als Kartenvariante) |
| Missionsfolge-Regeln | – | ergänzt: „Jeder Beitritt hat in seinem Akt mindestens eine weitere Story-Mission; Akt-3-Beitritte spätestens in der vierten Mission.“ |
| Assets | „30 Karten (20 Story, 7 Neben…, 3 Reserve)“ | „36 Karten (25 Story, 8 Neben, 3 Reserve; 2 Nebenquests als Variante)“ |
| Epic-Tabelle | E6 „Burg … Akt 1 / Akt 2“, E8 „Prolog + 6 Missionen, 2 Nebenquests …, Burg-Eroberung“ | E6 „Lager und Burg Stufe 1 (Akt 1), Ausbau (Akt 2)“, E8 „Prolog + 8, 3 Nebenquests …, Burg erobern und halten“ |
| Erfolgskriterien | „Spielzeit 25–30 Stunden“ | „30–35 Stunden“ |
| Stufenkurve | Tabelle unverändert | Zusatz: „Verteilung auf 9/8/8 Missionen per verketteter Simulation (Story 6.8)“ `[ASSUMPTION]` |

### 4.3 Narrative (`22-narrative/narrative.md`, Log)

| Stelle | Änderung |
|---|---|
| Act Breakdown, Akt 1 | „Am Ende erobert …“ → „Mitten im Akt erobert die Truppe eine Burgruine, findet darunter die Gräber junger Könige und muss die neue Heimat im Finale gegen die Kopfgeldjäger halten.“ |
| Major Beats | Beat 6 „Junge Könige“ jetzt fest in 1-7; Beat 7 „Zuflucht Paktwacht“ in 1-6 (nicht mehr Finale); **neu 7b „Die Heimat halten“** (Akt-1-Finale: Morra findet das Versteck, Weg je nach E4) |
| Beat Placement | Akt 1: fest 3, 7, 6, 7b; frei 4, 5. Akt 3: 3 freie Missionen, ab der Krönung fest |
| Tension Curve, Key Moments | Gipfel Akt 1 = „die Verteidigung der Paktwacht“ |
| Key Locations | Paktwacht: „Heimat ab Akt 2“ → „Heimat ab 1-6“; neu: Gewölbe der Paktwacht, Kontor am Silbermeer, Pass ins Drachengebirge |
| Key Conversations | #5 „Eine Burg für Niemande“: Wann „Akt-1-Finale“ → „nach 1-6“ |
| Gefährten-Tabelle | Pell: Beitritt Akt 3 (3-1, mit Kit); Grosk: Beitritt nach 1-5 statt im Finale |
| Missionsfolge | vollständig ersetzt durch Anhang §2 (P + 8/8/8); Prüfsatz angepasst |
| Entscheidungen | E3 „Grosk tritt bei“ (direkt nach 1-5), E4 nach 1-6 (Folgen unverändert, dazu eine Szenenzeile in 1-8), E8 nach 2-7, E11 in 3-4 |
| Nebenquests | Tabelle ersetzt durch Anhang §5 (10 Quests, neue Nummern N1–N10) |
| Optional Content | „Nebenquests (7)“ → „(10)“ |
| Story Gating | „Die Burg ist erst ab Akt 2 nutzbar.“ → „Die Burg ist ab 1-6 nutzbar, Ausbau ab Akt 2.“; Akt 1 ab der Eroberung linear |
| Writing Scope | ~65 000 Wörter je Sprache (~130 000 gesamt); Main ~32 000, Side ~21 300, Lore ~7 000, UI ~5 000; Szenen 50 Story, 20 Nebenquest; ~4 650 Boxen |
| Zeitleiste | Akt 1: „Eroberung der Paktwacht; Gewölbe und Gräber junger Könige; Finale: die Paktwacht halten“; Akt 2 + Kontor; Akt 3 + Der Zweifler, Weg ins Gebirge |

### 4.4 Items (`21-gdd/items.md`)

- **Relikte §**
  - Schild der Paktwächter: N2 bleibt; Stufe 2 „2-7 Die Krone war hohl“ → „2-8“.
  - Drachenglut: N4 → **N5**; Stufen 2-7 → 2-8 und 3-5 → 3-6.
  - Aldrics Paktklinge: N7 → **N9**; Stufen 3-4 → 3-5 und 3-6 → 3-8.
- **Signaturen:** Ilka N3 → N4, Rhen N5 → N7, Brenna N6 → N8. Neu sind drei Signaturwaffen für Tobin (Lanze, N3), Jory (Wanderlaute, N6) und Pell (Bogen, N10); ihre Werte kommen in die Item-Stories.
- **Unikate:** „Truhe in 1-6“ und „Nebenziel in 3-3“ bleiben.

### 4.5 Architektur (`24-architecture/architecture.md`)

| Stelle | alt | neu |
|---|---|---|
| Übersicht Heimat | „Lager Akt 1, Burg mit 11 Räumen ab Akt 2“ | „Lager zu Beginn von Akt 1, Burg ab 1-6 (Ausbau ab Akt 2)“ |
| Content-Menge | „30 Karten, ~4 000 Dialogboxen“ | „36 Karten, ~4 650 Dialogboxen“ |
| §5.3 Wirkungen | – | neu `setHome`: `{ setHome: castle }` wechselt `c.home.kind`; Räume behalten ihre Stufe |
| Beispiel-Manifest Akt 1 | `m1_6` mit `fixed: finale`, `home: camp # ab Akt 2 castle` | `m1_6` mit `requires` (alle Mitte-Knoten) und `effects: [{ setHome: castle }]`, dazu `m1_7` und `m1_8` (`fixed: finale`); `home: camp` gilt als Startwert des Akts |
| Ausbau-Sperre | – | `buildRoom` prüft `requires: [{ act: 2 }]` aus `rooms.yaml`, also keine `if (act >= 2)` im Code (AR11 bleibt) |
| ADR-1 | „25–30 Stunden“ | „30–35 Stunden“ |

### 4.6 UX (`25-ux/EXPERIENCE.md`)

- Heimat: „Burg (ab Akt 2, elf Räume)“ → „Burg (ab 1-6; in Akt 1 sechs Räume auf Stufe 1 und Gedächtnishalle, ab Akt 2 elf Räume)“. Mockups bleiben gültig.

### 4.7 Art Direction (`23-art-direction/art-direction.md`)

- Paktwacht: „ab Akt 2 die Burg“ → „ab 1-6 die Burg (Ruine mit Stufe-1-Räumen), Ausbauteile ab Akt 2“.
- Dialog-Hintergründe: „rund 20“ → „rund 26“ (Gewölbe, Kontor, Pass, Pachthof, Gauklerlager, Unterstadt).

### 4.8 Epics (`26-epics/epics.md`, Log, HTML)

**Anforderungen**

| FR / NFR | neu |
|---|---|
| FR26 | „3 Akte mit 25 Story-Missionen (Prolog + 8 / 8 / 8); … Akt 1 ab der Eroberung (1-6) und Akt 3 ab der Krönung linear“ |
| FR33 | „10 Nebenquests (3/3/4) …; 7 mit Glutfunke, 3 mit Signaturwaffe“ |
| FR44 | „7 aus Nebenquests“ → „7 aus 7 der 10 Nebenquests“ (Summe 12 bleibt) |
| FR49 | „Akt 1 bis Mission 1-6 wanderndes Lager …“ |
| FR50 | „Ab Mission 1-6 Burg; in Akt 1 die Lagerfunktionen auf Stufe 1 und Gedenksteine; ab Akt 2 alle 11 Räume mit je 3 Stufen“ |
| FR55 | „Eroberung der Burgruine in Mission 1-6 macht die Burg sofort zur Heimat; das Akt-1-Finale 1-8 verteidigt sie“ |
| FR60 | „Prolog + 8 Story-Missionen, 3 Nebenquests (N1–N3) …, 2 Glutfunken im Finale 1-8“ |
| FR61 | „8 Story-Missionen …, N4–N6“ |
| FR62 | „8 Story-Missionen …, N7–N10“ |
| NFR16 | „30–35 Stunden“ |

Coverage Map: FR50 (Teil Akt 1) → Epic 6; FR55 → Epic 9 (Missionen 1-6 und 1-8).

**Epic 6:** neue **Story 6.9 „Die Paktwacht als Heimat“**. Wenn 1-6 gewonnen ist, wechselt `setHome` die Heimat auf die Burg. Das Burg-Diorama zeigt die sechs Lagerfunktionen auf Stufe 1 als Raumsteine; Ausbau-Bänder sind bis Akt 2 gesperrt (mit Grund). Die Gedächtnishalle zeigt Gedenksteine, Gerrits zuerst, ohne Lektion (UX-DR10, UX-DR11 Teil). Story 6.8: `--campaign act1` über P + 8.

**Epic 9**

| Story | Inhalt |
|---|---|
| Epic-Text | „8 Story-Missionen …, 3 Nebenquests …, Eroberung und Verteidigung der Paktwacht“ |
| 9.6 | Ziel `survive`; „Grosk tritt im Finale bei“ → „Grosk tritt direkt bei“ |
| 9.7 | wird „Mission 1-6 ‚Die Paktwacht‘ (seize) und E4“: Leutnants Hask, Ulvric, `setHome: castle`, Tafel „Das Banner auf der Ruine“; die Glutfunken wandern zu 9.9 |
| **9.8 neu** | Mission 1-7 „Unter der Paktwacht“ (treasure, Gräber junger Könige, Chronik versiegelt) |
| **9.9 neu** | Mission 1-8 „Die Heimat halten“ (Finale, defend, Morra und alle Akt-1-Leutnants, 2 Glutfunken, Szenenzeile je E4, Hinweis „Akt 2 erscheint bald“) |
| 9.8 → 9.10 | N1 |
| 9.9 → 9.11 | N2 |
| **9.12 neu** | N3 „Das Erbe“ (Tobin, Variante der Karte Erlbach, Signaturlanze, Gedenk-Variante) |
| 9.10 → 9.13 | Supports |
| 9.11 → 9.14 | Release; Spielzeit „30–35 Stunden“ |

**Epic 10:** Titel „Die Burg ausbauen (ab Akt 2) – grob“. 10.1 entfällt (jetzt 6.9), 10.7 wird „Lektionen der Gedächtnishalle“. Die Nummern rücken auf (10.2 → 10.1 … 10.8 → 10.7).

**Epic 11**

| Story | Inhalt |
|---|---|
| Epic-Text | „8 Story-Missionen …, 3 Nebenquests“ |
| 11.3 | E8 nicht mehr „über die Prinzessinnen-Missionen vorbereitet“, sondern in 2-6/2-7 |
| 11.5 | „N3“ → „N4“ |
| 11.6 | „N4“ → „N5“ |
| 11.7 | ohne E8 |
| **11.8 neu** | 2-7 „Das Kontor am Silbermeer“ (reach, Brakka, E8) |
| 11.8 → 11.9 | Kronfeld 2-8 |
| 11.9 → 11.10 | N4 und N5 |
| **11.11 neu** | N6 „Die Gauklertruppe“ |
| 11.10 → 11.12 | Supports |
| 11.11 → 11.13 | Release |

**Epic 12**

| Story | Inhalt |
|---|---|
| 12.2 | „tritt Kit bei“ → „treten Kit und Pell bei; 3-2 bis 3-4 sind frei wählbar“ |
| 12.3 | „N7“ → „N9“ |
| 12.4 | Leutnant Torvald statt Mael, ohne E11, mit E9 |
| **12.5 neu** | 3-4 „Der Zweifler“ (boss Mael, Nebenziel recruit, E11) |
| 12.5 → 12.6 | Krönung 3-5, „3-2 bis 3-4 gespielt“ |
| 12.6 → 12.7 | Drachen 3-6, ohne Pell-Beitritt |
| **12.8 neu** | 3-7 „Der Weg ins Gebirge“ (reach, Eluned, Drachen als Gelände-Gefahr) |
| 12.7 → 12.9 | Finale 3-8 |
| 12.8 → 12.10 | Epilog |
| 12.9 → 12.11 | „N7, N8, N9, N10“ mit „Kit und Pell in der Truppe“ |
| 12.10 → 12.12 | nach dem Finale |
| 12.11 → 12.13 | Release, „30–35 Stunden“ |

Danach entsteht die HTML-Ansicht neu mit `tools/docs/epics_html.py`. Die Validierung nennt 106 Stories.

## 5. Übergabe

**Umfang:** moderat. Das Backlog wird umgebaut, eine Neuplanung durch PM oder Architekt ist nicht nötig, weil die Architekturänderung nur aus einer Wirkung und einer Datenbedingung besteht.

| Wer | Aufgabe |
|---|---|
| Developer (Claude, diese Sitzung) | Änderungen aus §4 in alle Dokumente übernehmen, Decision-Logs ergänzen, HTML neu erzeugen, `pnpm lint` und `pnpm content:check` (unberührt, zur Sicherheit), Commit und PR |
| Produktinhaber (Marvin) | Freigabe dieses Vorschlags, Review des PR |
| danach | `gds-check-implementation-readiness`, dann `gds-sprint-planning` (es gibt noch keinen Sprint-Status, der angepasst werden müsste) |

**Erfolgskriterien:**

- Alle Dokumente nennen übereinstimmend 25 Story-Missionen, 10 Nebenquests, 12 Glutfunken, Burg ab 1-6 und 30–35 Stunden.
- Keine Stelle verweist auf alte Missions- oder Quest-Nummern; `grep` nach „Prolog + 6“, „7 Nebenquests“, „ab Akt 2“ (für die Burg) und „25–30“ findet nur noch Decision-Logs und eingefrorene Dokumente.
- `01-decisions.md` und `21-gdd/epics.md` bleiben unverändert.

## Checkliste (gds-correct-course)

| Abschnitt | Status |
|---|---|
| 1 Auslöser und Kontext | [x] Auslöser: Planungs-Review des Produktinhabers, keine Trigger-Story (1.1 N/A); Problem und Belege oben |
| 2 Epic-Auswirkung | [x] Epics 6, 9, 10, 11, 12 angepasst; keine neuen oder entfallenden Epics; Reihenfolge unverändert, Story 6.9 vor dem MVP |
| 3 Artefakte | [x] Brief, GDD, Narrative, Items, Architektur, UX, Art Direction; [N/A] Deployment, CI, Tests, Sprint-Status (noch keiner) |
| 4 Weg | [x] direkte Anpassung; Rückbau N/A; MVP wächst laut F5 |
| 5 Vorschlag | [x] dieses Dokument |
| 6 Abschluss | [ ] Freigabe durch den Produktinhaber ausstehend |
