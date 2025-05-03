<?php
ob_start();

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit();
}

session_start();
require_once __DIR__ . '/../../config/db.php';

// Clear potential stray output
ob_end_clean();
ob_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated.']);
    ob_end_flush();
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Get patterns for the current user
    $stmt = $pdo->prepare("
        SELECT id, name, created_at
        FROM patterns
        WHERE user_id = :user_id
        ORDER BY created_at DESC
    ");
    $stmt->execute(['user_id' => $userId]);
    $patterns = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'patterns' => $patterns
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error listing patterns: " . $e->getMessage());
    echo json_encode(['error' => 'Database error listing patterns.']);
}

ob_end_flush();
?>