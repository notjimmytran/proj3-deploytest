<?php
// Ensure no output before headers
ob_start();

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once __DIR__ . '/../../config/db.php';

// Clear any previous output
ob_end_clean();

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$username || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required.']);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE username = :username OR email = :email");
$stmt->execute(['username' => $username, 'email' => $email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Username or email already exists.']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (:username, :email, :password)");
$stmt->execute(['username' => $username, 'email' => $email, 'password' => $hash]);

echo json_encode(['success' => true]);
?>