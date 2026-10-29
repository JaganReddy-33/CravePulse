# Remediation status - 30 October 2026

The findings below describe the original audit before implementation. They are retained as historical evidence, not the current application status.

The requested code changes are now implemented: API-backed account/catalog/support data, server pricing and payment safeguards, ownership checks, migration V13-V18, real rider telemetry and delivery flow, cookie refresh authentication, responsive visual refresh, and removal of active fake data paths. TiDB authentication succeeded; sample data was backed up and cleared; the requested genuine administrator was created. All 18 migrations are applied.

Verification: 20 frontend tests and 34 selected backend tests passed; live HTTP flows passed against the isolated test database. See [REAL_DATA_SETUP.md](REAL_DATA_SETUP.md) for current commands, database state, coverage, and remaining provider limitations, and [API_VERIFICATION_RESULTS.json](API_VERIFICATION_RESULTS.json) for the latest API checks. This work does not certify all historical tests or every production integration.

---

# CravePulse application audit — 29 October 2026

Verdict: REQUEST CHANGES before using real customers, money, or fresh production data.

This is a repository audit with a frontend production build and frontend unit tests. Database authentication failed, so database contents, successful migrations, endpoint responses, and complete customer/partner/rider/admin journeys have NOT been verified live. No data was deliberately deleted, no reset was executed, and no application source was changed. This report does not certify every file or endpoint as correct. Responsive observations below are source findings, not screenshot-based verification.

## Verified checks and limitations

- `frontend`: `npm run build` passed; `npm test` passed (4 files, 16 tests).
- `backend`: `mvn test` compiled existing sources but database-backed tests encountered TiDB's “Missing user name prefix” authentication error. The run was interrupted. There is no successful backend test verdict.
- Important test isolation problem: backend tests load normal application configuration and some call migrations and write database records. Configure a separate disposable test database before running them again. Do not point tests at a live database.
- Frontend tests provide limited assurance: checkoutValidation.test.js defines and tests its own validation and bill functions; scrollCarousel.test.jsx tests arithmetic without rendering the component. Passing these tests does not prove the checkout or carousel works.
- Browser layout and authenticated end-to-end tests were not run. The Playwright config/specs import `@playwright/test`, which is absent from frontend/package.json. The config also assumes a server is already running.

## High priority findings

| Priority | Location | Problem and required correction |
|---|---|---|
| P1 | backend/.../config/DatabaseMigrationRunner.java | Only V1–V11 are listed. V12 jobs tables are not automatically created. Register V12 and verify both tables. |
| P1 | backend/.../ServerMain.java | JobServlet is absent from explicit servlet registrations. This uses `tomcat.addContext`, not normal webapp annotation discovery. Register `/api/jobs` and `/api/jobs/*` explicitly like other servlets. Careers and admin jobs cannot be considered wired merely because JobServlet exists. |
| P1 | backend/.../config/DatabaseMigrationRunner.java | Statement errors are swallowed and the migration is subsequently recorded as applied. Missing files also return without failure. Startup continues after migration failure. Propagate failures, stop startup, record only success, add checksums and migration locking; inspect schema before repairing existing history. |
| P1 | db/migration/V1__init.sql | Begins by dropping application tables. Removing migration history or manually replaying V1 on an existing database can destroy data. Never rerun V1 as a repair procedure. |
| P1 | db/migration/V4, V5, V7 | Use `ADD COLUMN IF NOT EXISTS`, outside the documented MySQL 8.0 ADD COLUMN syntax. TiDB compatibility must be tested separately. Use supported DDL or metadata checks; do not assume MySQL and TiDB execute these scripts identically. |
| P1 | backend/.../service/RazorpayGatewayClient.java | createOrder and createRefund manufacture successful-looking responses after real HTTP failures or exceptions. A declined/failed refund can look processed without money moving. Fail closed, preserve pending/failed states, and reconcile with the provider. |
| P1 | backend/.../service/RazorpayGatewayClient.java | Demo configuration accepts the literal `simulated_valid_sig` instead of a verified gateway signature. Remove this path from real-data deployments and isolate test doubles in test code. |
| P1 | backend/.../config/AppProperties.java | Missing/short JWT secrets fall back to a public hardcoded signing secret. Fail startup instead. Missing payment credentials also select demo defaults. Require explicit real configuration. |
| P1 | frontend/src/hooks/useCheckout.js | Initializes three invented addresses. Empty or failed address fetches leave these selectable. Failed address saves create Date.now IDs and show them as usable. Start empty, require successful server saves, and block checkout without a persisted address. |
| P1 | frontend/src/hooks/useCheckout.js | Payment confirmation exceptions are caught but still followed by confetti, cart clearing, and `paymentSuccess=true`. Only show confirmed success after a successful backend response; retain the cart and provide pending/retry UI otherwise. Also handle a missing Razorpay SDK explicitly. |
| P1 | frontend/src/pages/rider/RiderEarnings.jsx | Instant payout only uses a timer, deducts React state, and invents an IMPS reference. No actual withdrawal request is made in that handler. Implement a server-owned withdrawal ledger and provider integration before enabling it. |
| P1 | frontend/src/pages/customer/ContactPage.jsx | Submit generates a random ticket number after a timer. No support submission is persisted. Add a validated support endpoint and display its returned ticket number. |
| P1 | frontend/src/pages/customer/JobDetailPage.jsx | Sends `resumeFilename: resumeFile.name`, not the file bytes, while claiming the resume entered recruitment. Implement upload/storage/download authorization or remove the attachment claim and require a real resume URL. |
| P1 | backend/.../servlet/NotificationServlet.java; service/NotificationService.java; daoImpl/WalletDaoImpl.java | Mark-read updates by notification ID alone, without user ownership. An authenticated caller can target another user's notification. Pass authenticated user ID through the service and use `WHERE id = ? AND user_id = ?`. |
| P1 | docs/clear_sample_data.sql | Reset misses dependent tables and retains coupons. With FK checks disabled it can leave orphaned records referencing reused IDs. It also refers to nonexistent Flyway history rather than the actual `schema_migrations`. Do not use unchanged. |

