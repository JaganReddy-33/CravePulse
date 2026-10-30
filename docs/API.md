# Food Delivery Platform API Specification

All REST API endpoints are served from the root prefix `/api`. All JSON request bodies and responses use standard `application/json` format with UTF-8 encoding. All authenticated requests require an `Authorization` header containing a valid Bearer token:
```http
Authorization: Bearer <jwt-access-token>
```

---

## 1. Standard Response & Error Format

### 1.1 Success Response Wrapper
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### 1.2 Error Response Wrapper
```json
{
  "success": false,
  "error": "Cannot transition order #104 from READY to ACCEPTED",
  "statusCode": 400,
  "timestamp": "2026-10-29T20:46:53.631497561Z"
}
```

The `timestamp` is an ISO-8601 string. HTTP status codes are set on the response and commonly include:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Payload validation failure or business rule violation.
- `401 Unauthorized`: Token missing, expired, or invalid.
- `403 Forbidden`: Authenticated user lacks required role permission.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Concurrency lock collision, duplicate assignment, or duplicate key.
- `429 Too Many Requests`: Rate limit exceeded (100 req/min per IP).
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Authentication & Session Management

### 2.1 User Registration
- **Endpoint:** `POST /api/auth/register`
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "customer@foodplatform.com",
  "password": "Password@123",
  "full_name": "Rohan Gupta",
  "phone": "+919876543210",
  "role": "CUSTOMER"
}
```
*(Roles: `CUSTOMER`, `RESTAURANT`, `RIDER`, `ADMIN`)*
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "customer@foodplatform.com",
      "full_name": "Rohan Gupta",
      "role": "CUSTOMER",
      "is_kyc_verified": true,
      "wallet_balance": 150.00
    },
    "tokens": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "a4f89d3c-...",
      "expires_in": 3600
    }
  }
}
```

### 2.2 User Login
- **Endpoint:** `POST /api/auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "partner@foodplatform.com",
  "password": "Password@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "partner@foodplatform.com",
      "full_name": "Chef Rohan",
      "role": "RESTAURANT",
      "restaurant_id": 1
    },
    "tokens": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "c71e09b2-...",
      "expires_in": 3600
    }
  }
}
```

### 2.3 Token Refresh (Rotation)
- **Endpoint:** `POST /api/auth/refresh`
- **Auth Required:** No
- **Request Body:**
```json
{
  "refresh_token": "c71e09b2-..."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "e82d11f4-...",
    "expires_in": 3600
  }
}
```

### 2.4 Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Auth Required:** Yes
- **Response (200 OK):** Returns authenticated user profile including wallet balance and KYC status.

