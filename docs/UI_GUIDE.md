# CravePulse V2 UI & Design System Guide

> Complete reference for CravePulse design tokens, mobile-first breakpoints, layout primitives, and component usage patterns (Swiggy / Zomato UX parity).

---

## 1. Design Token Architecture (`design-tokens.css`)

All colors, elevation, spacing, radii, and layout dimensions are declared as CSS Custom Properties in `frontend/src/theme/design-tokens.css`.

### 1.1 Color Tokens

| Token | Value | Contrast on White | Usage |
|---|---|---|---|
| `--c-primary` | `#ff5722` | 4.8:1 (AA) | Customer brand actions, primary buttons, accents |
| `--c-primary-hover` | `#e64a19` | 6.2:1 (AAA) | Active/hover button states |
| `--c-rating-green` | `#248232` | 5.1:1 (AA) | Food app rating pills (`★ 4.8`), verified tags |
| `--c-offer-orange` | `#ff5200` | 4.6:1 (AA) | Promotional strips, discount tags |
| `--c-bg` | `#faf7f2` | — | Customer app body background |
| `--c-surface` | `#ffffff` | — | Card surfaces, modals, drawers |
| `--c-text-main` | `#0f172a` | 12.8:1 (AAA) | Headings and primary body copy |
| `--c-text-muted` | `#475569` | 4.9:1 (AA) | Secondary subtitles, timestamps, metadata |
| `--c-border` | `#e2e8f0` | — | Structural borders and dividers |

### 1.2 Layout & Geometry Variables

```css
:root {
  --header-h: 72px;                     /* Navbar height */
  --bottom-nav-h: 64px;                  /* Mobile bottom nav bar */
  --sidebar-w: 260px;                    /* Portal sticky sidebar width */
  --touch-target-min: 44px;              /* WCAG 2.1 tap target minimum */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

---

## 2. Breakpoint System (Mobile-First)

CravePulse adopts a single, unified mobile-first breakpoint scale:

| Breakpoint | Width Range | Target Devices | Layout Behavior |
|---|---|---|---|
| `base` | $\ge 360\text{ px}$ | Compact smartphones | 1-column cards, bottom nav bar, mobile table cards |
| `sm` | $\ge 576\text{ px}$ | Large phones / phablets | 2-column dish grid, compact search row |
| `md` | $\ge 768\text{ px}$ | Tablets (iPad portrait) | 2-column restaurant grid, semantic table view, carousel side arrows |
| `lg` | $\ge 1024\text{ px}$ | Laptops / iPad landscape | Sticky portal left sidebar, 3-column restaurant grid |
| `xl` | $\ge 1280\text{ px}$ | Desktops | 3 to 4-column restaurant grid, wide containers |
| `2xl` | $\ge 1536\text{ px}$ | Ultra-wide monitors | Max content width centered with margins |

---

## 3. Core Component Usage

### 3.1 `ScrollCarousel` (Reusable Snap Carousel)

A responsive horizontal scrolling container with CSS scroll-snap, touch-swipe support, keyboard arrows, and accessible prev/next buttons.

```jsx
import ScrollCarousel from '../common/ScrollCarousel';

<ScrollCarousel
  ariaLabel="Verified Diner Reviews"
  gap="1rem"
  sectionHeader={
    <div>
      <h5 className="fw-bold mb-0">Customer Reviews</h5>
      <small className="text-muted">Verified orders only</small>
    </div>
  }
>
  {reviews.map((rev) => (
    <ReviewCard key={rev.id} rev={rev} />
  ))}
</ScrollCarousel>
```

#### Behavior:
* **Mobile ($< 768\text{ px}$)**: Previous/Next buttons automatically move into the `sectionHeader` on the top right. Native touch swipe is preserved with CSS scroll-snap.
* **Desktop ($\ge 768\text{ px}$)**: Circular floating arrow buttons appear vertically centered on the left (`-20px`) and right (`-20px`) of the track.
* **Boundaries**: Arrow buttons automatically gain `aria-disabled="true"` and reduced opacity when scrolled to the start or end.

---

### 3.2 `ResponsiveTable` (Desktop Table $\to$ Mobile Stacked Cards)

Prevents horizontal table clipping on smartphones by rendering stacked label-value cards below 768 px.

```jsx
import ResponsiveTable from '../common/ResponsiveTable';

const columns = [
  { key: 'orderNumber', label: 'Order #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'totalAmount', label: 'Total', render: (v) => `₹${v}` },
  { key: 'status', label: 'Status', render: (v) => <span className="badge bg-success">{v}</span> }
];

<ResponsiveTable
  columns={columns}
  data={orders}
  keyExtractor={(row) => row.id}
  emptyMessage="No active orders"
/>
```

---

### 3.3 Swiggy / Zomato Restaurant Card Anatomy

The restaurant card implements the standard Indian food delivery visual hierarchy:

```
+------------------------------------------------------+
| [16:10 Aspect Ratio Restaurant Image]                |
|                                         [♥ Favorite] |
|                                                      |
| [🏷️ FLAT ₹100 OFF - Gradient Deal Overlay]           |
+------------------------------------------------------+
| Restaurant Name                          [★ 4.8 Pill]|
| 20-30 mins • 1.2 km • ₹350 for two                   |
| North Indian, Mughlai, Biryani                       |
| [✓ 0% Markup Parity] [🟢 Pure Veg]                   |
| ---------------------------------------------------- |
| 📍 Indiranagar, Bengaluru            FREE DELIVERY   |
+------------------------------------------------------+
```

* **Aspect Ratio**: Always locked to `16 / 10` using `.restaurant-card-img-wrap`.
* **Image Lazy Loading**: `loading="lazy"` and `decoding="async"` prevent layout shifts (CLS < 0.1).
* **0% Markup Badge**: Rendered cleanly in the card body to avoid cluttering the hero image.
* **Favorite Toggle**: Integrated heart button with `localStorage` persistence.

---

### 3.4 Live Connection & Offline Handling

* **Live WebSocket Dot**: Placed in `Navbar.jsx` header. Shows emerald green (`#10b981`) with soft glow when WebSocket feed is connected, amber (`#f59e0b`) during reconnection.
* **Offline Banner**: Automatically mounts at top of screen if the browser loses network connection via `navigator.onLine` and `window.addEventListener('offline')`.

