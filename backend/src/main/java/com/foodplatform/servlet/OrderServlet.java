package com.foodplatform.servlet;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.MenuDao;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.MenuDaoImpl;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.RestaurantDaoImpl;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.MenuItem;
import com.foodplatform.model.Order;
import com.foodplatform.model.OrderItem;
import com.foodplatform.model.Restaurant;
import com.foodplatform.service.DispatchService;
import com.foodplatform.service.NotificationService;
import com.foodplatform.service.OrderStateMachineService;
import com.foodplatform.service.PaymentService;
import com.foodplatform.service.PricingService;
import com.foodplatform.util.JsonUtil;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@WebServlet("/api/orders/*")
public class OrderServlet extends BaseServlet {

    private static final Logger logger = LoggerFactory.getLogger(OrderServlet.class);

    private final OrderDao orderDao = new OrderDaoImpl();
    private final RestaurantDao restaurantDao = new RestaurantDaoImpl();
    private final UserDao userDao = new UserDaoImpl();
    private final MenuDao menuDao = new MenuDaoImpl();
    private final WalletDao walletDao = new WalletDaoImpl();
    private final PricingService pricingService = new PricingService();
    private final OrderStateMachineService stateMachine = new OrderStateMachineService();
    private final DispatchService dispatchService = new DispatchService();
    private final PaymentService paymentService = new PaymentService();
    private final NotificationService notificationService = new NotificationService();
    private final RealtimeSessionRegistry registry = RealtimeSessionRegistry.getInstance();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (path.endsWith("/reorder")) {
            if (!requireAuthenticated(req, res)) return;
            Long orderId = parseIdFromPath(req);
            if (orderId == null) {
                JsonUtil.sendError(res, 400, "Order ID required");
                return;
            }
            if (!requireOwnerOfOrder(req, res, orderId)) return;

            Order prevOrder = orderDao.findById(orderId);
            if (prevOrder == null) {
                JsonUtil.sendError(res, 404, "Order not found");
                return;
            }

            Restaurant rest = restaurantDao.findById(prevOrder.getRestaurantId());
            if (rest == null || !rest.isOpen()) {
                JsonUtil.sendError(res, 400, "Restaurant is currently closed for reorders.");
                return;
            }

            List<OrderItem> prevItems = orderDao.getOrderItems(orderId);
            List<Map<String, Object>> reorderItems = new ArrayList<>();
            for (OrderItem oi : prevItems) {
                MenuItem currentItem = menuDao.getItemById(oi.getMenuItemId());
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("menuItemId", oi.getMenuItemId());
                itemMap.put("name", oi.getItemName());
                itemMap.put("quantity", oi.getQuantity());
                itemMap.put("unitPrice", currentItem != null ? currentItem.getPlatformPrice() : oi.getUnitPrice());
                itemMap.put("isAvailable", currentItem != null && currentItem.isAvailable());
                itemMap.put("variantName", oi.getVariantName());
                itemMap.put("addonNames", oi.getAddonNames());
                reorderItems.add(itemMap);
            }

            Map<String, Object> reorderData = new HashMap<>();
            reorderData.put("restaurantId", prevOrder.getRestaurantId());
            reorderData.put("restaurantName", prevOrder.getRestaurantName());
            reorderData.put("items", reorderItems);
            JsonUtil.sendSuccess(res, 200, "Reorder payload prepared", reorderData);
            return;
        }

