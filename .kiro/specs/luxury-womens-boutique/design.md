# Design Document: AURÉLLE — Luxury Women's Boutique

## Overview

**AURÉLLE** is a premium, women-only fashion e-commerce platform whose flagship differentiator is an **AI Virtual Fitting Room** that overlays garments onto a shopper's own body with an on-device, AR-style render and recommends sizes — running 100% free and entirely in the browser. The platform pairs a couture-grade storefront experience with an AI Fashion Assistant (LLM + RAG), smart vector search, a full admin/merchandising back office, multi-provider payments, and shipping orchestration.

The system is built on **Next.js 14 (App Router)** with **TypeScript**, styled with **Tailwind CSS**, **shadcn/ui**, and **Framer Motion** for refined motion design. Persistence is **PostgreSQL** with the **pgvector** extension for semantic/visual search and recommendation embeddings. Product media is stored in **S3** behind a **CDN**, and the application is deployed on **Vercel**. The flagship virtual fitting room runs **100% free and fully client-side**: on-device ML (MediaPipe / TensorFlow.js over WebGL/WASM) handles pose detection, person segmentation, and the garment overlay in the browser, so try-on needs no paid GPU service, no API keys, and incurs no per-image cost — and raw user images never leave the device.

This document combines visual architecture (Mermaid diagrams, component breakdown, sequence flows) with code-first contracts (TypeScript interfaces, API specs, algorithmic specifications) and a set of property-based correctness invariants that govern cart math, inventory, pricing, size recommendation, and authorization.

### Brand Identity

| Attribute | Decision |
| --- | --- |
| **Brand name** | **AURÉLLE** — evokes *aura* + *aurum* (gold); a feminine, French-leaning luxury wordmark |
| **Tagline** | *"Dressed in light."* |
| **Logo concept** | Minimalist high-contrast serif wordmark `AURÉLLE` in letter-spaced caps. Monogram mark = a single `A` formed by two intersecting thin golden arcs (a stylized "aura"). Works as favicon, embossed packaging stamp, and animated loader (arcs draw-in on load via Framer Motion). |
| **Logo clear space** | Minimum padding equal to the cap-height of the `A` on all sides. |

### Luxury Palette

| Token | Hex | Usage |
| --- | --- | --- |
| `noir` | `#0B0B0C` | Primary text, footer, hero overlays |
| `champagne` | `#C5A47E` | Primary accent, CTAs, active states, monogram |
| `champagne-deep` | `#A8814F` | Hover/pressed accent |
| `ivory` | `#F7F3EC` | Page background |
| `blush` | `#E8D8D0` | Soft section backgrounds, badges |
| `taupe` | `#8A7F72` | Secondary text, captions |
| `line` | `#E4DDD2` | Hairline borders, dividers |
| `success` / `warn` / `danger` | `#5C7A5C` / `#C08A3E` / `#9B3D3D` | Muted, desaturated states to stay on-brand |

### Typography

| Role | Typeface | Notes |
| --- | --- | --- |
| Display / Headings | **Cormorant Garamond** (high-contrast serif) | Hero, section titles, product names |
| Body / UI | **Inter** (clean grotesque) | Paragraphs, controls, tables |
| Accent / Eyebrow | **Inter**, uppercase, tracked +0.18em | Category labels, badges |
| Numerics (prices) | **Inter** tabular-nums | Aligned price columns |

Type scale (rem): `0.75 / 0.875 / 1 / 1.25 / 1.5 / 2 / 3 / 4.5`. Generous line-height (1.6 body, 1.15 display) and whitespace reinforce the luxury feel.

---

## Architecture

### System Architecture (High Level)

```mermaid
graph TD
    subgraph Client["Client / Browser"]
        UI["Next.js 14 App Router<br/>RSC + Client Components<br/>Tailwind / shadcn / Framer Motion"]
        SW["Camera / Photo Capture<br/>(getUserMedia)"]
        TRYON["Virtual Fitting Room<br/>Client-side ML (MediaPipe / TF.js)<br/>pose + segmentation + 2D overlay"]
    end

    subgraph Edge["Vercel Edge / CDN"]
        EDGE["Edge Middleware<br/>auth, geo, rate-limit"]
        CDN["CDN<br/>static + image optim"]
    end

    subgraph App["Application Layer (Vercel)"]
        RSC["Server Components / Server Actions"]
        API["Route Handlers /api/*"]
        BFF["Service Layer<br/>cart, catalog, order, payment, shipping"]
    end

    subgraph AI["AI Services"]
        ASSIST["Fashion Assistant<br/>LLM + RAG Orchestrator"]
        EMB["Embedding Service<br/>CLIP / text-embedding-3"]
    end

    subgraph Data["Data & Storage"]
        PG[("PostgreSQL + pgvector")]
        REDIS[("Redis<br/>cache / sessions / locks")]
        QUEUE["Job Queue<br/>(emails, webhooks)"]
        S3["S3 Object Store"]
    end

    subgraph External["External Providers"]
        PAY["Stripe / PayPal / MercadoPago<br/>Apple Pay / Google Pay"]
        SHIP["Carrier APIs"]
        WEATHER["Weather API"]
        MAIL["Email / SMS / Push"]
    end

    UI --> EDGE --> RSC
    UI --> CDN --> S3
    SW --> API
    SW --> TRYON
    TRYON --> CDN
    RSC --> BFF
    API --> BFF
    BFF --> PG
    BFF --> REDIS
    BFF --> QUEUE
    BFF --> S3
    BFF --> ASSIST
    ASSIST --> EMB --> PG
    ASSIST --> WEATHER
    QUEUE --> MAIL
    BFF --> PAY
    PAY -- webhooks --> API
    BFF --> SHIP
    SHIP -- webhooks --> API
```

### Architectural Principles

