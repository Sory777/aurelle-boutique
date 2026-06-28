# Implementation Plan: AURÉLLE — Luxury Women's Boutique

## Overview

This plan converts the approved design into an incremental, test-driven build. The
implementation language is **TypeScript** on **Next.js 14 (App Router)**, styled with
**Tailwind CSS + shadcn/ui + Framer Motion**, persisted in **PostgreSQL + pgvector**
via **Prisma/Drizzle**, with **Vitest + fast-check** for unit/property tests and
**Playwright** for integration/e2e (AI/PSP mocked in CI).

The sequence is deliberately **storefront-first**: scaffolding → design system/tokens →
layout/nav → catalog + home + PDP with seed data give a *runnable, viewable storefront*
by the first checkpoint. Only then do we layer the transactional backend
(pricing → inventory → cart → payments → checkout → shipping), followed by the flagship
AI Virtual Fitting Room, AI Fashion Assistant, smart search, the admin panel, and finally
security and performance hardening.

> **Ordering note:** Authentication/RBAC **core** is built right after the browsable
> storefront (it is a hard dependency of cart-merge, reviews, refunds, order-tracking
> authorization, and admin). Within the commerce group the natural dependency order is
> pricing → inventory → cart → payments → checkout → shipping, because checkout is the
> *wiring* step that composes the pricing, inventory, cart, and payment-intent services.
> The dedicated **Security hardening** epic (CSRF, rate-limiting, session hardening) is
> placed near the end as requested. The five correctness properties are placed as
> optional (`*`) test sub-tasks next to the code they validate.

The five correctness properties from the design are implemented as property-based tests:
- **P1 — Cart math** → Task 10.2 (Requirement 14)
- **P3 — Pricing/sale invariants** → Task 10.4 (Requirement 16)
- **P2 — Atomic, non-negative inventory** → Task 11.4 (Requirement 15)
- **P5 — Auth, no privilege escalation** → Task 9.3 (Requirement 21)
- **P4 — Size recommendation ∈ available sizes** → Task 17.4 (Requirement 9)

## Tasks

- [ ] 1. Project scaffolding and tooling
  - [ ] 1.1 Initialize the Next.js 14 App Router project with TypeScript and Tailwind
    - Create the `src/` tree from the design's Folder Structure (`app/`, `components/`, `services/`, `lib/`, `db/`, `stores/`, `styles/`, `tests/`)
    - Configure `tsconfig` (strict), ESLint, Prettier, path aliases, and the `(storefront)` route group
    - _Requirements: 1.5_
  - [ ] 1.2 Install and wire UI + state providers
    - Add shadcn/ui, Radix primitives, Framer Motion; create the root providers (TanStack Query client, Zustand store bootstrap) in a `Providers` client component
    - _Requirements: 14.6_
  - [ ] 1.3 Set up the testing infrastructure and CI gates
    - Configure Vitest (`vitest --run`), fast-check, and Playwright; add `tests/unit`, `tests/property`, `tests/e2e` scaffolding
    - Add a CI workflow file running lint, `tsc --noEmit`, unit, property, and mocked e2e tests
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [ ] 2. Brand design system and tokens
  - [ ] 2.1 Define Tailwind theme tokens for the luxury palette and typography
    - Encode palette (`noir`, `champagne`, `champagne-deep`, `ivory`, `blush`, `taupe`, `line`, state colors), the Cormorant Garamond / Inter type roles, the rem type scale, and line-height rules in `styles/`
    - _Requirements: 1.1_
  - [ ] 2.2 Implement brand-styled shadcn/ui primitives
    - Build/restyle Button, Badge, Card, Input, Dialog/Modal, Accordion, Tabs to brand tokens in `components/ui/`
    - _Requirements: 1.1, 1.5_
  - [ ] 2.3 Build the AURÉLLE logo/monogram and animated loader
    - Create the letter-spaced wordmark and the intersecting-arcs `A` monogram; add the Framer Motion draw-in loader
    - _Requirements: 1.1_

