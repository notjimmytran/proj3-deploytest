<?php
// filepath: server/api/game/load_state.php
ob_start();

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
    // First, check if this user has any saved game state
    $stmt = $pdo->prepare("
        SELECT game_state, generations, population, updated_at 
        FROM game_states 
        WHERE user_id = :user_id 
        ORDER BY updated_at DESC
        LIMIT 1
    ");
    $stmt->execute(['user_id' => $userId]);
    $state = $stmt->fetch();
    
    if ($state) {
        // Return the game state if found
        echo json_encode([
            'success' => true,
            'state' => $state['game_state'],
            'generations' => $state['generations'],
            'population' => $state['population'],
            'updated_at' => $state['updated_at']
        ]);
    } else {
        // No saved game state for this user
        echo json_encode([
            'success' => false,
            'message' => 'No saved game state found.'
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error loading game state: " . $e->getMessage());
    echo json_encode(['error' => 'Database error loading game state.']);
}

ob_end_flush();
?>