MySQL syntax reference: https://dev.mysql.com/doc/refman/8.0/en/alter-table.html

MySQL syntax reference: https://dev.mysql.com/doc/refman/8.0/en/alter-table.html

## Other correctness and integration issues

- `frontend/src/services/api.js`: normal requests honor VITE_API_URL; refresh hardcodes `/api/auth/refresh`. Separate frontend/backend deployments can send refresh to the wrong origin. Build refresh URL from the same API configuration and keep the refresh client separate to avoid interceptor recursion.
- `frontend/src/pages/admin/AdminAuditLogs.jsx`: CSV export reads `token`, but authentication stores `accessToken`. It opens a URL with a query token, while JwtAuthFilter reads the Authorization header. Download through an authenticated Blob request using the API base URL. Do not put access tokens in URLs.
- `frontend/src/context/RealtimeContext.jsx`: invented welcome notification; unscoped browser notification cache; empty server results do not replace stale notifications; logout does not reset that state. Clear notifications on identity changes, accept empty results, fetch server notifications, and persist clearing with the existing DELETE endpoint. Locally manufactured order-update IDs cannot safely be used as database notification IDs.
- `frontend/src/pages/rider/RiderProfile.jsx`: writes browser profile values first, swallows profile API failures, then always shows saved. Name, phone and avatar are not in its rider profile request. Persist each field through the correct authenticated endpoint, then refresh canonical profile state. Its insurance “download” is just a timer and alert.
- `frontend/src/pages/rider/RiderLayout.jsx`: fallback avatar and specific vehicle registration are invented identity data. Use a neutral avatar and “vehicle not added”.
- `frontend/src/pages/rider/RiderEarnings.jsx`: todayEarned and weekEarned both sum all returned credits without date filtering. Use server aggregates with defined timezone and period; fixed targets and bank account lists also need real configuration.
- `frontend/src/components/UpiPaymentDrawer.jsx`: timer-driven payment success, hardcoded payee/order defaults, no confirmation. There are no imports of this component in current src, so this is a dormant component rather than a verified active checkout path. Remove or replace before wiring it in.
- `frontend/src/components/SettlementLedger.jsx`: hardcoded financial splits, bank details and timer-driven “disbursement”. No src imports found. Do not use as a real settlement ledger.
- `backend/.../service/AuthService.java`: customer registration substitutes a fixed phone when omitted; rider onboarding seeds Bangalore coordinates. Missing contact/location should remain missing and not look verified.

## Migrations: what each does

Folder is `backend/src/main/resources/db/migration`, singular, not db/migrate.

