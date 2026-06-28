# AURÉLLE

> _Dressed in light._

**AURÉLLE** is a premium, women-only fashion storefront. This repository contains the
**first visible increment** of the storefront: a polished, luxury-styled home page built
on **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

This increment is intentionally small and **self-contained** — it renders entirely from a
hardcoded demo catalog (`lib/demo-data.ts`) with **no database and no external services
required**. It establishes the brand foundation (design tokens, typography, logo, layout,
navigation) that later increments will build upon.

## What's included

- **Brand design tokens** in Tailwind — the AURÉLLE luxury palette (noir, champagne,
  champagne-deep, ivory, blush, taupe, line) and typography (Cormorant Garamond for
  display, Inter for body, loaded via `next/font/google`).
- **AURÉLLE wordmark logo** — letter-spaced serif caps with a champagne accent.
- **Root layout** with a sticky **Header** (logo + full category navigation) and a
  brand **Footer**.
- **Home page** with a full-bleed hero ("Dressed in light."), a _Nueva colección_ product
  grid of demo products with subtle hover effects, and an editorial banner.

## Tech stack

| Concern   | Choice                                  |
| --------- | --------------------------------------- |
| Framework | Next.js 14 (App Router), React 18       |
| Language  | TypeScript (strict)                     |
| Styling   | Tailwind CSS                            |
| Fonts     | Cormorant Garamond + Inter (next/font)  |
| Imagery   | Unsplash placeholder URLs (next/image)  |

## Getting started

Requires **Node.js 18.18+** (Node 20+ recommended).

```bash
npm install && npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) to view the storefront.

## Other scripts

```bash
npm run build      # Production build
npm run start      # Serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## Project structure

```text
.
├── app/
│   ├── globals.css        # Tailwind layers + brand base styles
│   ├── layout.tsx         # RootLayout: fonts, theme, Header, Footer
│   └── page.tsx           # Home page: hero, product grid, editorial banner
├── components/
│   ├── brand/Logo.tsx     # AURÉLLE wordmark
│   └── layout/
│       ├── Header.tsx     # Logo + category navigation
│       └── Footer.tsx     # Brand footer
├── lib/
│   └── demo-data.ts       # Hardcoded demo catalog (no database)
├── tailwind.config.ts     # Brand design tokens (palette, type scale)
├── next.config.mjs        # Image remote patterns (Unsplash)
└── tsconfig.json          # Strict TS, @/* path alias
```

The full product vision (catalog, PDP, AI Virtual Fitting Room, cart, checkout, admin) is
captured in the spec under `.kiro/specs/luxury-womens-boutique/`.
