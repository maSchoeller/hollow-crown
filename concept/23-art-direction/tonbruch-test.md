# Tonbruch-Test (Story 8.1)

Prüft das Brief-Risiko „Tonbruch“: Verharmlost die runde Chibi-Optik den ernsten Ton und den endgültigen Tod (Permadeath)? Gegenmaßnahme laut Brief: eine Gedenkszene im neuen Stil früh testen. Getestet wird mit den Porträts v2.5 (Stimmung `sad`), Dialog-Hintergrund und Abschiedskarte. Teilnehmer: Produktinhaber und 2–3 Tester, die das Spiel nicht kennen.

## Szene öffnen

- **Handy:** <https://maschoeller.github.io/hollow-crown/?tonbruch> (im Hochformat öffnen)
- **Am Rechner (Entwicklung):** `pnpm dev`, dann <http://localhost:5173/?tonbruch> oder in der Konsole `__hc.toneTest()`

Der Link startet eine Wegwerf-Kampagne, die nie gespeichert wird. Vorhandene Spielstände bleiben unberührt. Am Ende steht das Titelbild.

Inhalt, etwa 3 Minuten:

1. **Gerrits Grab:** Die Nacht nach der Flucht im Prolog, auf einem Lastkahn. Die Truppe trauert um den alten Bannerträger Gerrit, im Morgengrauen schichten sie ihm ein Grab.
2. **Fenns Abschied:** Wochen später fällt der Dieb Fenn im Kampf. Es erscheint seine Abschiedskarte mit seinen letzten Worten und Miras Trauer.
3. **Varnhold bei Nacht:** Die Truppe kehrt ohne Fenn an seinen alten Ort zurück.

## Ablauf in 5 Schritten

1. **Vorbereiten:** Handy im Hochformat, Ton an (Kopfhörer sind am besten), ruhige Umgebung. Den Link erst kurz vor dem Test öffnen. Beim ersten Öffnen lädt das Spiel einmal.
2. **Einführen:** Dem Tester nur diesen Satz vorlesen, mehr nicht: „Ein Taktikspiel, in dem gefallene Figuren für immer weg sind. Du siehst zwei Abschiede aus dem ersten Akt.“ Den Stil nicht ankündigen und nicht erklären.
3. **Spielen:** Der Tester tippt sich im eigenen Tempo durch, ohne „Skip“ und ohne „Auto“. Nicht zusehen und nicht kommentieren.
4. **Bewerten:** Gleich danach den Bogen unten allein ausfüllen, ohne Absprache mit anderen Testern.
5. **Auswerten:** Der Produktinhaber trägt alle Bögen in die Tabelle ein, wendet das Kriterium an und schreibt das Ergebnis mit Datum in `decision-log.md`. Danach steht Story 8.1 auf `done`.

## Bogen

Skala: **1** = trifft gar nicht zu, **2** = eher nicht, **3** = teils, **4** = eher, **5** = trifft voll zu.

| # | Aussage | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| F1 | Der Stil verharmlost den Tod. | ☐ | ☐ | ☐ | ☐ | ☐ |
| F2 | Die Szene hat mich berührt. | ☐ | ☐ | ☐ | ☐ | ☐ |
| F3 | Die traurigen Gesichter passen zum Ernst des Moments. | ☐ | ☐ | ☐ | ☐ | ☐ |
| F4 | Fenns Abschiedskarte wirkt würdig. | ☐ | ☐ | ☐ | ☐ | ☐ |
| F5 | Etwas wirkte unfreiwillig niedlich oder komisch. | ☐ | ☐ | ☐ | ☐ | ☐ |
| F6 | Ich würde in diesem Spiel alles tun, damit keine Figur fällt. | ☐ | ☐ | ☐ | ☐ | ☐ |

**Freitext:**

- Was hat am meisten gewirkt, was am meisten gestört (Bild, Satz, Moment)?
- Falls F5 ≥ 3: Wo genau?

## Auswertung

| Tester | F1 ↓ | F2 | F3 | F4 | F5 ↓ | F6 | Bemerkung |
|---|---|---|---|---|---|---|---|
| Produktinhaber | | | | | | | |
| Tester 1 | | | | | | | |
| Tester 2 | | | | | | | |
| Tester 3 | | | | | | | |
| **Mittelwert** | | | | | | | |

↓ = niedriger ist besser.

**Bestanden**, wenn alle vier Bedingungen gelten:

1. F1 (verharmlost) im Mittel **≤ 2,0** und bei keinem Tester 5. Das ist der Kern des Brief-Risikos.
2. F5 (unfreiwillig niedlich) im Mittel **≤ 2,5**.
3. F2 (berührt) im Mittel **≥ 3,0**. Ein Abschied, der nichts auslöst, gilt ebenfalls als Tonbruch.
4. F3 und F4 im Mittel je **≥ 3,0**.

**Nicht bestanden**, wenn eine Bedingung verfehlt ist. Dann die genannten Stellen aus dem Freitext sammeln und je Stelle die Ursache zuordnen: Porträt (Stimmung `sad` nachschärfen), Hintergrund oder Licht (dunkler, entsättigter), Text, Abschiedskarte oder Musik. Nach der Änderung mit neuen Testern wiederholen. Ohne bestandenen Test geht Akt 1 nicht ins Release (Story 9.14).

F6 zählt nicht zum Kriterium. Die Frage zeigt, ob Permadeath Gewicht hat, und geht als Hinweis ins Log.

## Belege

Screenshots bei 375 × 812: `_bmad-output/implementation-artifacts/8-1-belege/`.
