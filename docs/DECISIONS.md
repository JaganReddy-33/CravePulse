# Architecture Decision Records (ADRs)

## ADR-001: Baseline Cleanup & Port Unification (Phase 0)
- **Date**: 2026-10-26
- **Status**: Accepted
- **Context**: Embedded Tomcat, documentation, and frontend API configurations had conflicting port references (8080 vs 8081). Standalone JAR execution lacked packaging manifests and required IDEs or complex command lines.
- **Decision**:
  - Unified backend port strictly to `8081`.
  - Added `maven-assembly-plugin` producing a runnable fat JAR at `target/food-delivery-backend.jar` with `Main-Class: com.foodplatform.ServerMain`.
  - Configured Vite proxy and Axios defaults to point reliably to `http://localhost:8081`.

---

## ADR-002: Security Hardening & Zero-Trust Authorization Matrix (Phase 1)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: Public registration allowed client-supplied `role` values, enabling role escalation. Endpoints lacked proper authorization checks allowing IDORs across orders, restaurants, and rider data. Auth tokens had excessive lifespans and no revocation mechanism.
- **Decision**:
  - **Fail-Fast Secrets**: Embedded Tomcat startup aborts immediately if `JWT_SECRET` is unset, default, or `< 32 bytes`.
  - **Token Lifetimes & Revocation**: Access tokens expire in 15 minutes (`900,000 ms`), refresh tokens in 7 days (`604,800,000 ms`). Logout revokes all active tokens in the DB.
  - **Public Registration Role Lockdown**: `/api/auth/register` creates `CUSTOMER` accounts only. Partner and rider onboarding must submit KYC via dedicated `/api/partner/apply` and `/api/rider/apply` endpoints requiring Admin approval.
  - **IDOR Remediation**: Implemented `BaseServlet` authorization guards (`requireOwnerOfOrder`, `requireRestaurantOwner`, `requireAssignedRider`, `requireAdmin`). Order lookup, invoices, and analytics strictly check session identity against DB records.
  - **State Machine RBAC**: `OrderStateMachineService` strictly validates state transitions against caller role and ownership. Customers can only cancel when `PLACED` or `ACCEPTED`; riders require a valid 4-digit customer `delivery_otp` to mark `DELIVERED`.
  - **Defensive Headers & Rate Limiting**: `SecurityHeadersFilter` enforces CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a 10MB payload limit. `RateLimitFilter` limits general requests to 300/min and login attempts to 15/min per IP.

---

## ADR-003: Real Payments (Razorpay), Atomic Wallet & Webhook Engine (Phase 2)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: The application relied on simulated client-side mock payments without cryptographic verification, lacked webhook support, lacked wallet transactions, and had no Cash on Delivery threshold protection.
- **Decision**:
  - **Razorpay Orders REST Client**: Implemented backend `RazorpayGatewayClient` using Java 17 `HttpClient` and Basic Auth, converting INR amounts to paise (`amount * 100`) and retrieving gateway `order_id`.
  - **Constant-Time Verification**: Enforced `POST /api/payments/verify` computing `HMAC-SHA256(order_id + "|" + payment_id, keySecret)` using `MessageDigest.isEqual` to prevent timing attacks.
  - **Idempotent Webhooks**: Enforced `POST /api/payments/webhook` validating `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` and logging event IDs in `payment_webhook_events` to prevent double-charging or duplicate order fulfillment.
  - **Atomic Wallet Debits**: Implemented pessimistic row-level locking (`SELECT ... FOR UPDATE`) in `users` during wallet payments, preventing concurrent overdrafts. Recorded double-entry ledger rows in `wallet_transactions`.
  - **COD Threshold**: Restrained Cash on Delivery strictly to orders $\le$ ₹2,000 on backend (`AppProperties.getCodMaxLimit()`) and disabled on frontend with explanatory warning.
  - **Automated Refund Engine**: Integrated refund execution upon order cancellation/rejection, issuing instant wallet credits for wallet payments and invoking Razorpay Refund API for card/UPI payments.