- **Server-first rendering**: Catalog, PDP, and content pages are React Server Components for SEO + fast first paint; interactivity (cart, try-on, assistant) is islands of Client Components.
- **Service layer isolation**: Route Handlers and Server Actions are thin; all business rules live in a typed service layer so they are unit/property testable independent of HTTP.
- **Client-side try-on**: the virtual fitting room runs entirely in the shopper's browser using on-device ML (MediaPipe / TensorFlow.js over WebGL/WASM). There is no GPU service, job queue, or render storage — pose detection, segmentation, and the 2D garment overlay are computed synchronously on-device, and raw images never leave the browser.
- **Idempotency + atomicity at the boundaries**: Payments, inventory decrements, and webhook handlers are idempotent and transactional.
- **Vector-native**: Product, image, and user-preference embeddings live in pgvector with HNSW indexes, powering search, recommendations, and RAG.

---

## Sequence Diagrams

### 1. AI Virtual Fitting Room (Try-On)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant CAM as Camera / Photo (getUserMedia)
    participant ML as Client-side ML (MediaPipe / TF.js)
    participant OV as Garment Overlay Renderer (WebGL / Canvas)
    participant CDN as CDN (garment image)
    participant API as Route Handler /api/try-on/size (optional)

    U->>CAM: upload photo OR start live camera
    CAM-->>ML: image / video frame (stays on device)
    U->>CDN: GET garment image (already on CDN)
    ML->>ML: BlazePose landmarks (shoulders, torso, hips)
    ML->>ML: Selfie Segmentation / BodyPix person mask
    ML->>OV: landmarks + person mask
    CDN-->>OV: garment image
    OV->>OV: anchor + warp 2D garment overlay to landmarks
    OV-->>U: rendered try-on (front view, before/after, instant switch)

    U->>OV: change size / compare two sizes
    OV->>OV: rescale overlay per size (size simulation)
    OV-->>U: updated overlay (no server round-trip)

    opt optional size recommendation
        U->>API: POST /api/try-on/size { height, weight, bodyType, usualSize, availableSizes }
        API-->>U: { recommendedSize ∈ availableSizes, confidence ∈ [0,1], fitNote }
    end

    note over U,OV: All image processing is local — raw images are never uploaded.<br/>360° rotation and photorealistic fabric drape are approximate in the free client-side version.
```

### 2. Checkout & Payment

```mermaid
sequenceDiagram
    participant U as User
    participant API as /api/checkout
    participant CART as CartService
    participant INV as InventoryService
    participant PAY as PaymentService
    participant PSP as PSP (Stripe/…)
    participant DB as Postgres

    U->>API: POST /api/checkout { cartId, address, method }
    API->>CART: priceCart(cartId)  // recompute server-side
    CART-->>API: { subtotal, tax, shipping, discount, total }
    API->>INV: reserveStock(cartItems)  // tx + row locks
    INV->>DB: SELECT ... FOR UPDATE; decrement reserved
    INV-->>API: reservationId (TTL)
    API->>PAY: createPaymentIntent(total, idempotencyKey)
    PAY->>PSP: createIntent
    PSP-->>PAY: clientSecret
    PAY-->>API: clientSecret
    API-->>U: clientSecret

    U->>PSP: confirmPayment(clientSecret)
    PSP-->>API: webhook payment_intent.succeeded (signed)
    API->>PAY: verifySignature + idempotent handle(eventId)
    PAY->>INV: commitReservation(reservationId)  // reserved -> sold
    PAY->>DB: create Order(status=PAID)
    PAY->>U: order confirmation (email/push via queue)
```

### 3. AI Fashion Assistant (LLM + RAG, weather-aware)

```mermaid
sequenceDiagram
    participant U as User
    participant API as /api/assistant
    participant ORCH as AssistantOrchestrator
    participant MEM as Memory Store
    participant EMB as Embedding Service
    participant VDB as pgvector
    participant W as Weather API
    participant LLM as LLM

    U->>API: POST /api/assistant { message, sessionId }
    API->>ORCH: handle(message, userId, sessionId)
    ORCH->>MEM: load(conversation + user preference profile)
    ORCH->>W: getWeather(userGeo)  // optional
    ORCH->>EMB: embed(query)
    EMB-->>ORCH: queryVector
    ORCH->>VDB: ANN search products (filter: women, in-stock, price)
    VDB-->>ORCH: candidate products
    ORCH->>LLM: prompt(system + context + retrieved docs + weather + memory)
    LLM-->>ORCH: answer + structured product picks
    ORCH->>MEM: persist(turn, extracted preferences)
    ORCH-->>API: { reply, recommendedProducts[], rationale }
    API-->>U: streamed response (SSE)
