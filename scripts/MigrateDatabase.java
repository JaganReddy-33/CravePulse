import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.config.DatabaseMigrationRunner;

public class MigrateDatabase {

    public static void main(String[] args) {
        try {
            DatabaseMigrationRunner.runMigrations();
            System.out.println("Migrations complete.");
        } finally {
            DatabaseConfig.shutdown();
        }
    }
}
