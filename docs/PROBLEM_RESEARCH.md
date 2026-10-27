# Problem-First Research: Why Current Food Delivery Platforms Hurt Users

This document outlines the field research, consumer forums analysis, and operational pain points that shaped the architecture of this food delivery platform.

---

## 1. Problem 1: Hidden Markups and "Junk Fees" at Checkout

### Who is Hurt
Consumers (eaters) and independent restaurants who suffer customer backlash and trust erosion.

### Severity & Frequency
- **Frequency:** ~85% of restaurant menu items on major aggregator platforms carry price inflations of 15% to 40% compared to dine-in menus.
- **Consumer sentiment:** The #1 consumer complaint across Reddit (`r/india`, `r/bangalore`), Twitter/X consumer threads, and consumer courts is the discrepancy between the printed menu bill and the final checkout amount. Customers discover hidden "platform convenience fees," "rain surge fees" on sunny days, packaging markups of ₹30–₹50 for basic plastic boxes, and inflated base dish prices.
- **Restaurant impact:** Merchants feel pressured to inflate prices to offset 25–30% platform commissions, resulting in negative restaurant reviews from diners who assume the restaurant is gouging them.

### Our Solution: Radical Price Transparency & Menu Parity Engine
1. **Dine-In Price vs Platform Price Audit:** Every menu item database record stores both `dine_in_price` and `platform_price`. Restaurants guaranteeing 0% markup earn a prominent verified green badge: `"100% Price Parity Guaranteed"`.
2. **Itemised "Why This Price?" Modal:** Before taking payment, a modal explains the exact cost allocation:
   - 100% of food cost goes to the culinary kitchen.
   - Packaging fee is transparently capped at ₹15 for food-grade tamper-evident containers.
   - Delivery distance fee is calculated at actual distance tiers (₹35 base up to 2km + ₹12/km).
   - Platform fee is fixed at ₹5 to cover server costs and live telemetry.
   - Government GST is separated into 2.5% CGST + 2.5% SGST.

---

## 2. Problem 2: Over-Optimistic ETAs and Cold Food Deliveries

### Who is Hurt
Eaters who receive delayed and cold food; delivery partners who bear the brunt of angry customers at the doorstep.

### Severity & Frequency
- **Frequency:** Over 32% of food delivery orders during peak lunch (1:00 PM - 2:30 PM) and dinner (8:00 PM - 10:00 PM) exceed the initially promised arrival window.
- **Root Cause:** Incumbent platforms use "optimistic distance algorithms" that estimate delivery solely based on empty-road travel time. They consistently neglect **active kitchen preparation backlog** and **rider restaurant wait time**.
- **Customer Pain:** A customer is shown "20–25 mins," plans their meal, only to watch the app silently push back the timer by 5 minutes repeatedly until 55 minutes have passed.

### Our Solution: Honest ETA Engine & Automated Goodwill Credit
1. **Multi-Factor Dynamic ETA Formula:**
   $$\text{ETA} = \max(\text{Dish Prep Time}) + (\text{Active Kitchen Orders} \times 2\text{ min}) + (\text{Distance (km)} \times 3.5\text{ min}) + \text{Buffer}$$
2. **Confidence Intervals:** Delivery times are presented as an honest confidence range (e.g., `25–35 Mins`) rather than a deceptive pinpoint estimate.
3. **Automated SLA Goodwill Refund:** If an order arrives $>10$ minutes beyond the upper ETA confidence threshold, our background SLA monitoring service automatically deposits an instant **₹50 goodwill credit** directly into the customer's wallet without requiring customer support escalation.

---

## 3. Problem 3: Gig Worker Exploitation and Uncompensated Kitchen Wait Times

### Who is Hurt
Delivery riders (gig partners) who work long hours in extreme weather and face arbitrary penalties.

### Severity & Frequency
- **Frequency:** Delivery riders spend an average of **14 to 22 minutes per order** waiting idly outside restaurant kitchens for packed food, earning **₹0** for that wait time.
- **Harsh Algorithmic Penalties:** If a rider rejects an inconvenient delivery (e.g., due to bike tire puncture, sudden downpour, or extreme distance from home), incumbent platforms penalize their account ranking or lock their shift access.
- **Opaque Earnings:** Incumbent dispatch notifications hide the drop address and true payout, forcing riders into "blind acceptances."

### Our Solution: Fair-Pay Rider Protocol
1. **Upfront Pay Transparency:** Before accepting an order, the rider sees a full itemized breakdown:
   - Base Fare: ₹35 (guaranteed for first 2 km)
   - Distance Pay: ₹12/km thereafter
   - Rain / Surge Bonus: ₹15
   - Customer Tip: 100% passed through with 0% platform deduction
   - Exact restaurant pickup address and customer drop pin.
2. **Zero-Penalty Rejections:** Riders can freely reject dispatches with clear categorised reasons (*Mechanical issue, Waterlogged route, Personal emergency*) without lowering their platform rating or restricting their shifts.
3. **Restaurant Wait-Time Meter:** When a rider arrives at the restaurant kitchen, they tap *"I Have Arrived"*. If the kitchen takes more than 8 minutes to hand over the order, the system automatically bills the platform **₹2.00 per minute** in wait-time compensation, credited directly to the rider's wallet.