```

---

## Storefront Page Map

All pages live under the App Router. Public storefront pages requested:

| Page | Route | Notes |
| --- | --- | --- |
| Home | `/` | Hero, featured collections, editorial, try-on teaser |
| New Collection | `/new` | Latest drop, sorted by `releasedAt` |
| Dresses | `/c/dresses` | Category listing |
| Blouses | `/c/blouses` | Category listing |
| Pants | `/c/pants` | Category listing |
| Skirts | `/c/skirts` | Category listing |
| Jackets | `/c/jackets` | Category listing |
| Sets | `/c/sets` | Coordinated sets |
| Casual | `/c/casual` | Style facet |
| Elegant | `/c/elegant` | Style facet |
| Sale | `/sale` | Discounted items only |
| Accessories | `/c/accessories` | Bags, jewelry, scarves |
| Favorites / Wishlist | `/favorites` | Auth or guest (local) |
| Cart | `/cart` | Server-priced cart |
| Account | `/account` | Profile, addresses, body profile, orders |
| Order Tracking | `/orders/[id]/track` | Carrier status timeline |
| Contact | `/contact` | Form + store info |
| FAQ | `/faq` | Accordion |
| Blog / Journal | `/journal` and `/journal/[slug]` | Editorial content (CMS-driven) |
| Product Detail (PDP) | `/p/[slug]` | Gallery, zoom, 360°, variants, size guide, reviews, stock, wishlist, share, **Try-On** entry |
| Virtual Fitting Room | `/p/[slug]/try-on` and `/fitting-room` | Flagship feature |
| Search | `/search` | Vector + keyword hybrid |
| Admin | `/admin/**` | RBAC-gated back office |

### PDP Feature Components

- **Gallery + Zoom**: high-res image grid, hover/pinch zoom, lazy-loaded via `next/image`.
- **360° viewer**: frame-sequence spinner driven by drag/scrub.
- **Variants**: color + size selectors bound to `ProductVariant`.
- **Size guide**: modal with measurement table; deep-links into Try-On size simulation.
- **Reviews**: rating distribution, verified-purchase badge, photo reviews.
- **Real-time stock**: live `availableQty` via polling/SSE; "Only N left" badge.
- **Wishlist + Share**: add to favorites; Web Share API + copy link.

---

## Components and Interfaces

### Frontend Component Breakdown

```mermaid
graph TD
    Layout["RootLayout (fonts, theme, providers)"] --> Header["Header / MegaNav"]
    Layout --> Footer["Footer"]
    Layout --> Pages["(route segments)"]

    Pages --> Home["HomePage (RSC)"]
    Pages --> PLP["CategoryListing (RSC) + Filters (client)"]
    Pages --> PDP["ProductDetail (RSC)"]
    PDP --> Gallery["Gallery + ZoomViewer (client)"]
    PDP --> Spin["ThreeSixtyViewer (client)"]
    PDP --> Variant["VariantSelector (client)"]
    PDP --> Stock["StockIndicator (client, SSE)"]
    PDP --> Reviews["ReviewsSection (client)"]
    PDP --> TryOnCTA["TryOnLauncher (client)"]

    Pages --> Fit["FittingRoom (client)"]
    Fit --> Capture["PhotoCapturePanel (upload / live camera)"]
    Fit --> MLmod["On-device ML (MediaPipe / TF.js)"]
    Fit --> Render["TryOnOverlayViewer (front view, before/after)"]
    Fit --> SizePanel["SizeSimulator / Two-size Compare"]

    Pages --> Cart["CartView (client)"]
    Pages --> Assistant["AssistantChat (client, SSE)"]
    Pages --> Account["AccountDashboard"]
```

### Core Service Interfaces (TypeScript)

```typescript
// ---------- Catalog ----------
interface CatalogService {
  getProductBySlug(slug: string): Promise<ProductDetail | null>;
  listByCategory(category: CategorySlug, opts: ListOptions): Promise<Paginated<ProductCard>>;
  getVariant(variantId: string): Promise<ProductVariant | null>;
  search(query: SearchQuery): Promise<SearchResult>; // hybrid keyword + vector
}

// ---------- Cart ----------
interface CartService {
  getCart(cartId: string): Promise<Cart>;
  addItem(cartId: string, variantId: string, qty: number): Promise<Cart>;
  updateQty(cartId: string, lineId: string, qty: number): Promise<Cart>;
  removeItem(cartId: string, lineId: string): Promise<Cart>;
  priceCart(cartId: string, ctx: PricingContext): Promise<PricedCart>; // authoritative
}

// ---------- Inventory ----------
interface InventoryService {
  getAvailable(variantId: string): Promise<number>;
  reserveStock(items: LineRef[], ttlSeconds: number): Promise<Reservation>;
  commitReservation(reservationId: string): Promise<void>;
  releaseReservation(reservationId: string): Promise<void>;
}

// ---------- Payments ----------
interface PaymentService {
  createIntent(input: CreateIntentInput): Promise<PaymentIntentResult>;
  handleWebhook(provider: PaymentProvider, raw: RawWebhook): Promise<WebhookOutcome>;
  refund(input: RefundInput): Promise<RefundResult>;
}

// ---------- Shipping ----------
interface ShippingService {
  quote(address: Address, parcel: Parcel): Promise<ShippingOption[]>;
  createShipment(orderId: string, optionId: string): Promise<Shipment>;
  getTracking(shipmentId: string): Promise<TrackingStatus>;
}

// ---------- AI ----------
// Try-on rendering is performed SYNCHRONOUSLY in the browser (no server job,
// no queue, no polling). Only size recommendation may optionally call a tiny
// stateless serverless endpoint; it never receives a user image.
interface TryOnService {
  // Runs fully client-side: detects pose + person segmentation and composites
  // the 2D garment overlay onto the user's photo/frame. No upload, no job id.
  renderTryOn(input: TryOnInput): TryOnRender;            // synchronous, in-browser
  recommendSize(input: SizeRecInput): SizeRecommendation; // pure, deterministic
  compareSizes(input: SizeCompareInput): SizeComparison;  // render two sizes side-by-side
}

interface AssistantService {
  chat(input: AssistantInput): AsyncIterable<AssistantChunk>; // streamed
}

interface SearchService {
  embed(text: string): Promise<number[]>;
  vectorSearch(vec: number[], filter: SearchFilter, k: number): Promise<ProductCard[]>;
}

// ---------- Auth / RBAC ----------
interface AuthService {
  getSession(req: Request): Promise<Session | null>;
  hasPermission(session: Session, permission: Permission): boolean;
  assertPermission(session: Session, permission: Permission): void; // throws 403
}
```

---

## Data Models

### Entity Relationship Overview

```mermaid
erDiagram
    USER ||--o{ ADDRESS : has
    USER ||--o| BODY_PROFILE : has
    USER ||--o{ ORDER : places
    USER ||--o{ FAVORITE : saves
    USER ||--o{ REVIEW : writes
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ PRODUCT_IMAGE : has
    PRODUCT ||--o{ REVIEW : receives
    PRODUCT_VARIANT ||--|| INVENTORY : tracked_by
    CART ||--o{ CART_ITEM : contains
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o| PAYMENT : paid_by
    ORDER ||--o| SHIPMENT : shipped_by
    PRODUCT ||--o| PRODUCT_EMBEDDING : indexed_by
    ROLE ||--o{ USER : assigned
    ROLE ||--o{ ROLE_PERMISSION : grants
```

### Type Definitions (TypeScript)

```typescript
type UUID = string;
type Money = number; // integer minor units (cents) to avoid float drift

type CategorySlug =
  | "dresses" | "blouses" | "pants" | "skirts"
  | "jackets" | "sets" | "accessories";

type StyleTag = "casual" | "elegant" | "new" | "sale";

interface Product {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  category: CategorySlug;
  styleTags: StyleTag[];
  basePrice: Money;       // current list price, >= 0
  compareAtPrice?: Money; // original price when on sale; >= basePrice
  currency: "USD" | "EUR" | "ARS";
  releasedAt: string;     // ISO date
  active: boolean;
}

interface ProductVariant {
  id: UUID;
  productId: UUID;
  color: string;
  size: SizeLabel;        // "XS" | "S" | "M" | "L" | "XL" | numeric
  sku: string;
  priceOverride?: Money;  // optional per-variant price
}

interface Inventory {
  variantId: UUID;
  onHand: number;         // physical units, >= 0
  reserved: number;       // held by active reservations, >= 0
  // available = onHand - reserved, must be >= 0
  version: number;        // optimistic concurrency token
}

interface ProductImage {
  id: UUID;
  productId: UUID;
  url: string;            // CDN URL
  kind: "flat" | "model" | "detail" | "spin";
  position: number;
  spinFrame?: number;     // for 360° sequences
}

interface CartItem {
  id: UUID;
  variantId: UUID;
  qty: number;            // >= 1
  unitPriceSnapshot: Money;
}

interface Cart {
  id: UUID;
  userId?: UUID;          // null => guest cart
  items: CartItem[];
  couponCode?: string;
  updatedAt: string;
}

interface PricedCart {
  cartId: UUID;
  lines: { lineId: UUID; unitPrice: Money; qty: number; lineTotal: Money }[];
  subtotal: Money;        // Σ lineTotal
  discount: Money;        // >= 0, <= subtotal
  shipping: Money;        // >= 0
  tax: Money;             // >= 0
  total: Money;           // subtotal - discount + shipping + tax, >= 0
}

interface BodyProfile {
  userId: UUID;
  heightCm?: number;
  weightKg?: number;
  bust?: number; waist?: number; hips?: number;
  bodyType?: "pear" | "hourglass" | "rectangle" | "apple" | "inverted-triangle";
  preferredFit?: "slim" | "regular" | "relaxed";
  usualSize?: SizeLabel;
  // No image-upload consent field: try-on images are processed locally in the
  // browser and are never uploaded or stored server-side.
}

interface Order {
  id: UUID;
  userId: UUID;
  items: OrderItem[];
  pricing: PricedCart;
  status: "PENDING" | "PAID" | "FULFILLING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
}

interface Payment {
  id: UUID;
  orderId: UUID;
  provider: PaymentProvider;
  intentId: string;
  amount: Money;
  status: "REQUIRES_ACTION" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  idempotencyKey: string;
}

type PaymentProvider = "stripe" | "paypal" | "mercadopago" | "apple_pay" | "google_pay";

// ---------- AI / vector ----------
interface ProductEmbedding {
  productId: UUID;
  textVec: number[];  // 1536-d (text-embedding-3-small) — pgvector
  imageVec: number[]; // 512-d  (CLIP image) — pgvector
}

interface TryOnRender {
  productId: UUID;
  variantId: UUID;
  size: SizeLabel;
  // Rendered overlay frame(s) exist only in the browser (canvas / blob URLs);
  // never persisted server-side, never uploaded.
  overlayDataUrls: string[];   // front view (+ optional before/after); local only
  recommendedSize?: SizeLabel;
  fitNote?: string;
}

// Lightweight, serializable result of the deterministic size algorithm.
interface SizeRecommendation {
  recommendedSize: SizeLabel;  // MUST be a member of the product's available sizes (P4)
  confidence: number;          // in [0, 1]
  fitNote: string;             // e.g., "ajustado" | "regular" | "holgado"
}

interface SizeRecInput {
  availableSizes: SizeLabel[]; // non-empty
  heightCm?: number;
  weightKg?: number;
  bodyType?: "pear" | "hourglass" | "rectangle" | "apple" | "inverted-triangle";
  complexion?: string;         // optional; only tints the overlay, never affects size
  usualSize?: SizeLabel;
}

// ---------- RBAC ----------
type Permission =
  | "catalog:read" | "catalog:write"
  | "order:read"   | "order:write" | "order:refund"
  | "user:read"    | "user:write"
  | "content:write"| "settings:write";

interface Role { id: UUID; name: "customer" | "support" | "merchandiser" | "admin" | "superadmin"; permissions: Permission[]; }
interface Session { userId: UUID; roleName: Role["name"]; permissions: Permission[]; }
```

### PostgreSQL / pgvector Notes

```sql
-- Vector columns + HNSW indexes for ANN search
ALTER TABLE product_embedding ADD COLUMN text_vec vector(1536);
ALTER TABLE product_embedding ADD COLUMN image_vec vector(512);
CREATE INDEX ON product_embedding USING hnsw (text_vec vector_cosine_ops);
CREATE INDEX ON product_embedding USING hnsw (image_vec vector_cosine_ops);

-- Inventory invariant enforced at the DB level
ALTER TABLE inventory ADD CONSTRAINT inv_nonneg
  CHECK (on_hand >= 0 AND reserved >= 0 AND on_hand - reserved >= 0);
```

---

## API Contracts

REST under `/api`. All responses are JSON; errors follow a shared envelope. Auth via secure HTTP-only session cookie; admin routes require RBAC permission checks in Edge middleware + service layer.

### Error Envelope

```typescript
interface ApiError {
  error: { code: string; message: string; details?: unknown };
  requestId: string;
}
```

### Endpoint Summary

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/products` | public | List/filter products (`?category=&style=&sort=&page=`) |
| GET | `/api/products/:slug` | public | Product detail w/ variants, images, stock |
| GET | `/api/search` | public | Hybrid keyword+vector search (`?q=&k=`) |
| POST | `/api/search/visual` | public | Image-based search (CLIP embedding) |
| GET | `/api/cart/:id` | session | Get cart |
| POST | `/api/cart/:id/items` | session | Add item `{ variantId, qty }` |
| PATCH | `/api/cart/:id/items/:lineId` | session | Update qty |
| DELETE | `/api/cart/:id/items/:lineId` | session | Remove item |
| POST | `/api/cart/:id/price` | session | Authoritative re-price |
| POST | `/api/checkout` | session | Reserve stock + create payment intent (idempotent) |
| POST | `/api/webhooks/:provider` | signed | PSP/carrier webhooks (idempotent by event id) |
| POST | `/api/orders/:id/refund` | `order:refund` | Refund |
| GET | `/api/orders/:id/track` | owner/support | Tracking status |
| POST | `/api/try-on/size` | optional | Deterministic size recommendation/compare (stateless; no image, no cost) |
| POST | `/api/assistant` | session/guest | Stream chat (SSE) |
| GET | `/api/favorites` / POST / DELETE | session | Wishlist CRUD |
| POST | `/api/reviews` | verified buyer | Submit review |
| `*` | `/api/admin/**` | RBAC | Catalog/order/user/content CRUD |

### Example Contract: Add to Cart

```typescript
// POST /api/cart/:id/items
interface AddItemRequest { variantId: UUID; qty: number; } // qty >= 1
interface AddItemResponse { cart: Cart; available: number; }
// 409 if requested qty exceeds available stock
```

### Example Contract: Checkout

```typescript
// POST /api/checkout
interface CheckoutRequest {
  cartId: UUID;
  shippingAddress: Address;
  shippingOptionId: string;
  provider: PaymentProvider;
  idempotencyKey: string; // client-generated UUID, dedupes retries
}
interface CheckoutResponse {
  orderId: UUID;
  clientSecret: string;   // PSP secret for client confirm
  pricing: PricedCart;    // server-authoritative
  reservationId: string;
  reservationExpiresAt: string;
}
```

---

## Algorithmic Specifications (Code-First)

### Cart Pricing

```typescript
function priceCart(cart: Cart, ctx: PricingContext): PricedCart
```

**Preconditions:**
- Every `item.qty >= 1`; every referenced variant resolves to a non-null price `>= 0`.
- `ctx.taxRate >= 0`; coupon (if any) resolves to a non-negative discount.

**Postconditions:**
- `subtotal === Σ (unitPrice_i × qty_i)`.
- `0 <= discount <= subtotal`.
- `shipping >= 0`, `tax >= 0`.
- `total === subtotal - discount + shipping + tax` and `total >= 0`.
- Pure: no mutation of `cart` or `ctx`.

### Inventory Reservation (atomic, non-negative)

```pascal
ALGORITHM reserveStock(items, ttl)
INPUT: items (variantId, qty), ttl in seconds
OUTPUT: Reservation

BEGIN
  BEGIN TRANSACTION
    FOR each line IN items DO
      row <- SELECT * FROM inventory WHERE variant_id = line.variantId FOR UPDATE
      ASSERT row.on_hand - row.reserved >= 0          // pre-state invariant
      IF (row.on_hand - row.reserved) < line.qty THEN
        ROLLBACK
        RAISE OutOfStock(line.variantId)
      END IF
      UPDATE inventory
        SET reserved = reserved + line.qty, version = version + 1
        WHERE variant_id = line.variantId
    END FOR
    reservation <- INSERT reservation(items, expires_at = now() + ttl)
  COMMIT
  RETURN reservation
END
```

**Preconditions:** all `line.qty >= 1`; inventory rows exist.
**Postconditions:** for every touched row, `on_hand - reserved >= 0` still holds; either all lines reserved or none (atomic); `reserved` increased by exactly the requested quantities.
**Loop invariant:** after processing line *k*, rows `1..k` are locked and have sufficient available stock.

### Webhook Idempotency

```pascal
ALGORITHM handleWebhook(provider, raw)
BEGIN
  ASSERT verifySignature(provider, raw)              // reject forged events
  eventId <- raw.id
  IF EXISTS processed_event(eventId) THEN
    RETURN AlreadyProcessed                           // idempotent no-op
  END IF
  BEGIN TRANSACTION
    applyEffect(raw)                                  // e.g., mark order PAID, commit reservation
    INSERT processed_event(eventId)
  COMMIT
  RETURN Processed
END
```

### Size Recommendation

```typescript
function recommendSize(input: SizeRecInput): SizeRecommendation
```

**Pure & deterministic** — runs in the browser (or a tiny stateless serverless function); no external API, no API keys, no per-call cost. Inputs: `heightCm`, `weightKg`, `bodyType`, `complexion` (optional), `usualSize`, and the product's `availableSizes`.

```pascal
ALGORITHM recommendSize(input)
INPUT: input { availableSizes (non-empty), heightCm?, weightKg?, bodyType?, complexion?, usualSize? }
OUTPUT: SizeRecommendation { recommendedSize, confidence, fitNote }

BEGIN
  ASSERT input.availableSizes is non-empty

  IF heightCm AND weightKg are present THEN
    bmi        <- weightKg / (heightCm / 100)^2
    ideal      <- mapMetricsToSizeIndex(bmi, bodyType)   // deterministic mapping
    confidence <- 0.85
  ELSE IF usualSize present THEN
    ideal      <- indexOfNearest(usualSize, availableSizes)
    confidence <- 0.6
  ELSE
    ideal      <- indexOfNearest(DEFAULT_SIZE, availableSizes)
    confidence <- 0.4
  END IF

  // clamp the ideal index into the available range, then pick a real member
  idx             <- clamp(ideal, 0, length(availableSizes) - 1)
  recommendedSize <- availableSizes[idx]                 // GUARANTEES membership (P4)

  fitNote <- classifyFit(idx, ideal)   // "ajustado" | "regular" | "holgado"
  RETURN { recommendedSize, confidence, fitNote }
END
```

**Preconditions:** `input.availableSizes` is non-empty; body measurements present, or `usualSize`/default fit used. `complexion` (if provided) only influences overlay tinting, never the size result.
**Postconditions:** `result.recommendedSize ∈ input.availableSizes` (chosen by index into the available set, so membership is guaranteed — preserves **P4**); `result.confidence ∈ [0, 1]`; `result.fitNote ∈ {"ajustado", "regular", "holgado"}`. Pure: no side effects, no network required.

### Authorization Check

```typescript
function assertPermission(session: Session, permission: Permission): void
```

**Postconditions:** returns normally **iff** `permission ∈ session.permissions` (which equals the permission set of the user's assigned role); otherwise throws `ForbiddenError`. A session's effective permissions are exactly the role's permissions — they are never widened by request input.

---

## AI Virtual Fitting Room (Flagship)

### Pipeline & ML Stack

```mermaid
graph LR
    IMG["User photo / live camera frame<br/>(stays on device)"] --> POSE["Pose & body landmarks<br/>MediaPipe Pose / TF.js BlazePose"]
    POSE --> SEG["Person segmentation<br/>MediaPipe Selfie Segmentation / TF.js BodyPix"]
    SEG --> ANCHOR["Anchor to landmarks<br/>(shoulders, torso, hips)"]
    GARMENT["Garment image (from CDN)"] --> WARP
    ANCHOR --> WARP["2D garment overlay + warp<br/>(WebGL / Canvas)"]
    WARP --> COMPOSITE["Composite over user image<br/>front view + before/after"]
    COMPOSITE --> OUT["Rendered in-browser<br/>(never uploaded)"]
```

| Stage | Technology | Runs on |
| --- | --- | --- |
| Pose / body landmarks | **MediaPipe Pose / TensorFlow.js (BlazePose)** | Browser (WebGL / WASM) |
| Person segmentation | **MediaPipe Selfie Segmentation / TensorFlow.js (BodyPix)** | Browser (WebGL / WASM) |
| Garment overlay & warp | 2D anchor + warp to body landmarks (TPS-lite) on **WebGL / Canvas** | Browser |
| Composite & views | front view + before/after toggle + per-size rescale | Browser |
| Size recommendation | pure, deterministic algorithm | Browser (or tiny stateless serverless fn) |

**Why client-side (and free):** the entire try-on runs on-device with MediaPipe / TensorFlow.js over WebGL/WASM, so there is no paid GPU service, no API keys, and no per-image cost. Rendering is synchronous in the browser — no job queue, no polling, no server render storage. **Tradeoff (called out honestly):** this is an approximate, AR-style 2D overlay; true 360° rotation and photorealistic fabric drape are limited/approximate compared to a server-side diffusion render.

### Capabilities

- **Inputs:** uploaded photo or live camera capture (`getUserMedia`); all frames stay on the device. Optional body params from `BodyProfile` feed the size recommendation.
- **Garment overlay on body** anchored and warped to detected landmarks (shoulders, torso, hips) and composited over the user's image — an approximate AR-style overlay, not a photorealistic render.
- **Size simulation / recommendation / compare:** rescale the overlay per size; deterministic size recommendation; side-by-side **two-size** comparison.
- **Views:** **front view** with **before/after** toggle and **instant garment switching**. 360° rotation and photorealistic fabric drape are limited/approximate in this free client-side version (explicit tradeoff for a zero-cost, fully private experience).
- **Privacy:** all processing happens in the browser — raw user images are **processed locally and never uploaded** or stored on any server.

---

## AI Fashion Assistant

- **LLM + RAG**: retrieval over `ProductEmbedding` (pgvector ANN) filtered to women's, in-stock, and budget constraints; the LLM composes styling advice and structured product picks.
- **Weather-aware**: optional geo → weather lookup biases recommendations (e.g., outerwear when cold, breathable fabrics when hot).
- **Memory**: per-session conversation history + a durable user **preference profile** (extracted style tags, sizes, color affinities) stored and re-injected on later sessions.
- **Streaming**: responses streamed via SSE for responsiveness.
- **Guardrails**: scope-limited to fashion/catalog; never invents out-of-catalog SKUs (grounded strictly in retrieved products).

---

## Smart Vector Search

- **Hybrid search**: keyword (Postgres full-text) **+** semantic (text embedding ANN) results fused by reciprocal-rank fusion.
- **Visual search**: upload an image → CLIP embedding → ANN over `image_vec`.
- **Recommendations**: "you may also like" via nearest neighbors on `text_vec`/`image_vec`, filtered by availability and category.
- **Index**: pgvector **HNSW** with cosine ops; filters (category, price, in-stock) applied as SQL predicates alongside the ANN.

---

## Admin Panel (CRUD + RBAC)

- **Sections**: Products & variants, inventory, orders & fulfillment, refunds, customers, reviews moderation, content/journal (CMS), promotions/coupons, settings.
- **RBAC roles**: `customer < support < merchandiser < admin < superadmin`, each mapping to a `Permission[]`. Every admin route enforces `assertPermission` in both Edge middleware and the service layer (defense in depth).
- **Audit log**: every write records actor, action, before/after, timestamp (supports the no-privilege-escalation property and traceability).

---

## State Management

| Concern | Mechanism |
| --- | --- |
| Server data (catalog, PDP, orders) | React Server Components + `fetch` cache / `revalidate` tags |
| Client server-state (cart, favorites) | **TanStack Query** (caching, retries, polling, SSE updates) |
| Try-on render state (on-device) | local component state + Web Workers / WASM; overlay results held in browser memory only (never uploaded) |
| Ephemeral UI state (modals, mega-nav, filters) | **Zustand** stores (small, colocated) |
| Cart identity | secure cookie (`cartId`); guest carts merge into user cart on login |
| Auth/session | HTTP-only secure cookie; session read in Edge middleware |
| Forms | React Hook Form + Zod schema validation (shared client/server) |
| Assistant chat stream | SSE consumed into a Zustand chat store |

Principle: **server is the source of truth for money and stock** — client state never authoritatively computes totals or availability.

---

## Folder Structure

```text
src/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx                # Home
│   │   ├── new/page.tsx
│   │   ├── c/[category]/page.tsx    # dresses, blouses, pants, skirts, jackets, sets, accessories
│   │   ├── sale/page.tsx
│   │   ├── p/[slug]/page.tsx        # PDP
│   │   ├── p/[slug]/try-on/page.tsx
│   │   ├── fitting-room/page.tsx
│   │   ├── favorites/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── account/**
│   │   ├── orders/[id]/track/page.tsx
│   │   ├── search/page.tsx
│   │   ├── journal/[slug]/page.tsx
│   │   ├── contact/page.tsx
│   │   └── faq/page.tsx
│   ├── admin/**                     # RBAC-gated
│   └── api/
│       ├── products/route.ts
│       ├── cart/[id]/**/route.ts
│       ├── checkout/route.ts
│       ├── try-on/size/route.ts        # optional, stateless size recommendation
│       ├── assistant/route.ts
│       ├── search/route.ts
│       └── webhooks/[provider]/route.ts
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── product/                     # Gallery, ZoomViewer, ThreeSixty, VariantSelector
│   ├── fitting-room/
│   ├── cart/
│   ├── assistant/
│   └── layout/                      # Header, MegaNav, Footer
├── services/                        # catalog, cart, inventory, payment, shipping, try-on, assistant, search, auth
├── lib/                             # db, redis, s3, embeddings, queue, money, rbac
├── db/                              # schema, migrations, seed
├── stores/                          # zustand stores
├── styles/                          # tailwind theme tokens (palette/typography)
└── tests/
    ├── unit/
    ├── property/                    # PBT (fast-check)
    └── e2e/                         # Playwright
