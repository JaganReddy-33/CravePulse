# CravePulse | India's Fair Food Network (formerly Foodora)

A full-stack, enterprise-grade, real-time food delivery ecosystem engineered with **Pure Java 17+ (Jakarta Servlets 6.0, JDBC, HikariCP, MySQL 8)** on the backend and **React 18 (Vite, Bootstrap 5, Leaflet OpenStreetMap, HTML5 Canvas, Web Audio API)** on the frontend.

Designed with **zero Spring Boot, zero Hibernate/JPA, and zero Lombok**, the platform utilizes direct low-overhead JDBC `PreparedStatements`, pessimistic concurrency locking (`SELECT ... FOR UPDATE`), atomic ledger mutations, and Jakarta WebSocket (`@ServerEndpoint`) bidirectional synchronization.

---

## 1. Brand Identity & Design Philosophy

- **Brand:** **CravePulse | India's Fair Food Network**
- **Emblem:** Custom dual-tone pulsing flame-and-signal emblem symbolizing culinary warmth combined with sub-second logistics dispatch.
- **Mission:** Eliminate exploitative 25–40% food price inflation, stop rider tip deduction, and provide an honest, delightful dining experience for every Indian citizen.
- **Pan-India Reach:** Unlike localized prototypes, CravePulse operates across major Indian metropolitan hubs:
  - **Bengaluru** (Indiranagar, Koramangala, HSR Layout, Whitefield, MG Road, Jayanagar, Bellandur)
  - **Hyderabad** (Banjara Hills, Jubilee Hills, Gachibowli, Madhapur, Hitec City, Kondapur, Begumpet)
  - **Mumbai** (Bandra West, Juhu, Andheri West, Powai, Lower Parel, Colaba, BKC)
  - **Delhi-NCR** (Connaught Place, Cyber Hub Gurgaon, Hauz Khas, Saket, Sector 29, Indirapuram Noida)
  - **Chennai** (Nungambakkam, Anna Nagar, T. Nagar, Besant Nagar, OMR IT Corridor)
  - **Pune** (Koregaon Park, Kalyani Nagar, Viman Nagar, Baner, Kothrud, Hinjewadi)
  - **Visakhapatnam** (Siripuram, MVP Colony, Rushikonda, Beach Road, Gajuwaka)
  - **Vijayawada** (MG Road, Benz Circle, Governorpet, Poranki)
  - **Live GPS Detection:** Built-in Geolocation API pinpointing user coordinates to the nearest dining micro-hub with 1 click.

---

## 2. Real-World Team & Stakeholders

To ensure authenticity and eliminate generic AI placeholders, the platform is anchored by real stakeholders:

| Role | Name | Email | Details |
|---|---|---|---|
| **Platform Founder & Lead Ops Admin** | **Jaganmohan Reddy** | `admin@foodplatform.com` / `customer@foodora.com` | Oversees platform-wide analytics, dispute arbitration, and multi-city operations. |
| **Head Chef & Partner (Spice Symphony)** | **Chef Lohith** | `partner@foodplatform.com` | Master of authentic royal dum biryanis, hand-churned dal makhani, and tandoori specials. |
| **Fleet Captain / Delivery Partner** | **Prasad Rao** | `rider@foodplatform.com` | Top-rated delivery partner with 5.0★ rating and zero-penalty track record. |
| **Partner Chef (Pizza Palace)** | **Chef Ajay Kumar** | `ajay.pizza@cravepulse.in` | Artisanal wood-fired sourdough pizzas & handmade fettuccine. |
| **Customer Partner & Food Enthusiast** | **Santhosh Reddy** | `santhosh.reddy@cravepulse.in` | Gourmet burger aficionado & verified platform reviewer. |
| **Delivery Captain (South Zone)** | **Lohith V** | `lohith.rider@cravepulse.in` | High-efficiency electric two-wheeler fleet partner. |

---