---

## ADR-004: Orders, Pricing Engine, Real-World Bangalore Catalog & Parity (Phase 3)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: Prior pricing allowed arbitrary quantities, lacked add-on quantity scaling, did not validate restaurant delivery radius, lacked component-wise GST calculations, and had basic coupon evaluation prone to race conditions. The restaurant catalog had only 5 mock venues without real Bangalore addresses, dine-in price parity proof, or canonical Swiggy/Zomato URL structures.
- **Decision**:
  - **Deterministic Pricing Engine**: Enforced item quantity validation ($1 \le quantity \le 20$), strict restaurant ownership of items/variants/addons, addon price scaling by item quantity, delivery fee calculation by distance slab with configurable free delivery threshold (default ₹499) and surge multipliers, and component-wise GST calculation (5% food & packaging, 18% services).
  - **Atomic Coupon Enforcement**: Evaluated coupon active window, min order amount, first-order-only customer check, restaurant restriction, and per-user usage limits. Incremented `times_used` and inserted into `coupon_usages` within the order transaction.
  - **Order Integrity & Idempotency**: Handled `X-Idempotency-Key` headers to prevent duplicate order generation. Generated collision-safe order numbers (`CP-yyyyMMdd-XXXXXX`). Validated customer address ownership. Implemented `/api/orders/{id}/reorder` returning validated, current-priced cart items.
  - **Real-Time Notification Pipeline**: Created `notifications` table and `NotificationService` pushing state transition events over authenticated WebSockets with mark-read/clear REST endpoints.
  - **Bangalore Real-World Catalog**: Seeded 72 authentic Bangalore culinary institutions across 10 iconic food zones with 1,047 dishes, complete with spice levels, allergens, hygiene certifications, and exact 0% markup dine-in price parity proofs. Supported `/city/bangalore/:restaurantSlug` routing with slug-based DAO lookup.

---

## ADR-005: Single Scheduled Dispatch Worker, Fair Wait Compensation, 100% Tip Pass-Through & COD Ledger (Phase 4)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: Dispatching previously lacked autonomous background scheduling (relied on ad-hoc per-order threads), lacked progressive search radius expansion, allowed client-reported wait times, did not guarantee 100% customer tip pass-through to fleet partners, and had no Cash on Delivery collection ledger or cash-in-hand tracking.
- **Decision**:
  - **Single Scheduled Dispatch Executor**: Implemented a daemon `ScheduledExecutorService` (single worker thread) initialized in `ServerMain`. Every 5 seconds, scans for offers where `dispatch_status = 'OFFERED'` exceeding `riderAcceptTimeoutSeconds` (30s SLA), transitions them to `TIMED_OUT`, and re-dispatches. Scans for unassigned active orders (`status IN ('PLACED', 'ACCEPTED', 'PREPARING', 'READY') AND rider_id IS NULL`).
  - **Progressive Search Radius Expansion & SLA Escalation**: Excludes riders who previously declined or timed out for an order. Expands search radius progressively (3.5 km → 6.5 km → 10.0 km → 15.0 km max). Automatically escalates SLA breaches to the Admin console via WebSockets and notifications if unassigned after 3 attempts.
  - **100% Tip Pass-Through**: Customer tip chosen during checkout is stored on the order, passed 100% into the upfront dispatch offer payload, and deposited into the rider's wallet upon verified delivery.
  - **Server-Timestamped Fair Wait-Time Compensation**: Replaced client-supplied wait duration with server timestamps (`arrived_at_restaurant_at` to `picked_up_at` or `CURRENT_TIMESTAMP`). Automatically deducts an 8-minute kitchen prep grace period, computes compensation at ₹2.00/min, caps payouts at ₹100.00 per order, and enforces atomic one-time claim protection (`wait_compensation_claimed = TRUE`).
  - **4-Digit Delivery PIN Verification**: Requires customer 4-digit handover PIN verification before transitioning order status to `DELIVERED`, crediting trip earnings, and releasing rider availability.
  - **Cash on Delivery (COD) Settlement Ledger**: Added `rider_profiles.cash_in_hand` tracking and `rider_cod_settlements` double-entry ledger. Cash collected on delivery increments `cash_in_hand` and writes `COLLECTED` entries; hub cash turn-in decrements `cash_in_hand` and writes `DEPOSITED` entries with transaction references.
  - **Authenticated & Throttled Rider Telemetry**: Restricted rider GPS telemetry updates (`POST /api/rider/telemetry`) to authenticated fleet captains assigned to the order, updating coordinates and broadcasting live location strictly to the customer active order room.