| Version | Purpose | Fresh-data concern |
|---|---|---|
| V1 | Core schema | Destructive DROP statements; only safe for a new/disposable database. |
| V2 | Demo users, restaurants, menus, orders, reviews, notifications, etc.; platform settings too | Not optional in current runner. Settings must be separated from sample business data. |
| V3 | Delivery OTP and event actor role | Schema change. |
| V4 | Wallet/payment enum, refund columns, webhook ledger | Check MySQL syntax. |
| V5 | Catalog columns, parity proofs, coupon usages, notifications | Invented GST/locality/rating defaults; check MySQL syntax and repeated table definitions. |
| V6 | Large Bangalore catalog | Automatically inserts sample restaurants/menu content and parity records. |
| V7 | Dispatch milestones, tips, rider cash and COD ledger | Check MySQL syntax. |
| V8 | Order messages | Schema change. |
| V9 | Partner schema, hours and payout ledger | Payout status defaults to PAID: review before using for real payout creation. |
| V10 | Fraud flag, tip/coupon columns, admin audit, operational settings | Repeats columns introduced earlier. Preserve settings during cleanup. |
| V11 | Favorites, support, audit, refunds, documents, idempotency and zones; hardening | `CREATE TABLE IF NOT EXISTS coupon_usages` does not upgrade V5's existing definition: V11's discount column, unique key and restrictive order relationship are not installed by that CREATE. Apply explicit forward ALTERs. |
| V12 | Jobs and applications | Exists on disk but is absent from runner. |

The project uses a custom runner, not Flyway. Tracking is `schema_migrations(version, description, applied_at)`. There are no checksums or automatic resource discovery. Do not use Flyway repair commands here.

## Starting with fresh real data

Preferred path: keep the existing database as a backup/reference and create a separate empty database. First fix the runner, register V12 and JobServlet, and split sample seeds from required platform configuration. A new database with the current code WILL receive demo data from V2/V6.

Do not delete V2/V6 from deployed migration history or change already-applied migrations in place. For an established deployment, preserve historical files and use forward migrations. Design a separate, explicit clean-install baseline or a supported seed-exclusion mode that still installs required configuration. Verify that baseline on the chosen MySQL/TiDB version.

If retaining the current schema and clearing ALL business data instead, stop the backend and background workers, export a backup, verify database identity and schema health, then use a reviewed reset covering the tables below. This deletes real data too; the schema contains no reliable universal flag distinguishing fake and real records. No reset has been executed as part of this audit.

Existing cleanup must additionally cover:

`favorites`, `support_tickets`, `coupon_usages`, `audit_logs`, `payment_refunds`, `payment_webhook_events`, `rider_documents`, `idempotency_keys`, `price_parity_proofs`, `restaurant_hours`, `restaurant_payouts`, `rider_cod_settlements`, and `coupons`.

Inspect `delivery_zones` and reset/reconfigure any sample zones. Preserve `platform_settings` only after reviewing its values; preserve `schema_migrations`. Do not reset migration history after clearing rows, or seeds and destructive schema SQL can replay. Missing V12 tables need migration repair before any reset script assumes they exist. Re-enabling FK checks is not a substitute for verifying orphan-free data.

Deleting all users also deletes the administrator needed to approve onboarding. Public registration intentionally creates CUSTOMER only. Provision one genuine administrator through a controlled bootstrap using BCrypt, or retain a verified real administrator while performing an FK-aware targeted cleanup. Do not enable public ADMIN signup and do not copy the demo admin password.

Fresh-data acceptance criteria: no demo users/catalog/orders/coupons/reviews/payouts; approved real admin; correct platform settings and zones; customer sees an empty catalog until real partners/menus are approved; addresses empty until saved; no payment success without verification.

## Running locally

After the database/migration fixes above, configure `backend/src/main/resources/application.properties` from its example, or environment variables. Code uses `db.user` / `DB_USER`, not README's `db.username`. For TiDB use the complete cluster username required by that deployment and its TLS connection configuration. Do not expose credentials in logs or commit them.

Backend (PowerShell, repository root):

```powershell
Set-Location C:\TAP_ACADEMY_DEV\CravePulse\backend
mvn package -DskipTests
java -jar target/food-delivery-backend.jar
```

Default code port is 8081; environment variable is `PORT`, not README's `SERVER_PORT`. Vite proxies API/WebSocket to 8081. If changing ports, update both.

Frontend in another terminal:

```powershell
Set-Location C:\TAP_ACADEMY_DEV\CravePulse\frontend
npm ci
npm run dev
```

Open http://localhost:5173. Do not run either `scripts/seed-demo.sql` or `backend/src/main/resources/db/seed-demo.sql` for the real-data setup.

Current runner applies its listed migrations at backend startup in numeric order. It does NOT apply “all files in the folder.” Until repaired, startup is not evidence of schema success. Inspect read-only:

```sql
SELECT DATABASE(), VERSION();
SELECT version, description, applied_at FROM schema_migrations ORDER BY applied_at;
SHOW TABLES;
SHOW CREATE TABLE coupon_usages;
SHOW CREATE TABLE job_postings;
SHOW CREATE TABLE job_applications;
```

Do not manually execute all SQL files against the current database. A manual SQL run also does not automatically populate this runner's tracking table.

