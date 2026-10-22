# CLAUDE.md – Hollow Crown

Mobile-first Taktik-RPG (Fire Emblem trifft Battle Brothers) für den Browser (PWA), später als App über Capacitor.

## Projektstand

Bisher gibt es **nur die Anforderungsdefinition** in `concept/`. Als Nächstes wird **V1 (Vertical Slice)** umgesetzt.

## Bevor du Code schreibst

1. Lies `concept/README.md` und **`concept/01-decisions.md`** (verbindlich).
2. Lies für deinen Meilenstein die zugehörigen Dokumente (`concept/13-v1-scope.md` §4 nennt die Meilensteine M0–M7). Für Renderer, UI, Assets und Audio zusätzlich `concept/15-art-direction.md`, `16-asset-pipeline.md`, `17-audio.md` (Art-Track A0–A5).
3. Arbeite die Meilensteine **der Reihe nach** ab. Jeder Meilenstein endet mit grünen Tests und einem lauffähigen Build.

## Architektur-Regeln (nicht verhandelbar)

- `src/core` ist **reines TypeScript**: kein DOM, kein Babylon, kein `Math.random`, kein `Date.now`. Die Regeln laufen über Commands und Events, der State ist Plain-JSON und serialisierbar (siehe `concept/10-tech-architecture.md`).
- **Determinismus**: Jeder Zufall kommt aus dem Seed-RNG im State. Replays (Startzustand + Command-Log) müssen identische Ergebnisse liefern.
- **Keine Magic Numbers**: Alle Spielwerte stehen in `content/balance.yaml` bzw. in den Content-YAMLs. Startwerte liegen in `concept/data-samples/`.
- **Datengetrieben**: Karten, Items, Klassen, Skills und Dialoge sind YAML mit Zod-Schemas. `pnpm content:check` muss grün sein.
- **i18n**: Kein sichtbarer Text im Code. Alles läuft über Schlüssel in `content/locales/de.yaml` und `content/locales/en.yaml`.
- Schichten: `core` ← `content` ← `render`/`ui` ← `app`. Das wird per ESLint durchgesetzt.
- Die Kampfvorschau nutzt **denselben** Formelcode wie die Auflösung.

## Konventionen

- Code, Bezeichner, Commits und Datenschlüssel sind auf Englisch. Konzeptdokumente sind auf Deutsch.
- TypeScript strict. Paketmanager pnpm, Node 22 LTS.
- Tests: Vitest für `src/core` (Ziel ≥ 90 %), Playwright mit den Profilen iPhone 13, Pixel 7, iPad quer und Desktop.
- Weichst du vom Konzept ab oder triffst du eine neue Entscheidung, trägst du sie in `concept/01-decisions.md` ein (Status [C] plus Begründung). Offene Punkte (O1–O4) dort klärst du nicht stillschweigend.

## Befehle (ab M0 anlegen)

```
pnpm dev            # Vite-Dev-Server
pnpm build          # Produktions-Build (PWA)
pnpm test           # Vitest
pnpm test:e2e       # Playwright
pnpm lint           # ESLint + Typecheck
pnpm content:check  # Content-Validierung
pnpm sim <mapId>    # KI-gegen-KI-Simulation fürs Balancing
```