---

## ADR-006: Authenticated WebSocket Protocol, Channel Authorization Matrix, Non-Blocking SSE & Order Chat (Phase 5)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: The real-time messaging layer previously accepted unauthenticated WebSocket connections or allowed clients to subscribe to arbitrary channels without role/ownership verification (e.g. any client could listen to `admin:feed` or another customer's `order:{id}`). SSE was implemented using thread-blocking `Thread.sleep` loops, exhausting container thread pools under concurrent traffic. In-order customer-rider-kitchen communication lacked backend persistence, rate limiting, and frame-size guards, while telephone numbers were exposed in plaintext rather than masked through a virtual proxy number.
- **Decision**:
  - **Authenticated WebSocket Handshake**: Enforced JWT token validation on `onOpen` via `?token=<jwt>` query parameter. Missing or invalid tokens result in immediate connection closure with code `1008 (VIOLATED_POLICY)`.
  - **Channel Subscription Authorization Matrix**:
    - `admin:feed`: Enforced `ADMIN` role from JWT claims.
    - `user:{userId}`: Enforced matching authenticated user ID or `ADMIN`.
    - `rider:{riderId}`: Enforced rider profile ownership matching authenticated user ID or `ADMIN`.
    - `restaurant:{restaurantId}`: Enforced restaurant ownership matching authenticated user ID or `ADMIN`.
    - `order:{orderId}`: Enforced order participant authorization via `OrderMessageDao.isUserAllowedInOrderChat` (customer buyer, assigned delivery captain, restaurant owner, or admin). Unauthorized subscription attempts are rejected with an explicit `subscribe_error` frame without breaking the session.
  - **DDoS & Flood Protection**: Enforced a strict 64 KB maximum payload frame check (`TOO_BIG` close code) and a sliding-window rate limiter (maximum 40 messages per 10 seconds per session).
  - **Non-Blocking Async SSE Servlet**: Replaced blocking sleep loops with Servlet 3.0 `AsyncContext` and a centralized single-thread scheduled heartbeat daemon (`CravePulse-SSE-Heartbeat`) broadcasting keepalive pings every 15s to registered clients.
  - **Order Chat Persistence & Masked Calling**: Added `V8` migration creating the `order_messages` table with audit metadata. Exposed `GET /api/orders/{id}/messages` and `POST /api/orders/{id}/messages` with 1,000 character maximum validation and WebSocket broadcast `new_chat_message`. Replaced raw customer and partner mobile numbers with virtual proxy forwarding (+91 80 4748 3333) across customer tracking and rider active job portals.

---

