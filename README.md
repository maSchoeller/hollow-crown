# Hollow Crown

*Der König ist tot. Die Krone ist verschwunden. Die Drachen erwachen.*

**Hollow Crown** ist ein rundenbasiertes Taktik-RPG im Stil von Fire Emblem, mit Ausrüstungstiefe wie in Battle Brothers. Es ist fürs Handy im Hochformat gebaut und läuft auch im Browser, auf Tablet und PC.

- Story-Kampagne mit Lager, Rekrutierung und Beziehungen
- Ausrüstung bestimmt den Charakter: Paperdoll, Gewicht, Loot mit Affixen, Runen, Skills, die man durch Ausrüstung lernt
- Permadeath: Niedergestreckt → Narbe → Tod
- Waffendreieck, Elementkreis, Gelände- und Statuseffekte
- Fair Free-to-Play: kein Pay-to-win, keine Energie

## Status

🎮 **Erster Wurf von V1:** Prolog, Kapitel 1 und 2 sind spielbar (DE/EN), mit Lager, Speichern und PWA. Umfang und offene Punkte: [`concept/01-decisions.md`](concept/01-decisions.md) (U1–U13). Konzept: [`concept/`](concept/README.md).

Spielen: nach dem Merge auf `main` unter **https://maschoeller.github.io/hollow-crown/** (als App installierbar: „Zum Startbildschirm hinzufügen“).

## Entwicklung

Node 22+, pnpm 10, Python 3.12+ mit Pillow (nur für die Assets).

```bash
pnpm install
pnpm art:build      # art/ → public/assets
pnpm dev            # http://localhost:5173
pnpm test           # Vitest (Kern, Replays)
pnpm test:e2e       # Playwright (iPhone 13, Pixel 7, iPad quer, Desktop)
pnpm lint           # ESLint (inkl. Schichtenregeln) + Typecheck
pnpm content:check  # YAML-Validierung, Referenzen, DE/EN
pnpm sim ch01_varnhold --runs 50   # KI gegen KI fürs Balancing
```

Struktur: `src/core` (reiner Regelkern, deterministisch), `src/content` (YAML + Zod), `src/render` (Babylon.js, 48-px-Pixel-Brett), `src/ui` + `src/app` (Preact), `content/` (Spieldaten), `art/` (Asset-Quellen, Git LFS).

## Tech

TypeScript · Vite · Babylon.js · Preact (HTML-UI) · Vitest · Playwright · PWA (später Capacitor)
