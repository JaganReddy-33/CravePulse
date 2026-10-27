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
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition order #104 from READY to ACCEPTED",
    "timestamp": 1729881000000,
    "path": "/api/orders/104/status"
  }
}
```

Common HTTP status codes returned:
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

---

## 3. Restaurant & Catalog APIs

### 3.1 Discover Restaurants
- **Endpoint:** `GET /api/restaurants`
- **Auth Required:** No
- **Query Parameters:**
  - `cuisine` (string, optional): Filter by cuisine e.g. "North Indian", "Burgers"
  - `veg_only` (boolean, optional): `true` to show pure veg restaurants
  - `lat` & `lng` (float, optional): User coordinates for Haversine distance ordering
  - `rating_min` (float, optional): e.g. 4.0
  - `search` (string, optional): Full-text search on name or cuisine
  - `page` (int, default 1), `limit` (int, default 10)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Spice Symphony & Grill",
        "cuisine_type": "North Indian, Tandoor",
        "rating": 4.8,
        "rating_count": 1420,
        "average_prep_time_minutes": 22,
        "distance_km": 2.4,
        "is_open": true,
        "is_busy_throttled": false,
        "banner_image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 14 }
  }
}
```

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
  "restaurant_id": 1,
  "items": [
    { "menu_item_id": 101, "quantity": 2, "variant_id": 2, "addon_ids": [1] }
  ],
  "delivery_address_id": 5,
  "payment_method": "ONLINE",
  "coupon_code": "FOOD50",
  "delivery_notes": "Please ring bell and leave on shoe rack"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "order_id": 501,
    "order_number": "ORD-20261025-501",
    "order_status": "PLACED",
    "total_amount": 1314.00,
    "promised_delivery_time": "2026-10-25T19:35:00Z",
    "websocket_channel": "order:501"
  }
}
```

### 5.2 Transition Order State (Partner / Rider / Admin)
- **Endpoint:** `PUT /api/orders/{id}/status`
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "status": "PREPARING",
  "reason": "Chef accepted ticket and initiated cooking"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order_id": 501,
    "previous_status": "ACCEPTED",
    "current_status": "PREPARING",
    "event_timestamp": "2026-10-25T18:58:12Z"
  }
}
```

### 5.3 Order Events Audit Log
- **Endpoint:** `GET /api/orders/{id}/events`
- **Auth Required:** Yes
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "status": "PLACED", "created_at": "2026-10-25T18:55:00Z", "note": "Order placed with Razorpay transaction TXN_98712" },
    { "status": "ACCEPTED", "created_at": "2026-10-25T18:56:10Z", "note": "Kitchen acknowledged" },
    { "status": "PREPARING", "created_at": "2026-10-25T18:58:12Z", "note": "Chef started preparation" }
  ]
}
```

---

## 6. Fair-Pay Rider Protocol APIs

### 6.1 Available Dispatch Offers
- **Endpoint:** `GET /api/riders/jobs`
- **Auth Required:** Yes (Role: `RIDER`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "dispatch_id": 204,
      "order_id": 501,
      "restaurant_name": "Spice Symphony & Grill",
      "restaurant_address": "Indiranagar 100ft Rd, Bangalore",
      "customer_address": "Koramangala 4th Block, Bangalore",
      "pickup_distance_km": 1.2,
      "drop_distance_km": 3.8,
      "total_distance_km": 5.0,
      "fair_pay_breakdown": {
        "base_pay": 35.00,
        "distance_pay": 30.00,
        "estimated_wait_compensation": 12.00,
        "surge_incentive": 15.00,
        "total_estimated_payout": 92.00
      },
      "dish_items_count": 2,
      "timeout_seconds_remaining": 45
    }
  ]
}
```

### 6.2 Accept Job Dispatch
- **Endpoint:** `PUT /api/riders/jobs/{dispatchId}/accept`
- **Auth Required:** Yes (Role: `RIDER`)
- **Response (200 OK):** Returns confirmed dispatch task with customer phone and navigation waypoint links.

### 6.3 Zero-Penalty Job Rejection
- **Endpoint:** `PUT /api/riders/jobs/{dispatchId}/reject`
- **Auth Required:** Yes (Role: `RIDER`)
- **Request Body:**
```json
{
  "reason": "HEAVY_RAIN_NO_GEAR"
}
```
*(Reasons: `DISTANCE_TOO_FAR`, `PUNCTURE_MECHANICAL`, `HEAVY_RAIN_NO_GEAR`, `SHIFT_END`, `PERSONAL_EMERGENCY`)*
- **Response (200 OK):** Job reassigned to next nearest rider with 0 impact on acceptance rating or incentives.

### 6.4 Record Restaurant Arrival (Initiate Wait-Timer)
- **Endpoint:** `POST /api/riders/wait-timer`
- **Auth Required:** Yes (Role: `RIDER`)
- **Request Body:**
```json
{
  "dispatch_id": 204,
  "action": "ARRIVED_AT_RESTAURANT"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "wait_timer_started_at": "2026-10-25T19:12:00Z",
    "grace_period_minutes": 8,
    "compensation_rate_per_minute": 2.00,
    "status": "WAIT_METER_RUNNING"
  }
}
```

### 6.5 Push Live GPS Telemetry
- **Endpoint:** `POST /api/riders/location`
- **Auth Required:** Yes (Role: `RIDER`)
- **Request Body:**
```json
{
  "latitude": 12.9734,
  "longitude": 77.5998,
  "heading_degrees": 185.4,
  "speed_kmh": 28.5
}
```
- **Response (200 OK):** Broadcasts location update on subscribed `order:{orderId}` channel via WebSocket.

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
- **Endpoint:** `GET /api/realtime/sse?token=<jwt>`
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