### 2.5 Update User Profile
- **Endpoint:** `POST /api/auth/profile`
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "fullName": "Aarav Patel",
  "phone": "+919876543210",
  "avatarUrl": "https://images.unsplash.com/photo-..."
}
```
- **Response (200 OK):** Updated user profile.

### 2.6 Verify Phone Number OTP
- **Endpoint:** `POST /api/auth/verify-phone-otp`
- **Auth Required:** Yes
- Phone verification currently returns `503 Service Unavailable` until an SMS verification provider is configured.

### 2.7 Saved Address CRUD
- **Endpoints:**
  - `GET /api/auth/addresses`: List saved addresses for authenticated user.
  - `POST /api/auth/addresses`: Add new address (title, addressLine, landmark, city, state, postalCode, latitude, longitude, mapsUrl).
  - `POST /api/auth/addresses/{id}/default`: Set address as primary default.
  - `DELETE /api/auth/addresses/{id}`: Delete saved address.
- **Auth Required:** Yes

---

## 3. Restaurant & Catalog APIs

### 3.1 Discover Restaurants (with Cross-Dish Search)
- **Endpoint:** `GET /api/restaurants`
- **Auth Required:** No
- **Query Parameters:** `lat`, `lng`, `cuisine`, `search`, `vegOnly`, `rating` (minimum rating), `time` (maximum preparation time), `price` (`BUDGET`, `MID`, or `PREMIUM`), `sort` (`relevance`, `rating`, `time`, `costAsc`, or `costDesc`), `limit` (default 20), and `offset` (default 0).
- `cuisine` matches `restaurant_profiles.cuisine_types`; `search` matches restaurant metadata and active menu items. `vegOnly=true` limits results to pure-vegetarian restaurants.
- **Response:** `data` is the requested page of restaurant objects; `pagination` includes `page`, `pageSize`, `totalCount`, and `totalPages`. Counts and filters are calculated server-side. Continue through the list with `offset += limit`; keep filters and coordinates unchanged between pages.

### 3.1.1 Search Suggestions (Dishes & Restaurants)
- **Endpoint:** `GET /api/restaurants/suggestions?query={term}` (also accepts `q`)
- **Auth Required:** No
- **Response:** `data` contains restaurant and dish suggestion lists.

### 3.1.2 Customer Cuisine Filters
- **Endpoint:** `GET /api/catalog/categories`
- **Auth Required:** No
- Returns active, administrator-managed discovery categories with `id`, `name`, `imageUrl`, `displayOrder`, and `active`. The category name is used as the restaurant discovery `cuisine` parameter.

### 3.2 Get Menu Hierarchy
- **Endpoint:** `GET /api/menu/restaurant/{restaurantId}`
- **Auth Required:** No
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "restaurant_id": 1,
    "categories": [
      {
        "id": 1,
        "name": "Signature Curries",
        "items": [
          {
            "id": 101,
            "name": "Dum Handi Murgh",
            "description": "Slow cooked chicken in rich brass handi gravy",
            "dine_in_price": 420.00,
            "price": 420.00,
            "price_markup_pct": 0.0,
            "is_veg": false,
            "prep_time_minutes": 20,
            "is_available": true,
            "variants": [
              { "id": 1, "name": "Half (2 pcs)", "price_delta": 0.00 },
              { "id": 2, "name": "Full (4 pcs)", "price_delta": 180.00 }
            ],
            "addons": [
              { "id": 1, "name": "Extra Gravy Cup", "price": 40.00 },
              { "id": 2, "name": "Butter Garlic Naan", "price": 65.00 }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 4. Radical Price Transparency & Cart Calculation

### 4.1 Compute Itemized Transparent Bill
- **Endpoint:** `POST /api/cart/price`
- **Auth Required:** Yes (Role: `CUSTOMER`)
- **Request Body:**
```json
{
  "restaurant_id": 1,
  "items": [
    {
      "menu_item_id": 101,
      "quantity": 2,
      "variant_id": 2,
      "addon_ids": [1]
    }
  ],
  "coupon_code": "FOOD50",
  "delivery_lat": 12.9716,
  "delivery_lng": 77.5946
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subtotal": 1280.00,
    "dine_in_subtotal": 1280.00,
    "markup_difference": 0.00,
    "parity_badge": "VERIFIED_0_PERCENT_MARKUP",
    "packaging_fee": 30.00,
    "packaging_fee_reason": "Eco-friendly biodegradable containers & tamper-evident seals",
    "delivery_fee": 35.00,
    "delivery_distance_km": 3.2,
    "platform_fee": 5.00,
    "platform_fee_reason": "Server operations, 24/7 support & fair rider insurance fund",
    "gst_tax": 64.00,
    "coupon_discount": 100.00,
    "wallet_deduction": 0.00,
    "total_payable": 1314.00,
    "honest_eta": {
      "kitchen_prep_minutes": 22,
      "kitchen_load_factor": 1.15,
      "rider_transit_minutes": 11,
      "confidence_min_minutes": 32,
      "confidence_max_minutes": 38,
      "sla_guarantee_minutes": 48,
      "goodwill_compensation_inr": 50.00
    }
  }
}
```

---

## 5. Order Management & Real-Time Tracking

### 5.1 Place Order
- **Endpoint:** `POST /api/orders`
- **Auth Required:** Yes (Role: `CUSTOMER`)
- **Request Body:**
```json
{
  "restaurantId": 1,
  "items": [
    { "menuItemId": 101, "quantity": 2, "variantId": 2, "addonIds": [1] }
  ],
  "deliveryAddressId": 5,
  "paymentMode": "RAZORPAY",
  "couponCode": "FOOD50",
  "tipAmount": 0,
  "specialInstructions": "Please ring bell and leave on shoe rack"
}
```
- The request may include an `X-Idempotency-Key` header. The response data includes `id`, `orderId`, `orderNumber`, `status`, payment fields, the created `order`, and `paymentSession` when applicable.
- The server generates a four-digit delivery PIN. The authenticated customer can retrieve it on the order tracking page; it is hidden from restaurant and rider order-detail responses and should only be shared when the rider arrives.

### 5.2 Transition Order State (Partner / Rider / Admin)
- **Endpoint:** `POST /api/orders/{id}/status`
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "status": "PREPARING",
  "reason": "Chef accepted ticket and initiated cooking"
}
```
- The response data is the updated order object. Allowed transitions depend on the caller's role and current order state.

