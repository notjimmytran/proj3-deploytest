<?php
ob_start();

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
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
$data = json_decode(file_get_contents('php://input'), true);
$patternId = $data['id'] ?? null;

if (!$patternId) {
    http_response_code(400);
    echo json_encode(['error' => 'Pattern ID is required.']);
    ob_end_flush();
    exit;
}

try {
    // First verify the pattern belongs to the user
    $stmt = $pdo->prepare("SELECT id FROM patterns WHERE id = :id AND user_id = :user_id");
    $stmt->execute([
        'id' => $patternId,
        'user_id' => $userId
    ]);
    
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Pattern not found or access denied.']);
        ob_end_flush();
        exit;
    }
    
    // Delete the pattern
    $stmt = $pdo->prepare("DELETE FROM patterns WHERE id = :id AND user_id = :user_id");
    $result = $stmt->execute([
        'id' => $patternId,
        'user_id' => $userId
    ]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Pattern deleted successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete pattern.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error deleting pattern: " . $e->getMessage());
    echo json_encode(['error' => 'Database error deleting pattern.']);
}

ob_end_flush();
?>