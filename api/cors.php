<?php
/**
 * CORS headers for local Vite dev server.
 *
 * Include this at the top of every public endpoint.
 * In production, tighten CORS_ORIGIN to the actual domain.
 *
 * @package TLevelQuiz\API
 * @license CC BY-NC-SA 4.0
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed = [
    'http://localhost:5173',
    'http://localhost',
    'http://127.0.0.1',
    'http://127.0.0.1:5173',
];

if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
