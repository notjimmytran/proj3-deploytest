<?php
ob_start(); // Start output buffering

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Debug log function
function debug_log($message) {
    error_log("SAVE_SESSION_DEBUG: " . $message);
}

debug_log("save_session.php started");

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    debug_log("Handling OPTIONS request");
    http_response_code(200);
    ob_end_flush(); // Send buffered output (headers)
    exit();
}

debug_log("Starting session");
session_start();
debug_log("Session ID: " . session_id());
debug_log("SESSION data: " . print_r($_SESSION, true));

try {
    debug_log("Including database config");
    require_once __DIR__ . '/../../config/db.php'; // Adjust path if necessary
    debug_log("Database config included successfully");
} catch (Exception $e) {
    debug_log("Error including database config: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

// Clear any potential stray output before JSON
ob_end_clean();
ob_start(); // Start buffering again for JSON output

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    debug_log("No user_id in session!");
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'User not authenticated.']);
    ob_end_flush();
    exit;
}

$userId = $_SESSION['user_id'];
debug_log("User ID: " . $userId);

// Parse input data
$raw_input = file_get_contents('php://input');
debug_log("Raw input: " . $raw_input);
$data = json_decode($raw_input, true);
debug_log("Decoded data: " . print_r($data, true));
$action = $data['action'] ?? null;

if ($action === 'start') {
    debug_log("Processing START action");
    try {
        $stmt = $pdo->prepare("INSERT INTO game_sessions (user_id, start_time) VALUES (:user_id, NOW())");
        debug_log("Prepared statement");
        
        $result = $stmt->execute(['user_id' => $userId]);
        debug_log("Execute result: " . ($result ? 'true' : 'false'));
        
        if (!$result) {
            debug_log("Execute error info: " . print_r($stmt->errorInfo(), true));
        }
        
        $sessionId = $pdo->lastInsertId();
        debug_log("Last insert ID: " . $sessionId);

        if ($sessionId) {
            debug_log("Responding with success and session ID: " . $sessionId);
            echo json_encode(['success' => true, 'sessionId' => (int)$sessionId]);
        } else {
            debug_log("Failed to get last insert ID");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to start session.']);
        }
    } catch (PDOException $e) {
        debug_log("Database error: " . $e->getMessage());
        http_response_code(500);
        error_log("Database error starting session: " . $e->getMessage());
        echo json_encode(['error' => 'Database error starting session: ' . $e->getMessage()]);
    }

} elseif ($action === 'end') {
    debug_log("Processing END action");
    $sessionId = filter_var($data['sessionId'] ?? null, FILTER_VALIDATE_INT);
    $generation = filter_var($data['generation'] ?? 0, FILTER_VALIDATE_INT);
    $population = filter_var($data['population'] ?? 0, FILTER_VALIDATE_INT);
    debug_log("Session ID: $sessionId, Generation: $generation, Population: $population");

    if (!$sessionId) {
        debug_log("No valid session ID provided");
        http_response_code(400);
        echo json_encode(['error' => 'Session ID is required to end a session.']);
        ob_end_flush();
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE game_sessions SET end_time = NOW(), generations = :generations, population = :population WHERE id = :session_id AND user_id = :user_id");
        debug_log("Prepared update statement");
        
        $result = $stmt->execute([
            'generations' => $generation,
            'population' => $population,
            'session_id' => $sessionId,
            'user_id' => $userId
        ]);
        debug_log("Execute result: " . ($result ? 'true' : 'false'));
        debug_log("Rows affected: " . $stmt->rowCount());

        if ($result && $stmt->rowCount() > 0) {
            debug_log("Session ended successfully");
            echo json_encode(['success' => true]);
        } else if ($result && $stmt->rowCount() === 0) {
             debug_log("Session not found or user mismatch");
             http_response_code(404);
             echo json_encode(['error' => 'Session not found or user mismatch.']);
        } else {
            debug_log("Failed to end session");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to end session.']);
        }
    } catch (PDOException $e) {
        debug_log("Database error: " . $e->getMessage());
        http_response_code(500);
        error_log("Database error ending session: " . $e->getMessage());
        echo json_encode(['error' => 'Database error ending session: ' . $e->getMessage()]);
    }

} else {
    debug_log("Invalid action: " . ($action ?? 'null'));
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Invalid action specified.']);
}

debug_log("save_session.php completed");
ob_end_flush(); // Send the final JSON output
?>