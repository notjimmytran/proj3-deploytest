<?php
// filepath: server/api/patterns/save_pattern.php
ob_start();

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

if (!isset($data['name']) || !isset($data['pattern_data']) || !is_array($data['pattern_data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid pattern data. Name and pattern cells required.']);
    ob_end_flush();
    exit;
}

$name = trim($data['name']);
$patternData = json_encode($data['pattern_data']);

if (empty($name)) {
    http_response_code(400);
    echo json_encode(['error' => 'Pattern name cannot be empty.']);
    ob_end_flush();
    exit;
}

try {
    // Check if pattern name already exists for this user
    $stmt = $pdo->prepare("SELECT id FROM patterns WHERE user_id = :user_id AND name = :name");
    $stmt->execute([
        'user_id' => $userId,
        'name' => $name
    ]);
    
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Update existing pattern
        $stmt = $pdo->prepare("
            UPDATE patterns 
            SET pattern_data = :pattern_data 
            WHERE id = :id
        ");
        $result = $stmt->execute([
            'pattern_data' => $patternData,
            'id' => $existing['id']
        ]);
        
        if ($result) {
            echo json_encode([
                'success' => true, 
                'message' => 'Pattern updated successfully.',
                'id' => $existing['id']
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update pattern.']);
        }
    } else {
        // Insert new pattern
        $stmt = $pdo->prepare("
            INSERT INTO patterns (user_id, name, pattern_data)
            VALUES (:user_id, :name, :pattern_data)
        ");
        $result = $stmt->execute([
            'user_id' => $userId,
            'name' => $name,
            'pattern_data' => $patternData
        ]);
        
        if ($result) {
            $patternId = $pdo->lastInsertId();
            echo json_encode([
                'success' => true, 
                'message' => 'Pattern saved successfully.',
                'id' => $patternId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save pattern.']);
        }
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error saving pattern: " . $e->getMessage());
    echo json_encode(['error' => 'Database error saving pattern.']);
}

ob_end_flush();
?>