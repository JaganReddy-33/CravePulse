package com.foodplatform.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

public final class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);
    private static volatile HikariDataSource dataSource;

    private DatabaseConfig() {
    }

    public static DataSource getDataSource() {
        if (dataSource == null) {
            synchronized (DatabaseConfig.class) {
                if (dataSource == null) {
                    try {
                        HikariConfig config = new HikariConfig();
                        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
                        boolean test = Boolean.getBoolean("cravepulse.testMode");
                        String url = test ? System.getenv("TEST_DB_URL") : AppProperties.getDbUrl();
                        if (test && (url == null || !url.matches("(?i).*[/]cravepulse_test(?:[?].*)?$"))) {
                            throw new IllegalStateException("Tests require a disposable cravepulse_test database via TEST_DB_URL, TEST_DB_USER and TEST_DB_PASSWORD");
                        }
                        config.setJdbcUrl(url);
                        config.setUsername(test ? System.getenv("TEST_DB_USER") : AppProperties.getDbUser());
                        config.setPassword(test ? System.getenv("TEST_DB_PASSWORD") : AppProperties.getDbPassword());

                        // Connection pool performance tuning
                        config.setMaximumPoolSize(20);
                        config.setMinimumIdle(5);
                        config.setIdleTimeout(300000);
                        config.setConnectionTimeout(30000);
                        config.setMaxLifetime(1800000);
                        config.setLeakDetectionThreshold(15000);
                        config.setPoolName("FoodPlatformHikariPool");

                        // MySQL optimization properties
                        config.addDataSourceProperty("cachePrepStmts", "true");
                        config.addDataSourceProperty("prepStmtCacheSize", "250");
                        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
                        config.addDataSourceProperty("useServerPrepStmts", "true");
                        config.addDataSourceProperty("useLocalSessionState", "true");
                        config.addDataSourceProperty("rewriteBatchedStatements", "true");
                        config.addDataSourceProperty("cacheResultSetMetadata", "true");
                        config.addDataSourceProperty("cacheServerConfiguration", "true");
                        config.addDataSourceProperty("elideSetAutoCommits", "true");
                        config.addDataSourceProperty("maintainTimeStats", "false");

                        dataSource = new HikariDataSource(config);
                        logger.info("HikariCP DataSource initialized successfully for: {}", AppProperties.getDbUrl());
                    } catch (Exception e) {
                        logger.error("Failed to initialize HikariCP connection pool", e);
                        throw new RuntimeException("Database pool initialization failed", e);
                    }
                }
            }
        }
        return dataSource;
    }

    public static Connection getConnection() throws SQLException {
        return getDataSource().getConnection();
    }

    public static void shutdown() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            logger.info("HikariCP DataSource shut down.");
        }
    }
}
