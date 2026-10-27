package com.foodplatform.servlet;

import com.foodplatform.util.JwtUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.concurrent.CopyOnWriteArrayList;

@WebServlet(value = "/api/events/sse", asyncSupported = true)
public class SseServlet extends BaseServlet {

    private static final CopyOnWriteArrayList<PrintWriter> clients = new CopyOnWriteArrayList<>();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String token = req.getParameter("token");
        Long userId = token != null ? JwtUtil.extractUserId(token) : null;

        res.setContentType("text/event-stream");
        res.setCharacterEncoding("UTF-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        PrintWriter writer = res.getWriter();
        clients.add(writer);

        writer.write("event: connected\n");
        writer.write("data: {\"status\":\"connected\",\"userId\":" + (userId != null ? userId : 0) + "}\n\n");
        writer.flush();

        // Keep connection open with a heartbeat
        try {
            for (int i = 0; i < 30; i++) {
                Thread.sleep(2000);
                if (writer.checkError()) break;
                writer.write("event: heartbeat\n");
                writer.write("data: {\"timestamp\":" + System.currentTimeMillis() + "}\n\n");
                writer.flush();
            }
        } catch (InterruptedException ignored) {
        } finally {
            clients.remove(writer);
        }
    }

    public static void broadcastEvent(String eventName, String jsonData) {
        for (PrintWriter w : clients) {
            try {
                w.write("event: " + eventName + "\n");
                w.write("data: " + jsonData + "\n\n");
                w.flush();
            } catch (Exception ignored) {
            }
        }
    }
}
