# Requirements Document

## Introduction

**AURÉLLE** is a premium, women-only fashion e-commerce platform. The requirements below are derived from the approved technical design and capture, in EARS-compliant form, the behavior the platform must exhibit. The scope covers the public storefront and navigation, the product catalog and product detail experience, the flagship AI Virtual Fitting Room, the AI Fashion Assistant, smart vector search, cart and authoritative server-side pricing, atomic inventory reservation, multi-provider payments with idempotent webhooks, shipping calculation/tracking/notifications, the RBAC-gated admin panel, authentication and security, and performance targets.

Each requirement is traceable to a design decision. The acceptance criteria are written to be individually testable and, where the design defines an invariant (cart math, non-negative inventory, pricing bounds, size recommendation membership, and authorization/no-privilege-escalation), the criteria are stated so they can be validated by the property-based tests named in the design.

## Glossary

- **Storefront**: The public-facing AURÉLLE web application (Next.js App Router) that renders all customer pages and navigation.
- **Catalog_Service**: The service responsible for retrieving products, variants, images, and category listings.
- **Pricing_Engine**: The authoritative server-side function (`priceCart`) that computes subtotal, discount, shipping, tax, and total for a cart.
- **Cart_Service**: The service that creates and mutates carts (add, update quantity, remove, retrieve).
- **Inventory_Service**: The service that tracks `onHand` and `reserved` units per variant and performs reservations, commits, and releases.
- **Payment_Service**: The service that creates payment intents, verifies and processes provider webhooks, and issues refunds.
- **Shipping_Service**: The service that quotes shipping options, creates shipments, and reports tracking status.
- **Virtual_Fitting_Room**: The flagship AI try-on subsystem that renders garments onto a shopper's image, simulates fabric drape, and recommends sizes (backed by `TryOnService`).
- **Fashion_Assistant**: The LLM-plus-RAG conversational subsystem that provides styling advice and grounded product recommendations.
- **Search_Service**: The hybrid keyword-plus-vector search subsystem, including image-based visual search.
- **Auth_Service**: The service that establishes sessions and evaluates permissions (`getSession`, `hasPermission`, `assertPermission`).
- **Admin_Panel**: The RBAC-gated back office for catalog, inventory, orders, refunds, customers, reviews, content, promotions, and settings.
- **Notification_Service**: The asynchronous channel that sends order, shipping, and try-on notifications via email, SMS, or push.
- **Available_Quantity**: The value `onHand - reserved` for a product variant.
- **Reservation**: A time-limited hold on inventory for a set of cart line items, identified by a reservation id with an expiry.
- **Money**: A non-negative integer amount expressed in minor currency units (cents) to avoid floating-point drift.
- **Session**: An authenticated context containing a user id, a role name, and the effective permission set equal to that role's permissions.
- **Permission**: A discrete capability token (for example `catalog:write`, `order:refund`) granted by a role.
- **Idempotency_Key**: A client-generated unique token used to deduplicate checkout and payment operations.
- **Body_Profile**: A user's stored measurements and fit preference used by the Virtual_Fitting_Room, including an explicit image-storage consent flag.

## Requirements

### Requirement 1: Storefront Pages and Navigation

**User Story:** As a shopper, I want to browse a complete set of luxury storefront pages through clear navigation, so that I can explore collections and reach any product or category quickly.

#### Acceptance Criteria

1. WHEN a visitor requests the home route, THE Storefront SHALL render the home page containing the hero, featured collections, editorial content, and a Virtual_Fitting_Room teaser.
2. WHEN a visitor requests a defined category route for dresses, blouses, pants, skirts, jackets, sets, or accessories, THE Storefront SHALL render the corresponding category listing page.
3. WHEN a visitor requests the new-collection route, THE Catalog_Service SHALL return products ordered by descending `releasedAt`.
4. WHEN a visitor requests the sale route, THE Catalog_Service SHALL return only products whose `compareAtPrice` is greater than the effective sale price.
5. THE Storefront SHALL provide navigation links to the home, new-collection, category, sale, favorites, cart, account, search, contact, FAQ, and journal pages on every storefront page.
6. WHEN a visitor requests a route that resolves to no product, category, or content, THE Storefront SHALL render a not-found page with status code 404.
7. WHEN a visitor requests a journal article route with a valid slug, THE Storefront SHALL render the corresponding editorial content.

