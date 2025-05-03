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
$patternId = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

if (!$patternId) {
    http_response_code(400);
    echo json_encode(['error' => 'Pattern ID is required.']);
    ob_end_flush();
    exit;
}

try {
    // Get the pattern, ensuring it belongs to the current user
    $stmt = $pdo->prepare("
        SELECT id, name, pattern_data, created_at
        FROM patterns
        WHERE id = :id AND user_id = :user_id
    ");
    $stmt->execute([
        'id' => $patternId,
        'user_id' => $userId
    ]);
    $pattern = $stmt->fetch();
    
    if ($pattern) {
        // Convert pattern_data from JSON string to array
        $pattern['pattern_data'] = json_decode($pattern['pattern_data']);
        
        echo json_encode([
            'success' => true,
            'pattern' => $pattern
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Pattern not found or access denied.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error getting pattern: " . $e->getMessage());
    echo json_encode(['error' => 'Database error getting pattern.']);
}

ob_end_flush();
?>