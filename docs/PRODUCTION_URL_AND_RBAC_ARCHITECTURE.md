# CravePulse Production Architecture: Real-World URL Schemes & Multi-Portal Access Control

This document details the production-grade URL architecture and role-based access control matrix implemented across **CravePulse** (0% Markup Fair Dining Network), modeled directly after tier-1 hyper-local delivery platforms (Swiggy, Zomato, DoorDash).

---

## 1. Real-World URL Hierarchy & Routing Specifications

### A. Restaurant Exploration & Swiggy Canonical Menu URLs

| Screen / Action | Canonical URL Pattern | URL Parameters & Purpose | Real-World Platform Equivalent |
| :--- | :--- | :--- | :--- |
| **City Storefront** | `/?city=bangalore` | `city`: Active delivery metropolitan hub | Swiggy City Explorer / Zomato City Home |
| **Filtered Search** | `/?query=biryani&cuisine=North+Indian&veg_only=true&rating=4.5&price=under_300&sort=rating` | Synchronizes all search, filter pills, and sort order bidirectionally with browser history | Swiggy /search & collection filters |
| **Restaurant Menu Page** | `/city/:cityName/:restaurantSlug-:localitySlug-rest:id` | Canonical path containing city, restaurant name, locality, and entity ID suffix | `https://www.swiggy.com/city/bangalore/dum-safar-biryani-100-feet-road-indiranagar-rest639418` |
| **Pre-Filtered Menu Query** | `/city/:city/:slug-rest:id?restaurant_id=:id&source=collection&query=:dishName` | `restaurant_id`: Entity verification<br>`source`: Referral attribution (`collection`, `search`, `home`)<br>`query`: Pre-populates menu search & filters matching dishes | Swiggy direct dish link from search suggestions or promotional banners |
| **Category-Filtered Menu** | `/city/:city/:slug-rest:id?category=:categoryId&veg_only=true` | `category`: Selected menu tab ID<br>`veg_only`: Filter pure veg dishes | Swiggy in-menu category jumping |

### B. Careers & Job Opening URLs (Top Tech / Swiggy Careers Pattern)

| Screen / Action | Canonical URL Pattern | Parameters & Functionality |
| :--- | :--- | :--- |
| **Careers Hub** | `/careers` | Main career opportunities landing page |
| **Department Filter** | `/careers?dept=Core+Platform+Engineering` | Filter open positions by engineering, logistics, design, or growth |
| **Specific Opening** | `/careers/openings/:slug-cp:jobId?job_id=:id&dept=:department` | Unique opening slug with job ID and department parameter for deep linking and applicant tracking |

---

## 2. Multi-Portal Role-Based Access Control (RBAC) Matrix

CravePulse strictly segregates four distinct operational portals with explicit before-login vs. after-login capabilities and security gating:

### Portal Segregation Breakdown

| Portal | Target User Role | Before Authentication (Public Access) | After Authentication (Gated Access) | Security Guard (`ProtectedRoute`) |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Portal** | `CUSTOMER` (or `ADMIN`) | • Browse pan-India hubs & restaurants<br>• View menus with 0% markup dine-in parity<br>• Add items to cart & configure variants<br>• Browse careers, offers, and pricing audit | • Proceed to checkout (`/checkout`)<br>• Real-time order placement & live tracking (`/orders`)<br>• Download GST tax invoices (`/invoice/:id`)<br>• Saved addresses & dispute resolution | Gated on `/checkout`, `/orders`, `/profile`. Unauthorized users redirect to `/login?redirect=...`. |
| **Restaurant Partner** | `RESTAURANT_OWNER` | • Partner value proposition landing (`/partner/login`)<br>• Transparent economics calculator (0% platform commission)<br>• Self-service kitchen registration (`/partner/register`) | • Kitchen Kanban Dispatch Board (`/partner/kanban`)<br>• Real-time incoming order audio chime & prep timer (`/partner/orders`)<br>• Live menu editor with dish pricing & add-ons (`/partner/menu`)<br>• Eligible balance, manual payout requests, and recorded settlement ledger (`/partner/settings`) | Protected at `/partner/*`. Non-partners redirected to `/partner/login` or 403 restricted. |
| **Delivery Rider (Captain)** | `RIDER` | • Captain welfare charter landing (`/rider/login`)<br>• Transparent pay breakdown (₹15/km base + 100% tip pass-through + wait-time meter)<br>• Rider onboarding & KYC document upload (`/rider/register`) | • Captain Cockpit (`/rider`)<br>• Duty online/offline toggle<br>• Haversine proximity order assignment alerts<br>• Turn-by-turn navigation & pickup/drop verification<br>• Wallet balance, manual payout requests, and trip ledger (`/rider/earnings`) | Protected at `/rider/*`. Non-riders redirected to `/rider/login`. |
| **Platform Ops Admin** | `ADMIN` | • Security-hardened admin sign-in (`/admin/login`) | • Executive KPI & telemetry dashboard (`/admin`)<br>• Dispute & refund review queue (`/admin/disputes`)<br>• Merchant KYC and restaurant approval terminal (`/admin/approvals`)<br>• Manual payout review (`/admin/payouts`)<br>• Careers recruiter studio (post, edit, delete job openings) | Protected at `/admin/*`. Requires elevated `ADMIN` privilege. |

---

## 3. Bidirectional URL State Synchronization

1. **Reactive Parameters (`useSearchParams`)**:
   - Filter changes immediately update browser `window.location.search` without reloading the page (`{ replace: true }`).
   - Deep links directly restore all filter states:
     ```
     /city/bangalore/spice-symphony-grill-indiranagar-rest1?restaurant_id=1&source=collection&query=Biryani
     ```
   - Pre-populates the dish search field with `Biryani` and filters the menu to matching items.
   - Preserves referral source tracking (`source=collection`, `source=search`, `source=hero_banner`).

2. **Breadcrumb Hierarchy**:
   - `Home / City / Locality / Restaurant Name`
   - `Home / Careers / Department / Position Title`
   - Clickable breadcrumb segments allow seamless upward navigation through the location hierarchy.