- [ ] 3. Application layout and global navigation
  - [ ] 3.1 Implement RootLayout with fonts, theme, and providers
    - Wire fonts, theme tokens, and the `Providers` wrapper into the App Router root layout
    - _Requirements: 1.1, 1.5_
  - [ ] 3.2 Build the Header / MegaNav with all storefront navigation links
    - Links to home, new-collection, every category, sale, favorites, cart, account, search, contact, FAQ, and journal on every storefront page
    - _Requirements: 1.5_
  - [ ] 3.3 Build the Footer
    - Brand footer with secondary navigation and legal/links
    - _Requirements: 1.5_
  - [ ] 3.4 Implement the global not-found (404) page
    - App Router `not-found` rendering with HTTP 404
    - _Requirements: 1.6_

- [ ] 4. Domain model, money utilities, and validation
  - [ ] 4.1 Define core TypeScript domain types
    - Encode `Product`, `ProductVariant`, `Inventory`, `ProductImage`, `Cart`/`CartItem`, `PricedCart`, `BodyProfile`, `Order`/`OrderItem`, `Payment`, `TryOnJob`, `ProductEmbedding`, `Role`/`Permission`/`Session`, and the `CategorySlug`/`StyleTag`/`SizeLabel` unions in `services`/`lib`
    - _Requirements: 2.1, 2.2, 3.1, 4.1, 16.1, 16.2_
  - [ ] 4.2 Implement Money utilities (integer minor units)
    - `lib/money` arithmetic on integer cents (add, sub, mulQty, clamp ≥ 0) to avoid float drift
    - _Requirements: 14.1, 14.2, 16.1_
  - [ ] 4.3 Define shared Zod validation schemas
    - Schemas for catalog list options (category/style/sort/page), add/update-cart, checkout request, and review submission, shared client/server
    - _Requirements: 2.6, 13.1, 13.3, 17.1_
  - [ ]* 4.4 Write unit tests for Money utilities
    - Cover rounding-free arithmetic, non-negativity clamps, and overflow edges
    - _Requirements: 14.1, 16.1_

- [ ] 5. Database schema, migrations, and seed data
  - [ ] 5.1 Define the Prisma/Drizzle schema with pgvector and inventory invariant
    - Tables for products, variants, inventory, images, carts/items, orders/items, payments, shipments, reviews, favorites, body profiles, try-on jobs, roles/permissions, audit log, processed-webhook-events, and `product_embedding` with `text_vec vector(1536)` / `image_vec vector(512)` HNSW indexes
    - Add the DB-level check `on_hand >= 0 AND reserved >= 0 AND on_hand - reserved >= 0`
    - _Requirements: 15.2, 16.1, 16.2, 12.1_
  - [ ] 5.2 Generate migrations and configure data clients
    - Create forward-only migrations; implement `lib/db` (Postgres) and `lib/redis` clients
    - _Requirements: 22.1_
  - [ ] 5.3 Write the re-runnable seed script
    - Upsert (by slug/sku) ~80–120 products across all categories with `basePrice`/`compareAtPrice` (≈20% on sale) and `styleTags`; 2–4 colors × size runs; inventory with `reserved=0`; flat/model/detail/spin images; one user per role with correct permissions; sample orders + verified-purchase reviews; deterministic `text_vec`/`image_vec` embeddings
    - _Requirements: 1.3, 1.4, 2.5, 5.1, 5.2, 16.1, 16.2_