## ADR-007: Partner (Restaurant) Portal Architecture, Dynamic Owner Resolution, Kitchen Kanban SLA & Real SQL Analytics (Phase 6)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: The restaurant partner workspace previously hardcoded restaurant identifier `1` (`/orders/restaurant/1`, `restaurant:1`), merged fake dishes from `localStorage` (`cravepulse_custom_dishes`), displayed fabricated constant values in the analytics dashboard (`DATE_RANGE_PRESETS`), and saved sensitive partner settings (Chef profile, bank accounts, UPI IDs) to browser `localStorage` without backend persistence or masking. Kitchen kanban lacked prep time confirmations, structured rejection reasons with automatic refunds, and store open/closed/throttle database controls.
- **Decision**:
  - **Dynamic Restaurant Owner Resolution**: Added `GET /api/restaurants/my-profile` which looks up the authenticated user's restaurant in `restaurant_profiles` via `user_id` (with admin fallback to primary catalog). `PartnerLayout` resolves this profile on mount and provides `restaurant` and `refreshRestaurant` to all partner sub-routes via `<Outlet context={{ restaurant, refreshRestaurant }} />`. Eliminated all hardcoded `/restaurant/1` and `restaurant:1` references.
  - **API-Only Menu Management & Soft Delete**: Extended `menu_items` with `is_deleted`, `display_order`, `available_from`, and `available_to` columns (`V9__phase6_partner_portal.sql`). Added REST endpoints for dish creation (`POST /api/menu/item`) with URL validation, update (`POST /api/menu/item/{id}/update`), soft-delete (`POST /api/menu/item/{id}/delete`), bulk availability (`POST /api/menu/restaurant/{id}/bulk-availability`), reordering, category creation, variants, and add-ons. Purged all localStorage dish merging across the partner portal and customer view.
  - **Kitchen Kanban with SLA Countdown & Overload Protection**: Driven by WebSocket channel `restaurant:{restaurantId}` with 20s polling fallback. Plays audio alert on `new_order_placed`. Implemented modal for "Accept with Prep Time" (10–60 mins) and "Reject with Reason" (triggers automatic refund). Added live auto-reject SLA countdown timer based on configurable `auto_reject_minutes`. Added real-time store open/closed toggle (`POST /api/restaurants/{id}/toggle-open`) and overload auto-throttle toggle (`POST /api/restaurants/{id}/toggle-throttle`).
  - **Real SQL Analytics Engine**: Replaced fabricated constants with real SQL aggregations in `AnalyticsService`: all-time, today, 7-day, and 30-day summaries; cancellation count and rate; 7-day daily revenue/order volume trend; top 5 bestselling dishes from `order_items`; multi-dimensional review ratings from `reviews`; peak ordering hour calculation; and order lifecycle status gauge. Implemented empty state handling when no transactions exist.
  - **Database-Backed Settings & Masked Banking**: Added `bank_account_number`, `bank_ifsc`, `bank_beneficiary_name`, `upi_id`, and `auto_reject_minutes` to `restaurant_profiles`. Masked bank account numbers on output (`••••••••••9931`). Created `restaurant_hours` table for weekly opening/closing business schedules. Created `restaurant_payouts` table for double-entry settlement statements and UTR tracking.

---

## ADR-008: Customer Experience Parity (Dish Search Indexing, Real-Time Suggestions, 100% Tip Pass-Through, Item Customizer, and Profile Management) (Phase 7)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: Customer discovery previously matched only restaurant titles, failing searches for specific dishes or culinary items (e.g. biryani, sourdough pizza, pasta). Search inputs lacked dish suggestions and persistent recent search memory. Checkout lacked customer-controlled delivery partner tipping, structured coupon eligibility evaluation, and interactive address CRUD with Google Maps navigation links. The restaurant page lacked special cooking instructions, promotion carousel strips, verified customer reviews with multi-criteria sort, and closed-store order prevention. Profile was hard-coded with simulated names (`Jaganmohan Reddy`) and lacked OTP phone verification.
- **Decision**:
  - **SQL-Powered Cross-Dish Discovery & Suggestion API**: Enhanced `RestaurantDao.listOpenRestaurants` with an active subquery: `EXISTS (SELECT 1 FROM menu_items m WHERE m.restaurant_id = r.id AND m.is_deleted = FALSE AND (m.name LIKE ? OR m.description LIKE ?))` allowing discovery of kitchens serving specific dishes. Exposed `GET /api/restaurants/suggestions?query=...` returning top matching restaurants and dishes with direct navigation links.
  - **Customer Home & Discovery Experience**: Added recent search history (`cravepulse_recent_searches`), distance-and-open status sorting prioritizing open restaurants within delivery radius, closed store overlay, and "Outside delivery radius (>15 km)" state.
  - **Restaurant Page Parity**: Added item customization sheet with portions, add-ons, and special cooking instructions text field forwarded into the cart and order items. Added interactive promotion carousel strip with quick-copy coupons (`FOOD50`, `WELCOME100`, `FREESHIP`). Added verified customer review section with avatars and multi-criteria sort (Most Recent, Highest Rated, Lowest Rated). Prevented orders when `restaurant.isOpen === false`.
  - **Cart & Checkout Polish (360px Mobile-First)**: Added delivery captain tip selector (₹0, ₹20, ₹30, ₹50, custom) passed to `/cart/calculate` and `/orders` with 100% tip pass-through badge. Added coupon drawer with dynamic eligibility evaluation ("Add items worth ₹X more to unlock"). Added saved address picker with Google Maps link generation and address modal. Responsive down to 360px viewport without horizontal scrolling.
  - **Account & Profile Management**: Removed all hardcoded names and demo defaults. Connected profile updates to `POST /api/auth/profile` and phone verification to `POST /api/auth/verify-phone-otp`. Connected saved addresses to `GET /api/auth/addresses`, `POST /api/auth/addresses`, `DELETE /api/auth/addresses/{id}`, and `POST /api/auth/addresses/{id}/default`. Connected live wallet balance to `GET /api/wallet`.