### Requirement 2: Product Catalog Listing, Filtering, and Sorting

**User Story:** As a shopper, I want to filter and sort category listings, so that I can narrow results to the items that match my taste and budget.

#### Acceptance Criteria

1. WHEN a visitor requests a product listing with a category filter, THE Catalog_Service SHALL return only products whose `category` equals the requested category.
2. WHEN a visitor requests a product listing with a style filter of casual, elegant, new, or sale, THE Catalog_Service SHALL return only products whose `styleTags` include the requested style.
3. WHEN a visitor requests a product listing with a sort parameter, THE Catalog_Service SHALL return the results ordered by the requested sort key.
4. WHEN a visitor requests a product listing with a page parameter, THE Catalog_Service SHALL return a paginated result that includes the requested page and the total result count.
5. THE Catalog_Service SHALL exclude products whose `active` field is false from all public listing results.
6. IF a requested filter value is not a defined category or style, THEN THE Catalog_Service SHALL return an error response with a descriptive validation code.

### Requirement 3: Product Detail Gallery, Zoom, and 360-Degree Viewer

**User Story:** As a shopper, I want to inspect a product through a high-resolution gallery, zoom, and a 360-degree spin, so that I can evaluate the garment in detail before buying.

#### Acceptance Criteria

1. WHEN a visitor requests a product detail route with a valid slug, THE Catalog_Service SHALL return the product with its variants, images, and current stock.
2. WHEN a product detail page renders, THE Storefront SHALL display the product images ordered by ascending `position`.
3. WHEN a visitor activates zoom on a gallery image, THE Storefront SHALL display a magnified view of the selected image.
4. WHERE a product has images of kind `spin`, THE Storefront SHALL render a 360-degree viewer that advances frames in `spinFrame` order in response to drag or scrub input.
5. IF a requested product slug resolves to no active product, THEN THE Catalog_Service SHALL return a not-found result.

### Requirement 4: Product Variants and Size Guide

**User Story:** As a shopper, I want to select color and size variants and consult a size guide, so that I can choose the correct item configuration.

#### Acceptance Criteria

1. WHEN a product detail page renders, THE Storefront SHALL display the available color and size variants bound to the product's `ProductVariant` records.
2. WHEN a visitor selects a variant, THE Storefront SHALL display the price for that variant, using `priceOverride` when present and otherwise the product `basePrice`.
3. WHEN a visitor opens the size guide, THE Storefront SHALL display the measurement table and provide an entry point into the Virtual_Fitting_Room size simulation.
4. WHILE a variant is selected, THE Storefront SHALL reflect the Available_Quantity for that specific variant.

### Requirement 5: Product Reviews

**User Story:** As a shopper, I want to read and submit product reviews, so that I can make informed decisions and share my experience.

#### Acceptance Criteria

1. WHEN a product detail page renders, THE Storefront SHALL display the rating distribution and individual reviews for the product.
2. WHERE a review is written by a verified purchaser, THE Storefront SHALL display a verified-purchase badge on that review.
3. WHEN a verified buyer submits a review with a rating and text, THE Catalog_Service SHALL persist the review and associate the review with the product and author.
4. IF a user who has not purchased the product attempts to submit a review, THEN THE Catalog_Service SHALL reject the submission with a forbidden error.

### Requirement 6: Real-Time Stock Indication

**User Story:** As a shopper, I want to see live stock availability, so that I know whether an item can be purchased and how scarce it is.

#### Acceptance Criteria