- [ ] 6. Catalog service and storefront listing pages (visible storefront)
  - [ ] 6.1 Implement CatalogService listing with filter, sort, pagination, active-only
    - `listByCategory` honoring category and style filters, sort key, paginated result with total count, excluding `active=false`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ] 6.2 Implement the `/api/products` route with filter validation
    - Map list options to `CatalogService`; return a descriptive validation error for undefined category/style
    - _Requirements: 2.6_
  - [ ] 6.3 Build the Home page
    - Hero, featured collections, editorial content, and Virtual Fitting Room teaser using seeded catalog data
    - _Requirements: 1.1_
  - [ ] 6.4 Build category listing pages with Filters and Sort controls
    - `/c/[category]` for dresses, blouses, pants, skirts, jackets, sets, accessories; client Filters/Sort wired to query params
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_
  - [ ] 6.5 Build the New Collection and Sale pages
    - `/new` ordered by descending `releasedAt`; `/sale` returning only products whose `compareAtPrice` exceeds the effective sale price
    - _Requirements: 1.3, 1.4_
  - [ ] 6.6 Build the Journal pages
    - `/journal` index and `/journal/[slug]` editorial content (CMS-driven)
    - _Requirements: 1.7_
  - [ ]* 6.7 Write unit tests for catalog filtering, sorting, pagination, and validation
    - Cover category/style filtering, sort keys, pagination totals, active exclusion, and invalid-filter errors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 7. Product detail experience (visible storefront)
  - [ ] 7.1 Implement getProductBySlug and the PDP server component shell
    - Return product with variants, images, and current stock; render the PDP with mount points for gallery, 360, variants, stock, reviews, wishlist/share; not-found for unresolved/inactive slug
    - _Requirements: 3.1, 3.5_
  - [ ] 7.2 Build the Gallery and Zoom viewer
    - Render images ordered by ascending `position` via `next/image`; hover/pinch magnification
    - _Requirements: 3.2, 3.3_
  - [ ] 7.3 Build the 360-degree viewer
    - Frame-sequence spinner advancing `spin` images in `spinFrame` order on drag/scrub
    - _Requirements: 3.4_
  - [ ] 7.4 Build the VariantSelector and Size Guide
    - Color/size selectors bound to `ProductVariant`; resolved price using `priceOverride` else `basePrice`; size-guide modal with measurement table and a Virtual Fitting Room entry point
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 7.5 Build the real-time StockIndicator
    - Poll/SSE reading available quantity (`onHand - reserved`) for the selected variant; low-stock badge below threshold; out-of-stock state disabling add-to-cart
    - _Requirements: 4.4, 6.1, 6.2, 6.3_
  - [ ] 7.6 Build the Reviews display section
    - Rating distribution and individual reviews; verified-purchase badge on qualifying reviews
    - _Requirements: 5.1, 5.2_
  - [ ] 7.7 Build the guest wishlist and sharing
    - Persist guest favorites to local storage; Web Share API with copy-link fallback
    - _Requirements: 7.2, 7.5_

- [ ] 8. Checkpoint - runnable, browsable storefront
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Authentication, sessions, and RBAC core
  - [ ] 9.1 Implement AuthService.getSession with secure session cookie
    - Establish sessions in a secure, HTTP-only, SameSite cookie; read the session in edge middleware and the service layer
    - _Requirements: 21.1_
  - [ ] 9.2 Implement role-based permissions and assertion logic
    - Role→permission mapping; `hasPermission`; `assertPermission` returning normally iff the permission is in the session's effective permissions (equal to the role's), throwing forbidden otherwise; permissions never widened by request input
    - _Requirements: 21.2, 21.3, 21.4_
  - [ ]* 9.3 Write property test for authorization integrity
    - **Property 5: Auth — no privilege escalation**
    - **Validates: Requirements 21.2, 21.3, 21.4**
  - [ ] 9.4 Wire authenticated wishlist persistence and guest merge
    - Persist favorites for authenticated users; merge the guest wishlist into the user's wishlist on sign-in; support removal
    - _Requirements: 7.1, 7.3, 7.4_
  - [ ] 9.5 Implement verified-buyer review submission
    - `/api/reviews` persisting a rating + text and associating it to product and author when the author purchased the product; reject non-purchasers with a forbidden error
    - _Requirements: 5.3, 5.4_

- [ ] 10. Authoritative cart pricing engine
  - [ ] 10.1 Implement priceCart
    - Pure function: `subtotal = Σ(unitPrice × qty)`, `total = subtotal − discount + shipping + tax`, with `0 ≤ discount ≤ subtotal` and `shipping, tax, total ≥ 0`; no mutation of cart/context
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  - [ ]* 10.2 Write property test for cart math
    - **Property 1: Cart math**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
  - [ ] 10.3 Implement applyDiscount and product/sale price invariants
    - Enforce `basePrice ≥ 0`, `compareAtPrice ≥ basePrice` when present; a percentage discount `d ∈ [0,1]` yields a sale price in `[0, original]` and `≤ compareAtPrice`
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  - [ ]* 10.4 Write property test for pricing/sale invariants
    - **Property 3: Pricing invariants**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4**

