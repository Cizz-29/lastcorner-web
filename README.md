# Lastcorner.net

Sito ufficiale di Lastcorner — il motorsport a 360°.

## Stack tecnico

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **CMS:** Sanity (da configurare)
- **Hosting:** Vercel
- **F1 Data:** Jolpica API (gratuita)

## Setup locale

```bash
npm install
npm run dev
```

Il sito sarà disponibile su `http://localhost:3000`

## Font

Aggiungi i file font in `/public/fonts/`:
- `AkiraExpanded-Bold.woff2`
- `AkiraExpanded-SuperBold.woff2`

Montserrat viene caricato automaticamente da Google Fonts.

## Logo

Aggiungi il logo in `/public/images/logo.svg` (o `.png`).
Poi aggiorna `components/Navbar.tsx` per usare `<Image src="/images/logo.svg" />`.

## Struttura

```
app/
  page.tsx          ← Homepage
  layout.tsx        ← Layout root con metadata
  globals.css       ← Stili globali e font
components/
  Navbar.tsx        ← Navigazione con menu mobile
  ArticleCard.tsx   ← Card articoli (Hero, Grid, Small)
  HeroSection.tsx   ← Sezione hero homepage
  LatestNewsSection ← Griglia ultime news + sidebar
  StandingsWidget   ← Classifica F1 live
  CountdownWidget   ← Countdown prossima sessione
lib/
  f1api.ts          ← Chiamate API Jolpica F1
  mockData.ts       ← Dati mock per sviluppo
public/
  fonts/            ← Font Akira Expanded (.woff2)
  images/           ← Logo e immagini statiche
```