1. WHILE a product detail page is open, THE Inventory_Service SHALL provide the current Available_Quantity for the selected variant through polling or server-sent events.
2. WHILE the Available_Quantity of a variant is greater than zero and below a defined low-stock threshold, THE Storefront SHALL display a low-stock badge indicating the remaining quantity.
3. WHILE the Available_Quantity of a variant equals zero, THE Storefront SHALL indicate that the variant is out of stock and disable the add-to-cart action for that variant.

### Requirement 7: Wishlist and Sharing

**User Story:** As a shopper, I want to save favorites and share products, so that I can revisit items later and recommend them to others.

#### Acceptance Criteria

1. WHEN an authenticated user adds a product to favorites, THE Storefront SHALL persist the favorite to the user's wishlist.
2. WHEN a guest adds a product to favorites, THE Storefront SHALL persist the favorite to local guest storage.
3. WHEN a user who previously favorited as a guest signs in, THE Storefront SHALL merge the guest wishlist into the user's stored wishlist.
4. WHEN a user removes a product from favorites, THE Storefront SHALL delete the corresponding wishlist entry.
5. WHEN a visitor activates sharing on a product, THE Storefront SHALL provide a shareable link to the product through the Web Share API or a copy-link action.

### Requirement 8: AI Virtual Fitting Room — Try-On Job Lifecycle

**User Story:** As a shopper, I want to render a garment onto my own photo, so that I can see how the item looks on my body before purchasing.

#### Acceptance Criteria

1. WHEN a user submits a try-on request with an image or camera frame, a product id, and a variant, THE Virtual_Fitting_Room SHALL create a try-on job with status `QUEUED` and return the job id with HTTP status 202.
2. WHEN a try-on job is created, THE Virtual_Fitting_Room SHALL enqueue the job for processing on the dedicated GPU inference service rather than executing rendering on the serverless application layer.
3. WHILE a try-on job has not completed, THE Virtual_Fitting_Room SHALL report the job status as `QUEUED` or `PROCESSING` in response to a status request.
4. WHEN GPU rendering completes successfully, THE Virtual_Fitting_Room SHALL set the job status to `DONE` and provide multi-view and 360-degree output references along with a recommended size and fit notes.
5. WHEN a user requests a completed job, THE Virtual_Fitting_Room SHALL return the rendered view references and the recommended size.
6. IF GPU rendering fails or the input image is unusable, THEN THE Virtual_Fitting_Room SHALL set the job status to `FAILED` with a reason and SHALL NOT initiate any charge for the failed render.

### Requirement 9: Virtual Fitting Room — Size Simulation, Recommendation, and Comparison

**User Story:** As a shopper, I want size recommendations and side-by-side size comparisons, so that I can order the size most likely to fit.

#### Acceptance Criteria

1. WHEN a user requests a size recommendation for a garment with a non-empty set of available sizes, THE Virtual_Fitting_Room SHALL return a recommended size that is a member of the available sizes.
2. WHEN a size recommendation is returned, THE Virtual_Fitting_Room SHALL include a confidence value within the closed interval from 0 to 1.
3. IF a user's body measurements are absent, THEN THE Virtual_Fitting_Room SHALL recommend the available size closest to the user's historical purchases while keeping the recommendation within the available sizes.
4. WHEN a user requests a size comparison across multiple sizes, THE Virtual_Fitting_Room SHALL render the same garment for each requested size for side-by-side comparison.

### Requirement 10: Virtual Fitting Room — Privacy and Consent

**User Story:** As a shopper, I want control over my uploaded images, so that my personal photos are protected and only retained with my permission.

#### Acceptance Criteria

1. WHEN a raw user image is stored for try-on, THE Virtual_Fitting_Room SHALL store the image encrypted with a short time-to-live reference.
2. IF the user's Body_Profile `consentToStoreImages` is false, THEN THE Virtual_Fitting_Room SHALL delete the raw user image immediately after rendering completes.
3. WHERE the user's Body_Profile `consentToStoreImages` is true, THE Virtual_Fitting_Room SHALL retain the encrypted image within the consented retention policy.

### Requirement 11: AI Fashion Assistant

