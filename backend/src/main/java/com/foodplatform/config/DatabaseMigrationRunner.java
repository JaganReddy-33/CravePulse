package com.foodplatform.config;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.*;
import java.util.*;
import java.util.regex.*;

/** Versioned schema migrations. Business fixtures are never applied at startup. */
public final class DatabaseMigrationRunner {
    private static final String[] FILES = {
        "V1__init.sql", "V2__seed.sql", "V3__phase1_security_and_otp.sql",
        "V4__phase2_payments_wallet.sql", "V5__phase3_catalog_schema.sql",
        "V6__phase3_bangalore_catalog.sql", "V7__phase4_rider_dispatch_and_cod.sql",
        "V8__phase5_order_chat_and_realtime.sql", "V9__phase6_partner_portal.sql",
        "V10__phase8_admin_console.sql", "V11__phase10_database_hardening.sql",
        "V12__jobs_and_applications.sql", "V13__real_application_data.sql", "V14__identity_and_integrity.sql",
        "V15__unknown_catalog_metadata.sql", "V16__optional_menu_photography.sql", "V17__completed_dispatch_state.sql",
        "V18__optional_cost_estimates.sql", "V19__discovery_categories.sql", "V20__repair_rider_cash_columns.sql",
        "V21__manual_payout_requests.sql", "V22__repair_restaurant_commission_rate.sql"
    };
    public static void runMigrations() {
        try (Connection conn = DatabaseConfig.getConnection()) {
            try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery("SELECT GET_LOCK('cravepulse_schema', 30)")) {
                if (!rs.next() || rs.getInt(1) != 1) throw new SQLException("Cannot acquire migration lock");
            }
            try {
                execute(conn, "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(50) PRIMARY KEY, description VARCHAR(255) NOT NULL, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
                if (!columnExists(conn, "schema_migrations", "checksum")) execute(conn, "ALTER TABLE schema_migrations ADD COLUMN checksum VARCHAR(64) NULL");
                Map<String, String> applied = new HashMap<>();
                try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery("SELECT version, checksum FROM schema_migrations")) {
                    while (rs.next()) applied.put(rs.getString(1), rs.getString(2));
                }
                for (String file : FILES) {
                    String version = file.split("__")[0];
                    String source;
                    try (InputStream in = DatabaseMigrationRunner.class.getClassLoader().getResourceAsStream("db/migration/" + file)) {
                        if (in == null) throw new IOException("Missing migration: " + file);
                        source = new String(in.readAllBytes(), StandardCharsets.UTF_8);
                    }
                    String checksum = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(source.getBytes(StandardCharsets.UTF_8)));
                    if (applied.containsKey(version)) {
                        // Legacy checksums remain unknown; do not claim their schema was verified.
                        if (applied.get(version) != null && !checksum.equals(applied.get(version))) throw new SQLException("Migration checksum mismatch: " + version);
                        continue;
                    }
                    if (version.equals("V1") && tableExists(conn, "users")) throw new SQLException("Existing schema without V1 history; refusing destructive initialization");
                    StringBuilder pending = new StringBuilder();
                    for (String line : source.split("\\R")) {
                        if (line.trim().startsWith("--") || line.isBlank()) continue;
                        pending.append(line.trim()).append(' ');
                        if (!line.trim().endsWith(";")) continue;
                        String sql = pending.toString().trim(); pending.setLength(0);
                        if (version.equals("V6")) continue;
                        if (version.equals("V2") && !sql.startsWith("INSERT INTO platform_settings")) continue;
                        if (version.equals("V1") && (sql.startsWith("DROP TABLE") || sql.startsWith("SET FOREIGN_KEY_CHECKS"))) continue;
                        executeCompatible(conn, sql);
                    }
                    if (!pending.toString().isBlank()) throw new SQLException("Unterminated migration: " + file);
                    try (PreparedStatement ps = conn.prepareStatement("INSERT INTO schema_migrations(version,description,checksum) VALUES (?,?,?)")) {
                        ps.setString(1, version); ps.setString(2, file); ps.setString(3, checksum); ps.executeUpdate();
                    }
                }
            } finally {
                try (Statement st = conn.createStatement()) { st.execute("SELECT RELEASE_LOCK('cravepulse_schema')"); }
            }
        } catch (Exception e) {
            throw new IllegalStateException("Database migration failed; startup stopped. Inspect schema before retrying.", e);
        }
    }
    private static boolean tableExists(Connection c, String table) throws SQLException {
        try (ResultSet rs = c.getMetaData().getTables(c.getCatalog(), null, table, new String[]{"TABLE"})) { return rs.next(); }
    }
    private static boolean columnExists(Connection c, String table, String col) throws SQLException {
        try (ResultSet rs = c.getMetaData().getColumns(c.getCatalog(), null, table, col)) { return rs.next(); }
    }
    private static void executeCompatible(Connection c, String sql) throws SQLException {
        sql = sql.replaceFirst(";\\s*$", "").trim();
        Matcher alterColumn = Pattern.compile("(?is)^ALTER TABLE (\\w+) ALTER COLUMN (\\w+) DROP DEFAULT$").matcher(sql);
        if (alterColumn.matches() && !columnExists(c, alterColumn.group(1), alterColumn.group(2))) return;

        Matcher modifyColumn = Pattern.compile("(?is)^ALTER TABLE (\\w+) MODIFY COLUMN (\\w+) (.+)$").matcher(sql);
        if (modifyColumn.matches() && !columnExists(c, modifyColumn.group(1), modifyColumn.group(2))) {
            execute(c, "ALTER TABLE " + modifyColumn.group(1) + " ADD COLUMN "
                    + modifyColumn.group(2) + " " + modifyColumn.group(3));
            return;
        }

        Matcher m = Pattern.compile("(?is)^ALTER TABLE (\\w+) (ADD COLUMN .*)").matcher(sql);
        if (m.matches() && sql.contains("IF NOT EXISTS")) {
            String table = m.group(1);
            for (String part : m.group(2).replaceAll(";\\s*$", "").split(",\\s*(?=ADD COLUMN)")) {
                Matcher col = Pattern.compile("(?is)ADD COLUMN (?:IF NOT EXISTS )?(\\w+) (.*)").matcher(part.trim());
                if (!col.matches()) throw new SQLException("Unsupported column migration");
                if (!columnExists(c, table, col.group(1))) execute(c, "ALTER TABLE " + table + " ADD COLUMN " + col.group(1) + " " + col.group(2));
            }
            return;
        }
        try { execute(c, sql); }
        catch (SQLException e) {
            if (!(sql.startsWith("ALTER TABLE") || sql.startsWith("CREATE INDEX") || sql.startsWith("CREATE UNIQUE INDEX")) || !Set.of(1060, 1061, 3822).contains(e.getErrorCode())) throw e;
        }
    }
    private static void execute(Connection c, String sql) throws SQLException {
        try (Statement st = c.createStatement()) { st.execute(sql); }
    }
}