### 5.3 Get Order Details
- **Endpoint:** `GET /api/orders/{id}`
- **Auth Required:** Yes
- The authenticated order participant receives the order details. Live status updates are delivered over the WebSocket order channel; this API does not expose a separate `/events` endpoint.
- `GET /api/orders/number/{orderNumber}` returns the same owner-checked tracking detail. Only the owning customer receives `deliveryOtp`; the rider must enter the PIN provided at handoff.

---

## 6. Fair-Pay Rider Protocol APIs

Rider endpoints use the singular prefix `/api/rider` and require `RIDER` or `ADMIN` authentication.

- `GET /api/rider/profile`: retrieve the authenticated rider profile.
- `POST /api/rider/profile`: update vehicle type, vehicle number, and driving license.
- `POST /api/rider/profile/status`: toggle online state with `{ "online": true }` (also accepts `isOnline`).
- `GET /api/rider/active-job` (aliases: `/orders/active`, `/active`): retrieve the active dispatch.
- `GET /api/rider/offers`: retrieve dispatch offers.
- `POST /api/rider/{dispatchId}/accept` and `/reject`: accept or reject an offer. Rejection accepts an optional `{ "reason": "..." }`.
- `POST /api/rider/orders/{orderId}/status`: update a trip milestone; delivery completion requires `{ "status": "DELIVERED", "deliveryOtp": "..." }`.
- `POST /api/rider/orders/{orderId}/wait-compensation`: claim eligible wait-time compensation.
- `POST /api/rider/telemetry`: submit `{ "latitude", "longitude", "speed", "heading", "orderId" }`; coordinates are validated server-side.
- `GET /api/rider/earnings`, `GET /api/rider/history?limit=50&offset=0`, and `GET /api/rider/cod-ledger?limit=50&offset=0`: earnings, paginated trips, and COD ledger.
- `GET /api/rider/payout-requests`: wallet amount available for withdrawal, pending reservations, and the rider's payout request history. COD cash collected is tracked separately and is not part of the withdrawable wallet balance.
- `POST /api/rider/payout-requests`: submit `{ "amount": 500.00, "payoutDestination": "name@bank" }`. The amount is reserved against the available wallet balance while pending. Requests are manually reviewed; a payout is not transferred automatically.
- `POST /api/rider/cod-settlement`: record a COD cash deposit.

---

## 7. Instant Dispute Resolution & Refunds

### 7.1 File Dispute with Evidence
- **Endpoint:** `POST /api/disputes`
- **Auth Required:** Yes (Role: `CUSTOMER`)
- **Request Body:**
```json
{
  "order_id": 501,
  "dispute_category": "MISSING_ITEM",
  "claimed_amount": 240.00,
  "description": "Butter Garlic Naan was missing from package, seal was intact",
  "evidence_photo_url": "https://storage.foodplatform.com/disputes/501_evidence.jpg"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "dispute_id": 89,
    "dispute_code": "DSP-20261025-089",
    "dispute_status": "AUTO_APPROVED",
    "approved_refund_amount": 240.00,
    "refund_destination": "CUSTOMER_WALLET",
    "auto_resolved": true,
    "resolution_note": "Rule Tier 1: Claim under ₹300 with photo evidence automatically credited to wallet"
  }
}
```

---

## 8. Restaurant Analytics & Admin Ops