---

## ADR-009: Admin Console Architecture (Pure SQL Platform Telemetry, Live Operations Fleet Map, User Directory Moderation, Rule-Based Dispute Auto-Approval Engine, Dynamic Settings & Immutable Audit Trail) (Phase 8)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: The admin and operations dashboard previously contained hard-coded metrics (e.g. `activeDeliveriesCount = 2`), lacked live fleet positions and order visualization, lacked a user directory with moderation capabilities, lacked document inspection for restaurant and rider partner onboarding, processed disputes without safety caps or fraud mitigation, stored operational parameters as transient values, and lacked an audit trail or data export capability for compliance.
- **Decision**:
  - **Pure SQL Platform Telemetry Engine**: Replaced all hardcoded constants in `AnalyticsService` with real-time aggregations over the active relational tables: GMV from completed payments and delivered orders, total & delivered counts, AOV (`GMV / count`), cancellation count and rate, active online riders (`is_active = TRUE`), live active deliveries (`OUT_FOR_DELIVERY`, `PICKED_UP`, `PREPARING`), average delivery duration computed dynamically using MySQL `TIMESTAMPDIFF(MINUTE, created_at, updated_at)` on `DELIVERED` orders, platform commission fee revenue from `orders.platform_fee`, total customer refunds from `wallet_transactions` (`REFUND`) and `payments` (`REFUNDED`), pending KYC verification counters for kitchens and riders, and 7-day daily volume trends.
  - **Real-Time Operations Fleet & Order Map**: Exposed `GET /api/admin/live-map` joining active orders with their assigned delivery riders, current GPS coordinates (`current_lat`, `current_lng`), customer delivery addresses, and restaurant pickup locations. The UI provides a live visual dispatch radar with automatic refreshes and order detail inspectors.
  - **User Directory Moderation & Fraud Tagging**: Added `users.fraud_flag_count` column (`V10__phase8_admin_console.sql`). Exposed `GET /api/admin/users` with substring search and role/status filtering, `POST /api/admin/users/{id}/status` for account suspension (`ACTIVE`, `SUSPENDED`) with mandatory audit logging, and `POST /api/admin/users/{id}/fraud-flag` for manual fraud risk escalation.
  - **Document Inspection & Partner Approval Dossiers**: Enhanced `ApprovalsPage` with a document modal viewer displaying partner verification dossiers (FSSAI licenses, GSTIN, kitchen addresses, commission structures for restaurants; driving licenses, vehicle registrations, national IDs for delivery riders) with direct Accept/Reject workflows backed by DB updates.
  - **Rule-Based Dispute Auto-Approval & Fraud Mitigation Engine**: In `DisputeService`, implemented safety checks governing dispute auto-approval:
    1. Order status must be strictly `DELIVERED`.
    2. Exactly one dispute per order (`disputeDao.existsForOrder`).
    3. Claim amount must not exceed the configurable platform refund cap (`platform_settings.dispute_auto_refund_cap`, default ₹150).
    4. Filing timestamp must be within the configurable post-delivery window (`platform_settings.dispute_window_hours`, default 2 hours).
    5. Clean customer profile: user must have zero fraud flags (`fraud_flag_count == 0`) and fewer than 2 disputes in the past 7 days (`countCustomerDisputesInWindow`). If claims exceed thresholds, the user's fraud flag counter is automatically incremented and the dispute is routed to the manual ops supervisor queue with an explanatory review note.
  - **Coupon CRUD & Dynamic Platform Operations Settings**: Implemented `CouponDao` with full lifecycle management (code, description, discount type, value, min order, max discount, valid window, usage limits, and first-order flag) and endpoints in `AdminServlet`. Created `platform_settings` table storing operational levers (`platform_fee`, `delivery_fee_base`, `gst_rate_percent`, `max_delivery_radius_km`, `surge_multiplier`, `cod_order_limit`, `dispute_auto_refund_cap`, `dispute_window_hours`) dynamically reloadable without application redeployment.
  - **Immutable Admin Audit Trail & CSV Export**: Created `admin_audit_logs` table (`V10__phase8_admin_console.sql`) tracking admin ID, target resource, action taken, IP address, timestamp, and metadata. Exposed `GET /api/admin/audit-logs` and direct CSV streaming export (`GET /api/admin/export?type=orders|users|disputes|audit-logs`) with RFC 4180 escaping and Content-Disposition attachment headers.

