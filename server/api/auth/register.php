<?php
session_start();
require_once '/Users/jonathanermias/Documents/GitHub/project3/server/config/db.php';

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