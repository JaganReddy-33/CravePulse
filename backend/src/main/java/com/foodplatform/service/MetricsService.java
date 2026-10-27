package com.foodplatform.service;

import java.lang.management.ManagementFactory;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.LongAdder;

public class MetricsService {

    private static final MetricsService INSTANCE = new MetricsService();

    private final LongAdder ordersPlaced = new LongAdder();
    private final LongAdder ordersDelivered = new LongAdder();
    private final LongAdder ordersCancelled = new LongAdder();
    private final LongAdder failedPayments = new LongAdder();
    private final LongAdder dispatchTimeouts = new LongAdder();
    private final LongAdder activeWebsockets = new LongAdder();
    private final LongAdder totalRequests = new LongAdder();

    // Rolling 60s window for orders per minute
    private final Deque<Long> orderTimestamps = new ArrayDeque<>();
    private final Object windowLock = new Object();

    public static MetricsService getInstance() {
        return INSTANCE;
    }

    public void incrementOrdersPlaced() {
        ordersPlaced.increment();
        long now = System.currentTimeMillis();
        synchronized (windowLock) {
            orderTimestamps.addLast(now);
            purgeOldTimestamps(now);
        }
    }

    public void incrementOrdersDelivered() {
        ordersDelivered.increment();
    }

    public void incrementOrdersCancelled() {
        ordersCancelled.increment();
    }

    public void incrementFailedPayments() {
        failedPayments.increment();
    }

    public void incrementDispatchTimeouts() {
        dispatchTimeouts.increment();
    }

    public void incrementActiveWebsockets() {
        activeWebsockets.increment();
    }

    public void decrementActiveWebsockets() {
        activeWebsockets.decrement();
    }

    public void incrementTotalRequests() {
        totalRequests.increment();
    }

    public int getOrdersPerMinute() {
        long now = System.currentTimeMillis();
        synchronized (windowLock) {
            purgeOldTimestamps(now);
            return orderTimestamps.size();
        }
    }

    private void purgeOldTimestamps(long now) {
        long oneMinuteAgo = now - 60000;
        while (!orderTimestamps.isEmpty() && orderTimestamps.peekFirst() < oneMinuteAgo) {
            orderTimestamps.pollFirst();
        }
    }

    public Map<String, Object> getSnapshot() {
        Map<String, Object> map = new HashMap<>();
        map.put("uptimeMs", ManagementFactory.getRuntimeMXBean().getUptime());
        map.put("totalRequests", totalRequests.sum());
        map.put("ordersPlaced", ordersPlaced.sum());
        map.put("ordersDelivered", ordersDelivered.sum());
        map.put("ordersCancelled", ordersCancelled.sum());
        map.put("ordersPerMinute", getOrdersPerMinute());
        map.put("failedPayments", failedPayments.sum());
        map.put("dispatchTimeouts", dispatchTimeouts.sum());
        map.put("activeWebsockets", Math.max(0, activeWebsockets.sum()));
        return map;
    }
}