## Browser storage inventory and replacement

| Keys | Current purpose | Required real-data behavior |
|---|---|---|
| accessToken, refreshToken, user | Authentication and cached identity | These are session data, not sample records. For zero localStorage, move authentication to a designed secure cookie/session approach with backend and cross-origin handling. Never just remove token reads without replacing auth. |
| cart | Persistent browser cart | Move to a user-owned server cart API and database; revalidate prices/availability on the server. Decide anonymous-cart behavior explicitly. |
| cravepulse_favs | Customer favorites | Use user-scoped endpoints and existing favorites table. |
| cravepulse_notifications | Notification cache and fake welcome | Fetch server state, persist read/clear operations; remove fake welcome and unscoped cache. |
| cravepulse_rider_name, cravepulse_rider_phone, cravepulse_rider_avatar, cravepulse_rider_vehicle | Browser overrides of rider identity/profile | Replace with validated profile APIs and real upload storage. |
| cravepulse_hub | Selected/detected locality | Treat as preference or fetch user selection from backend; do not represent fallback Bangalore data as detected location. |
| cravepulse_recent_searches | Search history | Use an optional user-owned history endpoint or in-memory history for no browser persistence. |

To clear only these current app keys, run in browser DevTools for the application's origin (this logs you out and clears the browser cart):

```javascript
['accessToken', 'refreshToken', 'user', 'cart', 'cravepulse_favs',
 'cravepulse_notifications', 'cravepulse_rider_name', 'cravepulse_rider_phone',
 'cravepulse_rider_avatar', 'cravepulse_rider_vehicle', 'cravepulse_hub',
 'cravepulse_recent_searches'].forEach(key => localStorage.removeItem(key));
location.reload();
```

Repeat per origin/browser as needed; localhost, 127.0.0.1, deployed domains and different ports have separate storage. This clears neither the database nor hardcoded component defaults. Fake defaults will reappear until the code is corrected.

## Unused/duplicate candidates

- No src consumers found for `components/UpiPaymentDrawer.jsx`, `components/SettlementLedger.jsx`, or `hooks/useApi.js`. They are cleanup candidates; verify references outside src before deleting.
- `scripts/seed-demo.sql` and `backend/src/main/resources/db/seed-demo.sql` have identical SHA256 hashes. Keep one explicit development-only source if demo fixtures are still needed.
- Generators `db/generate_catalog.py` and `db/generate_seed_demo.py` are tooling, not automatically unused merely because frontend code does not import them. Keep outside production artifacts if only used to generate fixtures.
- Do not delete migrations as “unused files”. They are database history, including V12 which is currently unwired.

## Responsiveness, styling and layout

Existing responsive table/carousel primitives and route splitting are useful. Full browser coverage is still required before claiming responsiveness is correct.

- Global `overflow-x: hidden` in App.css/design-tokens can conceal clipped content. Test control visibility and element bounding boxes, not only document scrollWidth.
- visual-layout.spec.js checks mostly discovery and conditionally skips carousel assertions when elements are absent. Expand coverage to checkout, empty catalog, address modal, mobile navigation, all portal tables, Kanban, job forms and payment/error states; require expected elements.
- Test 320/360/390/768/1024/1440px, long real restaurant/dish names, zoom, keyboard navigation, modal scrolling and soft-keyboard behavior. Avoid substituting invented records to fill empty layouts.
- Standardize spacing/type/button utilities. Classes such as `p-3.5`, `gap-2.5`, and `px-2.5` are not standard Bootstrap utilities; define intended custom utilities or replace with supported ones after verifying actual computed styles.
- Use neutral placeholders for missing photos and clear empty/error/retry states. Do not display fictional insurance, bank details, registration numbers, ratings, location detection or “verified” claims.
- Reduce repeated inline styling after correctness fixes; keep customer and operational portal themes consistent with tokens and accessible focus/contrast. Measure rendering/bundle cost before optimizing; production CSS currently totals about 344 KB uncompressed including framework styles.

## Recommended implementation order

1. Separate test DB; repair migration execution/history and database compatibility; register jobs.
2. Remove simulated financial successes and require verified payment/refund/payout transitions; remove secret fallbacks.
3. Replace fake addresses, contact tickets, profile saves and resume upload claims with real persistence and honest errors.
4. Implement server carts/favorites/history and notification ownership; replace localStorage authentication if zero local persistence is required.
5. Verify a clean schema and real-admin bootstrap, perform the chosen data reset, then clear browser keys.
6. Run live endpoint authorization/error checks and full customer → kitchen → rider → completion/refund flows on a disposable database; complete multi-viewport UI testing.