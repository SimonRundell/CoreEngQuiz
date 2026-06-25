<?php
/**
 * Admin login endpoint.
 *
 * POST /api/admin/login.php
 *   Body: { username, password }
 *   Returns { ok: true } and sets a PHP session on success.
 *
 * @package TLevelQuiz\API\Admin
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

$cfg = getConfig();
session_name($cfg['session_name']);
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if ($username === '' || $password === '') {
    jsonResponse(['error' => 'Username and password required'], 400);
}

$pdo  = getDB();
$stmt = $pdo->prepare("SELECT id, password_hash FROM admin_users WHERE username = ? LIMIT 1");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(['error' => 'Invalid credentials'], 401);
}

session_regenerate_id(true);
$_SESSION['admin_id']       = $user['id'];
$_SESSION['admin_username'] = $username;

jsonResponse(['ok' => true]);