### 8.1 Partner Dashboard Analytics
- **Endpoint:** `GET /api/restaurants/{id}/analytics`
- **Auth Required:** Yes (Role: `RESTAURANT` or `ADMIN`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_revenue": 14850.00,
      "total_orders": 64,
      "avg_prep_time_minutes": 18.2,
      "customer_rating": 4.8
    },
    "hourly_trend": [
      { "hour": "12 PM", "revenue": 2400, "orders": 12 },
      { "hour": "4 PM", "revenue": 5600, "orders": 28 },
      { "hour": "8 PM", "revenue": 6850, "orders": 24 }
    ],
    "top_selling_dishes": [
      { "name": "Dum Handi Murgh", "units_sold": 38, "revenue": 15960.00 },
      { "name": "Paneer Tikka Roll", "units_sold": 26, "revenue": 4940.00 }
    ],
    "category_distribution": [
      { "category": "Curries", "percentage": 48 },
      { "category": "Biryanis", "percentage": 32 },
      { "category": "Starters", "percentage": 20 }
    ]
  }
}
```

### 8.2 Admin Platform Operations
- **Endpoint:** `GET /api/admin/metrics`
- **Auth Required:** Yes (Role: `ADMIN`)
- **Response (200 OK):** Platform GMV, net commission revenue, SLA breach count, dispute volume, and live rider fleet capacity.

---

## 9. WebSocket & Real-Time Protocol

- **Connection URL:** `ws://localhost:8081/ws/realtime?token=<jwt>` (or `wss://...` in production)
- **Handshake Authentication:** Pass `?token=<jwt>` as a query parameter on the connection URL.
  - If the token is missing, expired, or invalid, the server immediately closes the connection with code `1008 (VIOLATED_POLICY)` and reason `"Invalid authentication token"`.
- **Session Limits & Protection:**
  - Maximum frame payload size: 64 KB (oversized frames close connection with code `1009`).
  - Sliding window rate limit: 40 messages per 10 seconds per session. Excess messages receive an error event or trigger session termination.

### 9.1 Client Inbound Frames

#### Heartbeat Ping
```json
{
  "action": "ping"
}
```
*Server replies with:* `{"action": "pong", "timestamp": 1729881025000}`

#### Channel Subscription
```json
{
  "action": "subscribe",
  "channel": "order:501"
}
```

##### Subscription Authorization Matrix
| Channel Pattern | Allowed Roles | Enforcement Logic |
| :--- | :--- | :--- |
| `admin:feed` | `ADMIN` | Role check from authenticated JWT token. |
| `user:{id}` | `ADMIN`, Matching User | User ID from JWT must match channel ID. |
| `rider:{id}` | `ADMIN`, Matching Rider | Rider profile ID must belong to authenticated rider. |
| `restaurant:{id}` | `ADMIN`, Restaurant Partner | Restaurant partner owner or admin. |
| `order:{id}` | `ADMIN`, Order Customer, Order Rider, Order Restaurant | User must be buyer, assigned rider, or merchant for order. |

If subscription is rejected:
```json
{
  "action": "subscribe_error",
  "channel": "order:999",
  "error": "Forbidden: Not authorized to subscribe to channel order:999"
}
```

#### Channel Unsubscription
```json
{
  "action": "unsubscribe",
  "channel": "order:501"
}
```

#### Rider Live GPS Telemetry
```json
{
  "action": "rider_telemetry",
  "latitude": 12.9783692,
  "longitude": 77.6408356,
  "heading": 185.4,
  "speedKmh": 28.5,
  "batteryLevel": 88
}
```
*Broadcasts `rider_location_updated` to assigned order channels, `admin:feed`, and active dispatch monitors.*

#### Direct Order Chat Message
```json
{
  "action": "chat_message",
  "orderId": 501,
  "recipientRole": "RIDER",
  "messageText": "Please leave at the security gate."
}
```

---

### 9.2 Server Event Payloads

#### 1. `order_status_updated`
Broadcasted to `order:{orderId}` and `user:{userId}` when status progresses (`PLACED` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `PICKED_UP` -> `DELIVERED`).
```json
{
  "event": "order_status_updated",
  "orderId": 501,
  "status": "PICKED_UP",
  "updatedAt": 1729881020000
}
```

#### 2. `rider_assigned`
Broadcasted to `order:{orderId}` and customer feed when delivery captain accepts dispatch.
```json
{
  "event": "rider_assigned",
  "orderId": 501,
  "riderId": 12,
  "riderName": "Kiran Kumar",
  "riderPhone": "+91 80 4748 3333 (Proxy Ext #501)",
  "vehicleType": "Ather 450X EV"
}
```

#### 3. `rider_location_updated`
Broadcasted to `order:{orderId}` and `admin:feed`.
```json
{
  "event": "rider_location_updated",
  "orderId": 501,
  "latitude": 12.9783692,
  "longitude": 77.6408356,
  "heading": 185.4,
  "speedKmh": 28.5,
  "timestamp": 1729881030000
}
```

