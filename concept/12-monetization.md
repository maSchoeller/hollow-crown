# 12 – Monetarisierung (nach V1)

> **Nicht Teil von V1.** V1 enthält nur die No-Op-Schnittstelle `platform/Monetization` (siehe `10-tech-architecture.md` §10). Dieses Dokument legt die Leitplanken fest, damit V1 nichts verbaut.

## 1. Leitplanken (abgestimmt)

1. **Kein Pay-to-win.** Nichts, was Werte, Kampf oder Tod beeinflusst, ist käuflich.
2. **Keine Wiederbelebung gegen Werbung oder Geld.** Permadeath bleibt unangetastet.
3. **Kein Energie-System**, keine Wartezeiten.
4. **Keine Lootboxen / Gacha** (auch rechtlich: BE/NL, EU-Diskussion).
5. Werbung nur **freiwillig** (Rewarded Ads), nie erzwungen (keine Interstitials).

## 2. Einnahmequellen

| Quelle | Beschreibung |
|---|---|
| **Werbefrei / Unterstützer-Paket** | Einmalkauf (Richtwert 4,99–6,99 €): entfernt Werbe-Angebote, gibt die Bonus-Belohnung automatisch, + exklusives Banner-Design |
| **Kosmetik** | Einheiten-Skins (Farbvarianten, später 3D-Outfits), Banner-Farben/-Wappen der Kompanie, Lager-Deko, Porträt-Rahmen, Schadenszahl-Stile. Direktkauf mit festen Preisen (keine Premium-Währung oder transparent 1:1 in €) |
| **Rewarded Ads** | Nach einer Mission: „Werbung ansehen → +25 % Gold“ **oder** Taverne: „1 zusätzlicher Rekrut zur Auswahl“. Deckel: **3 pro Tag** |
| **Story-Erweiterungen** (optional, später) | Zusätzliche Routen/Nebenkapitel als DLC – nur wenn die Hauptkampagne vollständig kostenlos bleibt |

## 3. Technische Anforderungen

- Capacitor + AdMob (oder vergleichbar) und native In-App-Käufe; Web-Version: Kosmetik über Web-Checkout (später), keine Werbung im Web in der ersten Stufe.
- Einwilligung: DSGVO/TCF-Consent-Dialog, iOS ATT; ohne Einwilligung nur nicht-personalisierte Werbung.
- Käufe serverseitig verifizieren (Receipt Validation) → benötigt Backend + Konto (gemeinsam mit Cloud-Save).
- Kosmetik als Content-Daten (`cosmetics.yaml`) mit `sku`, Vorschau-Asset, Slot.

## 4. Offene Punkte

- Kosmetik-Katalog und Preise (O3)
- Backend-Wahl (z. B. Supabase/Firebase) zusammen mit Cloud-Save
- Analytics (welche Events, Datenschutz) – eigenes Dokument vor Release
