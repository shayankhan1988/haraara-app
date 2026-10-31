# Golf Deals — MVP

Communityplatform voor deals in de Golfstaten, te beginnen in de VAE. Leden plaatsen deals en kortingscodes, stemmen ze hot of cold, reageren, en krijgen alerts. Uitgaande klikken lopen via `/go/{id}`, zodat elke klik wordt geregistreerd en de affiliate-tag wordt toegevoegd.

## Wat zit erin

| Onderdeel | Waar |
|---|---|
| Deals plaatsen (prijs, van-prijs, code, categorie, vervaldatum), winkel automatisch herkend op domein | `src/app/[locale]/deals/new`, `src/app/actions/deals.ts` |
| Hot/cold-stemmen met temperatuur (1 stem = 1°) en feeds Hot / Nieuw / Top van de week | `src/lib/temperature.ts`, `src/lib/deals.ts` |
| Reacties, melden van deals en reacties | `src/app/[locale]/deals/[id]` |
| Categorieën en full-text zoeken (Postgres, werkt voor Engels en Arabisch) | `src/lib/deals.ts`, migratie `..._search` |
| Alerts op trefwoord, categorie, maximumprijs en minimumtemperatuur, met meldingen in de app | `src/lib/alerts.ts`, `src/lib/publish.ts` |
| Accounts (e-mail en wachtwoord, sessies in de database), rollen USER / CURATOR / MODERATOR / ADMIN | `src/lib/auth.ts` |
| Moderatie: wachtrij voor nieuwe leden, meldingen, reacties verbergen, gebruikers blokkeren, klikstatistiek | `src/app/[locale]/mod` |
| Affiliate-redirect met klikregistratie (gehasht IP met dagelijkse rotatie, botfilter) | `src/app/go/[id]/route.ts`, `src/lib/affiliate.ts` |
| Engels en Arabisch met RTL, taalkeuze via URL (`/en`, `/ar`) | `src/i18n`, `src/proxy.ts` |
| PWA: manifest, iconen, service worker met offlinepagina | `src/app/manifest.ts`, `public/sw.js` |
| Delen via Telegram en WhatsApp | dealpagina |

Moderatieregels (wanneer een lid zonder controle mag posten, limieten per dag) staan in `src/lib/config.ts`. Daar staan ook de Golflanden; alleen de VAE staat aan.

## Lokaal draaien

Vereist: Node 22 en PostgreSQL 16.

```bash
cp .env.example .env          # pas DATABASE_URL en CLICK_SALT aan
npm install
npx prisma migrate deploy
npm run db:seed               # categorieën, winkels, admin + demodeals
npm run dev                   # http://localhost:3000
```

De seed maakt een beheerder aan: `admin@example.com` met wachtwoord `changeme123` (te wijzigen via `SEED_ADMIN_EMAIL` en `SEED_ADMIN_PASSWORD`). Met `SEED_DEMO=0` worden geen demodeals aangemaakt. Gebruik de demodata niet in productie.

## Affiliate instellen

Per winkel in de tabel `Merchant`:

- `affiliateParams`: queryparameters die aan de link worden toegevoegd, bijvoorbeeld voor Amazon `tag=jouwtag-21`.
- `affiliateTemplate`: een deeplink van een netwerk zoals Optimise, met `{url}` op de plek van de (ge-encodeerde) doel-URL.

Zonder instelling wordt gewoon doorgestuurd en wordt de klik toch geteld. Kliks per deal staan in `Deal.clickCount` en per klik in de tabel `Click`; zo kun je de EPC berekenen zodra de netwerkrapportages binnenkomen.

## Controles

```bash
npm run lint
npm run typecheck
npm test                      # unit tests (temperatuur, affiliate, alerts, wachtwoorden)
node tests/e2e/flow.js        # browsertest tegen een draaiende, geseede app
```

## Nog niet in deze MVP

- E-mail- en pushmeldingen voor alerts (nu alleen in de app); Telegram-bot voor een dealkanaal
- Inloggen met Google of een magic link, wachtwoord vergeten
- Afbeeldingen uploaden (nu een afbeeldings-URL)
- Arabische vertaling laten nakijken door een moedertaalspreker
- Juridisch: privacyverklaring, voorwaarden en de vergunningen uit het haalbaarheidsrapport
