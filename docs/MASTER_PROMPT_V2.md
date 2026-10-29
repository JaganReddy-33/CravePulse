
# CravePulse V2 – Master Prompt: Design, Responsiveness, Reviews Carousel and Remaining Defects

## Role

You are a principal front-end engineer and product designer (Zomato/Swiggy-level polish) who also reviews back-end hygiene. The CravePulse app already has working security, payment and dispatch layers. Your job now is to make it **look and behave like a real, fast, real-time food delivery app on every device** (360 px phones to 1440 px+ desktops), remove the fake-data fallbacks that still remain, and close the last hygiene gaps.

## Fixed stack (do not change)

Backend: Java 17+, Jakarta Servlets, JDBC, HikariCP, MySQL/TiDB. Frontend: React 18, Vite, React Router, Axios, Bootstrap 5, Leaflet. **No Spring/Hibernate/Lombok.** You may add small dev dependencies (Playwright, axe-core, Vitest) but no UI framework swap (no Tailwind/MUI migration).

## Operating rules

1. **Look at the real UI.** Run the app (`npm run dev` + backend) and use the browser to take screenshots at **360×740, 390×844, 768×1024, 1024×768, 1440×900** before and after each change. Save them in `docs/screenshots/<phase>/`. Do not claim "responsive" without screenshots.
2. **Mobile-first.** Write base styles for 360 px, then enhance with `min-width` queries. No new `max-width` override stacks and no new `!important`.
3. **One source of truth** for design: `src/theme/design-tokens.css`. Other CSS files may only use tokens.
4. **No fake data in production paths.** If an API fails, show an error state with Retry. Demo data lives only in seed SQL.
5. After each phase: `npm run build`, `npm test`, `mvn clean verify`, fix failures, commit once per phase, then report: files changed, screenshots, what to verify.
6. If something is ambiguous choose the safest option, record it in `docs/DECISIONS.md` and continue.

---

## Findings this prompt must fix (from the code review of CravePulse_v1)

### Design and responsiveness
- Responsiveness is built from a **patchwork**: 17 media queries in `App.css`, 7 in `design-tokens.css`, more in `portals.css`, with overlapping ranges and breakpoints that disagree (Bootstrap 576/768/992/1200 vs tokens 390/1024/1440), plus `!important` overrides (e.g. `.container{padding:… !important}`).
- Hard-coded layout numbers: `rider-cockpit-main{padding-top:142px}`, `.mobile-search-below-nav{top:72px}`, restaurant image `height:180` inline, sidebars `width:250/260/280`, `100vh` (breaks under mobile browser toolbars; use `dvh`).
- Restaurant cards: fixed 180 px image, five badges stacked on the image, no consistent aspect ratio, no rating/ETA/distance/cost-for-two row like Zomato/Swiggy.
- **Reviews are a tall vertical stack** (`d-flex flex-column gap-3`) that makes the restaurant page very long.
- Images: 23 `<img>` tags, only 1 with `loading="lazy"`, none with `srcset` or width/height (layout shift), 55 remote Unsplash URLs.
- Render-blocking external CSS (Leaflet CSS from unpkg), duplicate icon/font loading.

### Real defects still in the code
1. **Reviews are never fetched.** `RestaurantDetail.jsx` renders `<RestaurantReviews rating totalReviews />` with no `reviews` prop, so every restaurant shows the same three **hard-coded fake reviews** (Ananya Sharma, Vikram Mehta, Priya Sundaram) and a fake "1420+" count. The backend endpoint `GET /api/reviews/restaurant/{id}` exists but is unused.
2. **Fake fallbacks remain:** `FALLBACK_RESTAURANTS` in `CustomerHome.jsx`, `FALLBACK_CATALOG` in `RestaurantDetail.jsx` (both with `totalReviews: 1420`), simulated GPS hub in `Navbar.jsx`, "Simulate QR Code Scanned & Paid" in `UpiPaymentDrawer.jsx`, "Simulated verification accepts any 4+ digit OTP" in `CustomerProfile.jsx`, "Simulate Incoming Delivery Dispatch" in `RiderActiveJob.jsx`.
3. **Deployment risk on Vercel:** `vercel.json` rewrites `/(.*)` to `index.html`. If `VITE_API_URL` is not set in Vercel, `/api/*` calls return HTML, and the fallbacks above hide the failure by showing fake restaurants. The committed `frontend/.env` points to `localhost:8081`.
4. **Secrets still committed:** the DB password and JWT secret appear in `application.properties`, as defaults in `AppProperties.java`, in `docker-compose.yml` and `.env.example`. They must be rotated and removed from the repo and git history.
5. 500 responses still leak `e.getMessage()` (7 places in the servlets).
6. Access and refresh tokens are still stored in `localStorage` (XSS exposure).
7. Hard-coded personal names remain in config (`VITE_FOUNDER_NAME=Jaganmohan Reddy`) and `.env` files are committed.
8. Raw `new Thread(...)` still used in `OrderServlet` (order dispatch kick-off).
9. Tests exist (backend and Vitest/Playwright files) but their pass/fail status was not verified in this review; many are named "depth tests" and should be checked for real assertions.