- [ ] 11. Atomic, non-negative inventory reservation
  - [ ] 11.1 Implement InventoryService.getAvailable
    - Return `onHand - reserved` for a variant (used by PDP stock, cart, and checkout)
    - _Requirements: 6.1_
  - [ ] 11.2 Implement reserveStock with row locks
    - Single transaction with `SELECT ... FOR UPDATE`; increase `reserved` by exactly the requested qty per line; roll back the entire reservation if any line exceeds available, leaving all quantities unchanged
    - _Requirements: 15.1, 15.2, 15.3_
  - [ ] 11.3 Implement commit, release, and expiry handling
    - `commitReservation` (reserved → sold), `releaseReservation`, and release on expiry; maintain total reserved equal to the sum of committed quantities
    - _Requirements: 15.4, 15.5, 15.6_
  - [ ]* 11.4 Write property test for atomic, non-negative inventory
    - **Property 2: Non-negative inventory + atomic decrement**
    - **Validates: Requirements 15.2, 15.3, 15.6**

- [ ] 12. Cart management and cart page
  - [ ] 12.1 Implement CartService get/add/update/remove with cookie identity
    - Identify carts by a secure cart cookie; add a line (qty ≥ 1) returning the cart with the variant's available quantity; set line qty (≥ 1); remove a line
    - _Requirements: 13.1, 13.3, 13.4, 13.6_
  - [ ] 12.2 Enforce availability conflict handling
    - Reject add/update exceeding available quantity with a conflict (409), leaving the cart unchanged
    - _Requirements: 13.2_
  - [ ] 12.3 Implement cart API routes and authoritative re-price
    - `POST/PATCH/DELETE /api/cart/:id/items[/:lineId]` and `POST /api/cart/:id/price` returning server-computed `PricedCart`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.6_
  - [ ] 12.4 Implement guest-to-user cart merge on sign-in
    - Merge the guest cart into the user's cart at authentication
    - _Requirements: 13.5_
  - [ ] 12.5 Build the CartView page
    - Render line items and the server-computed pricing; never treat client totals as authoritative
    - _Requirements: 14.6_
  - [ ]* 12.6 Write unit tests for cart operations and conflicts
    - Cover add/update/remove and the over-available conflict path
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 13. Multi-provider payments and idempotent webhooks
  - [ ] 13.1 Implement createIntent across providers
    - Create a payment intent through Stripe, PayPal, Mercado Pago, Apple Pay, or Google Pay; store only provider tokens/intent ids, never raw card data
    - _Requirements: 18.1, 18.2_
  - [ ] 13.2 Implement webhook signature verification and idempotency
    - `POST /api/webhooks/:provider` verifying signatures before any effect; reject forged events; return a success no-op for already-processed event ids
    - _Requirements: 18.3, 18.4, 18.5_
  - [ ] 13.3 Implement the payment-succeeded and decline effects
    - On first verified success: commit the reservation and create the `PAID` order in a single transaction; on decline: release the reservation and return 402 with reason
    - _Requirements: 18.6, 18.7_
  - [ ] 13.4 Implement refunds gated by `order:refund`
    - Issue the refund and set payment status `REFUNDED` only for actors holding `order:refund`
    - _Requirements: 18.8_
  - [ ]* 13.5 Write tests for webhook idempotency and decline handling
    - Cover forged-signature rejection, duplicate-event no-op, single-effect commit, and decline-release
    - _Requirements: 18.4, 18.5, 18.6, 18.7_

- [ ] 14. Checkout orchestration (wiring)
  - [ ] 14.1 Implement the checkout flow
    - `POST /api/checkout`: recompute pricing server-side, reserve stock, then create a payment intent for the server-computed total; return order id, client secret, reservation id, and expiry; dedupe by idempotency key
    - _Requirements: 17.1, 17.2, 17.3, 17.6_
  - [ ] 14.2 Implement checkout error paths
    - Return 409 out-of-stock (with available qty) on reservation failure and 410 reservation-expired (requiring re-price + re-reserve)
    - _Requirements: 17.4, 17.5_
  - [ ]* 14.3 Write integration tests for checkout
    - Cover success, 409, 410, and idempotent replay against an ephemeral DB with a stubbed PSP
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 15. Shipping calculation, tracking, and notifications
  - [ ] 15.1 Implement ShippingService.quote
    - Return available shipping options with costs for a given address and parcel during checkout
    - _Requirements: 19.1_
  - [ ] 15.2 Implement shipment creation and tracking retrieval
    - Create a shipment for the selected option when a `PAID` order is fulfilled; return the carrier tracking timeline
    - _Requirements: 19.2, 19.3_
  - [ ] 15.3 Build the order-tracking page with ownership authorization
    - `/orders/[id]/track`: allow the owner or a support agent; reject others with a forbidden error
    - _Requirements: 19.3, 19.5_
  - [ ] 15.4 Implement the carrier webhook and shipping notifications
    - On carrier status change, update the shipment and send a shipping notification to the order owner
    - _Requirements: 19.4_
  - [ ]* 15.5 Write tests for tracking authorization
    - Cover owner/support access vs forbidden for non-owners
    - _Requirements: 19.5_

