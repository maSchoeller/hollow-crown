# Übertrag aus `01-decisions.md` (Proof of Concept) – Arbeitsgrundlage für das GDD

Erstellt 2026-10-23 per Extraktion aus `01-decisions.md`, `02`–`07`, `content/balance.yaml`, `content/campaign.yaml`, `content/maps/`. Alle Zahlen sind [C]-Startwerte. Dieses Dokument ist Quelle, nicht Spezifikation; maßgeblich ist `gdd.md`.

## Klassifikation

- **Gilt weiter (→ GDD):** G3–G19, G20 (nur Kartengrößen), G21–G23, S3 (Avatar „Befehl“), U7–U10, U12, U14 (Prinzip), U15, D3 (Regel), D11, D18, alle Detail-Defaults [C], Zielkorridore `06` §10.
- **Abgelöst:** G24 → B6 (Burg); S4 → B5; U1 → B1; U13/U18 → D18; U20-Freischaltplan → Burg-Räume; S5-Cut-ins → B8; O3 → B2; Makro-Loop `02` → Brief-Kernloop.
- **Keine Mechanik:** UX (G1, G2, G20 Zoom, U5, U6, U17, U20 Bedienung, U21, D9, D10, D15) · Art (GA*, U3, U22, D1, D2, D4–D8, D12–D14, B8) · Audio (U4, U19, B9) · Architektur (T*, U2, D16, D17) · Narrative (S1–S3, U13 Liora, U16) · Produkt (P*, O4).
- **Offen:** O1 Runde neu starten, O2 Blutungs-Countdown, O5/GA26 Lizenzen.

## Regeln mit Zahlen

**Zug & Kampf**
- Phasen Spieler → Gegner → Dritte; je Einheit Bewegung + 1 Aktion; Bewegung bis zur Aktion zurücknehmbar (außer neue Info aufgedeckt). (03 §1)
- Freie Aktionen: Tauschen 1×/Zug; Konvoi neben Kael 1×/Zug je ein Item nehmen/ablegen; Waffenwechsel unbegrenzt. (U7)
- Avatar „Befehl“ 1×/Karte: erschöpften Nachbarn reaktivieren. Kael „Sammelruf“ 1×/Karte, Radius 2, +2 Angriff/+10 Treffer bis Ende nächster Gegnerphase.
- Treffer = Hit + 2×SKL + ⌊LCK/2⌋ ± 15 Dreieck + Support + Skills; Ausweichen = 2×AS + LCK + Gelände + Support; 0–100; 2RN.
- Schaden = ⌊(Angriff × Eff + Dreieck ±1 − DEF/RES) × ElementMult⌋ ≥ 0; Effektivität 3×Mt; immer `floor`.
- Krit = Crit + ⌊SKL/2⌋ − LCK, ×3.
- Doppelangriff ab AS ≥ Gegner-AS + 4; AS = SPD − Überlast; auch beim Konter.
- Ablauf: Angriff → Konter → Doppel → Tandem → Status; Vorschau = gleicher Code.
- Dreieck Schwert > Axt > Lanze > Schwert: ±15 Treffer, ±1 Schaden. Bogen/Zauber/Stab neutral.
- Effektivität: Bogen↔flier, Hammer↔armored, Pferdetöter↔mounted, Licht↔monster/undead, Drachentöter↔dragon.
- Elemente Feuer > Wind > Erde > Wasser > Feuer ×1,2 / ×0,8; Licht ↔ Dunkel ×1,2; gleiches Element ×0,8 + Statusimmunität; Element+Dreieck max. +40 %; Affinität aus Körperrüstung, sonst angeboren.
- Status 2 Runden: Brennen 10 % max. TP, Nass −3 SPD, Verlangsamt −1 MOV, Rückstoß 1 Feld (blockiert +2 Schaden); Chance Rune II 30 %, III 50 %.
- Gelände-Effekte: Brand 2 Runden, 5 Schaden beim Betreten, Ausbreitung 25 %/Runde; Felswall 2 Runden; Wind lichtet Nebel Radius 2.
- Supports C10/B25/A45/S70; Nachbarbonus C +5 Treffer, B +5/+5, A +10/+10, S +15/+10/+5 Krit (max. +20/+20); +1 Punkt bei benachbartem Zugende, +2 bei Tandem/Heilen/Bergen; Rang erfordert Lagerfeuer-Gespräch; ein S-Partner. Tandem ab B (eigene Phase, 50 %, kein Krit/Konter, 1 Partner). Schutz ab A 20 %, S 30 %. Trauer −10 Treffer für 3 Missionen.

**Tod**
- Klassik sofort tot; Standard: niedergestreckt, weiterer Treffer tötet, Bergen → Narbe, liegt bei Missionsende → tot, nach 2 Narben nächster 0-TP-Fall tödlich; Casual: Rückzug ohne Narbe. Avatar/Kael bei 0 TP = Niederlage.
- Narben: Lahmes Bein −1 MOV, Zittrige Hand −10 Treffer, Gebrochene Rippen −3 TP, Schwaches Auge −5 Krit/−5 Treffer, Zerschlagene Schulter −2 STR, Albträume −3 LCK/−5 Ausweichen.
- KI-Todesstoß: Leicht nie, Normal Rückfall, Schwer bevorzugt.

