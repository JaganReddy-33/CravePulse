# Real data setup and remediation - 30 October 2026

## Current database state

TiDB authentication succeeded with the updated local configuration. Before deletion, all 74 existing users matched seed SQL accounts; no unknown account was found. Business data was backed up, then removed with foreign keys enabled and dependent tables deleted in order inside a transaction.

Private backups are `.local-backups/database-1793295549285.sql` and `.local-backups/database-1793296412092.sql`. They contain sensitive historical data: keep them private. Do not restore either into the application database unless deliberately reverting the reset.

A fresh inspection confirmed: 1 user (the requested administrator), 18 migration records, 13 platform settings, and zero restaurants, menu items, categories, orders, dispatches, payments, coupons, reviews, support tickets, or saved addresses. Administrator sessions and preferences produced by verification are genuine records, not catalog fixtures. Auto-increment IDs were deliberately retained.

Administrator: Jaganmohan Reddy, `ragipalyamjaganmohanreddy@gmail.com`. The temporary password is stored only in the ignored `.local-backups/admin-login.txt`. Sign in at `/admin/login`, then use Settings to change it. Password changes revoke refresh sessions.

## Configuration and startup

Keep the existing ignored `backend/src/main/resources/application.properties`. For a different installation, copy `application.properties.example` first, set the complete TiDB cluster username/password and SSL JDBC URL, and generate a unique JWT secret of at least 32 bytes. Environment variables `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `PORT`, and `CORS_ORIGINS` can override configuration. Never commit credentials.

Build from repository root:

```powershell
mvn -f backend/pom.xml package -DskipTests '-Dcravepulse.build.directory=target-verified'
java -jar backend/target-verified/food-delivery-backend.jar
```

The separate build directory prevents IDE incremental compilation from changing packaged runtime classes. Stop a running JVM before replacing its jar; alternatively run a private snapshot copy as this verification session does.

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Use `http://127.0.0.1:5173` consistently. Frontend `.env`: `VITE_API_URL=/api`, `VITE_WS_URL=`. Development uses the configured proxy to port 8081. Production must provide API/WebSocket routing and correct allowed origins. Refresh authentication uses an HttpOnly cookie; cross-origin production deployments require HTTPS and compatible cookie/CORS settings. Access tokens stay in memory.

## Migrations

SQL lives in `backend/src/main/resources/db/migration`. Startup applies V1 through V18 automatically, once, using `schema_migrations`. New entries record checksums. Missing/invalid scripts and changed checksums stop startup. Existing schema migration history must be retained.

For migrations without starting HTTP, run from repository root after building:

```powershell
java --class-path backend/target-verified/food-delivery-backend.jar scripts/MigrateDatabase.java
```

Do not execute every SQL file manually. V1 historically contains destructive reset statements and V2/V6 contain fixtures. The runner suppresses historical destructive initialization statements, retains only required V2 platform configuration, and skips V6 catalog fixtures. This preserves historical files while preventing new installations from repopulating fake data. Never run seed-demo.sql against this database.

Forward migrations V13-V18 add API account state and integrity rules, remove invented catalog/identity defaults, allow absent photography/cost estimates, and support completed dispatch state. Applied SQL must not be edited; add a new migration for subsequent changes.

## Database maintenance

Read-only inspection and a new private backup, from repository root:

```powershell
java --class-path backend/target-verified/food-delivery-backend.jar scripts/DatabaseMaintenance.java inspect
java --class-path backend/target-verified/food-delivery-backend.jar scripts/DatabaseMaintenance.java backup
```

The requested sample cleanup is already complete. The `clear-fixtures` utility requires an exact database name and nonempty backup, and refuses deletion when any non-fixture user exists. It therefore deliberately refuses a second reset now that the real administrator exists. It deletes all business records, not selected sample rows, when its guards pass. Do not bypass these guards or use the historical seed/reset scripts. `docs/clear_sample_data.sql` now contains inspection guidance only.

For a separate empty installation, after migrations, `bootstrap-admin` accepts an email and display name and writes a generated credential to `.local-backups/admin-login.txt`. It must not be rerun for the existing administrator.

## Add genuine operating data

