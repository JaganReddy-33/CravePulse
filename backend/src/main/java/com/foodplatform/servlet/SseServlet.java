package com.foodplatform.servlet;

import com.foodplatform.util.JwtUtil;
import jakarta.servlet.AsyncContext;
import jakarta.servlet.AsyncEvent;
import jakarta.servlet.AsyncListener;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@WebServlet(value = "/api/events/sse", asyncSupported = true)
public class SseServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private static final CopyOnWriteArrayList<AsyncContext> asyncContexts = new CopyOnWriteArrayList<>();

    private static final ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "CravePulse-SSE-Heartbeat");
        t.setDaemon(true);
        return t;
    });

    static {
        heartbeatScheduler.scheduleWithFixedDelay(() -> {
            for (AsyncContext ac : asyncContexts) {
                try {
                    PrintWriter writer = ac.getResponse().getWriter();
                    writer.write("event: heartbeat\n");
                    writer.write("data: {\"timestamp\":" + System.currentTimeMillis() + "}\n\n");
                    writer.flush();
                } catch (Exception e) {
                    asyncContexts.remove(ac);
                    try {
                        ac.complete();
                    } catch (Exception ignored) {}
                }
            }
        }, 15, 20, TimeUnit.SECONDS);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String token = req.getParameter("token");
        Long userId = token != null ? JwtUtil.extractUserId(token) : null;

        res.setContentType("text/event-stream");
        res.setCharacterEncoding("UTF-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        PrintWriter writer = res.getWriter();
        writer.write("event: connected\n");
        writer.write("data: {\"status\":\"connected\",\"userId\":" + (userId != null ? userId : 0) + "}\n\n");
        writer.flush();

        AsyncContext async = req.startAsync();
        async.setTimeout(300000); // 5 minutes timeout
        async.addListener(new AsyncListener() {
            @Override
            public void onComplete(AsyncEvent event) {
                asyncContexts.remove(async);
            }

            @Override
            public void onTimeout(AsyncEvent event) {
                asyncContexts.remove(async);
                try {
                    async.complete();
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(AsyncEvent event) {
                asyncContexts.remove(async);
            }

            @Override
            public void onStartAsync(AsyncEvent event) {}
        });

        asyncContexts.add(async);
    }

    public static void broadcastEvent(String eventName, String jsonData) {
        for (AsyncContext ac : asyncContexts) {
            try {
                PrintWriter w = ac.getResponse().getWriter();
                w.write("event: " + eventName + "\n");
                w.write("data: " + jsonData + "\n\n");
                w.flush();
            } catch (Exception e) {
                asyncContexts.remove(ac);
                try {
                    ac.complete();
                } catch (Exception ignored) {}
            }
        }
    }
}