**Inventar**
- Paperdoll Haupt/Neben/Kopf/Körper/2 Accessoires + Beutel 3 (ohne Gewicht); kein Verschleiß.
- Tragkraft = STR + Fuß 4 / Gepanzert 8 / Beritten 6 / Flieger 2 / Monster 10; Überlast −AS 1:1, ab 5 −1 MOV, ab 10 −2 MOV.
- Seltenheit: Gewöhnlich 0 Affixe/1 Rune, Selten 1/2, Episch 2/2, Legendär fest + Skill/2. Sets ab 2/4 Teilen.
- Runen I Element, II +30 % Status, III +50 % + Gelände; 1 Element-Rune je Waffe, 2. Slot Hilfs-Runen (Präzision +10 Treffer, Wucht +2 Mt/+2 Gewicht, Schärfe +5 Krit, Leichtigkeit −2 Gewicht); Rüstung 1 Slot = Affinität; Verschmelzen 3× Stufe N + 200×N Gold.
- Aufwerten +1…+5: Waffe +1 Mt/+3 Treffer je Stufe, Rüstung +1 DEF oder RES; Accessoires nicht.
- Verbrauch: Heiltrank 3 Ladungen/10 TP (Schmied +5/+5), Gegengift 2 — auffüllend; echt verbraucht: Schlüssel, Feuerbombe (1–2, 8 Feuer + Brennen), Hast (+2 MOV), Siegel. Benutzen = Aktion.
- Konvoi 200 Plätze; Ausrüstung Gefallener → Konvoi.

**Fortschritt**
- Stufe 1–20 je Klassenstufe, 100 EP/Stufe. EP: Kampf 10+Δ (1–30), Besiegen 30+3Δ (10–100), Boss +20, Heilen 12 + 3/Zusatzziel, Bergen/Ansprechen 10; Profiklasse zählt +15 Stufen.
- Wachstum geglättet: Ist ≤ Erwartung −1,0 → garantiert +1; Ist ≥ Erwartung +1,5 → 0; min. 1 Wert/Level-up.
- Klassen: ~10 Basis → je 2 Profi ab Stufe 10 per Siegel (Stufe → 1, Loadout 4 → 5); PoC 12 spezifiziert. Siegel 3 000 Gold.
- Skills: persönlich + Klasse + Item; FP +1/Kampfsequenz, +5 bei Missionsende; Meisterung 20–60 FP; Loadout 4/5.
- Generische Einheiten: Basis + ⌊Wachstum × (L−1)⌋, dann Schwierigkeits-%.
- Taverne: Söldner Stufe Armeeschnitt −1, Wachstum ±10 %, 1–2 Traits (Zäh, Flink, Gierig, Feigling, Veteran, Elementkind, Unbeholfen), 3 Angebote, Armee-Limit 20, Kosten 600 + 150×Stufe.

**Karten & Missionen**
- Größen kompakt 8×12–12×18, mittel bis 16×24, groß bis 24×32, eher quadratisch. Einsatzplätze PoC 4/4/6, Avatar + Kael Pflicht.
- Gelände: Wald +1 DEF/+20 Ausweichen, Berg +2/+30, Festung/Thron +2–3/+20–30 + 20 % Heilung; Flieger ohne Bonus; Höhe nur optisch. Objekte: Tür, Truhe, Hebel, Balliste (3–10, Mt 12), Dorf (zerstörbar).
- Ziele rout, boss, reach, seize (nur Kael), defend, survive, escape; Nebenziele visit_villages, no_downs, turn_limit, kill_with, recruit, open_chests, protect_npc; Verstärkungen 1 Runde angekündigt; Hinterhalt nur Schwer.
- Nebel Sicht 3, Schütze/Dieb +2, Flieger +1.
- KI-Profile aggressive, hold, guard, trigger, hunt, raider, flee, support (heilt < 70 %, sich < 40 %); Wertung Schaden + 50×Kill − 0,5×Konter, Heiler +10, niedrigste TP +5, Ziel +30; Zugreihenfolge Kill-Chance, dann Distanz.
- Schwierigkeit −15/0/+15 % Gegnerwerte, Schwer + Affixe/Hinterhalte, Aufstellung je Schwierigkeit, nur absenkbar. Sim-Ziel Leicht ≥ 95 % (≤ 0,5 Niedergestreckte), Normal 75–100 % (0,4–1,3), Schwer 30–70 %.
- Gestaffelte Mechaniken, max. 1 Lektion/Runde à 3 Zeilen; Dialogwahl nur außerhalb des Kampfs.

**Wirtschaft**
- Gold/Mission: Prolog 300, Kap. 1–2 1 000–1 800, Kap. 3–5 2 000–3 500, Scharmützel 40–60 %; Startgold 500. Ziel: je Kapitel eine von drei großen Investitionen.
- Aufwerten 300/600/1 000/1 600/2 500 + Material (Eisenerz, Mondstahl, Drachenschuppe); Affix neu 500 + 2 Arkanstaub (Episch 800 + 3); Rune I 400; Narbe 2 500 oder Heilkraut; Trank verstärken 400/900; Verkauf 50 %. Preise Eisen 400–600, Stahl 900–1 200, Silber 2 500+, Siegel 3 000.

## Konflikte mit dem Brief (zu lösen im GDD)

1. Wirtschaftskurve nur für Kap. 0–5 → neue Kurve über ~20 Missionen + Aufträge.
2. Stufen/Aufstieg über ~35 Missionen (Aufstiegsfenster, Deckel).
3. Klassenvielfalt für ~20 Gefährten.
4. Truppe ~20 vs. 4–6 Einsatzplätze; Reserve-EP.
5. Supports alle Paare vs. feste Paare.
6. Freischaltplan Lager → Burg-Räume.
7. Gestaffelte Mechaniken vs. freie Reihenfolge im Akt.
8. `boss`-Ziel/Boss-EP vs. fliehende Leutnants.
9. Scharmützel vs. Aufträge.
10. Tod → leerer Raum, Epilog-Flags.
11. Schwierigkeitskurve über 35 Karten.
12. Kael als Pflicht vs. „Gefährten ziehen lassen“.
