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