- [ ] 16. Checkpoint - end-to-end purchase path
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. AI Virtual Fitting Room (flagship)
  - [ ] 17.1 Implement createTryOnJob with encrypted short-TTL image storage
    - Store the raw image encrypted with a short-TTL reference, insert a `QUEUED` job, enqueue it for the GPU service (never render on serverless), and return 202 with the job id
    - _Requirements: 8.1, 8.2, 10.1_
  - [ ] 17.2 Implement GPU dispatch and job status lifecycle
    - Worker dispatch and status transitions `QUEUED → PROCESSING → DONE/FAILED`; on success store multi-view/360 output refs, recommended size, and fit notes; on failure store a reason and never initiate a charge
    - _Requirements: 8.3, 8.4, 8.5, 8.6_
  - [ ] 17.3 Implement recommendSize
    - Return a recommended size that is a member of the non-empty available-size set with confidence in `[0,1]`; when measurements are absent, fall back to the closest available size to historical purchases
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ]* 17.4 Write property test for size recommendation membership
    - **Property 4: Size recommendation ∈ available sizes**
    - **Validates: Requirements 9.1, 9.2**
  - [ ] 17.5 Implement compareSizes
    - Render the same garment for each requested size for side-by-side comparison
    - _Requirements: 9.4_
  - [ ] 17.6 Implement consent-based image retention
    - Delete the raw image immediately after render when `consentToStoreImages` is false; retain the encrypted image within the consented policy when true
    - _Requirements: 10.2, 10.3_
  - [ ] 17.7 Build the Fitting Room UI and try-on routes
    - PhotoCapturePanel (`getUserMedia`/upload), TryOnRenderViewer (multi-view/360, before/after), SizeSimulator/Compare; `POST /api/try-on`, `GET /api/try-on/:jobId`, `POST /api/try-on/size`
    - _Requirements: 8.1, 8.3, 8.5, 9.4_

- [ ] 18. AI Fashion Assistant
  - [ ] 18.1 Implement the embedding service and assistant orchestrator with memory
    - Embed queries, run pgvector ANN retrieval, load conversation + durable preference profile, and persist each turn's extracted preferences; reload the profile on a returning session
    - _Requirements: 11.1, 11.4, 11.5_
  - [ ] 18.2 Implement grounding, weather bias, and no-match handling
    - Restrict recommendations to catalog products that are women's and in-stock; bias by current weather when geo is available; on no match, return alternatives without fabricating absent products
    - _Requirements: 11.2, 11.3, 11.6_
  - [ ] 18.3 Implement the streaming assistant API and chat UI
    - `POST /api/assistant` streaming a reply plus structured recommendations via SSE; AssistantChat client consuming the stream
    - _Requirements: 11.1_
  - [ ]* 18.4 Write tests for assistant grounding
    - Assert recommendations are catalog-only and in-stock and that no out-of-catalog SKUs are produced on no-match
    - _Requirements: 11.2, 11.6_

- [ ] 19. Smart vector search
  - [ ] 19.1 Implement hybrid keyword + semantic search
    - `embed` plus reciprocal-rank fusion of Postgres full-text and text-vector ANN results
    - _Requirements: 12.1_
  - [ ] 19.2 Implement visual search
    - `POST /api/search/visual`: compute the image embedding and return nearest-neighbor products ranked by cosine similarity
    - _Requirements: 12.2_
  - [ ] 19.3 Apply filter predicates and no-results handling
    - Apply category/price/in-stock predicates alongside the ANN; include only available products when in-stock is requested; return an empty set with a no-results indication
    - _Requirements: 12.3, 12.4, 12.5_
  - [ ] 19.4 Build the Search page and filters UI
    - `/search` rendering hybrid results with category/price/in-stock controls
    - _Requirements: 12.1, 12.3_
  - [ ]* 19.5 Write tests for search filters and empty results
    - Cover in-stock filtering and the no-results path
    - _Requirements: 12.4, 12.5_