#### 4. `new_order_placed`
Broadcasted to `restaurant:{restaurantId}`.
```json
{
  "event": "new_order_placed",
  "orderId": 501,
  "orderNumber": "CP-20261027-A8B9C0",
  "itemCount": 3,
  "totalAmount": 780.00,
  "timestamp": 1729881010000
}
```

#### 5. `rider_job_offer`
Broadcasted to `rider:{riderId}` during automated dispatch search sweeps.
```json
{
  "event": "rider_job_offer",
  "orderId": 501,
  "dispatchId": 108,
  "restaurantName": "Spice Symphony",
  "pickupAddress": "Indiranagar 100ft Rd",
  "deliveryAddress": "Koramangala 4th Block",
  "distanceKm": 4.2,
  "estimatedEarnings": 72.50,
  "expiresAt": 1729881045000
}
```

#### 6. `notification`
Broadcasted to `user:{userId}` for announcements, refunds, and milestones.
```json
{
  "event": "notification",
  "title": "Refund Processed",
  "message": "₹250 has been credited to your CravePulse Wallet for order #501.",
  "timestamp": 1729881050000
}
```

#### 7. `restaurant_status_updated`
Broadcasted to active catalog consumers when a merchant opens or pauses kitchen intake.
```json
{
  "event": "restaurant_status_updated",
  "restaurantId": 14,
  "isOpen": true
}
```

#### 8. `new_chat_message`
Broadcasted to `order:{orderId}` when customer, rider, or kitchen sends an in-order communication.
```json
{
  "event": "new_chat_message",
  "orderId": 501,
  "id": 42,
  "senderUserId": 10,
  "senderRole": "CUSTOMER",
  "recipientRole": "RIDER",
  "messageText": "I am waiting in the lobby",
  "createdAt": "2026-10-27T17:40:00"
}
```

---

## 10. Non-Blocking SSE & Order Chat REST Endpoints

### 10.1 Server-Sent Events (SSE) Stream
- **Endpoint:** `GET /api/events/sse?token=<jwt>`
- **Auth Required:** Yes (via query token or `Authorization: Bearer <jwt>`)
- **Transport:** HTTP text/event-stream using non-blocking Servlet 3.0 `AsyncContext`.
- **Keepalive:** Heartbeat comment `: ping` dispatched every 15 seconds.