**User Story:** As a shopper, I want a conversational stylist that recommends in-stock products, so that I can get personalized outfit guidance.

#### Acceptance Criteria

1. WHEN a user sends a message to the Fashion_Assistant, THE Fashion_Assistant SHALL stream a reply together with structured product recommendations.
2. THE Fashion_Assistant SHALL restrict product recommendations to products that exist in the catalog, are categorized for women, and are in stock.
3. WHERE the user's geolocation is available, THE Fashion_Assistant SHALL incorporate current weather conditions to bias recommendations.
4. WHEN a conversation turn completes, THE Fashion_Assistant SHALL persist the turn and the extracted user preferences to the durable preference profile.
5. WHEN a returning user starts a new session, THE Fashion_Assistant SHALL load the stored preference profile into the conversation context.
6. IF no catalog product matches the user's constraints, THEN THE Fashion_Assistant SHALL return a no-exact-match response with alternative suggestions and SHALL NOT fabricate a product that is absent from the catalog.

### Requirement 12: Smart Vector Search

**User Story:** As a shopper, I want hybrid keyword, semantic, and visual search, so that I can find products by words or by image.

#### Acceptance Criteria

1. WHEN a visitor submits a text search query, THE Search_Service SHALL return results that fuse keyword matches and semantic vector matches using reciprocal-rank fusion.
2. WHEN a visitor submits an image for visual search, THE Search_Service SHALL compute an image embedding and return the nearest-neighbor products ranked by cosine similarity.
3. THE Search_Service SHALL apply category, price, and in-stock filters as predicates alongside the approximate-nearest-neighbor query.
4. WHEN search results are returned, THE Search_Service SHALL include only products whose Available_Quantity is greater than zero where the in-stock filter is requested.
5. IF a search query yields no matching products, THEN THE Search_Service SHALL return an empty result set with a no-results indication.

### Requirement 13: Cart Management

**User Story:** As a shopper, I want to add, update, and remove cart items, so that I can manage what I intend to purchase.

#### Acceptance Criteria

1. WHEN a user adds a variant with a quantity of at least one to a cart, THE Cart_Service SHALL add the corresponding line item and return the updated cart with the variant's Available_Quantity.
2. IF a requested add or update quantity exceeds the variant's Available_Quantity, THEN THE Cart_Service SHALL reject the operation with a conflict error and leave the cart unchanged.
3. WHEN a user updates the quantity of an existing cart line to a value of at least one, THE Cart_Service SHALL set the line quantity to the requested value.
4. WHEN a user removes a cart line, THE Cart_Service SHALL delete the line from the cart.
5. WHEN a guest with a cart signs in, THE Cart_Service SHALL merge the guest cart into the user's cart.
6. THE Cart_Service SHALL identify each cart by a secure cart cookie.

### Requirement 14: Authoritative Cart Pricing

**User Story:** As a shopper, I want totals computed authoritatively on the server, so that the amount I pay is correct and consistent.

#### Acceptance Criteria

1. WHEN the Pricing_Engine prices a cart whose line items each have a quantity of at least one and a resolved unit price of at least zero, THE Pricing_Engine SHALL set `subtotal` equal to the sum over all lines of `unitPrice` multiplied by `qty`.
2. WHEN the Pricing_Engine prices a cart, THE Pricing_Engine SHALL set `total` equal to `subtotal` minus `discount` plus `shipping` plus `tax`.
3. THE Pricing_Engine SHALL constrain `discount` to be at least zero and at most `subtotal`.
4. THE Pricing_Engine SHALL constrain `shipping`, `tax`, and `total` to be at least zero.
5. WHEN the Pricing_Engine prices a cart, THE Pricing_Engine SHALL NOT mutate the input cart or pricing context.
6. THE Storefront SHALL display the server-computed pricing and SHALL NOT treat any client-computed total as authoritative.

### Requirement 15: Atomic, Non-Negative Inventory Reservation

**User Story:** As a shopper, I want stock held correctly during checkout, so that I never buy an item that is unavailable and stock is never oversold.

