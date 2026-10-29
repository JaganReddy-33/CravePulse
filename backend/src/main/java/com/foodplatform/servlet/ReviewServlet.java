package com.foodplatform.servlet;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.ReviewDao;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.ReviewDaoImpl;
import com.foodplatform.model.Order;
import com.foodplatform.model.Review;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet("/api/reviews/*")
public class ReviewServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private final ReviewDao reviewDao = new ReviewDaoImpl();
    private final OrderDao orderDao = new OrderDaoImpl();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (path.isEmpty() || "/".equals(path)) {
            if (!requireAuthenticated(req, res)) return;
            Long customerId = getAuthenticatedUserId(req);

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("orderId") || !body.has("foodRating")) {
                JsonUtil.sendError(res, 400, "orderId and foodRating are required");
                return;
            }

            long orderId = body.get("orderId").getAsLong();
            Order order = orderDao.findById(orderId);
            if (order == null || !order.getCustomerId().equals(customerId)) {
                JsonUtil.sendError(res, 403, "Access forbidden: you may only review orders you placed");
                return;
            }
            if (!"DELIVERED".equals(order.getStatus())) {
                JsonUtil.sendError(res, 400, "Only delivered orders can be reviewed");
                return;
            }

            Review review = new Review();
            review.setOrderId(orderId);
            review.setCustomerId(customerId);
            review.setRestaurantId(order.getRestaurantId());
            review.setRiderId(order.getRiderId());
            review.setFoodRating(body.get("foodRating").getAsInt());
            review.setPackagingRating(body.has("packagingRating") ? body.get("packagingRating").getAsInt() : 5);
            review.setDeliveryRating(body.has("deliveryRating") ? body.get("deliveryRating").getAsInt() : 5);
            review.setReviewText(body.has("reviewText") ? body.get("reviewText").getAsString() : "");

            if (review.getFoodRating()<1 || review.getFoodRating()>5 || review.getPackagingRating()<1 || review.getPackagingRating()>5 || review.getDeliveryRating()<1 || review.getDeliveryRating()>5) { JsonUtil.sendError(res,400,"Ratings must be from 1 to 5"); return; }
            Long reviewId = reviewDao.createReview(review);
            review.setId(reviewId);
            JsonUtil.sendSuccess(res, 201, "Review submitted successfully", review);
            return;
        }

        if (path.endsWith("/reply")) {
            Long reviewId = parseIdFromPath(req);
            if (reviewId == null) {
                JsonUtil.sendError(res, 400, "Review ID is required");
                return;
            }
            Review rw = reviewDao.findById(reviewId);
            if (rw == null) {
                JsonUtil.sendError(res, 404, "Review not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, rw.getRestaurantId())) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            String reply = body != null && body.has("replyText") ? body.get("replyText").getAsString() : "";

            reviewDao.replyToReview(reviewId, reply);
            JsonUtil.sendSuccess(res, 200, "Reply posted", Map.of("reviewId", reviewId, "replyText", reply));
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (path.startsWith("/restaurant/")) {
            Long restId = parseIdFromPath(req);
            int limit = 20;
            int offset = 0;
            List<Review> list = reviewDao.listRestaurantReviews(restId, limit, offset);
            JsonUtil.sendSuccess(res, 200, "Restaurant reviews", list);
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
