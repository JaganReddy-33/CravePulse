package com.foodplatform.service;

import com.foodplatform.dao.RiderDao;
import com.foodplatform.daoImpl.RiderDaoImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class RetentionService {

    private static final Logger logger = LoggerFactory.getLogger(RetentionService.class);

    private static final int DEFAULT_LOCATION_RETENTION_DAYS = 7;
    private final RiderDao riderDao;
    private final ScheduledExecutorService scheduler;

    public RetentionService() {
        this(new RiderDaoImpl());
    }

    public RetentionService(RiderDao riderDao) {
        this.riderDao = riderDao;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "retention-worker");
            t.setDaemon(true);
            return t;
        });
    }

    public void startScheduledRetention() {
        // Run once on startup after 1 minute, then every 24 hours
        scheduler.scheduleAtFixedRate(this::executeRetentionSweep, 1, 1440, TimeUnit.MINUTES);
        logger.info("RetentionService initialized with 7-day retention policy on rider telemetry logs");
    }

    public int executeRetentionSweep() {
        try {
            logger.info("Executing telemetry retention sweep (retaining {} days)...", DEFAULT_LOCATION_RETENTION_DAYS);
            int purged = riderDao.purgeOldLocationLogs(DEFAULT_LOCATION_RETENTION_DAYS);
            logger.info("Telemetry retention sweep completed: purged {} logs", purged);
            return purged;
        } catch (Exception e) {
            logger.error("Error executing telemetry retention sweep", e);
            return 0;
        }
    }

    public void stop() {
        scheduler.shutdown();
    }
}
