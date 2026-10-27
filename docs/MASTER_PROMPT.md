# CravePulse – Master Prompt for the AI Coding Agent
---

## Table of Contents

- [Role](#role)
- [Fixed Stack](#fixed-stack-do-not-change)
- [Operating Rules](#operating-rules)
- [Phase 0 – Baseline](#phase-0--baseline)
- [Phase 1 – Security and Authorization](#phase-1--security-and-authorization)
- [Phase 2 – Real Payments (Razorpay) and Wallet](#phase-2--real-payments-razorpay-and-wallet)
- [Phase 3 – Orders, Pricing and Cancellation](#phase-3--orders-pricing-and-cancellation)
- [Phase 4 – Dispatch and Rider Portal](#phase-4--dispatch-and-rider-portal)
- [Phase 5 – Real-Time Layer](#phase-5--real-time-layer)
- [Phase 6 – Partner (Restaurant) Portal](#phase-6--partner-restaurant-portal)
- [Phase 7 – Customer Experience (Zomato/Swiggy Parity)](#phase-7--customer-experience-zomatoswiggy-parity)
- [Phase 8 – Admin Console](#phase-8--admin-console)
- [Phase 9 – Frontend Quality, Responsiveness and Navigation](#phase-9--frontend-quality-responsiveness-and-navigation)
- [Phase 10 – Database](#phase-10--database)
- [Phase 11 – Tests, CI, Observability](#phase-11--tests-ci-observability)
- [Phase 12 – Documentation That Tells the Truth](#phase-12--documentation-that-tells-the-truth)
- [Acceptance Criteria](#acceptance-criteria-all-must-pass)
- [Final Output Format](#final-output-format)

---

## Role

You are a principal full-stack engineer and security reviewer. Your job is to turn the **CravePulse** food delivery project in this repository into a secure, honest, production-grade, **Zomato/Swiggy-class** application. You make real changes, run the build and tests after each phase, and report evidence.

---

## Fixed Stack (do not change)

| Layer | Technology |
|---|---|
| Backend | Java 17+, Jakarta Servlets 6 on embedded Tomcat 10.1, JDBC `PreparedStatement`s, HikariCP, MySQL 8, Gson, jBCrypt, JJWT, SLF4J/Logback, JUnit 5 + Mockito |
| Frontend | React 18, Vite, React Router, Axios, Bootstrap 5, Leaflet |
| Not allowed | **No Spring, Hibernate/JPA or Lombok** |

Keep the existing package layout (`servlet`, `service`, `dao`, `daoImpl`, `model`, `filter`, `util`, `websocket`) and portal structure (customer, partner, rider, admin).

---

## Operating Rules

1. Work in the phases below, **in order**. After each phase: build the backend (`mvn clean verify`), build the frontend (`npm run build`), run tests, fix failures, then give a short report (files changed, tests added, how to verify). **One git commit per phase.**
2. **No fake data in production paths.** Delete every silent fallback that invents restaurants, orders, analytics, disputes or payments when an API fails. Show a real error state with a retry button instead. Demo data lives only in SQL seed files.
3. **Never trust the client:** role, price, totals, ids, minutes, amounts and ownership are always decided server-side from the authenticated JWT and database rows.
4. Every new endpoint needs: authentication, role check, **ownership check**, input validation (type, range, length), a consistent JSON error shape `{success:false,error,code}`, and no internal messages in 500 responses (log them with a request id).
5. Money uses `BigDecimal` (scale 2) and DB transactions. Any wallet or balance change uses `SELECT ... FOR UPDATE` and writes a `wallet_transactions` row.
6. Add or adjust a migration (`V3__...sql` onward) for every schema change, and make the schema apply automatically on startup (small migration runner or Flyway). **Never edit V1 or V2 in place.**
7. Do not print or reuse secrets from the repository. Read all secrets from environment variables, fail fast at startup if `JWT_SECRET` is missing or shorter than 32 bytes, and treat all previously committed secrets as compromised.
8. If something is ambiguous, choose the safest option, note it in `docs/DECISIONS.md`, and continue.

---

## Phase 0 – Baseline

- [ ] Make the project build and run from a clean clone with one documented command sequence (`docker compose up` and a non-Docker path).
- [ ] Fix `docker-compose.yml` (do not set `MYSQL_USER=root`), the backend `Dockerfile` (produce a runnable fat jar via the shade or assembly plugin; correct `CMD`), and port consistency (one backend port, one frontend dev port, documented).
- [ ] Remove `.metadata`, `bin/`, `Servers/`, `tomcat.*` and committed `.env` files from the repository; harden `.gitignore`.
- [ ] Write `docs/BASELINE.md` with build and test results **before** changes.

---

## Phase 1 – Security and Authorization

- [ ] **Registration creates `CUSTOMER` only.** Add `POST /api/partner/apply` and `POST /api/rider/apply` (creating `PENDING_KYC` accounts and profiles) plus admin approve/reject endpoints. Persist the `rider_profiles` row on rider apply; remove all "fallback to rider/restaurant #1" code and return 403/404 instead.
- [ ] Add an authorization helper used by every servlet: `requireOwnerOfOrder`, `requireRestaurantOwner(restaurantId)`, `requireAssignedRider(orderId)`, `requireAdmin`. Fix all IDORs: order reads, status changes, restaurant orders, analytics, menu edits, reviews, disputes, invoices.
- [ ] **Order status endpoint rules:**
  - Customers may only cancel their own order while `PLACED` or `ACCEPTED`.
  - Restaurant owners may only `ACCEPT`, `REJECT`, `PREPARE`, `READY` for their own restaurant.
  - The assigned rider may only `PICKED_UP` and `DELIVERED` (`DELIVERED` requires the customer's delivery OTP).
  - Admin may do any legal transition.
  - Record the actor and role in `order_events`.
- [ ] **CORS:** allow-list from `CORS_ORIGINS` only; never combine `*` with credentials. Remove `Access-Control-Allow-Origin: *` from SSE.
- [ ] **Auth hardening:**
  - Password policy (min 8, letter + digit), email format, phone format (E.164, India +91), unique-phone handling.
  - Login rate limit per account and per IP.
  - Logout and refresh-token revoke endpoints.
  - 15-minute access token + 7-day rotating refresh token in an `HttpOnly` `Secure` `SameSite` cookie (or, if kept in storage, document the XSS trade-off).
  - Security headers filter (CSP, `X-Content-Type-Options`, `frame-ancestors`), request-size limits, proper client-IP handling behind a proxy, and an eviction policy for the rate-limit map.
- [ ] Remove `switchDemoRole`, `EMAIL_ALIASES`, hard-coded demo credentials and guest auto-login from the frontend. Demo login buttons may exist only when `VITE_DEMO_MODE=true`, and **never for ADMIN**.
- [ ] **Tests:** authorization matrix test (every role × every endpoint), role-escalation test, IDOR tests.

---

## Phase 2 – Real Payments (Razorpay) and Wallet

- [ ] **Flow:**
  1. `POST /api/payments/create` creates a Razorpay order for the server-calculated total.
  2. The frontend opens Razorpay Checkout (`checkout.js`) with UPI, cards, netbanking and wallets.
  3. `POST /api/payments/verify` validates the HMAC signature server-side.
  4. `POST /api/payments/webhook` (signature-verified, idempotent) is the source of truth.
  5. The order becomes `PLACED` only after payment is captured (or immediately for COD).
- [ ] Fix the payments DAO to match the schema; store gateway ids, signature, status and raw response; add idempotency by key.
- [ ] **COD rules:** configurable max order value (default Rs 2,000), disabled for new accounts with no delivered orders if configured.
- [ ] **Wallet payment option:** debit atomically with a ledger row. Combined wallet + online split payment is a *should-have*.
- [ ] **Refunds:** on cancellation, rejection or admin-approved dispute, refund to the original method via the gateway API (or to the wallet when the user chooses), update `payment_status`, write ledger rows, and make refunds idempotent.
- [ ] **Tests with a mocked gateway:** success, failed signature, duplicate webhook, double-click, refund idempotency.

---

## Phase 3 – Orders, Pricing and Cancellation

- [ ] **Pricing engine:**
  - Use the selected address coordinates.
  - Validate quantity (1–20); items belong to the same restaurant and are available; variant and add-on ids belong to the item; add-ons multiply by quantity.
  - Packaging per restaurant setting.
  - Delivery fee by distance slab, with free delivery above a configurable threshold (default Rs 499).
  - Surge or rain fee as an admin-configurable multiplier.
  - GST rules applied per component (food 5%; delivery and platform fees per current Indian rules, configurable).
  - Coupon rules: active window, min order, per-user limit, global limit, first-order-only, restaurant-specific, with `times_used` incremented transactionally.
- [ ] Reject orders when the address is beyond the restaurant's delivery radius or the restaurant is closed or throttled; return the reason.
- [ ] **Order creation:** honour the idempotency key (return the existing order on repeat), generate collision-safe order numbers (date + sequence/UUID fragment), verify address ownership, and insert order, items, event and load counter in one transaction.
- [ ] **Cancellation policy:** free cancellation until the restaurant accepts, partial or no refund afterwards (admin-configurable), automatic full refund when the restaurant rejects or no rider is found within the SLA.
- [ ] **Delivery OTP** (4 digits) generated at pickup, shown to the customer, required for `DELIVERED`.
- [ ] Reorder endpoint, order history with pagination, and a server-generated PDF or HTML tax invoice at a valid route (`GET /api/orders/{id}/invoice`) restricted to the owner. Fix the invalid servlet mapping.
- [ ] **Server-side notifications:** create a `notifications` row (and push over WebSocket) on every status change, rider assignment, refund, dispute update and coupon event; add mark-read and read-all endpoints and fix the frontend routes.

---

## Phase 4 – Dispatch and Rider Portal

- [ ] **Dispatch worker:** a single scheduled executor (not a thread per order) that:
  - offers to the nearest eligible rider,
  - waits `dispatch.riderAcceptTimeoutSeconds`, then marks `TIMED_OUT`,
  - skips riders who already declined or timed out for that order,
  - widens the radius progressively and retries,
  - escalates to admin when no rider is found within the SLA.
- [ ] **Rider endpoints the UI actually uses:** online toggle, offers list, accept, reject, arrived-at-restaurant, picked-up, arrived-at-customer, delivered (with OTP), earnings summary, history, profile and document upload. Fix every route mismatch with the frontend.
- [ ] **Wait-time compensation** computed from server timestamps (arrival vs pickup), capped per order and claimable once.
- [ ] **Tips:** customer tip chosen at checkout, 100% passed to the rider, shown in the offer.
- [ ] **Rider location:** authenticated WebSocket or REST only from the assigned rider; throttle updates (every 3–5 s), keep a short location log, and expose to the customer only for their active order.
- [ ] Cash-on-delivery settlement ledger for riders.

---

## Phase 5 – Real-Time Layer

- [ ] **WebSocket:** authenticate on handshake (reject invalid tokens); authorize subscriptions by role and ownership (customers only their orders, restaurants only their restaurant, riders only their offers, admin all); validate message sizes and rates; heartbeat and cleanup.
- [ ] Replace the blocking SSE servlet with async events or remove it. The frontend `RealtimeContext` should reconnect with backoff and resubscribe after reconnect.
- [ ] **Events** (document payloads in `docs/API.md`):
  - `order_status_updated`
  - `rider_assigned`
  - `rider_location_updated`
  - `new_order_placed`
  - `rider_job_offer`
  - `notification`
  - `restaurant_status_updated`
- [ ] Replace the simulated chat with real order-scoped chat (customer–rider, customer–restaurant) stored in an `order_messages` table, with masked calling (show a platform number or in-app call placeholder rather than raw phone numbers).

---

## Phase 6 – Partner (Restaurant) Portal

- [x] Resolve the restaurant from the authenticated owner everywhere; delete all hard-coded `restaurant/1` calls.
- [x] **Menu management through the API only:** create, edit, delete (soft), reorder, categories, variants, add-ons, images (validated upload, size and type limits), availability, schedule, and bulk sold-out. Remove the localStorage dish merge.
- [x] **Kitchen Kanban** driven by WebSocket plus polling fallback: new-order sound, accept with prep time, reject with reason, mark ready, auto-reject timer if not accepted in N minutes, overload throttle, store open/closed with business hours.
- [x] **Real analytics from SQL** (today, 7 and 30 days, top items, peak hours, cancellation rate, ratings), with no fabricated constants; empty states when there is no data.
- [x] **Settings** (profile, banner, bank and UPI payout details) saved to the database, with sensitive fields encrypted or masked; payout ledger and settlement statements.

---

## Phase 7 – Customer Experience (Zomato/Swiggy Parity)

### Must-have

- [x] **Home and discovery**
  - Deliver-to location bar (GPS + saved addresses + search).
  - Restaurants ranked by distance and open status.
  - Search across restaurants **and dishes** with suggestions and recent searches.
  - Filters: veg only, rating 4.0+, fast delivery, offers, price range, cuisine.
  - Sort: relevance, rating, delivery time, cost low to high.
  - Cuisine and category chips.
  - Restaurant cards with image, rating, ETA, distance, cost for two, discount tag.
  - Skeleton loaders; infinite scroll or pagination.
  - "Restaurant closed" and "Not delivering to your location" states.
- [x] **Restaurant page**
  - Sticky header; sticky category navigation with scroll-spy.
  - Veg/non-veg markers; bestseller and rating tags; in-menu search.
  - Item customization sheet (variant, add-ons, required choices, special instructions).
  - Offers strip; reviews with photos and sort; availability and timing.
- [x] **Cart and checkout**
  - Single-restaurant cart with confirmation on switch; quantity steppers.
  - Bill details (item total, delivery, packaging, platform fee, GST, discount, tip) with an explainer sheet.
  - Coupon list with eligibility reasons.
  - Address picker with add/edit on a map and Google Maps link; delivery instructions.
  - Payment method picker (UPI apps, cards, netbanking, wallet, COD) and a clear failure and retry flow.
  - The page must work on a **360 px** wide screen.
- [x] **Tracking**
  - Live status timeline: placed → accepted → preparing → ready → picked up → out for delivery → delivered.
  - Live map with rider marker and route; ETA that updates.
  - Rider card with rating; in-app chat and masked call; delivery OTP card.
  - Cancel button with the refund policy shown before confirming; clear cancelled or refunded state.
- [x] **Account**
  - Profile edit (name, email, phone verification via OTP).
  - Saved addresses (CRUD, default).
  - Order history with filters and reorder; tax invoices.
  - Wallet and transaction history; favourites; notification centre.
  - Help and support tickets linked to orders; ratings and reviews after delivery.

### Should-have

- First-order and bank offers engine
- Loyalty or membership with free-delivery perks
- Scheduled orders and group order link
- Dietary tags and allergen notes
- Referral codes
- Multi-language (English plus Hindi / Telugu / Kannada)
- Web push notifications

### Could-have

- Voice search
- AI recommendations from order history
- Carbon-neutral delivery option

---

## Phase 8 – Admin Console

- [x] **Real metrics:** GMV, orders, AOV, active riders, delivery time, cancellation rate, refunds.
- [x] Live map from real data; user directory with search and suspend.
- [x] Restaurant and rider approvals with document view.
- [x] Dispute queue with evidence images and audit trail.
- [x] Coupon CRUD; platform settings (fees, GST, radius, surge, COD limit).
- [x] Audit log of all admin actions; CSV export.
- [x] **Rule-based dispute auto-approval** allowed only for `DELIVERED` orders, once per order, within a time window and a configurable cap, with a fraud-flag counter per user.

---

## Phase 9 – Frontend Quality, Responsiveness and Navigation

- [x] **Responsive:** mobile-first layouts verified at 360, 390, 768, 1024 and 1440 px; bottom navigation bar on mobile for the customer app; collapsible sidebars for partner/rider/admin; no horizontal scroll; 44 px touch targets; safe-area insets.
- [x] **Structure:**
  - Split giant components (`RestaurantDetail`, `OrderTracking`, `CheckoutPage`, `Navbar`) into focused components and hooks.
  - Lazy-load each portal with `React.lazy` and route-level code splitting.
  - Add an error boundary, a not-found page, and consistent loading/empty/error states.
  - Use a single design-token file (colors, spacing, radius, shadows) replacing duplicated CSS.
- [x] **One data layer:** Axios client with typed error handling, request cancellation, retry on idempotent GETs, and one `useApi` (or React-Query-style) hook. Remove duplicate Bootstrap CDN tags (use the npm package once).
- [x] **Accessibility:** semantic landmarks, labels, focus states, keyboard navigation, AA contrast, `aria-live` for order status changes, reduced-motion support.
- [x] **Navigation:** fix dead or duplicate routes, keep readable URLs, preserve `returnTo` after login, breadcrumb on restaurant pages, and make portal switches impossible without the right role.
- [x] Remove all hard-coded person names and demo defaults from UI components (`Chef Lohith`, `Jaganmohan Reddy`, placeholder phone numbers). Everything comes from the logged-in user's data.

---

## Phase 10 – Database

- [x] **Migrations for:**
  - order OTP
  - `order_messages`
  - `favorites`
  - `support_tickets`
  - `coupon_usages(user_id, coupon_id, order_id)`
  - `audit_logs`
  - `payment_refunds`
  - `restaurant_hours`
  - `rider_documents`
  - `idempotency_keys`
  - `delivery_zones`
  - proper indexes: orders by customer/`created_at`, dispatch by status/`created_at`, notifications by user/`is_read`
- [x] Add CHECK-style validation in code for money columns (non-negative); foreign keys with intentional `ON DELETE` behaviour (**do not cascade-delete** orders, payments or ledger rows); a retention rule for `rider_location_logs`.
- [x] **Seed data:** separate `seed-demo.sql` (not applied in production) with 3 cities, 25+ restaurants with real menus, riders, coupons, and a few historical orders so analytics are meaningful. Keep passwords out of README tables.

---

## Phase 11 – Tests, CI, Observability

- [x] **Backend:**
  - Unit tests for pricing, coupons, state machine, dispatch timeout, payment verify, refunds.
  - Servlet-level tests with embedded Tomcat and a test MySQL (Testcontainers) for the auth matrix, order lifecycle, and concurrency (two riders accepting the same dispatch, double-submit orders).
- [x] **Frontend:**
  - Vitest + React Testing Library for cart reducer, checkout validation, protected routes.
  - Playwright end-to-end for customer order flow, partner accept flow, rider delivery flow, and admin approval flow.
- [x] **GitHub Actions:** build, test, lint, dependency audit (`npm audit`, OWASP dependency-check), and a secrets scan.
- [x] **Observability:** structured logs with request ids, `/health` and `/ready` endpoints (DB check), and basic metrics counters (orders per minute, failed payments, dispatch timeouts).

---

## Phase 12 – Documentation That Tells the Truth

- [x] Rewrite `README.md` so every claim matches working code:
  - accurate quick start (schema applied automatically),
  - real demo credentials from the seed,
  - a feature matrix with **Done / Partial / Planned** status,
  - environment variable table and architecture diagram,
  - API reference (`docs/API.md` generated from the servlets),
  - a known-limitations section.
- [x] Remove claims that are not implemented (or move them to a Roadmap).
- [x] Add `SECURITY.md` and a rotation checklist for the previously committed secrets.

---

## Acceptance Criteria (all must pass)

- [x] 1. A fresh clone runs with one command and seeds itself.
- [x] 2. The authorization matrix test passes: no role can read or change data it does not own; public signup can never create `ADMIN`, `RIDER` or `RESTAURANT_OWNER`.
- [x] 3. Placing a paid order is impossible without a verified Razorpay signature or webhook; COD limits are enforced.
- [x] 4. A full order lifecycle works end to end across four browsers or tabs (customer, partner, rider, admin) with live updates, OTP delivery, notifications and correct wallet/refund entries.
- [x] 5. Cancelling or rejecting a paid order refunds it **exactly once**.
- [x] 6. No file in the repository contains a real secret; the app refuses to start without `JWT_SECRET`.
- [x] 7. No component falls back to invented data; killing the backend shows error states, not fake orders.
- [x] 8. Every README claim is verified by code or marked Planned.
- [x] 9. Lighthouse mobile score 85+ for the home and restaurant pages; no horizontal scroll at 360 px.
- [x] 10. Backend and frontend tests pass in CI.

---

## Final Output Format

After the last phase, return:

1. **(a)** A phase-by-phase changelog with file lists.
2. **(b)** A table of every finding from the audit with **Fixed / Deferred** and the commit.
3. **(c)** The test report.
4. **(d)** A short list of anything that still needs my decision.
5. **(e)** Exact steps for me to run and verify the application locally.