```

---

## Error Handling

| Scenario | Condition | Response | Recovery |
| --- | --- | --- | --- |
| Out of stock at checkout | requested qty > available | `409 OUT_OF_STOCK` with available qty | UI offers max available / waitlist; reservation rolled back atomically |
| Reservation expired | TTL passed before payment | `410 RESERVATION_EXPIRED` | re-price + re-reserve |
| Payment failed | PSP declines | `402` + reason | release reservation; allow retry/alt method |
| Duplicate webhook | event id already processed | `200` no-op | idempotent dedupe table |
| Try-on failure | model load / unsupported device / no pose detected | inline in-browser error + reason | prompt re-capture / better lighting; nothing uploaded; runs fully on-device |
| Assistant retrieval empty | no matching products | graceful "no exact match" + alternatives | broaden filters |
| Authz failure | missing permission | `403 FORBIDDEN` | logged to audit trail |

---

## Testing Strategy

### Unit Testing
- Pure service functions (pricing, discounts, size logic) with deterministic fixtures. Runner: **Vitest** (run via `vitest --run`).

### Property-Based Testing
- **Library:** **fast-check** (TypeScript).
- Targets the correctness properties below. Each property generates randomized carts, inventories, prices, and role/permission sets.

### Integration / E2E
- API route handlers against an ephemeral Postgres (+pgvector) and stubbed PSP/carrier.
- **Playwright** for storefront, PDP, cart→checkout, and fitting-room flows. The assistant LLM and search are mocked in CI; the client-side try-on (MediaPipe / TF.js) runs headlessly with WebGL enabled, or is stubbed for deterministic CI.

---

## Correctness Properties (Property-Based)

> Library: **fast-check**. These are the invariants that must hold for all generated inputs.

### P1 — Cart math
For any cart of valid line items:
- `pricedCart.subtotal === Σ(unitPrice_i × qty_i)`
- `total === subtotal - discount + shipping + tax`
- `0 <= discount <= subtotal` and `total >= 0`
- `priceCart` is pure (input cart unchanged).

```typescript
fc.assert(fc.property(arbCart(), arbPricingCtx(), (cart, ctx) => {
  const p = priceCart(cart, ctx);
  const expectedSubtotal = cart.items.reduce((s, i) => s + unitPrice(i) * i.qty, 0);
  expect(p.subtotal).toBe(expectedSubtotal);
  expect(p.discount).toBeGreaterThanOrEqual(0);
  expect(p.discount).toBeLessThanOrEqual(p.subtotal);
  expect(p.total).toBe(p.subtotal - p.discount + p.shipping + p.tax);
  expect(p.total).toBeGreaterThanOrEqual(0);
}));
```

### P2 — Non-negative inventory + atomic decrement
For any sequence of concurrent/interleaved reservations:
- `onHand - reserved >= 0` always holds.
- A reservation either fully succeeds (all lines) or makes no change (atomic).
- Total reserved equals the sum of successful reservation quantities (no lost/double decrement).

```typescript
fc.assert(fc.property(arbInventory(), arbReservationOps(), (inv, ops) => {
  const final = applyReservations(inv, ops); // simulates row-locked, transactional decrements
  for (const row of final.rows) {
    expect(row.onHand - row.reserved).toBeGreaterThanOrEqual(0);
  }
  expect(totalReserved(final)).toBe(sumOfCommittedQuantities(ops));
}));
```

### P3 — Pricing invariants
For any product:
- `basePrice >= 0`; if `compareAtPrice` set then `compareAtPrice >= basePrice` (sale price never exceeds original).
- Effective sale price is within `[0, compareAtPrice]`.
- Applying a percentage discount `d ∈ [0,1]` yields `0 <= salePrice <= original`.

```typescript
fc.assert(fc.property(arbProduct(), fc.float({ min: 0, max: 1 }), (prod, d) => {
  const sale = applyDiscount(prod.basePrice, d);
  expect(sale).toBeGreaterThanOrEqual(0);
  expect(sale).toBeLessThanOrEqual(prod.basePrice);
  if (prod.compareAtPrice !== undefined) {
    expect(prod.compareAtPrice).toBeGreaterThanOrEqual(prod.basePrice);
  }
}));
```

### P4 — Size recommendation ∈ available sizes
For any body profile and any non-empty available-size set:
- `recommendSize(...).recommendedSize ∈ availableSizes`
- `confidence ∈ [0, 1]`.

```typescript
fc.assert(fc.property(arbBodyProfile(), arbNonEmptySizeSet(), (body, sizes) => {
  const rec = recommendSize({ body, availableSizes: sizes });
  expect(sizes).toContain(rec.recommendedSize);
  expect(rec.confidence).toBeGreaterThanOrEqual(0);
  expect(rec.confidence).toBeLessThanOrEqual(1);
}));
```

### P5 — Auth: no privilege escalation
For any user with role `r` and any request:
- Effective permissions == `role(r).permissions` (no widening from request input).
- `assertPermission(session, p)` succeeds **iff** `p ∈ role(r).permissions`.
- No sequence of normal requests grants a permission the role lacks.

```typescript
fc.assert(fc.property(arbRole(), arbPermission(), arbRequest(), (role, perm, req) => {
  const session = buildSession(role, req); // request input must NOT expand permissions
  expect(new Set(session.permissions)).toEqual(new Set(role.permissions));
  const allowed = role.permissions.includes(perm);
  if (allowed) {
    expect(() => assertPermission(session, perm)).not.toThrow();
  } else {
    expect(() => assertPermission(session, perm)).toThrow();
  }
}));
```

---

## Performance & Scalability

- **Rendering**: RSC + streaming; static generation for catalog/PDP with on-demand revalidation (ISR) on product updates.
- **Images**: `next/image` with AVIF/WebP, responsive sizes, CDN edge caching; 360°/spin frames lazy-loaded and pre-warmed on hover.
- **Caching**: Redis for hot reads (product, available stock), cache tags invalidated on writes; PSP/idempotency dedupe keys in Redis.
- **Vector search**: HNSW indexes; ANN `k` bounded; pre-filtered by SQL predicates to keep candidate sets small.
- **AI try-on**: runs client-side (MediaPipe / TF.js over WebGL/WASM) — zero server GPU cost and no queue; ML models are CDN-cached and lazy-loaded once, then run on-device. Heavier model variants are gated behind a quick WebGL/capability check with a lightweight fallback.
- **Targets (initial)**: storefront TTFB < 300ms (edge), PDP LCP < 2.5s, search p95 < 400ms, checkout API p95 < 600ms (excluding PSP), client-side try-on overlay renders in near real time on-device (no async server round-trip).

---

## Security Architecture

- **Auth**: secure HTTP-only, SameSite cookies; session rotation; optional 2FA for admin; OAuth social login.
- **RBAC**: least-privilege roles; permission checks in Edge middleware **and** service layer; audit log on all writes.
- **CSRF**: double-submit token / SameSite cookies on state-changing requests; Server Actions use framework CSRF protection.
- **XSS**: React auto-escaping; strict Content-Security-Policy; sanitize CMS/journal HTML; no `dangerouslySetInnerHTML` without sanitization.
- **Rate limiting**: per-IP/per-user limits on auth, checkout, try-on, and assistant endpoints (Redis token bucket) at the edge.
- **Encryption**: TLS in transit; encryption at rest for DB and S3. Try-on raw images are processed locally in the browser and never uploaded, so there is no server-side try-on image storage to encrypt or expire.
- **PCI**: card data never touches our servers — handled by PSP SDKs/Elements; we store only tokens/intent ids; scope minimized to SAQ-A.
- **Webhooks**: signature verification + idempotency dedupe; reject unsigned/forged events.
- **Secrets**: managed via Vercel/secret store; no secrets in client bundles.
- **Privacy**: try-on images are processed locally and never leave the device (no upload, no server retention, no consent-to-upload needed); standard data deletion/export endpoints remain for account data (GDPR/CCPA).

---

## Deployment & CI/CD

```mermaid
graph LR
    DEV["Feature branch"] --> PR["Pull Request"]
    PR --> CI["CI: lint + typecheck + unit + PBT + e2e (mocked AI)"]
    CI --> PREVIEW["Vercel Preview Deploy"]
    PREVIEW --> REVIEW["Review + approve"]
    REVIEW --> MAIN["Merge to main"]
    MAIN --> PROD["Vercel Production"]
    MAIN --> MIG["DB migrations (gated)"]
    MAIN --> ASSETS["Client-side ML assets publish to CDN"]