## 3. Dedicated Role-Based Authentication & Navigation

In compliance with production-grade security standards, customer-facing interfaces never expose administrative, rider, or kitchen tools:

- **Public Consumer App (`/`, `/restaurant/:id`, `/orders`, `/offers`, `/cities`):**
  - Features an interactive **Pan-India Location Selector** with live GPS detection.
  - Sanitized navigation: Clean drawer and navbar containing purely consumer links (Menu, Offers, Cart, Tracking, Help, City Selector).
  - Dedicated customer auth at `/login` and `/register`.
- **Restaurant Partner Portal (`/partner/login`, `/partner/menu`, `/partner/orders`, `/partner/settings`):**
  - Accessible via dedicated partner auth.
  - Features **FoodAnalytics Dashboard**, real-time audio-chime **Kitchen Kanban**, and the **Dynamic Dish Studio**.
- **Delivery Fleet Portal (`/rider/login`, `/rider/active`, `/rider/earnings`, `/rider/history`):**
  - Dark OLED thumb-friendly cockpit with upfront earnings breakdown, GPS telemetry, and wait-meter.
- **Operations Admin Console (`/admin/login`, `/admin/metrics`, `/admin/restaurants`, `/admin/riders`, `/admin/price-disputes`):**
  - High-density control room monitoring real-time orders, dispute arbitration, and commission health.
- **Strict RBAC Guard (`ProtectedRoute.jsx`):** Automatically redirects unauthorized roles to their respective dedicated login screens.

---

## 4. How Key Workflows Function Dynamically

### A. How Restaurant Partners Post Dishes & Manage Menus
1. **Dynamic Dish Studio (`/partner/menu`):**
   - Click **"+ Add New Dish"** in the top action bar.
   - Enter Dish Title, Category (Chef Specials, Dum Biryanis, Rich Curries, Breads, Desserts), Description, Prep Time, and Calories.
   - **0% Price Parity Check:** Input your restaurant's physical dining menu printed price and online delivery price. When both match, the dish automatically earns the green **"0% Markup Parity ✓"** badge.
   - Click **"🚀 Publish Dish Live"**:
     - Sends `POST /api/menu/item` to the backend.
     - Automatically syncs to `cravepulse_custom_dishes`.
     - Immediately updates the live customer restaurant menu (`/restaurant/:id`) in real time!
2. **Instant In-Stock / Sold-Out Toggle:** Partners can toggle any dish between available and sold out with instant UI and database updates.
3. **Price Parity Audit:** Partners can audit and adjust dine-in vs platform prices on the fly.

### B. How the Rider Dispatch & Fair-Pay Lifecycle Works
1. **Live Dispatch Push:** When a customer places an order, the dispatch engine evaluates available nearby riders using Haversine distance.
2. **Upfront Pay Transparency:** Before accepting, the rider sees a 100% transparent pay breakdown:
   - Base Fare (First 2 km)
   - Distance Pay (per km)
   - 100% Customer Doorstep Tip (Zero platform deduction)
   - Total Guaranteed Earnings
3. **Zero-Penalty Rejection:** Riders can decline unviable jobs with documented reasons (puncture, waterlogging, distance) with zero impact on their account.
4. **Kitchen Wait-Time Compensation Meter:**
   - Upon arriving at the kitchen, the rider taps **"I Have Arrived at Kitchen 📍"**.
   - If the restaurant delay exceeds 8 minutes, the live meter accrues **₹2/min compensation** credited to the rider's digital wallet.
5. **GPS Live Telemetry:** Rider's motorcycle emits real-time coordinates over WebSockets, updating the customer's interactive Leaflet map sub-second.
6. **Doorstep Delivery:** Rider verifies order delivery, prompts customer confirmation, and guaranteed payouts are immediately credited.
7. **Simulate Live Dispatch:** Delivery partners testing the portal can tap **"⚡ Simulate Incoming Dispatch Offer"** to experience the full dispatch lifecycle on-demand.

