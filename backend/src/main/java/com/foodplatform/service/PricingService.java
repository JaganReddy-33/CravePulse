package com.foodplatform.service;

import com.foodplatform.dao.MenuDao;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.PlatformSettingDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.MenuDaoImpl;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.PlatformSettingDaoImpl;
import com.foodplatform.daoImpl.RestaurantDaoImpl;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PricingService {

    private final MenuDao menuDao;
    private final RestaurantDao restaurantDao;
    private final WalletDao walletDao;
    private final PlatformSettingDao platformSettingDao;
    private final OrderDao orderDao;

    public PricingService() {
        this(new MenuDaoImpl(), new RestaurantDaoImpl(), new WalletDaoImpl(), new PlatformSettingDaoImpl(), new OrderDaoImpl());
    }

    public PricingService(MenuDao menuDao, RestaurantDao restaurantDao, WalletDao walletDao) {
        this(menuDao, restaurantDao, walletDao, new PlatformSettingDaoImpl(), new OrderDaoImpl());
    }

    public PricingService(MenuDao menuDao, RestaurantDao restaurantDao, WalletDao walletDao, PlatformSettingDao platformSettingDao) {
        this(menuDao, restaurantDao, walletDao, platformSettingDao, new OrderDaoImpl());
    }

    public PricingService(MenuDao menuDao, RestaurantDao restaurantDao, WalletDao walletDao, PlatformSettingDao platformSettingDao, OrderDao orderDao) {
        this.menuDao = menuDao;
        this.restaurantDao = restaurantDao;
        this.walletDao = walletDao;
        this.platformSettingDao = platformSettingDao;
        this.orderDao = orderDao;
    }

    public static class CartInputItem {
        public long menuItemId;
        public int quantity;
        public Long variantId;
        public List<Long> addonIds = new ArrayList<>();
    }

    public static class PriceCalculationResult {
        public BigDecimal subtotal = BigDecimal.ZERO;
        public BigDecimal dineInSubtotal = BigDecimal.ZERO;
        public BigDecimal restaurantDiscount = BigDecimal.ZERO;
        public Long couponId;
        public String couponCode;
        public BigDecimal couponDiscount = BigDecimal.ZERO;
        public BigDecimal packagingFee = BigDecimal.valueOf(15.00);
        public BigDecimal deliveryFee = BigDecimal.valueOf(35.00);
        public BigDecimal platformFee = BigDecimal.valueOf(5.00);
        public BigDecimal gstTax = BigDecimal.ZERO;
        public BigDecimal tipAmount = BigDecimal.ZERO;
        public BigDecimal totalAmount = BigDecimal.ZERO;
        public double distanceKm = 2.5;
        public int etaMinMinutes = 25;
        public int etaMaxMinutes = 35;
        public List<Map<String, Object>> itemisedBill = new ArrayList<>();
        public Map<String, Object> priceTransparency = new HashMap<>();
    }

    private String getSetting(String key, String defaultValue) {
        if (platformSettingDao == null) return defaultValue;
        String val = platformSettingDao.getSettingValue(key, defaultValue);
        return val != null ? val : defaultValue;
    }

    public PriceCalculationResult calculateBill(long restaurantId, List<CartInputItem> items, Double userLat, Double userLng, String couponCode) {
        return calculateBill(restaurantId, items, userLat, userLng, couponCode, null);
    }

    public PriceCalculationResult calculateBill(long restaurantId, List<CartInputItem> items, Double userLat, Double userLng, String couponCode, Long customerId) {
        PriceCalculationResult result = new PriceCalculationResult();

        Restaurant restaurant = restaurantDao.findById(restaurantId);
        if (restaurant == null) {
            throw new IllegalArgumentException("Restaurant not found: " + restaurantId);
        }

        // Distance & delivery radius calculation
        if (userLat == null || userLng == null || !Double.isFinite(userLat) || !Double.isFinite(userLng) || Math.abs(userLat)>90 || Math.abs(userLng)>180 || restaurant.getLatitude()==null || restaurant.getLongitude()==null) throw new IllegalArgumentException("Valid delivery and kitchen coordinates are required for pricing");
        double lat = userLat, lng = userLng;
        double restLat = restaurant.getLatitude().doubleValue(), restLng = restaurant.getLongitude().doubleValue();
        double distance = calculateHaversineDistance(restLat, restLng, lat, lng);
        result.distanceKm = Math.round(distance * 10.0) / 10.0;

        double maxRadius = Double.parseDouble(getSetting("max_delivery_radius_km", "15.0"));
        if (result.distanceKm > maxRadius) {
            throw new IllegalArgumentException("Delivery address is outside restaurant delivery radius of " + maxRadius + " km (distance: " + result.distanceKm + " km).");
        }

        BigDecimal platformSum = BigDecimal.ZERO;
        BigDecimal dineInSum = BigDecimal.ZERO;
        BigDecimal packagingSum = BigDecimal.ZERO;
        int maxItemPrepTime = 15;

        for (CartInputItem inItem : items) {
            if (inItem.quantity < 1 || inItem.quantity > 20) {
                throw new IllegalArgumentException("Item quantity must be between 1 and 20 (got " + inItem.quantity + ").");
            }

            MenuItem mi = menuDao.getItemById(inItem.menuItemId);
            if (mi == null) {
                throw new IllegalArgumentException("Menu item not found: " + inItem.menuItemId);
            }
            if (!mi.isAvailable()) {
                throw new IllegalStateException("Item '" + mi.getName() + "' is currently unavailable.");
            }
            if (mi.getRestaurantId() != null && !mi.getRestaurantId().equals(restaurantId)) {
                throw new IllegalArgumentException("Item '" + mi.getName() + "' does not belong to the selected restaurant.");
            }

            BigDecimal unitPlatformPrice = mi.getPlatformPrice();
            BigDecimal unitDineInPrice = mi.getDineInPrice();
            String variantName = null;

            // Variant adjustments
            if (inItem.variantId != null && mi.getVariants() != null) {
                boolean variantFound = false;
                for (MenuItemVariant v : mi.getVariants()) {
                    if (v.getId().equals(inItem.variantId)) {
                        unitPlatformPrice = unitPlatformPrice.add(v.getPriceAdjustment());
                        unitDineInPrice = unitDineInPrice.add(v.getPriceAdjustment());
                        variantName = v.getVariantName();
                        variantFound = true;
                        break;
                    }
                }
                if (!variantFound && !mi.getVariants().isEmpty()) {
                    throw new IllegalArgumentException("Selected variant does not belong to item: " + mi.getName());
                }
            }

            // Addon adjustments - multiplied by item quantity
            BigDecimal unitAddonTotal = BigDecimal.ZERO;
            List<String> addonNames = new ArrayList<>();
            if (inItem.addonIds != null && !inItem.addonIds.isEmpty() && mi.getAddons() != null) {
                for (Long addonId : inItem.addonIds) {
                    boolean addonFound = false;
                    for (MenuItemAddon a : mi.getAddons()) {
                        if (a.getId().equals(addonId)) {
                            unitAddonTotal = unitAddonTotal.add(a.getPrice());
                            addonNames.add(a.getAddonName());
                            addonFound = true;
                            break;
                        }
                    }
                    if (!addonFound && !mi.getAddons().isEmpty()) {
                        throw new IllegalArgumentException("Selected add-on does not belong to item: " + mi.getName());
                    }
                }
            }

            BigDecimal itemLineTotal = unitPlatformPrice.add(unitAddonTotal).multiply(BigDecimal.valueOf(inItem.quantity));
            BigDecimal dineInLineTotal = unitDineInPrice.add(unitAddonTotal).multiply(BigDecimal.valueOf(inItem.quantity));

            platformSum = platformSum.add(itemLineTotal);
            dineInSum = dineInSum.add(dineInLineTotal);

            if (mi.getPackagingCharge() != null && mi.getPackagingCharge().compareTo(BigDecimal.ZERO) > 0) {
                packagingSum = packagingSum.add(mi.getPackagingCharge().multiply(BigDecimal.valueOf(inItem.quantity)));
            }

            if (mi.getPrepTimeMinutes() > maxItemPrepTime) {
                maxItemPrepTime = mi.getPrepTimeMinutes();
            }

            Map<String, Object> billItem = new HashMap<>();
            billItem.put("menuItemId", mi.getId());
            billItem.put("name", mi.getName());
            billItem.put("variantName", variantName);
            billItem.put("quantity", inItem.quantity);
            billItem.put("unitPrice", unitPlatformPrice);
            billItem.put("dineInPrice", unitDineInPrice);
            billItem.put("addonNames", String.join(", ", addonNames));
            billItem.put("addonTotal", unitAddonTotal.multiply(BigDecimal.valueOf(inItem.quantity)));
            billItem.put("lineTotal", itemLineTotal);
            billItem.put("hasPriceParity", unitPlatformPrice.compareTo(unitDineInPrice) == 0);
            result.itemisedBill.add(billItem);
        }

        result.subtotal = platformSum.setScale(2, RoundingMode.HALF_UP);
        result.dineInSubtotal = dineInSum.setScale(2, RoundingMode.HALF_UP);

        // Delivery fee: dynamic base (first 2km) + per km thereafter with free delivery check
        boolean freeDeliveryEnabled = Boolean.parseBoolean(getSetting("enable_free_delivery", "false"));
        BigDecimal freeDeliveryThreshold = new BigDecimal(getSetting("free_delivery_threshold", "499.00"));

        if (freeDeliveryEnabled && result.subtotal.compareTo(freeDeliveryThreshold) >= 0) {
            result.deliveryFee = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            BigDecimal baseDelivery = new BigDecimal(getSetting("base_delivery_fee", "35.00"));
            BigDecimal perKm = new BigDecimal(getSetting("per_km_delivery_fee", "12.00"));
            BigDecimal extraKm = BigDecimal.valueOf(Math.max(0.0, result.distanceKm - 2.0));
            BigDecimal distanceFee = extraKm.multiply(perKm);
            BigDecimal surgeMultiplier = new BigDecimal(getSetting("surge_multiplier", "1.00"));
            BigDecimal rainSurge = new BigDecimal(getSetting("rain_surge_fee", "0.00"));
            result.deliveryFee = baseDelivery.add(distanceFee).multiply(surgeMultiplier).add(rainSurge).setScale(2, RoundingMode.HALF_UP);
        }

        // Coupon rules: active window, min order, per-user limit, global limit, first-order-only, restaurant-specific
        if (couponCode != null && !couponCode.isBlank()) {
            Coupon coupon = walletDao.getCouponByCode(couponCode.trim().toUpperCase());
            if (coupon != null) {
                if (!coupon.isActive()) {
                    throw new IllegalArgumentException("Coupon " + couponCode + " is not active.");
                }
                if (coupon.getUsageLimit() > 0 && coupon.getTimesUsed() >= coupon.getUsageLimit()) {
                    throw new IllegalArgumentException("Coupon " + couponCode + " has reached its global usage limit.");
                }
                if (coupon.getRestaurantId() != null && !coupon.getRestaurantId().equals(restaurantId)) {
                    throw new IllegalArgumentException("Coupon " + couponCode + " is not valid for this restaurant.");
                }
                if (coupon.isFirstOrderOnly() && customerId != null && orderDao != null) {
                    int previousOrders = orderDao.getCustomerOrderCount(customerId);
                    if (previousOrders > 0) {
                        throw new IllegalArgumentException("Coupon " + couponCode + " is valid only on your first order.");
                    }
                }
                if (customerId != null && coupon.getPerUserLimit() > 0 && walletDao != null) {
                    int userUsage = walletDao.getCouponUsageCountByUser(customerId, coupon.getId());
                    if (userUsage >= coupon.getPerUserLimit()) {
                        throw new IllegalArgumentException("You have already reached the maximum usage limit for coupon " + couponCode + ".");
                    }
                }
                if (result.subtotal.compareTo(coupon.getMinOrderAmount()) >= 0) {
                    result.couponId = coupon.getId();
                    result.couponCode = coupon.getCode();
                    if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
                        BigDecimal disc = result.subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        if (disc.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                            disc = coupon.getMaxDiscountAmount();
                        }
                        result.couponDiscount = disc;
                    } else {
                        result.couponDiscount = coupon.getDiscountValue().min(coupon.getMaxDiscountAmount());
                    }
                } else {
                    throw new IllegalArgumentException("Coupon " + couponCode + " requires a minimum order value of ₹" + coupon.getMinOrderAmount());
                }
            } else {
                throw new IllegalArgumentException("Invalid coupon code: " + couponCode);
            }
        }

        // Packaging & Platform fee
        result.packagingFee = packagingSum.compareTo(BigDecimal.ZERO) > 0 ? packagingSum.setScale(2, RoundingMode.HALF_UP) : BigDecimal.valueOf(15.00);
        result.platformFee = new BigDecimal(getSetting("platform_convenience_fee", "5.00"));

        // GST Tax: dynamic % from settings on taxable food & packaging
        BigDecimal gstRate = new BigDecimal(getSetting("gst_percent", "5.00")).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal taxableAmount = result.subtotal.subtract(result.couponDiscount).add(result.packagingFee).max(BigDecimal.ZERO);
        result.gstTax = taxableAmount.multiply(gstRate).setScale(2, RoundingMode.HALF_UP);

        // Total Amount
        result.totalAmount = taxableAmount
                .add(result.deliveryFee)
                .add(result.platformFee)
                .add(result.gstTax)
                .setScale(2, RoundingMode.HALF_UP);

        // Honest ETA Engine calculation:
        int kitchenLoadDelay = restaurant.getCurrentLoad() * 2;
        int transitTime = (int) Math.ceil(result.distanceKm * 3.5) + 4;
        result.etaMinMinutes = Math.max(20, maxItemPrepTime + kitchenLoadDelay + transitTime - 3);
        result.etaMaxMinutes = result.etaMinMinutes + 10;

        // Radical Price Transparency Metadata
        BigDecimal markup = result.subtotal.subtract(result.dineInSubtotal);
        result.priceTransparency.put("dineInSubtotal", result.dineInSubtotal);
        result.priceTransparency.put("platformSubtotal", result.subtotal);
        result.priceTransparency.put("dineInMarkup", markup);
        result.priceTransparency.put("isPurePriceParity", markup.compareTo(BigDecimal.ZERO) == 0);
        result.priceTransparency.put("whyThisPriceExplainer", Map.of(
                "foodCost", result.subtotal,
                "packagingFee", "Food-grade tamper-evident thermal container (₹" + result.packagingFee + ")",
                "deliveryFee", "Fair compensation to rider based on " + result.distanceKm + " km transit",
                "platformFee", "Cloud server, real-time GPS tracking & secure transaction processing (₹" + result.platformFee + ")",
                "gst", "Government mandated 5% Restaurant GST"
        ));

        return result;
    }

    public static double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in KM
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