---

## ADR-010: Frontend Quality, Mobile-First Responsiveness, Component Modularization & Unified Data Layer (Phase 9)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: The front-end codebase suffered from monolithic components exceeding 1,000 lines (`RestaurantDetail.jsx` at 1,184 lines, `CheckoutPage.jsx` at 1,134 lines, `OrderTracking.jsx` at 864 lines, and `Navbar.jsx` at 745 lines), resulting in brittle state coupling, high maintenance overhead, and monolithic bundle sizes exceeding 1 MB without route splitting. Duplicate Bootstrap 5 and Bootstrap Icons CDN inclusions alongside npm imports bloated the DOM and network requests. Inconsistent error handling, missing request cancellation on unmount, and absent automated idempotent retries led to potential stale state and network failure friction. Mobile viewports (<390px) suffered from lack of a mobile bottom navigation bar, small touch targets, and potential horizontal scroll. Hardcoded persona strings and demo defaults (`Chef Lohith`, `Jaganmohan Reddy`, `Captain Prasad Rao`) leaked into production views.
- **Decision**:
  - **Single Design-Token System & Mobile-First Geometry**: Consolidated design tokens in `frontend/src/theme/design-tokens.css` (imported into `variables.css`) defining strict spacing scales (`--space-1` through `--space-16`), radius, elevations, safe-area inset pads (`env(safe-area-inset-bottom)`), and minimum 44px touch targets (`--touch-target-min: 44px`, `.touch-target`). Built `MobileBottomNav.jsx` with active route indicators and live cart badge for mobile viewports (<768px). Updated Partner, Rider, and Admin layouts with responsive offcanvas slide-out drawers and backdrop dismissals. Verified zero horizontal scroll across 360, 390, 768, 1024, and 1440 px viewports.
  - **Component Modularization**: Split monolithic components into focused single-responsibility subcomponents and custom hooks:
    - `Navbar.jsx`: decomposed into `NavSearchAutocomplete`, `NavLocationModal`, `NavNotificationsDropdown`, `NavUserDropdown`, and `NavMobileDrawer`.
    - `RestaurantDetail.jsx`: decomposed into `useRestaurantDetail` hook, `RestaurantHeader` (with semantic breadcrumbs and price parity badge), `RestaurantOffersStrip`, `RestaurantCategoryNav`, `DishCard`, `ItemCustomizerModal`, and `RestaurantReviews`.
    - `CheckoutPage.jsx`: decomposed into `useCheckout` hook, `CheckoutAddressSection`, `CheckoutOrderSummary`, `CheckoutTipSelector` (with 100% tip pass-through badge), `CheckoutBillDetails`, `CheckoutPaymentMethods`, and `CheckoutCouponDrawer`.
    - `OrderTracking.jsx`: decomposed into `useOrderTracking` hook, `TrackingTimeline` (`aria-live="polite"`), `TrackingRiderCard` (with masked call and OTP card), `TrackingCancelModal`, `TrackingChatModal`, and `TrackingReviewModal`.
  - **Unified Data Layer & Resilient Axios Client**: Upgraded `frontend/src/services/api.js` with typed `ApiError`, request cancellation helpers (`createCancelSource`, `isCancel`), exponential backoff retry on idempotent GET/HEAD requests (up to 2 retries on network or 502/503/504 errors), and concurrency-safe token refresh queues. Implemented reusable `useApi` hook with automatic unmount abort signaling. Removed duplicate CDN links from `index.html`.
  - **Route-Level Code Splitting & Resilience**: Refactored `App.jsx` to load all portal pages via `React.lazy` wrapped in `<Suspense fallback={<LoadingState />}>` and `<ErrorBoundary>`. Registered custom `NotFound.jsx` (404) page with search quick-jumps. Reduced production bundle size by 64% (from 1,067 kB down to 385 kB for the main chunk).
  - **Accessibility & Complete Elimination of Hardcoded Personas**: Replaced all hardcoded persona names and demo defaults across all client pages with live authenticated user session attributes, dynamic captain assignments, and realistic platform contact defaults. Standardized loading (`LoadingState`), empty (`EmptyState`), and error states (`ErrorState`) with `aria-live` polite announcements and WCAG AA contrast compliance.

