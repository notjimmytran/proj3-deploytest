<?php
session_start();
require_once '../../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required.']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
$stmt->execute(['username' => $username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['is_admin'] = $user['is_admin'];
    echo json_encode(['success' => true, 'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'is_admin' => $user['is_admin']
    ]]);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials.']);
}
?>