---

## PHASE A – Truth and deployment (do this first)

- [ ] Delete `FALLBACK_RESTAURANTS`, `FALLBACK_CATALOG`, `defaultReviews`, and every hard-coded `totalReviews: 1420`. Replace with real API data and proper **loading / empty / error** states (use the existing `states/` components, with a Retry button).
- [ ] Remove or gate behind `VITE_DEMO_MODE`: the simulated hub in `Navbar.jsx`, "Simulate QR Code Scanned & Paid", simulated OTP acceptance (real OTP via backend or hide the feature), and the rider "Simulate Incoming Dispatch" button. In production builds none of these may be reachable.
- [ ] **Vercel wiring:** add a `vercel.json` rewrite that proxies `/api/:path*` to the Render backend **before** the SPA catch-all, or require `VITE_API_URL` and fail the build if it is missing. Set `VITE_WS_URL` (wss). Add the Vercel domain to the backend `CORS_ORIGINS` and WebSocket origin check. Add a visible "Cannot reach server" banner when `/api/health` fails.
- [ ] Remove committed `.env` files; keep only `.env.example` with placeholders; replace `VITE_FOUNDER_NAME` personal data with a neutral value.
- [ ] **Secrets:** remove every real secret and default from `application.properties`, `AppProperties.java`, `docker-compose.yml`, `.env.example`; fail fast if `DB_PASSWORD` / `JWT_SECRET` are missing; document rotation in `SECURITY.md` and tell me exactly which values I must rotate (DB password, JWT secret, Razorpay keys) and that git history must be cleaned (`git filter-repo` or a fresh repo).
- [ ] Replace `e.getMessage()` in 500 responses with a generic message + request id (log the detail).
- [ ] Replace the raw `new Thread` in `OrderServlet` with the existing scheduled dispatch executor.
- [ ] Token storage: move the refresh token to an `HttpOnly; Secure; SameSite` cookie (access token in memory), or document the trade-off in `SECURITY.md` if you keep localStorage.

---

## PHASE B – Design system and responsive foundation

1. **Consolidate CSS.** Keep Bootstrap 5, but make `design-tokens.css` the single source: colors, type scale, spacing, radius, shadows, z-index scale, and layout variables (`--header-h`, `--bottom-nav-h`, `--sidebar-w`, `--safe-top/bottom`). Override Bootstrap through its CSS variables (`--bs-*`). Delete duplicate or dead rules from `App.css`, `portals.css`, `variables.css`.
2. **One breakpoint set (mobile-first):** 360 base, 576, 768, 1024, 1280, 1536. Replace all overlapping `max-width` stacks with `min-width` queries. Zero `!important` except for documented utility classes.
3. **Fluid type and spacing:** use `clamp()` for headings and section padding; body text ≥ 15 px on mobile; 44 px minimum touch targets; consistent 8 px spacing scale.
4. **Layout variables instead of magic numbers:** header height, bottom-nav height and sidebar width come from variables; use `100dvh` (with `100vh` fallback); `position: sticky` offsets use `var(--header-h)`.
5. **Layout primitives:** build small reusable components/classes: `PageContainer`, `Section` (title + "See all"), `ResponsiveGrid` (CSS grid `repeat(auto-fill, minmax(min(100%, 280px), 1fr))`), `Stack`, `Cluster`, `Card`, `Chip`, `Skeleton`.
6. **Tables → cards on mobile** for admin, partner and rider screens (a `ResponsiveTable` that renders stacked label/value cards below 768 px instead of a sideways-scrolling table).
7. **Portals:** partner, rider and admin use a collapsible sidebar on ≥ 1024 px and a top bar + slide-in drawer (or bottom tab bar for rider) below that. Respect safe areas and the on-screen keyboard.
8. **Dark portals** (rider/admin) must pass AA contrast; define their tokens once.
9. **Quality gate:** add a Playwright test `e2e/visual-layout.spec.js` that visits every public and portal route at the five viewports and asserts: no horizontal scroll (`document.documentElement.scrollWidth <= window.innerWidth`), no element wider than the viewport, tap targets ≥ 44 px for buttons and links, and saves screenshots. Add `axe-core` checks for serious/critical violations.

