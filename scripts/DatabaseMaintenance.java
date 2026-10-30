import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;
import java.io.*;

/** Run from repository root with the backend shaded jar on the classpath. */
public class DatabaseMaintenance {
    public static void main(String[] args) throws Exception {
        Properties p=new Properties();
        try(InputStream in=Files.newInputStream(Path.of("backend/src/main/resources/application.properties"))) {p.load(in);}
        String url=value(p,"db.url","DB_URL");
        String user=value(p,"db.user","DB_USER");
        if(user.isBlank()) user=p.getProperty("db.username","");
        try(Connection c=DriverManager.getConnection(url,user,value(p,"db.password","DB_PASSWORD"))) {
            String db=c.getCatalog();
            System.out.println("Connected database: "+db+"; engine: "+c.getMetaData().getDatabaseProductVersion());
            if(args.length>0 && args[0].equals("create-test")) {
                try(Statement st=c.createStatement()) {st.execute("CREATE DATABASE IF NOT EXISTS cravepulse_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");}
                System.out.println("Disposable cravepulse_test database is available.");return;
            }
            if(args.length==2 && args[0].equals("promote-test-admin")) {
                if(!"cravepulse_test".equals(db)) throw new IllegalStateException("Only permitted in cravepulse_test");
                try(PreparedStatement ps=c.prepareStatement("UPDATE users SET role='ADMIN' WHERE email=?")) {ps.setString(1,args[1]);if(ps.executeUpdate()!=1) throw new IllegalStateException("Test user not found");}
                System.out.println("Test administrator ready.");return;
            }
            List<String> tables=new ArrayList<>();
            try(ResultSet rs=c.getMetaData().getTables(db,null,"%",new String[]{"TABLE"})) {while(rs.next()) tables.add(rs.getString("TABLE_NAME"));}
            Collections.sort(tables);
            for(String table:tables) try(Statement st=c.createStatement();ResultSet rs=st.executeQuery("SELECT COUNT(*) FROM "+quote(table))) {rs.next();System.out.println(table+": "+rs.getLong(1));}
            Set<String> fixtureEmails=new HashSet<>();
            for(String seed:List.of("scripts/seed-demo.sql","backend/src/main/resources/db/migration/V2__seed.sql","backend/src/main/resources/db/migration/V6__phase3_bangalore_catalog.sql")) {
                var matcher=java.util.regex.Pattern.compile("'([^'\\s]+@[^'\\s]+)'").matcher(Files.readString(Path.of(seed)));
                while(matcher.find()) fixtureEmails.add(matcher.group(1).toLowerCase(Locale.ROOT));
            }
            int known=0,unknown=0;
            try(Statement st=c.createStatement();ResultSet rs=st.executeQuery("SELECT email FROM users")) {
                while(rs.next()) {if(fixtureEmails.contains(rs.getString(1).toLowerCase(Locale.ROOT))) known++;else unknown++;}
            }
            System.out.println("Fixture account matches: "+known+"; non-fixture accounts: "+unknown);
            if(args.length==0||args[0].equals("inspect")) return;
            if(args[0].equals("bootstrap-admin")) {
                if(args.length!=3 || !args[1].matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") || args[2].isBlank()) throw new IllegalArgumentException("Provide email and display name");
                String password=Base64.getUrlEncoder().withoutPadding().encodeToString(java.security.SecureRandom.getInstanceStrong().generateSeed(24))+"aA1!";
                try(PreparedStatement ps=c.prepareStatement("INSERT INTO users(full_name,email,phone,password_hash,role,status,wallet_balance) VALUES(?,?,NULL,?,'ADMIN','ACTIVE',0)")) {
                    ps.setString(1,args[2]);ps.setString(2,args[1].toLowerCase(Locale.ROOT));ps.setString(3,org.mindrot.jbcrypt.BCrypt.hashpw(password,org.mindrot.jbcrypt.BCrypt.gensalt(12)));ps.executeUpdate();
                }
                Path output=Path.of(".local-backups","admin-login.txt");Files.createDirectories(output.getParent());
                Files.writeString(output,"Administrator: "+args[2]+"\nEmail: "+args[1]+"\nTemporary password: "+password+"\nKeep this file private.\n",StandardCharsets.UTF_8,StandardOpenOption.CREATE_NEW);
                System.out.println("Administrator created. Credentials saved privately to "+output.toAbsolutePath());return;
            }
            if(args[0].equals("clear-fixtures") || args[0].equals("clear-test") || args[0].equals("reset-local-demo")) {
                boolean test=args[0].equals("clear-test");
                boolean localReset=args[0].equals("reset-local-demo");
                if(test) {
                    if(!"cravepulse_test".equals(db)) throw new IllegalStateException("Test cleanup requires cravepulse_test");
                    try(Statement st=c.createStatement();ResultSet rs=st.executeQuery("SELECT COUNT(*) FROM users WHERE email NOT REGEXP '^[a-z]+-[a-f0-9]{8}@example[.]invalid$'")) {
                        rs.next();if(rs.getLong(1)>0) throw new IllegalStateException("Unrecognized test accounts; refusing cleanup");
                    }
                } else if(localReset) {
                    if(args.length!=4 || !"food_delivery_db".equals(db) || !db.equals(args[1])
                            || !"RESET_LOCAL_food_delivery_db".equals(args[3])) {
                        throw new IllegalArgumentException("Local reset requires the exact database name and confirmation RESET_LOCAL_food_delivery_db");
                    }
                    String jdbcUrl=c.getMetaData().getURL();
                    String host=java.net.URI.create(jdbcUrl.substring("jdbc:".length())).getHost();
                    if(host==null || !Set.of("localhost","127.0.0.1","::1","[::1]").contains(host.toLowerCase(Locale.ROOT))) {
                        throw new IllegalStateException("Local reset is allowed only for a loopback MySQL connection");
                    }
                    Path previous=Path.of(args[2]);
                    if(!Files.isRegularFile(previous) || Files.size(previous)<100) throw new IllegalStateException("A nonempty local backup is required");
                    try(BufferedReader reader=Files.newBufferedReader(previous)) {
                        if(!("-- CravePulse database backup: "+db).equals(reader.readLine())) {
                            throw new IllegalStateException("Backup does not identify the selected local database");
                        }
                    }
                } else {
                    if(args.length!=3 || !db.equals(args[1])) throw new IllegalArgumentException("Pass exact database name and backup path");
                    Path previous=Path.of(args[2]);
                    if(!Files.isRegularFile(previous)||Files.size(previous)<100) throw new IllegalStateException("A nonempty backup is required");
                    if(unknown>0) throw new IllegalStateException("Non-fixture accounts found; refusing to delete real user data");
                }
                Set<String> pending=new LinkedHashSet<>(tables);
                pending.removeAll(Set.of("schema_migrations","platform_settings","discovery_categories"));
                List<String> deletionOrder=new ArrayList<>();
                Map<String,Set<String>> dependents=new HashMap<>();
                try(PreparedStatement ps=c.prepareStatement("SELECT TABLE_NAME,REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL")) {
                    ps.setString(1,db);try(ResultSet refs=ps.executeQuery()) {while(refs.next()) dependents.computeIfAbsent(refs.getString(2),key->new HashSet<>()).add(refs.getString(1));}
                }
                while(!pending.isEmpty()) {
                    String leaf=null;
                    for(String table:pending) {
                        boolean referenced=false;
                        for(String child:dependents.getOrDefault(table,Set.of())) if(pending.contains(child)&&!table.equals(child)) referenced=true;
                        if(!referenced) {leaf=table;break;}
                    }
                    if(leaf==null) throw new IllegalStateException("Foreign-key cycle; manual review required");
                    deletionOrder.add(leaf);pending.remove(leaf);
                }
                c.setAutoCommit(false);
                try {
                    for(String table:deletionOrder) try(Statement st=c.createStatement()) {st.executeUpdate("DELETE FROM "+quote(table));}
                    c.commit();System.out.println((localReset?"Local demo database":"Fixture records")+" cleared transactionally. Schema migration history, platform settings, and discovery categories retained.");
                } catch(Exception e) {c.rollback();throw e;}
                return;
            }
            if(!args[0].equals("backup")) throw new IllegalArgumentException("Supported commands: inspect, backup, clear-fixtures");
            Path dir=Path.of(".local-backups");Files.createDirectories(dir);
            Path backup=dir.resolve("database-"+System.currentTimeMillis()+".sql");
            // Consistent read view for InnoDB data; stop application writers before a reset.
            c.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);c.setAutoCommit(false);
            try(BufferedWriter out=Files.newBufferedWriter(backup,StandardCharsets.UTF_8)) {
                out.write("-- CravePulse database backup: "+db+"\nSET FOREIGN_KEY_CHECKS=0;\n");
                for(String table:tables) {
                    try(Statement st=c.createStatement();ResultSet rs=st.executeQuery("SHOW CREATE TABLE "+quote(table))) {rs.next();out.write("DROP TABLE IF EXISTS "+quote(table)+";\n"+rs.getString(2)+";\n");}
                    try(Statement st=c.createStatement();ResultSet rs=st.executeQuery("SELECT * FROM "+quote(table))) {
                        ResultSetMetaData m=rs.getMetaData();
                        while(rs.next()) {
                            out.write("INSERT INTO "+quote(table)+" VALUES (");
                            for(int i=1;i<=m.getColumnCount();i++) {
                                if(i>1) out.write(",");
                                byte[] bytes=rs.getBytes(i);
                                if(bytes==null) out.write("NULL");
                                else out.write("X'"+HexFormat.of().formatHex(bytes)+"'");
                            }
                            out.write(");\n");
                        }
                    }
                }
                out.write("SET FOREIGN_KEY_CHECKS=1;\n");
            }
            c.rollback();System.out.println("Backup saved: "+backup.toAbsolutePath());
        }
    }
    private static String quote(String s) {return "`"+s.replace("`","``")+"`";}
    private static String value(Properties p,String key,String env) {String v=System.getenv(env);return v!=null&&!v.isBlank()?v:p.getProperty(key,"");}
}
