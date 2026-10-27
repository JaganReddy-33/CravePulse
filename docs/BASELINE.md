# CravePulse – Phase 0 Baseline Audit Report

**Date:** 2026-10-27  
**Auditor:** Principal Full-Stack Engineer & Security Reviewer  
**Context:** Master Prompt Phase 0 Baseline execution prior to systemic refactoring.

---

## 1. Initial Build & Test State

### Backend (`backend/`)
- **Framework & Runtime:** Java 17, Jakarta Servlets 6.0, Embedded Tomcat 10.1.24, HikariCP, MySQL Connector/J 8.3.0.
- **Packaging:** `war` (via `maven-war-plugin`), with `exec-maven-plugin` executing `com.foodplatform.ServerMain`.
- **Compile Status:** `mvn compile` succeeds with 72 source files compiled cleanly.
- **Test Results (`mvn clean test`):**
  - **Total Tests Run:** 7
  - **Passed:** 6
  - **Failures:** 1 (`PricingEngineTest.testCalculateBillWithPriceParity`)
  - **Failure Reason:** `org.opentest4j.AssertionFailedError: expected: <5.0> but was: <5.00>`.
    - Cause: `assertEquals(BigDecimal.valueOf(5.00), result.platformFee)` evaluates `BigDecimal.valueOf(double)` with scale 1 (`5.0`) against a scale 2 `BigDecimal` (`5.00`). In Java, `BigDecimal.equals` requires identical scale and numerical value.

### Frontend (`frontend/`)
- **Framework & Runtime:** React 18.3.1, Vite 5.4.2, React Router 6.26.2, Axios, Bootstrap 5.3.3, Leaflet 1.9.4.
- **Build Status (`npm run build`):** Succeeded.
  - Output: 153 modules transformed into `dist/`.
  - Bundle size: `dist/assets/index-I20Tc_-e.js` (901 kB / gzip: 240 kB).
- **Test Scripts:** Not yet configured in `package.json` (scheduled for Phase 11).

---

## 2. Docker & Infrastructure Audit

### `docker-compose.yml` Issues
1. **Invalid MySQL Environment Config:**
   - Line 11: `MYSQL_USER: ${DB_USER:-root}`. Official `mysql:8.0` images fail or emit warnings when `MYSQL_USER` is set to `root` (root user is controlled solely by `MYSQL_ROOT_PASSWORD`).
2. **Port Inconsistencies:**
   - Docker config mapped `8080:8080` while local embedded Tomcat in `ServerMain.java` defaults to `8081`.
   - Frontend Docker service mapped `5173:80` with depends-on backend, but lacked standardized environment variable injection.

### `backend/Dockerfile` Issues
1. **Broken Artifact Packaging & CMD:**
   - Line 12 copies `/app/target/food-delivery-backend-1.0.0.war` into `./app.war`. However, `pom.xml` configured `<finalName>api</finalName>`, producing `target/api.war`.
   - Line 17 runs `CMD ["java", "-cp", "app.war", "com.foodplatform.ServerMain"]`. Since WAR archives package classes in `WEB-INF/classes`, `java -cp` cannot locate `com.foodplatform.ServerMain` directly without extracting or creating a self-contained fat JAR (via Maven Shade Plugin or Maven Assembly Plugin).

---

## 3. Repository Hygiene & Git Cleanliness Audit

### Unwanted Artifacts Present in Clean Working Tree:
- `.metadata/` (Eclipse IDE workspace metadata directory)
- `Servers/` (Eclipse Server adapters and Tomcat server runtimes)
- `backend/bin/` (Eclipse IDE class output directory)
- `backend/tomcat.8081/` (Local Tomcat embedded work / temp directories)
- `.classpath`, `.project`, `.settings/` (Eclipse metadata scattered in `backend/`)

### `.gitignore` Status:
- Root `.gitignore` was severely incomplete (contained only 1 line: `/.metadata/`).
- Needs comprehensive rules covering Maven `target/`, Node `node_modules/`, `dist/`, `.env`, Eclipse (`.metadata`, `.settings`, `.project`, `.classpath`, `Servers`), and Tomcat scratch directories (`tomcat.*`).

---

## 4. Remediation Plan for Phase 0

1. **Harden `.gitignore`** at root and backend.
2. **Remove all junk directories** (`.metadata/`, `Servers/`, `backend/bin/`, `backend/tomcat.*`).
3. **Fix `PricingEngineTest` BigDecimal assertion** so `mvn clean test` achieves 100% pass rate.
4. **Configure Maven Shade Plugin in `backend/pom.xml`** to generate an executable fat JAR with `Main-Class: com.foodplatform.ServerMain`.
5. **Fix `backend/Dockerfile`** to package and execute the fat JAR directly with `java -jar`.
6. **Harmonize Ports & fix `docker-compose.yml`** (standardize backend on port `8081`, remove `MYSQL_USER=root`, support clean `docker compose up` and local run).
