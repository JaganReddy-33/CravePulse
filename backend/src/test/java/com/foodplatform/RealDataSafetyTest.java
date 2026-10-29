package com.foodplatform;

import com.foodplatform.service.RazorpayGatewayClient;
import com.foodplatform.servlet.InvoiceServlet;
import com.foodplatform.model.Order;
import com.foodplatform.dao.*;
import com.foodplatform.service.PaymentService;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import java.net.http.*;
import java.math.BigDecimal;
import java.io.*;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class RealDataSafetyTest {
    @Test void demoSignatureCannotMarkPaymentPaid() {
        var gateway=new RazorpayGatewayClient("rzp_test_cravepulse_demo2026","secret","webhook",HttpClient.newHttpClient());
        assertFalse(gateway.verifySignature("order_test","pay_test","simulated_valid_sig"));
        assertThrows(IllegalStateException.class,()->gateway.createOrder(new BigDecimal("10"),"test",Map.of()));
    }
    @Test void gatewayHttpFailureDoesNotManufactureOrderOrRefund() throws Exception {
        HttpClient http=mock(HttpClient.class);
        @SuppressWarnings("unchecked") HttpResponse<String> response=mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(503);
        when(http.send(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenReturn(response);
        var gateway=new RazorpayGatewayClient("rzp_test_real","secret","webhook",http);
        assertThrows(IllegalStateException.class,()->gateway.createOrder(BigDecimal.TEN,"test",Map.of()));
        assertThrows(IllegalStateException.class,()->gateway.createRefund("pay_test",BigDecimal.TEN,"test"));
    }
    @Test void paymentCannotBeVerifiedWithoutOwnership() {
        var payments=mock(PaymentDao.class);var orders=mock(OrderDao.class);var gateway=mock(RazorpayGatewayClient.class);
        var service=new PaymentService(payments,orders,mock(UserDao.class),mock(WalletDao.class),gateway,mock(RealtimeSessionRegistry.class));
        assertThrows(IllegalArgumentException.class,()->service.verifyPayment("unknown","pay","sig",99L));
        verifyNoInteractions(gateway);
    }
    @Test void receiptEscapesCustomerContentAndUsesRecordedPaymentStatus() throws Exception {
        Order order=new Order();order.setOrderNumber("<script>alert(1)</script>");order.setPaymentStatus("PENDING");order.setCustomerName("<img src=x onerror=alert(1)>");
        HttpServletResponse res=mock(HttpServletResponse.class);StringWriter buffer=new StringWriter();when(res.getWriter()).thenReturn(new PrintWriter(buffer));
        InvoiceServlet.renderInvoiceHtml(order,res);
        assertFalse(buffer.toString().contains("<script>"));assertFalse(buffer.toString().contains("<img src=x"));assertFalse(buffer.toString().contains("PAID IN FULL"));assertTrue(buffer.toString().contains("PENDING"));
    }
}