### 10.2 Fetch Order Chat Messages
- **Endpoint:** `GET /api/orders/{id}/messages`
- **Auth Required:** Yes (`CUSTOMER` who owns order, assigned `RIDER`, merchant `RESTAURANT`, or `ADMIN`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderId": 501,
      "senderUserId": 10,
      "senderRole": "CUSTOMER",
      "recipientRole": "RIDER",
      "messageText": "Where are you now?",
      "createdAt": "2026-10-27T17:35:10"
    }
  ]
}
```

### 10.3 Post Order Chat Message
- **Endpoint:** `POST /api/orders/{id}/messages`
- **Auth Required:** Yes (Order participants only)
- **Request Body:**
```json
{
  "recipientRole": "RIDER",
  "messageText": "Please leave at security desk."
}
```
- **Response (201 Created):** Created `OrderMessage` object, automatically broadcasted via WebSocket `new_chat_message`.

---

## 11. Partner (Restaurant) Portal APIs

### 11.1 Dynamic Partner Profile Resolution
- **Endpoint:** `GET /api/restaurants/my-profile`
- **Auth Required:** Yes (`RESTAURANT_OWNER` or `ADMIN`)
- **Response (200 OK):** Current authenticated partner's `Restaurant` profile.

### 11.2 Restaurant Settings & Payout Banking
- **Endpoint:** `GET /api/restaurants/{id}/settings`
- **Auth Required:** Yes (Owner of restaurant or `ADMIN`)
- **Response (200 OK):** Settings object with masked bank account (`••••••••••9931`), IFSC, beneficiary, UPI ID, auto-reject SLA minutes, throttle status, and operating hours.

- **Endpoint:** `POST /api/restaurants/{id}/settings`
- **Auth Required:** Yes (Owner of restaurant or `ADMIN`)
- **Request Body:**
```json
{
  "name": "Meghana Foods Indiranagar",
  "phone": "+918025219999",
  "address": "544, 1st Cross, CMH Road, Indiranagar, Bengaluru",
  "bannerImage": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200",
  "bankAccountNumber": "50200088129931",
  "bankIfsc": "HDFC0001234",
  "bankBeneficiaryName": "Meghana Foods Pvt Ltd",
  "upiId": "meghana.foods@okhdfcbank",
  "autoRejectMinutes": 10
}
```

### 11.3 Weekly Operating Hours Schedule
- **Endpoint:** `GET /api/restaurants/{id}/hours` & `POST /api/restaurants/{id}/hours`
- **Auth Required:** Yes (Owner or `ADMIN`)
- **Payload:** Array of `{ "dayOfWeek": "Monday", "openTime": "11:00", "closeTime": "23:00", "isClosed": false }`.

### 11.4 Partner Financial Settlements Ledger
- **Endpoint:** `GET /api/restaurants/{id}/payouts`
- **Auth Required:** Yes (Owner or `ADMIN`)
- **Response (200 OK):** Array of recorded settlement statements containing `payoutReference`, `grossSales`, `commissionAmount`, `netPayout`, `status`, and bank `utrNumber`. Empty ledgers remain empty; the API does not synthesize paid statements or transfer references.

### 11.5 Partner Payout Requests
- `GET /api/restaurants/{id}/payout-requests` returns the available balance, pending amount, net eligible earnings, and request history.
- `POST /api/restaurants/{id}/payout-requests` accepts `{ "amount": 500.00, "payoutDestination": "restaurant@bank" }`. The destination is a UPI ID and is stored with the request. Available balance is calculated from delivered, paid orders after commission and commission GST, less recorded paid settlements and pending requests. COD orders are excluded until collection is reconciled.
- Payout requests are manually reviewed. The application does not initiate a bank/UPI transfer.

### 11.6 Real-Time SQL Analytics
- **Endpoint:** `GET /api/restaurants/{id}/analytics`
- **Auth Required:** Yes (Owner or `ADMIN`)
- **Response (200 OK):** Computed SQL metrics containing `summaryToday`, `summary7Days`, `summary30Days`, `summaryAllTime`, `cancellation` (rate & count), `peakHours`, `dailyTrend7Days`, `topDishes`, and `ratings`.

### 11.7 Menu Management & Soft Deletion
- **Endpoint:** `GET /api/menu/restaurant/{restaurantId}` (menu categories and items)
- **Endpoint:** `GET /api/menu/item/{id}` (item details)
- **Endpoint:** `POST /api/menu/item` (Create dish with image URL validation)
- **Endpoint:** `POST /api/menu/item/{id}/update` (Update dish details and prices)
- **Endpoint:** `POST /api/menu/item/{id}/toggle-availability`
- **Endpoint:** `POST /api/menu/item/{id}/delete` (Soft delete dish, setting `is_deleted = TRUE`)
- **Endpoint:** `POST /api/menu/restaurant/{id}/bulk-availability` (Bulk mark sold-out or in-stock)
- **Endpoint:** `POST /api/menu/restaurant/{id}/reorder` (Update item display ordering)
- **Endpoint:** `POST /api/menu/categories` (Add new category)
- **Endpoint:** `POST /api/menu/item/{id}/variants` (Add portion variant)
- **Endpoint:** `POST /api/menu/item/{id}/addons` (Add customer add-on)

Menu item creation requires an active `categoryId` that belongs to the supplied restaurant. An invalid, inactive, or other-restaurant category returns `400 Bad Request` rather than attempting an insert that violates the category foreign key.

Menu item creation uses **POST** `/api/menu/item`. The response text `Menu endpoint not found: /item` is emitted by the menu servlet's GET fallback, not its POST handler. If it appears while creating an item, inspect the browser Network request method and verify the backend deployment revision and API origin.

---

## 12. Admin Console & Platform Operations

### Payout Review
- `GET /api/admin/payout-requests?status=PENDING|PAID|REJECTED` lists payout requests for admin review.
- `POST /api/admin/payout-requests/{id}/process` accepts `status` (`PAID` or `REJECTED`), `adminNote`, and `paymentReference`. Marking a request `PAID` requires a transfer reference and `transferConfirmed: true`; this records a completed external transfer but does not initiate one. Rider wallet debits and payout status changes are committed atomically.

### 12.0 Discovery Categories, Partner Approval, and Restaurant Status
- **List/manage categories:** `GET /api/admin/categories`
- **Create category:** `POST /api/admin/categories` with `{ "name", "imageUrl", "displayOrder" }`. Photo URLs must use HTTPS.
- **Edit/restore category:** `POST /api/admin/categories/{id}/update` with category fields and `active`.
- **Hide category:** `POST /api/admin/categories/{id}/delete`; this deactivates the category without deleting history.
- **Approve/revoke restaurant:** `POST /api/admin/restaurant/{id}/kyc` with `{ "approved": true|false, "reason": "..." }`.
- **Approve/revoke rider:** `POST /api/admin/rider/{id}/kyc` with the same body shape.
- Approval updates the profile KYC flag and linked account status in one database transaction (`ACTIVE` on approval, `SUSPENDED` on revocation). The reason is persisted in an in-app notification for the partner.
- **Activate/pause restaurant:** `POST /api/admin/restaurant/{id}/status` with `{ "status": "ACTIVE"|"PAUSED" }`. An unapproved restaurant cannot be activated.

### 12.1 Real-Time Operations Telemetry & SQL Platform Metrics
- **Endpoint:** `GET /api/admin/metrics`
- **Auth Required:** Yes (`ADMIN` role)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gmv": 128500.00,
    "totalOrders": 342,
    "deliveredOrders": 310,
    "cancelledOrders": 12,
    "cancellationRate": 3.51,
    "aov": 375.73,
    "activeRidersCount": 18,
    "activeDeliveriesCount": 9,
    "avgDeliveryTimeMinutes": 28,
    "platformRevenue": 6840.00,
    "totalRefunds": 1450.00,
    "pendingRestaurantApprovals": 2,
    "pendingRiderApprovals": 3,
    "dailyTrend7Days": [
      { "date": "2026-10-21", "orders": 42, "revenue": 16400.00 },
      { "date": "2026-10-22", "orders": 48, "revenue": 18200.00 }
    ]
  }
}
```

