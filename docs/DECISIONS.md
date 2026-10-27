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
