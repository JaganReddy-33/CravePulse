package com.foodplatform.servlet;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.service.MetricsService;
import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;

@WebServlet(urlPatterns = {"/health", "/ready", "/metrics", "/api/health", "/api/ready", "/api/metrics"})
public class HealthObservabilityServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(HealthObservabilityServlet.class);
    private static final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        String uri = req.getRequestURI();

        if (uri.endsWith("/metrics")) {
            handleMetrics(resp);
        } else if (uri.endsWith("/ready")) {
            handleReady(resp);
        } else {
            handleHealth(resp);
        }
    }

    private void handleHealth(HttpServletResponse resp) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "UP");
        body.put("service", "CravePulse Platform");
        body.put("version", "1.0.0");
        body.put("timestamp", System.currentTimeMillis());
        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write(gson.toJson(body));
    }

    private void handleReady(HttpServletResponse resp) throws IOException {
        Map<String, Object> body = new HashMap<>();
        Map<String, Object> dbHealth = new HashMap<>();
        Map<String, Object> memory = new HashMap<>();

        Runtime runtime = Runtime.getRuntime();
        memory.put("freeMemoryMb", runtime.freeMemory() / (1024 * 1024));
        memory.put("totalMemoryMb", runtime.totalMemory() / (1024 * 1024));
        memory.put("maxMemoryMb", runtime.maxMemory() / (1024 * 1024));
        body.put("memory", memory);

        boolean isDbHealthy = false;
        long dbLatencyMs = -1;
        long start = System.currentTimeMillis();

        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1")) {
            if (rs.next()) {
                isDbHealthy = true;
                dbLatencyMs = System.currentTimeMillis() - start;
            }
        } catch (Exception e) {
            logger.warn("Readiness check database probe failed", e);
            dbHealth.put("error", e.getMessage());
        }

        dbHealth.put("status", isDbHealthy ? "UP" : "DOWN");
        dbHealth.put("latencyMs", dbLatencyMs);
        body.put("database", dbHealth);

        if (isDbHealthy) {
            body.put("status", "UP");
            resp.setStatus(HttpServletResponse.SC_OK);
        } else {
            body.put("status", "DOWN");
            resp.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        }

        resp.getWriter().write(gson.toJson(body));
    }

    private void handleMetrics(HttpServletResponse resp) throws IOException {
        Map<String, Object> metrics = MetricsService.getInstance().getSnapshot();
        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write(gson.toJson(metrics));
    }
}
