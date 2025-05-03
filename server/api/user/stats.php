<?php
ob_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit();
}

session_start();
require_once __DIR__ . '/../../config/db.php';

ob_end_clean();
ob_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated.']);
    ob_end_flush();
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Username
    $stmt = $pdo->prepare("SELECT username FROM users WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    // Total games played
    $stmt = $pdo->prepare("SELECT COUNT(*) AS total_games FROM game_sessions WHERE user_id = :id");
    $stmt->execute(['id' => $userId]);
    $games = $stmt->fetch();

    // Total patterns saved
    $stmt = $pdo->prepare("SELECT COUNT(*) AS total_patterns FROM patterns WHERE user_id = :id");
    $stmt->execute(['id' => $userId]);
    $patterns = $stmt->fetch();

    // Best generation and population
    $stmt = $pdo->prepare("SELECT MAX(generations) AS best_generation, MAX(population) AS best_population FROM game_sessions WHERE user_id = :id");
    $stmt->execute(['id' => $userId]);
    $best = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'username' => $user['username'],
        'total_games' => (int)$games['total_games'],
        'total_patterns' => (int)$patterns['total_patterns'],
        'best_generation' => (int)$best['best_generation'],
        'best_population' => (int)$best['best_population']
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

ob_end_flush();
?>