---

## PHASE C – Reviews carousel (explicit requirement)

Replace the vertical review list with a **horizontal, side-by-side carousel** that has **clickable left/right arrow buttons**. Build it as a reusable `ScrollCarousel` component first, then `RestaurantReviews` on top of it.

### `ScrollCarousel` (reusable)
- A horizontal flex track with CSS `scroll-snap-type: x mandatory`, `scroll-snap-align: start`, `scroll-behavior: smooth`, `overscroll-behavior-x: contain`, hidden scrollbar, `gap` from tokens, and edge padding that aligns with the page container.
- **Prev / Next arrow buttons** (circular, 40–44 px, `‹` and `›` icons, `aria-label="Previous reviews"` / `"Next reviews"`), vertically centred on the track edges on ≥ 768 px and placed in the section header on mobile. They scroll by one "page" (visible width minus one card). **Disabled state at the start/end** (use `aria-disabled`, reduced opacity). Update the state with `scroll` events and `ResizeObserver`.
- Swipe/drag on touch and trackpad (native scroll), mouse drag optional. Keyboard: the track is focusable (`tabindex=0`, `role="region"`, `aria-roledescription="carousel"`), Left/Right arrows scroll, Home/End jump. Edge fade gradients to hint that more cards exist.
- Optional position indicator ("3 / 12" or dots), `prefers-reduced-motion` disables smooth scrolling.
- No layout shift: cards have fixed width so the track never reflows.

### `RestaurantReviews`
- Fetch real data: `GET /api/reviews/restaurant/{id}` (add pagination/`limit` support and the rating distribution if missing). Loading → skeleton cards; empty → "No reviews yet – be the first after your order"; error → Retry.
- Header: big average rating, star row, total count, and a **rating distribution** (5→1 star bars). Keep the sort control (Most recent / Highest / Lowest) and make it work server-side or on the loaded page.
- **Review card:** fixed width (`min(86vw, 320px)` on mobile, 340–360 px on desktop), equal height, avatar (initials fallback instead of a random photo), name, "Verified order" badge, date, stars, text clamped to 4 lines with **Read more** (opens a modal or expands in place), optional photo thumbnails, restaurant reply if present.
- Show about 1.2 cards on 360 px (peek of the next card), 2 on 768 px, 3 on 1024 px, 4 on 1440 px.
- Also reuse `ScrollCarousel` for: the offers strip, the home-page category chips ("What's on your mind?"), "Top picks near you", and "Order again".
- Tests: Vitest for scroll-state logic (disabled at ends), Playwright for clicking next/prev and checking the visible card changes at 360 px and 1440 px.

---

## PHASE D – Zomato/Swiggy-class card design and page layouts

### Restaurant card (home and search)
- Image with `aspect-ratio: 16/10`, `object-fit: cover`, `loading="lazy"`, `decoding="async"`, explicit width/height, a bottom gradient overlay carrying the best offer ("Flat ₹100 off above ₹499"), and a favourite (heart) button.
- Body in this order: **name** (1 line, ellipsis) → **green rating pill** + review count → **ETA • distance • cost for two** → **cuisines** (1 line, ellipsis) → small badges (Pure Veg, Free delivery, 0% markup). Move the "0% Markup Parity" badge out of the image into a single small chip in the body so the image stays clean.
- States: closed (greyed with "Opens at 11 AM"), busy/throttled (small amber chip), not-deliverable (disabled with reason).
- Grid: CSS grid `auto-fill, minmax(280px, 1fr)`; one column on phones with comfortable 16 px gutters, 2–4 columns up the breakpoints. Equal card heights, hover lift only on pointer devices.

### Dish card (restaurant page)
- Horizontal layout on all sizes: text left (veg/non-veg mark, name, bestseller tag, price, rating, 2-line description), image right (96–120 px square, rounded) with an **ADD** button overlapping the image bottom; stepper after adding; "Customisable" hint.