```

- **CI gates**: ESLint, `tsc --noEmit`, Vitest unit, fast-check property tests, Playwright e2e (AI/PSP mocked).
- **Preview environments**: every PR gets a Vercel preview with an isolated DB branch.
- **Migrations**: versioned, forward-only, run as a gated step before promoting production.
- **Client-side ML assets**: try-on ML models (MediaPipe / TF.js) are versioned static assets served from the CDN and lazy-loaded in the browser — there are no GPU workers to deploy or scale.
- **Observability**: structured logs + request ids, error tracking (Sentry), metrics/alerts on checkout and payment flows; client-side try-on errors reported via the browser error tracker.
- **Rollback**: instant Vercel rollback to previous deployment; migrations designed to be backward compatible.

---

## Seed Data Strategy

- **Catalog**: ~80–120 demo products spread across all categories (dresses, blouses, pants, skirts, jackets, sets, accessories) with realistic luxury names, prices (cents), `compareAtPrice` for ~20% on sale, and `styleTags` (`casual`/`elegant`/`new`/`sale`).
- **Variants & inventory**: each product gets 2–4 colors × standard size runs; inventory seeded with non-negative `onHand`, `reserved=0` to satisfy the inventory invariant from day one.
- **Images**: placeholder CDN images including flat, model, detail, and a spin set for at least a few products to exercise 360°.
- **Embeddings**: generate `text_vec`/`image_vec` for every product during seed so search/RAG work immediately; deterministic seed for reproducible tests.
- **Users & roles**: one user per role (`customer`, `support`, `merchandiser`, `admin`, `superadmin`) with correct permission sets to validate RBAC and the no-escalation property.
- **Orders/reviews**: a handful of historical orders + verified-purchase reviews to populate dashboards and rating distributions.
- **Idempotency**: seed script is re-runnable (upsert by stable slug/sku) so re-seeding never duplicates rows or violates constraints.

---

## Dependencies

| Category | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling/UI | Tailwind CSS, shadcn/ui, Framer Motion, Radix primitives |
| Data | PostgreSQL + pgvector, Prisma (or Drizzle) ORM, Redis |
| Storage/CDN | S3-compatible object store + CDN |
| Payments | Stripe, PayPal, MercadoPago, Apple Pay, Google Pay |
| AI (try-on) | **Client-side, free:** MediaPipe (Pose, Selfie Segmentation) / TensorFlow.js (BlazePose, BodyPix) running in-browser over WebGL/WASM; 2D garment overlay on Canvas/WebGL. No GPU service, no API keys, no per-image cost. |
| AI (assistant/search) | LLM (GPT-4o / Claude), text-embedding-3, CLIP, RAG over pgvector |
| Validation | Zod, React Hook Form |
| State | TanStack Query, Zustand |
| Testing | Vitest, fast-check, Playwright |
| Infra/CI | Vercel, GitHub Actions, Sentry |
| External | Weather API, Email/SMS/Push providers, Carrier tracking APIs |
```

---

## Next Steps

With the design approved, the natural progression is to **derive formal requirements** (EARS-style acceptance criteria traced back to these design decisions), and then break the work into an actionable **task list** for implementation.
