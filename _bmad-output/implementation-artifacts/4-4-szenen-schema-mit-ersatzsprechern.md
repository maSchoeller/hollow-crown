# Story 4.4: Szenen-Schema mit Ersatzsprechern

Status: review

## Story

Als Content-Autor
möchte ich Szenen mit deutschem Text, Sprecherketten und Bedingungen in einer Datei schreiben,
damit Permadeath nie eine Szene zerbricht.

## Acceptance Criteria

1. **Szene und Auflösung:** Eine Szene `content/acts/act1/scenes/<id>.yaml` hat Zeilen (`id`, `speaker` als Kette, `mood`, `text`, `requires`, `memorial`) und Antworten (`choice` mit `id`, `text`, `stance`, `effects`) (Architektur §5.8). `resolveScene(data, ctx, id)` wählt den ersten lebenden Sprecher der Kette, lässt Zeilen mit unerfüllten Bedingungen weg und fügt eine Gedenkzeile ein, wenn die erste Figur der Kette tot ist. Bedingungen und Wirkungen sind die aus Story 4.2 (kein zweiter Code).
2. **Schlüssel:** Sie entstehen automatisch (`dlg.<szene>.<zeile>`, `….memorial`, `….<zeile>.<antwort>`); Englisch steht in `content/locales/en/act1.dialogue.yaml`.
3. **`pnpm content:check`** scheitert bei Boxen über 110 Zeichen (DE oder EN), Ketten ohne Avatar/Kael am Ende und ohne `fallback: skip`, fehlenden EN-Schlüsseln, unbekannten Stimmungen und Antworten in Kampf-Szenen.
4. **Migration:** Die PoC-Dialoge sind ins neue Format überführt, das alte Schema entfällt; der Dialog-Screen läuft weiter (neue Darstellung ist Story 4.5).

## Tasks / Subtasks

- [x] T1 Typen und Schema (AC 1, 3): `SceneDef`, `SceneLine`, `Mood` in `defs.ts`; `sceneSchema` (strikt, vier Stimmungen, Antwort braucht `stance`)
- [x] T2 Kern (AC 1, 2): `src/core/campaign/scene.ts` mit `resolveScene`, `pickSpeaker`, `canSpeak`, Schlüssel-Helfern, `sceneTexts`
- [x] T3 Laden (AC 2): `scenes/` einlesen, deutsche Texte aus der Szene nach `locales.de`, `content/locales/<lang>/*.yaml` als Sprachdateien
- [x] T4 `content:check` (AC 3): Kette, Box-Länge, EN-Abdeckung, Bedingungen/Wirkungen, doppelte IDs, Antworten in Kampf-Szenen
- [x] T5 Migration (AC 4): 34 Szenen, EN-Datei, IDs `dlg.*` → `scn.*`, `dialogue/` und `acts/act1/locales/` entfernt; `Dialogue.tsx` liest `resolveScene`
- [x] T6 Tests: `tests/unit/scene.test.ts`; `story.test.ts` angepasst

## Dev Notes

- **Muster:** Architektur §5.8, §8.2. Auflösung rein im Kern; die UI zeigt nur an und löst bei jeder Antwort neu auf (Flags der Antwort gelten sofort, `uid` hält die Position).
- **Wer kann sprechen:** Avatar und Kael immer; sonst jeder, der weder gefallen (`fallen`) noch gegangen (`left`) ist. Wer nie beitrat (Gegner, noch nicht Rekrutierte), spricht. Gedenkzeile nur bei `fallen` der ersten Figur, direkt nach der Hauptzeile.
- **Migration:** Einzelsprecher wurden zu Ketten `[x]`; alle außer Kael mit `fallback: skip` (Verhalten bei Tod: Zeile entfällt statt Geistersprecher). `surprised` wurde `neutral` (nur vier Stimmungen erlaubt). Elf Boxen über 110 Zeichen wurden in zwei Zeilen geteilt (`lNN`, `lNNb`). `side` entfällt; `Dialogue.tsx` leitet die Seite aus der Reihenfolge ab (Kael/Avatar links).
- **Antworten:** `stance` ist Pflicht; die sechs PoC-Antworten bekamen warm (ehrlich, „hinterfragen“), nüchtern (vorsichtig, „halten“), trotzig (stolz, mutig). Gezählt wird die Haltung erst mit dem Command `choose` (Story 4.6).
- **Kampf-Szene:** Szene, die eine Karte nennt (Trigger, Zitat, Gespräch, Belohnung).
- **Alte Spielstände:** Gespeicherte Kämpfe mit `quote: dlg.…` finden die Szene nicht mehr und zeigen sie nicht (Battle.tsx ignoriert unbekannte IDs).

### Offene Fragen an den Produktinhaber

1. Stimmung `surprised` (PoC, 8 Zeilen) fiel auf `neutral`; soll die Liste um `surprised` wachsen?
2. Stimmungswerte der sechs PoC-Antworten (Haltung) sind von mir zugeordnet.
3. ~~Sprecher aus Gegnern/NPCs ohne `fallback: skip`?~~ Entschieden 2026-10-24: Gegner und Leutnants (Team enemy auf Karten oder Figur mit Kennzeichen `enemy`) sind von der Pflicht ausgenommen; sie gilt nur für Ketten, deren Sprecher endgültig sterben können (`validate.ts`, Test in `scene.test.ts`).

### Project Structure Notes

- Neu: `src/core/campaign/scene.ts`, `content/acts/act1/scenes/*.yaml`, `content/locales/en/act1.dialogue.yaml`, `tests/unit/scene.test.ts`.
- Geändert: `src/core/{defs,index}.ts`, `src/content/{schemas,load,validate}.ts`, `src/ui/Dialogue.tsx`, `src/app/App.tsx`, `src/app/screens/Battle.tsx`, `tools/content-check.ts`, `campaign.yaml`, `units.yaml`, Karten, `tests/unit/story.test.ts`.
- Entfernt: `content/acts/act1/dialogue/`, `content/acts/act1/locales/`.

### References

- [Source: concept/26-epics/epics.md#Story 4.4]
- [Source: concept/24-architecture/architecture.md#5.8]

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5

### Completion Notes List

- `pnpm lint`, `pnpm test` (164 Tests), `pnpm content:check`, `pnpm build` grün; Coverage `src/core` (Zeilen) 80,7 %.
- Keine Browser-Prüfung durchgeführt (zentral danach); Unabhängiges Code-Review steht aus.

### File List

Siehe Project Structure Notes; Entscheidungslog `concept/24-architecture/decision-log.md`.
