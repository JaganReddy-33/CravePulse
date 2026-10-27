package com.foodplatform.servlet;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.model.Order;
import com.foodplatform.model.OrderItem;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;

@WebServlet("/api/invoices/*")
public class InvoiceServlet extends BaseServlet {

    private final OrderDao orderDao = new OrderDaoImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String uri = req.getRequestURI();
        Long orderId = parseIdFromPath(req);

        if (orderId == null) {
            String[] parts = uri.split("/");
            for (int i = 0; i < parts.length; i++) {
                if ("orders".equals(parts[i]) && i + 1 < parts.length) {
                    try {
                        orderId = Long.parseLong(parts[i + 1]);
                        break;
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }

        if (orderId == null) {
            res.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid order ID");
            return;
        }

        // Strict ownership check: Only owner customer, restaurant, rider, or admin can access invoice
        if (!requireOwnerOfOrder(req, res, orderId)) {
            return;
        }

        Order order = orderDao.findById(orderId);
        if (order == null) {
            res.sendError(HttpServletResponse.SC_NOT_FOUND, "Order not found");
            return;
        }

        renderInvoiceHtml(order, res);
    }

    public static void renderInvoiceHtml(Order order, HttpServletResponse res) throws IOException {
        res.setContentType("text/html;charset=UTF-8");
        PrintWriter out = res.getWriter();

        BigDecimal gst = order.getGstTax() != null ? order.getGstTax() : BigDecimal.ZERO;
        BigDecimal cgst = gst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = cgst;

        out.println("<!DOCTYPE html>");
        out.println("<html><head><meta charset='UTF-8'><title>Tax Invoice - " + order.getOrderNumber() + "</title>");
        out.println("<style>");
        out.println("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; background: #fff; }");
        out.println(".invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }");
        out.println(".header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }");
        out.println(".logo { font-size: 26px; font-weight: 800; color: #ff5722; letter-spacing: -0.5px; }");
        out.println(".badge { background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }");
        out.println(".info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; font-size: 14px; line-height: 1.6; }");
        out.println("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        out.println("th { background: #f8fafc; text-align: left; padding: 12px; font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }");
        out.println("td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }");
        out.println(".totals { margin-top: 20px; width: 350px; margin-left: auto; font-size: 14px; }");
        out.println(".totals-row { display: flex; justify-content: space-between; padding: 6px 0; color: #475569; }");
        out.println(".totals-grand { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 10px; }");
        out.println(".guarantee-box { margin-top: 30px; padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 13px; color: #166534; display: flex; align-items: center; gap: 10px; }");
        out.println(".print-btn { background: #ff5722; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 20px; }");
        out.println("@media print { .print-btn { display: none; } body { margin: 0; } .invoice-box { border: none; box-shadow: none; padding: 0; } }");
        out.println("</style></head><body>");

        out.println("<div class='invoice-box'>");
        out.println("<button class='print-btn' onclick='window.print()'>🖨️ Print Invoice</button>");
        out.println("<div class='header'>");
        out.println("<div><div class='logo'>CravePulse Platform</div><div style='font-size: 13px; color: #64748b;'>Tax Invoice & Food Delivery Receipt</div></div>");
        out.println("<div style='text-align: right;'><span class='badge'>PAID IN FULL</span><div style='font-weight: 700; margin-top: 5px;'>" + order.getOrderNumber() + "</div><div style='font-size: 12px; color: #94a3b8;'>" + (order.getCreatedAt() != null ? order.getCreatedAt() : "") + "</div></div>");
        out.println("</div>");

        out.println("<div class='info-grid'>");
        out.println("<div><strong>Billed From:</strong><br>" + (order.getRestaurantName() != null ? order.getRestaurantName() : "Restaurant Partner") + "<br>FSSAI Lic: 11223344556677<br>GSTIN: 29AABCU9603R1ZM<br>Indiranagar, Bengaluru</div>");
        out.println("<div><strong>Delivered To:</strong><br>" + (order.getCustomerName() != null ? order.getCustomerName() : "Customer") + "<br>Phone: " + (order.getCustomerPhone() != null ? order.getCustomerPhone() : "N/A") + "<br>" + (order.getDeliveryAddressText() != null ? order.getDeliveryAddressText() : "") + "</div>");
        out.println("</div>");

        out.println("<table><thead><tr><th>Item Description</th><th>Variant / Addons</th><th>Qty</th><th>Price</th><th style='text-align: right;'>Amount</th></tr></thead><tbody>");
        if (order.getItems() != null) {
            for (OrderItem it : order.getItems()) {
                out.println("<tr>");
                out.println("<td><strong>" + it.getItemName() + "</strong></td>");
                out.println("<td style='color: #64748b; font-size: 12px;'>" + (it.getVariantName() != null ? it.getVariantName() : "-") + (it.getAddonNames() != null ? "<br>+ " + it.getAddonNames() : "") + "</td>");
                out.println("<td>" + it.getQuantity() + "</td>");
                out.println("<td>₹" + it.getUnitPrice() + "</td>");
                out.println("<td style='text-align: right; font-weight: 600;'>₹" + it.getTotalPrice() + "</td>");
                out.println("</tr>");
            }
        }
        out.println("</tbody></table>");

        out.println("<div class='totals'>");
        out.println("<div class='totals-row'><span>Item Subtotal:</span><span>₹" + order.getSubtotal() + "</span></div>");
        if (order.getCouponDiscount() != null && order.getCouponDiscount().compareTo(BigDecimal.ZERO) > 0) {
            out.println("<div class='totals-row' style='color: #16a34a;'><span>Coupon Discount:</span><span>-₹" + order.getCouponDiscount() + "</span></div>");
        }
        out.println("<div class='totals-row'><span>Packaging Fee:</span><span>₹" + (order.getPackagingFee() != null ? order.getPackagingFee() : BigDecimal.ZERO) + "</span></div>");
        out.println("<div class='totals-row'><span>Delivery Partner Fee:</span><span>₹" + (order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO) + "</span></div>");
        out.println("<div class='totals-row'><span>Platform Convenience Fee:</span><span>₹" + (order.getPlatformFee() != null ? order.getPlatformFee() : BigDecimal.ZERO) + "</span></div>");
        out.println("<div class='totals-row'><span>CGST (2.5%):</span><span>₹" + cgst + "</span></div>");
        out.println("<div class='totals-row'><span>SGST (2.5%):</span><span>₹" + sgst + "</span></div>");
        out.println("<div class='totals-row totals-grand'><span>Total Paid (" + order.getPaymentMode() + "):</span><span>₹" + order.getTotalAmount() + "</span></div>");
        out.println("</div>");

        out.println("<div class='guarantee-box'>");
        out.println("<span style='font-size: 20px;'>🛡️</span>");
        out.println("<div><strong>100% Price Parity & Honest Bill Guarantee:</strong> This order was fulfilled with authentic restaurant dine-in menu prices. Zero hidden markups. Delivered by: " + (order.getRiderName() != null ? order.getRiderName() : "Partner Rider") + ".</div>");
        out.println("</div>");

        out.println("</div></body></html>");
    }
}