- [ ] 20. Checkpoint - AI features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Admin panel with role-based access control
  - [ ] 21.1 Implement admin RBAC enforcement (defense in depth)
    - Enforce the required permission in both edge middleware and the service layer; return 403 when the session lacks the permission
    - _Requirements: 20.2, 20.3_
  - [ ] 21.2 Build the admin CRUD sections
    - Products/variants, inventory, orders/fulfillment, refunds, customers, review moderation, content/journal, promotions/coupons, settings; persist authorized creates/updates/deletes
    - _Requirements: 20.1, 20.5_
  - [ ] 21.3 Implement the audit log on writes
    - Record actor, action, before/after state, and timestamp for every admin write
    - _Requirements: 20.4_
  - [ ]* 21.4 Write tests for admin RBAC and audit entries
    - Cover allowed operations vs 403 and verify audit entries are written
    - _Requirements: 20.2, 20.3, 20.4_

- [ ] 22. Security hardening
  - [ ] 22.1 Implement CSRF / SameSite verification on state-changing requests
    - Require a valid CSRF token or SameSite verification before applying any state change; integrate Server Action CSRF protection
    - _Requirements: 21.5_
  - [ ] 22.2 Implement rate limiting on sensitive endpoints
    - Redis token-bucket limits at the edge for auth, checkout, try-on, and assistant endpoints; reject until the window resets
    - _Requirements: 21.6_
  - [ ] 22.3 Harden session and content security
    - Session rotation, strict Content-Security-Policy, and secure cookie configuration
    - _Requirements: 21.1_

- [ ] 23. Performance and scalability hardening
  - [ ] 23.1 Add ISR/revalidate tags and Redis hot-read caching
    - Static generation + on-demand revalidation for catalog/PDP; cache hot product/stock reads with tag invalidation on writes
    - _Requirements: 22.1, 22.2_
  - [ ] 23.2 Configure image optimization and spin-frame loading
    - `next/image` AVIF/WebP responsive sizes with CDN edge caching; lazy-load and hover pre-warm 360/spin frames
    - _Requirements: 22.2_
  - [ ] 23.3 Tune vector search for latency
    - HNSW cosine indexes, bounded ANN `k`, and SQL pre-filter predicates to keep candidate sets small
    - _Requirements: 22.3_
  - [ ] 23.4 Implement GPU try-on backpressure
    - Per-user concurrency caps, queueing of additional jobs rather than rejection, and per-(user, garment, size) result caching
    - _Requirements: 22.5_
  - [ ] 23.5 Add checkout API latency safeguards
    - Minimize round-trips and cache pricing context inputs so the checkout API stays within its latency budget (excluding PSP)
    - _Requirements: 22.4_

- [ ] 24. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirement sub-clauses for traceability back to `requirements.md` and the corresponding design sections.
- Property-based tests (fast-check) validate the five universal invariants; unit/integration tests cover examples and edge cases.
- Checkpoints (Tasks 8, 16, 20, 24) provide incremental validation: a browsable storefront, a complete purchase path, AI features, and the full system.
- The server is the source of truth for money and stock; client state never authoritatively computes totals or availability.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "4.1", "4.2"] },
    { "id": 2, "tasks": ["2.1", "4.3", "4.4", "5.1", "10.1", "10.3"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.1", "5.2", "10.2", "10.4"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "5.3", "6.1", "9.1", "11.1", "13.1", "15.1", "17.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "7.1", "9.2", "11.2", "12.1", "13.2", "17.2", "17.3", "17.6", "18.1", "19.1", "22.3"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "9.3", "11.3", "12.2", "12.3", "13.4", "14.1", "17.4", "17.5", "17.7", "18.2", "19.2", "19.4", "21.1", "23.1", "23.3", "23.4"] },
    { "id": 7, "tasks": ["9.4", "9.5", "11.4", "12.4", "12.5", "12.6", "13.3", "14.2", "18.3", "18.4", "19.3", "21.2", "22.1", "23.2", "23.5"] },
    { "id": 8, "tasks": ["13.5", "14.3", "15.2", "19.5", "21.3", "22.2"] },
    { "id": 9, "tasks": ["15.3", "15.4", "21.4"] },
    { "id": 10, "tasks": ["15.5"] }
  ]
}
```