---

## ADR-011: Database Architecture, Hardening, Strict Schema Constraints, Retention & Demo Seed (Phase 10)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: The database layer previously lacked dedicated schemas for support tickets, favorites, coupon usage audit ledgers, dedicated payment refunds, rider KYC documents, distributed idempotency keys, and geofenced delivery zones. Foreign key definitions in initial migrations allowed unintentional cascade deletions on crucial financial ledgers, payments, and dispatches. Monetary columns lacked database-level and model-level non-negative CHECK constraints. Rider telemetry logs (`rider_location_logs`) grew unboundedly without a retention or purge rule. Demo data was previously mixed into production migration scripts.
- **Decision**:
  - **Schema Hardening Migration (`V11__phase10_database_hardening.sql`)**:
    - Created tables: `favorites` (customer bookmarks), `support_tickets` (customer/kitchen ticketing), `coupon_usages` (per-user claim prevention ledger), `audit_logs` (platform entity mutations), `payment_refunds` (formal refund tracking ledger), `rider_documents` (KYC compliance), `idempotency_keys` (distributed request deduplication with TTLs), and `delivery_zones` (city geofences and zone surges).
    - Added composite query performance indexes: `idx_orders_cust_created` (`orders(customer_id, created_at)`), `idx_dispatch_status_offered` (`delivery_dispatches(dispatch_status, offered_at)`), and `idx_notif_user_read_created` (`notifications(user_id, is_read, created_at)`).
    - MySQL 8.0 `CHECK` constraints on all monetary columns across `orders`, `payments`, `users`, `wallet_transactions`, `menu_items`, and `rider_profiles`.
    - Eliminated cascade deletions on `payments`, `wallet_transactions`, `delivery_dispatches`, and `order_events` by dropping and re-adding foreign keys with strict `ON DELETE RESTRICT` semantics.
  - **In-Code Monetary Validation**: Enforced non-negative monetary checks in Java models (`Order`, `User`, `Payment`, `WalletTransaction`, `RiderProfile`, `MenuItem`) throwing `IllegalArgumentException` on negative values.
  - **Telemetry Retention Policy**: Created `RetentionService` with automated single-threaded scheduler executing 7-day location log purge (`riderDao.purgeOldLocationLogs(7)`).
  - **Multi-City Demo Seed (`seed-demo.sql`)**: Generated separate demo script spanning 3 cities (Bangalore, Hyderabad, Mumbai), 27 authentic kitchens, complete menus with transparent dine-in/platform pricing, delivery riders, coupons, and historical multi-status orders. Passwords safely hashed (`Password@123`) and omitted from public tables.

