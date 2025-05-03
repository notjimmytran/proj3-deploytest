<?php
// Ensure no output before headers
ob_start();

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

function debug_log($message) {
    error_log("LOGIN_DEBUG: " . $message);
}

debug_log("Login script started");

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    debug_log("Handling OPTIONS request");
    http_response_code(200);
    exit();
}

debug_log("Starting session");
session_start();
debug_log("Session ID: " . session_id());

try {
    require_once __DIR__ . '/../../config/db.php';
    debug_log("Database config loaded");
} catch (Exception $e) {
    debug_log("Error loading DB config: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

// Clear any previous output
ob_end_clean();

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

debug_log("Login attempt for username: " . $username);

if (!$username || !$password) {
    debug_log("Missing username or password");
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        debug_log("Login successful for user ID: " . $user['id']);
        
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['is_admin'] = $user['is_admin'] ?? false;
        
        debug_log("Session variables set: " . print_r($_SESSION, true));
        
        echo json_encode(['success' => true, 'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'is_admin' => $user['is_admin'] ?? false
        ]]);
    } else {
        debug_log("Invalid credentials");
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials.']);
    }
} catch (PDOException $e) {
    debug_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error during login.']);
}
?>