#### Acceptance Criteria

1. WHEN the Inventory_Service reserves stock for a set of line items, THE Inventory_Service SHALL increase `reserved` for each variant by exactly the requested quantity within a single transaction using row locks.
2. THE Inventory_Service SHALL maintain `onHand` minus `reserved` greater than or equal to zero for every variant after any reservation, commit, or release.
3. IF any line in a reservation request exceeds its variant's Available_Quantity, THEN THE Inventory_Service SHALL roll back the entire reservation and SHALL leave all variant quantities unchanged.
4. WHEN a payment is confirmed for a reservation, THE Inventory_Service SHALL commit the reservation by converting reserved units to sold units.
5. WHEN a reservation reaches its expiry without a confirmed payment, THE Inventory_Service SHALL release the held quantities back to Available_Quantity.
6. WHEN multiple reservations are applied, THE Inventory_Service SHALL ensure the total reserved equals the sum of the quantities of the successfully committed reservations.

### Requirement 16: Pricing and Sale Invariants

**User Story:** As a merchandiser, I want sale pricing to respect bounds, so that discounts never produce invalid or misleading prices.

#### Acceptance Criteria

1. THE Catalog_Service SHALL maintain `basePrice` greater than or equal to zero for every product.
2. WHERE a product has a `compareAtPrice`, THE Catalog_Service SHALL maintain `compareAtPrice` greater than or equal to `basePrice`.
3. WHEN a percentage discount within the closed interval from 0 to 1 is applied to a product price, THE Pricing_Engine SHALL produce a sale price within the closed interval from zero to the original price.
4. THE Pricing_Engine SHALL constrain the effective sale price to be at least zero and at most the `compareAtPrice` when a `compareAtPrice` is present.

### Requirement 17: Checkout Flow

**User Story:** As a shopper, I want a reliable checkout, so that my order is priced, my stock is reserved, and my payment is initiated correctly.

#### Acceptance Criteria

1. WHEN a user initiates checkout, THE Pricing_Engine SHALL recompute the cart pricing server-side before any payment is initiated.
2. WHEN checkout pricing succeeds, THE Inventory_Service SHALL reserve stock for the cart line items before a payment intent is created.
3. WHEN stock reservation succeeds, THE Payment_Service SHALL create a payment intent for the server-computed total and return a client secret, the order id, the reservation id, and the reservation expiry.
4. IF stock reservation fails because requested quantity exceeds Available_Quantity, THEN THE checkout SHALL return a 409 out-of-stock error that includes the available quantity.
5. IF a reservation expires before payment is confirmed, THEN THE checkout SHALL return a 410 reservation-expired error and SHALL require re-pricing and re-reservation.
6. WHEN a checkout request includes an Idempotency_Key that matches a previously processed checkout, THE Payment_Service SHALL return the original result without creating a duplicate order or payment intent.

### Requirement 18: Multi-Provider Payments and Webhook Idempotency

**User Story:** As a shopper, I want to pay with my preferred provider securely, so that my payment is processed once and my card data stays protected.

#### Acceptance Criteria

1. WHEN a user selects a supported provider of Stripe, PayPal, Mercado Pago, Apple Pay, or Google Pay, THE Payment_Service SHALL create a payment intent through the selected provider.
2. THE Payment_Service SHALL store only provider tokens and intent identifiers and SHALL NOT store raw card data on AURÉLLE servers.
3. WHEN a payment provider webhook is received, THE Payment_Service SHALL verify the webhook signature before applying any effect.
4. IF a webhook signature fails verification, THEN THE Payment_Service SHALL reject the event without applying any effect.
5. WHEN a webhook event identifier has already been processed, THE Payment_Service SHALL return a success no-op without reapplying the effect.
6. WHEN a verified payment-succeeded webhook is processed for the first time, THE Payment_Service SHALL commit the reservation and create the order with status `PAID` within a single transaction.
7. IF a provider declines a payment, THEN THE Payment_Service SHALL release the reservation and return a 402 response with the decline reason.
8. WHEN a refund is requested by an actor holding the `order:refund` permission, THE Payment_Service SHALL issue the refund and set the payment status to `REFUNDED`.

