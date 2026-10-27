package com.foodplatform;

import com.foodplatform.config.AppProperties;
import com.foodplatform.config.DatabaseMigrationRunner;
import com.foodplatform.filter.*;
import com.foodplatform.servlet.*;
import com.foodplatform.websocket.RealtimeEndpoint;
import jakarta.servlet.DispatcherType;
import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;
import org.apache.tomcat.websocket.server.WsSci;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.EnumSet;
import java.util.Set;

public class ServerMain {

    private static final Logger logger = LoggerFactory.getLogger(ServerMain.class);

    public static void main(String[] args) {
        // Run database migrations on startup
        logger.info("Initializing CravePulse database migrations...");
        DatabaseMigrationRunner.runMigrations();

        int port = AppProperties.getServerPort();
        Tomcat tomcat = new Tomcat();
        tomcat.setPort(port);
        tomcat.getConnector(); // trigger connector initialization

        String docBase = new File("src/main/webapp").getAbsolutePath();
        if (!new File(docBase).exists()) {
            new File(docBase).mkdirs();
        }

        Context ctx = tomcat.addContext("", docBase);

        // Register WebSocket SCI
        ctx.addServletContainerInitializer(new WsSci(), Set.of(RealtimeEndpoint.class));

        // Register Filters in proper security order
        addFilter(ctx, "SecurityHeadersFilter", new SecurityHeadersFilter(), "/*");
        addFilter(ctx, "CorsFilter", new CorsFilter(), "/*");
        addFilter(ctx, "RateLimitFilter", new RateLimitFilter(), "/*");
        addFilter(ctx, "RequestLoggingFilter", new RequestLoggingFilter(), "/*");
        addFilter(ctx, "JwtAuthFilter", new JwtAuthFilter(), "/*");

        // Health & Status Servlet
        Tomcat.addServlet(ctx, "HealthServlet", new jakarta.servlet.http.HttpServlet() {
            @Override
            protected void doGet(jakarta.servlet.http.HttpServletRequest req, jakarta.servlet.http.HttpServletResponse resp) throws java.io.IOException {
                resp.setContentType("application/json;charset=UTF-8");
                resp.getWriter().write("{\"status\":\"UP\",\"service\":\"CravePulse Platform\",\"version\":\"1.0.0\"}");
            }
        });
        ctx.addServletMappingDecoded("/health", "HealthServlet");
        ctx.addServletMappingDecoded("/api/health", "HealthServlet");

        // Register Servlets
        Tomcat.addServlet(ctx, "AuthServlet", new AuthServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/auth/*", "AuthServlet");
        ctx.addServletMappingDecoded("/api/auth", "AuthServlet");

        Tomcat.addServlet(ctx, "OnboardingServlet", new OnboardingServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/partner/apply", "OnboardingServlet");
        ctx.addServletMappingDecoded("/api/rider/apply", "OnboardingServlet");

        Tomcat.addServlet(ctx, "RestaurantServlet", new RestaurantServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/restaurants/*", "RestaurantServlet");
        ctx.addServletMappingDecoded("/api/restaurants", "RestaurantServlet");

        Tomcat.addServlet(ctx, "MenuServlet", new MenuServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/menu/*", "MenuServlet");
        ctx.addServletMappingDecoded("/api/menu", "MenuServlet");

        Tomcat.addServlet(ctx, "CartPricingServlet", new CartPricingServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/cart/*", "CartPricingServlet");
        ctx.addServletMappingDecoded("/api/cart", "CartPricingServlet");

        Tomcat.addServlet(ctx, "OrderServlet", new OrderServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/orders/*", "OrderServlet");
        ctx.addServletMappingDecoded("/api/orders", "OrderServlet");

        Tomcat.addServlet(ctx, "RiderServlet", new RiderServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/rider/*", "RiderServlet");
        ctx.addServletMappingDecoded("/api/rider", "RiderServlet");

        Tomcat.addServlet(ctx, "AdminServlet", new AdminServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/admin/*", "AdminServlet");
        ctx.addServletMappingDecoded("/api/admin", "AdminServlet");

        Tomcat.addServlet(ctx, "DisputeServlet", new DisputeServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/disputes/*", "DisputeServlet");
        ctx.addServletMappingDecoded("/api/disputes", "DisputeServlet");

        Tomcat.addServlet(ctx, "ReviewServlet", new ReviewServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/reviews/*", "ReviewServlet");
        ctx.addServletMappingDecoded("/api/reviews", "ReviewServlet");

        Tomcat.addServlet(ctx, "SseServlet", new SseServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/events/sse", "SseServlet");

        Tomcat.addServlet(ctx, "InvoiceServlet", new InvoiceServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/invoices/*", "InvoiceServlet");

        Tomcat.addServlet(ctx, "PaymentServlet", new PaymentServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/payments/*", "PaymentServlet");
        ctx.addServletMappingDecoded("/api/payments", "PaymentServlet");

        Tomcat.addServlet(ctx, "WalletServlet", new WalletServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/wallet/*", "WalletServlet");
        ctx.addServletMappingDecoded("/api/wallet", "WalletServlet");

        Tomcat.addServlet(ctx, "NotificationServlet", new NotificationServlet()).setAsyncSupported(true);
        ctx.addServletMappingDecoded("/api/notifications/*", "NotificationServlet");
        ctx.addServletMappingDecoded("/api/notifications", "NotificationServlet");

        try {
            logger.info("Starting FoodPlatform Embedded Tomcat on http://localhost:{}", port);
            tomcat.start();
            logger.info("FoodPlatform Backend API running successfully on http://localhost:{}", port);
            tomcat.getServer().await();
        } catch (Exception e) {
            logger.error("Error starting server", e);
        }
    }

    private static void addFilter(Context ctx, String name, jakarta.servlet.Filter filter, String urlPattern) {
        var def = new org.apache.tomcat.util.descriptor.web.FilterDef();
        def.setFilterName(name);
        def.setFilterClass(filter.getClass().getName());
        def.setFilter(filter);
        ctx.addFilterDef(def);

        var map = new org.apache.tomcat.util.descriptor.web.FilterMap();
        map.setFilterName(name);
        map.addURLPattern(urlPattern);
        map.setDispatcher(DispatcherType.REQUEST.name());
        ctx.addFilterMap(map);
    }
}
