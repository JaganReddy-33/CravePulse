# CravePulse V2 Architectural & Design Decisions

## 1. Reviews Component: Horizontal Scroll Carousel
- **Decision**: Replaced vertical stacked review cards with a responsive horizontal carousel featuring touch swipe support, keyboard arrow navigation, and responsive circular navigation buttons (placed on track edges on desktop >= 768px and in section header on mobile < 768px).
- **Reason**: Long vertical stack bloated the restaurant menu page, delaying diner access to cart and bottom navigation. Horizontal snap layout follows the standard UX pattern of Swiggy and Zomato.

## 2. Real API Reviews & Zero Fake Data
- **Decision**: Connected `RestaurantReviews.jsx` to `GET /api/reviews/restaurant/{id}`. Removed hardcoded fake reviews (`Ananya Sharma`, `Vikram Mehta`, `Priya Sundaram`) and fake counts (`1420+`).
- **Reason**: Production transparency. If an outlet has no reviews yet, an empty state encourages the customer to be the first to review after their order.

## 3. Zomato & Swiggy Food Delivery Card Aesthetics
- **Decision**: Standardized restaurant cards with:
  - 16:10 aspect ratio banner images with `loading="lazy"` and `decoding="async"`.
  - Signature bottom-gradient deal overlay strip (`🏷️ FLAT ₹100 OFF` or `50% OFF UPTO ₹100`).
  - Interactive top-right heart favorite toggle button with local persistence.
  - Green rating pill (`★ 4.8`) and compact `ETA • Distance • Cost for two` row.
  - Cleaned badges out of the image into structured tags in the card body.

## 4. Security & Sanitization
- **Decision**: Replaced raw `new Thread` in `OrderServlet` with `dispatchService.scheduleDispatch(orderId, delayMillis)` using `dispatchScheduler`.
- **Decision**: Sanitized 7 servlet catch blocks that returned `e.getMessage()` on HTTP 500 responses with generic messages, logging the full stack trace internally.
- **Decision**: Gated simulation buttons (UPI QR scan simulation, Rider dispatch simulation, simulated GPS hub) behind `VITE_DEMO_MODE === 'true'`.
- **Decision**: Purged committed personal names and default database passwords from `AppProperties.java`, `docker-compose.yml`, `.env.example`, and frontend `.env.example`.