### 12.2 Operations Live Fleet & Order Radar
- **Endpoint:** `GET /api/admin/live-map`
- **Auth Required:** Yes (`ADMIN` role)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "restaurants": [
      { "id": 1, "name": "Meghana Foods", "latitude": 12.9716, "longitude": 77.5946, "isOpen": true }
    ],
    "riders": [
      { "id": 4, "name": "Rider Rajesh", "latitude": 12.9730, "longitude": 77.5960, "isActive": true, "assignedOrderId": 108 }
    ],
    "activeOrders": [
      {
        "orderId": 108,
        "orderNumber": "ORD-1729881000",
        "status": "OUT_FOR_DELIVERY",
        "totalAmount": 450.00,
        "restaurantName": "Meghana Foods",
        "riderName": "Rider Rajesh",
        "customerAddress": "104 Indiranagar, Bengaluru"
      }
    ]
  }
}
```

### 12.3 User Directory Moderation & Fraud Risk Management
- **Search Users:** `GET /api/admin/users?query={query}&role={CUSTOMER|RESTAURANT_OWNER|RIDER|ADMIN}&status={ACTIVE|SUSPENDED}&limit=50&offset=0`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Response (200 OK):** Paginated array of users including `id`, `fullName`, `email`, `phone`, `role`, `status`, `fraudFlagCount`, and `createdAt`.

- **Update User Status:** `POST /api/admin/users/{id}/status`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Request Body:**
  ```json
  {
    "status": "SUSPENDED",
    "reason": "Suspected payment chargeback fraud"
  }
  ```

- **Escalate Fraud Flag:** `POST /api/admin/users/{id}/fraud-flag`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Request Body:**
  ```json
  {
    "reason": "Multiple unverified missing item claims"
  }
  ```

### 12.4 Coupon Engine Lifecycle Management
- **List All Coupons:** `GET /api/admin/coupons`
  - **Auth Required:** Yes (`ADMIN` role)
- **Create Coupon:** `POST /api/admin/coupons`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Request Body:**
  ```json
  {
    "code": "FESTIVE50",
    "description": "50% off up to ₹100",
    "discountType": "PERCENTAGE",
    "discountValue": 50.00,
    "minOrderAmount": 199.00,
    "maxDiscountAmount": 100.00,
    "validFrom": "2026-10-27T00:00:00",
    "validTo": "2026-11-15T23:59:59",
    "usageLimitPerUser": 3,
    "firstOrderOnly": false
  }
  ```
- **Update Coupon:** `POST /api/admin/coupons/{id}/update`
- **Toggle Active Status:** `POST /api/admin/coupons/{id}/toggle`
- **Delete Coupon:** `DELETE /api/admin/coupons/{id}`

### 12.5 Dynamic Platform Operational Settings
- **Retrieve Settings:** `GET /api/admin/settings`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Response (200 OK):** Key-value dictionary of platform operational parameters (`platform_fee`, `delivery_fee_base`, `gst_rate_percent`, `max_delivery_radius_km`, `surge_multiplier`, `cod_order_limit`, `dispute_auto_refund_cap`, `dispute_window_hours`).
- **Update Settings:** `POST /api/admin/settings`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Request Body:** JSON dictionary of updated settings (e.g. `{ "surge_multiplier": 1.25, "dispute_auto_refund_cap": 200.00 }`).

### 12.6 Immutable Admin Audit Trail
- **Retrieve Audit Logs:** `GET /api/admin/audit-logs?limit=100`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Response (200 OK):** Immutable event log containing `id`, `adminId`, `targetType`, `targetId`, `action`, `details`, `ipAddress`, and `createdAt`.

### 12.7 Operations CSV Data Streaming Export
- **Stream CSV Data:** `GET /api/admin/export?type={orders|users|disputes|audit-logs}`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Response Headers:**
    - `Content-Type: text/csv; charset=UTF-8`
    - `Content-Disposition: attachment; filename="cravepulse_{type}_export.csv"`
  - **Body:** RFC 4180 streaming CSV payload.

### 12.8 Dispute Resolution & Supervisor Escalation
- **Resolve Dispute:** `POST /api/disputes/{id}/resolve`
  - **Auth Required:** Yes (`ADMIN` role)
  - **Request Body:**
  ```json
  {
    "resolution": "REFUNDED",
    "adminNote": "Customer provided valid photographic proof of spilled packaging",
    "refundAmount": 120.00,
    "flagUser": false
  }
  ```

---

## 13. Observability, Health & Telemetry

### 13.1 Liveness Probe
- **Endpoint:** `GET /health` or `GET /api/health`
- **Auth Required:** No
- **Response (200 OK):**
```json
{
  "status": "UP",
  "service": "CravePulse Platform",
  "version": "1.0.0",
  "timestamp": 1729881000000
}
```

### 13.2 Readiness Probe (Database & JVM Memory Probe)
- **Endpoint:** `GET /ready` or `GET /api/ready`
- **Auth Required:** No
- **Response (200 OK / 503 Service Unavailable):**
```json
{
  "status": "UP",
  "database": {
    "status": "UP",
    "latencyMs": 2
  },
  "memory": {
    "freeMemoryMb": 240,
    "totalMemoryMb": 512,
    "maxMemoryMb": 4096
  }
}
```

### 13.3 Operations Metrics Snapshot
- **Endpoint:** `GET /metrics` or `GET /api/metrics`
- **Auth Required:** No
- **Response (200 OK):**
```json
{
  "uptimeMs": 86400000,
  "totalRequests": 14205,
  "ordersPlaced": 482,
  "ordersDelivered": 465,
  "ordersCancelled": 12,
  "ordersPerMinute": 8,
  "failedPayments": 5,
  "dispatchTimeouts": 3,
  "activeWebsockets": 42
}
```

---

## 14. Job Listings & Applications

- **List active jobs:** `GET /api/jobs?status=ACTIVE&department={department}&limit=12&offset=0`. Results are paginated with `limit` (maximum 100) and `offset`; non-admin callers only receive active jobs. The response includes `pagination.page`, `pagination.pageSize`, `pagination.totalCount`, and `pagination.totalPages`, counted with the same status and department filters.
- **Job details:** `GET /api/jobs/{id}`.
- **Departments:** `GET /api/jobs/departments`.
- **Apply:** `POST /api/jobs/apply` with `jobId`, `applicantName`, and `email` (optional fields include `phone`, `portfolioUrl`, `resumeFilename`, `coverNote`, `experienceYears`, and `currentCompany`).
