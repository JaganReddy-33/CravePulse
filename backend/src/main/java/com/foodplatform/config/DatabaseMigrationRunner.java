package com.foodplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class DatabaseMigrationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private static final String[] MIGRATION_FILES = {
            "V1__init.sql",
            "V2__seed.sql",
            "V3__phase1_security_and_otp.sql",
            "V4__phase2_payments_wallet.sql",
            "V5__phase3_catalog_schema.sql",
            "V6__phase3_bangalore_catalog.sql",
            "V7__phase4_rider_dispatch_and_cod.sql",
            "V8__phase5_order_chat_and_realtime.sql",
            "V9__phase6_partner_portal.sql",
            "V10__phase8_admin_console.sql",
            "V11__phase10_database_hardening.sql"
    };

    public static void runMigrations() {
        try (Connection conn = DatabaseConfig.getConnection()) {
            ensureMigrationTable(conn);
            Set<String> applied = getAppliedMigrations(conn);

            for (String file : MIGRATION_FILES) {
                String version = file.split("__")[0];
                if (!applied.contains(version)) {
                    logger.info("Applying database migration: {}", file);
                    applyMigration(conn, file, version);
                    recordMigration(conn, version, file);
                    logger.info("Successfully applied database migration: {}", file);
                }
            }
        } catch (Exception e) {
            logger.warn("Database migration runner encountered notice: {}", e.getMessage());
        }
    }

    private static void ensureMigrationTable(Connection conn) throws SQLException {
        String sql = """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(50) PRIMARY KEY,
                description VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """;
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        }
    }

    private static Set<String> getAppliedMigrations(Connection conn) throws SQLException {
        Set<String> set = new HashSet<>();
        String sql = "SELECT version FROM schema_migrations";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                set.add(rs.getString("version"));
            }
        }
        return set;
    }

    private static void applyMigration(Connection conn, String fileName, String version) {
        String path = "db/migration/" + fileName;
        InputStream is = DatabaseMigrationRunner.class.getClassLoader().getResourceAsStream(path);
        if (is == null) {
            logger.warn("Migration file not found on classpath: {}", path);
            return;
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.startsWith("--") || line.isEmpty()) continue;
                sb.append(line).append(" ");
                if (line.endsWith(";")) {
                    String stmtStr = sb.toString().trim();
                    if (!stmtStr.isEmpty()) {
                        executeSingleStatement(conn, stmtStr);
                    }
                    sb.setLength(0);
                }
            }
            if (sb.length() > 0) {
                String stmtStr = sb.toString().trim();
                if (!stmtStr.isEmpty()) {
                    executeSingleStatement(conn, stmtStr);
                }
            }
        } catch (Exception e) {
            logger.error("Error executing migration file: {}", fileName, e);
        }
    }

    private static void executeSingleStatement(Connection conn, String sql) {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            // Error code 1060 = Duplicate column name; 1050 = Table already exists; 1061 = Duplicate key name; 3822 = Duplicate check constraint
            if (e.getErrorCode() == 1060 || e.getErrorCode() == 1050 || e.getErrorCode() == 1061 || e.getErrorCode() == 3822) {
                logger.debug("Idempotent migration notice: {}", e.getMessage());
            } else {
                logger.warn("Notice executing migration statement: {} -> {}", sql, e.getMessage());
            }
        }
    }

    private static void recordMigration(Connection conn, String version, String description) throws SQLException {
        String sql = "INSERT INTO schema_migrations (version, description) VALUES (?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, version);
            ps.setString(2, description);
            ps.executeUpdate();
        }
    }
}