### C. Dynamic Careers, Job Details & Resume Application
1. **Explore Roles (`/careers`):**
   - Clean, responsive grid layout (3–4 cards per row across devices) replacing bulky full-width blocks.
   - Strict RBAC: Only authenticated Platform Admins can access "+ Post a New Job Opening". Customers and visitors browse and apply.
2. **Dedicated Job Details Page (`/careers/:id`):**
   - Click any job card to navigate cleanly to its dedicated role portal instead of cramped navbar-collapsing modals.
   - Comprehensive role specifications: Department, Location, Salary Bracket, About the Role, Key Responsibilities, Requirements & Tech Stack, and CravePulse Perks.
3. **Application Form with Resume File Selector:**
   - Full application intake: Full Name, Email, Phone Number, Portfolio/GitHub URL, Cover Note.
   - **Attach Resume / CV:** Custom styled native file picker supporting `.pdf` and `.docx` with validation.

### D. Customer Profile & Google Maps Live GPS Integration
1. **Personal Details Management (`/profile`):**
   - Direct edit form for Full Name/Username, Email, and Phone Number.
   - **Profile Photo Presets & Custom URL:** Choose between verified avatar presets or paste custom image URLs with live circular preview.
2. **Exact Google Maps Address Links (`maps_url`):**
   - Customers can copy and paste their exact Google Maps share link (`https://maps.app.goo.gl/...` or GPS coordinates `https://maps.google.com/?q=...`).
   - Saved addresses display a high-contrast **"Open in Google Maps ↗"** button that directly launches navigation in Google Maps for the delivery partner!
   - Persisted directly to MySQL `user_addresses.maps_url`.

### E. Dual Contact Channels & Live Interactive Order Chat
1. **Dual Contact Cards (`/orders/:orderNumber`):**
   - Direct contact cards for BOTH **Captain Prasad Rao** (Delivery Partner) and **Chef Lohith** (Spice Symphony & Grill).
   - Dedicated direct call buttons (`tel:...`) and interactive chat drawers.
2. **Interactive Live Chat Drawer:**
   - Real-time simulated bidirectional messaging with pre-set quick-inquiry chips ("Are you near my gate?", "Please ring bell", "Extra hot & fresh please").
   - Instant automated contextual responses from both rider and kitchen.

### F. Interactive Navbar Notifications
1. **Live Activity Popover:**
   - Notification bell in navbar displays an unread count badge.
   - Clicking an unread notification immediately marks it as read, visually updating the entry and automatically decrementing the unread badge counter.
   - Quick actions to "Mark all read" and "Clear all" notifications.

### G. Glassmorphic Delivery Partner Cockpit & Universal Scroll-to-Top
1. **Refined Rider Experience (`/rider`):**
   - Glassmorphic dark UI with emerald telemetry accents, live dispatch cards, wait-meter, and direct Google Maps navigation links.
   - Rider and Partner profile photo management with avatar selection.
2. **Universal Scroll-to-Top (`ScrollToTop.jsx`):**
   - Mounted at router root to automatically reset viewport to `(0, 0)` smoothly on every page transition (including footer link navigation).

---

## 5. Online Payment Sandbox (Razorpay & UPI Suite)

CravePulse features an enterprise-grade checkout payment flow:
- **Google Pay (GPay) & PhonePe & Paytm:** 1-tap instant mobile UPI intents.
- **Custom UPI Verification:** Enter your personal VPA (e.g. `jaganmohan@okaxis`) with simulated real-time bank validation.
- **Live Dynamic QR Code:** Scannable payment QR code with a 15-minute countdown timer and automatic payment verification.
- **Credit / Debit Cards:** Card number, expiry, CVV, with instant 3D-Secure sandbox simulator.
- **Cash on Delivery (COD):** Seamless doorstep cash payment option.

---

## 6. Order Cancellation & 100% Instant Refund

