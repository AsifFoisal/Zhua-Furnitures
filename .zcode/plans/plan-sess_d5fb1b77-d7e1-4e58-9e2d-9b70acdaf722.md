# ZHUA "Complete Space" Homepage Redesign — Implementation Plan

## Approach

Rebuild the homepage as the spec's 13-section brand story using the existing stack (Next.js 16 App Router, CSS Modules + design tokens in `globals.css`, framer-motion, auto scroll-reveal via `ScrollRevealManager`). Reuse verified contact data (`src/lib/whatsapp.ts`, email, Johannesburg), the existing Curtain Customizer, gallery API, and feature flags. No Tailwind will be introduced; no backend changes except where noted. Since no real ZHUA photography exists locally, every image slot goes through one central imagery map with brand-styled CSS/SVG placeholders that can be swapped for real photography later without touching components.

## 1. Central imagery map — `src/lib/home-imagery.ts` (new)

A typed map of every homepage/landing image slot (hero, division cards, section visuals, project placeholders) → `{ src?: string; alt: string }`. Defaults to styled CSS/SVG placeholders (reusing the 3 existing category SVGs where they fit). Dropping in official photography later = editing this one file.

## 2. Homepage sections — `src/components/home/` (all with co-located `.module.css`)

Rebuild `src/app/page.tsx` to compose, in order:

1. **HeroSection** (rework of `HeroBanner.tsx`) — full-viewport lifestyle hero, gradient overlay, H1 "Transform Your Space. Made for You." (only H1 on the page), subheading, CTAs: Explore Our Services (→ `#spaces`), Get a Quote (→ `/contact`), WhatsApp (`buildWhatsAppUrl`). Subtle parallax + staggered entrance via framer-motion, `useReducedMotion` respected.
2. **OneSpaceOneZhua** (`id="spaces"`) — heading + 4 large division cards (Furniture, Curtains & Blinds, WALLZ, DECKZ), image zoom/arrow hover, linking to the new division pages.
3. **FurnitureSection** — "Furniture Made Around You": one large featured category + smaller supporting tiles (sofas, modular, beds, dining, TV units, cabinets, outdoor, reupholstery), CTAs Shop Furniture (→ `/shop/furniture`) + Custom Furniture (→ `/contact`).
4. **CurtainsBlindsSection** — "Dress Your Windows": elegant visual chips/cards for curtain styles (wave, pinch pleat, eyelet, sheer, blockout, double-layer) and blind types (roller, zebra, venetian, roman, vertical, motorised); prominent service message "Need help choosing? We'll measure, advise, make and install."; CTAs: Design My Curtains (→ customizer), Explore Blinds (→ `/shop/curtains`), Book a Measure & Quote (→ `/book-installation`).
5. **WallzSection** — split layout, oversized "WALLZ" typography, flexible wording (no unconfirmed material claims), CTA Explore WALLZ (→ `/wallz`).
6. **DeckzSection** — split layout (reversed), "DECKZ — Take Your Living Outdoors", CTA → `/deckz`.
7. **CompleteYourRoom** (client component) — "Build the Room. Not Just the Product.": immersive visual with 4 numbered hotspots (Sofa / Windows / Walls / Outdoor), tap/hover reveal, keyboard accessible, closing line "One project. Multiple solutions. One ZHUA team."
8. **DesignStudioSection** — "Design Before You Buy": 4 tool cards (Room Visualizer, Curtain Customizer, Curtain Calculator merged note → customizer, Request a Custom Design → `/contact`). Flag-aware via `src/lib/features.ts`: live tools link directly; disabled ones route to `/design-studio` which already renders ComingSoonPanel.
9. **HowZhuaWorks** (update existing `HowItWorks.tsx`) — new 4 steps: Tell Us Your Vision → Choose Your Design → We Make It → We Deliver & Install; horizontal on desktop, vertical timeline on mobile.
10. **AudienceSection** — three cards: For Homeowners (→ `/shop`), For Interior Designers (→ `/contact`), For Businesses (→ `/contact`).
11. **ProjectsGallery** (client component) — "See ZHUA in Real Spaces": fetches existing `GET /api/gallery` with graceful fallback; filter chips (All / Furniture / Curtains / Blinds / WALLZ / DECKZ / Full Projects mapped onto gallery item categories); lazy-loaded images; "View Project" opens existing `ProductImageLightbox`.
12. **Testimonials** — existing component kept, placed after ProjectsGallery.
13. **FinalCTA** — full-bleed closing section: Get a Quote (→ `/contact`), WhatsApp ZHUA, Visit Our Factory (→ `/contact`).

Removed from the homepage (files kept in repo, still used elsewhere): `TrustBar`, `CategoryCards`, `FeaturedProducts`.

## 3. New division landing pages

A shared `src/components/pages/DivisionLanding.tsx` (hero + intro + highlights + CTA block, driven by props) renders simple, premium, expandable pages — no e-commerce logic:

- `/furniture` — division intro, category highlights, CTAs to `/shop/furniture` + custom furniture enquiry (`/contact`).
- `/curtains-blinds` — intro, curtain/blind style overview, CTAs to `/shop/curtains`, curtain customizer, `/book-installation`.
- `/wallz` — service overview with deliberately flexible wording, Request a Quote → `/contact`.
- `/deckz` — same pattern for outdoor spaces.

Each page exports its own Next.js 16-style `Metadata`.

## 4. Projects page — `/projects`

Extract the working gallery grid from `src/app/gallery/page.tsx` into a reusable component used by both `/gallery` (unchanged behavior) and the new `/projects` page. No API changes.

## 5. Navbar update (`src/components/layout/Navbar.tsx`)

New `navLinks`: Furniture, Curtains & Blinds, WALLZ, DECKZ, Design Studio (dropdown: Room Visualizer, Curtain Customizer — flag-gated as today), Projects, About, Contact. Add prominent **Get a Quote** button (→ `/contact`) on desktop and in the mobile drawer, plus the WhatsApp action alongside the existing icons. Cart/wishlist/search/theme toggle untouched.

## 6. Footer update (`src/components/layout/Footer.tsx`)

Columns per spec — Explore (four divisions, Design Studio, Projects), Company (About, Contact, Visit Our Factory), Services, Contact block using only verified data (WhatsApp `+27 71 205 8512` via `whatsapp.ts`, email `zhuaenterprise@gmail.com`, Johannesburg, South Africa). Tagline "Complete spaces, made for you." No invented socials/addresses.

## 7. SEO, accessibility, performance

- Updated homepage metadata (title/description/OG reuse existing `logo.jpg`); single H1; semantic `section`/`h2` structure; descriptive alt text from the imagery map.
- Below-fold images lazy-loaded; hero uses CSS/SVG (no image payload) so first paint stays fast; no layout shift.
- Keyboard-accessible hotspots/filters, visible focus, `prefers-reduced-motion` respected (existing global + framer-motion hooks).
- Next.js 16 compliance: no deprecated APIs; async request APIs where relevant; Turbopack-safe code.

## Verification

1. `npm run build` must pass (Turbopack).
2. Run dev server and screenshot desktop (1440px) + mobile (390px) views of the homepage and each new page, checking hierarchy, contrast, hotspot/filter interactions, and nav/footer.
3. Confirm existing flows still work: `/shop/*`, customizer, gallery, cart drawer.

Files touched: ~2 edited (`page.tsx`, `Navbar`, `Footer`, `HowItWorks`, `HeroBanner` rework), ~16 new (sections + 5 pages + imagery map + shared landing component), plus CSS modules. No Supabase schema changes.