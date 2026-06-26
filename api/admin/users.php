<?php
/**
 * Admin user management endpoint.
 *
 * GET    /api/admin/users.php           — list all admins + current user id
 * POST   /api/admin/users.php           — create new admin { username, password }
 * PATCH  /api/admin/users.php           — update own credentials { current_password, new_username?, new_password? }
 * DELETE /api/admin/users.php?id=<int>  — delete an admin (not self, not last)
 *
 * @package TLevelQuiz\API\Admin
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth.php';

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt  = $pdo->query("SELECT id, username FROM admin_users ORDER BY id");
    $users = $stmt->fetchAll();
    jsonResponse(['current_id' => (int) $_SESSION['admin_id'], 'users' => $users]);
}

if ($method === 'POST') {
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if ($username === '' || strlen($password) < 6) {
        jsonResponse(['error' => 'Username and password (min 6 characters) are required'], 400);
    }

    $check = $pdo->prepare("SELECT id FROM admin_users WHERE username = ?");
    $check->execute([$username]);
    if ($check->fetch()) {
        jsonResponse(['error' => 'Username already exists'], 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)");
    $stmt->execute([$username, $hash]);

    jsonResponse(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
}

if ($method === 'PATCH') {
    $body            = json_decode(file_get_contents('php://input'), true) ?? [];
    $currentPassword = $body['current_password'] ?? '';
    $newUsername     = trim($body['new_username'] ?? '');
    $newPassword     = $body['new_password'] ?? '';

    $stmt = $pdo->prepare("SELECT password_hash FROM admin_users WHERE id = ?");
    $stmt->execute([$_SESSION['admin_id']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        jsonResponse(['error' => 'Current password is incorrect'], 403);
    }

    if ($newUsername !== '') {
        $check = $pdo->prepare("SELECT id FROM admin_users WHERE username = ? AND id != ?");
        $check->execute([$newUsername, $_SESSION['admin_id']]);
        if ($check->fetch()) {
            jsonResponse(['error' => 'That username is already taken'], 409);
        }
        $pdo->prepare("UPDATE admin_users SET username = ? WHERE id = ?")
            ->execute([$newUsername, $_SESSION['admin_id']]);
        $_SESSION['admin_username'] = $newUsername;
    }

    if ($newPassword !== '') {
        if (strlen($newPassword) < 6) {
            jsonResponse(['error' => 'New password must be at least 6 characters'], 400);
        }
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $pdo->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?")
            ->execute([$hash, $_SESSION['admin_id']]);
    }

    jsonResponse(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);

    if ($id <= 0) {
        jsonResponse(['error' => 'Invalid id'], 400);
    }
    if ($id === (int) $_SESSION['admin_id']) {
        jsonResponse(['error' => 'You cannot delete your own account'], 400);
    }

    $count = (int) $pdo->query("SELECT COUNT(*) FROM admin_users")->fetchColumn();
    if ($count <= 1) {
        jsonResponse(['error' => 'Cannot delete the last admin account'], 400);
    }

    $pdo->prepare("DELETE FROM admin_users WHERE id = ?")->execute([$id]);
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
