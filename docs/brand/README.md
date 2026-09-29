# BidPower — brand assets

Reference board: `bidpower-brand-board.png`. Palette: Primary blue `#0A84FF`, secondary/cyan `#00C2FF`, navy `#0B1F3B`, light grey `#E5E7EB`.

| Asset | Used in |
|---|---|
| `public/brand/bidpower-logo-dark.svg` (+ `logo-full-dark.png`) | Login, register, forgot/reset password, invitation page (dark backgrounds). Splash/marketing/presentations |
| `public/brand/bidpower-logo-light.svg` (+ `logo-full-light.png`) | PDFs, emails, documents, light UI |
| `public/brand/bidpower-symbol.svg` | Symbol on dark backgrounds (auth pages, invitation page) |
| `public/brand/bidpower-symbol-light.svg` | Symbol on light backgrounds |
| `public/brand/bidpower-icon-small.svg` | Sidebar, Home header on mobile, favicon sources (larger symbol for 16-48 px) |
| `public/brand/bidpower-icon.svg` | App icon tile (any purpose), SVG favicon |
| `public/brand/bidpower-icon-maskable.svg` | Source of the maskable and Apple touch icons |
| `public/icons/app-icon-192.png`, `app-icon-512.png` | Web manifest (`purpose: any`) |
| `public/icons/app-icon-maskable-192.png`, `app-icon-maskable-512.png` | Web manifest (`purpose: maskable`, symbol inside the safe zone) |
| `public/icons/icon-144.png` | Web manifest (Android) |
| `public/icons/apple-touch-icon.png` (180), `apple-touch-icon-152.png` | iOS "Add to Home Screen" (`metadata.icons.apple` in `src/app/layout.tsx`) |
| `public/icons/favicon-32.png`, `-48.png`, `-96.png` | Browser tab / shortcuts (`metadata.icons.icon`) |

Use the `Logo` component (`src/components/shared/Logo.tsx`) in the UI: `mark` (tile), `symbol`, or `full`. Never use the full logo as a small icon.

The wordmark is outlined from Inter ExtraBold, so the logo files do not depend on any installed font.
The app UI keeps its system font stack (no font library added).