### Page layouts
- **Home:** sticky header with location + search; live-order banner when the user has an active order ("Order out for delivery · Track"); category chips carousel; filter chips row (horizontal scroll); restaurant grid; skeleton grid while loading.
- **Restaurant page:** compact sticky header after scroll, sticky horizontal category tabs with scroll-spy, offers carousel, menu list, reviews carousel, floating **cart bar** on mobile ("2 items · ₹560 · View cart") above the bottom nav.
- **Checkout:** single-column on mobile with a sticky "Pay ₹X" bar; two-column on desktop (details left, bill right).
- **Tracking:** map at the top (50 % of the viewport on mobile, collapsible), draggable bottom sheet with timeline, rider card and OTP; side-by-side on desktop.
- **Footer** compact on mobile (accordion sections) and hidden behind the bottom nav only where necessary.

---

## PHASE E – "Feels real-time": perceived performance and motion

- **Skeletons shaped like the final content** for every list and page; no spinners on first load.
- **Optimistic UI** for add-to-cart, favourites and notification read; roll back with a toast on failure.
- **Live feedback:** WebSocket connection indicator (dot), toasts for order status changes, `aria-live` region for screen readers, subtle status-change animation on the timeline.
- **Images:** serve right-sized URLs (`?w=400`, `?w=800` with `srcset`/`sizes`), WebP/AVIF where available, blur-up or dominant-colour placeholders, and width/height attributes to remove layout shift.
- **Loading:** self-host or `import` Leaflet CSS from the npm package (no render-blocking unpkg), `font-display: swap`, preload the primary font, defer Bootstrap JS (or remove it and use React for dropdowns/modals), code-split per route and per heavy widget (map, charts).
- **Motion:** 150–250 ms transitions with `transform/opacity` only; respect `prefers-reduced-motion`.
- **Offline/slow network:** friendly offline banner, retry with backoff, keep last good data visible while refreshing.
- Targets: Lighthouse mobile **Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95**, LCP < 2.5 s, CLS < 0.1 on the home and restaurant pages.

---

## PHASE F – Portal polish (partner, rider, admin)

- Partner: kanban columns become a swipeable single-column tab view on mobile; new-order alert is a full-width sticky card with Accept/Reject and a prep-time chooser; analytics charts resize and use compact legends.
- Rider: one-hand-friendly layout, large primary action button fixed at the bottom, status steps as a stepper, map above the fold, offer card with a countdown ring.
- Admin: dense tables become `ResponsiveTable`, filters in a collapsible panel, sticky table header on desktop.
- All portals: consistent empty, loading and error states; focus rings; keyboard navigation; no overlapping fixed bars (header + bottom nav + toasts share one z-index scale).

---

## PHASE G – Tests, docs and proof

- Run and fix **all** existing tests; replace any placeholder assertions in the "depth" test classes with real behaviour checks, and tell me the actual pass/fail numbers (backend, Vitest, Playwright).
- Add the visual/layout Playwright suite from Phase B and the carousel tests from Phase C to CI.
- Update `README.md` and `docs/` so every claim matches the code; add `docs/UI_GUIDE.md` (tokens, breakpoints, components, carousel usage) and `docs/screenshots/` with before/after images.

---

## Acceptance criteria (all must pass)

- [ ] No horizontal scroll and no clipped content on any route at 360, 390, 768, 1024, 1440 px (Playwright proves it).
- [ ] Review section is a horizontal carousel with working prev/next buttons, disabled at the ends, swipe and keyboard support, loads real reviews, and shows a proper empty state. No hard-coded reviews or counts anywhere.
- [ ] No fallback or simulated data is reachable in a production build; killing the backend shows error states.
- [ ] The deployed Vercel site calls the Render API successfully (verified in the Network tab), WebSocket connects over `wss`, and CORS is correct.
- [ ] No secrets or default credentials in the repo; app refuses to start without required env vars; I have a list of values to rotate.
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95 on home and restaurant pages; CLS < 0.1.
- [ ] CSS has one token source, one breakpoint set, and no new `!important`.
- [ ] Backend, Vitest and Playwright suites pass in CI.

## Final output format

Return: (a) a phase-by-phase changelog with file lists, (b) before/after screenshot links per viewport, (c) a table of every finding above with Fixed/Deferred and the commit, (d) real test and Lighthouse numbers, (e) a short list of anything that needs my decision (for example secret rotation and git history clean-up), and (f) exact steps to run and verify locally and on Vercel/Render.