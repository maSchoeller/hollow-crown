# 07 – Lager & Wirtschaft

> Startwerte **[C]**. Zahlen in `content/balance.yaml` auslagern.

## 1. Lager-Funktionen

| Bereich | Funktion | V1 |
|---|---|---|
| **Kompanie** | Einheitenliste, Paperdoll/Inventar, Skills & Loadout, Klassenaufstieg (Siegel), Narben-Übersicht | ✅ |
| **Konvoi** | Gemeinsames Lager, Sortieren/Filtern, Verkaufen | ✅ |
| **Händler** | Kaufen/Verkaufen; Sortiment wächst pro Kapitel; 1–2 „Angebot des Tages“-Items mit Affix (pro Kapitel neu) | ✅ |
| **Schmied** | Aufwerten (+1…+5), Affix neu würfeln, Tränke verstärken | ✅ |
| **Verzauberer** | Runen ein-/ausbauen, Runen kaufen (I), Runen verschmelzen (3× Stufe N → 1× N+1) | ✅ |
| **Taverne** | 3 generische Söldner pro Kapitel zum Anwerben; Gerüchte (Hinweise auf Nebenziele) | ✅ |
| **Heiler** | Narben entfernen | ✅ |
| **Lagerfeuer** | Support-Gespräche (C/B/A, S post-V1), Story-Nebenszenen | ✅ |
| **Vorbereitung** | (vor Mission) Einheiten wählen, Positionen, Karte & Gegner ansehen, Ausrüstung | ✅ |
| **Weltkarte** | Kapitel- und Scharmützel-Knoten, Übungsplatz | ✅ |
| **Kantine** | Mahlzeit vor Mission: +1–2 auf Werte für 1 Mission, Support-Punkte | V1.1 |
| **Übungsplatz (Training)** | Einheit trainiert Waffenart → FP-Bonus für nächste Mission | V1.1 |

## 2. Währungen & Ressourcen

| Ressource | Quelle | Verwendung |
|---|---|---|
| **Gold** | Missionsabschluss, Truhen, Dörfer, Verkauf (50 %), Scharmützel | Kaufen, Aufwerten, Anwerben, Heilen |
| **Eisenerz** (häufig) | Missionen, Scharmützel | Aufwerten +1/+2 |
| **Mondstahl** (selten) | Bosse, Nebenziele, Scharmützel | Aufwerten +3/+4 |
| **Drachenschuppe** (sehr selten) | Drachengegner, Legendär-Quests | Aufwerten +5 |
| **Arkanstaub** | Runen zerlegen, Missionen | Affix neu würfeln, Runen verschmelzen |

Keine Premium-Währung im Spielsystem (Kosmetik läuft getrennt, siehe `12-monetization.md`).

## 3. Kosten (Startwerte)

| Aktion | Kosten |
|---|---|
| Aufwerten +1 / +2 / +3 / +4 / +5 | 300 / 600 / 1 000 / 1 600 / 2 500 Gold + 2 / 3 Eisenerz, 2 / 3 Mondstahl, 1 Drachenschuppe |
| Affix neu würfeln | 500 Gold + 2 Arkanstaub (Episch: 800 + 3) |
| Rune I kaufen | 400 Gold |
| Runen verschmelzen | 3× gleiche Rune Stufe N + 200×N Gold |
| Söldner anwerben | 600 + 150 × Stufe (± Traits) |
| Narbe entfernen | 2 500 Gold **oder** 1× „Heilkraut der Seherin“ (seltener Drop) |
| Heiltrank verstärken (+5 TP) | 400 / 900 Gold |

## 4. Einnahmen (Zielkorridor)

| Kapitel | Gold pro Mission (Haupt + Neben) | Bemerkung |
|---|---|---|
| Prolog | 300 | |
| 1–2 | 1 000 – 1 800 | |
| 3–5 | 2 000 – 3 500 | |
| Scharmützel | 40–60 % eines Kapitels | |

Ziel: Pro Kapitel reicht das Gold für **eine von drei** größeren Investitionen (Aufwertung, Rekrut, Narbenheilung) plus Kleinkram. Der Spieler soll priorisieren müssen.

## 5. Preise (Auszug, vollständig in `items.yaml`)

Eisenwaffen 400–600, Stahlwaffen 900–1 200, Silberwaffen 2 500+ (nicht im Händler V1), Zauber 500–900, Schilde 300–900, Rüstungen 300–1 500, Accessoires 800–2 000, Heiltrank 300, Schlüssel 250, Feuerbombe 400, Siegel 3 000 (ab Kap. 5 im Händler).

## 6. Missionsergebnis-Bildschirm

1. Ziele (✔/✘) und Belohnungen je Ziel
2. Gold, Materialien, Items (neu = markiert)
3. Einheiten: EP-Balken, Level-ups (falls am Missionsende), FP-Fortschritt, **Gemeistert!**-Hinweise
4. Verluste: Tote (Gedenk-Zeile) und neue Narben
5. Support-Schwellen erreicht → „Neues Gespräch am Lagerfeuer“
