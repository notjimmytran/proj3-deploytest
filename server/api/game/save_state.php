<?php
// filepath: server/api/game/save_state.php
ob_start();

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

if (!isset($data['state']) || !is_array($data['state'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid game state data.']);
    ob_end_flush();
    exit;
}

$gameState = json_encode($data['state']);
$generations = (int)($data['generations'] ?? 0);
$population = (int)($data['population'] ?? 0);

try {
    // Check if user already has a saved state
    $stmt = $pdo->prepare("SELECT id FROM game_states WHERE user_id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Update existing state
        $stmt = $pdo->prepare("
            UPDATE game_states 
            SET game_state = :game_state, generations = :generations, population = :population, updated_at = NOW()
            WHERE user_id = :user_id
        ");
    } else {
        // Insert new state
        $stmt = $pdo->prepare("
            INSERT INTO game_states (user_id, game_state, generations, population)
            VALUES (:user_id, :game_state, :generations, :population)
        ");
    }
    
    $result = $stmt->execute([
        'user_id' => $userId,
        'game_state' => $gameState,
        'generations' => $generations,
        'population' => $population
    ]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save game state.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error saving game state: " . $e->getMessage());
    echo json_encode(['error' => 'Database error saving game state: ' . $e->getMessage()]);
}

ob_end_flush();
?>