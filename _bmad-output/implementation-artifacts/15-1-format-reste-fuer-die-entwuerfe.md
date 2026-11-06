# Story 15.1: Format-Reste für die Entwürfe

Status: done

## Story

Als Leveldesigner
möchte ich alles im Spielformat ausdrücken können, was die abgenommenen Entwürfe verlangen,
damit keine Karte einen Sonderfall im Code braucht.

Umgesetzt ohne Story-Prozess mit PR #104 (Höhenstufen, Tore, Hebel, `roof`), abgeglichen am 2026-11-06 gegen `main` (a7f4d59).

## Abgleich

| Kriterium | Nachweis | Status |
| --- | --- | --- |
| Gelände `roof` samt Stufe (N1): Schema, Regel, Darstellung | `content/core/terrain.yaml:55` (Stufe 1, nur zu Fuß, Modell `roof_tile`); Karte `content/acts/act1/maps/n1_ring.yaml:29`; Tests `tests/unit/act1-side-maps.test.ts:192` (Dächer Stufe 1, nur über Leitern) und `:212` (Gepanzerte kommen nicht hoch) | erfüllt |
| Item `pactwarden_shield` (N2) | Im Spiel `pact_warden_shield`: `content/core/items.yaml:138` (Relikt, Fertigkeit `warden_ward`), Namen in `content/core/locales/*.names.yaml:97` und `*.items.yaml:57`; Truhe `content/acts/act1/maps/n2_wachturm.yaml:62`, Umbenennung vermerkt in `:6`; Tests `tests/unit/warden-shield.test.ts:35–71`, `tests/unit/act1-side-maps.test.ts:133` | erfüllt |
| Wehrgänge in 1-6 und 1-8 | Gelände `rampart` Stufe 1 (`content/core/terrain.yaml:50`), Legende `m1_6_paktwacht.yaml:36`, `m1_8_paktwacht_halten.yaml:32`; Tests `tests/unit/m1-6-paktwacht.test.ts:49`, `:70` (Nahkampf nur über die Treppe), `:83` (Schützen +1 Reichweite), `tests/unit/m1-8.test.ts:177` | erfüllt |
| Alle 12 Entwürfe bestehen `content:check` ohne Ausnahme | Die 12 Karten unter `content/acts/act1/maps/` tragen den Entwurf im Feld `design:`; `pnpm content:check` grün; Test `tests/unit/m1-4-wolfshuegel.test.ts:142` („the shipped content is clean“) | erfüllt |
| Handbuch zu Höhe, Tor und Hebel stimmt mit den Regeln | `content/core/handbook.yaml:145` (`doors`: Tür, Tor, Hebel) und `:150` (`heights`: alle Stufen-Gelände und Verbindungen); Texte `content/core/locales/de.handbook.yaml:249–258`. **Lücke geschlossen:** Der Höhen-Text nannte das Dach nicht, Stichwörter für Tor, Hebel, Dach fehlten, der englische Titel hieß nur „Doors“. Neuer Test `tests/unit/handbook.test.ts:148` gleicht die Gelände-Liste mit `terrain.yaml` (Stufe > 0 oder Verbindung) ab und findet „Dach“, „Hebel“, „Tor“ | erfüllt |

Beleg: `15-1-belege/handbuch-hoehen-375x812.jpg` (Handbuch, Eintrag „Höhen“, 375 × 812, stumm).

## Änderungen in diesem Abgleich

- `content/core/locales/de.handbook.yaml`, `en.handbook.yaml`: Dach in den Höhen-Text („nur zu Fuß“), Stichwörter ergänzt, englischer Titel „Doors and gates“.
- `tests/unit/handbook.test.ts`: Test „heights, gates and levers match the rules“.

## Rest

Keiner.
