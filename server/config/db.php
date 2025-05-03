<?php
// Database connection settings for Game of Life project
try {
    // Add connection status logging
    error_log("Attempting database connection...");
    
    $dsn = 'pgsql:host=localhost;port=5432;dbname=gameoflife';
    $user = 'postgres';
    $pass = '1223:';

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, $user, $pass, $options);
    error_log("Database connection successful");
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    
    // This line makes errors visible in the response
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    die();
}
?>