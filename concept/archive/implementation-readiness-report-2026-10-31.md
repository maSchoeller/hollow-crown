---
title: 'Implementation Readiness Report – Hollow Crown, Epic 10 und 11'
date: 2026-10-31
project: 'Hollow Crown'
source: 'BMAD-Workflow gds-check-implementation-readiness (nicht interaktiv), Umfang Epic 10 „Die Burg ausbauen“ und Epic 11 „Akt 2 Glut“'
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: final
verdict: 'NEEDS WORK – nach den Story-Korrekturen aus Abschnitt 7.1 und den Antworten auf 7.2 READY'
includedFiles:
  - concept/26-epics/epics.md (Z. 1–345 Inventar und Reihenfolge, Z. 1727–3168 Epic 10 und 11)
  - concept/21-gdd/gdd.md, concept/21-gdd/decision-log.md, concept/21-gdd/extract-01-decisions.md (Z. 45–55)
  - concept/22-narrative/narrative.md (Figuren, Key Conversations, Missionsfolge, Entscheidungen, Nebenquests, Supports), concept/22-narrative/decision-log.md
  - concept/24-architecture/architecture.md (§5.4, §5.7, §5.10, §5.11, §8.1), concept/24-architecture/decision-log.md
  - concept/25-ux/EXPERIENCE.md, concept/25-ux/DESIGN.md, concept/25-ux/.decision-log.md, Mockups 04 und 08
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - Entscheidungen des Produktinhabers vom 2026-10-31 (Verfeinerung Epic 10/11, Runden E10-1 bis A2-4, Runde 6, frühere Übergaben)
  - Code-Stichprobe: src/content/{schemas,validate,ids,load}.ts, src/core/campaign/{camp,campaign,apply,aid,haunts,lieutenants}.ts, src/core/{state,defs}.ts, src/app/state/flow.ts, src/persistence/save.ts, content/core/{balance,classes,items,rooms,runes,skills,render}.yaml, content/acts/act1/*, content/world/valmora.yaml, tools/content-lock.ts
---

# Implementation Readiness Assessment Report

**Datum:** 2026-10-31
**Projekt:** Hollow Crown, Staffel 1
**Prüfgegenstand:** Epic 10 „Die Burg ausbauen“ (Stories 10.1–10.11) und Epic 11 „Akt 2 Glut“ (Stories 11.1–11.15) in `concept/26-epics/epics.md`, frisch verfeinert am 2026-10-31, gegen GDD, Narrative, Architektur, UX und Code.
**Gesamturteil:** **NEEDS WORK.** Die Verfeinerung ist gründlich: alle geprüften FRs und UX-DRs haben Stories mit testbaren Gherkin-Kriterien, die Narrative-Regeln für Akt 2 halten, die Entscheidungen des Produktinhabers sind fast ohne Abweichung übernommen, und 41 von 46 Code-Stichproben stimmen. Nicht READY, weil zwei Punkte den Start blockieren: Die Stories setzen voraus, dass Akt 1 noch nicht veröffentlicht ist, obwohl der MVP-Release (9.14) laut Plan vor Epic 10 liegt (dann scheitern 10.2/10.3 an `content:check`), und die Tor-Story 11.1 ist zu groß und lässt den Vertrag für `expectedLevel` offen. Dazu kommen neun wichtige Befunde, die sich fast alle in den Stories selbst beheben lassen.

## 1. Dokumentinventar (Schritt 1)

| Art | Datei | Stand |
|---|---|---|
| GDD | `concept/21-gdd/gdd.md` (+ `decision-log.md`) | am 2026-10-31 nachgezogen (Z. 139–152, 211, 231, 313–335, 345, 350–351, 370) |
| Narrative | `concept/22-narrative/narrative.md` (+ `decision-log.md`) | Missionsfolge Akt 2 und Prüfregel Z. 679–720 nachgezogen |
| Architektur | `concept/24-architecture/architecture.md` (+ `decision-log.md`) | §5.4 Z. 226–227, §5.7 Z. 298–300, §5.10, §8.1 nachgezogen |
| UX | `concept/25-ux/EXPERIENCE.md`, `DESIGN.md`, `.decision-log.md`, Mockups 04, 06, 08 | EXPERIENCE Z. 102 und 228 nachgezogen |
| Epics | `concept/26-epics/epics.md` | Epic 10: 10.1–10.11, Epic 11: 11.1–11.15 (Nummern stimmen mit `sprint-status.yaml` Z. 170–199 überein) |

Keine Duplikate. Alle Story-Verweise innerhalb und außerhalb der beiden Epics (6.9 → 10.6, 6.4 → Epic 10, Reihenfolge Z. 345) zeigen auf existierende Stories; referenzierte Fremd-Stories existieren (2.5, 6.1, 6.2, 6.4, 6.6, 6.8, 6.9, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8, 8.2, 8.5, 9.9, 13.2, 13.5, 14.5, 14.7; 13.2, 13.5, 14.5, 14.7 stehen auf `review`).

## 2. GDD-Analyse (Schritt 2, auf den Umfang beschränkt)

Geprüft wurden die FRs, die Epic 10/11 laut Coverage Map tragen (`epics.md` Z. 213, 223, 229, 231, 327, 331), mit ihren GDD-Abschnitten „Rollenklassen“ (Z. 134–158), „Heimat“ (Z. 313–335), „Fortschritt/Wirtschaft“ (Z. 259, 271, 277, 309, 345, 350–351), „Kampagne“ (Z. 224, 231, 366, 370–372) und der Narrative-Missionsfolge Akt 2.

| FR / UX-DR | Kurzfassung (Inventar `epics.md`) | Bemerkung |
|---|---|---|
| FR14 | 2 Profi-Wege je Rolle, 16 Profiklassen | – |
| FR15 | Fallensteller und Schatten | **Text Z. 54 veraltet:** „im Nebel unsichtbar bis zum Angriff“, „entschärfen“ – gilt seit 2026-10-31: unsichtbar, solange kein Gegner näher als 3 Felder steht, im Nebel immer; eigene Fallen zurücknehmen (GDD Z. 144) |
| FR17 (Akt 2) | Gegnertypen Akt 2 | Inventar nennt Ritter/Pegasusritter; Balliste und Brakka-Unikat stehen nur im GDD (Z. 152, 182, 211) |
| FR44 | Glutfunke, 12 Stück, Akademie, Moment | – |
| FR50–FR54 | Burg-Ausbau, Werkstatt, Gedächtnishalle, Übungsplatz, sichtbares Wachstum | – |
| FR61 | Inhalte Akt 2 | – |
| FR63 | DE und EN | – |
| UX-DR10, UX-DR11, UX-DR21 | Heimat/Raumsteine, Gedächtnishalle, Aufstieg | – |

## 3. Epic Coverage Validation (Schritt 3)

✓ = abgedeckt · ◐ = teilweise · ✗ = fehlt

| FR / UX-DR | Stories (Zeile in `epics.md`) | Status |
|---|---|---|
| FR14 | 10.3 (Z. 1900), Aufstieg 10.2 (Z. 1829), Anhängeteile 10.10 (Z. 2345) | ✓ |
| FR15 | 10.4 (Z. 1981), Fallen-Set 10.5 (Z. 2105) | ✓ (FR-Text Z. 54 nachziehen) |
| FR17 (Akt 2) | 11.3 (Z. 2606), Brakka-Klasse 11.2 (Z. 2582) | ✓ |
| FR44 | 10.2 (Akademie, Funken-Moment), 10.8 (3 Händler-Glutfunken, Z. 2255), 11.12 (N4/N5, Z. 3055/3060), 11.15 (Zählung, Z. 3153) | ✓ (Moment beim Erhalt aus N4/N5 nicht genannt, Befund k17) |
| FR50 (ab Akt 2) | 10.1 (Kosten, Gefährten, Zahlen-Stufen), 10.2 (Akademie), 10.5 (Verzauberer/Werkstatt), 10.6, 10.7, 10.8 (Funktionen 2/3), 10.9 (Traits) | ◐ – „größeres Sortiment“ (Händler Stufe 2) hat Mechanik in 10.8, aber **keine Story liefert die Liste** (Befund W1) |
| FR51 | 10.5 | ✓ |
| FR52 | 10.6 | ✓ |
| FR53 | 10.7 | ✓ |
| FR54 | 10.11 | ◐ – hängt an der 3D-Entscheidung des Produktinhabers (bewusst) und verlangt Daten für 5 Akt-3-Gefährten (Befund W6) |
| FR61 | 11.1–11.15 | ✓ (8 Story-Missionen, N4–N6, 4 Leutnants, E5–E8, Region, Burg als Heimat) |
| FR63 | Epic 10: 10.1, 10.3, 10.5, 10.6, 10.9 (Locales); Epic 11: alle Missions-Stories, 11.2, 11.3, 11.14 | ✓ |
| UX-DR10 | 10.1 (Pips, Pfeil, Ausbau-Band, Z. 1788–1798), 10.11 (Diorama) | ✓ |
| UX-DR11 | 10.6 (Z. 2165–2169) | ✓ |
| UX-DR21 | 10.2 (Z. 1854–1864) | ✓ |

**Statistik:** 14 geprüfte Anforderungen, 12 vollständig, 2 teilweise (FR50, FR54), 0 fehlend. Die Lücken des Berichts vom 2026-10-23 (FR44 Händler-Glutfunken, FR50/G3 Raumstufen-Effekte) sind mit 10.8 geschlossen.

## 4. Konsistenz mit den Konzeptdokumenten (Schritt 4, UX und Delta)

### 4.1 Widersprüche zwischen Story-Kriterien und Konzeptdokumenten

| # | Story (Z. `epics.md`) | Dokument (Zeile) | Widerspruch | Schwere |
|---|---|---|---|---|
| D1 | 11.3 Z. 2635, 11.7 Z. 2821 | GDD Z. 211, GDD-Log Z. 98, Entscheidung A2-3 | KI bedient die Balliste mit Profil `hold` **oder `guard`** und „wenn sie in ihrer Reichweite liegt“; entschieden ist „nur `hold` oder schon daneben“. Abweichung von einer PO-Entscheidung | wichtig (W8) |
| D2 | 11.6 Z. 2754, 2770–2775 | GDD Z. 231, Architektur §5.7 Z. 300, Arch-Log Z. 98, GDD-Log Z. 96 | Story baut neues Profil `follow_ally`; alle Dokumente nennen das vorhandene Profil `follow` | klein (k13) |
| D3 | 11.3 Z. 2629 | Arch-Log Z. 98 („Balliste … mit Werten aus `balance.yaml`“) | Story legt die Werte ins Item `ballista_bolt` in `items.yaml` | klein (k13) |
| D4 | 10.1 Z. 1781 | Architektur §8.1 Z. 619, §5.2 Z. 153 | Story: fehlender Raum-Gefährte = `room_locked`; Architektur-Beispiel: `companion_missing`, andere Prüfreihenfolge (Gold vor Gefährte) | klein (k3) |
| D5 | 10.2 Z. 1842 | Architektur §5.11 Z. 360 (`kind: promotion`) | gewollt, die Story korrigiert die Architektur (Code hat `kind: seal`) | – |
| D6 | 10.3 Z. 1954 | GDD Z. 145 („Bannerträger: Nachbarn ignorieren Trauer, +5 Ausweichen“) | GDD lässt offen, wer +5 Ausweichen bekommt; Story wählt „nur der Träger“ als `[ASSUMPTION]` | PO (P1) |
| D7 | 11.12 Z. 3071 | GDD Z. 350 | Kriterium „GDD-Satz anpassen“ ist bereits erledigt | klein (k4) |
| D8 | 10.1 Z. 1792, Z. 1821 | EXPERIENCE Z. 102, UX-Log 2026-10-31, Architektur §5.10 Z. 348, §8.1 Z. 624 | Nachzieh-Kriterien bereits erledigt | klein (k4) |
| D9 | 10.1 Z. 1796 (grüner Pfeil = Ausbau jetzt möglich) | EXPERIENCE Z. 224 (Flow Mara: „grüner Pfeil: In der Taverne wartet ein neues Söldner-Angebot“, in Akt 1), DESIGN Z. 308 („grüner Pfeil = ausbaubar, Glut-Zahl = Neues“) | EXPERIENCE verwechselt Pfeil und Neu-Zahl; in Akt 1 kann kein Pfeil erscheinen | klein (k2) |
| D10 | 11.8 Z. 2869 („Weltkarten-Variante von Brandhang“) | Narrative Z. 699, Entscheidung A2-2 | Entscheidung gedeckt, aber `worldSchema.places` (`src/content/schemas.ts` Z. 653–662) kennt keine Varianten; Mechanik und Bild fehlen in der Story | wichtig (W9) |
| D11 | Epic 10 Z. 1733 („solange Akt 1 nicht veröffentlicht ist, braucht es keine Migration“), 11.1 Z. 2485 | `epics.md` Z. 345 (Reihenfolge: 9.14 MVP-Release → 14 → 10 → 11), `AGENTS.md` „Akt-Release“ | Voraussetzung im geplanten Ablauf falsch (Details W/K1) | kritisch (K1) |
| D12 | – | Narrative Z. 446/611 (6 S-Ränge, 75 Gespräche) | 11.14 schreibt 26 Gespräche für Akt 2 (8 Paare C/B/A + 2 S) – passt zu Z. 762–797 | ✓ |

### 4.2 UX-Abgleich

- UX-DR10/11/21 sind mit Mockups 04 und 08 abgedeckt; 10.2 verweist richtig darauf, dass die Daten statt der Beispielzahlen in Mockup 08 gelten.
- Fallen-Markierung, „verborgen“-Zeichen und Flieger-Kennung (10.4 Z. 2034–2036, 11.3 Z. 2623) sind neue diegetische Elemente ohne DESIGN-Komponente; die Stories legen Aussehen in `render.yaml` ab. Empfehlung: Abnahme per Screenshot reicht, DESIGN-Komponententabelle nachziehen (klein, nicht als Befund gezählt).
- Werkstatt- und Akademie-Panel folgen dem Listen-Muster (EXPERIENCE Z. 45). ✓
- Titeltafel „Akt 2 · Glut“ (11.1 Z. 2522–2526) folgt Narrative Z. 804. ✓

## 5. Epic Quality Review (Schritt 5)

### 5.1 Epic-Struktur

| Epic | Spielerwert | Unabhängig | Bewertung |
|---|---|---|---|
| 10 Burg ausbauen | ja | **nein, aber offen benannt:** hängt an 11.1 (`c.act`, `levelCap`, IDs), Z. 1729; Reihenfolge Z. 345 verschränkt die Epics | ◐ (Epic N braucht Epic N+1; akzeptabel, weil benannt und per Fixture entkoppelt, k16) |
| 11 Akt 2 | ja | braucht 10.2/10.3 erst für 11.15 (benannt) | ✓ |

Technische Stories: 11.1 (Akt-Übergang) und 11.15 (Abstimmung) sind Entwickler-/PO-Stories mit Spielerwert-Aussage; im Brownfield-Kontext vertretbar.

### 5.2 Abhängigkeiten zwischen Epic 10 und 11

Reihenfolge laut Z. 345, 1731, 2449: **11.1 → (10.2 → 10.3) ∥ (11.2 → 11.3 → 11.4) → 10.1 → 10.4 → 10.5 → 10.6 → 10.7 → 10.8 → 10.9; Stränge 11.5–11.10, Nebenquests 11.12/11.13, 11.14 → 11.11 → 11.15; 10.10 nach 10.3; 10.11 nach PO-Entscheidung.** Keine Zirkel gefunden. Datei-Zuständigkeit (`rooms.yaml` Epic 10 mit der Ausnahme 11.1 Z. 2493; Profiklassen und Glutfunke Epic 10; Abschnitt „Gegnertypen“ in `classes.yaml`, Stahl-Block in `items.yaml`, Akt-Schlüssel in `balance.yaml` Epic 11) ist widerspruchsfrei mit drei Ausnahmen:

1. **Rabatt-Summe doppelt:** 10.8 (Z. 2240–2253, Schlüssel `economy.maxDiscountPct`) und 11.8 (Z. 2872–2874, Schlüssel `merchant.maxDiscountPct`) bauen dieselbe Deckelung mit verschiedenen Schlüsseln (W2). Die Summierung selbst existiert schon (`shopPrice` in `src/core/campaign/aid.ts` Z. 9–12).
2. **Händler-Liste `roomLevel: 2`:** Epic-10-Intro Z. 1729 und 10.8 Z. 2226 sagen, Epic 11 liefere sie; 11.2 Z. 2599 liefert nur `merchantTier`-Stufen 1/2, keine Liste mit `roomLevel` (W1).
3. **Anfeuern auf zwei Ziele doppelt:** 10.3 Barde (`cheerTargets: 2`, Z. 1953) und 11.13 `final_curtain` (Item-Feld `cheer: { targets: 2 }`, Z. 3099) bauen zwei Wege für dieselbe Mechanik, ohne Reihenfolge und Stapelregel (W3).

Verweise auf Story-Nummern stimmen (Epic 10: 10.1–10.11, Epic 11: 11.1–11.15). 11.15 wartet nur auf 10.2/10.3 (Z. 2449, 3144), obwohl 10.1, 10.7 und 10.8 Gold, EP, Glutfunken und Rabatte von Akt 2 verändern (W5).

### 5.3 Vorwärtsabhängigkeiten ohne Nennung (Epic 11)

Epic-11-Stories haben keine Zeile „Abhängigkeiten“; der Reihenfolge-Absatz Z. 2449 erlaubt Stränge und Nebenquests „in beliebiger Reihenfolge“. Das bricht an diesen Stellen, weil `content:check` unbekannte Flags und Knoten ablehnt (`src/content/validate.ts` Z. 122–150):

| Story | braucht | geliefert von |
|---|---|---|
| 11.6 Z. 2781, 11.9 Z. 2892/2908, 11.11 Z. 2993 | Flag `joined_sable` | erst 11.8 (E7 `warn`) |
| 11.9 Z. 2913 | Flag `e07` | 11.8 |
| 11.12 N4 Z. 3023 | Knoten `m2_4` | 11.7 |
| 11.12 N5 Z. 3040, 3061 | Knoten `m2_5`, Flag `brandhang_burned` | 11.8 |
| 11.13 Z. 3097–3101 | Anfeuern-Mehrfachziel | 10.3 (oder eigene Kopie, W3) |
| 11.6, 11.8, 11.10 | Knoten `m2_2`, `m2_4`, `m2_6` | 11.5, 11.7, 11.9 (strang-intern, implizit klar) |

### 5.4 Story-Größe

Zu groß für eine Bau-Session (Empfehlung: teilen):

| Story | Inhalt | Vorschlag |
|---|---|---|
| **11.1** (Z. 2463–2545) | Multi-Akt-Loader mit 88 Lesestellen von `data.campaign` (Story sagt „rund 60“), Übergang, Normalisierung, Positionsstufe + `levelOffset`, Beitrittsstufe, Paket/Build-Plugin, Titeltafel, Nebel, Heimsuchungen, 4 Sim-Optionen, Testkarte | 11.1a Loader + Übergang + Speicherstand (das, was Epic 10 braucht); 11.1b Positionsstufe, `levelOffset`, Beitrittsstufe; 11.1c Paket `act2` + Titeltafel + Nebel; 11.1d Simulation über Akte |
| 10.3 (Z. 1900–1979) | 10 neue Klassen, 14 Profi-Skills mit 11 neuen Effekt-Bausteinen, Vorschau, KI, Akademie-Anzeige, Steckbriefe, Sim-Option | 10.3a Klassen, Werte, Schema, passive Skills; 10.3b Wirkungen mit Vorschau/KI (Schutz, Rückstoß, Konter zuerst, Flächen, Anfeuern) |
| 10.8 (Z. 2220–2295) | 7 unabhängige Funktionen (Sortiment, Angebot des Tages, Rabatt, Glutfunke-Rotation, Vorlagen, Bestes anlegen, Wunschrolle, Trauer, Trank) | Händler (Sortiment, Angebot, Rabatt, Glutfunke) / Konvoi (Vorlage, Bestes anlegen) / Taverne, Heiler, Schmied |
| 11.3 (Z. 2606–2663) | Gegnergruppen, Flieger-Darstellung, Balliste (Aktion, Vorschau, KI, Autoplay, Gefahrenzone), Lektionen, Herbst-Boden, Heimsuchungs-Pools, Testkarte, Grafik-Prompts | 11.3a Balliste; 11.3b Flieger, Gegner, Herbst, Pools |
| 11.11 (Z. 2958–3005) | Kern-Erweiterung Ziel-Phasen + 24×28-Karte mit ~30 Gegnern + Leistungsmessung | Ziel-Phasen als eigene Kern-Story vor 11.11 |
| 11.12 (Z. 3007–3072) | zwei Karten + Relikt-Stufen-Mechanik (auch rückwirkend für das Akt-1-Relikt) + Signaturbogen + Schnee-Regel | Relikt-Stufen als eigene Story; N4 und N5 getrennt |

Grenzwertig, aber machbar: 10.4, 10.5, 11.6.

### 5.5 Akzeptanzkriterien

Durchgehend Gherkin, mit Fehlercodes, Replay- und Determinismus-Tests, Screenshots und Sim-Korridoren; das ist deutlich besser als der Stand vom 2026-10-23. Unscharf bzw. nicht messbar: 11.4 Z. 2698 („ein Satz, der zur Haltung passt“), 10.11 Z. 2438 („scharf“), 11.15 Z. 3157 (Spielzeitanteil). Fehlende Fehlerreihenfolge bei mehreren verletzten Bedingungen (`buildRoom`, `promote`, `craft`): „genau ein Fehlercode“ ist ohne Priorität nicht eindeutig testbar (k3).

### 5.6 `[ASSUMPTION]` – eher Produkt- oder Designentscheidungen

Von 102 Markierungen in Epic 10/11 sind die allermeisten abgeleitete Zahlen (Werte, Gegnerzahlen, Gold, Rezepte, Lektionen, Traits, Pools). Diese zehn sind eher Entscheidungen:

| # | Zeile | Annahme | Warum Entscheidung |
|---|---|---|---|
| P1 | 1954 | Bannerträger: +5 Ausweichen nur für den Träger | GDD Z. 145 lässt Träger oder Nachbarn offen; ändert die Rolle des Wegs |
| P2 | 2196 | Reserve-EP des Übungsplatzes auch für Söldner | Wirtschaft (Söldner werden dauerhaft mitgezogen) |
| P3 | 2257 | Glutfunke beim Händler ohne Rabatt | Preis des knappsten Items, berührt die Rabatt-Entscheidung „bis −30 %“ |
| P4 | 2289 | „Trank verstärken“ auch im Lager von Akt 1 | ändert die Wirtschaft des dann veröffentlichten Akts 1 |
| P5 | 2024–2025 | Schatten: Konter enthüllen nicht; KI-Wegsuche hält sein Feld für unpassierbar | Ausnutzbar (unsichtbare Sperre in Engstellen), Regelfrage |
| P6 | 2987 | Kronfeld: „Hälfte“ bezieht sich auf Lebende zu Beginn der Fluchtphase | Entscheidung A2-2 sagt „Hälfte der Eingesetzten“ |
| P7 | 2913 | Verbranntes Dorf in 2-6 auch, wenn E7 noch nicht gefallen ist | Wählt der Spieler danach „Befehl ausführen“, brennen zwei Dörfer; Entscheidung A2-2 knüpft die Szene an „warnen“ |
| P8 | 1875 | Wegwechsel (Akademie 2) gesperrt, sobald der Zweit-Effekt gelernt ist | Regel zwischen zwei PO-Entscheidungen (E10-3) |
| P9 | 2828 | E6 „bleibt“: Sable-Groll −1 auch vor dem ersten Treffen, nie unter 0 | in den meisten Reihenfolgen wirkungslos (Groll steigt erst nach Vertreibung); Folge der Entscheidung kaum spürbar |
| P10 | 1767, 2788, 2829 | (keine Markierung, Folge) Akademie (Varek/Odile) und Taverne (Varek/Jory) | Gehen Odile (E5 `return`) und Varek (E6 `pardon`), ist der Akademie-Ausbau für die Kampagne dauerhaft gesperrt – Wegwechsel und Zweit-Effekt fallen weg |

### 5.7 Narrative-Regeln Akt 2 (Prüfauftrag 6)

| Regel | Ergebnis |
|---|---|
| Jeder Leutnant ≥ 2 Story-Missionen inkl. Finale | Brakka 2-1, 2-7, 2-8 ✓ · Grell 2-2, 2-5, 2-8 ✓ · Rowena 2-4, 2-6, 2-8 ✓ · Sable 2-3, 2-5 (nicht feindlich, gilt als getroffen), 2-6, 2-8 ✓ mit der dokumentierten Ausnahme (Narrative Z. 720, Wechsel in 2-5 vor 2-3/2-6) |
| Kein Ziel zweimal direkt hintereinander unter der Freischaltung | Story-Ziele survive, treasure, escort, boss, defend, rout, reach, survive→escape: alle sieben freien Missionen haben verschiedene Ziele, 2-1 (survive) liegt nie direkt vor 2-8 ✓. Zählen Nebenquests mit, entstehen Paare (2-5 defend → N4 defend; N5 treasure ↔ 2-2 treasure; N6 rout ↔ 2-6 rout; k14) |
| Jeder Beitritt hat danach noch eine Story-Mission im Akt | Jory 2-1, Nell 2-2, Odile 2-3, Ilka 2-4, Brann 2-5, Sable 2-5 (E7), Amos 2-6: in jeder Reihenfolge folgt mindestens 2-8 ✓ |
| Positionen | 2-2/2-4/2-6 Position 1–5, 2-3/2-5/2-7 2–6, 2-1 0, 2-8 7 – rechnerisch korrekt; Beitrittsbeispiel Nell (Z. 2512) korrekt |
| Freischaltung | 11.4/11.5/11.7/11.9 setzen A2-1 exakt um; N4 nach 2-4, N5 nach 2-5, N6 nach 2-1 ✓ |
| Stränge gegen die „anderen“ Anwärter | 2-2 Herzogin, 2-3 Dravn, 2-4 Prinzessin, 2-5 Herzogin, 2-6 Prinzessin + Dravn ✓; 2-7 als dokumentierte Ausnahme ✓ |
| Chronik Akt 2 | a2_saltpass (2-2), a2_eyrie (2-4), a2_ledger (2-7), a2_mine (N5) ✓ (A2-3) |
| Glutfunken | N4, N5 + 3 Händler; N6 ohne, 2-8 ohne ✓ (GDD Z. 277, 309) |

## 6. Code-Realität (Prüfauftrag 5, 46 Stichproben)

✓ = existiert wie beschrieben · ✗ = falsche Annahme · ○ = von der Story neu angelegt, richtig als neu beschrieben

| Gegenstand | Fundstelle | Ergebnis |
|---|---|---|
| `roomLevel` (liefert ohne Eintrag 1) | `src/core/campaign/camp.ts` Z. 100 | ✓ |
| `nextRoomLevel`, `homeRooms`, `lockReason` | `camp.ts` Z. 114, 134; `src/app/screens/Rooms.tsx` Z. 56 | ✓ |
| `roomSchema.function`-Enum (8 Werte), `levels` nur `requires` | `src/content/schemas.ts` Z. 462–470 | ✓ |
| `rooms.yaml`: 8 Räume, Stufe 2/3 `requires: [{ act: 2 }]`, `storyCount` bei Schmied/Heiler/Taverne/Lagerfeuer | `content/core/rooms.yaml` | ✓ |
| Bedingungen `alive`, `any`, `act`, `storyCount` | `schemas.ts` Z. 441–455 | ✓ |
| `joinLieutenant` (Erwartungswert-Wachstum, Klassengrenzen) | `src/core/campaign/lieutenants.ts` Z. 149–170 | ✓ |
| `refreshOffers`, `c.offers`, `buyOffer` | `campaign.ts` Z. 467; `state.ts` Z. 283; `apply.ts` | ✓ |
| `refreshTavern`, `economy.tavern.classes` | `campaign.ts` Z. 427; `balance.yaml` Z. 193–199 | ✓ |
| `autoEquip`, `grantExp`, `levelUp`, `recordFromChar` | `campaign.ts`, `battle/create.ts`, `rules/combat.ts`, `battle/apply.ts` | ✓ |
| `promotionTargets`, `sealOf`, Command `promote` | `apply.ts` Z. 30–36, 132–134, 387 | ✓ |
| `levelCap` (Akt 1 = 10) | `acts/act1/campaign.yaml`, `schemas.ts` | ✓ |
| `merchantTier`, `currentTier`, `merchantStock` | `schemas.ts`, `flow.ts`, `campaign.ts` | ✓ |
| `hauntGold`, `hauntLevel` (liest `expectedLevel` des Knotens) | `campaign.ts`, `haunts.ts` Z. 27–29 | ✓ |
| `fogTop(world, act)` | `src/app/screens/worldMapView.ts` Z. 60 | ✓ |
| `devMap` (nur Map-Id, kein Akt) | `src/app/state/flow.ts` Z. 506 | ✓ (Story ergänzt Akt) |
| `metaFromCampaign` mit `act: 1` fest | `src/persistence/save.ts` Z. 179 | ✓ |
| `markBackupReminded`, `duePacks`, `reachedAct`, `actFinished`, `hasPackForAct`, `moreMissionsFollow` | `apply.ts`, `src/app/state/packs.ts`, `src/packs/plan.ts` | ✓ |
| `nodeDef` | `src/app/state/flow.ts` Z. 84 (App-Schicht, ohne `data`) | ✗ als neu beschrieben (11.1 Z. 2474), Namensgleichheit (k10) |
| Lesestellen `data.campaign` | 88 Treffer in `src`/`tools` | ✗ „rund 60“ (11.1 Z. 2474) |
| `expectedLevel` als Pflichtfeld je Knoten, gelesen in `refreshTavern`, `WorldMap.tsx`, `Prep.tsx`, `flow.ts` (Dev-Start), `validate.ts` (Monotonie), `simCampaign.ts` | `schemas.ts` Z. 628 u. a. | ✗ 11.1 nennt nur `hauntLevel` und Sim (K2) |
| `ui.map.level` zeigt schon die Stufe je Knoten | `WorldMap.tsx` Z. 515 | ✗ 11.1 Z. 2507 legt `ui.map.levelApprox` neu an (k10) |
| `economy.smithMaxUpgrade [3,4,5]`, `rerollFromSmithLevel 3` | `balance.yaml` Z. 191–192 | ✓ |
| `supports.campfireMaxRank [B,A,S]`, `thresholds A 45 S 70`, `unlockableRank` | `balance.yaml` Z. 44, 59; `camp.ts` Z. 78 | ✓ |
| `economy.potionUpgrade [{400,5},{900,5}]`; Kampf liest `inst.upgrade` | `balance.yaml` Z. 186; `battle/apply.ts` Z. 387 | ✓ (Command fehlt, Story legt es an) |
| `economy.scarRemoval { gold: 2500, altItem: seers_herb }`, `tavernOffersPerChapter`, `supports.griefMissions 3`, `economy.convoySize 200`, `economy.runeMerge` | `balance.yaml` | ✓ |
| `supports.guardChance A 20 S 30`, `griefHitPenalty`, `status.knockbackBlockedDamage`, `experience.healExtraTarget`, `advancedLevelOffset 15`, `levels.promoteFrom 10`, `skills.loadoutAdvanced 5`, `classActions.cheer`, `ai.followRadius/followDanger/objectiveBonus` | `balance.yaml` | ✓ |
| `supports.guardMaxTotal`, `economy.maxDiscountPct`, `enchanterMergeMaxTier` | – | ○ |
| Status `slowed`, `knockback`; `status.slowMovPenalty`, `durationRounds` | `defs.ts`, `rules/effects.ts`, `balance.yaml` Z. 27–31 | ✓ |
| `lieutenant.bounty.materialByAct { 1: iron_ore }`, `scaling.tierUp` | `balance.yaml` Z. 240, 244 | ✓ |
| `simulation.levelTolerance`, `goldCurve.perAct['2'] [2000,3000]` | `balance.yaml` Z. 137, 146 | ✓ (alle Akt-2-Missionsgolds 2 000–3 000 liegen darin) |
| Klassen `knight` (armored), `pegasus_knight` (flier), `brigand`, `duelist`, `bulwark`, `breaker`, `sharpshooter`, `sage`, `bishop`, `tactician`, `captain`; `proPaths` je Rolle | `content/core/classes.yaml` | ✓ (`bulwark`/`breaker` heute `foot`, MOV 6 – 10.3 gleicht an) |
| Rollen-Skills `counter_instinct`, `phalanx`, `eagle_eye`, `elemental_focus`, `blessing`, `climber` (Späher); PoC-Skills `sol`, `impale`, `longshot` | `classes.yaml`, `skills.yaml` | ✓ (`climber` bleibt wegen Späher/Brigand – 10.3 berücksichtigt das) |
| Skills `tactician_command`, `rally`, `warden_ward`, `precision` | `skills.yaml` | ✓ (Klassen-Aktion heißt aber `command`, k8) |
| Skill-Effekte `adjacentAllies`, `hpBelowPercent`, `notMovedThisTurn`, `bagChargeSaveChance`, `healBonus`, `strikeFirst`, `moveThroughEnemies`, `aura` | `schemas.ts` Z. 202–239 | ✓; `hidden`, `grantAction`, `source: legacy` ○ |
| Items `ember_spark` (`kind: seal`, `convoyOnly`, 3000), `promotion_seal` (`use.promote`) | `items.yaml` Z. 117, 119 | ✓ |
| `dawnbreaker` mit Kommentar „Kap. 4“ | `items.yaml` Z. 88 | ✓ |
| `pact_warden_shield`, `moonsteel`, `iron_ore`, `seers_herb`, `fire_bomb`, `door_key`, `haste_scroll`, `remedy_salve`, `vulnerary`, `heal_staff`, `mend_staff`, `hammer`, `longbow`, `tower_shield`, `iron_dagger`, alle Akt-2-Händler-Teile Stufe 0 | `items.yaml` | ✓ (`moonsteel` existiert schon – 10.5 Z. 2050 überschätzt die Abhängigkeit, k15) |
| `steel_dagger`, `stone_fist`, `shadow`, `armorpiercer`, `silverwing`, `white_wolf`, `final_curtain`, `dragon_ember` | – | ○ |
| Runen `fire_rune_1`, `light_rune_1`, `earth_rune_3`, `dark_rune_1` (nur Beute) | `content/core/runes.yaml` | ✓ |
| `runeMerge()`, `insertRune`, `removeRune`, `shopPrice` (summiert `priceMods` schon) | `camp.ts` Z. 59, `apply.ts`, `aid.ts` Z. 9 | ✓ |
| Kartenobjekt `ballista` (nur Typ, keine Aktion) | `defs.ts` Z. 359, `schemas.ts` Z. 382 | ✓ |
| KI-Profile `hold`, `guard`, `raider`, `follow` (zieht zum Ausgang, greift nie an), `untargetable` | `defs.ts` Z. 337–348, `ai.ts` Z. 255 | ✓ |
| `render.yaml`: `variants.tree.2` (`autumn_a/b/c`), `season.2`, Wetter `snow: acts [3]`, `propFallback` | `render.yaml` Z. 43, 46, 96–122 | ✓ |
| Ortsbilder `grauwacht`, `salzpass`, `brandhang`, `kronfeld`, `paktwacht_ruine` | `art/mockups/locations-s1/` | ✓ |
| Orte `m2_1`…`m2_8`, `n4`–`n6` ohne `node` | `content/world/valmora.yaml` | ✓ |
| `c.fallen[].classId`, `c.left`, `c.priceMods`, `c.act` | `src/core/state.ts` Z. 243–295 | ✓ |
| Gerrit-Stein, `acts/act1/memorials.yaml`; `core: true` in `supports.yaml` | `content/acts/act1/` | ✓ |
| `.vn-sparks` in `Dialogue.tsx`/`.css` | `src/ui/Dialogue.tsx` Z. 96 | ✓ |
| `tools/art/ground.py`, `blender_parts.py`, `prepare_tripo_unit.py`, `tools/build/packs-plugin.ts`, `tests/unit/packs.test.ts`, `migrations.test.ts`, `figureBudget` | `tools/`, `tests/unit/` | ✓ |
| Trait-Liste (Zäh, Flink, Gierig, Feigling, Veteran, Elementkind, Unbeholfen) | `concept/21-gdd/extract-01-decisions.md` Z. 50 | ✓ |
| `content:lock` sperrt Items, Skills, Klassen, Knoten, Räume … | `src/content/ids.ts` Z. 39–53 | ✓ – relevant für K1 |
| `released-ids.json`, `renames.yaml` | – | existieren noch nicht (entstehen mit 9.14) |

**Ergebnis:** 41 von 46 Annahmen stimmen; falsch sind die Lesestellen-Zahl, `nodeDef` als neu, die vergessenen `expectedLevel`-Leser, das schon vorhandene `ui.map.level` und die Abhängigkeit von `moonsteel`.

## 7. Befunde nach Schwere

### 7.1 Fix in den Stories möglich (Ableitung oder Korrektur)

#### 🔴 Kritisch

**K1 – Release-Voraussetzung falsch (Z. 1733, 1841–1842, 1913, 2485).** Epic 10 sagt „solange Akt 1 nicht veröffentlicht ist, braucht es keine Migration“; laut Reihenfolge Z. 345 liegt der MVP-Release 9.14 (mit `pnpm content:lock`) **vor** Epic 10. Danach sind Items, Skills und Klassen gesperrt (`src/content/ids.ts` Z. 39–53), und `content:check` scheitert an den Löschungen in 10.2 (`promotion_seal`) und 10.3 (`sol`, `impale`, `longshot`).
*Fix:* Satz Z. 1733 ersetzen durch „Akt 1 ist veröffentlicht: entfernte IDs brauchen einen Eintrag in `content/renames.yaml`, geänderte Spielstände eine Migration mit Fixture (`AGENTS.md`, Akt-Release 3)“. In 10.2 `promotion_seal: ember_spark` in `renames.yaml` (kein Spieler besitzt das Siegel im MVP, es ist nirgends erhältlich); in 10.3 die drei Skills als Umbenennung auf den neuen Profi-Skill der Klasse (`sol: pro_duel`, `impale: pro_guard`, `longshot: pro_far_shot`) oder behalten und nur von den Klassen lösen. 11.1 Z. 2485: Fixture aus dem echten Akt-1-Release statt einer selbst gebauten.

**K2 – Tor-Story 11.1 zu groß und `expectedLevel`-Vertrag unvollständig (Z. 2463–2545, bes. 2474, 2502–2507).** 11.1 blockiert beide Epics. Sie bündelt zehn Lieferteile (Abschnitt 5.4). Zusätzlich lässt sie offen, was aus dem Pflichtfeld `expectedLevel` (`schemas.ts` Z. 628) und seinen Lesern wird: `refreshTavern` (Söldner-Stufe, `campaign.ts` Z. 432), `validate.ts` Z. 296–307 (Monotonie je Akt), `WorldMap.tsx` Z. 515 und `Prep.tsx` Z. 112 (zeigen heute schon `ui.map.level`), `flow.ts` Z. 444–459 (Dev-Start), `simCampaign.ts` Z. 203/268.
*Fix:* Teilen in 11.1a–d (Abschnitt 5.4); für Epic 10 reicht 11.1a. In 11.1b eine Funktion `nodeLevel(data, c, node)` festlegen, die für Akt-1-Knoten das Feld und für Akt-2-Knoten die Positionsstufe liefert; `expectedLevel` für Akt-2-Knoten optional, Monotonie-Prüfung nur für Akte ohne `positionLevel`; alle oben genannten Leser auf `nodeLevel` umstellen; vorhandenen Schlüssel `ui.map.level` mit „≈“ erweitern statt `ui.map.levelApprox`; Lesestellen-Zahl auf 88 korrigieren; das Kern-Helferlein anders nennen als `nodeDef` aus `flow.ts` (z. B. `findNode`).

#### 🟠 Wichtig

**W1 – Händler-Liste „größeres Sortiment“ ohne Lieferant (Z. 1729, 2226, 2230–2233 vs. 2599).** *Fix:* in 11.2 eine Akt-2-Liste mit `roomLevel: 2` ergänzen (Ableitung aus `items.md` §6, z. B. Teile der heutigen Stufe 2 früher verfügbar), Schema-Feld bleibt in 10.8; oder Epic-10-Intro und 10.8 auf „Fixture-Liste, Inhalt später“ ändern. Achtung: `merchant` ist `z.object` (nicht strikt), ein unbekanntes `roomLevel` würde vor 10.8 still verworfen.

**W2 – Rabatt-Deckel doppelt, zwei Schlüssel (Z. 2240–2253 vs. 2872–2874).** *Fix:* nur 10.8 baut Deckel und Marke mit `economy.maxDiscountPct`; 11.8 setzt nur `priceMod` für E7 und verweist auf 10.8 (Test mit −10 % ohne Deckel).

**W3 – Anfeuern auf zwei Ziele doppelt (Z. 1953 vs. 3097–3101).** *Fix:* eine Mechanik: `final_curtain` bekommt `grantsSkill` mit `cheerTargets: 2` (Abstand 1) aus 10.3; 11.13 hängt an 10.3 (Abhängigkeit nennen). Stapelregel festlegen (Ableitung: höchstens 2 Ziele, für den Barden wirkt die Laute nur über ihre Werte).

**W4 – Ungenannte Vorwärtsabhängigkeiten in Epic 11 (Abschnitt 5.3).** *Fix:* jeder Epic-11-Story eine Zeile „Abhängigkeiten“ geben (wie Epic 10); Flags `joined_sable`, `e05`–`e08`, `brandhang_burned`, `maelis_ledgers`, `chronicle_read` schon in 11.1/11.2 in `acts/act2/flags.yaml` deklarieren; Z. 2449 präzisieren: „N4 nach 11.7, N5 nach 11.8, 11.13 nach 10.3“.

**W5 – Abstimmung 11.15 zu früh (Z. 2449, 3144).** 10.1 (Raumkosten in der Heimat-Heuristik), 10.7 (Reserve-EP), 10.8 (Händler-Glutfunken, Rabatt), 10.5/10.9 verschieben Gold, Stufen und Glutfunken; 11.15 prüft sogar die Rabatt-Summe und die Glutfunken-Zahl (Z. 3153). *Fix:* 11.15 erst nach 10.1, 10.5, 10.7, 10.8, 10.9; oder ein Nach-Abstimmungs-Kriterium in der letzten dieser Stories.

**W6 – 10.11 verlangt Daten für Akt-3-Gefährten (Z. 2408–2422).** `homeObject` „für jeden der 20 Story-Gefährten“ und „jedes Asset existiert“ – Pell, Vesna, Kit, Harlan, Mael gibt es erst mit Epic 12. *Fix:* Prüfung nur für vorhandene Gefährten; Gegenstände und Assets von Akt 3 als Kriterium in Epic 12.

**W7 – Stories zu groß (Abschnitt 5.4: 10.3, 10.8, 11.3, 11.11, 11.12).** *Fix:* wie dort vorgeschlagen teilen; Ziel-Phasen als eigene Kern-Story vor 11.11.

**W8 – Balliste: KI-Regel weicht von der PO-Entscheidung ab (Z. 2635, 2821).** *Fix:* `guard` und „in Reichweite“ streichen (nur `hold` oder schon daneben, GDD Z. 211); die Ritter am Horst (11.7) stehen ohnehin daneben, die Regel „schon daneben“ trägt sie. Wer `guard` will, braucht eine neue PO-Entscheidung.

**W9 – Weltkarten-Variante „Brandhang brennt“ ohne Mechanik (Z. 2869).** *Fix:* in 11.8 ein Kriterium für die Daten (z. B. `places[].variants: [{ requires, image|label }]` in `valmora.yaml`/`worldSchema`) und einen Grafik-Task `brandhang_burned` mit Platzhalter ergänzen.

#### 🟡 Klein

- **k1** FR15-Text Z. 54 auf die Entscheidung E10-1/E10-2 nachziehen.
- **k2** EXPERIENCE Z. 224: „grüner Pfeil“ → „Glut-Zahl am Taverne-Stein“ (DESIGN Z. 308); Eintrag im UX-Log.
- **k3** Fehlercodes: Architektur §8.1 Z. 619 (`companion_missing`) an 10.1 (`room_locked`) angleichen; für `buildRoom`, `promote`, `craft`, `inheritLegacy` eine Prüfreihenfolge festlegen (sonst ist „genau ein Fehlercode“ nicht eindeutig testbar).
- **k4** Erledigte Nachzieh-Kriterien streichen oder als „prüfen“ formulieren: 10.1 Z. 1792 und 1821, 11.12 Z. 3071.
- **k5** 10.1 Z. 1748: Warn-/Fehler-Umschaltung nach `released` ist hinfällig, weil 11.1 die IDs vorher anlegt und `act2` ab 11.1 `released: true` ist; durch „unbekannte `alive`-Id ist ein Fehler“ ersetzen.
- **k6** 11.13 Z. 3106: späteste Position vor 2-8 ist 7, nicht 6.
- **k7** 10.5 Z. 2067: Regel „70–80 % / reine Werkstatt-Items ≈ 100 %“ passt nicht zu `door_key` (60 %), Runen (100 %), `strong_remedy` (80 %); Regel oder Zahlen angleichen.
- **k8** 10.3 Z. 1955: `usesBonus: { tactician_command: 1 }` – die Einsätze hängen an der Klassen-Aktion `command` (`classes.yaml`); Schlüssel klarstellen.
- **k9** 10.6 Z. 2129: Bezeichner `legacy` ist im Code schon belegt (IndexedDB-Store `legacy` für PoC-Stände, `legacyIds` in `classes.yaml`); anderen Namen wählen (z. B. `heritage`).
- **k10** 11.1 Z. 2474/2507: `nodeDef`, „rund 60“, `ui.map.levelApprox` (siehe K2).
- **k11** 11.11 Z. 2969: Garde-Ritter +2 ergibt Stufe 21 über `levelCap` 20; klarstellen, dass der Deckel nur für die Truppe gilt.
- **k12** 11.2 Z. 2592: Item-Id `shadow` (Dunkel-Zauber) gleich der Klassen-Id `shadow` (10.3); Handbuch- und Locale-Schlüssel kollidieren leicht – z. B. `shade` für das Item.
- **k13** Dokumente nachziehen: `follow` → `follow_ally` (GDD Z. 231, Architektur §5.7 Z. 300, Arch-Log Z. 98, GDD-Log Z. 96) und Balliste-Werte im Item statt `balance.yaml` (Arch-Log Z. 98).
- **k14** Klarstellen, ob die Regel „kein Ziel zweimal hintereinander“ Nebenquests einschließt (N4 defend nach 2-5, N5/2-2 treasure, N6/2-6 rout).
- **k15** 10.5 Z. 2050: `moonsteel` existiert schon; nur die Quelle (`materialByAct`) kommt aus 11.2.
- **k16** Epic 10 hängt an Epic 11 (Z. 1729) – benannt und per Fixture entkoppelt; 10.2 Z. 1835 „bis dahin Fixture“ widerspricht leicht „11.1 zuerst“ (Z. 345, 2449); einen Satz wählen.
- **k17** FR44 „Erhalt als Moment“: 11.12 nennt den Funken-Moment für die Glutfunken aus N4/N5 nicht.

### 7.2 Braucht Entscheidung des Produktinhabers

Keine der Fragen blockiert den Start von 11.1a; sie betreffen die jeweilige Story.

| # | Frage | Story (Z.) | Vorschlag |
|---|---|---|---|
| P1 | Bannerträger: +5 Ausweichen für den Träger oder für die Nachbarn? | 10.3 (1954) | Nachbarn (passt zu „Nachbarn ignorieren Trauer“, stärkt den Unterstützer-Weg) |
| P2 | Reserve-EP des Übungsplatzes auch für Söldner? | 10.7 (2196) | ja (sonst lohnt Anheuern weniger) – bestätigen |
| P3 | Glutfunke beim Händler rabattfähig? | 10.8 (2257) | nein, wie Story |
| P4 | „Trank verstärken“ schon im Lager von Akt 1 (ändert den veröffentlichten Akt 1)? | 10.8 (2289) | erst ab Akt 2 |
| P5 | Schatten: Enthüllen Konter? Darf ein unsichtbarer Schatten Wege der KI sperren? | 10.4 (2024–2025) | Konter enthüllen nicht; die KI plant durch, ihre Bewegung endet vor dem Feld (keine unsichtbare Mauer) |
| P6 | Kronfeld: „Hälfte der Eingesetzten“ – aller oder der zu Beginn der Fluchtphase Lebenden? | 11.11 (2987) | Lebende, wie Story |
| P7 | Verbranntes Dorf in 2-6, wenn E7 noch offen ist (später „Befehl ausführen“ → zwei brennende Dörfer)? | 11.9 (2913) | nur bei `e07: warn`; vor E7 keine Szene |
| P8 | Wegwechsel nach gelerntem Zweit-Effekt erlaubt? | 10.2 (1875) | gesperrt, wie Story |
| P9 | E6 „bleibt“: Sable-Groll −1 ist vor dem ersten Treffen meist wirkungslos – andere Folge (z. B. Groll startet bei −1 bzw. die nächste Groll-Steigerung entfällt)? | 11.7 (2828) | „nächste Groll-Steigerung gegen Sable entfällt“ |
| P10 | Gehen Odile (E5) und Varek (E6), ist die Akademie dauerhaft nicht mehr ausbaubar (Wegwechsel, Zweit-Effekt verloren). Gewollt? | 10.1 (1767), 11.6 (2788), 11.7 (2829) | gewollt als Preis der Entscheidungen, Hinweis auf der Folgen-Karte |

Weiterhin offen, aber bekannt und nicht als Befund gezählt: „3D oder Bild“ für die Burg und die Gegenstände-Liste (10.11, Z. 2397/2409).

## 8. Zusammenfassung und Empfehlungen (Schritt 6)

### Gesamtstatus

**NEEDS WORK.** Abdeckung, Narrative-Regeln, Code-Bezug und Kriterienqualität sind gut; die beiden Epics sind nach den Korrekturen umsetzbar. Blockierend sind K1 (falsche Release-Voraussetzung, bricht 10.2/10.3 nach 9.14) und K2 (zu große Tor-Story 11.1 mit offenem `expectedLevel`-Vertrag).

### Kritische Punkte (vor dem Start)

1. **K1:** Satz Z. 1733 korrigieren, `renames.yaml`-Einträge in 10.2/10.3 aufnehmen.
2. **K2:** 11.1 in 11.1a–d teilen und `nodeLevel` mit allen Lesern von `expectedLevel` festlegen.

### Empfohlene nächste Schritte

1. `epics.md` korrigieren: K1, K2, W1–W9, k1–k17 (alles ohne neue Produktentscheidung; neue Story-Nummern in `sprint-status.yaml` nachziehen).
2. Produktinhaber zu P1–P10 fragen (Fragetool), Antworten in die zuständigen Decision-Logs (GDD, Narrative), nicht in `01-decisions.md`.
3. Dokumente nachziehen: FR15 (Z. 54), EXPERIENCE Z. 224, Architektur §5.7/§8.1 und Arch-Log (`follow_ally`, Balliste-Item, Fehlercode).
4. Danach mit `gds-create-story` die Story-Datei für 11.1a anlegen; 10.2/10.3 folgen.

### Schlussbemerkung

Diese Prüfung fand **2 kritische, 9 wichtige und 17 kleine Befunde** in den Kategorien Abdeckung, Konsistenz, Abhängigkeiten, Story-Größe und Code-Realität, dazu **10 Fragen an den Produktinhaber**. 26 der 28 Befunde lassen sich in den Stories bzw. Dokumenten selbst beheben. Entscheidungen des Produktinhabers vom 2026-10-31 wurden nicht als Befund gewertet; gemeldet ist nur die Abweichung W8. Offene Punkte wurden nicht entschieden.

*Prüfer: Claude (gds-check-implementation-readiness, nicht interaktiv), 2026-10-31.*

## Nachtrag 2026-10-31: Umsetzung der Befunde

Alle Befunde sind in `epics.md` (Epic 10, Epic 11, Epic-Liste, Reihenfolge, dazu FR15 und der Verweis in Story 6.9) und in den Konzeptdokumenten eingearbeitet; die Fragen P1–P10 hat der Produktinhaber in den Readiness-Runden R1–R3 beantwortet. Nach dem Teilen sind beide Epics neu nummeriert (Epic 10: 10.1–10.14, Epic 11: 11.1–11.22); Story-Nummern unten sind die neuen. Sprint-Status-Schlüssel sind nachgezogen.

| Befund | Was geändert wurde |
|---|---|
| K1 | Epic 10 „Für alle Stories gilt“: Akt 1 ist veröffentlicht, entfernte IDs über `content/renames.yaml`, Migration mit Fixture aus dem Akt-1-Release. 10.2: `promotion_seal: ember_spark`; 10.4: `sol: pro_duel`, `impale: pro_guard`, `longshot: pro_far_shot` (PoC-Skills bleiben bis 10.4 an den Klassen); 11.1: Fixture ist ein echter Spielstand aus 9.14 |
| K2 | Alte 11.1 geteilt in 11.1 Akt-Übergang und Spielstand, 11.2 Positionsstufe (Vertrag `nodeLevel(data, c, node)`, `expectedLevel` optional bei `positionLevel`, Monotonie nur ohne `positionLevel`, alle Leser umgestellt, `ui.map.level` mit „≈“), 11.3 Paket/Weltkarte/Titeltafel, 11.4 Simulation über Akte; 88 Lesestellen, `findNode` statt `nodeDef`; Architektur §5.4 und §5.6 nachgezogen |
| W1 | 11.5 nennt die Händler-Liste `roomLevel: 2` (`stiletto`, `shade`, `tower_shield` früher, `[ASSUMPTION]`); wer von 10.9 und 11.5 als Zweite gemergt wird, trägt sie ein |
| W2 | Summe und Deckel nur in 10.9 (`economy.maxDiscountPct`); 11.14 setzt nur den `priceMod` von E7, Test mit −10 % allein |
| W3 | Eine Mechanik `cheerTargets` aus 10.4 (Barde); `final_curtain` (11.20) gibt sie per `grantsSkill: curtain_call` (Abstand 1); Stapelregel höchstens 2 Ziele, größte Reichweite `[ASSUMPTION]`; 11.20 hängt an 10.4 |
| W4 | Jede Epic-11-Story hat „Abhängigkeiten“; 11.5 deklariert alle Akt-2-Flags in `acts/act2/flags.yaml`; Reihenfolge-Absatz nennt N4 nach 11.13, N5 nach 11.14, N6 nach 10.4 |
| W5 | 11.22 erst nach allen Epic-11-Stories und 10.1–10.12 |
| W6 | 10.14 prüft `homeObject` nur für die 15 vorhandenen Gefährten; Akt-3-Gegenstände nur als Hinweis für Epic 12 |
| W7 | Geteilt: 10.3 → 10.3/10.4, 10.8 → 10.9/10.10/10.11, 11.3 → 11.6/11.7, Ziel-Phasen aus 11.11 → 11.8, 11.12 → 11.9 Relikt-Stufen, 11.18 N4, 11.19 N5 |
| W8 | 11.6: KI nutzt die Balliste nur mit Profil `hold` oder schon daneben (kein `guard`, kein „in Reichweite“); 11.13: Ritter am Horst mit `hold` direkt neben den Ballisten |
| W9 | 11.14: `worldSchema.places[].variants` (`requires`, Bild/Label) und Grafik-Task `brandhang_burned` mit Platzhalter `[ASSUMPTION]` |
| k1 | FR15 auf die Entscheidungen E10-1/E10-2 nachgezogen |
| k2 | EXPERIENCE Flow Mara: Glut-Zahl am Taverne-Stein statt grüner Pfeil; UX-Log |
| k3 | Architektur §5.2/§8.1: `room_locked` statt `companion_missing`, feste Prüfreihenfolge (Id → Verfügbarkeit → Ressourcen); Fehlerlisten in 10.1, 10.2, 10.7, 10.11 geordnet; Regel in „Für alle Stories gilt“ |
| k4 | 10.1 (EXPERIENCE, Architektur) und 11.18/11.19 (GDD-Satz Nebenquest-Gold) als „prüfen“ statt „nachziehen“ |
| k5 | 10.1: unbekannte `alive`-Id ist immer ein Fehler (11.1 legt die IDs vorher an) |
| k6 | 11.20: späteste Position vor 2-8 ist 7 |
| k7 | 10.6: Rezeptregel auf 60–100 % des Kaufpreises angeglichen (Verbrauchsgüter 60–80 %, Werkstatt-Items ≈ 80 %, Runen ≈ 100 %) |
| k8 | 10.3: `usesBonus: { command: 1 }` (Klassen-Aktion), nicht die Skill-Id |
| k9 | 10.7: Bezeichner `heritage` statt `legacy` (Command `inheritHeritage`, `heritage.yaml`); Architektur §5.2 |
| k10 | 11.1/11.2: `findNode`, 88 Lesestellen, `ui.map.level` erweitert statt `ui.map.levelApprox` |
| k11 | 11.2 und 11.17: `levelCap` gilt nur für die Truppe, Gegner dürfen darüber |
| k12 | 11.5: Item `shade` statt `shadow` |
| k13 | GDD (Profile, Ziele), Architektur §5.7 und Logs: KI-Profil `follow_ally`; Balliste-Werte im Item `ballista_bolt` |
| k14 | Epic 11 „Gemeinsame Regeln“: „kein Ziel zweimal hintereinander“ gilt für Story-Missionen, Nebenquests zählen nicht `[ASSUMPTION]` |
| k15 | 10.6: `moonsteel` existiert, nur die Akt-2-Quelle kommt aus 11.5/11.7 |
| k16 | Epic-10-Intro: 11.1 kommt vor allen Epic-10-Stories; Fixtures nur noch für spätere Epic-11-Lieferungen |
| k17 | 11.18 und 11.19: Funken-Moment beim Erhalt des Glutfunkens (FR44) |
| P1 | Bannerträger: +5 Ausweichen für die Nachbarn (Aura Radius 1) – 10.4, GDD |
| P2 | Reserve-EP auch für Söldner – 10.8, GDD |
| P3 | Glutfunke beim Händler fest 3 000, kein Rabatt – 10.9, GDD |
| P4 | Trank verstärken erst ab Akt 2 – 10.11 (`economy.potionUpgradeFromAct` `[ASSUMPTION]`), GDD |
| P5 | Schatten: Konter enthüllen nicht; KI plant durch, Bewegung endet davor – 10.5, GDD |
| P6 | Kronfeld-Hälfte = Lebende zu Beginn der Fluchtphase – 11.8, 11.17, Narrative |
| P7 | Verbranntes Dorf in 2-6 nur bei E7 `warn` – 11.15, Narrative |
| P8 | Wegwechsel gesperrt nach Zweit-Effekt – 10.2, GDD |
| P9 | E6 `stay`: Groll −1, bei Groll 0 entfällt die nächste Steigerung (`grudge … buffer: true` `[ASSUMPTION]`) – 11.13, Narrative |
| P10 | Für alle Räume: Stufe 2 nur Gold (ab Akt 2), Stufe 3 mit Raum-Gefährte – 10.1, 11.12, 11.13, GDD, EXPERIENCE, Architektur §5.10 |

## Zweite Prüfung 2026-10-31

Unabhängige zweite Prüfung (gds-check-implementation-readiness, nicht interaktiv), Umfang Epic 10 (10.1–10.14, `epics.md` Z. 1727–2508) und Epic 11 (11.1–11.22, Z. 2509–3383) nach Umsetzung der Befunde und Neunummerierung. Geprüft gegen GDD, Narrative, Architektur, UX, `sprint-status.yaml`, die Entscheidungen des Produktinhabers (Runden E10-1 bis A2-4, Runde 6, Übergaben, Readiness-Runden R1–R3) und den Code.

### 1. Status der Befunde der ersten Prüfung

| Befund | Status | Bemerkung |
|---|---|---|
| K1 | teilweise | Satz „Akt 1 ist veröffentlicht“ (Z. 1733), `renames.yaml` in 10.2 (Z. 1841) und 10.4 (Z. 1976) stehen. Offen: wie Spielstände die Umbenennung bekommen, siehe neuer Befund N1 |
| K2 | erledigt | geteilt in 11.1–11.4; `nodeLevel`-Vertrag, `findNode`, 88 Lesestellen (nachgezählt: 88), `ui.map.level` mit „≈“, Architektur §5.4 Z. 226 nachgezogen. Kleinigkeit N6 |
| W1 | erledigt | 11.5 (Z. 2715) und 10.9 (Z. 2257) verweisen wechselseitig, Merge-Regel konsistent |
| W2 | erledigt | Deckel nur in 10.9, 11.14 Z. 3072 nur `priceMod` |
| W3 | erledigt | `cheerTargets` nur in 10.4, `final_curtain` per `grantsSkill` (11.20), Stapelregel benannt |
| W4 | erledigt | alle 22 Epic-11-Stories haben „Abhängigkeiten“; Flags in 11.5 (Z. 2719); Reihenfolge-Absatz Z. 2513 |
| W5 | erledigt | 11.22 nach 10.1–10.12 (Z. 3356) |
| W6 | erledigt | 10.14 prüft nur die 15 vorhandenen Gefährten (8 aus `act1/units.yaml` + 7 aus Akt 2, nachgezählt) |
| W7 | erledigt | 10.3/10.4, 10.9–10.11, 11.6/11.7, 11.8, 11.9, 11.18/11.19 getrennt |
| W8 | erledigt | 11.6 Z. 2745, 11.10, 11.13 Z. 3012 und GDD Z. 211 einheitlich „nur `hold` oder schon daneben“ |
| W9 | erledigt | 11.14 Z. 3065–3068 |
| k1 | erledigt | FR15 Z. 54 |
| k2 | erledigt | EXPERIENCE Z. 224 „Glut-Zahl am Taverne-Stein“ |
| k3 | erledigt | Architektur §5.2 Z. 153, §8.1 Z. 620; Prüfreihenfolge in „Für alle Stories gilt“ |
| k4 | erledigt | 10.1 Z. 1821, 11.18/11.19 „nur prüfen“ |
| k5 | erledigt | 10.1 Z. 1748 |
| k6 | erledigt | 11.20 Position 7 |
| k7 | teilweise | Regel neu (Z. 2098), aber `trap_kit` liegt bei 100 % statt ≈ 80 % (N5) |
| k8 | erledigt | `usesBonus: { command: 1 }` |
| k9 | erledigt | `heritage` durchgängig, Architektur-Log Z. 100 |
| k10 | erledigt | 11.1/11.2 |
| k11 | erledigt | 11.2 Z. 2597, 11.17 |
| k12 | erledigt | Item `shade` |
| k13 | erledigt | GDD Z. 193/231, Architektur §5.7 Z. 300–301, Arch-Log Z. 100 |
| k14 | erledigt (als `[ASSUMPTION]`) | Z. 2523; Bestätigung siehe P-N1 |
| k15 | erledigt | 10.6 Z. 2081 |
| k16 | erledigt | Epic-10-Intro |
| k17 | erledigt | 11.18 Z. 3241, 11.19 Z. 3277 |
| P1 | erledigt | 10.4 Z. 1991, GDD Z. 145 (Umsetzung siehe N2) |
| P2 | erledigt | 10.8 |
| P3 | erledigt | 10.9 |
| P4 | erledigt | 10.11 (`potionUpgradeFromAct`) |
| P5 | erledigt | 10.5 Z. 2054–2056 |
| P6 | erledigt | 11.8 Z. 2827, 11.17 Z. 3171 |
| P7 | erledigt | 11.15 Z. 3113, Narrative Z. 699 |
| P8 | erledigt | 10.2 Z. 1875 |
| P9 | erledigt | 11.13 Z. 3019, Narrative Z. 733 |
| P10 | erledigt | 10.1, 11.12 Z. 2977, 11.13 Z. 3020, GDD Z. 315, EXPERIENCE Z. 102, Architektur §5.10 Z. 348; die Regel „Stufe 2 nur Gold, Stufe 3 braucht Raum-Gefährten“ steht überall gleich. Lücke siehe N4 |

**Ergebnis:** 41 von 43 erledigt, 2 teilweise (K1, k7), keiner offen.

### 2. Verweise, Abhängigkeiten, Doppelungen

- **Story-Verweise:** Alle Verweise auf 10.x/11.x in `epics.md` (auch Z. 326, 330, 345, 1021, 1201, 1283), in `concept/21-gdd`, `22-narrative`, `24-architecture` (einzige Treffer „Story 11.2“ in §5.4 Z. 226 und Arch-Log Z. 100, beide richtig), `25-ux` und die 36 Schlüssel in `sprint-status.yaml` Z. 170–209 existieren und passen inhaltlich. Keine falschen Verweise gefunden.
- **Zirkel:** keine. 10.9 ↔ 11.5 ist eine Merge-Regel, keine Abhängigkeit; 10.6 → 11.5/11.7 und 10.8 → 11.21 sind als nicht blockierend benannt.
- **Positionsstufen** nachgerechnet: 2-1 P 11, 2-2/2-4/2-6 P 12–16, 2-3/2-5/2-7 P 13–17, 2-8 P 19, N4 ab 13, N5 ab 14, N6 ab 12, Nell-Beispiel 11/15 – alle richtig.
- **Doppelte oder verwaiste Kriterien:** nach der Teilung keine Doppelungen (Handbuch-Eintrag `rooms_upgrade` legt 10.1 an, 10.9–10.11 ergänzen ihn; Testkarte `dev_eisenmark` legt 11.2 an, 11.5–11.7 erweitern sie – beides gewollt). Verwaist ist nur der Folgen-Karten-Hinweis aus 11.12 (N4).

### 3. Code-Stichprobe (15 Stellen aus den neuen Kriterien)

| Kriterium (Story) | Fundstelle | Ergebnis |
|---|---|---|
| `grantExp` in `progression.ts` (10.8) | `src/core/rules/progression.ts` Z. 65 | ✓ |
| `maps.<id>.fog` (10.5) | `schemas.ts` Z. 362 (`fog: boolean`) | ✓ |
| `mustStayForRest` (11.8) | `battle/actions.ts`, `ai/autoplay.ts` | ✓ |
| `priceMod { pct, act }`, E4 gilt in Akt 2 (10.9, 11.14) | `schemas.ts` Z. 483; `scn.m1_6.outro.yaml` Z. 105 `act: 2`; `aid.ts` Z. 10 | ✓ |
| `grudge { lt, delta }` strikt, `meet` (11.13, 11.14) | `schemas.ts` Z. 478–479 | ✓ (11.13 erweitert um `buffer`, benannt) |
| `memorialIf`; `alive` = in der Truppe (11.18, 10.1) | `schemas.ts` Z. 624; `conditions.ts` Z. 88 | ✓ |
| `wardens_chronicle` (11.21) | `acts/act1/flags.yaml`, Locales | ✓ |
| `hire`, `recruitCost` (10.12) | `apply.ts` Z. 396, `camp.ts` Z. 193 | ✓ |
| `data.hauntPools` je Akt (11.1) | `load.ts` Z. 124 | ✓ |
| Händler-Liste `{ tier, items, storyCount }`, nicht strikt (10.9) | `schemas.ts` Z. 636 | ✓ |
| Vorkämpfer `armored` MOV 4, `bulwark` heute `foot` 6 (10.3) | `classes.yaml` Z. 56, 234 | ✓ |
| Rezeptpreise (10.6): `iron_ore` 100, `moonsteel` 400, `fire_bomb` 400, `door_key` 250, `haste_scroll` 800, Runen I 400/600 | `items.yaml`, `runes.yaml` | ✓ (Spanne stimmt bis auf `trap_kit`, N5) |
| `classActions.cheer { mov: 1, hit: 10 }` (11.20) | `balance.yaml` Z. 160 | ✓ |
| Aura überträgt Nicht-Werte (10.4, 10.7) | `rules/skills.ts` Z. 224–247: `addAuras` überträgt nur `effect.stats` | ✗ (N2) |
| Umbenennung beim Laden über `renamedId` (10.2, 10.4) | `save.ts` Z. 81–83, 162: `renamedId` wirkt nur in einer Migration je Speicherformat | ✗ (N1) |

Zusätzlich bestätigt: 88 Lesestellen `data.campaign`; `steel_dagger`, `stiletto`, `physic_staff` fehlen noch (von 11.5 richtig als neu beschrieben), alle Stufe-0-Teile des Akt-2-Händlers (11.1 Z. 2567) existieren; `hasPackForAct` liegt nur in der App-Schicht (`src/app/state/packs.ts` Z. 149, siehe N3).

### 4. Neue Befunde

#### Fix in den Stories

**Kritisch:** keine.

**Wichtig**

- **N1 – Umbenennungen erreichen die Spielstände nicht (10.2 Z. 1841–1842, 10.4 Z. 1976, 11.1 Z. 2554).** `renamedId` wirkt nur innerhalb einer Migration, und Migrationen hängen am Speicherformat (`save.ts` Z. 81–83, 162). 11.1 legt fest „Format 2 bleibt“; 10.2 und 10.4 verlangen trotzdem „Spielstände laden über `renamedId`, `migrations.test.ts` belegt das mit Fixture“. Ohne Formatwechsel läuft keine Migration, und zwei Stories würden unabhängig je eine anlegen. *Fix:* 10.2 hebt das Format auf 3 mit einer generischen Migration, die `content/renames.yaml` auf Items, Skills und Klassen im Spielstand anwendet (Fixture aus dem Akt-1-Release); 10.4 ergänzt nur die drei Einträge und einen Testfall; 11.1 Z. 2554 und 11.22 Z. 3377 auf „Format 3 seit 10.2“ anpassen. Alternative, falls kein Spielstand die Ids enthalten kann (`promotion_seal` im MVP nicht erhältlich, Klassen-Skills stehen nicht in `loadout`/`mastered`): Migrations-Kriterium streichen, nur `renames.yaml` und grünes `content:check` verlangen und das im Story-Log begründen.
- **N2 – Auren tragen nur Werte (10.4 Z. 1991, 10.7 Z. 2165/2175).** `addAuras` (`src/core/rules/skills.ts` Z. 224–247) überträgt nur `effect.stats`. Der Bannerträger braucht per Aura `avoidBonus: 5` und `ignoreGrief` (Trauer-Abzug in `rules/stats.ts` Z. 67), die Lektion `heritage_cheer` „Nachbarn +5 Treffer“ per Aura einen Trefferbonus; 10.7 behauptet „nur vorhandene Bausteine“. *Fix:* in 10.4 ein Kriterium „`addAuras` überträgt zusätzlich `avoidBonus`, `hitBonus` und `ignoreGrief`; Vorschau = Auflösung“; 10.7 nennt 10.4 als Abhängigkeit (oder `heritage_cheer` auf einen reinen Wert umstellen).
- **N3 – Wie der Akt-Übergang im Build gesperrt wird, ist offen (11.1 Z. 2545–2548, 2569).** 11.1 legt die Kopfdateien von Akt 2 ins Paket `core`; damit liegt die Kampagne von Akt 2 nach 11.1 im Build in den Daten, und die Bedingung „nächster Akt liegt in den Daten vor“ löst den Übergang schon vor 11.3 aus. Der Satz „im Build greift der Übergang erst, wenn das Paket `act2` vorliegt (`hasPackForAct`)“ lässt sich im Kern nicht umsetzen (`hasPackForAct`/`nextActInBuild` liegen in der App-Schicht; ein Kern-Zugriff darauf bräche Replay und Simulation). *Fix:* eine Lösung festschreiben – entweder die Build-Regel aus 11.3 („Dateien unter `acts/actN/` nur, wenn das Paket `actN` `released: true` hat“) samt Paket-Eintrag nach 11.1 vorziehen und als Bedingung allein „Kampagne liegt in den Daten vor“ nehmen, oder ausdrücklich festhalten, dass der Übergang ab 11.1 live ist (passt zur Entscheidung „act2 ab 11-1 released: true“, die sich auf die alte 11.1 mit Paket bezog) und den `hasPackForAct`-Satz streichen.

**Klein**

- **N4 – Folgen-Karten-Hinweis nur in einer Story (11.12 Z. 2977).** „Die Folgen-Karte der zweiten dieser Entscheidungen nennt, dass die Akademie Stufe 3 nicht mehr erreicht“: E5 und E6 liegen in verschiedenen Strängen; fällt E6 als zweite, baut 11.13 den Hinweis nicht (dort fehlt das Kriterium). *Fix:* dasselbe Kriterium in 11.13; der Hinweis entfällt, wenn die Akademie schon Stufe 3 hat.
- **N5 – `trap_kit` verletzt die eigene Rezeptregel (10.6 Z. 2098, 2106).** Mondstahl 400 + 2 × Eisenerz 100 = 600 = Kaufpreis 600, also 100 % statt „reine Werkstatt-Items ≈ 80 %“. *Fix:* Preis 750 oder Rezept mit 1 Eisenerz und Gold 0 (500 = 83 %).
- **N6 – Grep-Kriterium in 11.2 zu streng und unvollständig (Z. 2591).** `tools/simulate.ts` Z. 140 liest `expectedLevel` und fehlt in der Leserliste; der Typ `CampaignNode.expectedLevel` (`defs.ts` Z. 679) und das Berichtsfeld in `simCampaign.ts` Z. 46 bleiben zwangsläufig. *Fix:* `simulate.ts` aufnehmen, Kriterium auf „keine Lesestelle außer Schema, Typ, Prüfung und `nodeLevel`“ ändern.
- **N7 – Story-Größe grenzwertig:** 10.2 (Item-Umbau mit Umbenennung, Raum, drei Commands, Panel, Auslagerung `Sparks`, Umbau der Truppe, Sim) und 11.5 (7 Gefährten, 4 Leutnants mit Szenen DE/EN, Unikat-Klasse, 18 Items, Händler, Flags). Kein Muss; wird es eng, in 10.2 Wegwechsel und Zweit-Effekt (Akademie Stufe 2/3) wie 10.9–10.11 abtrennen und in 11.5 die Stahl-Items samt Händler-Stufen.

#### Braucht Produktinhaber

| # | Frage | Story (Z.) | Vorschlag |
|---|---|---|---|
| P-N1 | Gilt „kein Ziel zweimal hintereinander“ nur für Story-Missionen? Die Auslegung steht als `[ASSUMPTION]` in den gemeinsamen Regeln und berührt eine Narrative-Prüfregel (k14 wurde abgeleitet, nicht gefragt). | Epic 11 Z. 2523 | bestätigen (Nebenquests zählen nicht), Eintrag ins Narrative-Log |

Sonst keine versteckten Produktentscheidungen in den `[ASSUMPTION]`s gefunden; die übrigen sind abgeleitete Zahlen, Namen oder Umsetzungsdetails.

### 5. Gesamturteil

**NEEDS WORK (gering).** Die erste Prüfung ist fast vollständig und sauber umgesetzt; Verweise, Reihenfolge und Sprint-Status stimmen, die Entscheidungen R1–R3 sind überall gleich übernommen. Vor dem Start von 11.1 bzw. 10.2 sollten N3 (Sperre des Übergangs im Build) und N1 (Umbenennung ohne Migration) in den Stories geklärt sein, vor 10.4 N2 (Auren). Alle drei sind Textkorrekturen in `epics.md` ohne Produktentscheidung; danach **READY**. P-N1 blockiert nichts.

*Prüfer: Claude (gds-check-implementation-readiness, zweite unabhängige Prüfung, nicht interaktiv), 2026-10-31.*

## Abschluss 2026-10-31

Die Befunde der zweiten Prüfung sind in `epics.md` (Epic 10/11), `concept/22-narrative/narrative.md` und den Decision-Logs umgesetzt.

| Befund | Umgesetzt wie |
|---|---|
| N1 | 10.2 hebt das Speicherformat auf 3: generische Migration 2 → 3 in `src/persistence/save.ts`, wendet `content/renames.yaml` über `renamedId` auf Item-, Skill- und Klassen-Ids im Spielstand an; Fixture `tests/fixtures/saves/format2-*.json` aus dem Akt-1-Release, `tests/unit/migrations.test.ts`. 10.4 ergänzt nur `sol`, `impale`, `longshot` in `renames.yaml` und einen Testfall (keine eigene Migration, Abhängigkeit 10.2). 11.1 und 11.22: „11.1 braucht keine Migration; ab 10.2 Format 3“ |
| N2 | 10.4: `addAuras` (`src/core/rules/skills.ts`) überträgt zusätzlich `avoidBonus`, `hitBonus`, `ignoreGrief`, Vorschau = Auflösung, Test. 10.7 nennt 10.4 als Abhängigkeit für `heritage_cheer` |
| N3 | Produktinhaber: act2 sofort veröffentlichen (Übergabe epic11-act2, Antwort 1). 11.1: Übergang ab Merge live, Bedingung nur „Kampagne liegt in den Daten“; wer Akt 1 beendet, landet in Akt 2, Weltkarte „Weitere Missionen folgen“, Heimsuchungen laufen weiter; Titeltafel (11.3) erscheint über `actTitleSeen` nachträglich. `hasPackForAct`-Satz gestrichen, Build-Regel `acts/actN/` bleibt in 11.3; Reihenfolge-Absatz: 11.3 zeitnah nach 11.1 |
| N4 | 11.13: Folgen-Karte von E6 `pardon` nennt bei schon gegangener Odile, dass die Akademie Stufe 3 nicht mehr erreicht; entfällt bei Akademie Stufe 3. 11.12 verweist darauf |
| N5 | `trap_kit`: 1 × `moonsteel` + 1 × `iron_ore`, Gold 0 (500 von 600 = 83 %) |
| N6 | 11.2: `tools/simulate.ts` in der Leserliste; Grep-Kriterium „keine Lesestelle von `expectedLevel` außer Schema, Typ, Prüfung und `nodeLevel`“ |
| N7 | keine Pflichtänderung; je ein Satz „bei Bedarf teilen“ in 10.2 und 11.5 |
| P-N1 | Produktinhaber: „Kein Ziel zweimal hintereinander“ gilt nur für Story-Missionen. `[ASSUMPTION]` in den gemeinsamen Regeln von Epic 11 durch Entscheidung ersetzt; Prüfsatz in `narrative.md` (Missionsfolge, „Prüfung“) ergänzt; Zeile im Narrative-Log |

**Gesamturteil: READY** für Epic 10 und Epic 11, keine offenen Punkte. Beim Gegenlesen keine weiteren Probleme gefunden (Migrations-Rahmen in `save.ts` Z. 79–86, 161 und `moreMissionsFollow` in `worldMapView.ts` bestätigt).

*Prüfer: Claude, 2026-10-31.*
