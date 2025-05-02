<?php
// Handle CORS for all requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Credentials: true");
    http_response_code(200);
    exit();
}
// Add CORS headers for non-OPTIONS requests too
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");

// API Router
$request_uri = $_SERVER['REQUEST_URI'];

// Strip query string
if (($pos = strpos($request_uri, '?')) !== false) {
    $request_uri = substr($request_uri, 0, $pos);
}

// Log for debugging
error_log("Received request: $request_uri");

// Handle both path formats - with and without /server prefix
if (strpos($request_uri, '/api/auth/') === 0) {
    // Auth endpoints with /api prefix
    $file_path = "../api" . substr($request_uri, 4); 
    error_log("Looking for file at: $file_path");
    
    if (file_exists($file_path)) {
        include $file_path;
        exit;
    }
} elseif (strpos($request_uri, '/server/api/auth/') === 0) {
    // Auth endpoints with /server/api prefix
    $file_path = "../api/auth" . substr($request_uri, 12); // Remove '/server/api/auth' and add '../api/auth'
    error_log("Looking for file at: $file_path");
    
    if (file_exists($file_path)) {
        include $file_path;
        exit;
    }
} elseif (strpos($request_uri, '/api/') === 0) {
    // Other API endpoints with /api prefix
    $file_path = "../api" . substr($request_uri, 4);
    error_log("Looking for file at: $file_path");
    
    if (file_exists($file_path)) {
        include $file_path;
        exit;
    }
} elseif (strpos($request_uri, '/server/api/') === 0) {
    // Other API endpoints with /server/api prefix
    $file_path = "../api" . substr($request_uri, 11); // Remove '/server/api' and add '../api'
    error_log("Looking for file at: $file_path");
    
    if (file_exists($file_path)) {
        include $file_path;
        exit;
    }
}

// For SPA frontend routing - serve index.html
if (file_exists('index.html')) {
    readfile('index.html');
    exit;
}

// Default 404 response
header('HTTP/1.1 404 Not Found');
echo json_encode(['error' => 'Not Found']);
?>