        if (path.isEmpty() || "/".equals(path)) {
            // Place new order
            if (!requireAuthenticated(req, res)) return;
            Long customerId = getAuthenticatedUserId(req);

            try {
                JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                if (body == null || !body.has("restaurantId") || !body.has("items") || !body.has("deliveryAddressId")) {
                    JsonUtil.sendError(res, 400, "restaurantId, items, and deliveryAddressId are required");
                    return;
                }

                long restaurantId = body.get("restaurantId").getAsLong();
                long addressId = body.get("deliveryAddressId").getAsLong();
                String paymentMode = body.has("paymentMode") ? body.get("paymentMode").getAsString() : "COD";
                String instructions = body.has("specialInstructions") && !body.get("specialInstructions").isJsonNull() ?
                        body.get("specialInstructions").getAsString() : null;

                // Idempotency check: return existing order on duplicate requests
                String idempotencyKey = req.getHeader("X-Idempotency-Key");
                if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                    Order existing = orderDao.findByIdempotencyKey(idempotencyKey.trim());
                    if (existing != null) {
                        Map<String, Object> resp = new HashMap<>();
                        resp.put("id", existing.getId());
                        resp.put("orderId", existing.getId());
                        resp.put("orderNumber", existing.getOrderNumber());
                        resp.put("status", existing.getStatus());
                        resp.put("paymentMode", existing.getPaymentMode());
                        resp.put("paymentStatus", existing.getPaymentStatus());
                        resp.put("totalAmount", existing.getTotalAmount());
                        resp.put("deliveryOtp", existing.getDeliveryOtp());
                        resp.put("order", existing);
                        JsonUtil.sendSuccess(res, 200, "Order retrieved from idempotency key", resp);
                        return;
                    }
                } else {
                    idempotencyKey = "IDEMP-" + UUID.randomUUID().toString();
                }

                // Verify address ownership and retrieve coordinates
                com.foodplatform.model.Address addr = userDao.getAddressById(addressId);
                if (addr == null || !addr.getUserId().equals(customerId)) {
                    JsonUtil.sendError(res, 400, "Invalid delivery address: Address does not belong to the authenticated user");
                    return;
                }
                Double userLat = addr.getLatitude() != null ? addr.getLatitude().doubleValue() : null;
                Double userLng = addr.getLongitude() != null ? addr.getLongitude().doubleValue() : null;

                // Check restaurant status and Overload Protection
                Restaurant restaurant = restaurantDao.findById(restaurantId);
                if (restaurant == null || !restaurant.isOpen()) {
                    JsonUtil.sendError(res, 400, "Restaurant is currently closed");
                    return;
                }
                if (restaurant.isAutoThrottled()) {
                    JsonUtil.sendError(res, 429, "Kitchen Overload Protection: Kitchen is at maximum capacity right now to maintain high quality. Please retry in 5 minutes.");
                    return;
                }

                // Parse cart items
                List<PricingService.CartInputItem> inputItems = new ArrayList<>();
                JsonArray arr = body.getAsJsonArray("items");
                for (JsonElement el : arr) {
                    JsonObject itemObj = el.getAsJsonObject();
                    PricingService.CartInputItem it = new PricingService.CartInputItem();
                    it.menuItemId = itemObj.get("menuItemId").getAsLong();
                    it.quantity = itemObj.has("quantity") ? itemObj.get("quantity").getAsInt() : 1;
                    if (itemObj.has("variantId") && !itemObj.get("variantId").isJsonNull()) {
                        it.variantId = itemObj.get("variantId").getAsLong();
                    }
                    if (itemObj.has("addonIds") && itemObj.get("addonIds").isJsonArray()) {
                        for (JsonElement aEl : itemObj.getAsJsonArray("addonIds")) {
                            it.addonIds.add(aEl.getAsLong());
                        }
                    }
                    inputItems.add(it);
                }

                // Calculate server-side authoritative bill with customerId for coupon checks
                String couponCode = body.has("couponCode") && !body.get("couponCode").isJsonNull() ? body.get("couponCode").getAsString() : null;
                PricingService.PriceCalculationResult calc = pricingService.calculateBill(restaurantId, inputItems, userLat, userLng, couponCode, customerId);

                // Enforce COD rules
                if ("COD".equalsIgnoreCase(paymentMode)) {
                    paymentService.validateCodOrder(calc.totalAmount);
                }

                // Collision-safe order number: date + 6-char UUID fragment
                String dateStr = DateTimeFormatter.ofPattern("yyyyMMdd").format(java.time.LocalDate.now());
                String orderNumber = "CP-" + dateStr + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                String deliveryOtp = String.format("%04d", (int) (1000 + Math.random() * 9000));

                Order order = new Order();
                order.setOrderNumber(orderNumber);
                order.setCustomerId(customerId);
                order.setRestaurantId(restaurantId);
                order.setDeliveryAddressId(addressId);
                order.setStatus("PLACED");
                order.setSubtotal(calc.subtotal);
                order.setRestaurantDiscount(calc.restaurantDiscount);
                order.setCouponId(calc.couponId);
                order.setCouponDiscount(calc.couponDiscount);
                order.setPackagingFee(calc.packagingFee);
                order.setDeliveryFee(calc.deliveryFee);
                order.setPlatformFee(calc.platformFee);
                order.setGstTax(calc.gstTax);
                order.setTotalAmount(calc.totalAmount);
                order.setPaymentMode(paymentMode);
                order.setPaymentStatus("PENDING");
                order.setIdempotencyKey(idempotencyKey);
                order.setEtaMinMinutes(calc.etaMinMinutes);
                order.setEtaMaxMinutes(calc.etaMaxMinutes);
                order.setEstimatedDeliveryAt(Timestamp.from(Instant.now().plusSeconds(calc.etaMaxMinutes * 60L)));
                order.setSpecialInstructions(instructions);
                order.setDeliveryOtp(deliveryOtp);

                List<OrderItem> orderItems = new ArrayList<>();
                for (Map<String, Object> billItem : calc.itemisedBill) {
                    OrderItem oi = new OrderItem();
                    oi.setMenuItemId((Long) billItem.get("menuItemId"));
                    oi.setItemName((String) billItem.get("name"));
                    oi.setVariantName((String) billItem.get("variantName"));
                    oi.setUnitPrice((BigDecimal) billItem.get("unitPrice"));
                    oi.setQuantity((Integer) billItem.get("quantity"));
                    oi.setTotalPrice((BigDecimal) billItem.get("lineTotal"));
                    oi.setAddonNames((String) billItem.get("addonNames"));
                    oi.setAddonTotal((BigDecimal) billItem.get("addonTotal"));
                    orderItems.add(oi);
                }

                // Insert order, items, coupon usage, and load counter in one atomic transaction
                Long orderId;
                try (Connection conn = DatabaseConfig.getConnection()) {
                    conn.setAutoCommit(false);
                    try {
                        orderId = orderDao.createOrder(conn, order);
                        orderDao.createOrderItems(conn, orderId, orderItems);
                        restaurantDao.incrementCurrentLoad(conn, restaurantId);

                        // Increment coupon usage and record usage log if coupon applied
                        if (calc.couponId != null) {
                            walletDao.incrementCouponUsage(conn, calc.couponId);
                            walletDao.recordCouponUsage(conn, customerId, calc.couponId, orderId);
                        }

                        // Audit event
                        com.foodplatform.model.OrderEvent ev = new com.foodplatform.model.OrderEvent();
                        ev.setOrderId(orderId);
                        ev.setNewStatus("PLACED");
                        ev.setTriggeredByUserId(customerId);
                        ev.setActorRole("CUSTOMER");
                        ev.setReason("Order placed via platform");
                        orderDao.recordOrderEvent(conn, ev);

                        conn.commit();
                    } catch (SQLException ex) {
                        conn.rollback();
                        throw ex;
                    } finally {
                        conn.setAutoCommit(true);
                    }
                }

                // Process payment mode if immediate
                Map<String, Object> paymentSession = null;
                if ("WALLET".equalsIgnoreCase(paymentMode)) {
                    paymentService.processWalletPayment(orderId, customerId);
                } else if ("RAZORPAY".equalsIgnoreCase(paymentMode)) {
                    paymentSession = paymentService.createRazorpayOrder(orderId, customerId, idempotencyKey);
                }

                Order created = orderDao.findById(orderId);

                // Server-side persistent notification & real-time broadcasts
                notificationService.sendNotification(customerId, "Order Placed",
                        "Your order #" + created.getOrderNumber() + " has been placed successfully.", "ORDER", String.valueOf(created.getId()));
                registry.broadcastToRestaurant(restaurantId, "new_order_placed", created);
                registry.broadcastToAdmin("new_order_placed", created);

                // Trigger dispatch engine in background thread
                new Thread(() -> {
                    try {
                        Thread.sleep(1500); // brief kitchen acknowledgment window
                        dispatchService.dispatchOrder(orderId);
                    } catch (Exception e) {
                        logger.error("Auto dispatch background failed for order {}", orderId, e);
                    }
                }).start();

                Map<String, Object> responseData = new HashMap<>();
                responseData.put("id", created.getId());
                responseData.put("orderId", created.getId());
                responseData.put("orderNumber", created.getOrderNumber());
                responseData.put("status", created.getStatus());
                responseData.put("paymentMode", created.getPaymentMode());
                responseData.put("paymentStatus", created.getPaymentStatus());
                responseData.put("totalAmount", created.getTotalAmount());
                responseData.put("deliveryOtp", created.getDeliveryOtp());
                responseData.put("order", created);
                if (paymentSession != null) {
                    responseData.put("paymentSession", paymentSession);
                }

                JsonUtil.sendSuccess(res, 201, "Order placed successfully", responseData);
            } catch (Exception e) {
                logger.error("Error creating order", e);
                JsonUtil.sendError(res, 400, e.getMessage());
            }
            return;
        }

        if (path.endsWith("/status")) {
            if (!requireAuthenticated(req, res)) return;
            Long orderId = parseIdFromPath(req);
            if (orderId == null) {
                JsonUtil.sendError(res, 400, "Order ID is required");
                return;
            }

            Long userId = getAuthenticatedUserId(req);
            String role = getAuthenticatedRole(req);

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("status")) {
                JsonUtil.sendError(res, 400, "status is required");
                return;
            }

            String targetStatus = body.get("status").getAsString().toUpperCase().trim();
            String reason = body.has("reason") && !body.get("reason").isJsonNull() ? body.get("reason").getAsString() : null;
            String deliveryOtp = body.has("deliveryOtp") && !body.get("deliveryOtp").isJsonNull() ? body.get("deliveryOtp").getAsString() : null;
            Double lat = body.has("latitude") && !body.get("latitude").isJsonNull() ? body.get("latitude").getAsDouble() : null;
            Double lng = body.has("longitude") && !body.get("longitude").isJsonNull() ? body.get("longitude").getAsDouble() : null;

            try {
                Order updated = stateMachine.transition(orderId, targetStatus, userId, role, deliveryOtp, reason, lat, lng);

                // Auto-refund trigger on cancellation or rejection
                if ("CANCELLED".equals(targetStatus) || "REJECTED".equals(targetStatus)) {
                    try {
                        paymentService.processRefund(orderId, reason != null ? reason : "Order " + targetStatus);
                    } catch (Exception re) {
                        logger.warn("Automatic refund trigger notice for order {}: {}", orderId, re.getMessage());
                    }
                }

                JsonUtil.sendSuccess(res, 200, "Order transitioned to " + targetStatus, updated);
            } catch (IllegalArgumentException | IllegalStateException e) {
                JsonUtil.sendError(res, 400, e.getMessage());
            } catch (Exception e) {
                JsonUtil.sendError(res, 500, "Order transition error: " + e.getMessage());
            }
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if ("/customer".equals(path)) {
            if (!requireAuthenticated(req, res)) return;
            Long customerId = getAuthenticatedUserId(req);
            int limit = parseIntParam(req, "limit", 20);
            int offset = parseIntParam(req, "offset", 0);

            List<Order> list = orderDao.listCustomerOrders(customerId, limit, offset);
            JsonUtil.sendSuccess(res, 200, "Customer orders", list);
            return;
        }

        if (path.startsWith("/restaurant/")) {
            Long restaurantId = parseIdFromPath(req);
            if (restaurantId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID is required");
                return;
            }
            if (!requireRestaurantOwner(req, res, restaurantId)) return;

            String status = req.getParameter("status");
            int limit = parseIntParam(req, "limit", 50);
            int offset = parseIntParam(req, "offset", 0);

            List<Order> list = orderDao.listRestaurantOrders(restaurantId, status, limit, offset);
            JsonUtil.sendSuccess(res, 200, "Restaurant orders", list);
            return;
        }

        if (path.startsWith("/number/")) {
            String[] parts = path.split("/");
            String orderNumber = parts[parts.length - 1];
            Order o = orderDao.findByOrderNumber(orderNumber);
            if (o == null) {
                JsonUtil.sendError(res, 404, "Order not found");
                return;
            }
            if (!requireOwnerOfOrder(req, res, o.getId())) return;

            JsonUtil.sendSuccess(res, 200, "Order details", o);
            return;
        }

        if ("/active".equals(path) || "/orders/active".equals(path)) {
            if (!requireAuthenticated(req, res)) return;
            Long customerId = getAuthenticatedUserId(req);
            List<Order> list = orderDao.listCustomerOrders(customerId, 5, 0);
            Order active = list.stream()
                .filter(o -> !"DELIVERED".equalsIgnoreCase(o.getStatus()) && !"CANCELLED".equalsIgnoreCase(o.getStatus()))
                .findFirst().orElse(null);
            JsonUtil.sendSuccess(res, 200, "Active customer order", active);
            return;
        }

        Long orderId = parseIdFromPath(req);
        if (orderId != null) {
            if (!requireOwnerOfOrder(req, res, orderId)) return;

            Order o = orderDao.findById(orderId);
            if (o == null) {
                JsonUtil.sendError(res, 404, "Order not found");
                return;
            }

            if (path.endsWith("/invoice")) {
                InvoiceServlet.renderInvoiceHtml(o, res);
                return;
            }

            JsonUtil.sendSuccess(res, 200, "Order details", o);
            return;
        }

        JsonUtil.sendError(res, 404, "Order endpoint not found: " + path);
    }

    private int parseIntParam(HttpServletRequest req, String name, int defVal) {
        String s = req.getParameter(name);
        if (s != null && !s.isBlank()) {
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException ignored) {
            }
        }
        return defVal;
    }
}