---

## ADR-012: Comprehensive Testing, CI/CD Pipeline & Full Observability (Phase 11)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: The platform lacked automated CI/CD pipeline automation for builds, security audits, and secrets scanning. Frontend unit and component testing was absent, lacking test coverage for the cart reducer, checkout validation logic, and role-based protected routes. Observability lacked correlated request tracking (`X-Request-ID`), health/readiness probes (/health, /ready), and real-time operations telemetry counters.
- **Decision**:
  - **Backend Concurrency & Idempotency Depth Tests**: Created `ConcurrencyAndIdempotencyDepthTest` verifying:
    1. Pessimistic lock `FOR UPDATE` preventing two riders from concurrently claiming the same dispatch offer.
    2. Strict database idempotency rejecting duplicate order submissions with identical `idempotency_key` via unique constraints.
    3. Expanded backend depth suite to 75 automated unit and servlet-level integration tests covering pricing, state machines, payment webhooks, refunds, auth matrix, and telemetry retention.
  - **Frontend Testing Suite (Vitest & Playwright)**: Configured Vitest (`npm test`) with 13 automated unit tests across `cartReducer.test.js`, `checkoutValidation.test.js`, and `protectedRoutes.test.js`. Implemented 4 Playwright end-to-end user journey specs in `frontend/e2e/` covering customer discovery/ordering, partner kitchen kanban, rider trip execution, and admin operations.
  - **Automated GitHub Actions CI Workflow**: Established `.github/workflows/ci.yml` with dual parallel jobs for backend Maven test/package with MySQL 8 service container, frontend Node 20 build/test/audit, and Gitleaks secrets detection.
  - **Full Platform Observability**:
    - Request correlation: Implemented `RequestIdFilter` generating/propagating `X-Request-ID` and injecting it into SLF4J MDC (`%X{requestId}`) for end-to-end log traceability.
    - Liveness & Readiness: Created `HealthObservabilityServlet` serving `/health` (liveness), `/ready` (DB ping & JVM memory probe), and `/metrics`.

---

## ADR-013: Documentation Realignment, Truthful Quick Start & Security Protocols (Phase 12)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: Project documentation previously contained discrepancies regarding startup commands, architecture diagrams, demo accounts, and feature completeness. In addition, secrets rotation procedures, vulnerability disclosure policies, and observability API contracts were undocumented.
- **Decision**:
  - **Truthful README Architecture & Quick Start**: Fully rewrote `README.md` to reflect the single-command startup workflow, embedded Tomcat runner, React + Vite frontend, and automatic forward database schema migrations (`V1` through `V11`).
  - **Accurate Feature Status Matrix**: Documented an honest, granular matrix of Done / Partial / Planned features across all platform domains (Customer Discovery, Cart/Pricing, Order Lifecycle, Partner Kitchen, Dispatch & Riders, Admin & Finance, Telemetry, and Testing).
  - **Security Policy & Secret Rotation Protocols (`SECURITY.md`)**: Formulated security reporting procedures and standard operating procedures (SOPs) for zero-downtime secret rotation covering `JWT_SECRET`, MySQL credentials, Stripe webhook signing keys, Razorpay secret keys, and Resend transactional email API keys.
  - **API Reference Synchronization (`docs/API.md`)**: Documented Section 13 covering platform observability endpoints (`/health`, `/ready`, `/metrics`), request correlation (`X-Request-ID`), and transactional idempotency (`Idempotency-Key`).
  - **Master Prompt Alignment**: Reconciled and validated all Phase 10–12 deliverables and 10 acceptance criteria in `docs/MASTER_PROMPT.md`.
