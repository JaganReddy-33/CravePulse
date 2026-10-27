package com.foodplatform.service;

import com.foodplatform.dao.MenuDao;
import com.foodplatform.dao.PlatformSettingDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.MenuDaoImpl;
import com.foodplatform.daoImpl.PlatformSettingDaoImpl;
import com.foodplatform.daoImpl.RestaurantDaoImpl;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PricingService {

    private static final Logger logger = LoggerFactory.getLogger(PricingService.class);

    private final MenuDao menuDao;
    private final RestaurantDao restaurantDao;
    private final WalletDao walletDao;
    private final PlatformSettingDao platformSettingDao;

    public PricingService() {
        this(new MenuDaoImpl(), new RestaurantDaoImpl(), new WalletDaoImpl(), new PlatformSettingDaoImpl());
    }

    public PricingService(MenuDao menuDao, RestaurantDao restaurantDao, WalletDao walletDao) {
        this(menuDao, restaurantDao, walletDao, new PlatformSettingDaoImpl());
    }

    public PricingService(MenuDao menuDao, RestaurantDao restaurantDao, WalletDao walletDao, PlatformSettingDao platformSettingDao) {
        this.menuDao = menuDao;
        this.restaurantDao = restaurantDao;
        this.walletDao = walletDao;
        this.platformSettingDao = platformSettingDao;
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
        public BigDecimal totalAmount = BigDecimal.ZERO;
        public double distanceKm = 2.5;
        public int etaMinMinutes = 25;
        public int etaMaxMinutes = 35;
        public List<Map<String, Object>> itemisedBill = new ArrayList<>();
        public Map<String, Object> priceTransparency = new HashMap<>();
    }

    public PriceCalculationResult calculateBill(long restaurantId, List<CartInputItem> items, Double userLat, Double userLng, String couponCode) {
        PriceCalculationResult result = new PriceCalculationResult();

        Restaurant restaurant = restaurantDao.findById(restaurantId);
        if (restaurant == null) {
            throw new IllegalArgumentException("Restaurant not found: " + restaurantId);
        }

        BigDecimal platformSum = BigDecimal.ZERO;
        BigDecimal dineInSum = BigDecimal.ZERO;
        int maxItemPrepTime = 15;

        for (CartInputItem inItem : items) {
            MenuItem mi = menuDao.getItemById(inItem.menuItemId);
            if (mi == null || !mi.isAvailable()) {
                throw new IllegalStateException("Item " + inItem.menuItemId + " is currently unavailable.");
            }

            BigDecimal unitPlatformPrice = mi.getPlatformPrice();
            BigDecimal unitDineInPrice = mi.getDineInPrice();
            String variantName = null;

            // Variant adjustments
            if (inItem.variantId != null) {
                for (MenuItemVariant v : mi.getVariants()) {
                    if (v.getId().equals(inItem.variantId)) {
                        unitPlatformPrice = unitPlatformPrice.add(v.getPriceAdjustment());
                        unitDineInPrice = unitDineInPrice.add(v.getPriceAdjustment());
                        variantName = v.getVariantName();
                        break;
                    }
                }
            }

            // Addon adjustments
            BigDecimal addonTotal = BigDecimal.ZERO;
            List<String> addonNames = new ArrayList<>();
            if (inItem.addonIds != null && !inItem.addonIds.isEmpty()) {
                for (MenuItemAddon a : mi.getAddons()) {
                    if (inItem.addonIds.contains(a.getId())) {
                        addonTotal = addonTotal.add(a.getPrice());
                        addonNames.add(a.getAddonName());
                    }
                }
            }

            BigDecimal itemLineTotal = unitPlatformPrice.multiply(BigDecimal.valueOf(inItem.quantity)).add(addonTotal);
            BigDecimal dineInLineTotal = unitDineInPrice.multiply(BigDecimal.valueOf(inItem.quantity)).add(addonTotal);

            platformSum = platformSum.add(itemLineTotal);
            dineInSum = dineInSum.add(dineInLineTotal);

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
            billItem.put("addonTotal", addonTotal);
            billItem.put("lineTotal", itemLineTotal);
            billItem.put("hasPriceParity", unitPlatformPrice.compareTo(unitDineInPrice) == 0);
            result.itemisedBill.add(billItem);
        }

        result.subtotal = platformSum.setScale(2, RoundingMode.HALF_UP);
        result.dineInSubtotal = dineInSum.setScale(2, RoundingMode.HALF_UP);

        // Distance calculation
        double lat = userLat != null ? userLat : 12.9783692;
        double lng = userLng != null ? userLng : 77.6408356;
        double restLat = restaurant.getLatitude().doubleValue();
        double restLng = restaurant.getLongitude().doubleValue();
        double distance = calculateHaversineDistance(restLat, restLng, lat, lng);
        result.distanceKm = Math.round(distance * 10.0) / 10.0;

        // Delivery fee: dynamic base (first 2km) + per km thereafter
        BigDecimal baseDelivery = new BigDecimal(platformSettingDao.getSettingValue("base_delivery_fee", "35.00"));
        BigDecimal perKm = new BigDecimal(platformSettingDao.getSettingValue("per_km_delivery_fee", "12.00"));
        BigDecimal extraKm = BigDecimal.valueOf(Math.max(0.0, result.distanceKm - 2.0));
        BigDecimal distanceFee = extraKm.multiply(perKm);
        result.deliveryFee = baseDelivery.add(distanceFee).setScale(2, RoundingMode.HALF_UP);

        // Coupon application
        if (couponCode != null && !couponCode.isBlank()) {
            Coupon coupon = walletDao.getCouponByCode(couponCode.trim().toUpperCase());
            if (coupon != null && result.subtotal.compareTo(coupon.getMinOrderAmount()) >= 0) {
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
            }
        }

        // Packaging & Platform fee
        result.packagingFee = BigDecimal.valueOf(15.00);
        result.platformFee = new BigDecimal(platformSettingDao.getSettingValue("platform_convenience_fee", "5.00"));

        // GST Tax: dynamic % from settings on taxable food & packaging
        BigDecimal gstRate = new BigDecimal(platformSettingDao.getSettingValue("gst_percent", "5.00")).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal taxableAmount = result.subtotal.subtract(result.couponDiscount).add(result.packagingFee).max(BigDecimal.ZERO);
        result.gstTax = taxableAmount.multiply(gstRate).setScale(2, RoundingMode.HALF_UP);

        // Total Amount
        result.totalAmount = taxableAmount
                .add(result.deliveryFee)
                .add(result.platformFee)
                .add(result.gstTax)
                .setScale(2, RoundingMode.HALF_UP);

        // Honest ETA Engine calculation:
        // prep time + load buffer (2 min per current kitchen load) + transit time (3.5 min/km)
        int kitchenLoadDelay = restaurant.getCurrentLoad() * 2;
        int transitTime = (int) Math.ceil(result.distanceKm * 3.5) + 4;
        result.etaMinMinutes = Math.max(20, maxItemPrepTime + kitchenLoadDelay + transitTime - 3);
        result.etaMaxMinutes = result.etaMinMinutes + 10; // Honest Confidence Range SLA

        // Radical Price Transparency Metadata
        BigDecimal markup = result.subtotal.subtract(result.dineInSubtotal);
        result.priceTransparency.put("dineInSubtotal", result.dineInSubtotal);
        result.priceTransparency.put("platformSubtotal", result.subtotal);
        result.priceTransparency.put("dineInMarkup", markup);
        result.priceTransparency.put("isPurePriceParity", markup.compareTo(BigDecimal.ZERO) == 0);
        result.priceTransparency.put("whyThisPriceExplainer", Map.of(
                "foodCost", result.subtotal,
                "packagingFee", "Food-grade tamper-evident thermal container (₹15)",
                "deliveryFee", "Fair compensation to rider based on " + result.distanceKm + " km transit",
                "platformFee", "Cloud server, real-time GPS tracking & secure transaction processing (₹5)",
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
