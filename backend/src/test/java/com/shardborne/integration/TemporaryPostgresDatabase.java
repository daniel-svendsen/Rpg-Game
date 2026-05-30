package com.shardborne.integration;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.Properties;

public final class TemporaryPostgresDatabase {

    private static final String DEFAULT_JWT_SECRET = "integration-test-secret-at-least-32-characters";
    private static final String TEST_DATABASE_PREFIX = "shardborne_it_";

    private final String maintenanceJdbcUrl;
    private final String username;
    private final String password;
    private final String jwtSecret;
    private final String databaseName;

    private TemporaryPostgresDatabase(
            String maintenanceJdbcUrl,
            String username,
            String password,
            String jwtSecret,
            String databaseName
    ) {
        this.maintenanceJdbcUrl = maintenanceJdbcUrl;
        this.username = username;
        this.password = password;
        this.jwtSecret = jwtSecret;
        this.databaseName = databaseName;
    }

    public static TemporaryPostgresDatabase createFromLocalConfig() throws IOException, SQLException {
        Path configPath = Path.of("..", "dev.local.properties").normalize();

        if (!Files.exists(configPath)) {
            throw new IllegalStateException("Missing dev.local.properties. DB integration tests require local PostgreSQL config.");
        }

        Properties properties = new Properties();
        try (InputStream inputStream = Files.newInputStream(configPath)) {
            properties.load(inputStream);
        }

        String databaseUrl = requiredProperty(properties, "APP_DATABASE_URL");
        String username = requiredProperty(properties, "APP_DATABASE_USERNAME");
        String password = requiredProperty(properties, "APP_DATABASE_PASSWORD");
        String jwtSecret = properties.getProperty("APP_JWT_SECRET", DEFAULT_JWT_SECRET);

        JdbcConnectionParts jdbcParts = parseJdbcUrl(databaseUrl);
        String databaseName = TEST_DATABASE_PREFIX + Instant.now().toEpochMilli();
        String maintenanceJdbcUrl = "jdbc:postgresql://%s:%d/postgres".formatted(jdbcParts.host(), jdbcParts.port());

        TemporaryPostgresDatabase database = new TemporaryPostgresDatabase(
                maintenanceJdbcUrl,
                username,
                password,
                jwtSecret,
                databaseName
        );
        database.createDatabase();
        return database;
    }

    public String getDatabaseJdbcUrl() {
        return maintenanceJdbcUrl.replace("/postgres", "/" + databaseName);
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getJwtSecret() {
        return jwtSecret;
    }

    public void dropDatabase() throws SQLException {
        assertManagedDatabaseName();
        try (Connection connection = openMaintenanceConnection();
             Statement terminateStatement = connection.createStatement();
             Statement dropStatement = connection.createStatement()) {
            terminateStatement.execute(
                    "select pg_terminate_backend(pid) from pg_stat_activity where datname = '%s' and pid <> pg_backend_pid()"
                            .formatted(databaseName)
            );
            dropStatement.execute("drop database if exists \"%s\"".formatted(databaseName));
        }
    }

    private void createDatabase() throws SQLException {
        assertManagedDatabaseName();
        try (Connection connection = openMaintenanceConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("create database \"%s\"".formatted(databaseName));
        }
    }

    private void assertManagedDatabaseName() {
        if (!databaseName.startsWith(TEST_DATABASE_PREFIX)) {
            throw new IllegalStateException("Refusing to manage unexpected database name: " + databaseName);
        }
    }

    private Connection openMaintenanceConnection() throws SQLException {
        return DriverManager.getConnection(maintenanceJdbcUrl, username, password);
    }

    private static String requiredProperty(Properties properties, String key) {
        String value = properties.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required property: " + key);
        }
        return value;
    }

    private static JdbcConnectionParts parseJdbcUrl(String databaseUrl) {
        String prefix = "jdbc:postgresql://";
        if (!databaseUrl.startsWith(prefix)) {
            throw new IllegalStateException("APP_DATABASE_URL must start with " + prefix);
        }

        String remainder = databaseUrl.substring(prefix.length());
        int slashIndex = remainder.indexOf('/');
        if (slashIndex < 0) {
            throw new IllegalStateException("APP_DATABASE_URL must include a database name.");
        }

        String hostPort = remainder.substring(0, slashIndex);
        String[] parts = hostPort.split(":", 2);
        String host = parts[0];
        int port = parts.length == 2 ? Integer.parseInt(parts[1]) : 5432;
        return new JdbcConnectionParts(host, port);
    }

    private record JdbcConnectionParts(String host, int port) {
    }
}