### Requirement 19: Shipping Calculation, Tracking, and Notifications

**User Story:** As a shopper, I want shipping quotes, tracking, and status updates, so that I know shipping costs and can follow my order to delivery.

#### Acceptance Criteria

1. WHEN a user provides a shipping address and parcel during checkout, THE Shipping_Service SHALL return the available shipping options with their costs.
2. WHEN an order with status `PAID` is fulfilled, THE Shipping_Service SHALL create a shipment for the selected shipping option.
3. WHEN a user requests order tracking for an order they own, THE Shipping_Service SHALL return the current carrier tracking status timeline.
4. WHEN a carrier webhook reports a tracking status change, THE Shipping_Service SHALL update the shipment status and THE Notification_Service SHALL send a shipping notification to the order owner.
5. IF a user who is neither the order owner nor a support agent requests tracking for an order, THEN THE Shipping_Service SHALL reject the request with a forbidden error.

### Requirement 20: Admin Panel with Role-Based Access Control

**User Story:** As an administrator, I want a back office gated by least-privilege roles, so that staff can manage the store while access is restricted by role.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide management sections for products and variants, inventory, orders and fulfillment, refunds, customers, review moderation, content, promotions, and settings.
2. WHEN an actor requests an admin operation, THE Auth_Service SHALL enforce the required permission in both the edge middleware and the service layer.
3. IF an actor's Session lacks the permission required for an admin operation, THEN THE Auth_Service SHALL reject the operation with a 403 forbidden response.
4. WHEN an authorized actor performs a write operation in the Admin_Panel, THE Admin_Panel SHALL record an audit entry containing the actor, action, before-and-after state, and timestamp.
5. WHEN an authorized actor creates, updates, or deletes a catalog, order, customer, content, or settings record within the actor's permissions, THE Admin_Panel SHALL persist the change.

### Requirement 21: Authentication, Session Security, and Authorization Integrity

**User Story:** As a platform owner, I want secure sessions and tamper-proof authorization, so that accounts are protected and no request can escalate privileges.

#### Acceptance Criteria

1. WHEN a user authenticates successfully, THE Auth_Service SHALL establish a session stored in a secure, HTTP-only, SameSite cookie.
2. THE Auth_Service SHALL set a Session's effective permissions equal to the permission set of the user's assigned role.
3. WHEN `assertPermission` is evaluated for a Session and a permission, THE Auth_Service SHALL return normally if and only if the permission is a member of the Session's effective permissions, and otherwise SHALL throw a forbidden error.
4. THE Auth_Service SHALL derive Session permissions solely from the assigned role and SHALL NOT widen permissions based on request input.
5. WHEN a state-changing request is received, THE Auth_Service SHALL require a valid CSRF token or SameSite cookie verification before applying the change.
6. WHEN the rate limit for an authentication, checkout, try-on, or assistant endpoint is exceeded for a given client, THE Storefront SHALL reject further requests from that client until the limit window resets.

### Requirement 22: Performance and Scalability Targets

**User Story:** As a shopper, I want fast pages and responsive search and checkout, so that the luxury experience feels immediate.

#### Acceptance Criteria

1. WHEN a storefront page is requested at the edge, THE Storefront SHALL achieve a time-to-first-byte below 300 milliseconds.
2. WHEN a product detail page loads, THE Storefront SHALL achieve a largest-contentful-paint below 2.5 seconds.
3. WHEN search requests are measured, THE Search_Service SHALL achieve a 95th-percentile response time below 400 milliseconds.
4. WHEN checkout API requests are measured excluding payment-provider latency, THE checkout SHALL achieve a 95th-percentile response time below 600 milliseconds.
5. WHILE GPU try-on workers are saturated, THE Virtual_Fitting_Room SHALL apply per-user concurrency caps and queue additional jobs rather than rejecting requests.