1. Sign in as administrator and add real delivery zones in `/admin/service-areas`, including actual coordinates and radius. Review platform fee/dispatch settings.
2. Register genuine restaurant partners with real addresses/coordinates, complete the administrative approval flow, and add real menu categories, items, variants, prices, and optional images. Add real offers only when intended.
3. Register and approve genuine riders with actual vehicle details. Device geolocation supplies telemetry; permissions and HTTPS are required outside localhost.
4. Customers register, save real delivery addresses and coordinates, and place orders. The server quotes prices, validates cart contents, and persists orders. Empty listings are expected until actual partners publish their menus.
5. Careers and support data are entered and read through their APIs/admin pages. Resume submissions require a reachable HTTPS resume URL rather than pretending a filename is an uploaded document.

## Browser storage and honest behavior

Business records, cart contents, favorites, support tickets, notifications, preferences, orders, and profiles use authenticated APIs and database persistence. Guests have a transient in-memory cart. Access tokens are held in memory; refresh tokens use HttpOnly cookies. The only remaining localStorage access removes legacy application keys at startup. No localStorage or sessionStorage values supply business data.

Removed fabricated coupons, addresses, credentials, identities, GPS movement, payment/refund successes, default ratings and distance/cost claims. Neutral placeholders remain for missing optional photography. UI timers now serve interaction, debounce, retry, or animation behavior rather than manufacturing business records.

## Verification

- Frontend: 20 tests across 6 files passed; production build passed.
- Backend: 34 selected tests passed: RealDataSafetyTest, OrderPricingDepthTest, AuthServiceTest, PricingEngineTest, OrderStateMachineTest, RealtimeSecurityDepthTest, SecurityAuthMatrixTest.
- Live API verification passed 74 checks using a separate `cravepulse_test` database and generated test accounts. It exercises authentication/refresh/logout, isolation, support, service areas, jobs, partner onboarding/menu, pricing, COD checkout, chat, cancellation, rider dispatch/pickup/PIN delivery, reviews, and wallet credit. Results are in `API_VERIFICATION_RESULTS.json`. Generated test data was cleared afterward.
- Browser verification passed all 5 tests: 10 public pages at widths 320, 375, 768, and 1440, administrator cookie refresh without browser-stored credentials, and 9 actual administrator routes at 375 and 1440. It asserts the authenticated portal exists to avoid counting redirected login screens as coverage. Settled screenshots are in `docs/screenshots`.
- Frontend npm dependency audit reported zero vulnerabilities at verification time. Backend dependencies were not comprehensively security certified.

Selected backend test command:

```powershell
mvn -f backend/pom.xml test '-Dcravepulse.build.directory=target-unit' '-Dtest=RealDataSafetyTest,OrderPricingDepthTest,AuthServiceTest,PricingEngineTest,OrderStateMachineTest,RealtimeSecurityDepthTest,SecurityAuthMatrixTest'
```

Live API checks, from repository root, require an existing disposable database named `cravepulse_test` on the configured TiDB server. `DatabaseMaintenance.java create-test` creates it when the database account has permission. It must never contain real user data.

```powershell
$env:CLEAR_TEST_DATA='1'
python scripts/verify_api.py
```

The script starts its own port-8082 backend with an isolated JWT secret, snapshots the built jar, promotes only its generated test administrator, and terminates the server afterward. Other database-backed Maven tests require explicit `TEST_DB_URL` ending in `cravepulse_test`, `TEST_DB_USER`, and `TEST_DB_PASSWORD`; they refuse the normal application database. The complete historical test suite has not been certified and some tests still assume legacy fixtures.

Browser tests with frontend/backend already running:

```powershell
cd frontend
npx playwright install chromium
npx playwright test e2e/real-data-layout.spec.js --project='Desktop Chrome' --reporter=line
```

Alternatively set `CHROME_PATH` to an installed Chrome executable. The local administrator test reads the ignored credential file silently; trace recording is disabled for this spec.

## Remaining integration limits

Razorpay requires real merchant credentials and webhook secret, followed by sandbox and merchant verification. Missing credentials or gateway failures do not create fake paid orders/refunds. COD is the default checkout option. Bank payout execution and SMS OTP delivery require real providers; unavailable actions are explicit and settlement requests require review. Device permissions, external map tiles, real gateway behavior, production hosting, email delivery, operational policies, accessibility beyond the tested interactions, and every possible endpoint/input combination have not been certified by these checks.