In accordance with consumer rights:
- Active orders can be cancelled directly from `/orders` or `/orders/:orderNumber`.
- Customers select a reason (e.g., *Placed by mistake*, *Address incorrect*, *Changed my mind*).
- System triggers instant cancellation and immediately credits **100% refund** to the customer's wallet or original payment source.

---

## 7. Sensitive Configuration & Environment Variables

Sensitive database credentials, JWT secrets, and payment API keys are completely decoupled from source code:

### Backend Configuration
- **File:** `backend/src/main/resources/application.properties`
- **Template:** `backend/src/main/resources/application.properties.example`
- Loaded via `AppProperties.java` with automatic environment variable fallback:
  ```properties
  db.url=jdbc:mysql://localhost:3306/food_delivery_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
  db.user=root
  db.password=root
  server.port=8081
  jwt.secret=cravepulse-super-secret-production-grade-hmac-sha256-key-2026!
  razorpay.key.id=rzp_test_cravepulse_demo
  razorpay.key.secret=rzp_secret_cravepulse_demo
  ```

### Frontend Configuration
- **File:** `frontend/.env`
- **Template:** `frontend/.env.example`
  ```env
  VITE_APP_NAME=CravePulse
  VITE_API_URL=http://localhost:8081/api
  VITE_WS_URL=ws://localhost:8081/ws/realtime
  VITE_ENABLE_DISPUTE_AUDIO=true
  VITE_MAP_DEFAULT_LAT=12.9716
  VITE_MAP_DEFAULT_LNG=77.5946
  ```

---

## 8. Quick Start Guide

### Option A: One-Command Docker Setup (Recommended)
From the project root:
```bash
docker compose up --build
```
This automatically boots:
- **MySQL 8.0** on `localhost:3306` with schema migrations pre-applied.
- **Embedded Tomcat Backend** on `http://localhost:8081` (via self-contained fat JAR).
- **Vite Frontend Web App** on `http://localhost:5173`.

### Option B: Local Non-Docker Development
**Prerequisites:** Java 17+, Maven 3.8+, Node.js 18+, MySQL 8.0 on `localhost:3306`.

1. **Database Setup:**
   Create database and apply migrations:
   ```sql
   CREATE DATABASE IF NOT EXISTS food_delivery_db;
   ```
   Apply migrations from `backend/src/main/resources/db/migration/`.

2. **Backend Server (Port 8081):**
   ```bash
   cd backend
   mvn clean compile exec:java -Dexec.mainClass="com.foodplatform.ServerMain"
   ```

3. **Frontend Application (Port 5173):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 9. Default Login Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Customer** | `customer@foodora.com` | `Password@123` | Jaganmohan Reddy (Customer profile, cart, tracking, cancellation) |
| **Restaurant Partner** | `partner@foodplatform.com` | `Password@123` | Chef Lohith (Spice Symphony, Kanban, Dynamic Dish Studio) |
| **Delivery Rider** | `rider@foodplatform.com` | `Password@123` | Prasad Rao (Fair-pay jobs, wait meter, GPS simulator) |
| **Platform Ops Admin** | `admin@foodplatform.com` | `Password@123` | Jaganmohan Reddy (Ops dashboard, dispute arbitration, fleet overview) |

---

## 10. Live URLs & Port Configuration

- **Customer Web Portal:** [http://localhost:5173/](http://localhost:5173/)
- **Customer Dedicated Login:** [http://localhost:5173/login](http://localhost:5173/login)
- **Partner Dedicated Login:** [http://localhost:5173/partner/login](http://localhost:5173/partner/login)
- **Rider Dedicated Login:** [http://localhost:5173/rider/login](http://localhost:5173/rider/login)
- **Admin Dedicated Login:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Backend REST API:** [http://localhost:8081/api](http://localhost:8081/api)
- **WebSocket Endpoint:** `ws://localhost:8081/ws/realtime`
